const HF_ROUTER_URL = 'https://router.huggingface.co/hf-inference/models';
const MAX_AUDIO_BYTES = 4 * 1024 * 1024;
const HF_TIMEOUT_MS = 25_000;
const HAR_TIMEOUT_MS = 8_000;

const clampScore = (value) => Math.max(0, Math.min(100, Math.round(Number(value) || 0)));

const getHfToken = () => process.env.HF_API_TOKEN || process.env.HF_TOKEN;

const readJson = async (response) => {
  const raw = await response.text();
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return { raw };
  }
};

const postToHuggingFace = async (model, payload) => {
  const token = getHfToken();
  if (!token) {
    const error = new Error('Online voice AI is not configured on this server.');
    error.statusCode = 503;
    throw error;
  }

  const response = await fetch(`${HF_ROUTER_URL}/${encodeURIComponent(model)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(HF_TIMEOUT_MS)
  });

  const data = await readJson(response);
  if (!response.ok) {
    const error = new Error(data.error || data.message || 'Hugging Face inference is unavailable.');
    error.statusCode = response.status >= 500 ? 503 : response.status;
    throw error;
  }
  return data;
};

const calculateDistressScore = (transcript, classifications) => {
  const emotionWeights = {
    fear: 1,
    anger: 0.72,
    sadness: 0.56,
    disgust: 0.36,
    surprise: 0.24,
    neutral: 0,
    joy: 0,
    love: 0,
    optimism: 0
  };

  const labels = Array.isArray(classifications?.[0]) ? classifications[0] : classifications;
  const emotionScore = Array.isArray(labels)
    ? labels.reduce((highest, item) => {
      const weight = emotionWeights[String(item?.label || '').toLowerCase()] || 0;
      return Math.max(highest, Number(item?.score || 0) * weight);
    }, 0)
    : 0;

  // ASR can miss emotional tone, so explicit distress wording is treated as a
  // high-confidence safety signal. This does not create an SOS by itself.
  const normalizedTranscript = String(transcript || '').toLowerCase();
  const distressWords = /\b(help|save me|leave me alone|stop|emergency|danger|attack|kidnap|police|please help)\b/;
  const lexicalScore = distressWords.test(normalizedTranscript) ? 0.92 : 0;
  return clampScore(Math.max(emotionScore, lexicalScore) * 100);
};

const analyseVoice = async (req, res) => {
  try {
    const audioBase64 = String(req.body?.audioBase64 || '').replace(/^data:[^;]+;base64,/, '');
    const mimeType = String(req.body?.mimeType || 'audio/webm');

    if (!audioBase64 || !/^[A-Za-z0-9+/=]+$/.test(audioBase64)) {
      return res.status(400).json({ success: false, message: 'A valid base64 audio clip is required.' });
    }

    const audioBytes = Buffer.from(audioBase64, 'base64');
    if (!audioBytes.length || audioBytes.length > MAX_AUDIO_BYTES) {
      return res.status(413).json({ success: false, message: 'Audio clip must be between 1 byte and 4 MB.' });
    }

    const asrModel = process.env.HF_ASR_MODEL || 'openai/whisper-large-v3';
    const classifierModel = process.env.HF_TEXT_CLASSIFIER_MODEL || 'j-hartmann/emotion-english-distilroberta-base';

    // Audio is forwarded in-memory to ASR and intentionally never saved to disk
    // or MongoDB by this application.
    const asr = await postToHuggingFace(asrModel, {
      inputs: audioBase64,
      parameters: { return_timestamps: false }
    });
    const transcript = String(asr?.text || '').trim();

    if (!transcript) {
      return res.status(200).json({
        success: true,
        available: true,
        transcript: '',
        aiDistressScore: 0,
        source: 'hf_asr_text_classifier'
      });
    }

    const classifications = await postToHuggingFace(classifierModel, { inputs: transcript });
    const aiDistressScore = calculateDistressScore(transcript, classifications);

    return res.status(200).json({
      success: true,
      available: true,
      transcript: transcript.slice(0, 500),
      aiDistressScore,
      source: 'hf_asr_text_classifier'
    });
  } catch (error) {
    console.warn('[THREAT AI] Voice backup unavailable:', error.message);
    return res.status(error.statusCode || 503).json({
      success: false,
      available: false,
      message: error.message || 'Online voice AI is unavailable. Local monitoring remains active.'
    });
  }
};

const analyseMovement = async (req, res) => {
  try {
    const samples = Array.isArray(req.body?.samples) ? req.body.samples : [];
    if (samples.length < 20 || samples.length > 600) {
      return res.status(400).json({ success: false, message: 'Movement analysis requires 20 to 600 sensor samples.' });
    }

    const requiredKeys = ['ax', 'ay', 'az', 'gx', 'gy', 'gz'];
    const valid = samples.every((sample) => requiredKeys.every((key) => Number.isFinite(Number(sample?.[key]))));
    if (!valid) {
      return res.status(400).json({ success: false, message: 'Sensor samples must contain numeric accelerometer and gyroscope values.' });
    }

    const harUrl = process.env.HAR_SERVICE_URL;
    if (!harUrl) {
      return res.status(503).json({
        success: false,
        available: false,
        message: 'Online movement AI is not configured. Local movement monitoring remains active.'
      });
    }

    const response = await fetch(`${harUrl.replace(/\/$/, '')}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.HAR_SERVICE_SHARED_SECRET ? { 'X-HAR-Service-Key': process.env.HAR_SERVICE_SHARED_SECRET } : {})
      },
      body: JSON.stringify({ samples }),
      signal: AbortSignal.timeout(HAR_TIMEOUT_MS)
    });
    const data = await readJson(response);

    if (!response.ok) {
      const error = new Error(data.detail || data.message || 'HAR service is unavailable.');
      error.statusCode = response.status >= 500 ? 503 : response.status;
      throw error;
    }

    return res.status(200).json({
      success: true,
      available: true,
      activity: String(data.activity || 'unknown'),
      confidence: Math.max(0, Math.min(1, Number(data.confidence) || 0)),
      abnormal: Boolean(data.abnormal),
      aiMovementScore: clampScore(data.aiMovementScore),
      source: 'har_service'
    });
  } catch (error) {
    console.warn('[THREAT AI] Movement backup unavailable:', error.message);
    return res.status(error.statusCode || 503).json({
      success: false,
      available: false,
      message: error.message || 'Online movement AI is unavailable. Local monitoring remains active.'
    });
  }
};

module.exports = { analyseVoice, analyseMovement };
