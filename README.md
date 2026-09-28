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
- `server.js` – receives the submission, validates it, and sends the email
- `pdf.js` – lays out the PDF
- `sample-submission.pdf` – an example of what HR receives
- `GO-LIVE.md` – checklist for putting the form online
