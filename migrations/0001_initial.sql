-- ===================================================
-- CREATE AI 수업 도우미 - Cloudflare D1 초기 스키마 마이그레이션
-- ===================================================

-- 1. documents (등록된 공식 PDF 문서 메타데이터)
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  grade TEXT NOT NULL,
  subject TEXT NOT NULL,
  tags TEXT NOT NULL DEFAULT '[]',
  r2_key TEXT NOT NULL,
  page_count INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'PENDING',
  is_public INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now', '+9 hours')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', '+9 hours'))
);

CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_grade ON documents(grade);
CREATE INDEX IF NOT EXISTS idx_documents_subject ON documents(subject);
CREATE INDEX IF NOT EXISTS idx_documents_public ON documents(is_public);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);

-- 2. document_chunks (문서 본문 페이지별 텍스트 청크)
CREATE TABLE IF NOT EXISTS document_chunks (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  page_number INTEGER NOT NULL,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  search_text TEXT NOT NULL,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_document_chunks_doc_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_page ON document_chunks(page_number);

-- 3. faq (자주 묻는 질문 및 공통 답변)
CREATE TABLE IF NOT EXISTS faq (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL,
  source_document_id TEXT,
  source_page INTEGER,
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_faq_active ON faq(is_active);

-- 4. ai_usage (Cloudflare Workers AI 무료 한도 및 일일 사용량 모니터링)
CREATE TABLE IF NOT EXISTS ai_usage (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  usage_value REAL NOT NULL DEFAULT 0.0,
  usage_unit TEXT NOT NULL DEFAULT 'requests',
  model TEXT NOT NULL,
  UNIQUE(date, model)
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_date ON ai_usage(date);

-- 5. document_chunks_fts (FTS5 전문 검색 가상 테이블)
CREATE VIRTUAL TABLE IF NOT EXISTS document_chunks_fts USING fts5(
  chunk_id UNINDEXED,
  document_id UNINDEXED,
  content,
  search_text
);
