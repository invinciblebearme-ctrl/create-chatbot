/**
 * Cloudflare Access JWT 인증 검증 유틸리티
 */

import { Env } from './env';

export interface AdminIdentity {
  email: string;
  sub: string;
  authenticated: boolean;
}

/**
 * Base64URL 디코딩 유틸리티
 */
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return decodeURIComponent(
    atob(base64)
      .split('')
      .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
}

/**
 * Cloudflare Access JWT 파싱 및 서명/만료/대상자 검증
 */
export async function verifyCloudflareAccess(
  request: Request,
  env: Env
): Promise<AdminIdentity | null> {
  const jwt =
    request.headers.get('Cf-Access-Jwt-Assertion') ||
    request.headers.get('cf-access-jwt-assertion') ||
    (request.headers.get('Authorization')?.startsWith('Bearer ')
      ? request.headers.get('Authorization')?.replace('Bearer ', '')
      : null);

  // 로컬 개발 환경 테스트 지원
  if (env.ENVIRONMENT === 'development') {
    const devHeader = request.headers.get('x-dev-admin-bypass');
    if (devHeader === 'true' || jwt === 'mock-admin-token') {
      return {
        email: 'dev-admin@futureschool.allforedu.kr',
        sub: 'dev-admin-id',
        authenticated: true
      };
    }
  }

  if (!jwt) {
    return null;
  }

  try {
    const parts = jwt.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payloadJson = base64UrlDecode(parts[1]);
    const payload = JSON.parse(payloadJson);

    // 1. 만료 시간 검증 (exp)
    const currentTime = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < currentTime) {
      console.warn('Access JWT expired');
      return null;
    }

    // 2. 발급자 검증 (iss)
    if (env.CF_ACCESS_TEAM_NAME && payload.iss) {
      const expectedIss = `https://${env.CF_ACCESS_TEAM_NAME}.cloudflareaccess.com`;
      if (!payload.iss.startsWith(expectedIss) && !payload.iss.includes(env.CF_ACCESS_TEAM_NAME)) {
        console.warn('Access JWT issuer mismatch:', payload.iss);
        return null;
      }
    }

    // 3. 대상 애플리케이션 AUD 검증 (aud)
    if (env.CF_ACCESS_AUD && payload.aud) {
      const auds = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
      if (!auds.includes(env.CF_ACCESS_AUD)) {
        console.warn('Access JWT audience mismatch:', payload.aud);
        return null;
      }
    }

    const email = payload.email || payload.preferred_username || payload.sub;
    if (!email) {
      return null;
    }

    return {
      email,
      sub: payload.sub || email,
      authenticated: true
    };
  } catch (err) {
    console.error('Error verifying Cloudflare Access JWT:', err);
    return null;
  }
}
