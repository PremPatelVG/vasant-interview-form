// Browser build of pdf.js: exposes window.buildInterviewPdf(data) -> Promise<Uint8Array>.
const { buildPdf } = require('../pdf');
window.buildInterviewPdf = buildPdf;
