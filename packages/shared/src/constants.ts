/**
 * CREATE AI 수업 도우미 - 상수 및 정책 정의
 */

export const RECOMMENDED_QUESTIONS = [
  'CREATE 모형이란 무엇인가요?',
  'CREATE 모형은 어떤 단계로 구성되나요?',
  '단계별 교수·학습 활동을 알려주세요.',
  '학년별 단원설계안을 찾아주세요.',
  'CREATE 모형을 적용한 수업 사례가 있나요?',
  '수업 설계 시 유의할 점은 무엇인가요?'
] as const;

export const DEFAULT_AI_MODEL = '@cf/meta/llama-3.1-8b-instruct';
export const FALLBACK_AI_MODEL = '@cf/qwen/qwen1.5-7b-chat-awq';

export const AI_QUOTA_POLICY = {
  // Cloudflare Workers AI 무료 티어 보호를 위한 일일 보수적 요청 한도
  DAILY_MAX_REQUESTS: 250,
  // 1분당 IP별 최대 요청 수
  RATE_LIMIT_PER_MINUTE: 15,
  // 최대 질문 길이 (글자 수)
  MAX_QUERY_LENGTH: 500,
  // 검색 컨텍스트 최대 조각 수
  MAX_CONTEXT_CHUNKS: 5,
  // 컨텍스트 글자 수 제한
  MAX_CONTEXT_CHARS: 3000,
  // 생성 답변 최대 토큰 수
  MAX_OUTPUT_TOKENS: 1024,
  // 응답 캐시 유효 시간 (ms, 동일 질문 10분)
  CACHE_TTL_MS: 10 * 60 * 1000
};

export const UPLOAD_LIMITS = {
  // PDF 최대 업로드 용량 (30MB)
  MAX_FILE_SIZE_BYTES: 30 * 1024 * 1024,
  // 허용 MIME 타입
  ALLOWED_MIME_TYPES: ['application/pdf'],
  // 단일 청크 권장 글자 수
  CHUNK_TARGET_SIZE: 600,
  // 청크 중첩 글자 수
  CHUNK_OVERLAP_SIZE: 100
};

export const CREATE_SYNONYM_MAP: Record<string, string[]> = {
  'create': ['create', '크리에이트', '씨알이에이티이', '연구학교모형'],
  '모형': ['모형', '교수학습모형', '수업모형', '학습모델'],
  '지도안': ['지도안', '수업안', '교수학습과정안', '수업과정안', '단원지도안'],
  '단원설계안': ['단원설계안', '단원설계', '단원계획', '단원개발', '단원안'],
  '활동': ['활동', '학습활동', '교수활동', '과제', '프로젝트'],
  '평가': ['평가', '수행평가', '형성평가', '과정중심평가', '성찰'],
  '사례': ['사례', '수업사례', '실천사례', '적용사례', '실증사례'],
  '유의점': ['유의점', '유의사항', '주의점', '고려사항', '설계원칙'],
  '진단': ['진단', 'c단계', 'check', 'context', '출발점', '학습자실태', '진단도구'],
  '탐색': ['탐색', 'r단계', 'research', 'resource', '자료선정', '배움문장', '탐구질문', '교육과정수정'],
  '실행': ['실행', 'e단계', 'execution', 'engage', '맞춤형탐구', '디지털플랫폼', '모니터링'],
  '분석': ['분석', 'a단계', 'analysis', 'action', '이해도분석', '환류', '복귀', '목표도달'],
  '전이': ['전이', 't단계', 'transfer', 'think', '타교과연결', '실생활연결', '삶에적용'],
  '성장': ['성장', '두번째e단계', 'evolve', 'evaluate', '단원정리', '자기성찰', '성찰'],
  '환류': ['환류', '복귀', '되돌아가기', '되돌아갈지', '재실행', '재설계']
};

/**
 * 연구학교 공식 CREATE 모형 6단계 한눈에 보기
 * (출처: 2026 교육부 요청 전북특별자치도교육청지정 AI 디지털 활용 연구학교 공식 규정)
 */
export interface CreateStageItem {
  code: string;
  name: string;
  english: string;
  subTitle: string;
  oneLineDef: string;
  keyActivities: string[];
}

export const OFFICIAL_CREATE_STAGES: CreateStageItem[] = [
  {
    code: 'C',
    name: '진단',
    english: 'Check & Context',
    subTitle: '출발점 파악',
    oneLineDef: 'AI·디지털 도구로 학생의 개별 특성(흥미, 강점, 취약점)을 파악해 맞춤형 학습 출발점을 정한다',
    keyActivities: ['진단 도구 선정', '학습자 실태 분석']
  },
  {
    code: 'R',
    name: '탐색',
    english: 'Research & Resource',
    subTitle: '자료·질문 준비',
    oneLineDef: '진단 결과를 바탕으로 자료와 교육과정을 준비하고 탐구의 방향을 정한다',
    keyActivities: ['교육자료 선정', '교육과정 수정 여부 결정', '일반화 문장 및 탐구 질문 준비']
  },
  {
    code: 'E',
    name: '실행',
    english: 'Execution & Engage',
    subTitle: '맞춤형 탐구',
    oneLineDef: '온·오프라인을 연계해 학생 맞춤형 탐구를 실행하고 협력·공유·피드백한다',
    keyActivities: ['맞춤형 탐구 실행', '디지털 플랫폼 협력·공유', '데이터 기반 실시간 모니터링·피드백']
  },
  {
    code: 'A',
    name: '분석',
    english: 'Analysis & Action',
    subTitle: '목표 도달 판단 (환류의 핵심 분기점)',
    oneLineDef: '학생의 이해도를 분석·평가하고 다음 단계로 나아갈지, 되돌아갈지 판단한다',
    keyActivities: ['실행 분석 및 평가', '환류 및 복귀 여부 판단']
  },
  {
    code: 'T',
    name: '전이',
    english: 'Transfer & Think',
    subTitle: '삶에 적용',
    oneLineDef: '배운 개념을 타 교과와 실생활 상황에 연결·적용한다',
    keyActivities: ['타 교과 및 실생활과 연결']
  },
  {
    code: 'E',
    name: '성장',
    english: 'Evolve & Evaluate',
    subTitle: '정리·성찰',
    oneLineDef: '단원 학습을 정리하고 스스로 학습을 성찰한다',
    keyActivities: ['단원(주제) 학습 정리하기', '자기성찰 질문 및 활동 제공']
  }
];

export const OFFICIAL_CREATE_FLOW = {
  title: '단계의 흐름: 순차 + 환류',
  description: '분석(A) 결과에 따라 전이로 나아가거나, 돌아가서 실행과 분석을 반복합니다',
  sequentialOrder: ['C 진단', 'R 탐색', 'E 실행', 'A 분석', 'T 전이', 'E 성장'],
  feedbackRules: [
    {
      condition: '목표 도달 시',
      action: 'T 전이(삶에 적용) ➔ E 성장(정리·성찰)으로 나아감'
    },
    {
      condition: '이해도가 낮으면',
      action: 'E 실행으로 복귀 (다시 실행한 뒤 다시 분석 반복)'
    },
    {
      condition: '필요하면',
      action: 'R 탐색으로 복귀 (재설계 후 다시 실행)'
    }
  ]
};

