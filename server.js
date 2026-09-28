// Runs the form on your own server: `npm start`. (On Netlify, netlify/functions/submit.mts is used instead.)
require('dotenv').config({ quiet: true });
const express = require('express');
const multer = require('multer');
const path = require('path');
const { handleSubmission, MAX_PHOTO } = require('./submit');

const PORT = process.env.PORT || 3000;
const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_PHOTO, fields: 200 } });

app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/submit', upload.single('photo'), async (req, res) => {
  // Keep the raw field names ("education[0][2]") rather than multer's nested arrays.
  const flat = {};
  for (const [k, v] of Object.entries(req.body || {})) {
    if (Array.isArray(v)) v.forEach((row, i) => (row || []).forEach((cell, j) => { flat[`${k}[${i}][${j}]`] = cell; }));
    else flat[k] = v;
  }
  const { status, body } = await handleSubmission({
    get: (name) => flat[name],
    photo: req.file ? { buffer: req.file.buffer, mimetype: req.file.mimetype } : null,
    env: process.env,
    saveDir: path.join(__dirname, 'submissions'),
  });
  res.status(status).json(body);
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'Photo must be 2 MB or smaller.' : err.message });
  }
  next(err);
});

app.listen(PORT, () => {
  console.log(`Interview form running at http://localhost:${PORT}`);
  const e = process.env;
  if (!(e.HR_EMAIL && e.SMTP_HOST && e.SMTP_USER && e.SMTP_PASS)) {
    console.log('Email not configured: PDFs will be saved to ./submissions instead.');
  }
});
