import { describe, it, expect, vi } from 'vitest';
import { generateSearchFallbackAnswer, generateAiAnswer, generateJeonbukAiAnswer } from '../ai';
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

  it('전북AI 미설정 시 설정 안내와 공식 검색 폴백을 안전하게 반환', async () => {
    const mockEnv: Env = {
      DB: {} as any,
      DOCS_BUCKET: {} as any,
      AI: undefined as any
    };

    const result = await generateJeonbukAiAnswer(
      mockEnv,
      'CREATE 모형이란?',
      mockSearchResults,
      {
        apiKey: '',
        chatbotId: '',
        model: 'claude-sonnet-5',
        baseUrl: 'https://api.baze.co/v1/gateway',
        useRagContext: true
      }
    );

    expect(result.isFallback).toBe(true);
    expect(result.modelUsed).toBe('jeonbuk-unconfigured');
    expect(result.answer).toContain('전북AI 연동 설정 안내');
  });

  it('전북AI 스튜디오 챗봇 엔드포인트(/v1/gateway/chatbots/{chatbot_id}/chat/completions/) 정상 호출 확인', async () => {
    const mockEnv: Env = {
      DB: {} as any,
      DOCS_BUCKET: {} as any,
      AI: undefined as any
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: '전북AI 스튜디오 챗봇이 생성한 CREATE 모형 답변입니다.' } }]
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const result = await generateJeonbukAiAnswer(
      mockEnv,
      'CREATE 모형 6단계 설명해줘',
      mockSearchResults,
      {
        apiKey: 'test-baze-key',
        chatbotId: 'studio-bot-123',
        model: 'claude-sonnet-5',
        baseUrl: 'https://api.baze.co/v1/gateway',
        useRagContext: true
      }
    );

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0][0]).toBe(
      'https://api.baze.co/v1/gateway/chatbots/studio-bot-123/chat/completions/'
    );
    expect(result.isFallback).toBe(false);
    expect(result.modelUsed).toBe('jeonbuk-chatbot:studio-bot-123');
    expect(result.answer).toContain('전북AI 스튜디오 챗봇이 생성한 CREATE 모형 답변입니다.');

    fetchSpy.mockRestore();
  });

  it('2번 방식(API 키 + 기본 게이트웨이 /v1/gateway/chat/completions/ + CREATE 시스템 프롬프트 & D1 자료 결합) 정상 호출 확인', async () => {
    const mockEnv: Env = {
      DB: {} as any,
      DOCS_BUCKET: {} as any,
      AI: undefined as any
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: '전북AI 게이트웨이(claude-sonnet-5)가 공식 자료를 바탕으로 생성한 답변입니다.' } }]
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const result = await generateJeonbukAiAnswer(
      mockEnv,
      '5학년 과학 수업 설계 아이디어 알려줘',
      mockSearchResults,
      {
        apiKey: 'test-baze-key',
        chatbotId: '',
        model: 'claude-sonnet-5',
        baseUrl: 'https://api.baze.co/v1/gateway',
        useRagContext: true
      }
    );

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0][0]).toBe('https://api.baze.co/v1/gateway/chat/completions/');
    const sentBody = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
    expect(sentBody.model).toBe('claude-sonnet-5');
    expect(sentBody.messages[0].role).toBe('system');
    expect(sentBody.messages[0].content).toContain('CREATE 교수·학습 모형');
    expect(sentBody.messages[1].content).toContain('CREATE 수업설계 모형 길잡이');
    expect(result.isFallback).toBe(false);
    expect(result.modelUsed).toBe('jeonbuk:claude-sonnet-5');
    expect(result.answer).toContain('전북AI 게이트웨이(claude-sonnet-5)');

    fetchSpy.mockRestore();
  });
});
