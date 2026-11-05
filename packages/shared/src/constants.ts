/**
 * CREATE AI 수업 도우미 - 상수 및 정책 정의
 */

export const RECOMMENDED_QUESTIONS = [
  'CREATE 모형이란 무엇인가요?',
  'CREATE 모형 6단계(진단-탐색-실행-분석-전이-성장)는 무엇인가요?',
  'A(분석) 단계의 순차+환류 흐름은 어떻게 진행되나요?',
  '단계별 핵심 활동(진단 도구, 탐구 질문 등)을 알려주세요.',
  '학년별 CREATE 단원설계안과 수업 사례를 찾아주세요.',
  'CREATE 모형 수업 설계 시 유의할 점은 무엇인가요?'
] as const;

export interface CreateStageInfo {
  letter: 'C' | 'R' | 'E' | 'A' | 'T' | 'E';
  name: string;
  english: string;
  summary: string;
  coreActivities: string;
  flowRole: string;
}

export const CREATE_STAGES: CreateStageInfo[] = [
  {
    letter: 'C',
    name: '진단',
    english: 'Check & Context',
    summary: 'AI·디지털 도구로 학생의 개별 특성(흥미, 강점, 취약점)을 파악해 맞춤형 학습 출발점을 정한다',
    coreActivities: '진단 도구 선정, 학습자 실태 분석',
    flowRole: '출발점 파악'
  },
  {
    letter: 'R',
    name: '탐색',
    english: 'Research & Resource',
    summary: '진단 결과를 바탕으로 자료와 교육과정을 준비하고 탐구의 방향을 정한다',
    coreActivities: '교육자료 선정, 교육과정 수정 여부 결정, 일반화 문장 및 탐구 질문 준비',
    flowRole: '자료·질문 준비'
  },
  {
    letter: 'E',
    name: '실행',
    english: 'Execution & Engage',
    summary: '온·오프라인을 연계해 학생 맞춤형 탐구를 실행하고 협력·공유·피드백한다',
    coreActivities: '맞춤형 탐구 실행, 디지털 플랫폼 협력·공유, 데이터 기반 실시간 모니터링·피드백',
    flowRole: '맞춤형 탐구'
  },
  {
    letter: 'A',
    name: '분석',
    english: 'Analysis & Action',
    summary: '학생의 이해도를 분석·평가하고 다음 단계로 나아갈지, 되돌아갈지 판단한다',
    coreActivities: '실행 분석 및 평가, 환류 및 복귀 여부 판단',
    flowRole: '목표 도달 판단'
  },
  {
    letter: 'T',
    name: '전이',
    english: 'Transfer & Think',
    summary: '배운 개념을 타 교과와 실생활 상황에 연결·적용한다',
    coreActivities: '타 교과 및 실생활과 연결',
    flowRole: '삶에 적용'
  },
  {
    letter: 'E',
    name: '성장',
    english: 'Evolve & Evaluate',
    summary: '단원 학습을 정리하고 스스로 학습을 성찰한다',
    coreActivities: '단원(주제) 학습 정리하기, 자기성찰 질문 및 활동 제공',
    flowRole: '정리·성찰'
  }
];

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
  '진단': ['진단', 'c단계', 'check', 'context', '출발점', '학습자실태', '실태분석', '진단도구'],
  '탐색': ['탐색', 'r단계', 'research', 'resource', '자료선정', '배움문장', '탐구질문', '일반화문장', '교육과정수정'],
  '실행': ['실행', 'e단계', 'execution', 'engage', '맞춤형탐구', '온오프라인', '실시간모니터링', '디지털플랫폼'],
  '분석': ['분석', 'a단계', 'analysis', 'action', '환류', '복귀', '목표도달판단', '되돌아갈지', '이해도분석'],
  '전이': ['전이', 't단계', 'transfer', 'think', '타교과', '실생활', '연결적용', '삶에적용'],
  '성장': ['성장', '두번째e단계', 'evolve', 'evaluate', '단원학습정리', '자기성찰', '성찰질문'],
  '환류': ['환류', '복귀', '순차환류', 'a단계환류', 'e로복귀', 'r로복귀', '반복', '되돌아가']
};
