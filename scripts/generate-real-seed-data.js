const fs = require('fs');
const path = require('path');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

const resourcesDir = path.join(__dirname, '../apps/web/src/components/resources');
const publicResourcesDir = path.join(__dirname, '../apps/web/public/resources');

// 1. 복사 대상 폴더 준비
if (!fs.existsSync(publicResourcesDir)) {
  fs.mkdirSync(publicResourcesDir, { recursive: true });
}

// 2. 문서 메타데이터 정의 (16개 실제 연구학교 PDF)
const DOC_METADATA = [
  {
    fileName: 'CREATE 수업설계 모형 길잡이.pdf',
    id: 'doc-guide-manual',
    title: 'CREATE 수업설계 모형 길잡이',
    description: '초등학교 연구학교 CREATE 교수·학습 모형의 개념, 6단계(진단 Check & Context, 탐색 Research & Resource, 실행 Engage & Experience, 분석 Analyze & Assess, 전이 Transfer & Transform, 성장 Evaluate & Extend), 단계별 활동 및 수업 설계 원칙을 안내하는 공식 길잡이 매뉴얼입니다.',
    category: 'CREATE 모형 안내',
    grade: '공통',
    subject: '융합/통합',
    tags: ['CREATE모형', '진단', '탐색', '실행', '분석', '전이', '성장', '길잡이', '수업설계', '연구학교']
  },
  {
    fileName: 'CREATE모형 단원설계안(1학년).pdf',
    id: 'doc-design-grade1',
    title: '1학년 수학 CREATE모형 단원설계안 (3. 모양과 시각)',
    description: '1학년 2학기 수학 3단원 모양과 시각(AI와 디지털 도구를 활용하여 알아가는 여러 가지 모양)에 CREATE 모형을 적용한 단원설계안입니다.',
    category: '학년별 단원설계안',
    grade: '1학년',
    subject: '수학',
    tags: ['단원설계안', '1학년', '수학', '모양과시각', '도형', 'AI디지털']
  },
  {
    fileName: 'CREATE모형 단원설계안(2학년).pdf',
    id: 'doc-design-grade2',
    title: '2학년 통합 CREATE모형 단원설계안 (여러 나라를 알고, 체험하며, 존중하기)',
    description: '2학년 1학기 통합교과(세계) 여러 나라를 알고, 체험하며, 존중하기 단원에 CREATE 모형을 적용한 단원설계안입니다.',
    category: '학년별 단원설계안',
    grade: '2학년',
    subject: '통합',
    tags: ['단원설계안', '2학년', '통합', '세계', '다문화', '체험']
  },
  {
    fileName: 'CREATE모형 단원설계안(3학년).pdf',
    id: 'doc-design-grade3',
    title: '3학년 과학 CREATE모형 단원설계안 (3. 식물의 생활)',
    description: '3학년 1학기 과학 3단원 식물의 생활(디지털 돋보기와 AI로 탐사하는 우리 주변의 식물 세계)에 CREATE 모형을 적용한 단원설계안입니다.',
    category: '학년별 단원설계안',
    grade: '3학년',
    subject: '과학',
    tags: ['단원설계안', '3학년', '과학', '식물의생활', '디지털돋보기', 'AI생태탐사']
  },
  {
    fileName: 'CREATE모형 단원설계안(4학년).pdf',
    id: 'doc-design-grade4',
    title: '4학년 과학 CREATE모형 단원설계안 (모두가 연결된 생태계, 그 속의 우리들)',
    description: '4학년 2학기 과학 2단원 생물과 환경(모두가 연결된 생태계, 그 속의 우리들)에 CREATE 6단계를 적용한 단원설계안입니다.',
    category: '학년별 단원설계안',
    grade: '4학년',
    subject: '과학',
    tags: ['단원설계안', '4학년', '과학', '생태계', '생물과환경', '환경보호']
  },
  {
    fileName: 'CREATE모형 단원설계안(5학년).pdf',
    id: 'doc-design-grade5',
    title: '5학년 사회 CREATE모형 단원설계안 (대한민국 인구지도의 비밀)',
    description: '5학년 1학기 사회 2단원 우리나라의 경제 발전(대한민국 인구지도의 비밀: 모이는 곳, 떠나는 곳, 그리고 우리의 미래)에 CREATE 모형을 적용한 단원설계안입니다.',
    category: '학년별 단원설계안',
    grade: '5학년',
    subject: '사회',
    tags: ['단원설계안', '5학년', '사회', '인구지도', '인구변화', '지역사회']
  },
  {
    fileName: 'CREATE모형 단원설계안(6학년).pdf',
    id: 'doc-design-grade6',
    title: '6학년 실과 CREATE모형 단원설계안 (생활 속 문제해결로봇 만들기)',
    description: '6학년 2학기 실과 7단원 로봇과 융합기술(코딩의 기초를 다지고, 생활 속 문제해결로봇 만들기)에 CREATE 모형을 적용한 단원설계안입니다.',
    category: '학년별 단원설계안',
    grade: '6학년',
    subject: '실과',
    tags: ['단원설계안', '6학년', '실과', '로봇', '코딩', '문제해결', '피지컬컴퓨팅']
  },
  {
    fileName: 'CREATE모형 수업지도안(과학)(5학년).pdf',
    id: 'doc-lesson-sci-5',
    title: '5학년 과학 CREATE모형 수업지도안 (2. 날씨와 우리 생활)',
    description: '5학년 2학기 과학 2단원 날씨와 우리 생활에 CREATE 모형을 적용한 실증수업 교수학습 지도안입니다.',
    category: '실증수업 지도안',
    grade: '5학년',
    subject: '과학',
    tags: ['수업지도안', '5학년', '과학', '날씨와우리생활', '습도', '기상']
  },
  {
    fileName: 'CREATE모형 수업지도안(과학)(6학년).pdf',
    id: 'doc-lesson-sci-6',
    title: '6학년 과학 CREATE모형 수업지도안 (2. 물질의 연소)',
    description: '6학년 2학기 과학 2단원 물질의 연소에 CREATE 모형을 적용한 실증수업 교수학습 지도안입니다.',
    category: '실증수업 지도안',
    grade: '6학년',
    subject: '과학',
    tags: ['수업지도안', '6학년', '과학', '물질의연소', '연소조건', '소화']
  },
  {
    fileName: 'CREATE모형 수업지도안(영어)(4학년).pdf',
    id: 'doc-lesson-eng-4',
    title: '4학년 영어 CREATE모형 수업지도안 (Lesson 6. Where\'s My Cap?)',
    description: '4학년 1학기 영어 6단원 물건의 위치를 묻고 답하기에 CREATE 모형을 적용한 실증수업 교수학습 지도안입니다.',
    category: '실증수업 지도안',
    grade: '4학년',
    subject: '영어',
    tags: ['수업지도안', '4학년', '영어', '위치묻기', 'WheresMyCap']
  },
  {
    fileName: 'CREATE모형 수업지도안(영어)(5학년).pdf',
    id: 'doc-lesson-eng-5',
    title: '5학년 영어 CREATE모형 수업지도안 (Lesson 5. Let\'s go shopping)',
    description: '5학년 1학기 영어 5단원 물건 가격 묻고 답하기에 CREATE 모형을 적용한 실증수업 교수학습 지도안입니다.',
    category: '실증수업 지도안',
    grade: '5학년',
    subject: '영어',
    tags: ['수업지도안', '5학년', '영어', '쇼핑', '가격묻기', 'LetsGoShopping']
  },
  {
    fileName: 'CREATE모형 수업지도안(영어)(6학년).pdf',
    id: 'doc-lesson-eng-6',
    title: '6학년 영어 CREATE모형 수업지도안 (Lesson 6. He Has Blue Eyes)',
    description: '6학년 1학기 영어 6단원 인물의 외모 묘사하기에 CREATE 모형을 적용한 실증수업 교수학습 지도안입니다.',
    category: '실증수업 지도안',
    grade: '6학년',
    subject: '영어',
    tags: ['수업지도안', '6학년', '영어', '외모묘사', 'HeHasBlueEyes']
  },
  {
    fileName: 'CREATE모형 수업지도안(체육)(4학년).pdf',
    id: 'doc-lesson-pe-4',
    title: '4학년 체육 CREATE모형 수업지도안 (3. 표현 - 몸으로 표현하기)',
    description: '4학년 1학기 체육 3단원 표현(움직임 요소를 활용하여 몸으로 생각과 느낌 표현하기)에 CREATE 모형을 적용한 실증수업 교수학습 지도안입니다.',
    category: '실증수업 지도안',
    grade: '4학년',
    subject: '체육',
    tags: ['수업지도안', '4학년', '체육', '표현활동', '신체표현']
  },
  {
    fileName: 'CREATE모형 수업지도안(체육)(6학년).pdf',
    id: 'doc-lesson-pe-6',
    title: '6학년 체육 CREATE모형 수업지도안 (1. 운동 - 순발력 기르기)',
    description: '6학년 2학기 체육 1단원 운동체력(스포츠 기술을 더하는 운동 체력 - 순발력 기르기)에 CREATE 모형을 적용한 실증수업 교수학습 지도안입니다.',
    category: '실증수업 지도안',
    grade: '6학년',
    subject: '체육',
    tags: ['수업지도안', '6학년', '체육', '운동체력', '순발력', '기록도전']
  },
  {
    fileName: 'CREATE모형 수업지도안(보건)(5학년).pdf',
    id: 'doc-lesson-health-5',
    title: '5학년 보건 CREATE모형 수업지도안 (건강한 생활 습관 만들기)',
    description: '5학년 2학기 보건 건강한 발달을 위한 건강한 생활 습관 만들기에 CREATE 모형을 적용한 실증수업 교수학습 지도안입니다.',
    category: '실증수업 지도안',
    grade: '5학년',
    subject: '보건',
    tags: ['수업지도안', '5학년', '보건', '생활습관', '성장발달', '자기관리']
  },
  {
    fileName: 'CREATE모형 수업지도안(통합)(2학년).pdf',
    id: 'doc-lesson-int-2',
    title: '2학년 통합 CREATE모형 수업지도안 (출발! 안전한 세계 탐험대)',
    description: '2학년 1학기 통합(세계-안전) 출발! 안전한 세계 탐험대에 CREATE 모형을 적용한 실증수업 교수학습 지도안입니다.',
    category: '실증수업 지도안',
    grade: '2학년',
    subject: '통합',
    tags: ['수업지도안', '2학년', '통합', '안전', '세계탐험']
  }
];

// 검색 텍스트 생성 유틸
function buildSearchText(text) {
  if (!text) return '';
  const clean = text
    .toLowerCase()
    .replace(/[^\w\s가-힣ㄱ-ㅎㅏ-ㅣ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 바이그램 생성
  const words = clean.split(' ').filter(w => w.length > 0);
  const bigrams = [];
  for (const w of words) {
    if (w.length >= 2) {
      for (let i = 0; i < w.length - 1; i++) {
        bigrams.push(w.substring(i, i + 2));
      }
    }
  }
  return (words.join(' ') + ' ' + bigrams.join(' ')).slice(0, 3000);
}

// SQL 문자열 이스케이프
function escapeSql(str) {
  if (!str) return '';
  return str.replace(/'/g, "''");
}

async function main() {
  console.log('Starting Real PDF Extraction and Seed Data Generation...');

  // 1. PDF 파일 복사 (public/resources)
  for (const doc of DOC_METADATA) {
    const src = path.join(resourcesDir, doc.fileName);
    const dest = path.join(publicResourcesDir, doc.fileName);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
    }
  }
  console.log(`Copied ${DOC_METADATA.length} PDFs to apps/web/public/resources`);

  // 2. 문서별 텍스트 추출 및 청크 생성
  const allDocInserts = [];
  const allChunkInserts = [];

  for (const meta of DOC_METADATA) {
    const filePath = path.join(resourcesDir, meta.fileName);
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${filePath}`);
      continue;
    }

    const data = new Uint8Array(fs.readFileSync(filePath));
    const pdfDoc = await pdfjsLib.getDocument({ data }).promise;
    const pageCount = pdfDoc.numPages;

    allDocInserts.push(`(
  '${meta.id}',
  '${escapeSql(meta.title)}',
  '${escapeSql(meta.description)}',
  '${meta.category}',
  '${meta.grade}',
  '${meta.subject}',
  '${JSON.stringify(meta.tags)}',
  '${escapeSql(meta.fileName)}',
  ${pageCount},
  'COMPLETED',
  1,
  datetime('now', '+9 hours'),
  datetime('now', '+9 hours')
)`);

    // 페이지별 청크 추출
    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      let rawText = textContent.items.map(it => it.str).join(' ');
      // 널문자 제거 및 공백 정규화
      rawText = rawText.replace(/\u0000/g, ' ').replace(/\s+/g, ' ').trim();

      if (!rawText) {
        rawText = `${meta.title} - ${pageNum}쪽 (관련 활동 내용 및 지도안 도표 자료)`;
      }

      // 너무 긴 페이지는 700자 단위 청크로 분할
      const chunkSize = 700;
      let chunkIdx = 0;
      for (let offset = 0; offset < rawText.length; offset += chunkSize) {
        const chunkContent = rawText.slice(offset, offset + chunkSize + 100);
        const chunkId = `chunk-${meta.id}-p${pageNum}-${chunkIdx}`;
        const searchText = buildSearchText(meta.title + ' ' + chunkContent);

        allChunkInserts.push(`(
  '${chunkId}',
  '${meta.id}',
  ${pageNum},
  ${chunkIdx},
  '${escapeSql(chunkContent)}',
  '${escapeSql(searchText)}'
)`);
        chunkIdx++;
        if (offset + chunkSize >= rawText.length) break;
      }
    }
    console.log(`Processed: ${meta.title} (${pageCount} pages)`);
  }

  // 3. SQL 파일 생성 (migrations/0002_seed_data.sql)
  const sqlContent = `-- ===================================================
-- CREATE AI 수업 도우미 - 공식 연구학교 실제 교육자료 데이터
-- 소속: 2026 교육부 요청 전북특별자치도교육청지정 AI 디지털 활용 연구학교 군산초등학교
-- 총 ${DOC_METADATA.length}종 공식 매뉴얼, 단원설계안, 실증수업 지도안
-- ===================================================

-- 기존 데이터 초기화 (신규 실제 자료로 전면 대체)
DELETE FROM document_chunks;
DELETE FROM documents;

-- 1. 공식 교육 자료 등록 (${DOC_METADATA.length}종)
INSERT INTO documents (id, title, description, category, grade, subject, tags, r2_key, page_count, status, is_public, created_at, updated_at)
VALUES
${allDocInserts.join(',\n')};

-- 2. 실제 연구학교 자료 청크(Chunk) 및 한국어 바이그램 색인 등록 (총 ${allChunkInserts.length}개)
INSERT INTO document_chunks (id, document_id, page_number, chunk_index, content, search_text)
VALUES
${allChunkInserts.join(',\n')};
`;

  const migrationPath = path.join(__dirname, '../migrations/0002_seed_data.sql');
  fs.writeFileSync(migrationPath, sqlContent, 'utf-8');
  console.log(`Successfully generated migration file: ${migrationPath} (${(sqlContent.length / 1024).toFixed(1)} KB, ${allChunkInserts.length} chunks)`);

  // 4. apps/api/src/init-sql.ts 업데이트
  const initSqlPath = path.join(__dirname, '../apps/api/src/init-sql.ts');
  const initSqlTsContent = `/**
 * Cloudflare D1 자동 초기화 SQL
 * 공식 연구학교 실제 교육자료 (${DOC_METADATA.length}종)
 */

export const INITIAL_SCHEMA_SQL = \`
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  grade TEXT,
  subject TEXT,
  tags TEXT,
  r2_key TEXT NOT NULL,
  page_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'PENDING',
  is_public INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now', '+9 hours')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', '+9 hours'))
);

CREATE TABLE IF NOT EXISTS document_chunks (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  page_number INTEGER NOT NULL,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  search_text TEXT,
  FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  model_name TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  tokens_used INTEGER DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now', '+9 hours'))
);

CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_grade ON documents(grade);
CREATE INDEX IF NOT EXISTS idx_documents_subject ON documents(subject);
CREATE INDEX IF NOT EXISTS idx_chunks_document ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_chunks_page ON document_chunks(document_id, page_number);
CREATE INDEX IF NOT EXISTS idx_ai_usage_date ON ai_usage_logs(date);
\`;

export const SEED_DATA_SQL = \`
${sqlContent.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\${/g, '\\${')}
\`;
`;
  fs.writeFileSync(initSqlPath, initSqlTsContent, 'utf-8');
  console.log(`Successfully updated ${initSqlPath}`);
}

main().catch(err => {
  console.error('Generation failed:', err);
  process.exit(1);
});
