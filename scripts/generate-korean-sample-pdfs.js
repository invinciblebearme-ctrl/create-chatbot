const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');

async function createKoreanPdf(outputPath, title, pagesData) {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const fontPath = 'C:\\Windows\\Fonts\\malgun.ttf';
  const fontBoldPath = 'C:\\Windows\\Fonts\\malgunbd.ttf';

  const fontBytes = fs.readFileSync(fontPath);
  const fontBoldBytes = fs.existsSync(fontBoldPath) ? fs.readFileSync(fontBoldPath) : fontBytes;

  const font = await pdfDoc.embedFont(fontBytes, { subset: true });
  const boldFont = await pdfDoc.embedFont(fontBoldBytes, { subset: true });

  const totalPages = pagesData.length;

  for (let i = 0; i < totalPages; i++) {
    const pageNum = i + 1;
    const pageInfo = pagesData[i];

    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();

    // 상단 헤더
    page.drawText('초등학교 연구학교 공식 자료 [테스트용 샘플 데이터]', {
      x: 50,
      y: height - 45,
      size: 9,
      font,
      color: rgb(0.01, 0.52, 0.78)
    });

    page.drawText(`${pageNum} / ${totalPages} 쪽`, {
      x: width - 90,
      y: height - 45,
      size: 10,
      font: boldFont,
      color: rgb(0.2, 0.25, 0.3)
    });

    // 상단 타이틀 박스
    page.drawRectangle({
      x: 50,
      y: height - 120,
      width: width - 100,
      height: 55,
      color: rgb(0.95, 0.98, 1.0),
      borderColor: rgb(0.55, 0.82, 0.98),
      borderWidth: 1.5
    });

    page.drawText(title, {
      x: 65,
      y: height - 90,
      size: 13,
      font: boldFont,
      color: rgb(0.06, 0.09, 0.16)
    });

    page.drawText(`연구학교 CREATE 교수·학습 모형 매뉴얼 | 참고 페이지: ${pageNum}쪽`, {
      x: 65,
      y: height - 108,
      size: 10,
      font,
      color: rgb(0.02, 0.52, 0.78)
    });

    // 페이지별 소제목
    page.drawText(`【 ${pageInfo.subtitle} 】`, {
      x: 50,
      y: height - 155,
      size: 13,
      font: boldFont,
      color: rgb(0.07, 0.28, 0.55)
    });

    // 페이지 본문 출력 (여러 줄 자동 줄바꿈)
    const lines = pageInfo.content.split('\n');
    let currentY = height - 185;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) {
        currentY -= 10;
        continue;
      }

      // 45자 단위로 자동 줄바꿈
      const maxLen = 42;
      for (let c = 0; c < line.length; c += maxLen) {
        const sub = line.substring(c, c + maxLen);
        page.drawText(sub, {
          x: 50,
          y: currentY,
          size: 10.5,
          font: line.startsWith('-') || line.startsWith('1') || line.startsWith('2') || line.startsWith('3') || line.startsWith('4') || line.startsWith('5') ? boldFont : font,
          color: rgb(0.15, 0.2, 0.25),
          lineHeight: 18
        });
        currentY -= 19;
      }
    }

    // 하단 구분선 및 푸터
    page.drawLine({
      start: { x: 50, y: 55 },
      end: { x: width - 50, y: 55 },
      thickness: 0.5,
      color: rgb(0.8, 0.85, 0.9)
    });

    page.drawText('CREATE AI 수업 도우미 - futureschool.allforedu.kr (초등 연구학교)', {
      x: 50,
      y: 40,
      size: 9,
      font,
      color: rgb(0.5, 0.55, 0.6)
    });
  }

  const pdfBytes = await pdfDoc.save();
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, pdfBytes);
  console.log(`Generated Korean PDF: ${outputPath} (${pdfBytes.length} bytes)`);
}

async function run() {
  const assetsDir = path.join(__dirname, '../apps/api/assets');

  // 1. CREATE 안내서 (5쪽)
  await createKoreanPdf(
    path.join(assetsDir, 'sample_create_guide.pdf'),
    '[테스트용 샘플] CREATE 교수·학습 모형 기본 안내서',
    [
      {
        subtitle: '1쪽: CREATE 모형의 개념 및 개발 배경',
        content: `1. CREATE 교수·학습 모형이란 무엇인가요?

CREATE 모형은 미래 핵심역량 함양을 위해 초등학교 연구학교에서 개발된 학습자 주도형 탐구·창작 교수·학습 모델입니다.
학생들이 실제 삶의 문제와 맥락에서 출발하여 주도적으로 질문하고 협력적으로 문제를 해결하며 산출물을 창조하고 공유하는 전 과정을 구조화한 것입니다.

본 모형은 C(연결/도전), R(탐구/연구), E(체험/실험), A(적용/제작), T(변형/심화), E(성찰/평가)의 체계적인 흐름을 가집니다.

- 개발 목적: 학생 주도성 신장 및 미래 융합 핵심역량 함양
- 적용 대상: 초등학교 1~6학년 전 학년 및 전 교과 융합
- 연구학교 운영 원칙: 교사 강의 최소화 및 학생 참여형 수업 구현`
      },
      {
        subtitle: '2쪽: CREATE 모형의 6단계 구조와 정의',
        content: `2. CREATE 모형은 어떤 단계로 구성되나요?

CREATE 모형은 다음의 6가지 핵심 단계로 유기적으로 연계되어 구성됩니다:

- 1단계 C (Connect & Challenge): 실생활 문제 발견 및 학습 동기 연결, 도전 과제 설정
- 2단계 R (Research & Reason): 관련 정보 수집, 원리 탐구, 자료 분석 및 추론
- 3단계 E (Explore & Experiment): 다양한 아이디어 발상 및 가설 검증, 실험적 탐색
- 4단계 A (Apply & Act): 아이디어의 구체화, 산출물 제작 및 프로젝트 실제 적용
- 5단계 T (Transform & Think): 피드백 수용, 산출물 변형·개선, 비판적·확장적 사고
- 6단계 E (Evaluate & Extend): 과정 및 결과 성찰, 동료 평가, 배움의 일상화 및 확장

각 단계는 일방향적인 선형 구조에 머무르지 않고, 학습자의 탐구 진행 흐름에 따라 유연하게 순환 적용됩니다.`
      },
      {
        subtitle: '3쪽: 단계별 주요 교수·학습 활동 안내',
        content: `3. 단계별 주요 교수·학습 활동 안내:

각 단계에서 교사와 학생이 실천하는 핵심 교수·학습 활동은 다음과 같습니다:

- C단계(도전 연결): 일상 속 상황 영상 시청, 학생 스스로 질문 만들기, 핵심 탐구 질문 도출
- R단계(탐구 조사): 디지털 기기 및 도서를 활용한 정보 검색, 전문가 인터뷰, 데이터 수집 및 분류
- E단계(체험 실험): 모둠별 브레인스토밍, 프로토타입 구상, 사전 시뮬레이션 및 현장 테스트
- A단계(적용 제작): 협력적 산출물 제작(디지털 콘텐츠, 발명품, 보고서, 사회참여 캠페인 등)
- T단계(변형 심화): 갤러리 워크를 통한 상호 피드백 주고받기, 문제점 수정 및 기능 고도화
- E단계(평가 확장): 자기평가·동료평가 루브릭 작성, 학급 공유회 발표, 일상생활 실천 다짐`
      },
      {
        subtitle: '4쪽: CREATE 모형 적용 수업 사례 요약',
        content: `4. CREATE 모형을 적용한 학교 현장 실증 수업 사례:

- 5학년 과학·실과 융합: "지속가능한 미래를 여는 친환경 에너지 마을 만들기"
  학생들이 일상 속 에너지 소비 문제를 탐색(C)하고 태양광·풍력 원리를 조사(R)하여,
  모형 발전기 시제품을 실험(E)하고 친환경 모형 마을을 제작(A)한 뒤,
  상호 피드백을 통해 효율을 개선(T)하고 지속가능 실천을 성찰(E)하였습니다.

- 6학년 사회·도덕 융합: "우리 학교의 작은 민주주의 자치 법정 열기"
  교내 생활 갈등을 다루며 법과 규칙을 조사(R)하고, 모의 자치 법정을 열어 판결문을 작성(A),
  교칙 개정안을 제안(T)하며 민주시민 역량을 길렀습니다.`
      },
      {
        subtitle: '5쪽: 수업 설계 시 핵심 유의할 점',
        content: `5. CREATE 모형 적용 수업 설계 시 유의할 점:

1) 교사 주도의 강의를 최소화하고 학생의 주도적 질문과 탐구 시간을 충분히 확보해야 합니다.
2) 모든 단계를 기계적으로 순차 적용하기보다 단원의 성취기준과 학생 발달 단계에 맞게 유연하게 재구성할 수 있습니다.
3) T(변형/심화) 단계의 피드백 과정을 생략하지 말고 동료 간 성장을 지원하는 안전한 학급 문화를 조성해야 합니다.
4) 결과물 중심의 평가를 지양하고 전 과정에서 과정중심평가와 배움 기록을 누적합니다.
5) 디지털 도구는 목적이 아닌 문제해결을 촉진하는 도구로 적절하게 배치해야 합니다.

* 본 자료는 테스트용 샘플 데이터이며 관리자 화면에서 공식 인쇄본 PDF로 교체할 수 있습니다.`
      }
    ]
  );

  // 2. 5학년 단원설계안 (8쪽)
  await createKoreanPdf(
    path.join(assetsDir, 'sample_grade5_design.pdf'),
    '[테스트용 샘플] 5학년 과학·실과 융합 CREATE 단원설계안',
    [
      {
        subtitle: '1쪽: 단원 개요 및 성취기준 분석',
        content: `단원명: 지속가능한 미래를 여는 친환경 에너지 마을 만들기
대상: 5학년 / 교과: 과학, 실과 융합 / 총 차시: 12차시 블록타임제
관련 성취기준: [5과12-01] 태양계 특징 이해, [5실04-02] 친환경 수송 기술 및 대체 에너지 설계
단원 목표: 친환경 에너지를 활용하여 지속가능한 마을 모형을 협력하여 설계·제작한다.`
      },
      { subtitle: '2쪽: C단계 - 에너지 위기 탐색 및 도전과제 도출', content: 'C단계 주요 활동: 지구온난화 뉴스 시청 후 우리 마을의 에너지 낭비 요소를 진단하고, 친환경 에너지 마을 제작이라는 핵심 도전 과제를 설정합니다.' },
      { subtitle: '3쪽: R단계 - 신재생 에너지 원리 및 기술 조사', content: 'R단계 주요 활동: 태양광, 풍력, 수소 에너지의 발전 원리와 모형 부품 규격을 조사하고 데이터 시트를 정리합니다.' },
      { subtitle: '4쪽: E단계 - 발전 프로토타입 실험 및 회로 구성', content: 'E단계 주요 활동: 태양전지판 각도별 발전량 측정, 풍력 터빈 날개 형태별 효율 실험 및 시뮬레이션을 수행합니다.' },
      { subtitle: '5쪽: A단계 - 친환경 에너지 마을 모형 제작', content: 'A단계 주요 활동: 3D 프린터 및 업사이클링 재료를 활용하여 에너지를 자급자족하는 스마트 마을 모형을 제작합니다.' },
      { subtitle: '6쪽: T단계 - 갤러리 워크 피드백 및 성능 개선', content: 'T단계 주요 활동: 동료 모둠의 피드백을 수용하여 배선 구조를 개선하고 야간 축전지 연계 시스템을 보완합니다.' },
      { subtitle: '7쪽: E단계 - 공유회 및 배움 성장 평가', content: 'E단계 주요 활동: 학급 박람회를 열어 마을을 소개하고 과정중심평가 루브릭에 따른 동료 및 자기 성찰 평가를 진행합니다.' },
      { subtitle: '8쪽: 수업 지도 자료 및 평가 루브릭', content: '평가 루브릭: 탐구 참여도(30점), 협력적 문제해결(40점), 창의적 산출물 완성도(30점)의 평가 기준표를 제시합니다.' }
    ]
  );

  // 3. 6학년 실증수업 지도안 (6쪽)
  await createKoreanPdf(
    path.join(assetsDir, 'sample_grade6_lesson.pdf'),
    '[테스트용 샘플] 6학년 사회과 CREATE 실증수업 지도안',
    [
      { subtitle: '1쪽: 단원 개요 및 수업 의도', content: '단원명: 우리나라의 민주정치 / 6학년 1학기 사회 / 수업 주제: 우리 학교의 작은 민주주의 자치 법정 열기' },
      { subtitle: '2쪽: C-R단계 - 교내 규칙 갈등 포착 및 헌법 탐구', content: 'C-R단계 활동: 복도 통행 규칙 갈등 사례를 포착하고 헌법상 기본권과 학생 자치 규정을 탐구합니다.' },
      { subtitle: '3쪽: E단계 - 모의 자치 법정 시나리오 구성', content: 'E단계 활동: 판사, 검사, 변호인, 배심원 역할을 분담하고 사실관계 확인 및 변론 시나리오를 구성합니다.' },
      { subtitle: '4쪽: A단계 - 학급 자치 법정 개정 및 판결문 작성', content: 'A단계 활동: 실제 학급 자치 법정을 열어 변론을 진행하고 배심원 합의를 통해 민주적 판결문을 작성합니다.' },
      { subtitle: '5쪽: T단계 - 학생 자치 규정 개정 제안서 작성', content: 'T단계 활동: 판결 결과를 바탕으로 불합리한 교내 규칙을 개선하는 제안서를 작성하여 학생 자치회에 제출합니다.' },
      { subtitle: '6쪽: E단계 - 민주시민 역량 평가 및 실천 성찰', content: 'E단계 활동: 민주적 의사결정 태도와 타인 존중 태도를 과정중심 루브릭으로 평가하고 실천 다짐을 나눕니다.' }
    ]
  );

  console.log('All Korean sample PDFs created successfully!');
}

run().catch(console.error);
