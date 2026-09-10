"""Safe-Era Human Activity Recognition (HAR) inference service.

This service is deliberately independent from the Node/MongoDB API. If it is
stopped, the mobile client receives a temporary-unavailable response and keeps
using its local DeviceMotion threat detector.

The service expects an ONNX model trained for a six-axis smartphone IMU window:
accelerometer x/y/z + gyroscope x/y/z. It does not store sensor windows.
"""

from __future__ import annotations

import os
import secrets
from pathlib import Path
from typing import List

import numpy as np
import onnxruntime as ort
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

MODEL_PATH = Path(os.getenv("HAR_MODEL_PATH", "models/har_model.onnx"))
WINDOW_SIZE = int(os.getenv("HAR_WINDOW_SIZE", "128"))
SERVICE_KEY = os.getenv("HAR_SERVICE_SHARED_SECRET", "")
LABELS = [label.strip().lower() for label in os.getenv(
    "HAR_CLASS_LABELS",
    "standing,sitting,walking,running,fall,abnormal"
).split(",") if label.strip()]

app = FastAPI(title="Safe-Era HAR service", version="1.0.0")
session: ort.InferenceSession | None = None


class SensorSample(BaseModel):
    timestamp: float | None = None
    ax: float
    ay: float
    az: float
    gx: float
    gy: float
    gz: float


class PredictionRequest(BaseModel):
    samples: List[SensorSample] = Field(min_length=20, max_length=600)


def load_model() -> ort.InferenceSession:
    if not MODEL_PATH.exists():
        raise RuntimeError(
            f"HAR model is missing at {MODEL_PATH}. Configure HAR_MODEL_PATH with a trained six-axis ONNX HAR model."
        )
    return ort.InferenceSession(str(MODEL_PATH), providers=["CPUExecutionProvider"])


@app.on_event("startup")
def startup() -> None:
    global session
    try:
        session = load_model()
        print(f"[HAR] Loaded model: {MODEL_PATH}")
    except Exception as error:  # Service remains healthy enough to report configuration errors.
        session = None
        print(f"[HAR] Model unavailable: {error}")


def require_service_key(x_har_service_key: str | None) -> None:
    if SERVICE_KEY and not secrets.compare_digest(x_har_service_key or "", SERVICE_KEY):
        raise HTTPException(status_code=401, detail="Invalid HAR service key")


def resample_window(samples: List[SensorSample]) -> np.ndarray:
    """Linearly resample variable-rate browser samples to one model window."""
    values = np.asarray(
        [[sample.ax, sample.ay, sample.az, sample.gx, sample.gy, sample.gz] for sample in samples],
        dtype=np.float32,
    )
    source_index = np.linspace(0, len(values) - 1, num=len(values))
    target_index = np.linspace(0, len(values) - 1, num=WINDOW_SIZE)
    resampled = np.stack(
        [np.interp(target_index, source_index, values[:, channel]) for channel in range(values.shape[1])],
        axis=1,
    ).astype(np.float32)

    # Per-window standardisation prevents phone orientation/scale from
    # dominating the model input. Production models may need their own scaler;
    # use the same scaler during training and inference.
    mean = resampled.mean(axis=0, keepdims=True)
    std = resampled.std(axis=0, keepdims=True)
    return (resampled - mean) / np.maximum(std, 1e-6)


def to_model_input(window: np.ndarray, input_shape: List[int | str | None]) -> np.ndarray:
    """Adapt standard [time, six-axis] data to common ONNX HAR input layouts."""
    if len(input_shape) == 3:
        # [batch, time, channels] or [batch, channels, time]
        if input_shape[1] == 6:
            return window.T[None, :, :]
        return window[None, :, :]
    if len(input_shape) == 4:
        # [batch, time, channels, singleton], used by several small CNN HAR models
        return window[None, :, :, None]
    raise ValueError(f"Unsupported HAR model input shape: {input_shape}")


def softmax(scores: np.ndarray) -> np.ndarray:
    shifted = scores - np.max(scores)
    values = np.exp(shifted)
    return values / np.sum(values)


@app.get("/health")
def health() -> dict:
    return {"status": "ready" if session else "model_unavailable", "modelPath": str(MODEL_PATH)}


@app.post("/predict")
def predict(request: PredictionRequest, x_har_service_key: str | None = Header(default=None)) -> dict:
    require_service_key(x_har_service_key)
    if not session:
        raise HTTPException(status_code=503, detail="HAR model is not available. Local movement monitoring should be used.")

    try:
        model_input = session.get_inputs()[0]
        window = resample_window(request.samples)
        tensor = to_model_input(window, model_input.shape)
        raw = np.asarray(session.run(None, {model_input.name: tensor})[0]).squeeze()
        probabilities = raw if np.isclose(np.sum(raw), 1, atol=1e-3) and np.all(raw >= 0) else softmax(raw)
        label_index = int(np.argmax(probabilities))
        activity = LABELS[label_index] if label_index < len(LABELS) else f"class_{label_index}"
        confidence = float(probabilities[label_index])
        abnormal = activity in {"running", "fall", "abnormal", "jogging"}
        ai_movement_score = round(min(100, confidence * 100 * (1 if abnormal else 0.15)))
        return {
            "activity": activity,
            "confidence": confidence,
            "abnormal": abnormal,
            "aiMovementScore": ai_movement_score,
        }
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=422, detail=f"Unable to analyse HAR window: {error}") from error
