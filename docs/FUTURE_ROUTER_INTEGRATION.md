# Future School 통합 라우터(`future-router`) 연동 가이드 및 패치

본 문서는 `futureschool.allforedu.kr` 도메인 아래에 `CREATE AI 수업 도우미`를 안전하게 통합하기 위한 라우터 연동 패치 설명서입니다.

> **[중요 원칙]**  
> 기존 운영 중인 `/create`, `/curriculum` 등 다른 메뉴와 서비스를 일절 변경하거나 덮어쓰지 않고, 독립적인 경로만 안전하게 분기하도록 구성합니다.

---

## 1. 라우팅 구조 정의

| 경로 패턴 | 대상 서비스 | 비고 |
| :--- | :--- | :--- |
| `https://futureschool.allforedu.kr/api/chatbot/*` | Cloudflare Worker (`future-chatbot-api`) | 백엔드 API (D1, R2, Workers AI, Access 검증) |
| `https://futureschool.allforedu.kr/chatbot/*` | Cloudflare Pages (`future-chatbot.pages.dev`) | React + Vite SPA 프런트엔드 (새로고침 및 SPA 라우팅 지원) |
| 기타 기존 경로 (`/`, `/create/*`, `/curriculum/*` 등) | 기존 서비스 유지 | 기존 라우터 로직 그대로 통과 |

---

## 2. `future-router` Worker 패치 코드

기존 `future-router` Worker 프로젝트의 라우팅 처리 함수에 아래 블록을 추가합니다.

### 2.1 패치 코드 (TypeScript / JavaScript)

```typescript
// ============================================================================
// [추가 패치] CREATE AI 수업 도우미 (future-chatbot) 라우팅 블록
// ============================================================================

// 1. 백엔드 API 라우팅 (/api/chatbot/*)
if (url.pathname.startsWith('/api/chatbot')) {
  // Option A: Service Binding을 사용하는 경우 (권장)
  // env.CHATBOT_API는 wrangler.toml에 등록된 Worker 서비스 바인딩
  if (env.CHATBOT_API) {
    return await env.CHATBOT_API.fetch(request);
  }

  // Option B: Worker 도메인으로 프록시하는 경우
  const apiUrl = new URL(request.url);
  apiUrl.hostname = 'future-chatbot-api.allforedu.workers.dev'; // 또는 할당된 Worker 호스트
  
  const modifiedRequest = new Request(apiUrl.toString(), request);
  return await fetch(modifiedRequest);
}

// 2. 프런트엔드 SPA 라우팅 (/chatbot 및 /chatbot/*)
if (url.pathname === '/chatbot' || url.pathname.startsWith('/chatbot/')) {
  // Cloudflare Pages 원본 주소
  const pagesUrl = new URL(request.url);
  pagesUrl.hostname = 'future-chatbot.pages.dev';

  const pagesResponse = await fetch(new Request(pagesUrl.toString(), request));

  // SPA 직접 새로고침 지원 (404 발생 시 index.html로 폴백 반환)
  if (pagesResponse.status === 404 && !url.pathname.includes('.')) {
    const fallbackUrl = new URL('/chatbot/index.html', pagesUrl);
    return await fetch(new Request(fallbackUrl.toString(), request));
  }

  return pagesResponse;
}
// ============================================================================
```

---

## 3. `future-router`의 `wrangler.toml` 바인딩 설정

Service Binding(권장)을 적용할 경우 `future-router`의 `wrangler.toml`에 아래 설정을 추가합니다:

```toml
# future-chatbot API Worker 서비스 바인딩 추가
[[services]]
binding = "CHATBOT_API"
service = "future-chatbot-api"
```

---

## 4. 검증 체크리스트

1. **메인 페이지 접속**: `https://futureschool.allforedu.kr/chatbot/` 브라우저 접근 시 React UI 정상 출력 확인
2. **새로고침 지원**: `https://futureschool.allforedu.kr/chatbot/admin` 접근 및 F5 새로고침 시 404 오류 없이 정상 렌더링 확인
3. **API 핑 테스트**: `https://futureschool.allforedu.kr/api/chatbot/health` 호출 시 `{"status":"healthy"}` 응답 확인
4. **기존 경로 영향 없음**: `https://futureschool.allforedu.kr/create` 및 기타 페이지 정상 유지 확인
