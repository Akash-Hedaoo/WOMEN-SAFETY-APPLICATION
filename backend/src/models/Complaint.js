const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['harassment', 'unsafe_area', 'stalking', 'service_failure', 'other'],
    default: 'other'
  },
  message: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 2000
  },
  // Intentionally no userId, name, phone, or email: ICCC receives an anonymous report.
  status: {
    type: String,
    enum: ['submitted', 'verified', 'rejected', 'forwarded'],
    default: 'submitted'
  },
  reviewNote: { type: String, trim: true, maxlength: 1000, default: '' },
  reviewedAt: { type: Date, default: null },
  forwardedAt: { type: Date, default: null },
  governmentReference: { type: String, default: null },
  governmentDelivery: {
    type: String,
    enum: ['not_sent', 'demo_queued'],
    default: 'not_sent'
  }
}, { timestamps: true });

module.exports = mongoose.model('Complaint', complaintSchema);
