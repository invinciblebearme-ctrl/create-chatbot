import { describe, it, expect } from 'vitest';
import { verifyCloudflareAccess } from '../auth';
import { Env } from '../env';

function createMockJwt(payload: any): string {
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payloadEncoded = btoa(JSON.stringify(payload));
  return `${header}.${payloadEncoded}.mock-signature`;
}

describe('Cloudflare Access Auth Tests', () => {
  const mockEnv: Env = {
    DB: {} as any,
    DOCS_BUCKET: {} as any,
    AI: {} as any,
    ENVIRONMENT: 'production',
    CF_ACCESS_TEAM_NAME: 'futureschool',
    CF_ACCESS_AUD: 'test-aud-123'
  };

  it('헤더 누락 시 인증 거부 (null 반환)', async () => {
    const req = new Request('https://api.test/api/chatbot/admin/documents');
    const result = await verifyCloudflareAccess(req, mockEnv);
    expect(result).toBeNull();
  });

  it('개발 환경에서 바이패스 헤더 허용', async () => {
    const devEnv: Env = { ...mockEnv, ENVIRONMENT: 'development' };
    const req = new Request('https://api.test/api/chatbot/admin/documents', {
      headers: { 'x-dev-admin-bypass': 'true' }
    });
    const result = await verifyCloudflareAccess(req, devEnv);
    expect(result).not.toBeNull();
    expect(result?.email).toBe('dev-admin@create.allforedu.kr');
  });

  it('유효한 Cloudflare Access JWT 정상 검증', async () => {
    const validPayload = {
      aud: ['test-aud-123'],
      email: 'teacher@school.kr',
      iss: 'https://futureschool.cloudflareaccess.com',
      exp: Math.floor(Date.now() / 1000) + 3600
    };

    const jwt = createMockJwt(validPayload);
    const req = new Request('https://api.test/api/chatbot/admin/documents', {
      headers: { 'Cf-Access-Jwt-Assertion': jwt }
    });

    const result = await verifyCloudflareAccess(req, mockEnv);
    expect(result).not.toBeNull();
    expect(result?.email).toBe('teacher@school.kr');
  });

  it('만료된 JWT 거부', async () => {
    const expiredPayload = {
      aud: ['test-aud-123'],
      email: 'teacher@school.kr',
      iss: 'https://futureschool.cloudflareaccess.com',
      exp: Math.floor(Date.now() / 1000) - 3600 // 1시간 전 만료
    };

    const jwt = createMockJwt(expiredPayload);
    const req = new Request('https://api.test/api/chatbot/admin/documents', {
      headers: { 'Cf-Access-Jwt-Assertion': jwt }
    });

    const result = await verifyCloudflareAccess(req, mockEnv);
    expect(result).toBeNull();
  });

  it('올바른 관리자 PIN(7703) 헤더 입력 시 인증 성공', async () => {
    const req = new Request('https://api.test/api/chatbot/admin/documents', {
      headers: { 'x-admin-pin': '7703' }
    });
    const result = await verifyCloudflareAccess(req, mockEnv);
    expect(result).not.toBeNull();
    expect(result?.authenticated).toBe(true);
    expect(result?.email).toBe('admin@create.allforedu.kr');
  });

  it('잘못된 관리자 PIN 헤더 입력 시 인증 실패', async () => {
    const req = new Request('https://api.test/api/chatbot/admin/documents', {
      headers: { 'x-admin-pin': '0000' }
    });
    const result = await verifyCloudflareAccess(req, mockEnv);
    expect(result).toBeNull();
  });
});
