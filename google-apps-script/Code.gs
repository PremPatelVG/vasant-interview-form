/**
 * Vasant Group interview form: receives each application from the website,
 *  1. saves the PDF (and photo) in a Google Drive folder,
 *  2. adds a row to this Google Sheet,
 *  3. emails HR the PDF (sent from the Google account that deploys this script, so no password is needed).
 *
 * Paste this into Extensions -> Apps Script of the Google Sheet, then Deploy -> New deployment -> Web app.
 */

const NOTIFY_EMAIL = 'hr1@vasantgroup.in';      // leave '' to skip the email
const FOLDER_NAME = 'Interview Applications';    // Drive folder for PDFs and photos
const SHEET_NAME = 'Applications';

const HEADERS = ['Submitted On', 'Application No.', 'Name', 'Position Applied For', 'Mobile', 'Email',
  'Current Salary', 'Expected Salary', 'Notice Period', 'PDF', 'Photo'];

function doPost(e) {
  // Pressing Run on doPost in the editor has no form data; that is expected. Run "setup" instead.
  if (!e || !e.postData) return json_({ ok: false, error: 'No form data: doPost only runs when the form is submitted.' });
  try {
    const d = JSON.parse(e.postData.contents);
    const required = ['name', 'position', 'mobile', 'email', 'pdf', 'applicationNo'];
    const missing = required.filter(function (k) { return !d[k]; });
    if (missing.length) return json_({ ok: false, error: 'Missing: ' + missing.join(', ') });

    const folder = getFolder_();
    const safeName = String(d.name).replace(/[^a-z0-9]+/gi, '_').slice(0, 60);
    const base = d.applicationNo + '_' + safeName;

    const pdfBlob = Utilities.newBlob(Utilities.base64Decode(d.pdf), 'application/pdf', base + '.pdf');
    const pdfFile = folder.createFile(pdfBlob);

    let photoUrl = '';
    if (d.photo && d.photoType) {
      const ext = d.photoType === 'image/png' ? '.png' : '.jpg';
      const photoFile = folder.createFile(
        Utilities.newBlob(Utilities.base64Decode(d.photo), d.photoType, base + '_photo' + ext));
      photoUrl = photoFile.getUrl();
    }

    getSheet_().appendRow([d.submittedAt || new Date(), d.applicationNo, d.name, d.position, "'" + d.mobile, d.email,
      d.currentSalary || '', d.expectedSalary || '', d.joiningTime || '', pdfFile.getUrl(), photoUrl]);

    if (NOTIFY_EMAIL) {
      MailApp.sendEmail({
        to: NOTIFY_EMAIL,
        replyTo: d.email,
        subject: 'Interview Form ' + d.applicationNo + ': ' + d.name + ' (' + d.position + ')',
        body: 'A new candidate interview form has been submitted.\n\n'
          + 'Application No.: ' + d.applicationNo + '\nName: ' + d.name + '\nPosition: ' + d.position
          + '\nMobile: ' + d.mobile + '\nEmail: ' + d.email
          + '\n\nThe full form is attached as a PDF and saved in Google Drive:\n' + pdfFile.getUrl(),
        attachments: [pdfBlob],
      });
    }
    return json_({ ok: true, applicationNo: d.applicationNo });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: String(err && err.message || err) });
  }
}

// Opening the web app URL in a browser shows this, which confirms the deployment works.
function doGet() {
  return json_({ ok: true, message: 'Interview form endpoint is running.' });
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getFolder_() {
  const it = DriveApp.getFoldersByName(FOLDER_NAME);
  return it.hasNext() ? it.next() : DriveApp.createFolder(FOLDER_NAME);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Run this once from the editor (select "setup" and click Run) to grant permissions and create the sheet and folder.
function setup() {
  getSheet_();
  getFolder_();
}
