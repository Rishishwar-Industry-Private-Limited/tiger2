const express = require('express');
const router = express.Router();
const SmsLog = require('../models/SmsLog');
const logsRouter = require('./logs');
let crg = null;
try {
  crg = require('country-reverse-geocoding').country_reverse_geocoding();
} catch (e) {
  console.warn('[stats] country-reverse-geocoding not installed; country features disabled');
}

// GET /stats/countries -> returns array [{ country: 'India', code: 'IN', count: 12 }]
const { requireAuth } = require('../middleware/auth');
router.get('/countries', requireAuth, async (req, res) => {
  try {
    let logs = [];
    try {
      logs = await SmsLog.find({ 'location': { $exists: true, $ne: 'Disabled' } }).lean();
    } catch (dbErr) {
      console.warn('[stats] DB query failed, using in-memory logs:', dbErr.message);
      if (logsRouter && typeof logsRouter.getInMemoryLogs === 'function') {
        logs = logsRouter.getInMemoryLogs().filter(l => l.location && l.location !== 'Disabled');
      } else {
        return res.status(503).json({ error: 'No DB and no in-memory logs available' });
      }
    }

    if (!crg) return res.status(501).json({ error: 'Reverse geocoding not available on server' });

    const counts = {};
    for (const l of logs) {
      if (!l.location) continue;
      const parts = String(l.location).split(',').map(s => Number(s.trim()));
      if (parts.length !== 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) continue;
      const country = crg.get_country(parts[0], parts[1]);
      if (!country) continue;
      const key = country.code || country.name;
      if (!counts[key]) counts[key] = { country: country.name, code: country.code || country.name, count: 0 };
      counts[key].count += 1;
    }

    const arr = Object.values(counts).sort((a, b) => b.count - a.count);
    res.json(arr);
  } catch (err) {
    console.error('[stats] countries error:', err);
    res.status(500).json([]);
  }
});

module.exports = router;
