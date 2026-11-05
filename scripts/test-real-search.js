const fs = require('fs');
const path = require('path');
const { calculateRelevanceScore, extractSearchKeywords } = require('../packages/shared/dist/index.js');

// 0002_seed_data.sql 파일에서 청크 파싱
const sql = fs.readFileSync(path.join(__dirname, '../migrations/0002_seed_data.sql'), 'utf-8');

// 청크 추출 정규식
const chunkRegex = /\(\s*'([^']+)',\s*'([^']+)',\s*(\d+),\s*(\d+),\s*'((?:[^']|'')*)',\s*'((?:[^']|'')*)'\s*\)/g;
const chunks = [];
let match;
while ((match = chunkRegex.exec(sql)) !== null) {
  chunks.push({
    id: match[1],
    docId: match[2],
    page: parseInt(match[3]),
    chunkIdx: parseInt(match[4]),
    content: match[5].replace(/''/g, "'"),
    searchText: match[6].replace(/''/g, "'")
  });
}

console.log(`Parsed ${chunks.length} chunks from real seed data.`);

// 문서 제목 매핑
const docTitles = {
  'doc-guide-manual': 'CREATE 수업설계 모형 길잡이',
  'doc-design-grade1': '1학년 수학 CREATE모형 단원설계안',
  'doc-design-grade2': '2학년 통합 CREATE모형 단원설계안',
  'doc-design-grade3': '3학년 과학 CREATE모형 단원설계안',
  'doc-design-grade4': '4학년 과학 CREATE모형 단원설계안',
  'doc-design-grade5': '5학년 사회 CREATE모형 단원설계안',
  'doc-design-grade6': '6학년 실과 CREATE모형 단원설계안',
  'doc-lesson-sci-5': '5학년 과학 CREATE모형 수업지도안',
  'doc-lesson-sci-6': '6학년 과학 CREATE모형 수업지도안',
  'doc-lesson-eng-4': '4학년 영어 CREATE모형 수업지도안',
  'doc-lesson-eng-5': '5학년 영어 CREATE모형 수업지도안',
  'doc-lesson-eng-6': '6학년 영어 CREATE모형 수업지도안',
  'doc-lesson-pe-4': '4학년 체육 CREATE모형 수업지도안',
  'doc-lesson-pe-6': '6학년 체육 CREATE모형 수업지도안',
  'doc-lesson-health-5': '5학년 보건 CREATE모형 수업지도안',
  'doc-lesson-int-2': '2학년 통합 CREATE모형 수업지도안'
};

function search(query) {
  const keywords = extractSearchKeywords(query);
  console.log(`\n========================================`);
  console.log(`Query: "${query}"`);
  console.log(`Extracted Keywords: ${keywords.join(', ')}`);

  const scored = chunks.map(c => {
    const title = docTitles[c.docId] || '';
    const res = calculateRelevanceScore(c.content + ' ' + c.searchText, keywords, title);
    return {
      docTitle: title,
      page: c.page,
      score: res.score,
      matched: res.matchedKeywords,
      content: c.content
    };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 3);
  top.forEach((r, idx) => {
    console.log(`\n[Top ${idx + 1}] 출처: <${r.docTitle}> (${r.page}쪽) - 점수: ${r.score}`);
    console.log(`내용 미리보기: ${r.content.slice(0, 200)}...`);
  });
}

search('CREATE 모형은 어떤 단계로 구성되나요?');
search('진단 단계와 탐색 단계 설명해줘');
search('5학년 사회 단원설계안 찾아줘');
search('전이와 성장 단계의 활동');
