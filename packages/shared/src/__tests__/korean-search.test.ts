import { describe, it, expect } from 'vitest';
import {
  normalizeKoreanText,
  extractSearchKeywords,
  generateBiGrams,
  calculateRelevanceScore,
  splitTextIntoChunks
} from '../korean-search';

describe('Korean Search Utilities', () => {
  it('정규화 테스트: 특수문자 및 연속 공백 제거', () => {
    const raw = '  [CREATE] 교수·학습   모형이란?  \n  ';
    const normalized = normalizeKoreanText(raw);
    expect(normalized).toBe('create 교수 학습 모형이란');
  });

  it('키워드 추출 테스트: 추천 질문 1 (CREATE 모형이란 무엇인가요?)', () => {
    const query = 'CREATE 모형이란 무엇인가요?';
    const keywords = extractSearchKeywords(query);

    expect(keywords).toContain('create');
    expect(keywords).toContain('모형');
  });

  it('키워드 추출 테스트: 추천 질문 2 (CREATE 모형은 어떤 단계로 구성되나요?)', () => {
    const query = 'CREATE 모형은 어떤 단계로 구성되나요?';
    const keywords = extractSearchKeywords(query);

    expect(keywords).toContain('create');
    expect(keywords).toContain('모형');
    expect(keywords).toContain('단계');
  });

  it('키워드 추출 테스트: 추천 질문 4 (학년별 단원설계안을 찾아주세요)', () => {
    const query = '학년별 단원설계안을 찾아주세요.';
    const keywords = extractSearchKeywords(query);

    expect(keywords.some(k => k.includes('단원설계'))).toBe(true);
  });

  it('바이그램 생성 테스트: 2글자 단위 분할', () => {
    const bigrams = generateBiGrams('교수학습');
    expect(bigrams).toEqual(expect.arrayContaining(['교수', '수한', '학습'].filter(b => '교수학습'.includes(b))));
    expect(bigrams).toContain('교수');
    expect(bigrams).toContain('학습');
  });

  it('관련도 점수 계산 테스트: 제목 일치 시 가중치 확인', () => {
    const keywords = ['단원설계안', '과학'];
    const titleMatch = calculateRelevanceScore('내용입니다.', keywords, '5학년 과학 단원설계안');
    const bodyMatch = calculateRelevanceScore('과학 단원설계안 내용입니다.', keywords, '일반 문서');

    expect(titleMatch.score).toBeGreaterThan(bodyMatch.score);
    expect(titleMatch.matchedKeywords).toContain('단원설계안');
    expect(titleMatch.matchedKeywords).toContain('과학');
  });

  it('청크 분할 테스트: 긴 텍스트를 목표 크기 내로 분할', () => {
    const longText = `
      1단락: CREATE 모형의 첫 번째 단계는 C단계입니다. 실생활 문제와 학습 동기를 연결합니다.
      
      2단락: 두 번째 단계는 R단계로 관련 정보를 수집하고 원리를 탐구합니다.
      
      3단락: 세 번째 단계는 E단계로 아이디어를 발상하고 실험적 탐색을 수행합니다.
    `.repeat(5);

    const chunks = splitTextIntoChunks(longText, 200, 40);
    expect(chunks.length).toBeGreaterThan(1);
    chunks.forEach(chunk => {
      expect(chunk.length).toBeGreaterThan(0);
    });
  });
});
