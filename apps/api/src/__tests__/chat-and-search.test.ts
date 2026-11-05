import { describe, it, expect } from 'vitest';
import { generateSearchFallbackAnswer, generateAiAnswer } from '../ai';
import { SearchResult } from '@create-chatbot/shared';
import { Env } from '../env';

describe('Search and AI Answering Tests', () => {
  const mockSearchResults: SearchResult[] = [
    {
      id: 'chunk-1',
      document_id: 'doc-sample-1',
      document_title: 'CREATE 수업설계 모형 길잡이',
      category: 'CREATE 모형 안내',
      grade: '공통',
      subject: '융합/통합',
      page_number: 1,
      content: 'CREATE 모형은 미래 핵심역량 함양을 위해 초등학교 연구학교에서 개발된 학습자 주도형 모델입니다.',
      score: 18.5,
      matched_keywords: ['create', '모형']
    }
  ];

  it('자료 검색 폴백 답변 생성: 출처 제목과 쪽수 및 CREATE 모형 요약 포함 확인', () => {
    const answer = generateSearchFallbackAnswer(mockSearchResults);
    expect(answer).toContain('CREATE 수업설계 모형 길잡이');
    expect(answer).toContain('p.1');
    expect(answer).toContain('CREATE 6단계 교수·학습 모형');
  });

  it('자료가 검색되지 않아도 CREATE 모형 안내 및 환류 가이드 제공', () => {
    const emptyAnswer = generateSearchFallbackAnswer([], '수업 설계 팁 알려줘');
    expect(emptyAnswer).toContain('CREATE 6단계 교수·학습 모형 요약');
    expect(emptyAnswer).toContain('단계의 흐름 및 환류 규칙');
  });

  it('AI 답변 생성 시 AI 서비스 미연동 상태에서도 안전하게 모형 가이드 폴백 제공', async () => {
    const mockEnv: Env = {
      DB: {} as any,
      DOCS_BUCKET: {} as any,
      AI: undefined as any
    };

    const result = await generateAiAnswer(mockEnv, '수업 설계 시 유의할 점 알려줘', []);
    expect(result.answer).toContain('CREATE 6단계 교수·학습 모형 요약');
    expect(result.isFallback).toBe(true);
    expect(result.modelUsed).toBe('fallback-search');
  });
});
