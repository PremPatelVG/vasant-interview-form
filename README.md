# Vasant Group Online Interview Form

**Going live? See [GO-LIVE.md](GO-LIVE.md).**

Candidates fill in the interview form in their browser and click **Submit Application**.
The server turns their answers (and passport photo) into a PDF and emails it to HR as an attachment.
The PDF keeps a blank "For Management Use Only" section for HR / HOD to complete.

## Run it

Needs Node.js 18 or newer.

```bash
npm install
cp .env.example .env   # then fill in HR_EMAIL and the SMTP settings
npm start              # open http://localhost:3000
```

On Netlify, set HR_EMAIL, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and MAIL_FROM under Project configuration → Environment variables.

If the email settings are left empty, submissions are saved as PDFs in `submissions/` instead of being emailed.

## Email settings

Any SMTP mailbox works. Common choices:

| Provider | SMTP_HOST | SMTP_PORT | Password |
|---|---|---|---|
| Google Workspace / Gmail | smtp.gmail.com | 587 | an App Password (needs 2-step verification) |
| Microsoft 365 / Outlook | smtp.office365.com | 587 | mailbox password (SMTP AUTH must be enabled) |
| Hosting provider mailbox | from your host | 465 or 587 | mailbox password |

## Files

- `public/index.html` – the candidate form (based on the original Vasant Group form)
- `submit.js` – validates a submission, builds the PDF and sends the email (shared by both hosting options)
- `server.js` – runs the form on your own server (`npm start`)
- `netlify/functions/submit.js` + `netlify.toml` – runs the form on Netlify
- `pdf.js` / `logo.js` – lays out the PDF
- `sample-submission.pdf` – an example of what HR receives
- `GO-LIVE.md` – checklist for putting the form online
