# Cloudflare 인프라 구축 및 환경 설정 가이드

본 문서는 Cloudflare 무료 플랜 범위 내에서 D1, R2, Workers AI, Cloudflare Access를 설정하는 단계별 안내서입니다.

---

## 1. Cloudflare D1 데이터베이스 생성 및 마이그레이션

### 1.1 D1 데이터베이스 생성
```bash
npx wrangler d1 create future-chatbot-d1
```
*출력되는 `database_id`를 복사하여 `apps/api/wrangler.toml`의 `database_id`에 입력합니다.*

### 1.2 D1 테이블 스키마 및 시드 데이터 적용
```bash
# 초기 스키마 생성
npx wrangler d1 execute future-chatbot-d1 --remote --file=../../migrations/0001_initial.sql

# 테스트용 시드 데이터 등록 (샘플 안내서 및 단원설계안)
npx wrangler d1 execute future-chatbot-d1 --remote --file=../../migrations/0002_seed_data.sql
```

---

## 2. Cloudflare R2 버킷 생성 (PDF 원본 저장소)

```bash
npx wrangler r2 bucket create future-chatbot-docs
```

---

## 3. Cloudflare Access 관리자 인증 설정

일반 방문자는 `/api/chatbot/admin/*`에 접근할 수 없도록 Cloudflare Zero Trust Access로 보호합니다.

1. **Cloudflare Zero Trust 대시보드** 접속: `https://one.dash.cloudflare.com/`
2. **Access > Applications > Add an Application** 선택
3. **Self-hosted** 애플리케이션 추가:
   - Application Name: `CREATE Chatbot Admin`
   - Domain: `futureschool.allforedu.kr`
   - Path: `/chatbot/admin*` 및 `/api/chatbot/admin*`
4. **Policy(정책)** 설정:
   - Action: `Allow`
   - Rules: `Include` > `Emails` 또는 `Email Domains` (예: 연구학교 담당 교사 이메일 지정)
5. **Audience Tag(AUD) 확인**:
   - 애플리케이션 개요에서 `AUD` 태그를 복사하여 `apps/api/wrangler.toml`의 `CF_ACCESS_AUD` 변수에 설정합니다.

---

## 4. GitHub Actions 배포를 위한 Secrets 등록

GitHub 저장소(`future-chatbot`)의 **Settings > Secrets and variables > Actions**에서 다음 Secrets를 등록합니다:

| Secret 이름 | 설명 | 확인 방법 |
| :--- | :--- | :--- |
| `CLOUDFLARE_API_TOKEN` | Workers 및 Pages 배포 권한 토큰 | Cloudflare 대시보드 > My Profile > API Tokens |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 계정 ID | Cloudflare 대시보드 우측 하단 계정 ID 복사 |
