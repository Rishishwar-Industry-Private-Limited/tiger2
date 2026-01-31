const express = require('express');
const router = express.Router();
const User = require('../models/User');

// GET /users -> list users
router.get('/', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean();
    res.json(users);
  } catch (err) {
    console.error('[users] list error:', err);
    res.status(500).json([]);
  }
});

// POST /users -> create or update by deviceId
router.post('/', async (req, res) => {
  try {
    const { deviceId, telegramBotToken, telegramChatId } = req.body;
    if (!deviceId) return res.status(400).json({ error: 'deviceId required' });

    const user = await User.findOneAndUpdate({ deviceId }, { telegramBotToken: telegramBotToken || null, telegramChatId: telegramChatId || null }, { upsert: true, new: true, setDefaultsOnInsert: true });
    res.json(user);
  } catch (err) {
    console.error('[users] create/update error:', err);
    res.status(500).json({ error: 'server' });
  }
});

// GET /users/:deviceId
router.get('/:deviceId', async (req, res) => {
  try {
    const user = await User.findOne({ deviceId: req.params.deviceId }).lean();
    res.json(user || {});
  } catch (err) {
    console.error('[users] get error:', err);
    res.status(500).json({});
  }
});

module.exports = router;