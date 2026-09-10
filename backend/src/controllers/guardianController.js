const Guardian = require('../models/Guardian');
const twilio = require('twilio');
const { sendGuardianEmail } = require('../services/emailService');

const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

const toE164IndianNumber = (phoneNumber) => {
  const digits = String(phoneNumber || '').replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return phoneNumber;
};

const sendSMS = async (to, body) => {
  if (!twilioClient) {
    console.error('[SMS] Twilio is not configured; message was not sent.');
    return { success: false, error: 'SMS provider is not configured' };
  }
  try {
    await twilioClient.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: toE164IndianNumber(to)
    });
    return { success: true };
  } catch (e) {
    console.error('SMS error:', e.message);
    return { success: false, error: e.message };
  }
};

const getGuardians = async (req, res) => {
  try {
    const activeGuardians = await Guardian.find({ userId: req.userId, isActive: true }).sort({ addedAt: -1 });

    return res.status(200).json({
      success: true,
      guardians: activeGuardians,
      verified: activeGuardians.filter(g => g.isVerified),
      pending: activeGuardians.filter(g => !g.isVerified),
      total: activeGuardians.length
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const addGuardian = async (req, res) => {
  try {
    const guardiansCount = await Guardian.countDocuments({ userId: req.userId, isActive: true });

    if (req.user.plan === 'free' && guardiansCount >= 3) {
      return res.status(400).json({
        success: false,
        message: "Free plan allows maximum 3 guardians. Upgrade to Premium for unlimited guardians."
      });
    }

    const { guardianName, guardianPhone, guardianEmail, relation } = req.body;

    if (!guardianName || !guardianPhone || !guardianEmail || !relation) {
      return res.status(400).json({ success: false, message: "Please provide all required fields" });
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(guardianPhone)) {
      return res.status(400).json({ success: false, message: "Please provide a valid 10-digit Indian mobile number" });
    }

    if (!/^\S+@\S+\.\S+$/.test(guardianEmail)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid guardian email address' });
    }

    const duplicateGuardian = await Guardian.findOne({ userId: req.userId, guardianPhone, isActive: true });
    if (duplicateGuardian) {
      return res.status(409).json({ success: false, message: "This number is already in your network" });
    }

    const guardian = new Guardian({
      userId: req.userId,
      guardianName,
      guardianPhone,
      guardianEmail,
      relation,
      isVerified: true,
      acceptedAt: new Date()
    });

    await guardian.save();

    const smsBody = `Hi ${guardianName}! ${req.user.name} has added you as a safety guardian on Safe-Era. You will receive emergency alerts if they trigger SOS.`;

    const smsResult = await sendSMS(guardianPhone, smsBody);
    const emailResult = await sendGuardianEmail({
      to: guardianEmail,
      subject: `You are now ${req.user.name}'s Safe-Era guardian`,
      text: `Hi ${guardianName},\n\n${req.user.name} added you as a safety guardian on Safe-Era. You will receive emergency alerts when they trigger SOS.`
    });

    return res.status(201).json({
      success: true,
      message: smsResult.success ? "Guardian added and activated." : "Guardian added and activated, but the notification SMS could not be sent.",
      guardian,
      smsSent: smsResult.success,
      emailSent: emailResult.success,
      smsError: smsResult.success ? undefined : smsResult.error
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateGuardian = async (req, res) => {
  try {
    const { guardianName, relation, notes, guardianPhone, guardianEmail } = req.body;

    if (guardianPhone) {
      return res.status(400).json({ success: false, message: "To change guardian's phone, remove and re-add them." });
    }

    const guardian = await Guardian.findOne({ _id: req.params.id, userId: req.userId });
    if (!guardian) {
      return res.status(404).json({ success: false, message: "Guardian not found" });
    }

    if (guardianName !== undefined) guardian.guardianName = guardianName;
    if (guardianEmail !== undefined) {
      if (!/^\S+@\S+\.\S+$/.test(guardianEmail)) return res.status(400).json({ success: false, message: 'Please provide a valid guardian email address' });
      guardian.guardianEmail = guardianEmail;
    }
    if (relation !== undefined) guardian.relation = relation;
    if (notes !== undefined) guardian.notes = notes;

    await guardian.save();

    return res.status(200).json({ success: true, message: "Guardian updated successfully", guardian });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const sendTestAlert = async (req, res) => {
  try {
    const guardian = await Guardian.findOne({ _id: req.params.id, userId: req.userId });

    if (!guardian) {
      return res.status(404).json({ success: false, message: "Guardian not found" });
    }

    if (guardian.lastAlertedAt) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (guardian.lastAlertedAt > oneHourAgo) {
        return res.status(429).json({ success: false, message: "Test alert already sent recently" });
      }
    }

    const smsBody = `TEST ALERT from Safe-Era\n\nThis is a test from ${req.user.name}. If you receive this, you are set up to receive real emergency alerts.\n\nNo action needed.`;
    const smsResult = await sendSMS(guardian.guardianPhone, smsBody);
    const emailResult = await sendGuardianEmail({
      to: guardian.guardianEmail,
      subject: 'Safe-Era test alert',
      text: `This is a test from ${req.user.name}. You are set up to receive real Safe-Era emergency alerts. No action is needed.`
    });

    if (!smsResult.success && !emailResult.success) {
      return res.status(502).json({ success: false, message: 'Test alert could not be sent by SMS or email.' });
    }

    guardian.lastAlertedAt = new Date();
    await guardian.save();

    return res.status(200).json({ success: true, message: `Test alert sent to ${guardian.guardianName}`, smsSent: smsResult.success, emailSent: emailResult.success });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const removeGuardian = async (req, res) => {
  try {
    const guardian = await Guardian.findById(req.params.id);
    if (!guardian) {
      return res.status(404).json({ success: false, message: "Guardian not found" });
    }

    if (guardian.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this guardian" });
    }

    guardian.isActive = false;
    await guardian.save();

    return res.status(200).json({ success: true, message: "Guardian removed from your network" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getGuardians,
  addGuardian,
  updateGuardian,
  removeGuardian,
  sendTestAlert
};
