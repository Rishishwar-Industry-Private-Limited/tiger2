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
const personnelRouter = require('./routes/personnel');
const photosRouter = require('./routes/photos');

// JWT secret check
if (!process.env.JWT_SECRET) console.warn('[server] WARNING: JWT_SECRET not set. Use a strong secret in production (process.env.JWT_SECRET).');
if (!process.env.ADMIN_SETUP_TOKEN) console.warn('[server] NOTE: ADMIN_SETUP_TOKEN not set. Use a one-time token to create the initial admin via POST /auth/create.');

app.use('/', logsRouter);
app.use('/auth', authRouter);
app.use('/users', usersRouter);
app.use('/personnel', personnelRouter);
app.use('/', evidenceRouter);
app.use('/stats', statsRouter);

// Photos upload & listing
app.use('/', photosRouter);

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

// Only start the server when run directly; this allows test runners to import the app without starting a listener
if (require.main === module) {
  if (process.env.NODE_ENV === 'development') {
    console.log('[server] Running in development mode with safe defaults.');
    console.log(`[server] JWT_SECRET=${process.env.JWT_SECRET ? 'SET' : 'EMPTY'} ADMIN_SETUP_TOKEN=${process.env.ADMIN_SETUP_TOKEN ? 'SET' : 'EMPTY'} MONGO_URI=${process.env.MONGO_URI || 'mongodb://localhost:27017/tiger2'}`);
  }
  app.listen(PORT, () => {
      console.log(`🚀 Tiger Server is Live on Port ${PORT}`);
  });
}

module.exports = app;
