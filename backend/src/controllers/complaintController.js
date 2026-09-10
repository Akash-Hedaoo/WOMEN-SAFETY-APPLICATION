const crypto = require('crypto');
const Complaint = require('../models/Complaint');
const { getIO } = require('../config/socket');

const submitComplaint = async (req, res) => {
  try {
    if (req.user?.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Admin accounts cannot submit anonymous complaints.' });
    }

    const complaint = await Complaint.create({
      category: req.body.category || 'other',
      message: req.body.message
    });

    getIO().to('iccc_room').emit('complaint-submitted', { complaint });
    return res.status(201).json({
      success: true,
      complaint: { _id: complaint._id, status: complaint.status, createdAt: complaint.createdAt },
      message: 'Anonymous complaint submitted to the ICCC review queue.'
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message || 'Unable to submit complaint.' });
  }
};

const getComplaints = async (_req, res) => {
  try {
    const complaints = await Complaint.find().sort({ createdAt: -1 }).limit(100);
    return res.status(200).json({ success: true, complaints });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const reviewComplaint = async (req, res) => {
  try {
    const { status, reviewNote } = req.body;
    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be verified or rejected.' });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });

    complaint.status = status;
    complaint.reviewNote = reviewNote || '';
    complaint.reviewedAt = new Date();
    await complaint.save();
    getIO().to('iccc_room').emit('complaint-updated', { complaint });
    return res.status(200).json({ success: true, complaint });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const sendToGovernmentDemo = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });
    if (complaint.status !== 'verified') {
      return res.status(400).json({ success: false, message: 'Verify the complaint before forwarding it.' });
    }

    complaint.status = 'forwarded';
    complaint.forwardedAt = new Date();
    complaint.governmentDelivery = 'demo_queued';
    complaint.governmentReference = `DEMO-GOV-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    await complaint.save();
    getIO().to('iccc_room').emit('complaint-updated', { complaint });

    return res.status(200).json({
      success: true,
      complaint,
      message: 'Demo government-service forwarding recorded. No external authority was contacted.'
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { submitComplaint, getComplaints, reviewComplaint, sendToGovernmentDemo };
