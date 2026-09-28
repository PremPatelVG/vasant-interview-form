// Shared submission logic used by both server.js (own server) and the Netlify function.
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const { buildPdf } = require('./pdf');

const TEXT_FIELDS = ['date', 'reference', 'name', 'position', 'mobile', 'email', 'dob', 'marital', 'medium',
  'reportsTo', 'teamSize', 'joiningTime', 'currentSalary', 'expectedSalary', 'currentDesignation',
  'expectedDesignation', 'careerGoals', 'improvements', 'strengths', 'signature'];
const TABLES = { education: [4, 4], family: [5, 4], experience: [5, 6], references: [3, 3] };
const PHOTO_TYPES = ['image/jpeg', 'image/png'];
const MAX_PHOTO = 2 * 1024 * 1024;

const clean = (v, max = 2000) => String(v || '').trim().slice(0, max);

let transporter;
function getTransporter(env) {
  if (!(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS && env.HR_EMAIL)) return null;
  transporter ??= nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT || 587),
    secure: Number(env.SMTP_PORT) === 465,
    // Google shows App Passwords in groups of four ("abcd efgh ..."); drop the spaces.
    auth: { user: env.SMTP_USER.trim(), pass: env.SMTP_PASS.replace(/\s+/g, '') },
    // Fail fast rather than hitting the hosting platform's 10-second limit.
    connectionTimeout: 7000,
    greetingTimeout: 5000,
    socketTimeout: 7000,
  });
  return transporter;
}

/**
 * @param get    (name) => string value of a form field; table cells are named like "education[0][2]"
 * @param photo  { buffer, mimetype } or null
 * @param env    settings: HR_EMAIL, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM
 * @param saveDir optional folder to save PDFs in when email is not configured
 * @returns { status, body }
 */
async function handleSubmission({ get, photo, env, saveDir }) {
  const data = {};
  for (const k of TEXT_FIELDS) data[k] = clean(get(k));
  for (const [id, [rows, cols]] of Object.entries(TABLES)) {
    data[id] = [];
    for (let i = 0; i < rows; i++) {
      const row = [];
      for (let j = 0; j < cols; j++) row.push(clean(get(`${id}[${i}][${j}]`), 200));
      if (row.some(Boolean)) data[id].push(row);
    }
  }

  const missing = ['name', 'position', 'mobile', 'email', 'signature'].filter((k) => !data[k]);
  if (missing.length || !get('agree')) {
    return { status: 400, body: { error: 'Please fill in all required fields and accept the declaration.' } };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return { status: 400, body: { error: 'Please enter a valid email address.' } };
  }
  if (photo && photo.buffer.length > MAX_PHOTO) {
    return { status: 400, body: { error: 'Photo must be 2 MB or smaller.' } };
  }
  data.photo = photo && PHOTO_TYPES.includes(photo.mimetype) ? photo.buffer : null;

  const now = new Date();
  const ist = new Date(now.getTime() + 330 * 60000).toISOString(); // India Standard Time
  data.applicationNo = `VG-${ist.slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  data.submittedAt = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });

  let stage = 'PDF';
  try {
    const pdf = await buildPdf(data);
    stage = 'MAIL';
    const safeName = data.name.replace(/[^a-z0-9]+/gi, '_').slice(0, 60);
    const filename = `Interview_Form_${safeName}_${data.applicationNo}.pdf`;
    const mailer = getTransporter(env);

    if (mailer) {
      await mailer.sendMail({
        from: env.MAIL_FROM || env.SMTP_USER,
        to: env.HR_EMAIL,
        replyTo: data.email,
        subject: `Interview Form ${data.applicationNo}: ${data.name} (${data.position})`.replace(/[\r\n]+/g, ' '),
        text: `A new candidate interview form has been submitted.\n\nApplication No.: ${data.applicationNo}\nSubmitted: ${data.submittedAt}\nName: ${data.name}\nPosition: ${data.position}\n`
          + `Mobile: ${data.mobile}\nEmail: ${data.email}\n\nThe full form is attached as a PDF.`,
        attachments: [{ filename, content: pdf, contentType: 'application/pdf' }],
      });
      console.log(`Emailed ${filename} to ${env.HR_EMAIL}`);
    } else if (saveDir) {
      // No mail settings yet: keep the PDF on disk so nothing is lost.
      fs.mkdirSync(saveDir, { recursive: true });
      fs.writeFileSync(path.join(saveDir, filename), pdf);
      console.log(`Email not configured; saved ${filename}`);
    } else {
      const missing = ['HR_EMAIL', 'SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'].filter((k) => !env[k]);
      throw new Error(`Email is not configured: missing ${missing.join(', ')}`);
    }
    return { status: 200, body: { ok: true, applicationNo: data.applicationNo } };
  } catch (err) {
    const hint = err.code === 'EAUTH' ? ' (Gmail rejected SMTP_USER / SMTP_PASS: check the App Password)' : '';
    console.error(`Submission failed${hint}:`, err);
    // A short reference code (no secrets) so HR can tell what failed without opening the logs.
    const ref = [stage, err.code, err.responseCode].filter(Boolean).join('-');
    return { status: 500, body: { error: `Sorry, we could not submit your form right now. Please try again later. (Ref: ${ref})` } };
  }
}

module.exports = { handleSubmission, MAX_PHOTO };
