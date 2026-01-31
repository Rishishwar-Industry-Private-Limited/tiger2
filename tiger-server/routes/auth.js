const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const AdminUser = require('../models/AdminUser');

// POST /auth/login { username, password }
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });

    const user = await AdminUser.findOne({ username });
    if (!user) return res.status(401).json({ error: 'invalid_credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'invalid_credentials' });

    const token = jwt.sign({ id: user._id, username: user.username, role: user.role }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '12h' });
    return res.json({ token });
  } catch (err) {
    console.error('[auth] login error:', err);
    res.status(500).json({ error: 'server' });
  }
});

// POST /auth/create -> create initial admin (requires ADMIN_SETUP_TOKEN env)
router.post('/create', async (req, res) => {
  try {
    const setupToken = req.headers['x-admin-setup-token'] || req.body.setupToken;
    if (!process.env.ADMIN_SETUP_TOKEN || setupToken !== process.env.ADMIN_SETUP_TOKEN) {
      return res.status(403).json({ error: 'forbidden' });
    }
    const { username, password, role = 'admin' } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });

    const existing = await AdminUser.findOne({ username });
    if (existing) return res.status(409).json({ error: 'already_exists' });

    const hash = await bcrypt.hash(password, 10);
    const user = await AdminUser.create({ username, passwordHash: hash, role });
    res.json({ created: true, username: user.username });
  } catch (err) {
    console.error('[auth] create error:', err);
    res.status(500).json({ error: 'server' });
  }
});

// GET /auth/me -> validate token
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: 'unauthorized' });
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'unauthorized' });
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
      res.json({ ok: true, user: payload });
    } catch (err) {
      return res.status(401).json({ error: 'invalid_token' });
    }
  } catch (err) {
    console.error('[auth] me error:', err);
    res.status(500).json({ error: 'server' });
  }
});

module.exports = router;