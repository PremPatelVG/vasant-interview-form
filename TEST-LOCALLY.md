# Test the form on your own Windows computer

This runs the same code as the live site, on your PC, so you can see the exact email error.

## 1. Install Node.js (one time)
Download the **LTS** version from https://nodejs.org and install it with the default options.

## 2. Unzip the project
Unzip `candidate-form.zip`, for example to `C:\candidate-form`.

## 3. Create the settings file
In that folder, copy `.env.example` and rename the copy to `.env`. Open it in Notepad and fill in:

```
HR_EMAIL=hr1@vasantgroup.in
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=it.support@vasantgroup.in
SMTP_PASS=your16letterapppassword
MAIL_FROM="Vasant Group Careers <it.support@vasantgroup.in>"
PORT=3000
```

Save the file. Windows sometimes adds `.txt` to the name, so make sure it is exactly `.env`.

## 4. Open Command Prompt in the folder
Open the folder in File Explorer, click the address bar, type `cmd` and press Enter. Then run:

```
npm install
```

## 5. Test the Gmail login first
```
npm run test-email
```

- **SUCCESS**: the password works, and hr1@vasantgroup.in gets a test email.
- **FAILED: EAUTH 535**: Gmail rejected the password. Create a new App Password while signed in as
  it.support@vasantgroup.in (myaccount.google.com/apppasswords), put it in `.env`, and run the test again.
  When it works, put the same password in Netlify → Environment variables → `SMTP_PASS` and redeploy.

## 6. Test the full form
```
npm start
```

Open http://localhost:3000, fill in a test application and submit it. HR should receive the email with the PDF.
Press `Ctrl + C` in the Command Prompt window to stop the server.
