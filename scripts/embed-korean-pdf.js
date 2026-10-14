const fs = require('fs');
const path = require('path');

const guideBase64 = fs.readFileSync(path.join(__dirname, '../apps/api/assets/sample_create_guide.pdf')).toString('base64');
const grade5Base64 = fs.readFileSync(path.join(__dirname, '../apps/api/assets/sample_grade5_design.pdf')).toString('base64');
const grade6Base64 = fs.readFileSync(path.join(__dirname, '../apps/api/assets/sample_grade6_lesson.pdf')).toString('base64');

const code = `/**
 * 한국어 공식 샘플 PDF 바이너리 제공 모듈
 * 관리자가 실제 PDF를 업로드하기 전에도 100% 한글로 구성된 고품질 인쇄본 PDF를 제공합니다.
 */

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

const SAMPLE_GUIDE_PDF_B64 = "${guideBase64}";
const SAMPLE_GRADE5_PDF_B64 = "${grade5Base64}";
const SAMPLE_GRADE6_PDF_B64 = "${grade6Base64}";

export async function generateSamplePdf(title: string, pageCount = 5): Promise<Uint8Array> {
  if (title.includes('5학년')) {
    return base64ToUint8Array(SAMPLE_GRADE5_PDF_B64);
  }
  if (title.includes('6학년')) {
    return base64ToUint8Array(SAMPLE_GRADE6_PDF_B64);
  }
  return base64ToUint8Array(SAMPLE_GUIDE_PDF_B64);
}
`;

fs.writeFileSync(path.join(__dirname, '../apps/api/src/sample-pdf.ts'), code);
console.log('Successfully updated apps/api/src/sample-pdf.ts with Korean PDF base64 buffers!');
