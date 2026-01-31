const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const SmsLog = require('../models/SmsLog');
const logsRouter = require('./logs');

// POST /evidence -> generate a PDF of logs for a device or specific ids
// Body: { deviceId?: string, ids?: [id1, id2], limit?: number }
const { requireAuth } = require('../middleware/auth');
router.post('/evidence', requireAuth, async (req, res) => {
  try {
    const { deviceId, ids = [], limit = 200 } = req.body || {};

    let logs = [];
    try {
      if (ids && ids.length) {
        logs = await SmsLog.find({ _id: { $in: ids } }).sort({ time: -1 }).lean();
      } else if (deviceId) {
        logs = await SmsLog.find({ deviceId }).sort({ time: -1 }).limit(limit).lean();
      } else {
        logs = await SmsLog.find({}).sort({ time: -1 }).limit(limit).lean();
      }
    } catch (dbErr) {
      console.warn('[evidence] DB query failed, trying in-memory fallback:', dbErr.message);
      // Fallback to in-memory logs if available on logs router
      if (logsRouter && typeof logsRouter.getInMemoryLogs === 'function') {
        const mem = logsRouter.getInMemoryLogs() || [];
        if (ids && ids.length) {
          const idsStr = ids.map(String);
          logs = mem.filter(l => idsStr.includes(String(l._id)));
        } else if (deviceId) {
          logs = mem.filter(l => l.deviceId === deviceId).slice(0, limit);
        } else {
          logs = mem.slice(0, limit);
        }
      } else {
        return res.status(503).json({ error: 'No DB and no in-memory logs available' });
      }
    }

    // Stream PDF back to client
    const filename = `tiger_evidence_${deviceId || 'logs'}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    doc.fontSize(20).text('Tiger Evidence Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`);
    if (deviceId) doc.text(`Device: ${deviceId}`);
    doc.moveDown();

    if (!logs || logs.length === 0) {
      doc.fontSize(12).text('No logs found for the requested query.');
      doc.end();
      return;
    }

    logs.forEach((l, idx) => {
      doc.fontSize(12).fillColor('#222').text(`#${idx + 1} — ${l.time ? new Date(l.time).toLocaleString() : ''}`, { underline: true });
      doc.moveDown(0.2);
      doc.fontSize(10).text(`Device: ${l.device || ''}`);
      doc.text(`Device ID: ${l.deviceId || ''}`);
      doc.text(`Sender: ${l.sender || ''}`);
      doc.moveDown(0.2);
      doc.font('Helvetica').fontSize(10).text('Message:');
      doc.font('Helvetica-Oblique').fontSize(10).text(l.message || '', { indent: 10, align: 'left' });
      if (l.location && l.location !== 'Disabled') {
        doc.moveDown(0.2);
        doc.font('Helvetica').fontSize(10).fillColor('blue').text(`Map: https://www.google.com/maps?q=${l.location}`);
        doc.fillColor('#222');
      }
      doc.moveDown(0.5);
      // Light separator
      const y = doc.y;
      doc.moveTo(doc.page.margins.left, y).lineTo(doc.page.width - doc.page.margins.right, y).strokeOpacity(0.08).stroke();
      doc.moveDown();

      // Add page break every ~12 items to keep PDF readable
      if ((idx + 1) % 12 === 0) doc.addPage();
    });

    doc.end();
  } catch (err) {
    console.error('[evidence] generation error:', err);
    if (!res.headersSent) res.status(500).json({ error: 'Error generating PDF' });
  }
});

module.exports = router;
