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
  '유의점': ['유의점', '유의사항', '주의점', '고려사항', '설계원칙']
};
