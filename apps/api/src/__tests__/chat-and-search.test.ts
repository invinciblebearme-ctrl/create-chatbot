import { describe, it, expect } from 'vitest';
import { generateSearchFallbackAnswer, generateAiAnswer } from '../ai';
import { SearchResult } from '@create-chatbot/shared';
import { Env } from '../env';

describe('Search and AI Answering Tests', () => {
  const mockSearchResults: SearchResult[] = [
    {
      id: 'chunk-1',
      document_id: 'doc-sample-1',
      document_title: '[테스트용 샘플] CREATE 교수·학습 모형 기본 안내서',
      category: 'CREATE 모형 안내',
      grade: '공통',
      subject: '융합/통합',
      page_number: 1,
      content: 'CREATE 모형은 미래 핵심역량 함양을 위해 초등학교 연구학교에서 개발된 학습자 주도형 모델입니다.',
      score: 18.5,
      matched_keywords: ['create', '모형']
    }
  ];

  it('자료 검색 폴백 답변 생성: 출처 제목과 쪽수 포함 확인', () => {
    const answer = generateSearchFallbackAnswer(mockSearchResults);
    expect(answer).toContain('CREATE 교수·학습 모형 기본 안내서');
    expect(answer).toContain('p.1');
    expect(answer).toContain('학습자 주도형 모델');
  });

  it('자료가 없을 때 추측 방지: 확인 불가 안내 문구 반환', () => {
    const emptyAnswer = generateSearchFallbackAnswer([]);
    expect(emptyAnswer).toContain('공식 자료에서 관련된 내용을 확인할 수 없습니다');
  });

  it('AI 답변 생성 시 근거 자료 부재 시 할루시네이션 방지', async () => {
    const mockEnv: Env = {
      DB: {} as any,
      DOCS_BUCKET: {} as any,
      AI: {} as any
    };

    const result = await generateAiAnswer(mockEnv, '존재하지 않는 가상의 단원 알려줘', []);
    expect(result.answer).toContain('제공된 CREATE 연구학교 공식 자료에서 관련된 내용을 확인할 수 없습니다');
    expect(result.modelUsed).toBe('rule-based');
  });
});
