const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongod = null;

module.exports = {
  async start() {
    mongod = await MongoMemoryServer.create();
    process.env.MONGO_URI = mongod.getUri();
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';
    process.env.ADMIN_SETUP_TOKEN = process.env.ADMIN_SETUP_TOKEN || 'test_setup_token';
    // Wait for mongoose to connect when server requires db.js
  },
  async stop() {
    try {
      await mongoose.disconnect();
      if (mongod) await mongod.stop();
    } catch (e) {
      // ignore
    }
  },
  async clear() {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
};