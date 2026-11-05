const fs = require('fs');
const path = require('path');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

const resourcesDir = path.join(__dirname, '../apps/web/src/components/resources');

async function extractDoc(fileName) {
  const filePath = path.join(resourcesDir, fileName);
  const data = new Uint8Array(fs.readFileSync(filePath));
  const doc = await pdfjsLib.getDocument({ data }).promise;
  const pages = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    // Normalize spaces: pdfjs sometimes has excessive spaces between characters in Korean
    const rawText = content.items.map(it => it.str).join(' ');
    // Clean up Korean spacing if characters are spaced out like "진 단   도 구"
    const cleanedText = rawText.replace(/\s+/g, ' ').trim();
    pages.push({ pageNumber: i, text: cleanedText });
  }

  return {
    fileName,
    pageCount: doc.numPages,
    pages
  };
}

async function main() {
  const files = fs.readdirSync(resourcesDir).filter(f => f.endsWith('.pdf'));
  console.log(`Extracting ${files.length} pdfs...`);

  const summary = [];
  for (const f of files) {
    const res = await extractDoc(f);
    summary.push({
      fileName: f,
      pageCount: res.pageCount,
      totalChars: res.pages.reduce((acc, p) => acc + p.text.length, 0),
      firstPageSnippet: res.pages[0]?.text.slice(0, 150)
    });
  }

  console.log(JSON.stringify(summary, null, 2));
}

main();
