/**
 * 관리자 API 라우트 핸들러 (/api/chatbot/admin/*)
 * Cloudflare Access JWT로 안전하게 보호됩니다.
 */

import {
  DocumentCategory,
  extractSearchKeywords,
  calculateRelevanceScore
} from '@create-chatbot/shared';
import { Env } from '../env';
import { verifyCloudflareAccess } from '../auth';
import {
  listDocuments,
  getDocumentById,
  createDocumentWithChunks,
  updateDocument,
  deleteDocument,
  getAdminDashboardStats
} from '../db';
import { validatePdfSignature, sanitizeUserInput } from '../security';
import { jsonResponse } from './public';

/**
 * UUID 생성 헬퍼
 */
function generateId(prefix = 'doc'): string {
  const randomStr = Math.random().toString(36).substring(2, 10);
  const timestamp = Date.now().toString(36);
  return `${prefix}-${timestamp}-${randomStr}`;
}

/**
 * KST 날짜
 */
function getKstDateString(): string {
  const d = new Date(Date.now() + 9 * 3600 * 1000);
  return d.toISOString().split('T')[0];
}

/**
 * GET /api/chatbot/admin/documents
 */
export async function handleAdminListDocuments(request: Request, env: Env): Promise<Response> {
  const auth = await verifyCloudflareAccess(request, env);
  if (!auth) {
    return jsonResponse({ error: '관리자 인증이 필요합니다. (Cloudflare Access)' }, 401);
  }

  try {
    const docs = await listDocuments(env.DB, true);
    return jsonResponse({ count: docs.length, documents: docs });
  } catch (err: any) {
    console.error('handleAdminListDocuments error:', err);
    return jsonResponse({ error: '관리자 문서 목록 조회 실패', details: err.message }, 500);
  }
}

/**
 * POST /api/chatbot/admin/documents
 * PDF 파일 업로드 및 텍스트 청크 색인
 */
export async function handleAdminCreateDocument(request: Request, env: Env): Promise<Response> {
  const auth = await verifyCloudflareAccess(request, env);
  if (!auth) {
    return jsonResponse({ error: '관리자 인증이 필요합니다.' }, 401);
  }

  try {
    const contentType = request.headers.get('content-type') || '';
    let title = '';
    let description = '';
    let category: DocumentCategory = 'CREATE 모형 안내';
    let grade = '공통';
    let subject = '융합/통합';
    let tags: string[] = [];
    let isPublic = 1;
    let pageCount = 1;
    let pdfBuffer: ArrayBuffer | null = null;
    let chunks: Array<{ page_number: number; chunk_index: number; content: string }> = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      title = sanitizeUserInput(formData.get('title') as string || '무제 자료');
      description = sanitizeUserInput(formData.get('description') as string || '');
      category = (formData.get('category') as DocumentCategory) || '기타';
      grade = (formData.get('grade') as string) || '공통';
      subject = (formData.get('subject') as string) || '융합/통합';
      isPublic = formData.get('is_public') === 'false' || formData.get('is_public') === '0' ? 0 : 1;
      pageCount = Number(formData.get('page_count')) || 1;

      const tagsRaw = formData.get('tags') as string;
      if (tagsRaw) {
        try {
          tags = JSON.parse(tagsRaw);
        } catch {
          tags = tagsRaw.split(',').map(t => t.trim()).filter(Boolean);
        }
      }

      const chunksRaw = formData.get('chunks') as string;
      if (chunksRaw) {
        try {
          chunks = JSON.parse(chunksRaw);
        } catch (e) {
          console.warn('Failed to parse chunks JSON:', e);
        }
      }

      const file = formData.get('file');
      if (file && typeof file !== 'string') {
        pdfBuffer = await (file as any).arrayBuffer();
      }
    } else {
      // JSON 페이로드 (PDF.js 추출 청크 및 메타데이터)
      const body = await request.json() as any;
      title = sanitizeUserInput(body.title || '무제 자료');
      description = sanitizeUserInput(body.description || '');
      category = body.category || '기타';
      grade = body.grade || '공통';
      subject = body.subject || '융합/통합';
      tags = Array.isArray(body.tags) ? body.tags : [];
      isPublic = body.is_public === false ? 0 : 1;
      pageCount = Number(body.page_count) || 1;
      chunks = body.chunks || [];
    }

    if (!title) {
      return jsonResponse({ error: '자료 제목을 입력해 주세요.' }, 400);
    }

    const docId = generateId('doc');
    const r2Key = `pdfs/${docId}.pdf`;

    // PDF 바이너리 시그니처 검증 및 R2 업로드
    if (pdfBuffer) {
      if (!validatePdfSignature(pdfBuffer)) {
        return jsonResponse({ error: '유효한 PDF 파일 포맷이 아닙니다. (%PDF- 시그니처 불일치)' }, 400);
      }

      if (env.DOCS_BUCKET) {
        await env.DOCS_BUCKET.put(r2Key, pdfBuffer, {
          httpMetadata: {
            contentType: 'application/pdf'
          },
          customMetadata: {
            uploadedBy: auth.email,
            docId
          }
        });
      }
    }

    // 청크 가공 및 검색 텍스트 생성
    const processedChunks = chunks.map((c, idx) => ({
      id: `${docId}-chunk-${c.page_number}-${c.chunk_index || idx}`,
      page_number: c.page_number || 1,
      chunk_index: c.chunk_index || idx,
      content: c.content,
      search_text: c.content.toLowerCase().replace(/[^\w\s가-힣]/g, ' ')
    }));

    // D1 등록
    await createDocumentWithChunks(
      env.DB,
      {
        id: docId,
        title,
        description,
        category,
        grade,
        subject,
        tags,
        r2_key: r2Key,
        page_count: pageCount,
        status: processedChunks.length > 0 ? 'COMPLETED' : 'PENDING',
        is_public: isPublic
      },
      processedChunks
    );

    return jsonResponse({
      success: true,
      document_id: docId,
      title,
      chunks_count: processedChunks.length,
      message: '문서가 성공적으로 등록 및 색인되었습니다.'
    }, 201);
  } catch (err: any) {
    console.error('handleAdminCreateDocument error:', err);
    return jsonResponse({ error: '자료 등록 실패', details: err.message }, 500);
  }
}

/**
 * PUT /api/chatbot/admin/documents/:id
 */
export async function handleAdminUpdateDocument(
  request: Request,
  env: Env,
  docId: string
): Promise<Response> {
  const auth = await verifyCloudflareAccess(request, env);
  if (!auth) {
    return jsonResponse({ error: '관리자 인증이 필요합니다.' }, 401);
  }

  try {
    const body = (await request.json()) as any;
    await updateDocument(env.DB, docId, body);
    return jsonResponse({ success: true, message: '문서 정보가 수정되었습니다.' });
  } catch (err: any) {
    console.error('handleAdminUpdateDocument error:', err);
    return jsonResponse({ error: '문서 수정 실패', details: err.message }, 500);
  }
}

/**
 * DELETE /api/chatbot/admin/documents/:id
 */
export async function handleAdminDeleteDocument(
  request: Request,
  env: Env,
  docId: string
): Promise<Response> {
  const auth = await verifyCloudflareAccess(request, env);
  if (!auth) {
    return jsonResponse({ error: '관리자 인증이 필요합니다.' }, 401);
  }

  try {
    const r2Key = await deleteDocument(env.DB, docId);
    if (r2Key && env.DOCS_BUCKET) {
      await env.DOCS_BUCKET.delete(r2Key);
    }

    return jsonResponse({ success: true, message: '문서 및 관련 색인이 완전히 삭제되었습니다.' });
  } catch (err: any) {
    console.error('handleAdminDeleteDocument error:', err);
    return jsonResponse({ error: '문서 삭제 실패', details: err.message }, 500);
  }
}

/**
 * POST /api/chatbot/admin/documents/:id/reindex
 */
export async function handleAdminReindexDocument(
  request: Request,
  env: Env,
  docId: string
): Promise<Response> {
  const auth = await verifyCloudflareAccess(request, env);
  if (!auth) {
    return jsonResponse({ error: '관리자 인증이 필요합니다.' }, 401);
  }

  try {
    const doc = await getDocumentById(env.DB, docId, true);
    if (!doc) {
      return jsonResponse({ error: '문서를 찾을 수 없습니다.' }, 404);
    }

    // FTS 가상 테이블 재생성 동기화
    await env.DB.prepare(`
      DELETE FROM document_chunks_fts WHERE document_id = ?
    `).bind(docId).run();

    await env.DB.prepare(`
      INSERT INTO document_chunks_fts (chunk_id, document_id, content, search_text)
      SELECT id, document_id, content, search_text FROM document_chunks WHERE document_id = ?
    `).bind(docId).run();

    await updateDocument(env.DB, docId, { status: 'COMPLETED' });

    return jsonResponse({ success: true, message: '문서 색인이 갱신되었습니다.' });
  } catch (err: any) {
    console.error('handleAdminReindexDocument error:', err);
    return jsonResponse({ error: '재색인 실패', details: err.message }, 500);
  }
}

/**
 * GET /api/chatbot/admin/usage
 */
export async function handleAdminUsageStats(request: Request, env: Env): Promise<Response> {
  const auth = await verifyCloudflareAccess(request, env);
  if (!auth) {
    return jsonResponse({ error: '관리자 인증이 필요합니다.' }, 401);
  }

  try {
    const todayStr = getKstDateString();
    const stats = await getAdminDashboardStats(env.DB, todayStr);
    return jsonResponse(stats);
  } catch (err: any) {
    console.error('handleAdminUsageStats error:', err);
    return jsonResponse({ error: '통계 조회 실패', details: err.message }, 500);
  }
}

/**
 * POST /api/chatbot/admin/test-search
 * 관리자가 PDF 색인 후 검색 품질을 즉시 점검하는 도구
 */
export async function handleAdminTestSearch(request: Request, env: Env): Promise<Response> {
  const auth = await verifyCloudflareAccess(request, env);
  if (!auth) {
    return jsonResponse({ error: '관리자 인증이 필요합니다.' }, 401);
  }

  try {
    const body = (await request.json()) as { query: string };
    const query = sanitizeUserInput(body.query || '');

    const keywords = extractSearchKeywords(query);
    const result = await env.DB.prepare(`
      SELECT c.*, d.title as doc_title
      FROM document_chunks c
      JOIN documents d ON c.document_id = d.id
      ORDER BY c.rowid DESC
      LIMIT 50
    `).all();

    const evaluated = (result.results || []).map((row: any) => {
      const { score, matchedKeywords } = calculateRelevanceScore(
        row.content as string,
        keywords,
        row.doc_title as string
      );
      return {
        chunk_id: row.id,
        document_id: row.document_id,
        doc_title: row.doc_title,
        page_number: row.page_number,
        score,
        matched_keywords: matchedKeywords,
        content_preview: (row.content as string).slice(0, 120)
      };
    });

    evaluated.sort((a, b) => b.score - a.score);

    return jsonResponse({
      query,
      keywords,
      matched_count: evaluated.filter(e => e.score > 0).length,
      evaluated: evaluated.slice(0, 10)
    });
  } catch (err: any) {
    console.error('handleAdminTestSearch error:', err);
    return jsonResponse({ error: '테스트 검색 실패', details: err.message }, 500);
  }
}
