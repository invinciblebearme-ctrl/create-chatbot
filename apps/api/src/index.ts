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
  jsonResponse,
  ensureDatabase
} from './routes/public';
import { runDatabaseSetup } from './db-setup';
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
    const isApi = pathname.startsWith('/api/') || pathname.startsWith('/chatbot/api/');
    // /chatbot/api/... 경로를 내부 표준 /api/chatbot/... 경로로 정규화
    const apiPath = pathname.startsWith('/chatbot/api/')
      ? pathname.replace('/chatbot/api/', '/api/chatbot/')
      : pathname;

    // 1. OPTIONS 프리플라이트 처리
    if (method === 'OPTIONS') {
      const headers = new Headers();
      setCorsHeaders(headers, env, request);
      return new Response(null, { status: 204, headers });
    }

    let response: Response;

    try {
      // 2. 정적 에셋 서빙 (Workers Static Assets 환경에서 SPA 프런트엔드 제공)
      if (!isApi && env.ASSETS) {
        // (1) 루트 / 또는 /chatbot 접속 시 표준 경로 /chatbot/ 으로 302 리디렉션
        if (pathname === '/' || pathname === '') {
          return Response.redirect(new URL('/chatbot/', request.url).toString(), 302);
        }
        if (pathname === '/chatbot') {
          return Response.redirect(new URL('/chatbot/', request.url).toString(), 302);
        }

        // (2) /chatbot/assets/... -> /assets/... 실제 빌드 파일 맵핑
        if (pathname.startsWith('/chatbot/assets/')) {
          const assetUrl = new URL(request.url);
          assetUrl.pathname = pathname.replace('/chatbot/assets/', '/assets/');
          return await env.ASSETS.fetch(new Request(assetUrl.toString(), request));
        }

        // (3) /chatbot/favicon.svg -> /favicon.svg 맵핑
        if (pathname === '/chatbot/favicon.svg') {
          const iconUrl = new URL(request.url);
          iconUrl.pathname = '/favicon.svg';
          return await env.ASSETS.fetch(new Request(iconUrl.toString(), request));
        }

        // (4) SPA 프런트엔드 페이지 (/chatbot/, /chatbot/admin 등)
        if (pathname.startsWith('/chatbot/')) {
          const rootUrl = new URL('/', request.url);
          const indexRes = await env.ASSETS.fetch(new Request(rootUrl.toString(), request));
          // HTML 응답은 200 OK로 직접 반환하여 무한 리디렉션 원천 차단
          return new Response(indexRes.body, {
            status: 200,
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              'Cache-Control': 'no-cache'
            }
          });
        }

        // (5) 기타 정적 에셋 직접 조회 시도
        const directRes = await env.ASSETS.fetch(request);
        if (directRes.status < 400) {
          return directRes;
        }

        // (6) 그 외 알 수 없는 경로는 /chatbot/ 으로 리디렉션
        return Response.redirect(new URL('/chatbot/', request.url).toString(), 302);
      }

      // 3. 라우팅 매칭 (apiPath 기준으로 통일 매칭)
      // --- 공개 API ---
      if (apiPath === '/api/chatbot/health' && method === 'GET') {
        response = await handleHealth(request, env);
      } else if ((apiPath === '/api/chatbot/init' || apiPath === '/api/chatbot/init-db') && (method === 'GET' || method === 'POST')) {
        const setupResult = await runDatabaseSetup(env);
        response = jsonResponse({
          success: setupResult.success,
          message: setupResult.success
            ? 'D1 데이터베이스가 성공적으로 초기화되었습니다.'
            : 'D1 데이터베이스 초기화 중 일부 오류가 발생했습니다.',
          ...setupResult
        });
      } else if (apiPath === '/api/chatbot/search' && method === 'POST') {
        response = await handleSearch(request, env);
      } else if (apiPath === '/api/chatbot/chat' && method === 'POST') {
        response = await handleChat(request, env);
      } else if (apiPath === '/api/chatbot/documents' && method === 'GET') {
        response = await handleListDocuments(request, env);
      } else if (apiPath.match(/^\/api\/chatbot\/documents\/([^\/]+)\/file$/) && method === 'GET') {
        const docId = apiPath.match(/^\/api\/chatbot\/documents\/([^\/]+)\/file$/)![1];
        response = await handleGetDocumentFile(request, env, docId);
      } else if (apiPath.match(/^\/api\/chatbot\/documents\/([^\/]+)$/) && method === 'GET') {
        const docId = apiPath.match(/^\/api\/chatbot\/documents\/([^\/]+)$/)![1];
        response = await handleGetDocument(request, env, docId);
      }

      // --- 관리자 API (Cloudflare Access 보호) ---
      else if (apiPath === '/api/chatbot/admin/documents' && method === 'GET') {
        response = await handleAdminListDocuments(request, env);
      } else if (apiPath === '/api/chatbot/admin/documents' && method === 'POST') {
        response = await handleAdminCreateDocument(request, env);
      } else if (apiPath.match(/^\/api\/chatbot\/admin\/documents\/([^\/]+)\/reindex$/) && method === 'POST') {
        const docId = apiPath.match(/^\/api\/chatbot\/admin\/documents\/([^\/]+)\/reindex$/)![1];
        response = await handleAdminReindexDocument(request, env, docId);
      } else if (apiPath.match(/^\/api\/chatbot\/admin\/documents\/([^\/]+)$/) && method === 'PUT') {
        const docId = apiPath.match(/^\/api\/chatbot\/admin\/documents\/([^\/]+)$/)![1];
        response = await handleAdminUpdateDocument(request, env, docId);
      } else if (apiPath.match(/^\/api\/chatbot\/admin\/documents\/([^\/]+)$/) && method === 'DELETE') {
        const docId = apiPath.match(/^\/api\/chatbot\/admin\/documents\/([^\/]+)$/)![1];
        response = await handleAdminDeleteDocument(request, env, docId);
      } else if (apiPath === '/api/chatbot/admin/usage' && method === 'GET') {
        response = await handleAdminUsageStats(request, env);
      } else if (apiPath === '/api/chatbot/admin/test-search' && method === 'POST') {
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
