/**
 * 공개 API 라우트 핸들러 (/api/chatbot/*)
 */

import {
  ChatRequest,
  ChatResponse,
  SearchRequest,
  Citation,
  AI_QUOTA_POLICY,
  extractSearchKeywords
} from '@create-chatbot/shared';
import { Env } from '../env';
import {
  searchDocumentsAndChunks,
  listDocuments,
  getDocumentById,
  getTodayAiUsage,
  incrementAiUsage
} from '../db';
import { generateAiAnswer, generateSearchFallbackAnswer } from '../ai';
import { sanitizeUserInput, checkRateLimit } from '../security';

/**
 * KST 기준 오늘 날짜 문자열 (YYYY-MM-DD)
 */
function getKstDateString(): string {
  const d = new Date(Date.now() + 9 * 3600 * 1000);
  return d.toISOString().split('T')[0];
}

/**
 * JSON 응답 생성 헬퍼
 */
export function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    }
  });
}

/**
 * POST /api/chatbot/search
 */
export async function handleSearch(request: Request, env: Env): Promise<Response> {
  const clientIp = request.headers.get('cf-connecting-ip') || '127.0.0.1';
  if (!checkRateLimit(clientIp)) {
    return jsonResponse({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.' }, 429);
  }

  try {
    const body = (await request.json()) as SearchRequest;
    const query = sanitizeUserInput(body.query || '');

    if (!query) {
      return jsonResponse({ error: '검색어를 입력해 주세요.' }, 400);
    }

    const results = await searchDocumentsAndChunks(env.DB, query, body.filter, body.limit || 5);
    const keywords = extractSearchKeywords(query);

    return jsonResponse({
      query,
      keywords,
      count: results.length,
      results
    });
  } catch (err: any) {
    console.error('handleSearch error:', err);
    return jsonResponse({ error: '검색 처리 중 오류가 발생했습니다.', details: err.message }, 500);
  }
}

/**
 * POST /api/chatbot/chat
 */
export async function handleChat(request: Request, env: Env): Promise<Response> {
  const clientIp = request.headers.get('cf-connecting-ip') || '127.0.0.1';
  if (!checkRateLimit(clientIp)) {
    return jsonResponse({ error: '요청 빈도가 초과되었습니다. 1분 후 다시 시도해 주세요.' }, 429);
  }

  try {
    const body = (await request.json()) as ChatRequest;
    const userMessage = sanitizeUserInput(body.message || '');

    if (!userMessage) {
      return jsonResponse({ error: '질문 내용을 입력해 주세요.' }, 400);
    }

    let requestedMode = body.mode || 'search';
    let isFallback = false;
    const todayStr = getKstDateString();
    const model = env.AI_MODEL_NAME || '@cf/meta/llama-3.1-8b-instruct';

    // 1. D1에서 관련 공식 자료 검색
    const searchResults = await searchDocumentsAndChunks(env.DB, userMessage, body.filter, 5);

    // 출처 목록 구성 (서버 검증 출처만 전달)
    const citations: Citation[] = searchResults.map(r => ({
      document_id: r.document_id,
      document_title: r.document_title,
      category: r.category,
      page_number: r.page_number,
      excerpt: r.content.slice(0, 150) + (r.content.length > 150 ? '...' : ''),
      file_url: `/api/chatbot/documents/${r.document_id}/file`
    }));

    // 2. 모드별 분기 처리
    let answerText = '';
    let modeUsed = requestedMode;

    if (requestedMode === 'ai') {
      // 일일 무료 AI 할당량 확인
      let todayRequests = 0;
      try {
        todayRequests = await getTodayAiUsage(env.DB, todayStr, model);
      } catch (e) {
        console.warn('Failed to get ai usage:', e);
      }

      if (todayRequests >= AI_QUOTA_POLICY.DAILY_MAX_REQUESTS) {
        // 일일 한도 초과: 자동으로 검색 모드로 안전 전환
        modeUsed = 'search';
        isFallback = true;
        answerText =
          '> ℹ️ **[안내]** 오늘의 AI 요약 권장 한도에 도달하여 공식 자료 검색 모드로 전환되었습니다.\n\n' +
          generateSearchFallbackAnswer(searchResults);
      } else {
        // Workers AI 생성 호출
        const aiResult = await generateAiAnswer(env, userMessage, searchResults);
        answerText = aiResult.answer;
        isFallback = aiResult.isFallback;
        if (aiResult.isFallback) {
          modeUsed = 'search';
        } else {
          // AI 요청 성공 시 사용량 증가 기록
          try {
            await incrementAiUsage(env.DB, todayStr, model);
          } catch (e) {
            console.warn('Failed to record ai usage:', e);
          }
        }
      }
    } else {
      // 무료 자료 검색 모드 (기본)
      answerText = generateSearchFallbackAnswer(searchResults);
    }

    const responsePayload: ChatResponse = {
      answer: answerText,
      mode_used: modeUsed,
      citations,
      is_fallback: isFallback,
      search_results_count: searchResults.length,
      quota_status: {
        daily_requests: 0,
        daily_limit: AI_QUOTA_POLICY.DAILY_MAX_REQUESTS
      }
    };

    return jsonResponse(responsePayload);
  } catch (err: any) {
    console.error('handleChat error:', err);
    return jsonResponse({ error: '답변 생성 중 오류가 발생했습니다.', details: err.message }, 500);
  }
}

/**
 * GET /api/chatbot/documents
 */
export async function handleListDocuments(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get('category') || undefined;
    const grade = url.searchParams.get('grade') || undefined;
    const subject = url.searchParams.get('subject') || undefined;

    const docs = await listDocuments(env.DB, false, { category, grade, subject });
    return jsonResponse({ count: docs.length, documents: docs });
  } catch (err: any) {
    console.error('handleListDocuments error:', err);
    return jsonResponse({ error: '문서 목록 조회 실패', details: err.message }, 500);
  }
}

/**
 * GET /api/chatbot/documents/:id
 */
export async function handleGetDocument(request: Request, env: Env, docId: string): Promise<Response> {
  try {
    const doc = await getDocumentById(env.DB, docId, false);
    if (!doc) {
      return jsonResponse({ error: '문서를 찾을 수 없습니다.' }, 404);
    }
    return jsonResponse(doc);
  } catch (err: any) {
    console.error('handleGetDocument error:', err);
    return jsonResponse({ error: '문서 조회 실패', details: err.message }, 500);
  }
}

/**
 * GET /api/chatbot/documents/:id/file
 * R2에서 PDF 바이너리 스트리밍 반환
 */
export async function handleGetDocumentFile(request: Request, env: Env, docId: string): Promise<Response> {
  try {
    const doc = await getDocumentById(env.DB, docId, true);
    if (!doc) {
      return jsonResponse({ error: '문서를 찾을 수 없습니다.' }, 404);
    }

    if (!doc.is_public && !request.headers.get('Cf-Access-Jwt-Assertion')) {
      return jsonResponse({ error: '비공개 문서입니다.' }, 403);
    }

    if (!env.DOCS_BUCKET) {
      return jsonResponse({ error: 'R2 스토리지 바인딩이 구성되지 않았습니다.' }, 500);
    }

    const object = await env.DOCS_BUCKET.get(doc.r2_key);
    if (!object) {
      return jsonResponse({ error: 'R2 저장소에 PDF 파일이 존재하지 않습니다.' }, 404);
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', `inline; filename="${encodeURIComponent(doc.title)}.pdf"`);

    return new Response(object.body, { headers });
  } catch (err: any) {
    console.error('handleGetDocumentFile error:', err);
    return jsonResponse({ error: 'PDF 파일 스트리밍 실패', details: err.message }, 500);
  }
}

/**
 * GET /api/chatbot/health
 */
export async function handleHealth(request: Request, env: Env): Promise<Response> {
  let dbOk = false;
  try {
    const res = await env.DB.prepare('SELECT 1 as alive').first();
    dbOk = !!res;
  } catch {}

  return jsonResponse({
    status: 'healthy',
    service: 'CREATE AI 수업 도우미 API Worker',
    database: dbOk ? 'connected' : 'disconnected',
    environment: env.ENVIRONMENT || 'production',
    timestamp: new Date().toISOString()
  });
}
