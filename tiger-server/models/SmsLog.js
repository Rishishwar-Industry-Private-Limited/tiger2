const mongoose = require('../db');
const { Schema } = mongoose;

const smsLogSchema = new Schema({
  device: { type: String, default: 'Tiger-Mobile' },
  deviceId: { type: String, default: 'unknown', index: true },
  sender: { type: String, default: 'Unknown' },
  message: { type: String, default: 'No Content' },
  time: { type: Date, default: () => new Date() },
  location: { type: String, default: 'Disabled' },
  meta: { type: Schema.Types.Mixed, default: {} }
});

module.exports = mongoose.model('SmsLog', smsLogSchema);