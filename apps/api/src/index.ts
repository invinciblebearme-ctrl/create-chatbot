/**
 * CREATE AI 수업 도우미 - Cloudflare Worker 메인 엔트리포인트
 */

import { Env } from './env';
import {
  handleSearch,
  handleChat,
  handleListDocuments,
  handleGetDocument,
  handleGetDocumentFile,
  handleHealth,
  jsonResponse
} from './routes/public';
import {
  handleAdminListDocuments,
  handleAdminCreateDocument,
  handleAdminUpdateDocument,
  handleAdminDeleteDocument,
  handleAdminReindexDocument,
  handleAdminUsageStats,
  handleAdminTestSearch
} from './routes/admin';

/**
 * CORS 응답 헤더 설정
 */
function setCorsHeaders(headers: Headers, env: Env, request?: Request): void {
  const origin = request?.headers.get('Origin') || '';
  if (
    origin.includes('allforedu.kr') ||
    origin.includes('pages.dev') ||
    origin.includes('localhost') ||
    origin.includes('127.0.0.1')
  ) {
    headers.set('Access-Control-Allow-Origin', origin);
  } else {
    headers.set('Access-Control-Allow-Origin', env.ALLOWED_ORIGIN || 'https://create.allforedu.kr');
  }
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, Cf-Access-Jwt-Assertion, x-dev-admin-bypass, x-admin-pin'
  );
  headers.set('Access-Control-Max-Age', '86400');
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method.toUpperCase();
    const pathname = url.pathname;

    // 1. OPTIONS 프리플라이트 처리
    if (method === 'OPTIONS') {
      const headers = new Headers();
      setCorsHeaders(headers, env, request);
      return new Response(null, { status: 204, headers });
    }

    let response: Response;

    try {
      // 2. 정적 에셋 서빙 (Workers Static Assets 환경에서 SPA 프런트엔드 제공)
      if (!pathname.startsWith('/api/') && env.ASSETS) {
        if (pathname.startsWith('/chatbot/assets/')) {
          const assetUrl = new URL(request.url);
          assetUrl.pathname = pathname.replace('/chatbot/assets/', '/assets/');
          return await env.ASSETS.fetch(new Request(assetUrl.toString(), request));
        }
        if (pathname === '/chatbot/favicon.svg') {
          const iconUrl = new URL(request.url);
          iconUrl.pathname = '/favicon.svg';
          return await env.ASSETS.fetch(new Request(iconUrl.toString(), request));
        }
        const assetRes = await env.ASSETS.fetch(request);
        if (assetRes.status === 404 || !pathname.includes('.')) {
          const indexUrl = new URL(request.url);
          indexUrl.pathname = '/index.html';
          return await env.ASSETS.fetch(new Request(indexUrl.toString(), request));
        }
        return assetRes;
      }

      // 3. 라우팅 매칭
      // --- 공개 API ---
      if (pathname === '/api/chatbot/health' && method === 'GET') {
        response = await handleHealth(request, env);
      } else if (pathname === '/api/chatbot/search' && method === 'POST') {
        response = await handleSearch(request, env);
      } else if (pathname === '/api/chatbot/chat' && method === 'POST') {
        response = await handleChat(request, env);
      } else if (pathname === '/api/chatbot/documents' && method === 'GET') {
        response = await handleListDocuments(request, env);
      } else if (pathname.match(/^\/api\/chatbot\/documents\/([^\/]+)\/file$/) && method === 'GET') {
        const docId = pathname.match(/^\/api\/chatbot\/documents\/([^\/]+)\/file$/)![1];
        response = await handleGetDocumentFile(request, env, docId);
      } else if (pathname.match(/^\/api\/chatbot\/documents\/([^\/]+)$/) && method === 'GET') {
        const docId = pathname.match(/^\/api\/chatbot\/documents\/([^\/]+)$/)![1];
        response = await handleGetDocument(request, env, docId);
      }

      // --- 관리자 API (Cloudflare Access 보호) ---
      else if (pathname === '/api/chatbot/admin/documents' && method === 'GET') {
        response = await handleAdminListDocuments(request, env);
      } else if (pathname === '/api/chatbot/admin/documents' && method === 'POST') {
        response = await handleAdminCreateDocument(request, env);
      } else if (pathname.match(/^\/api\/chatbot\/admin\/documents\/([^\/]+)\/reindex$/) && method === 'POST') {
        const docId = pathname.match(/^\/api\/chatbot\/admin\/documents\/([^\/]+)\/reindex$/)![1];
        response = await handleAdminReindexDocument(request, env, docId);
      } else if (pathname.match(/^\/api\/chatbot\/admin\/documents\/([^\/]+)$/) && method === 'PUT') {
        const docId = pathname.match(/^\/api\/chatbot\/admin\/documents\/([^\/]+)$/)![1];
        response = await handleAdminUpdateDocument(request, env, docId);
      } else if (pathname.match(/^\/api\/chatbot\/admin\/documents\/([^\/]+)$/) && method === 'DELETE') {
        const docId = pathname.match(/^\/api\/chatbot\/admin\/documents\/([^\/]+)$/)![1];
        response = await handleAdminDeleteDocument(request, env, docId);
      } else if (pathname === '/api/chatbot/admin/usage' && method === 'GET') {
        response = await handleAdminUsageStats(request, env);
      } else if (pathname === '/api/chatbot/admin/test-search' && method === 'POST') {
        response = await handleAdminTestSearch(request, env);
      }

      // 일치하는 라우트 없음
      else {
        response = jsonResponse({ error: `경로를 찾을 수 없습니다: ${pathname}` }, 404);
      }
    } catch (err: any) {
      console.error('Unhandled worker error:', err);
      response = jsonResponse({ error: '서버 내부 오류가 발생했습니다.', message: err.message }, 500);
    }

    // CORS 헤더 부착 후 응답 반환
    const resHeaders = new Headers(response.headers);
    setCorsHeaders(resHeaders, env, request);

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: resHeaders
    });
  }
};
