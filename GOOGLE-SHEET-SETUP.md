# Save applications to Google Sheet + Drive (no email password needed)

Each submitted form will:
- add a row to a Google Sheet (name, position, mobile, email, salary, and links to the PDF and photo),
- save the PDF and photo in a Google Drive folder called **Interview Applications**,
- email the PDF to hr1@vasantgroup.in. Google sends it from the account that sets this up, so no password is needed.

## Setup (about 10 minutes, one time)

Sign in to Google with the account that should own the applications, for example it.support@vasantgroup.in or the HR account.

1. **Create the Sheet.** Open https://sheets.new and name it "Interview Applications".
2. **Add the script.** In the Sheet, click **Extensions → Apps Script**. Delete everything in the editor, paste the whole contents of
   `google-apps-script/Code.gs`, then click **Save** (the disk icon).
   - To send the email to a different address, change `NOTIFY_EMAIL` at the top.
3. **Give permission.** In the toolbar, choose the function **setup** and click **Run**. Click **Review permissions**, pick your account,
   click **Advanced → Go to (project name) (unsafe)** and then **Allow**. (Google shows "unsafe" for every private script you write yourself.)
4. **Publish it.** Click **Deploy → New deployment**. Click the gear icon and choose **Web app**, then set:
   - Execute as: **Me**
   - Who has access: **Anyone**

   Click **Deploy** and copy the **Web app URL**. It ends in `/exec`.
5. **Connect the form.** Send the URL to Claude, or put it in `public/config.js` yourself on GitHub:
   `window.APPS_SCRIPT_URL = 'https://script.google.com/macros/s/.../exec';`
   Netlify republishes the site automatically.
6. **Test it.** Submit a test application. A new row should appear in the Sheet, the PDF should be in Drive, and hr1 should get the email.

To check the URL on its own, open it in a browser. It should show `{"ok":true,"message":"Interview form endpoint is running."}`.

## If you change the script later
Use **Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy**. This keeps the same URL.
