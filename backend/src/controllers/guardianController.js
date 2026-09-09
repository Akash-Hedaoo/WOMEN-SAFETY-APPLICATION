const Guardian = require('../models/Guardian');
const twilio = require('twilio');

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
    const guardians = await Guardian.find({ userId: req.userId, isActive: true }).sort({ addedAt: -1 });

    const now = Date.now();
    const guardiansWithOTPStatus = guardians.map(g => {
      const gObj = g.toObject();
      gObj.isOTPExpired = !!(gObj.otpExpiry && gObj.otpExpiry < now);
      return gObj;
    });

    const verified = guardiansWithOTPStatus.filter(g => g.isVerified);
    const pending = guardiansWithOTPStatus.filter(g => !g.isVerified);

    return res.status(200).json({
      success: true,
      verified,
      pending,
      total: guardiansWithOTPStatus.length
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

    const { guardianName, guardianPhone, relation } = req.body;

    if (!guardianName || !guardianPhone || !relation) {
      return res.status(400).json({ success: false, message: "Please provide all required fields" });
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(guardianPhone)) {
      return res.status(400).json({ success: false, message: "Please provide a valid 10-digit Indian mobile number" });
    }

    const duplicateGuardian = await Guardian.findOne({ userId: req.userId, guardianPhone, isActive: true });
    if (duplicateGuardian) {
      return res.status(409).json({ success: false, message: "This number is already in your network" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    const guardian = new Guardian({
      userId: req.userId,
      guardianName,
      guardianPhone,
      relation,
      isVerified: false,
      verificationOTP: otp,
      otpExpiry
    });

    await guardian.save();

    const smsBody = `Hi ${guardianName}! ${req.user.name} has added you as a safety guardian on Safe-Era. Your verification code is: ${otp}. Reply with this code to ${req.user.name} to confirm. Valid for 15 minutes.`;

    const smsResult = await sendSMS(guardianPhone, smsBody);

    return res.status(201).json({
      success: true,
      message: smsResult.success
        ? "Guardian added. OTP sent to their number for verification."
        : "Guardian added, but the verification SMS could not be sent.",
      guardian,
      otpSent: smsResult.success,
      smsError: smsResult.success ? undefined : smsResult.error
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const verifyGuardian = async (req, res) => {
  try {
    const { guardianId, otp } = req.body;

    const guardian = await Guardian.findOne({ _id: guardianId, userId: req.userId });

    if (!guardian) {
      return res.status(404).json({ success: false, message: "Guardian not found" });
    }

    if (guardian.isVerified) {
      return res.status(400).json({ success: false, message: "Already verified" });
    }

    if (!guardian.otpExpiry || guardian.otpExpiry < Date.now()) {
      guardian.otpAttempts = 0;
      await guardian.save();
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    guardian.otpAttempts += 1;

    if (guardian.otpAttempts >= 5) {
      await guardian.save();
      return res.status(429).json({ success: false, message: "Too many attempts. Please resend OTP." });
    }

    if (guardian.verificationOTP !== otp) {
      await guardian.save();
      return res.status(400).json({ success: false, message: `Invalid OTP. Attempts remaining: ${5 - guardian.otpAttempts}` });
    }

    guardian.isVerified = true;
    guardian.acceptedAt = new Date();
    guardian.verificationOTP = null;
    guardian.otpExpiry = null;
    guardian.otpAttempts = 0;

    await guardian.save();

    const smsBody = `You are now a verified safety guardian for ${req.user.name} on Safe-Era. You will receive emergency alerts if ${req.user.name} triggers SOS.`;
    const smsResult = await sendSMS(guardian.guardianPhone, smsBody);

    return res.status(200).json({
      success: true,
      message: smsResult.success
        ? "Guardian verified successfully"
        : "Guardian verified, but the confirmation SMS could not be sent.",
      guardian,
      smsSent: smsResult.success
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const resendOTP = async (req, res) => {
  try {
    const { guardianId } = req.body;

    const guardian = await Guardian.findOne({ _id: guardianId, userId: req.userId });

    if (!guardian) {
      return res.status(404).json({ success: false, message: "Guardian not found" });
    }

    if (guardian.isVerified) {
      return res.status(400).json({ success: false, message: "Already verified" });
    }

    if (guardian.otpExpiry) {
      const tenMinsAgo = new Date(guardian.otpExpiry.getTime() - 10 * 60 * 1000);
      if (tenMinsAgo > new Date()) {
        return res.status(429).json({ success: false, message: "Please wait before requesting a new OTP" });
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000);

    guardian.verificationOTP = otp;
    guardian.otpExpiry = otpExpiry;
    guardian.otpAttempts = 0;

    await guardian.save();

    const smsBody = `Hi ${guardian.guardianName}! ${req.user.name} has added you as a safety guardian on Safe-Era. Your new verification code is: ${otp}. Reply with this code to ${req.user.name} to confirm. Valid for 15 minutes.`;
    const smsResult = await sendSMS(guardian.guardianPhone, smsBody);

    return res.status(200).json({
      success: smsResult.success,
      message: smsResult.success ? "New OTP sent to guardian's phone" : "Could not send the new OTP.",
      smsError: smsResult.success ? undefined : smsResult.error
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateGuardian = async (req, res) => {
  try {
    const { guardianName, relation, notes, guardianPhone } = req.body;

    if (guardianPhone) {
      return res.status(400).json({ success: false, message: "To change guardian's phone, remove and re-add them." });
    }

    const guardian = await Guardian.findOne({ _id: req.params.id, userId: req.userId });
    if (!guardian) {
      return res.status(404).json({ success: false, message: "Guardian not found" });
    }

    if (guardianName !== undefined) guardian.guardianName = guardianName;
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

    if (!guardian.isVerified) {
      return res.status(400).json({ success: false, message: "Guardian must be verified to receive test alerts" });
    }

    if (guardian.lastAlertedAt) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (guardian.lastAlertedAt > oneHourAgo) {
        return res.status(429).json({ success: false, message: "Test alert already sent recently" });
      }
    }

    const smsBody = `TEST ALERT from Safe-Era\n\nThis is a test from ${req.user.name}. If you receive this, you are set up to receive real emergency alerts.\n\nNo action needed.`;
    const smsResult = await sendSMS(guardian.guardianPhone, smsBody);

    if (!smsResult.success) {
      return res.status(502).json({ success: false, message: "Test alert could not be sent.", smsError: smsResult.error });
    }

    guardian.lastAlertedAt = new Date();
    await guardian.save();

    return res.status(200).json({ success: true, message: "Test alert sent to " + guardian.guardianName });
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
  verifyGuardian,
  resendOTP,
  updateGuardian,
  removeGuardian,
  sendTestAlert
};
