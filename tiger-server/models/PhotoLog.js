const mongoose = require('mongoose');

const PhotoLogSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalName: { type: String },
  size: { type: Number },
  deviceId: { type: String },
  uploadedAt: { type: Date, default: Date.now },
  meta: { type: Object }
});

module.exports = mongoose.model('PhotoLog', PhotoLogSchema);
