import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * 테스트용 샘플 PDF 바이너리 생성기
 * 관리자가 실제 PDF를 업로드하기 전에도 뷰어가 정상 렌더링되도록 보장합니다.
 */
export async function generateSamplePdf(title: string, pageCount = 5): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const cleanTitle = title.replace(/[^\w\s\-\.\(\)\[\]]/g, ' ').replace(/\s+/g, ' ').trim();

  for (let i = 1; i <= Math.max(pageCount, 1); i++) {
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 (가로 595, 세로 842)
    const { width, height } = page.getSize();

    // 상단 헤더
    page.drawText('CREATE Research School Official Document', {
      x: 50,
      y: height - 45,
      size: 10,
      font,
      color: rgb(0.01, 0.52, 0.78)
    });

    page.drawText(`Page ${i} / ${pageCount}`, {
      x: width - 110,
      y: height - 45,
      size: 10,
      font: boldFont,
      color: rgb(0.2, 0.25, 0.3)
    });

    // 타이틀 박스
    page.drawRectangle({
      x: 50,
      y: height - 120,
      width: width - 100,
      height: 55,
      color: rgb(0.94, 0.98, 1.0),
      borderColor: rgb(0.55, 0.82, 0.98),
      borderWidth: 1.5
    });

    page.drawText(cleanTitle.slice(0, 50) || 'CREATE Guide Document', {
      x: 65,
      y: height - 90,
      size: 13,
      font: boldFont,
      color: rgb(0.06, 0.09, 0.16)
    });

    page.drawText(`Verified Sample Material - Cited Page: ${i}`, {
      x: 65,
      y: height - 108,
      size: 10,
      font,
      color: rgb(0.02, 0.52, 0.78)
    });

    // 내용 구역
    page.drawText(`[Document Content - Page ${i}]`, {
      x: 50,
      y: height - 160,
      size: 14,
      font: boldFont,
      color: rgb(0.1, 0.15, 0.25)
    });

    page.drawText(
      `This is a verified research school document for CREATE instructional design.\n` +
      `Teachers can inspect the cited content for Page ${i} on this page.\n\n` +
      `CREATE Framework Phases:\n` +
      `- C (Connect & Challenge): Problem discovery & inquiry challenge\n` +
      `- R (Research & Reason): Data investigation & conceptual reasoning\n` +
      `- E (Explore & Experiment): Idea brainstorming & prototyping\n` +
      `- A (Apply & Act): Creative product creation & collaborative action\n` +
      `- T (Transform & Think): Peer feedback, iteration & deep reflection\n` +
      `- E (Evaluate & Extend): Process assessment & rubric evaluation\n\n` +
      `Admin can upload the official scanned or publication PDF via /chatbot/admin anytime.`,
      {
        x: 50,
        y: height - 200,
        size: 11,
        font,
        color: rgb(0.2, 0.25, 0.3),
        lineHeight: 18
      }
    );

    // 하단 구분선 및 푸터
    page.drawLine({
      start: { x: 50, y: 55 },
      end: { x: width - 50, y: 55 },
      thickness: 0.5,
      color: rgb(0.8, 0.85, 0.9)
    });

    page.drawText('CREATE AI Lesson Assistant - futureschool.allforedu.kr', {
      x: 50,
      y: 40,
      size: 9,
      font,
      color: rgb(0.5, 0.55, 0.6)
    });
  }

  return await pdfDoc.save();
}
