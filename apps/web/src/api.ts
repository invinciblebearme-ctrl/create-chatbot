/**
 * 프런트엔드 API 클라이언트
 */

import {
  ChatRequest,
  ChatResponse,
  SearchFilter,
  SearchResult,
  Document,
  AdminStats
} from '@create-chatbot/shared';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/chatbot';

export async function sendChatMessage(
  message: string,
  mode: 'search' | 'ai' = 'search',
  filter?: SearchFilter
): Promise<ChatResponse> {
  const payload: ChatRequest = {
    message,
    mode,
    filter
  };

  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `서버 오류 (${res.status})`);
  }

  return res.json();
}

export async function searchDocuments(
  query: string,
  filter?: SearchFilter
): Promise<{ query: string; keywords: string[]; count: number; results: SearchResult[] }> {
  const res = await fetch(`${API_BASE}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, filter })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `검색 실패 (${res.status})`);
  }

  return res.json();
}

export async function fetchPublicDocuments(filter?: SearchFilter): Promise<Document[]> {
  const params = new URLSearchParams();
  if (filter?.category && filter.category !== '전체') params.append('category', filter.category);
  if (filter?.grade && filter.grade !== '전체') params.append('grade', filter.grade);
  if (filter?.subject && filter.subject !== '전체') params.append('subject', filter.subject);

  const res = await fetch(`${API_BASE}/documents?${params.toString()}`);
  if (!res.ok) {
    throw new Error('문서 목록을 불러오지 못했습니다.');
  }

  const data = await res.json();
  return data.documents || [];
}

// --- 관리자 API ---

function getAdminHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  // 로컬 개발 환경용 바이패스 헤더 지원
  const devToken = localStorage.getItem('cf_access_dev_token');
  if (devToken) {
    headers['Authorization'] = `Bearer ${devToken}`;
    headers['x-dev-admin-bypass'] = 'true';
  } else {
    // 기본 로컬 편의 바이패스
    headers['x-dev-admin-bypass'] = 'true';
  }
  return headers;
}

export async function adminFetchDocuments(): Promise<Document[]> {
  const res = await fetch(`${API_BASE}/admin/documents`, {
    headers: getAdminHeaders()
  });

  if (res.status === 401) {
    throw new Error('관리자 인증이 필요합니다. Cloudflare Access 로그인이 필요합니다.');
  }
  if (!res.ok) {
    throw new Error(`관리자 문서 조회 실패 (${res.status})`);
  }

  const data = await res.json();
  return data.documents || [];
}

export async function adminUploadDocument(formData: FormData): Promise<any> {
  const headers: HeadersInit = {};
  const devToken = localStorage.getItem('cf_access_dev_token');
  if (devToken) {
    headers['Authorization'] = `Bearer ${devToken}`;
  }
  headers['x-dev-admin-bypass'] = 'true';

  const res = await fetch(`${API_BASE}/admin/documents`, {
    method: 'POST',
    headers,
    body: formData
  });

  if (res.status === 401) {
    throw new Error('관리자 권한이 없습니다.');
  }
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || '자료 등록에 실패했습니다.');
  }

  return res.json();
}

export async function adminDeleteDocument(docId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/admin/documents/${docId}`, {
    method: 'DELETE',
    headers: getAdminHeaders()
  });

  if (!res.ok) {
    throw new Error('자료 삭제 실패');
  }

  return res.json();
}

export async function adminReindexDocument(docId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/admin/documents/${docId}/reindex`, {
    method: 'POST',
    headers: getAdminHeaders()
  });

  if (!res.ok) {
    throw new Error('재색인 실패');
  }

  return res.json();
}

export async function adminFetchStats(): Promise<AdminStats> {
  const res = await fetch(`${API_BASE}/admin/usage`, {
    headers: getAdminHeaders()
  });

  if (res.status === 401) {
    throw new Error('관리자 권한이 필요합니다.');
  }
  if (!res.ok) {
    throw new Error('통계 정보 조회 실패');
  }

  return res.json();
}

export async function adminTestSearch(query: string): Promise<any> {
  const res = await fetch(`${API_BASE}/admin/test-search`, {
    method: 'POST',
    headers: getAdminHeaders(),
    body: JSON.stringify({ query })
  });

  if (!res.ok) {
    throw new Error('테스트 검색 실패');
  }

  return res.json();
}
