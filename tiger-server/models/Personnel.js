const mongoose = require('../db');
const { Schema } = mongoose;
const bcrypt = require('bcrypt');

const personnelSchema = new Schema({
  fullName: { type: String, trim: true, required: true },
  badgeId: { type: String, trim: true, required: true, unique: true },
  assignedRank: { type: String, trim: true, required: true },
  role: { type: String, enum: ['officer','constable'], default: 'officer' },
  passwordHash: { type: String, trim: true },
  status: { type: String, enum: ['pending','verified','denied'], default: 'pending' },
  createdAt: { type: Date, default: () => new Date() },
});

// Helper to set password
personnelSchema.methods.setPassword = async function(password) {
  this.passwordHash = await bcrypt.hash(password, 10);
};

module.exports = mongoose.model('Personnel', personnelSchema);
