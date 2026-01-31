const mongoose = require('../db');
const { Schema } = mongoose;

const userSchema = new Schema({
  telegramBotToken: { type: String, trim: true, default: null },
  telegramChatId: { type: String, trim: true, default: null },
  deviceId: { type: String, trim: true, required: true, unique: true },
  createdAt: { type: Date, default: () => new Date() },
});

module.exports = mongoose.model('User', userSchema);