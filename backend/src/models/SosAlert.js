const mongoose = require('mongoose');

const sosAlertSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  latitude: {
    type: Number,
    required: function () { return this.locationType !== 'unavailable'; }
  },
  longitude: {
    type: Number,
    required: function () { return this.locationType !== 'unavailable'; }
  },
  message: {
    type: String,
    default: ''
  },
  googleMapsLink: {
    type: String
  },
  status: {
    type: String,
    enum: ['active', 'resolved', 'cancelled'],
    default: 'active'
  },
  audioUrl: {
    type: String,
    default: null
  },
  resolved: {
    type: Boolean,
    default: false
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  cancelledAt: {
    type: Date,
    default: null
  },
  guardiansAlerted: {
    type: Number,
    default: 0
  },
  smsSentCount: {
    type: Number,
    default: 0
  },
  smsFailedCount: {
    type: Number,
    default: 0
  },
  triggerSource: {
    type: String,
    enum: ['manual_button', 'threat_detection', 'voice_trigger'],
    default: 'manual_button'
  },
  threatScore: {
    type: Number,
    default: 0
  },
  threatDetails: {
    motionScore: { type: Number, default: 0 },
    audioScore: { type: Number, default: 0 },
    gpsScore: { type: Number, default: 0 },
    triggerPhrase: { type: String, default: '' }
  },
  icccStatus: {
    type: String,
    enum: ['unassigned', 'responding', 'resolved'],
    default: 'unassigned'
  },
  icccOperatorNote: {
    type: String,
    default: ''
  },
  icccRespondedAt: {
    type: Date,
    default: null
  },
  // --- Capacitor / Offline SOS fields (all optional, backward-compatible) ---
  clientSosId: {
    type: String,
    default: null
  },
  otp: {
    type: String,
    default: null
  },
  locationType: {
    type: String,
    enum: ['current', 'last_known', 'unavailable'],
    default: 'current'
  },
  deliveryMethod: {
    type: String,
    enum: ['online', 'offline_sms', 'pending'],
    default: 'online'
  },
  deliveryStatus: {
    type: String,
    enum: ['sent', 'pending', 'failed'],
    default: 'sent'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('SosAlert', sosAlertSchema);
