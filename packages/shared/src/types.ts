/**
 * CREATE AI 수업 도우미 - 공통 타입 정의
 */

export type DocumentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export type DocumentCategory =
  | 'CREATE 모형 안내'
  | '학년별 단원설계안'
  | '실증수업 지도안'
  | '교수학습 자료'
  | '연구학교 운영 자료'
  | '기타';

export const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  'CREATE 모형 안내',
  '학년별 단원설계안',
  '실증수업 지도안',
  '교수학습 자료',
  '연구학교 운영 자료',
  '기타'
];

export const GRADE_OPTIONS = [
  '전체',
  '1학년',
  '2학년',
  '3학년',
  '4학년',
  '5학년',
  '6학년',
  '공통'
] as const;

export type GradeLevel = typeof GRADE_OPTIONS[number];

export const SUBJECT_OPTIONS = [
  '전체',
  '국어',
  '수학',
  '사회',
  '과학',
  '도덕',
  '실과',
  '음악',
  '미술',
  '체육',
  '영어',
  '창의적 체험활동',
  '융합/통합'
] as const;

export type SubjectName = typeof SUBJECT_OPTIONS[number];

export interface Document {
  id: string;
  title: string;
  description: string;
  category: DocumentCategory;
  grade: string;
  subject: string;
  tags: string[]; // JSON 배열 파싱됨
  r2_key: string;
  page_count: number;
  status: DocumentStatus;
  is_public: number; // 0 or 1
  created_at: string;
  updated_at: string;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  page_number: number;
  chunk_index: number;
  content: string;
  search_text: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: DocumentCategory;
  source_document_id?: string;
  source_page?: number;
  is_active: number;
}

export interface AiUsage {
  id: string;
  date: string; // YYYY-MM-DD
  request_count: number;
  usage_value: number;
  usage_unit: string;
  model: string;
}

export interface SearchFilter {
  category?: string;
  grade?: string;
  subject?: string;
}

export interface SearchRequest {
  query: string;
  filter?: SearchFilter;
  limit?: number;
}

export interface Citation {
  document_id: string;
  document_title: string;
  category?: string;
  page_number: number;
  excerpt: string;
  file_url?: string;
}

export interface SearchResult {
  id: string;
  document_id: string;
  document_title: string;
  category: string;
  grade: string;
  subject: string;
  page_number: number;
  content: string;
  score: number;
  matched_keywords: string[];
}

export type ChatMode = 'search' | 'ai';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  mode?: ChatMode;
  citations?: Citation[];
  timestamp: number;
  is_fallback?: boolean;
  error?: string;
}

export interface ChatRequest {
  message: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  mode?: ChatMode;
  filter?: SearchFilter;
}

export interface ChatResponse {
  answer: string;
  mode_used: ChatMode;
  citations: Citation[];
  is_fallback: boolean;
  search_results_count: number;
  quota_status?: {
    daily_requests: number;
    daily_limit: number;
  };
}

export interface AiModelUsage {
  model: string;
  request_count: number;
}

export interface AdminStats {
  total_documents: number;
  public_documents: number;
  indexed_documents: number;
  failed_documents: number;
  ai_requests_today: number;
  ai_limit_daily?: number;
  ai_model_usage?: AiModelUsage[];
  search_requests_today: number;
  recent_documents: Document[];
  recent_errors: string[];
}

export interface DocumentUploadChunk {
  page_number: number;
  chunk_index: number;
  content: string;
}

export interface DocumentUploadPayload {
  title: string;
  description: string;
  category: DocumentCategory;
  grade: string;
  subject: string;
  tags: string[];
  is_public: boolean;
  page_count: number;
  chunks?: DocumentUploadChunk[];
}

export interface DocumentUpdatePayload {
  title?: string;
  description?: string;
  category?: DocumentCategory;
  grade?: string;
  subject?: string;
  tags?: string[];
  is_public?: boolean;
}
