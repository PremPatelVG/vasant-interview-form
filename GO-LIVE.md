# Taking the Interview Form Live

The form and PDF are built and tested. Four steps remain before candidates can use it.

## What you need to provide

| # | Item | Details |
|---|------|---------|
| 1 | **HR email address** | The address that should receive every submitted form, for example `hr@vasantgroup.in`. More than one address is fine. |
| 2 | **A sending mailbox** | A Google Workspace mailbox that sends the emails, for example `careers@vasantgroup.in` or `noreply@vasantgroup.in`. Any existing mailbox works too. |
| 3 | **An App Password for that mailbox** | This is a 16-character password Google creates for apps. It is not the normal login password. See the steps below. |
| 4 | **Web address (optional)** | You can use the free Netlify address (for example `vasant-interview.netlify.app`) or your own, such as `careers.vasantgroup.in`. |

### Create the App Password (5 minutes)
1. Sign in to the sending mailbox and open **myaccount.google.com → Security**.
2. Turn on **2-Step Verification** if it is not already on.
3. Open **myaccount.google.com/apppasswords**, name it "Interview Form" and click **Create**.
4. Copy the 16-character password. **Do not paste it in the chat.** You will enter it yourself in Netlify (step C below).

> If Google says App Passwords are not available, your Google Workspace admin has to allow them under
> Admin console → Security → Authentication → 2-Step Verification.

## Going live on Netlify (recommended)

Vasant Group already has a Netlify account (it.support@vasantgroup.in) and it is connected here, so Claude can do most of the work.

| Step | Who | What happens |
|------|-----|--------------|
| A | Claude | Adapts the server code to run on Netlify, then publishes the site to your Netlify account. |
| B | Claude | Adds the non-secret settings: HR email, sending mailbox and Gmail's SMTP server. |
| C | You | In Netlify, open **Site configuration → Environment variables**, add `SMTP_PASS` and paste the App Password. |
| D | Claude + you | Claude sends a test application. You confirm HR received the email with the PDF attached. |
| E | You (optional) | For `careers.vasantgroup.in`, add the one DNS record Netlify shows you at your domain provider. |

Netlify's free plan is enough for an interview form.

## After it is live
- Share the link on job posts, WhatsApp, your website's careers page, or as a QR code at reception.
- Each submission reaches HR as an email titled `Interview Form VG-YYYYMMDD-XXXX: Name (Position)` with the PDF attached. HR can reply to it directly to email the candidate.
- To change the form's fields or wording later, ask Claude in this project.

## Other hosting options
- **Your own web server or cPanel hosting** that supports Node.js: upload this folder, run `npm install`, set up `.env` from `.env.example`, and start it with `npm start`.
- **Render.com**: runs this folder as is. It needs a GitHub repository. The free tier is slow on first load and costs about US$7/month to keep always-on.
