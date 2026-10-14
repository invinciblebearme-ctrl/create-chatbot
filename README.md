# CREATE AI 수업 도우미 (create-chatbot)

초등학교 연구학교의 **CREATE 교수·학습 모형** 공식 안내 및 수업 설계를 지원하는 **무료 검색 + Cloudflare Workers AI 하이브리드 교육용 챗봇**입니다.

> 🏫 **공식 운영 도메인**: [https://create.allforedu.kr/chatbot/](https://create.allforedu.kr/chatbot/)  
> 🛡️ **비용 정책**: 유료 OpenAI API, 유료 벡터 DB 없이 **Cloudflare 무료 티어 100% 범위**에서 안정적으로 운영됩니다.

---

## 🌟 핵심 특징

1. **공식 연구학교 자료 100% 근거 (Anti-Hallucination)**
   - 임의의 지식이나 추측으로 답변하지 않으며, 관리자가 등록한 공식 매뉴얼 및 단원설계안 PDF에만 근거합니다.
   - 근거가 부족한 경우 솔직하게 "확인할 수 없습니다"라고 안내합니다.
2. **하이브리드 답변 시스템 (무료 검색 우선 + AI 선택)**
   - **기본 모드 (무료 자료 검색)**: AI를 호출하지 않고 D1 기반 한국어 최적화 검색을 통해 원문 발췌 및 출처를 정확하게 제공합니다.
   - **AI 모드 (대화형 요약)**: 교사가 원할 때만 Cloudflare Workers AI(`@cf/meta/llama-3.3-70b-instruct-fp8-fast`)를 호출하여 친절한 대화형 답변을 생성합니다.
3. **정확한 출처 표시 및 원본 PDF 뷰어 연동**
   - 모든 답변에 참고한 공식 문서명과 페이지 번호(쪽수)를 명시합니다.
   - 브라우저 내 Canvas 뷰어를 지원하여 다운로드 없이 즉시 원문과 페이지를 조회합니다.
4. **브라우저 측 PDF 텍스트 추출 및 색인 (PDF.js)**
   - 관리자가 PDF를 업로드하면 브라우저 내에서 텍스트를 추출하고 청크로 분할하여 D1에 자동 색인합니다.
   - 스캔본 PDF를 위한 수동 텍스트 직접 입력 모드도 제공합니다.
5. **관리자 비밀번호 잠금 (PIN: 7703) 및 AI 쿼터 모니터링**
   - 관리자 화면(`/chatbot/admin`)은 전용 PIN(`7703`) 보안 잠금 화면으로 보호됩니다.
   - 일일 무료 250회 AI 사용량과 실시간 게이지 바 모니터링을 제공합니다.

---

## 🏗️ 시스템 아키텍처

```
[ 교사 / 방문자 ]
       │
       ▼
[ Cloudflare Pages ] ─── /chatbot/ (React + Vite + Tailwind SPA)
       │
       ▼
[ Cloudflare Workers API ] ─── /api/chatbot/*
       ├── Auth: Cloudflare Access JWT 검증 (/admin/*)
       ├── Rate Limiter: IP당 분당 요청 제한
       ├── Search Engine: Cloudflare D1 (한국어 키워드/바이그램 검색)
       ├── Storage: Cloudflare R2 (PDF 원본 저장소)
       └── AI Engine: Cloudflare Workers AI (무료 한도 보호 및 자동 폴백)
```

---

## 📁 프로젝트 구조

```
future-chatbot/
├── apps/
│   ├── web/                     # React + Vite + TypeScript 프런트엔드
│   │   ├── src/
│   │   │   ├── components/      # UI 컴포넌트 (헤더, 채팅, 추천질문, PDF뷰어 등)
│   │   │   ├── pages/           # ChatPage, AdminPage
│   │   │   └── api.ts           # 프런트엔드 API 클라이언트
│   │   └── vite.config.ts       # base: '/chatbot/' 설정
│   └── api/                     # Cloudflare Workers 백엔드
│       ├── src/
│       │   ├── routes/          # 공개 및 관리자 API 핸들러
│       │   ├── auth.ts          # Cloudflare Access JWT 검증
│       │   ├── ai.ts            # Workers AI 연동 및 프롬프트 가드레일
│       │   ├── db.ts            # D1 쿼리 및 검색 엔진
│       │   └── security.ts      # Rate limit, PDF 시그니처 검증
│       └── wrangler.toml        # Workers 바인딩 설정
├── packages/
│   └── shared/                  # 공통 타입, CREATE 모형 정의, 한국어 검색 유틸
├── migrations/                  # D1 SQLite 마이그레이션 SQL
│   ├── 0001_initial.sql         # 테이블 및 인덱스 스키마
│   └── 0002_seed_data.sql       # [테스트용 샘플] CREATE 모형 초기 데이터
├── docs/                        # 상세 연동 및 배포 설명서
│   ├── FUTURE_ROUTER_INTEGRATION.md  # 통합 도메인 라우터 패치 가이드
│   ├── CLOUDFLARE_SETUP.md      # D1, R2, Access 구축 가이드
│   └── COST_AND_QUOTA_GUIDE.md  # 비용 및 무료 쿼터 정책
└── .github/workflows/
    └── deploy.yml               # GitHub Actions 자동 배포 워크플로
```

---

## 💻 로컬 개발 및 실행 방법

### 1. 패키지 설치
```bash
npm install
```

### 2. 단위 테스트 실행
```bash
npm test
```

### 3. 로컬 개발 서버 실행
```bash
# 프런트엔드 개발 서버 실행 (http://localhost:3000/chatbot/)
npm run dev

# (별도 터미널) 백엔드 Worker 개발 서버 실행 (http://localhost:8787)
npm run dev:api
```

---

## 🚀 배포 가이드 요약

1. **GitHub 저장소 푸시**: `main` 브랜치에 푸시하면 `.github/workflows/deploy.yml`이 자동으로 테스트 및 빌드 후 Cloudflare Pages와 Workers에 배포합니다.
2. **Future School 라우터 연동**: [docs/FUTURE_ROUTER_INTEGRATION.md](file:///c:/Users/user/Documents/create_chatbot/docs/FUTURE_ROUTER_INTEGRATION.md)의 패치 코드를 적용하여 `https://futureschool.allforedu.kr/chatbot/` 경로로 라우팅합니다.
3. **상세 인프라 설정**: [docs/CLOUDFLARE_SETUP.md](file:///c:/Users/user/Documents/create_chatbot/docs/CLOUDFLARE_SETUP.md)를 참고하세요.
