require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tiger2';

if (!MONGO_URI) {
  console.error('MONGO_URI is not set in .env');
  process.exit(1);
}

// In test environment we skip automatic mongoose.connect to avoid network calls
if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(MONGO_URI).catch(err => console.error('Mongo connect error:', err));

  mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB connected');
  });
  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err);
  });
} else {
  console.log('[db] Running in test mode - skipping DB connect');
}

module.exports = mongoose;