/**
 * Cloudflare Workers 환경 바인딩 타입
 */

export interface Env {
  // Cloudflare D1
  DB: D1Database;

  // Cloudflare R2
  DOCS_BUCKET: R2Bucket;

  // Cloudflare Workers AI
  AI: any;

  // 환경 변수
  ENVIRONMENT?: string;
  ALLOWED_ORIGIN?: string;
  CF_ACCESS_TEAM_NAME?: string;
  CF_ACCESS_AUD?: string;
  AI_MODEL_NAME?: string;
}
