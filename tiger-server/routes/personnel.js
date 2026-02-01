const express = require('express');
const router = express.Router();
const Personnel = require('../models/Personnel');
const { requireAuth } = require('../middleware/auth');

let inMemoryPersonnel = [];
router.getInMemory = () => inMemoryPersonnel;

// GET /personnel -> list all personnel (admin only)
router.get('/', requireAuth, async (req, res) => {
  try {
    let list = [];
    try {
      list = await Personnel.find().sort({ createdAt: -1 }).lean();
    } catch (dbErr) {
      console.warn('[personnel] DB query failed, returning in-memory:', dbErr.message);
      list = inMemoryPersonnel.slice(0);
    }
    res.json(list);
  } catch (err) {
    console.error('[personnel] list error:', err);
    res.status(500).json([]);
  }
});

// POST /personnel -> create new personnel (admin only)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { fullName, badgeId, assignedRank, role = 'officer', password } = req.body;
    if (!fullName || !badgeId || !assignedRank) return res.status(400).json({ error: 'missing_fields' });

    // Create new personnel
    const p = new Personnel({ fullName, badgeId, assignedRank, role });
    if (password) await p.setPassword(password);
    try {
      await p.save();
      return res.json(p);
    } catch (dbErr) {
      console.warn('[personnel] DB save failed, using in-memory fallback:', dbErr.message);
      const mem = { _id: Date.now().toString(), fullName: p.fullName, badgeId: p.badgeId, assignedRank: p.assignedRank, role: p.role, status: p.status, createdAt: p.createdAt };
      inMemoryPersonnel.unshift(mem);
      if (inMemoryPersonnel.length > 500) inMemoryPersonnel.pop();
      return res.json(mem);
    }
  } catch (err) {
    console.error('[personnel] create error:', err);
    res.status(500).json({ error: 'server' });
  }
});

// POST /personnel/:id/verify -> mark verified (admin only)
router.post('/:id/verify', requireAuth, async (req, res) => {
  try {
    try {
      const p = await Personnel.findById(req.params.id);
      if (!p) return res.status(404).json({ error: 'not_found' });
      p.status = 'verified';
      await p.save();
      return res.json({ success: true });
    } catch (dbErr) {
      console.warn('[personnel] DB update failed, falling back to in-memory:', dbErr.message);
      const idx = inMemoryPersonnel.findIndex(x=>x._id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'not_found' });
      inMemoryPersonnel[idx].status = 'verified';
      return res.json({ success: true });
    }
  } catch (err) {
    console.error('[personnel] verify error:', err);
    res.status(500).json({ error: 'server' });
  }
});

// POST /personnel/:id/deny -> mark denied (admin only)
router.post('/:id/deny', requireAuth, async (req, res) => {
  try {
    try {
      const p = await Personnel.findById(req.params.id);
      if (!p) return res.status(404).json({ error: 'not_found' });
      p.status = 'denied';
      await p.save();
      return res.json({ success: true });
    } catch (dbErr) {
      console.warn('[personnel] DB update failed, falling back to in-memory:', dbErr.message);
      const idx = inMemoryPersonnel.findIndex(x=>x._id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'not_found' });
      inMemoryPersonnel[idx].status = 'denied';
      return res.json({ success: true });
    }
  } catch (err) {
    console.error('[personnel] deny error:', err);
    res.status(500).json({ error: 'server' });
  }
});

module.exports = router;
