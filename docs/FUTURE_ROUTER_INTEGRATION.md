# create.allforedu.kr 도메인 라우터 연동 가이드

본 문서는 `create.allforedu.kr` 도메인 아래에 `CREATE AI 수업 도우미`를 `https://create.allforedu.kr/chatbot/` 주소로 안전하게 통합하기 위한 라우팅 설정 안내서입니다.

> **[핵심 원칙]**  
> `create.allforedu.kr`의 기존 메인 페이지와 다른 메뉴 및 서비스를 일절 변경하거나 덮어쓰지 않고, `/chatbot/*` 및 `/api/chatbot/*` 경로만 프록시 분기하도록 구성합니다.

---

## 1. 라우팅 구조 정의

| 경로 패턴 | 대상 서비스 | 설명 |
| :--- | :--- | :--- |
| `https://create.allforedu.kr/api/chatbot/*` | Cloudflare Worker (`future-chatbot-api`) | 백엔드 API (D1 검색, Llama 3.3 70B AI, 쿼터 검증) |
| `https://create.allforedu.kr/chatbot/*` | Cloudflare Pages (`create-chatbot.pages.dev`) | React + Vite SPA 프런트엔드 (Canvas PDF 뷰어, 새로고침 지원) |
| 기타 기존 경로 (`/`, `/curriculum/*` 등) | 기존 `create.allforedu.kr` 서비스 유지 | 기존 웹서비스 그대로 통과 |

---

## 2. Cloudflare 라우터 Worker 패치 코드

`create.allforedu.kr` 도메인을 제어하는 Cloudflare Worker의 `fetch` 핸들러에 아래 코드를 추가합니다:

```typescript
// ============================================================================
// [추가] CREATE AI 수업 도우미 (/chatbot/* 및 /api/chatbot/*) 라우팅 블록
// ============================================================================

// 1. 백엔드 API 라우팅 (/api/chatbot/*)
if (url.pathname.startsWith('/api/chatbot')) {
  // Option A: Service Binding을 사용하는 경우 (권장)
  if (env.CHATBOT_API) {
    return await env.CHATBOT_API.fetch(request);
  }

  // Option B: Worker 도메인으로 프록시하는 경우
  const apiUrl = new URL(request.url);
  apiUrl.hostname = 'future-chatbot-api.<본인계정서브도메인>.workers.dev';
  
  const modifiedRequest = new Request(apiUrl.toString(), request);
  return await fetch(modifiedRequest);
}

// 2. 프런트엔드 SPA 라우팅 (/chatbot 및 /chatbot/*)
if (url.pathname === '/chatbot' || url.pathname.startsWith('/chatbot/')) {
  // Cloudflare Pages 원본 주소 (create-chatbot.pages.dev)
  const pagesUrl = new URL(request.url);
  pagesUrl.hostname = 'create-chatbot.pages.dev';

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

## 3. 검증 체크리스트

1. **메인 페이지 접속**: `https://create.allforedu.kr/chatbot/` 브라우저 접근 시 React UI 정상 출력 확인
2. **관리자 페이지 접속**: `https://create.allforedu.kr/chatbot/admin` 접근 시 PIN(`7703`) 입력 화면 확인
3. **새로고침(F5) 지원**: `https://create.allforedu.kr/chatbot/admin`에서 F5 새로고침 시 404 오류 없이 정상 렌더링 확인
4. **기존 사이트 영향 없음**: `https://create.allforedu.kr/` 기존 메인 및 하위 페이지 정상 유지 확인

