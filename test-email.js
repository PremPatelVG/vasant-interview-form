// Checks the email settings in .env on their own: logs in to the mail server and sends one test email to HR_EMAIL.
// Run with: npm run test-email
require('dotenv').config({ quiet: true });
const nodemailer = require('nodemailer');

const env = process.env;
const missing = ['HR_EMAIL', 'SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'].filter((k) => !env[k]);
if (missing.length) {
  console.log(`\nMissing in .env: ${missing.join(', ')}\n`);
  process.exit(1);
}

const pass = env.SMTP_PASS.replace(/\s+/g, '');
console.log(`\nServer:   ${env.SMTP_HOST}:${env.SMTP_PORT || 587}`);
console.log(`Login as: ${env.SMTP_USER.trim()}`);
console.log(`Password: ${pass.length} characters (a Google App Password has 16)`);
console.log(`Send to:  ${env.HR_EMAIL}\n`);

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: Number(env.SMTP_PORT || 587),
  secure: Number(env.SMTP_PORT) === 465,
  auth: { user: env.SMTP_USER.trim(), pass },
  connectionTimeout: 15000,
});

const explain = (err) => {
  if (err.code === 'EAUTH') {
    return 'The mail server REJECTED the login.\n'
      + '  - Make sure SMTP_PASS is an App Password created while signed in as SMTP_USER\n'
      + '    (myaccount.google.com/apppasswords), not the normal password.\n'
      + '  - If Google says App Passwords are unavailable, turn on 2-Step Verification,\n'
      + '    or ask the Google Workspace admin to allow them.';
  }
  if (['ETIMEDOUT', 'ESOCKET', 'ECONNECTION', 'ECONNREFUSED'].includes(err.code)) {
    return 'Could not connect to the mail server. Check SMTP_HOST / SMTP_PORT and that this network allows port 587.';
  }
  return 'Unexpected error: see the details above.';
};

(async () => {
  try {
    console.log('1) Logging in...');
    await transporter.verify();
    console.log('   OK: login accepted.\n');
    console.log('2) Sending a test email...');
    const info = await transporter.sendMail({
      from: env.MAIL_FROM || env.SMTP_USER,
      to: env.HR_EMAIL,
      subject: 'Interview Form: email test',
      text: 'This is a test from the Vasant Group interview form. If you can read this, email sending works.',
    });
    console.log(`   OK: sent (${info.response}).\n\nSUCCESS: check the inbox of ${env.HR_EMAIL}.\n`);
  } catch (err) {
    console.log(`   FAILED: ${err.code || ''} ${err.responseCode || ''}\n   ${String(err.response || err.message).trim()}\n`);
    console.log(explain(err) + '\n');
    process.exit(1);
  }
})();
