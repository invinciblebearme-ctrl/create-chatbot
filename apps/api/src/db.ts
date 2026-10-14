/**
 * Cloudflare D1 데이터베이스 연동 및 검색 서비스
 */

import {
  Document,
  DocumentChunk,
  DocumentCategory,
  SearchFilter,
  SearchResult,
  extractSearchKeywords,
  calculateRelevanceScore,
  AdminStats
} from '@create-chatbot/shared';

/**
 * D1 전문 검색 및 하이브리드 검색 엔진
 */
export async function searchDocumentsAndChunks(
  db: D1Database,
  query: string,
  filter?: SearchFilter,
  limit = 5
): Promise<SearchResult[]> {
  const keywords = extractSearchKeywords(query);
  if (keywords.length === 0) {
    // 키워드가 없으면 일반 단어 분리
    const words = query.trim().split(/\s+/).filter(w => w.length >= 2);
    keywords.push(...words);
  }

  // 1. SQL 쿼리 조건 구성
  let baseQuery = `
    SELECT 
      c.id AS chunk_id,
      c.document_id,
      c.page_number,
      c.chunk_index,
      c.content,
      c.search_text,
      d.title AS doc_title,
      d.category AS doc_category,
      d.grade AS doc_grade,
      d.subject AS doc_subject
    FROM document_chunks c
    JOIN documents d ON c.document_id = d.id
    WHERE d.is_public = 1 AND d.status = 'COMPLETED'
  `;

  const params: any[] = [];

  if (filter?.category && filter.category !== '전체') {
    baseQuery += ` AND d.category = ?`;
    params.push(filter.category);
  }
  if (filter?.grade && filter.grade !== '전체') {
    baseQuery += ` AND (d.grade = ? OR d.grade = '공통' OR d.grade = '전학년')`;
    params.push(filter.grade);
  }
  if (filter?.subject && filter.subject !== '전체') {
    baseQuery += ` AND (d.subject = ? OR d.subject = '융합/통합')`;
    params.push(filter.subject);
  }

  // 키워드 기반 LIKE 매칭 조건 추가 (OR 조건으로 후보군 넉넉히 수집)
  if (keywords.length > 0) {
    const likeConditions = keywords.map(() => `(c.search_text LIKE ? OR c.content LIKE ? OR d.title LIKE ?)`).join(' OR ');
    baseQuery += ` AND (${likeConditions})`;
    for (const kw of keywords) {
      params.push(`%${kw}%`, `%${kw}%`, `%${kw}%`);
    }
  }

  baseQuery += ` LIMIT 30`;

  let rows: any[] = [];
  try {
    const stmt = db.prepare(baseQuery).bind(...params);
    const result = await stmt.all();
    rows = result.results || [];
  } catch (err) {
    console.warn('Direct query failed or no matches, falling back to recent chunks:', err);
    // 폴백: 최근 청크 일부 검색
    try {
      const fallbackStmt = db.prepare(`
        SELECT c.id AS chunk_id, c.document_id, c.page_number, c.chunk_index, c.content, c.search_text,
               d.title AS doc_title, d.category AS doc_category, d.grade AS doc_grade, d.subject AS doc_subject
        FROM document_chunks c
        JOIN documents d ON c.document_id = d.id
        WHERE d.is_public = 1 AND d.status = 'COMPLETED'
        LIMIT 20
      `);
      const fallbackResult = await fallbackStmt.all();
      rows = fallbackResult.results || [];
    } catch {
      rows = [];
    }
  }

  // 2. 관련도 점수 재평가 (Re-ranking)
  const scoredResults: SearchResult[] = [];

  for (const row of rows) {
    const { score, matchedKeywords } = calculateRelevanceScore(
      row.content as string,
      keywords,
      row.doc_title as string
    );

    if (score > 0 || keywords.length === 0) {
      scoredResults.push({
        id: row.chunk_id as string,
        document_id: row.document_id as string,
        document_title: row.doc_title as string,
        category: row.doc_category as string,
        grade: row.doc_grade as string,
        subject: row.doc_subject as string,
        page_number: Number(row.page_number),
        content: row.content as string,
        score,
        matched_keywords: matchedKeywords
      });
    }
  }

  // 3. 점수 내림차순 정렬 및 상위 반환
  scoredResults.sort((a, b) => b.score - a.score);

  return scoredResults.slice(0, limit);
}

/**
 * 문서 목록 조회
 */
export async function listDocuments(
  db: D1Database,
  isAdmin = false,
  filter?: SearchFilter
): Promise<Document[]> {
  let query = `SELECT * FROM documents WHERE 1=1`;
  const params: any[] = [];

  if (!isAdmin) {
    query += ` AND is_public = 1 AND status = 'COMPLETED'`;
  }
  if (filter?.category && filter.category !== '전체') {
    query += ` AND category = ?`;
    params.push(filter.category);
  }
  if (filter?.grade && filter.grade !== '전체') {
    query += ` AND grade = ?`;
    params.push(filter.grade);
  }
  if (filter?.subject && filter.subject !== '전체') {
    query += ` AND subject = ?`;
    params.push(filter.subject);
  }

  query += ` ORDER BY created_at DESC LIMIT 100`;

  const result = await db.prepare(query).bind(...params).all();
  const rows = (result.results || []) as any[];

  return rows.map(r => ({
    ...r,
    tags: typeof r.tags === 'string' ? JSON.parse(r.tags || '[]') : r.tags,
    is_public: Number(r.is_public),
    page_count: Number(r.page_count)
  })) as Document[];
}

/**
 * 단일 문서 조회
 */
export async function getDocumentById(
  db: D1Database,
  id: string,
  isAdmin = false
): Promise<Document | null> {
  let query = `SELECT * FROM documents WHERE id = ?`;
  if (!isAdmin) {
    query += ` AND is_public = 1 AND status = 'COMPLETED'`;
  }

  const row = await db.prepare(query).bind(id).first<any>();
  if (!row) return null;

  return {
    ...row,
    tags: typeof row.tags === 'string' ? JSON.parse(row.tags || '[]') : row.tags,
    is_public: Number(row.is_public),
    page_count: Number(row.page_count)
  } as Document;
}

/**
 * 신규 문서 및 청크 등록 (트랜잭션 배치)
 */
export async function createDocumentWithChunks(
  db: D1Database,
  doc: {
    id: string;
    title: string;
    description: string;
    category: DocumentCategory;
    grade: string;
    subject: string;
    tags: string[];
    r2_key: string;
    page_count: number;
    status: string;
    is_public: number;
  },
  chunks: Array<{
    id: string;
    page_number: number;
    chunk_index: number;
    content: string;
    search_text: string;
  }>
): Promise<void> {
  const statements: D1PreparedStatement[] = [];

  // 1. 문서 메타데이터 저장
  statements.push(
    db.prepare(`
      INSERT INTO documents (id, title, description, category, grade, subject, tags, r2_key, page_count, status, is_public, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '+9 hours'), datetime('now', '+9 hours'))
    `).bind(
      doc.id,
      doc.title,
      doc.description,
      doc.category,
      doc.grade,
      doc.subject,
      JSON.stringify(doc.tags),
      doc.r2_key,
      doc.page_count,
      doc.status,
      doc.is_public
    )
  );

  // 2. 청크 데이터 배치 등록
  for (const c of chunks) {
    statements.push(
      db.prepare(`
        INSERT INTO document_chunks (id, document_id, page_number, chunk_index, content, search_text)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(c.id, doc.id, c.page_number, c.chunk_index, c.content, c.search_text)
    );

    // FTS 테이블 인덱싱 시도 (오류 발생 시 무시 가능하도록)
    try {
      statements.push(
        db.prepare(`
          INSERT INTO document_chunks_fts (chunk_id, document_id, content, search_text)
          VALUES (?, ?, ?, ?)
        `).bind(c.id, doc.id, c.content, c.search_text)
      );
    } catch {}
  }

  await db.batch(statements);
}

/**
 * 문서 수정
 */
export async function updateDocument(
  db: D1Database,
  id: string,
  payload: {
    title?: string;
    description?: string;
    category?: DocumentCategory;
    grade?: string;
    subject?: string;
    tags?: string[];
    is_public?: boolean;
    status?: string;
  }
): Promise<void> {
  const fields: string[] = ['updated_at = datetime(\'now\', \'+9 hours\')'];
  const params: any[] = [];

  if (payload.title !== undefined) {
    fields.push('title = ?');
    params.push(payload.title);
  }
  if (payload.description !== undefined) {
    fields.push('description = ?');
    params.push(payload.description);
  }
  if (payload.category !== undefined) {
    fields.push('category = ?');
    params.push(payload.category);
  }
  if (payload.grade !== undefined) {
    fields.push('grade = ?');
    params.push(payload.grade);
  }
  if (payload.subject !== undefined) {
    fields.push('subject = ?');
    params.push(payload.subject);
  }
  if (payload.tags !== undefined) {
    fields.push('tags = ?');
    params.push(JSON.stringify(payload.tags));
  }
  if (payload.is_public !== undefined) {
    fields.push('is_public = ?');
    params.push(payload.is_public ? 1 : 0);
  }
  if (payload.status !== undefined) {
    fields.push('status = ?');
    params.push(payload.status);
  }

  params.push(id);
  const sql = `UPDATE documents SET ${fields.join(', ')} WHERE id = ?`;
  await db.prepare(sql).bind(...params).run();
}

/**
 * 문서 및 관련 청크 삭제
 */
export async function deleteDocument(db: D1Database, id: string): Promise<string | null> {
  // R2 키 조회
  const doc = await db.prepare('SELECT r2_key FROM documents WHERE id = ?').bind(id).first<{ r2_key: string }>();
  if (!doc) return null;

  await db.batch([
    db.prepare('DELETE FROM document_chunks_fts WHERE document_id = ?').bind(id),
    db.prepare('DELETE FROM document_chunks WHERE document_id = ?').bind(id),
    db.prepare('DELETE FROM documents WHERE id = ?').bind(id)
  ]);

  return doc.r2_key;
}

/**
 * AI 일일 사용량 조회
 */
export async function getTodayAiUsage(db: D1Database, dateStr: string, model: string): Promise<number> {
  const row = await db.prepare(
    'SELECT request_count FROM ai_usage WHERE date = ? AND model = ?'
  ).bind(dateStr, model).first<{ request_count: number }>();
  return row?.request_count || 0;
}

/**
 * AI 일일 사용량 증가 기록
 */
export async function incrementAiUsage(db: D1Database, dateStr: string, model: string): Promise<void> {
  const id = `usage-${dateStr}-${model.replace(/[^\w]/g, '_')}`;
  await db.prepare(`
    INSERT INTO ai_usage (id, date, request_count, usage_value, usage_unit, model)
    VALUES (?, ?, 1, 1, 'requests', ?)
    ON CONFLICT(date, model) DO UPDATE SET 
      request_count = request_count + 1,
      usage_value = usage_value + 1
  `).bind(id, dateStr, model).run();
}

/**
 * 관리자 대시보드 통계 조회
 */
export async function getAdminDashboardStats(db: D1Database, todayStr: string): Promise<AdminStats> {
  const total = await db.prepare('SELECT COUNT(*) as count FROM documents').first<{ count: number }>();
  const publicCount = await db.prepare('SELECT COUNT(*) as count FROM documents WHERE is_public = 1').first<{ count: number }>();
  const indexed = await db.prepare("SELECT COUNT(*) as count FROM documents WHERE status = 'COMPLETED'").first<{ count: number }>();
  const failed = await db.prepare("SELECT COUNT(*) as count FROM documents WHERE status = 'FAILED'").first<{ count: number }>();
  
  const aiToday = await db.prepare(
    'SELECT SUM(request_count) as total FROM ai_usage WHERE date = ?'
  ).bind(todayStr).first<{ total: number }>();

  const modelUsageResult = await db.prepare(
    'SELECT model, request_count FROM ai_usage WHERE date = ? ORDER BY request_count DESC'
  ).bind(todayStr).all();

  const recentDocsResult = await db.prepare(
    'SELECT * FROM documents ORDER BY created_at DESC LIMIT 5'
  ).all();

  const recentDocs = (recentDocsResult.results || []).map((r: any) => ({
    ...r,
    tags: typeof r.tags === 'string' ? JSON.parse(r.tags || '[]') : r.tags,
    is_public: Number(r.is_public),
    page_count: Number(r.page_count)
  })) as Document[];

  return {
    total_documents: total?.count || 0,
    public_documents: publicCount?.count || 0,
    indexed_documents: indexed?.count || 0,
    failed_documents: failed?.count || 0,
    ai_requests_today: aiToday?.total || 0,
    ai_limit_daily: 250,
    ai_model_usage: (modelUsageResult.results || []).map((r: any) => ({
      model: r.model as string,
      request_count: Number(r.request_count || 0)
    })),
    search_requests_today: 0,
    recent_documents: recentDocs,
    recent_errors: []
  };
}
