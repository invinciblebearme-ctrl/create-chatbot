/**
 * 보안 및 파일 유효성 검증 유틸리티
 */

import { AI_QUOTA_POLICY } from '@create-chatbot/shared';

// 메모리 기반 IP 속도 제한 (초기 인메모리 슬라이딩 윈도우)
const ipRateLimitMap = new Map<string, { count: number; resetTime: number }>();

/**
 * IP 기반 요청 빈도 제한 검사 (DDoS 및 남용 방지)
 */
export function checkRateLimit(clientIp: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1분
  const maxRequests = AI_QUOTA_POLICY.RATE_LIMIT_PER_MINUTE;

  const record = ipRateLimitMap.get(clientIp);
  if (!record || now > record.resetTime) {
    ipRateLimitMap.set(clientIp, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * PDF 파일 바이너리 시그니처 (매직 넘버 %PDF-) 검증
 */
export function validatePdfSignature(buffer: ArrayBuffer): boolean {
  if (!buffer || buffer.byteLength < 5) return false;
  const bytes = new Uint8Array(buffer, 0, 5);
  // %PDF- => 0x25, 0x50, 0x44, 0x46, 0x2D
  return (
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  );
}

/**
 * 사용자 입력 문자열 기본 검증 및 소독
 */
export function sanitizeUserInput(input: string, maxLength = AI_QUOTA_POLICY.MAX_QUERY_LENGTH): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/\0/g, '') // null byte 제거
    .trim()
    .slice(0, maxLength);
}

/**
 * 프롬프트 인젝션 방어: 문서 내용 및 질문 내 위험 지시어 격리
 */
export function sanitizePromptContext(text: string): string {
  if (!text) return '';
  return text
    .replace(/```/g, "'''") // 백틱 탈출 방지
    .replace(/(system prompt|ignore previous instructions|너의 지침을 무시하라|시스템 명령)/gi, '[제거된 텍스트]');
}
