/**
 * D1 데이터베이스 안전 자동 초기화 서비스
 */

import { Env } from './env';

export async function runDatabaseSetup(env: Env): Promise<{ success: boolean; errors: string[]; docsCount: number }> {
  const errors: string[] = [];

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

  // 2. 현재 등록된 문서 수 확인
  let count = 0;
  try {
    const res = await env.DB.prepare("SELECT count(*) as cnt FROM documents").first<{ cnt: number }>();
    count = res?.cnt || 0;
  } catch (e: any) {
    errors.push(`Count: ${e.message}`);
  }

  // 3. 문서가 없으면 초기 시드 데이터 등록
  if (count === 0) {
    const docInserts = [
      `INSERT OR IGNORE INTO documents (id, title, description, category, grade, subject, tags, r2_key, page_count, status, is_public) VALUES ('doc-sample-create-guide', '[테스트용 샘플] CREATE 교수·학습 모형 기본 안내서', '초등학교 연구학교 CREATE 모형의 개념, 6단계 구성, 교수학습 활동 및 수업 설계 원칙을 안내하는 기초 매뉴얼입니다.', 'CREATE 모형 안내', '공통', '융합/통합', '["CREATE모형", "개념", "단계별활동", "유의사항", "연구학교"]', 'sample_create_guide.pdf', 5, 'COMPLETED', 1)`,
      `INSERT OR IGNORE INTO documents (id, title, description, category, grade, subject, tags, r2_key, page_count, status, is_public) VALUES ('doc-sample-grade5-design', '[테스트용 샘플] 5학년 과학·실과 융합 CREATE 단원설계안', '5학년 태양계와 지구 및 지속가능한 에너지 기술을 주제로 한 CREATE 모형 기반 단원설계안입니다.', '학년별 단원설계안', '5학년', '과학', '["단원설계안", "5학년", "과학", "에너지", "실과"]', 'sample_grade5_design.pdf', 8, 'COMPLETED', 1)`,
      `INSERT OR IGNORE INTO documents (id, title, description, category, grade, subject, tags, r2_key, page_count, status, is_public) VALUES ('doc-sample-grade6-lesson', '[테스트용 샘플] 6학년 사회과 CREATE 실증수업 지도안', '6학년 우리나라의 민주정치 단원에 CREATE 모형을 적용한 실제 실증수업 지도안 및 평가계획입니다.', '실증수업 지도안', '6학년', '사회', '["실증수업", "지도안", "6학년", "사회", "민주정치"]', 'sample_grade6_lesson.pdf', 6, 'COMPLETED', 1)`
    ];
    for (const sql of docInserts) {
      try {
        await env.DB.prepare(sql).run();
      } catch (e: any) {
        errors.push(`DocInsert: ${e.message}`);
      }
    }

    const chunkInserts = [
      `INSERT OR IGNORE INTO document_chunks (id, document_id, page_number, chunk_index, content, search_text) VALUES ('chunk-guide-p1-1', 'doc-sample-create-guide', 1, 0, '1. CREATE 교수·학습 모형이란 무엇인가요? CREATE 모형은 미래 핵심역량 함양을 위해 초등학교 연구학교에서 개발된 학습자 주도형 탐구·창작 교수·학습 모델입니다. 학생들이 실제 삶의 문제와 맥락에서 출발하여 주도적으로 질문하고 협력적으로 문제를 해결하며 산출물을 창조하고 공유하는 전 과정을 구조화한 것입니다. 본 모형은 C(연결/도전), R(탐구/연구), E(체험/실험), A(적용/제작), T(변형/심화), E(성찰/평가)의 체계적인 흐름을 가집니다. [출처: CREATE 모형 기본 안내서 1쪽]', '1 create 교수 학습 모형이란 무엇인가요 create 모형은 미래 핵심역량 함양을 위해 초등학교 연구학교에서 개발된 학습자 주도형 탐구 창작 교수 학습 모델입니다 학생 삶 문제 맥락 질문 협력 산출물 창조 공유 구조화 c 연결 도전 r 탐구 연구 e 체험 실험 a 적용 제작 t 변형 심화 e 성찰 평가 체계적 흐름')`,
      `INSERT OR IGNORE INTO document_chunks (id, document_id, page_number, chunk_index, content, search_text) VALUES ('chunk-guide-p2-1', 'doc-sample-create-guide', 2, 0, '2. CREATE 모형은 어떤 단계로 구성되나요? CREATE 모형은 다음의 6가지 핵심 단계로 구성됩니다: 1단계 C (Connect & Challenge): 실생활 문제 발견 및 학습 동기 연결, 도전 과제 설정 / 2단계 R (Research & Reason): 관련 정보 수집, 원리 탐구, 자료 분석 및 추론 / 3단계 E (Explore & Experiment): 다양한 아이디어 발상 및 가설 검증, 실험적 탐색 / 4단계 A (Apply & Act): 아이디어의 구체화, 산출물 제작 및 프로젝트 실제 적용 / 5단계 T (Transform & Think): 피드백 수용, 산출물 변형·개선, 비판적·확장적 사고 / 6단계 E (Evaluate & Extend): 과정 및 결과 성찰, 동료 평가, 배움의 일상화 및 확장. 각 단계는 선형적인 진행에 국한되지 않고 학습자의 탐구 흐름에 따라 순환적으로 연계될 수 있습니다. [출처: CREATE 모형 기본 안내서 2쪽]', '2 create 모형은 어떤 단계로 구성되나요 create 모형 6가지 핵심 단계 1단계 c connect challenge 실생활 문제 발견 학습 동기 연결 도전 과제 2단계 r research reason 관련 정보 수집 원리 탐구 자료 분석 추론 3단계 e explore experiment 아이디어 발상 가설 검증 실험적 탐색 4단계 a apply act 구체화 산출물 제작 프로젝트 실제 적용 5단계 t transform think 피드백 산출물 변형 개선 비판적 확장적 사고 6단계 e evaluate extend 과정 결과 성찰 동료 평가 배움 일상화 확장 순환적')`,
      `INSERT OR IGNORE INTO document_chunks (id, document_id, page_number, chunk_index, content, search_text) VALUES ('chunk-guide-p3-1', 'doc-sample-create-guide', 3, 0, '3. 단계별 주요 교수·학습 활동 안내: C단계(도전 연결): 일상 속 상황 영상 시청, 학생 질문 만들기, 핵심 탐구 질문 도출 / R단계(탐구 조사): 디지털 기기 및 도서를 활용한 정보 검색, 전문가 인터뷰, 데이터 수집 및 분류 / E단계(체험 실험): 모둠별 브레인스토밍, 프로토타입 구상, 사전 시뮬레이션 및 테스트 / A단계(적용 제작): 협력적 산출물 제작(디지털 콘텐츠, 발명품, 보고서, 캠페인 등) / T단계(변형 심화): 갤러리 워크를 통한 피드백 주고받기, 문제점 수정 및 기능 고도화 / E단계(평가 확장): 자기평가·동료평가 루브릭 작성, 학급 공유회, 일상생활 실천 다짐 [출처: CREATE 모형 기본 안내서 3쪽]', '3 단계별 주요 교수 학습 활동 안내 c단계 도전 연결 일상 상황 영상 학생 질문 핵심 탐구 질문 도출 r단계 탐구 조사 디지털 기기 도서 정보 검색 인터뷰 데이터 수집 분류 e단계 체험 실험 모둠 브레인스토밍 프로토타입 구상 시뮬레이션 테스트 a단계 적용 제작 협력 산출물 디지털 콘텐츠 발명품 보고서 캠페인 t단계 변형 심화 갤러리 워크 피드백 문제점 수정 기능 고도화 e단계 평가 확장 자기평가 동료평가 루브릭 학급 공유회 일상생활 실천')`,
      `INSERT OR IGNORE INTO document_chunks (id, document_id, page_number, chunk_index, content, search_text) VALUES ('chunk-guide-p5-1', 'doc-sample-create-guide', 5, 0, '4. CREATE 모형 적용 수업 설계 시 유의할 점: 1) 교사 주도의 강의를 최소화하고 학생의 주도적 질문과 탐구 시간을 충분히 확보해야 합니다. 2) 모든 단계를 기계적으로 순차 적용하기보다 단원의 성취기준과 학생 발달 단계에 맞게 유연하게 재구성할 수 있습니다. 3) T(변형/심화) 단계의 피드백 과정을 생략하지 말고 동료 간 성장을 지원하는 안전한 학급 문화를 조성해야 합니다. 4) 결과물 중심의 평가를 지양하고 전 과정에서 과정중심평가와 배움 기록을 누적합니다. 5) 디지털 도구는 목적이 아닌 문제해결을 촉진하는 도구로 적절하게 배치해야 합니다. [출처: CREATE 모형 기본 안내서 5쪽]', '4 create 모형 적용 수업 설계 시 유의할 점 1 교사 주도 강의 최소화 학생 주도 질문 탐구 시간 충분히 확보 2 성취기준 학생 발달 단계 유연 재구성 3 t 변형 심화 피드백 생략 안전한 학급 문화 조성 4 결과물 중심 지양 과정중심평가 배움 기록 5 디지털 도구 목적 문제해결 촉진 도구')`
    ];
    for (const sql of chunkInserts) {
      try {
        await env.DB.prepare(sql).run();
      } catch (e: any) {
        errors.push(`ChunkInsert: ${e.message}`);
      }
    }

    // FTS 동기화
    try {
      await env.DB.prepare("INSERT OR IGNORE INTO document_chunks_fts (chunk_id, document_id, content, search_text) SELECT id, document_id, content, search_text FROM document_chunks").run();
    } catch (e: any) {
      errors.push(`FTSSync: ${e.message}`);
    }

    // FAQ 등록
    const faqInserts = [
      `INSERT OR IGNORE INTO faq (id, question, answer, category, source_document_id, source_page, is_active) VALUES ('faq-1', 'CREATE 모형이란 무엇인가요?', 'CREATE 모형은 초등학교 연구학교에서 개발된 학습자 주도형 탐구·창작 교수·학습 모델입니다. 학생들의 삶의 문제에서 출발하여 C(연결/도전), R(탐구/연구), E(체험/실험), A(적용/제작), T(변형/심화), E(성찰/평가)의 6단계를 거치며 핵심역량을 기르도록 돕습니다.', 'CREATE 모형 안내', 'doc-sample-create-guide', 1, 1)`,
      `INSERT OR IGNORE INTO faq (id, question, answer, category, source_document_id, source_page, is_active) VALUES ('faq-2', 'CREATE 모형은 어떤 단계로 구성되나요?', 'CREATE 모형은 6가지 단계로 구성됩니다: 1단계 C(Connect & Challenge), 2단계 R(Research & Reason), 3단계 E(Explore & Experiment), 4단계 A(Apply & Act), 5단계 T(Transform & Think), 6단계 E(Evaluate & Extend)입니다.', 'CREATE 모형 안내', 'doc-sample-create-guide', 2, 1)`,
      `INSERT OR IGNORE INTO faq (id, question, answer, category, source_document_id, source_page, is_active) VALUES ('faq-3', '수업 설계 시 유의할 점은 무엇인가요?', '1) 교사 중심 수업을 지양하고 학생의 탐구 시간을 충분히 확보해야 합니다. 2) 모든 단계를 무조건 기계적으로 적용하지 않고 성취기준에 맞게 유연하게 구성합니다. 3) T단계 피드백과 E단계 과정평가를 내실 있게 운영해야 합니다.', 'CREATE 모형 안내', 'doc-sample-create-guide', 5, 1)`
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
