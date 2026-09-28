const PDFDocument = require('pdfkit');
const LOGO = require('./logo');

const M = 36; // page margin
const FOOT = 26; // space reserved for the footer
const INK = '#1a1a1a', MUTED = '#5f6368', LINE = '#9aa0a6', HEAD = '#eceef1', ACCENT = '#e98d2d';

function fmtDate(v) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || '');
  return m ? `${m[3]}/${m[2]}/${m[1]}` : v || '';
}

function buildPdf(d) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4', margins: { top: M, left: M, right: M, bottom: M },
      bufferPages: true, info: { Title: `Candidate Interview Form - ${d.name}`, Author: 'Vasant Group HR' },
    });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W = doc.page.width - M * 2;
    const limit = () => doc.page.height - M - FOOT;
    const ensure = (h) => { if (doc.y + h > limit()) { doc.addPage(); doc.y = M; } };
    // { blank: n } leaves n empty lines for HR to write in.
    const val = (v) => (v && v.blank ? ' \n'.repeat(v.blank) : (v && String(v).trim()) || '—');

    // ---------- Header ----------
    doc.rect(0, 0, doc.page.width, 6).fill(ACCENT);
    doc.image(LOGO, M, M - 6, { width: 130 });
    doc.fillColor(INK).font('Helvetica-Bold').fontSize(16)
      .text('CANDIDATE INTERVIEW FORM', M, M + 6, { width: W, align: 'right', characterSpacing: 1 });
    doc.font('Helvetica').fontSize(8.5).fillColor(MUTED)
      .text('HUMAN RESOURCES DEPARTMENT', M, doc.y + 3, { width: W, align: 'right', characterSpacing: 0.8 });
    const ruleY = M + 50;
    doc.moveTo(M, ruleY).lineTo(M + W, ruleY).lineWidth(1.5).strokeColor(INK).stroke();

    // Reference strip
    const strip = [['Application No.', d.applicationNo], ['Form Date', fmtDate(d.date)], ['Submitted On', d.submittedAt]];
    const sw = W / strip.length;
    strip.forEach(([l, v], i) => {
      const x = M + i * sw;
      doc.rect(x, ruleY + 8, sw, 30).lineWidth(0.6).strokeColor(LINE).stroke();
      doc.font('Helvetica').fontSize(7).fillColor(MUTED).text(l.toUpperCase(), x + 6, ruleY + 12, { width: sw - 12 });
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor(INK).text(val(v), x + 6, ruleY + 23, { width: sw - 12 });
    });
    doc.y = ruleY + 50;

    // ---------- Building blocks ----------
    let secNo = 0;
    const section = (title) => {
      ensure(60);
      secNo += 1;
      const y = doc.y + 6;
      doc.rect(M, y, W, 18).fill(INK);
      doc.rect(M, y, 22, 18).fill(ACCENT);
      doc.fillColor('#fff').font('Helvetica-Bold').fontSize(9).text(String(secNo), M, y + 5, { width: 22, align: 'center' });
      doc.text(title.toUpperCase(), M + 30, y + 5, { width: W - 36, characterSpacing: 0.6 });
      doc.fillColor(INK);
      doc.y = y + 18;
    };

    // Bordered label/value cells. Each row is a list of [label, value, span]; spans in a row add to `cols`.
    const cells = (rows, { x0 = M, width = W, cols = 2 } = {}) => {
      const unit = width / cols;
      for (const row of rows) {
        const hs = row.map(([l, v, s = 1]) => {
          const w = unit * s - 12;
          return doc.font('Helvetica').fontSize(6.8).heightOfString(l.toUpperCase(), { width: w })
            + doc.font('Helvetica').fontSize(9.5).heightOfString(val(v), { width: w }) + 12;
        });
        const h = Math.max(22, ...hs);
        ensure(h);
        const y = doc.y;
        let x = x0;
        for (const [l, v, s = 1] of row) {
          const w = unit * s;
          doc.rect(x, y, w, h).lineWidth(0.6).strokeColor(LINE).stroke();
          doc.font('Helvetica').fontSize(6.8).fillColor(MUTED).text(l.toUpperCase(), x + 6, y + 4, { width: w - 12 });
          doc.font('Helvetica').fontSize(9.5).fillColor(INK).text(val(v), x + 6, doc.y + 2, { width: w - 12 });
          x += w;
        }
        doc.y = y + h;
      }
    };

    const table = (headers, rows, widths, minRows) => {
      const total = widths.reduce((a, b) => a + b, 0);
      const cw = widths.map((w) => (w / total) * W);
      const body = rows.map((r, i) => [String(i + 1), ...r]);
      while (body.length < minRows) body.push([String(body.length + 1), ...headers.slice(1).map(() => '')]);
      const drawRow = (cellsText, isHead) => {
        doc.font(isHead ? 'Helvetica-Bold' : 'Helvetica').fontSize(isHead ? 7.2 : 9);
        const h = Math.max(isHead ? 20 : 18, ...cellsText.map((c, i) => doc.heightOfString(c || '', { width: cw[i] - 10 }) + 9));
        ensure(h + (isHead ? 18 : 0));
        const y = doc.y;
        let x = M;
        cellsText.forEach((c, i) => {
          if (isHead) doc.rect(x, y, cw[i], h).fillAndStroke(HEAD, LINE);
          else doc.rect(x, y, cw[i], h).lineWidth(0.6).strokeColor(LINE).stroke();
          doc.fillColor(i === 0 && !isHead ? MUTED : INK)
            .text(isHead ? c.toUpperCase() : c || '', x + 5, y + 5, { width: cw[i] - 10, align: i === 0 ? 'center' : 'left' });
          x += cw[i];
        });
        doc.y = y + h;
      };
      drawRow(headers, true);
      body.forEach((r) => drawRow(r, false));
    };

    // ---------- 1. Personal details (photo on the right) ----------
    section('Personal Details');
    const photoW = 100;
    const top = doc.y;
    cells([
      [['Full Name', d.name, 2]],
      [['Position Applied For', d.position, 2]],
      [['Mobile No.', d.mobile], ['Email ID', d.email]],
      [['Date of Birth', fmtDate(d.dob)], ['Marital Status', d.marital]],
      [['Reference', d.reference, 2]],
    ], { width: W - photoW });
    const photoH = doc.y - top;
    const px = M + W - photoW;
    doc.rect(px, top, photoW, photoH).lineWidth(0.6).strokeColor(LINE).stroke();
    if (d.photo) {
      try { doc.image(d.photo, px + 6, top + 6, { fit: [photoW - 12, photoH - 12], align: 'center', valign: 'center' }); }
      catch { doc.font('Helvetica').fontSize(8).fillColor(MUTED).text('Photo could not be read', px, top + photoH / 2 - 5, { width: photoW, align: 'center' }); }
    } else {
      doc.font('Helvetica').fontSize(8).fillColor(MUTED).text('Photo not provided', px, top + photoH / 2 - 5, { width: photoW, align: 'center' });
    }
    doc.y = top + photoH;

    // ---------- 2–7 ----------
    section('Educational Qualification (Highest First)');
    table(['Sr.', 'Qualification / Particulars', 'Board / University', 'Year of Passing', '% of Marks'], d.education, [6, 30, 32, 16, 16], 2);
    cells([[['Medium of Education', d.medium, 2]]]);

    section('Family Background');
    table(['Sr.', 'Name', 'Age', 'Relation', 'Occupation'], d.family, [6, 34, 10, 20, 30], 2);

    section('Employment History (Current First)');
    table(['Sr.', 'Name of Company', 'Last Position', 'Gross Salary / Month (CTC)', 'From', 'To', 'Reason for Leaving'],
      d.experience, [5, 20, 16, 14, 10, 10, 25], 2);

    section('Current Employment & Expectations');
    cells([
      [['Current Designation', d.currentDesignation], ['Expected Designation', d.expectedDesignation]],
      [['Current Gross Monthly Salary', d.currentSalary], ['Minimum Expected Salary / Month', d.expectedSalary]],
      [['Reporting To (Current Job)', d.reportsTo], ['No. of Persons Reporting', d.teamSize]],
      [['Notice Period / Time Required to Join', d.joiningTime, 2]],
    ]);

    section('Career Goals & Self Assessment');
    cells([
      [['Career Goals', d.careerGoals]],
      [['Three Key Strengths', d.strengths]],
      [['Three Areas of Improvement', d.improvements]],
    ], { cols: 1 });

    section('References');
    table(['Sr.', 'Name', 'Occupation', 'Contact No.'], d.references, [6, 36, 30, 28], 2);

    // ---------- 8. Declaration ----------
    section('Declaration');
    ensure(80);
    const dy = doc.y;
    const text = 'I, the undersigned, hereby declare that the information given above is true to the best of my knowledge and belief. '
      + 'I understand that my candidature and selection may be rejected in case of any discrepancy.';
    doc.font('Helvetica').fontSize(9).fillColor(INK);
    const th = doc.heightOfString(text, { width: W - 16 }) + 12;
    doc.rect(M, dy, W, th).lineWidth(0.6).strokeColor(LINE).stroke();
    doc.rect(M, dy, 3, th).fill(ACCENT).fillColor(INK);
    doc.text(text, M + 10, dy + 6, { width: W - 16 });
    doc.y = dy + th;
    cells([[['Candidate Name (Signature)', d.signature], ['Declaration Accepted On', d.submittedAt]]]);

    // ---------- 9. Management use (left blank) ----------
    section('For Management Use Only');
    ensure(150);
    const my = doc.y;
    const boxH = 22;
    doc.rect(M, my, W, boxH).lineWidth(0.6).strokeColor(LINE).stroke();
    doc.font('Helvetica-Bold').fontSize(8).fillColor(INK).text('INTERVIEW RESULT:', M + 6, my + 7);
    ['Selected', 'Rejected', 'On Hold'].forEach((o, i) => {
      const x = M + 120 + i * 100;
      doc.rect(x, my + 6, 9, 9).lineWidth(0.8).strokeColor(INK).stroke();
      doc.font('Helvetica').fontSize(9).text(o, x + 14, my + 7);
    });
    doc.y = my + boxH;
    const blank = (l, s = 1, lines = 1) => [l, { blank: lines }, s];
    cells([
      [blank('Offered Designation'), blank('Offered CTC'), blank('Date of Joining')],
      [blank('Remarks', 3, 3)],
    ], { cols: 3 });
    // Tall remarks / signature boxes
    const sy = doc.y;
    ['HR (Name & Signature)', 'HOD (Name & Signature)'].forEach((l, i) => {
      const x = M + (i * W) / 2;
      doc.rect(x, sy, W / 2, 48).lineWidth(0.6).strokeColor(LINE).stroke();
      doc.font('Helvetica').fontSize(6.8).fillColor(MUTED).text(l.toUpperCase(), x + 6, sy + 4, { width: W / 2 - 12 });
    });
    doc.y = sy + 48;

    // ---------- Footer on every page ----------
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i);
      const fy = doc.page.height - M - 10;
      doc.moveTo(M, fy - 4).lineTo(M + W, fy - 4).lineWidth(0.5).strokeColor(LINE).stroke();
      doc.font('Helvetica').fontSize(7.5).fillColor(MUTED);
      doc.text(`Vasant Group · Candidate Interview Form · ${d.applicationNo} · Confidential`, M, fy, { width: W, lineBreak: false });
      doc.text(`Page ${i + 1} of ${range.count}`, M, fy, { width: W, align: 'right', lineBreak: false });
    }

    doc.end();
  });
}

module.exports = { buildPdf };
