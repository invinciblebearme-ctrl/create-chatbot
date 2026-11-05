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
import { generateSamplePdf } from '../sample-pdf';
import { runDatabaseSetup } from '../db-setup';

let isDbInitialized = false;

/**
 * D1 데이터베이스 테이블 및 시드 데이터 자동 초기화 (자가 복구)
 */
export async function ensureDatabase(env: Env): Promise<void> {
  if (isDbInitialized) return;
  try {
    const tableCheck = await env.DB.prepare("SELECT count(*) as cnt FROM sqlite_master WHERE type='table' AND name='documents'").first<{ cnt: number }>();
    if (!tableCheck || tableCheck.cnt === 0) {
      console.log('D1 documents table missing. Initializing schema and seed data...');
      await runDatabaseSetup(env);
      isDbInitialized = true;
      return;
    }

    // 1. 기존 잔여 샘플 데이터가 있으면 전면 삭제 후 공식 데이터 적재
    const sampleCheck = await env.DB.prepare("SELECT count(*) as cnt FROM documents WHERE id LIKE 'doc-sample%' OR title LIKE '%테스트용%'").first<{ cnt: number }>();
    if (sampleCheck && sampleCheck.cnt > 0) {
      console.log('Old sample documents found in D1. Purging and reseeding...');
      try {
        await env.DB.prepare("DELETE FROM document_chunks WHERE document_id LIKE 'doc-sample%'").run();
        await env.DB.prepare("DELETE FROM documents WHERE id LIKE 'doc-sample%' OR title LIKE '%테스트용%'").run();
        await env.DB.prepare("DELETE FROM faq WHERE source_document_id LIKE 'doc-sample%'").run();
      } catch {}
      await runDatabaseSetup(env);
      isDbInitialized = true;
      return;
    }

    // 2. 공식 연구학교 자료(doc-guide-manual) 적재 여부 확인
    const guideCheck = await env.DB.prepare("SELECT count(*) as cnt FROM documents WHERE id = 'doc-guide-manual'").first<{ cnt: number }>();
    if (!guideCheck || guideCheck.cnt === 0) {
      console.log('D1 documents table exists but official seed data missing. Initializing seed data...');
      await runDatabaseSetup(env);
    }
    isDbInitialized = true;
  } catch (err: any) {
    console.error('ensureDatabase error, trying safe setup:', err);
    try {
      await runDatabaseSetup(env);
      isDbInitialized = true;
    } catch (e2) {
      console.error('Failed to auto-init database:', e2);
    }
  }
}

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
    await ensureDatabase(env);
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
    await ensureDatabase(env);
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

    const staticMap: Record<string, string> = {
      'doc-guide-manual': 'CREATE 수업설계 모형 길잡이.pdf',
      'doc-design-grade1': 'CREATE모형 단원설계안(1학년).pdf',
      'doc-design-grade2': 'CREATE모형 단원설계안(2학년).pdf',
      'doc-design-grade3': 'CREATE모형 단원설계안(3학년).pdf',
      'doc-design-grade4': 'CREATE모형 단원설계안(4학년).pdf',
      'doc-design-grade5': 'CREATE모형 단원설계안(5학년).pdf',
      'doc-design-grade6': 'CREATE모형 단원설계안(6학년).pdf',
      'doc-lesson-sci-5': 'CREATE모형 수업지도안(과학)(5학년).pdf',
      'doc-lesson-sci-6': 'CREATE모형 수업지도안(과학)(6학년).pdf',
      'doc-lesson-eng-4': 'CREATE모형 수업지도안(영어)(4학년).pdf',
      'doc-lesson-eng-5': 'CREATE모형 수업지도안(영어)(5학년).pdf',
      'doc-lesson-eng-6': 'CREATE모형 수업지도안(영어)(6학년).pdf',
      'doc-lesson-pe-4': 'CREATE모형 수업지도안(체육)(4학년).pdf',
      'doc-lesson-pe-6': 'CREATE모형 수업지도안(체육)(6학년).pdf',
      'doc-lesson-health-5': 'CREATE모형 수업지도안(보건)(5학년).pdf',
      'doc-lesson-int-2': 'CREATE모형 수업지도안(통합)(2학년).pdf'
    };

    // 출처 목록 구성 (서버 검증 출처만 전달)
    const citations: Citation[] = searchResults.map(r => {
      const cleanTitle = r.document_title
        .replace(/\[\s*테스트용\s*샘플(?:\s*데이터)?\s*\]\s*/gi, '')
        .replace(/테스트용\s*샘플(?:\s*데이터)?/gi, '')
        .trim();
      const staticFilename = staticMap[r.document_id];
      const directFileUrl = staticFilename
        ? `/chatbot/resources/${encodeURIComponent(staticFilename)}`
        : `/chatbot/api/documents/${r.document_id}/file`;

      return {
        document_id: r.document_id,
        document_title: cleanTitle,
        category: r.category,
        page_number: r.page_number,
        excerpt: r.content.slice(0, 150) + (r.content.length > 150 ? '...' : ''),
        file_url: directFileUrl
      };
    });

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
          generateSearchFallbackAnswer(searchResults, userMessage);
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
      answerText = generateSearchFallbackAnswer(searchResults, userMessage);
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
    await ensureDatabase(env);
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
    const chunksRes = await env.DB.prepare(`
      SELECT page_number, chunk_index, content
      FROM document_chunks
      WHERE document_id = ?
      ORDER BY page_number ASC, chunk_index ASC
    `).bind(docId).all();

    return jsonResponse({
      ...doc,
      chunks: chunksRes.results || []
    });
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

    let bodyData: any = null;
    let etag = 'sample-pdf-etag';

    const object = env.DOCS_BUCKET ? await env.DOCS_BUCKET.get(doc.r2_key) : null;
    if (object) {
      bodyData = object.body;
      etag = object.httpEtag;
    } else {
      // 16개 공식 연구학교 자료인 경우 정적 리소스 경로로 리다이렉트
      const staticMap: Record<string, string> = {
        'doc-guide-manual': 'CREATE 수업설계 모형 길잡이.pdf',
        'doc-design-grade1': 'CREATE모형 단원설계안(1학년).pdf',
        'doc-design-grade2': 'CREATE모형 단원설계안(2학년).pdf',
        'doc-design-grade3': 'CREATE모형 단원설계안(3학년).pdf',
        'doc-design-grade4': 'CREATE모형 단원설계안(4학년).pdf',
        'doc-design-grade5': 'CREATE모형 단원설계안(5학년).pdf',
        'doc-design-grade6': 'CREATE모형 단원설계안(6학년).pdf',
        'doc-lesson-sci-5': 'CREATE모형 수업지도안(과학)(5학년).pdf',
        'doc-lesson-sci-6': 'CREATE모형 수업지도안(과학)(6학년).pdf',
        'doc-lesson-eng-4': 'CREATE모형 수업지도안(영어)(4학년).pdf',
        'doc-lesson-eng-5': 'CREATE모형 수업지도안(영어)(5학년).pdf',
        'doc-lesson-eng-6': 'CREATE모형 수업지도안(영어)(6학년).pdf',
        'doc-lesson-pe-4': 'CREATE모형 수업지도안(체육)(4학년).pdf',
        'doc-lesson-pe-6': 'CREATE모형 수업지도안(체육)(6학년).pdf',
        'doc-lesson-health-5': 'CREATE모형 수업지도안(보건)(5학년).pdf',
        'doc-lesson-int-2': 'CREATE모형 수업지도안(통합)(2학년).pdf'
      };

      const staticFilename = staticMap[docId] || (doc.r2_key.endsWith('.pdf') ? doc.r2_key : null);
      if (staticFilename) {
        return Response.redirect(new URL(`/chatbot/resources/${encodeURIComponent(staticFilename)}`, request.url).toString(), 302);
      }

      // R2 및 정적 리소스 모두 없는 경우 생성본 스트리밍
      const samplePdfBytes = await generateSamplePdf(doc.title, doc.page_count || 5);
      bodyData = samplePdfBytes;
    }

    const headers = new Headers();
    headers.set('etag', etag);
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', `inline; filename="${encodeURIComponent(doc.title)}.pdf"`);
    headers.set('Cache-Control', 'public, max-age=86400, s-maxage=604800');

    return new Response(bodyData, { headers });
  } catch (err: any) {
    console.error('handleGetDocumentFile error:', err);
    return jsonResponse({ error: 'PDF 파일 스트리밍 실패', details: err.message }, 500);
  }
}

/**
 * GET /api/chatbot/health
 */
export async function handleHealth(request: Request, env: Env): Promise<Response> {
  await ensureDatabase(env);
  let dbOk = false;
  let docCount = 0;
  try {
    const res = await env.DB.prepare('SELECT 1 as alive').first();
    dbOk = !!res;
    const countRes = await env.DB.prepare('SELECT count(*) as cnt FROM documents').first<{ cnt: number }>();
    docCount = countRes?.cnt || 0;
  } catch {}

  return jsonResponse({
    status: 'healthy',
    service: 'CREATE AI 수업 도우미 API Worker',
    database: dbOk ? 'connected' : 'disconnected',
    documents_count: docCount,
    environment: env.ENVIRONMENT || 'production',
    timestamp: new Date().toISOString()
  });
}
