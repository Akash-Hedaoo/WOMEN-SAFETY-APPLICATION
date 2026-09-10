const mongoose = require("mongoose");

const newsArticleSchema = new mongoose.Schema({
  articleUrl: { type: String, required: true, unique: true, trim: true },
  title: { type: String, required: true, trim: true },
  source: { type: String, required: true, trim: true },
  publishedAt: { type: Date, default: null },
  riskLevel: { type: String, required: true, enum: ["high", "medium", "low"] },
  riskLabel: { type: String, required: true },
  locationName: {
    type: String,
    default: null,
    index: true,
  },
  location: {
    type: { type: String, enum: ["Point"], default: undefined },
    coordinates: { type: [Number], default: undefined },
  },
  hasMapLocation: { type: Boolean, default: false, index: true },
  locationStatus: {
    type: String,
    enum: ['resolved', 'not_reported'],
    default: 'not_reported',
    index: true
  },
  firstSeenAt: { type: Date, default: Date.now },
  lastSeenAt: { type: Date, default: Date.now },
});

newsArticleSchema.index({ location: "2dsphere" }, { sparse: true });
newsArticleSchema.index({ hasMapLocation: 1, publishedAt: -1 });

module.exports = mongoose.model("NewsArticle", newsArticleSchema);
