const express = require('express');
const axios = require('axios');
const path = require('path');
const cors = require('cors');
require('dotenv').config();
require('./db'); // MongoDB connection
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
const logsRouter = require('./routes/logs');
const usersRouter = require('./routes/users');
const evidenceRouter = require('./routes/evidence');
const statsRouter = require('./routes/stats');
const authRouter = require('./routes/auth');

// JWT secret check
if (!process.env.JWT_SECRET) console.warn('[server] WARNING: JWT_SECRET not set. Use a strong secret in production (process.env.JWT_SECRET).');

app.use('/', logsRouter);
app.use('/auth', authRouter);
app.use('/users', usersRouter);
app.use('/', evidenceRouter);
app.use('/stats', statsRouter);

// Telegram is handled per-user (User model stores telegramBotToken & telegramChatId). Do NOT use global hard-coded tokens here.

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Note: log-related routes are handled by routes/logs.js
// - POST /log-sms
// - GET /get-logs
// - POST /clear-logs
// - POST /trigger-ping
// These are registered via app.use('/', logsRouter);

// Keep backward-compatible root
app.get('/', (req, res) => res.json({ status: 'Tiger Server running' }));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 Tiger Server is Live on Port ${PORT}`);
});
