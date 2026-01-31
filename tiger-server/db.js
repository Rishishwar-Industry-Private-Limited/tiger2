require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tiger2';

if (!MONGO_URI) {
  console.error('MONGO_URI is not set in .env');
  process.exit(1);
}

mongoose.connect(MONGO_URI).catch(err => console.error('Mongo connect error:', err));

mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connected');
});
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

module.exports = mongoose;