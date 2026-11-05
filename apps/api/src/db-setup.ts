/**
 * D1 데이터베이스 안전 자동 초기화 서비스
 */

import { Env } from './env';
import { SEED_DATA_SQL } from './init-sql';

export async function runDatabaseSetup(env: Env): Promise<{ success: boolean; errors: string[]; docsCount: number }> {
  const errors: string[] = [];
  let count = 0;

  // 1. DDL 테이블 생성 (단일 쿼리 순차 실행)
  const ddlStatements = [
    `CREATE TABLE IF NOT EXISTS documents (
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
    )`,
    `CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category)`,
    `CREATE INDEX IF NOT EXISTS idx_documents_grade ON documents(grade)`,
    `CREATE INDEX IF NOT EXISTS idx_documents_subject ON documents(subject)`,
    `CREATE INDEX IF NOT EXISTS idx_documents_public ON documents(is_public)`,
    `CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status)`,
    `CREATE TABLE IF NOT EXISTS document_chunks (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      page_number INTEGER NOT NULL,
      chunk_index INTEGER NOT NULL,
      content TEXT NOT NULL,
      search_text TEXT NOT NULL,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    )`,
    `CREATE INDEX IF NOT EXISTS idx_document_chunks_doc_id ON document_chunks(document_id)`,
    `CREATE INDEX IF NOT EXISTS idx_document_chunks_page ON document_chunks(page_number)`,
    `CREATE TABLE IF NOT EXISTS faq (
      id TEXT PRIMARY KEY,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      category TEXT NOT NULL,
      source_document_id TEXT,
      source_page INTEGER,
      is_active INTEGER NOT NULL DEFAULT 1
    )`,
    `CREATE INDEX IF NOT EXISTS idx_faq_active ON faq(is_active)`,
    `CREATE TABLE IF NOT EXISTS ai_usage (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      request_count INTEGER NOT NULL DEFAULT 0,
      usage_value REAL NOT NULL DEFAULT 0.0,
      usage_unit TEXT NOT NULL DEFAULT 'requests',
      model TEXT NOT NULL,
      UNIQUE(date, model)
    )`,
    `CREATE INDEX IF NOT EXISTS idx_ai_usage_date ON ai_usage(date)`
  ];

  for (const sql of ddlStatements) {
    try {
      await env.DB.prepare(sql).run();
    } catch (e: any) {
      errors.push(`DDL: ${e.message}`);
    }
  }

  // FTS5 가상 테이블 생성 (존재 여부 검사 후 생성)
  try {
    const ftsCheck = await env.DB.prepare("SELECT count(*) as cnt FROM sqlite_master WHERE type='table' AND name='document_chunks_fts'").first<{ cnt: number }>();
    if (!ftsCheck || ftsCheck.cnt === 0) {
      await env.DB.prepare("CREATE VIRTUAL TABLE document_chunks_fts USING fts5(chunk_id UNINDEXED, document_id UNINDEXED, content, search_text)").run();
    }
  } catch (e: any) {
    errors.push(`FTS5: ${e.message}`);
  }

  // 2. 기존 샘플 데이터가 있으면 정리
  try {
    const hasSample = await env.DB.prepare("SELECT count(*) as cnt FROM documents WHERE id LIKE 'doc-sample%'").first<{ cnt: number }>();
    if (hasSample && hasSample.cnt > 0) {
      await env.DB.prepare("DELETE FROM document_chunks WHERE document_id LIKE 'doc-sample%'").run();
      await env.DB.prepare("DELETE FROM documents WHERE id LIKE 'doc-sample%'").run();
      await env.DB.prepare("DELETE FROM faq WHERE source_document_id LIKE 'doc-sample%'").run();
    }
  } catch (e: any) {
    errors.push(`CleanupSample: ${e.message}`);
  }

  // 3. 현재 등록된 공식 길잡이 문서 유무 확인
  let guideCount = 0;
  try {
    const res = await env.DB.prepare("SELECT count(*) as cnt FROM documents WHERE id = 'doc-guide-manual'").first<{ cnt: number }>();
    guideCount = res?.cnt || 0;
  } catch (e: any) {
    errors.push(`Count: ${e.message}`);
  }

  // 4. 공식 실제 자료가 없으면 SEED_DATA_SQL 실행
  if (guideCount === 0) {
    try {
      // SEED_DATA_SQL 문장 분할 실행
      const statements = SEED_DATA_SQL
        .split(/;\s*[\r\n]+/)
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (!statement) continue;
        try {
          await env.DB.prepare(statement).run();
        } catch (stmtErr: any) {
          // 중복 키나 이미 존재하는 경우 무시
          if (!stmtErr.message?.includes('UNIQUE constraint failed')) {
            errors.push(`SeedStmt: ${stmtErr.message}`);
          }
        }
      }
    } catch (seedErr: any) {
      errors.push(`SeedData: ${seedErr.message}`);
    }

    // FTS 동기화
    try {
      await env.DB.prepare("INSERT OR IGNORE INTO document_chunks_fts (chunk_id, document_id, content, search_text) SELECT id, document_id, content, search_text FROM document_chunks").run();
    } catch (e: any) {
      errors.push(`FTSSync: ${e.message}`);
    }

    // 공식 연구학교 FAQ 등록 (진단–탐색–실행–분석–전이–성장 100% 일치)
    const faqInserts = [
      `INSERT OR REPLACE INTO faq (id, question, answer, category, source_document_id, source_page, is_active) VALUES ('faq-1', 'CREATE 모형이란 무엇인가요?', 'CREATE 모형은 학생 맞춤형 탐구와 깊이 있는 배움을 위해 초등학교 연구학교에서 개발된 AI·디지털 연계 교수·학습 모델입니다. C(진단 Check & Context), R(탐색 Research & Resource), E(실행 Execution & Engage), A(분석 Analysis & Action), T(전이 Transfer & Think), E(성장 Evolve & Evaluate)의 6단계 흐름과 분석(A) 기반 환류를 통해 학생 주도적 성장을 지원합니다.', 'CREATE 모형 안내', 'doc-guide-manual', 1, 1)`,
      `INSERT OR REPLACE INTO faq (id, question, answer, category, source_document_id, source_page, is_active) VALUES ('faq-2', 'CREATE 모형은 어떤 단계로 구성되나요?', 'CREATE 모형의 6단계는 다음과 같습니다:\\n1. C 진단 (Check & Context): AI·디지털 도구로 학생 개별 특성(흥미, 강점, 취약점) 파악 및 맞춤형 학습 출발점 설정 (진단 도구 선정, 실태 분석)\\n2. R 탐색 (Research & Resource): 진단 결과 바탕 자료·교육과정 준비 및 탐구 방향 설정 (교육자료 선정, 일반화 문장 및 탐구 질문 준비)\\n3. E 실행 (Execution & Engage): 온·오프라인 연계 학생 맞춤형 탐구 실행, 협력·공유·피드백 (디지털 협력, 실시간 모니터링)\\n4. A 분석 (Analysis & Action): 학생 이해도 분석·평가 및 다음 단계 또는 되돌아갈지 판단 (실행 분석, 환류 및 복귀 여부 판단)\\n5. T 전이 (Transfer & Think): 배운 개념을 타 교과와 실생활 상황에 연결·적용\\n6. E 성장 (Evolve & Evaluate): 단원 학습 정리 및 스스로 학습 성찰 (자기성찰 질문 및 활동)', 'CREATE 모형 안내', 'doc-guide-manual', 3, 1)`,
      `INSERT OR REPLACE INTO faq (id, question, answer, category, source_document_id, source_page, is_active) VALUES ('faq-3', 'CREATE 모형의 단계 흐름과 환류는 어떻게 이루어지나요?', 'CREATE 모형은 순차 진행과 환류가 결합된 구조입니다. C(진단) ➔ R(탐색) ➔ E(실행) ➔ A(분석)을 거친 후, 분석(A) 결과 목표에 도달하면 T(전이) ➔ E(성장)으로 나아갑니다. 반면 이해도가 낮으면 E(실행)로 복귀하여 다시 실행하거나, 필요하면 R(탐색)로 복귀하여 재설계 후 다시 실행과 분석을 반복합니다.', 'CREATE 모형 안내', 'doc-guide-manual', 3, 1)`,
      `INSERT OR REPLACE INTO faq (id, question, answer, category, source_document_id, source_page, is_active) VALUES ('faq-4', '수업 설계 시 유의할 점은 무엇인가요?', '1) AI·디지털 도구는 모든 단계에 무조건 쓰는 것이 아니라 수업 목표와 활동 목적에 맞게 적재적소에 온·오프라인을 연계해 활용합니다. 2) 6단계를 기계적으로 순차 적용하지 않고 A(분석) 단계의 환류를 통해 학생의 이해도에 맞춰 유연하게 순환 복귀합니다. 3) T(전이) 단계의 삶에 대한 적용과 E(성장) 단계의 자기 성찰을 충실히 보장해야 합니다.', 'CREATE 모형 안내', 'doc-guide-manual', 2, 1)`
    ];
    for (const sql of faqInserts) {
      try {
        await env.DB.prepare(sql).run();
      } catch (e: any) {
        errors.push(`FaqInsert: ${e.message}`);
      }
    }
  }

  // 최종 문서 개수 확인
  try {
    const finalRes = await env.DB.prepare("SELECT count(*) as cnt FROM documents").first<{ cnt: number }>();
    count = finalRes?.cnt || 0;
  } catch {}

  return {
    success: count > 0,
    errors,
    docsCount: count
  };
}
