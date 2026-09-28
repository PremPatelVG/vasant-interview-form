// Netlify version of POST /api/submit (routed here by netlify.toml).
// Written as a CommonJS handler so pdfkit and nodemailer load with plain require().
const { handleSubmission } = require('../../submit');

const EMAIL_KEYS = ['HR_EMAIL', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'MAIL_FROM'];
const json = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  let form;
  try {
    // Let the built-in Request parser decode the multipart body.
    const req = new Request('http://localhost/api/submit', {
      method: 'POST',
      headers: event.headers,
      body: Buffer.from(event.body || '', event.isBase64Encoded ? 'base64' : 'utf8'),
    });
    form = await req.formData();
  } catch (err) {
    console.error('Could not read form data:', err);
    return json(400, { error: 'Invalid form submission.' });
  }

  const file = form.get('photo');
  const photo = file && typeof file === 'object' && file.size > 0
    ? { buffer: Buffer.from(await file.arrayBuffer()), mimetype: file.type }
    : null;

  const { status, body } = await handleSubmission({
    get: (name) => {
      const v = form.get(name);
      return typeof v === 'string' ? v : '';
    },
    photo,
    env: Object.fromEntries(EMAIL_KEYS.map((k) => [k, process.env[k]])),
  });
  return json(status, body);
};
