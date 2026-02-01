const express = require('express');
const multer = require('multer');
const path = require('path');
const PhotoLog = require('../models/PhotoLog');

const router = express.Router();

// Save uploads to ./uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: function (req, file, cb) {
    const ts = Date.now();
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${ts}_${safe}`);
  }
});

const upload = multer({ storage });

// POST /upload-photo - accepts single image file (field 'photo')
router.post('/upload-photo', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    const newLog = new PhotoLog({
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      deviceId: req.body.deviceId || 'unknown',
      meta: req.body.meta ? JSON.parse(req.body.meta) : {}
    });

    await newLog.save();

    // Keep it simple: return filename and path relative to server
    res.json({ success: true, filename: req.file.filename, path: `/uploads/${req.file.filename}` });
  } catch (err) {
    console.error('[photos] Upload error', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// GET /get-photos - list recent photos
router.get('/get-photos', async (req, res) => {
  try {
    const list = await PhotoLog.find().sort({ uploadedAt: -1 }).limit(50);
    res.json({ success: true, photos: list });
  } catch (err) {
    console.error('[photos] List error', err);
    res.status(500).json({ error: 'Failed to list photos' });
  }
});

module.exports = router;
