/**
 * 한국어 검색 및 텍스트 처리 유틸리티
 */

import { CREATE_SYNONYM_MAP, UPLOAD_LIMITS } from './constants';

const KOREAN_STOPWORDS = new Set([
  '은', '는', '이', '가', '을', '를', '의', '에', '에서', '로', '으로',
  '과', '와', '도', '만', '하고', '에게', '한테', '께',
  '무엇인가요', '무엇인가', '어떤', '어떻게', '알려주세요', '찾아주세요',
  '있나요', '있을까요', '대해', '대한', '관한', '관하여', '등', '및', '수',
  '좀', '잘', '더', '그', '이것', '저것', '해주세요', '가요', '나요'
]);

/**
 * 텍스트 정규화 (공백 정리, 특수문자 완화, 소문자화)
 */
export function normalizeKoreanText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[^\w\s가-힣ㄱ-ㅎㅏ-ㅣ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 질문에서 한국어 검색 키워드 추출 (불용어 제거 및 동의어 확장)
 */
export function extractSearchKeywords(query: string): string[] {
  const normalized = normalizeKoreanText(query);
  const rawWords = normalized.split(' ').filter(w => w.length > 0);

  const keywords = new Set<string>();

  for (const word of rawWords) {
    // 직접 불용어인 경우 제외
    if (KOREAN_STOPWORDS.has(word)) continue;

    // 조사/어미 분리 (단어 뒤 불용어 조사 제거)
    let cleaned = word;
    for (const stop of [
      '무엇인가요', '알려주세요', '찾아주세요', '있나요', '인가요', '에서', '으로',
      '은', '는', '이', '가', '을', '를', '의', '에', '로', '과', '와', '도', '만'
    ]) {
      if (cleaned.length > stop.length + 1 && cleaned.endsWith(stop)) {
        cleaned = cleaned.substring(0, cleaned.length - stop.length);
        break;
      }
    }

    if (cleaned.length >= 2 && !KOREAN_STOPWORDS.has(cleaned)) {
      keywords.add(cleaned);

      // 동의어 사전 확장
      for (const [key, synonyms] of Object.entries(CREATE_SYNONYM_MAP)) {
        if (cleaned.includes(key) || synonyms.some(s => cleaned.includes(s))) {
          synonyms.forEach(syn => keywords.add(syn));
        }
      }
    }
  }

  // 영문 CREATE 키워드 단독 처리
  if (/create/i.test(query)) {
    keywords.add('create');
    keywords.add('크리에이트');
  }

  return Array.from(keywords);
}

/**
 * 한국어 바이그램 (2-gram) 생성 (FTS가 지원되지 않거나 보조 인덱싱이 필요할 때 활용)
 */
export function generateBiGrams(text: string): string[] {
  const normalized = normalizeKoreanText(text).replace(/\s+/g, '');
  const biGrams = new Set<string>();

  if (normalized.length < 2) {
    if (normalized.length === 1) biGrams.add(normalized);
    return Array.from(biGrams);
  }

  for (let i = 0; i < normalized.length - 1; i++) {
    biGrams.add(normalized.substring(i, i + 2));
  }

  return Array.from(biGrams);
}

/**
 * 검색 관련도 점수 계산 (키워드 빈도, 정확 일치, 위치 가중치)
 */
export function calculateRelevanceScore(
  content: string,
  keywords: string[],
  docTitle?: string
): { score: number; matchedKeywords: string[] } {
  if (!content || keywords.length === 0) {
    return { score: 0, matchedKeywords: [] };
  }

  const lowerContent = content.toLowerCase();
  const lowerTitle = (docTitle || '').toLowerCase();
  const matched = new Set<string>();
  let score = 0;

  for (const keyword of keywords) {
    const kw = keyword.toLowerCase();

    // 1. 문서 제목 일치 시 매우 높은 가중치
    if (lowerTitle.includes(kw)) {
      score += 15;
      matched.add(keyword);
    }

    // 2. 본문 일치 빈도 및 위치 점수
    let index = lowerContent.indexOf(kw);
    let count = 0;
    while (index !== -1 && count < 10) {
      count++;
      score += (count === 1 ? 5 : 2);
      // 앞부분에 등장할수록 추가 점수
      if (index < 100) score += 2;
      index = lowerContent.indexOf(kw, index + kw.length);
    }

    if (count > 0) {
      matched.add(keyword);
    }
  }

  // 매칭된 키워드 비율 보너스
  const matchRatio = matched.size / keywords.length;
  score = score * (1 + matchRatio);

  return {
    score: Math.round(score * 10) / 10,
    matchedKeywords: Array.from(matched)
  };
}

/**
 * 긴 텍스트를 검색 가능한 의미 단위 청크(Chunk)로 분할
 */
export function splitTextIntoChunks(
  text: string,
  targetSize = UPLOAD_LIMITS.CHUNK_TARGET_SIZE,
  overlap = UPLOAD_LIMITS.CHUNK_OVERLAP_SIZE
): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.length <= targetSize) return [trimmed];

  const chunks: string[] = [];
  const paragraphs = trimmed.split(/\n\s*\n/);

  let currentChunk = '';

  for (const para of paragraphs) {
    const cleanPara = para.trim();
    if (!cleanPara) continue;

    if (currentChunk.length + cleanPara.length + 1 <= targetSize) {
      currentChunk += (currentChunk ? '\n\n' : '') + cleanPara;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
        // 오버랩 생성: 이전 청크 끝부분 일부를 보존
        const overlapText = currentChunk.slice(-overlap);
        currentChunk = overlapText + '\n' + cleanPara;
      } else {
        // 단일 문단이 targetSize보다 큰 경우 문장 단위 분할
        const sentences = cleanPara.split(/(?<=[.?!])\s+/);
        for (const sentence of sentences) {
          if (currentChunk.length + sentence.length + 1 <= targetSize) {
            currentChunk += (currentChunk ? ' ' : '') + sentence;
          } else {
            if (currentChunk) chunks.push(currentChunk);
            currentChunk = sentence;
          }
        }
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
