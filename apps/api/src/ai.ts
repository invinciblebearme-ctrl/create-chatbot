import {
  SearchResult,
  DEFAULT_AI_MODEL,
  FALLBACK_AI_MODEL,
  AI_QUOTA_POLICY,
  CREATE_STAGES,
  JEONBUK_AI_DEFAULTS
} from '@create-chatbot/shared';
import { sanitizePromptContext } from './security';
import { Env } from './env';
import { StoredJeonbukAiSettings } from './db';

// 동일 질문 응답 인메모리 캐시 (비용 절감)
interface CacheItem {
  answer: string;
  timestamp: number;
}
const aiResponseCache = new Map<string, CacheItem>();

const CREATE_SYSTEM_PROMPT = `당신은 2026 연구학교(군산초등학교)의 'CREATE 교수·학습 모형' 전용 AI 수업 도우미입니다.
초등학교 선생님들의 수업 설계와 학생 맞춤형 배움을 지원하기 위해, 아래 제공된 [공식 연구학교 CREATE 모형 원리 및 참고자료]를 핵심 토대(Framework)로 삼고, 당신(AI)이 학습한 전문적인 교육학 지식, 교과 지도 역량, 디지털·AI 도구 활용 노하우를 적극 융합하여 풍부하고 친절하며 실천적인 답변을 제공하세요.

[연구학교 공식 CREATE 모형 6단계 구조 및 정의]
본 연구학교의 CREATE 모형 6단계와 핵심 활동은 다음과 같으며, 공식 표에 명시된 정의와 활동을 충실히 반영하세요:
1. C (진단 / Check & Context):
   - 한 줄 정의: AI·디지털 도구로 학생의 개별 특성(흥미, 강점, 취약점)을 파악해 맞춤형 학습 출발점을 정한다.
   - 핵심 활동: 진단 도구 선정, 학습자 실태 분석
2. R (탐색 / Research & Resource):
   - 한 줄 정의: 진단 결과를 바탕으로 자료와 교육과정을 준비하고 탐구의 방향을 정한다.
   - 핵심 활동: 교육자료 선정, 교육과정 수정 여부 결정, 일반화 문장 및 탐구 질문 준비
3. E (실행 / Execution & Engage):
   - 한 줄 정의: 온·오프라인을 연계해 학생 맞춤형 탐구를 실행하고 협력·공유·피드백한다.
   - 핵심 활동: 맞춤형 탐구 실행, 디지털 플랫폼 협력·공유, 데이터 기반 실시간 모니터링·피드백
4. A (분석 / Analysis & Action):
   - 한 줄 정의: 학생의 이해도를 분석·평가하고 다음 단계로 나아갈지, 되돌아갈지 판단한다.
   - 핵심 활동: 실행 분석 및 평가, 환류 및 복귀 여부 판단
5. T (전이 / Transfer & Think):
   - 한 줄 정의: 배운 개념을 타 교과와 실생활 상황에 연결·적용한다.
   - 핵심 활동: 타 교과 및 실생활과 연결
6. E (성장 / Evolve & Evaluate):
   - 한 줄 정의: 단원 학습을 정리하고 스스로 학습을 성찰한다.
   - 핵심 활동: 단원(주제) 학습 정리하기, 자기성찰 질문 및 활동 제공

[단계의 흐름: 순차 + 환류 (A 단계의 환류 메커니즘)]
- 모형의 전체 흐름: C(진단: 출발점 파악) ➔ R(탐색: 자료·질문 준비) ➔ E(실행: 맞춤형 탐구) ➔ A(분석: 목표 도달 판단) ➔ T(전이: 삶에 적용) ➔ E(성장: 정리·성찰)
- 환류(반복): 분석(A) 결과에 따라 목표 도달 시 전이(T)로 나아가며, 학생의 이해도가 낮으면 E(실행)로 복귀하여 다시 실행하거나, 필요하면 R(탐색)로 복귀하여 재설계 후 다시 실행과 분석을 반복합니다.

[핵심 답변 원칙]
1. 모형 충실성: 영문 약자는 반드시 C(Check & Context), R(Research & Resource), E(Execution & Engage), A(Analysis & Action), T(Transfer & Think), E(Evolve & Evaluate)만을 사용하세요. (과거의 Connect, Explore, Apply, Transform 등 잘못된 임의 영단어 절대 사용 금지)
2. 지식 융합 및 적극적 답변: 제공된 [참고자료]의 실제 단원설계안/길잡이 내용을 적극 활용하면서, 동시에 AI가 학습한 교육과정 전문 지식, 구체적인 수업 아이디어, 학생 맞춤형 피드백 전략, 에듀테크/디지털 도구(예: 뤼튼, 캔바, 패들렛, 구글 클래스룸, 잼보드 등) 활용 방안을 유기적으로 융합하여 교사에게 실질적인 도움이 되는 완성도 높은 답변을 작성하세요.
3. 거부 금지: "관련 내용을 확인할 수 없습니다"와 같이 단순 거부하거나 답변을 회피하지 마세요. 질문이 특정 학년/교과나 새로운 주제에 관한 것이라면, 공식 CREATE 모형 6단계와 A단계 환류 구조에 맞추어 실제 수업에서 어떻게 구현할 수 있는지 AI의 교육 역량을 발휘하여 맞춤형 수업 계획과 아이디어를 제안하세요.
4. 어조: 초등학교 교사에게 따뜻하고 격려하는 어조로 친절하고 명확하게 설명하세요.
5. 출처 표시: 제공된 [참고자료]에서 특정 단원설계안이나 길잡이 문헌을 인용한 경우, 답변 말미에 참고한 자료 제목과 쪽수를 출처로 명시하세요.`;

/**
 * 캐시 키 생성
 */
function getCacheKey(query: string, resultIds: string[]): string {
  return `${query.trim().toLowerCase()}::${resultIds.sort().join(',')}`;
}

/**
 * Workers AI 기반 답변 생성 (참고자료 토대 + AI 교육 전문성 융합)
 */
export async function generateAiAnswer(
  env: Env,
  userQuery: string,
  searchResults: SearchResult[]
): Promise<{ answer: string; isFallback: boolean; modelUsed: string }> {
  const model = env.AI_MODEL_NAME || DEFAULT_AI_MODEL;

  // 1. 동일 검색결과 캐시 확인
  const cacheKey = getCacheKey(userQuery, searchResults.map(r => r.id));
  const cached = aiResponseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < AI_QUOTA_POLICY.CACHE_TTL_MS) {
    return {
      answer: cached.answer,
      isFallback: false,
      modelUsed: `${model} (cache)`
    };
  }

  // 2. 컨텍스트 구성 (참고자료 안전 소독 후 조립)
  const contextSnippet =
    searchResults.length > 0
      ? searchResults
          .slice(0, AI_QUOTA_POLICY.MAX_CONTEXT_CHUNKS)
          .map((r, idx) => {
            const sanitized = sanitizePromptContext(r.content);
            return `[참고자료 ${idx + 1}] 출처: <${r.document_title}> (${r.page_number}쪽)\n내용: ${sanitized}`;
          })
          .join('\n\n')
      : '[참고자료] 공식 CREATE 수업설계 모형 길잡이 및 단원설계 원칙에 기반합니다.';

  const systemPrompt = CREATE_SYSTEM_PROMPT;

  const userPrompt = `[공식 연구학교 참고자료]
${contextSnippet}

[교사 질문]
${sanitizePromptContext(userQuery)}

위 참고자료의 CREATE 모형 원리와 내용을 기본 바탕으로 하고, AI가 학습한 교육학적 전문 지식과 실천적인 수업 아이디어를 더하여 교사의 질문에 풍부하고 친절하게 답변해 주세요.`;

  // 3. Workers AI 호출 시도 (최신 지원 모델 순차 시도)
  const candidateModels = [
    env.AI_MODEL_NAME,
    DEFAULT_AI_MODEL,
    '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
    '@cf/meta/llama-3.2-3b-instruct',
    '@cf/meta/llama-3-8b-instruct',
    '@cf/qwen/qwen2.5-7b-instruct'
  ].filter(Boolean) as string[];

  if (env.AI && typeof env.AI.run === 'function') {
    for (const targetModel of candidateModels) {
      try {
        console.log(`[Workers AI] Invoking model: ${targetModel}`);
        const aiResponse: any = await env.AI.run(targetModel, {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: AI_QUOTA_POLICY.MAX_OUTPUT_TOKENS,
          temperature: 0.3
        });

        let responseText = '';
        if (typeof aiResponse === 'string') {
          responseText = aiResponse;
        } else if (aiResponse?.response) {
          responseText = aiResponse.response;
        } else if (aiResponse?.choices?.[0]?.message?.content) {
          responseText = aiResponse.choices[0].message.content;
        }

        if (responseText && responseText.trim()) {
          const cleanAnswer = responseText.trim();
          // 캐시 저장
          aiResponseCache.set(cacheKey, { answer: cleanAnswer, timestamp: Date.now() });
          return {
            answer: cleanAnswer,
            isFallback: false,
            modelUsed: targetModel
          };
        }
      } catch (aiError: any) {
        console.warn(`[Workers AI] Model ${targetModel} invocation failed:`, aiError?.message || aiError);
      }
    }
  }

  // 4. Workers AI 미연동 또는 일시 장애 시 검색 및 공식 지식 기반 고품질 폴백 생성
  const fallbackAnswer = generateSearchFallbackAnswer(searchResults, userQuery);
  return {
    answer: fallbackAnswer,
    isFallback: true,
    modelUsed: 'fallback-search'
  };
}

/**
 * 전북AI API Gateway 기반 답변 생성
 * - 스튜디오 챗봇 엔드포인트: POST /v1/gateway/chatbots/{chatbot_id}/chat/completions/
 * - 일반 채팅 엔드포인트 (chatbot_id 미지정 시): POST /v1/gateway/chat/completions/
 */
export async function generateJeonbukAiAnswer(
  env: Env,
  userQuery: string,
  searchResults: SearchResult[],
  settings: StoredJeonbukAiSettings,
  history?: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<{ answer: string; isFallback: boolean; modelUsed: string }> {
  let apiKey = (settings.apiKey || env.JEONBUK_AI_API_KEY || '').trim();
  let chatbotId = (settings.chatbotId || env.JEONBUK_AI_CHATBOT_ID || '').trim();
  if (apiKey === 'YOUR_API_KEY') apiKey = '';
  // 실수로 chatbotId 칸에 baze_ API 키를 넣은 경우 자동 보정
  if (chatbotId.startsWith('baze_')) {
    if (!apiKey) apiKey = chatbotId;
    chatbotId = '';
  }
  const model = (settings.model || env.JEONBUK_AI_MODEL || JEONBUK_AI_DEFAULTS.DEFAULT_MODEL).trim();
  const baseUrl = (settings.baseUrl || env.JEONBUK_AI_BASE_URL || JEONBUK_AI_DEFAULTS.BASE_URL)
    .trim()
    .replace(/\/+$/, '');

  // API 키 미설정 시 친절한 설정 안내 + 검색 폴백 반환
  if (!apiKey) {
    const guideHeader =
      '> ⚙️ **[전북AI 연동 설정 안내]** 아직 전북AI API 키가 등록되지 않았습니다.\n' +
      '> 우측 상단 **관리자(비밀번호: 7703) → 전북AI 챗봇 연결 설정** 탭(또는 환경변수 `JEONBUK_AI_API_KEY`)에 발급받은 전북AI API 키만 입력하시면 바로 작동합니다.\n\n';
    return {
      answer: guideHeader + generateSearchFallbackAnswer(searchResults, userQuery),
      isFallback: true,
      modelUsed: 'jeonbuk-unconfigured'
    };
  }

  // 캐시 확인 (전북AI 전용 캐시 키)
  const jeonbukCacheKey = `jeonbuk::${chatbotId || model}::${getCacheKey(
    userQuery,
    searchResults.map(r => r.id)
  )}`;
  const cached = aiResponseCache.get(jeonbukCacheKey);
  if (cached && Date.now() - cached.timestamp < AI_QUOTA_POLICY.CACHE_TTL_MS) {
    return {
      answer: cached.answer,
      isFallback: false,
      modelUsed: chatbotId ? `jeonbuk-chatbot:${chatbotId} (cache)` : `jeonbuk:${model} (cache)`
    };
  }

  // 엔드포인트 결정:
  // 1) chatbotId가 전체 URL인 경우 그대로 사용
  // 2) chatbotId가 지정된 경우: POST https://api.baze.co/v1/gateway/chatbots/{chatbot_id}/chat/completions/
  // 3) chatbotId가 비어있는 경우: POST https://api.baze.co/v1/gateway/chat/completions/
  let endpointUrl = '';
  if (chatbotId.startsWith('http://') || chatbotId.startsWith('https://')) {
    endpointUrl = chatbotId;
  } else if (chatbotId) {
    const cleanId = chatbotId
      .replace(/^\/?v1\/gateway\/chatbots\//, '')
      .replace(/\/chat\/completions\/?$/, '')
      .replace(/^\/+|\/+$/g, '');
    endpointUrl = `${baseUrl}/chatbots/${encodeURIComponent(cleanId)}/chat/completions/`;
  } else {
    endpointUrl = `${baseUrl}/chat/completions/`;
  }

  // 참고자료 컨텍스트 조립 (useRagContext 활성 시)
  const contextSnippet =
    settings.useRagContext && searchResults.length > 0
      ? searchResults
          .slice(0, AI_QUOTA_POLICY.MAX_CONTEXT_CHUNKS)
          .map((r, idx) => {
            const sanitized = sanitizePromptContext(r.content);
            return `[참고자료 ${idx + 1}] 출처: <${r.document_title}> (${r.page_number}쪽)\n내용: ${sanitized}`;
          })
          .join('\n\n')
      : '';

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

  if (!chatbotId) {
    // 일반 게이트웨이 모델 호출 시 연구학교 CREATE 모형 6단계 공식 시스템 프롬프트 주입
    messages.push({
      role: 'system',
      content: CREATE_SYSTEM_PROMPT
    });
  }

  // 이전 대화 이력(최근 4개 메시지) 포함
  if (Array.isArray(history) && history.length > 0) {
    for (const h of history.slice(-4)) {
      if ((h.role === 'user' || h.role === 'assistant') && h.content) {
        messages.push({
          role: h.role,
          content: sanitizePromptContext(h.content)
        });
      }
    }
  }

  const sanitizedQuery = sanitizePromptContext(userQuery);
  const finalUserContent = contextSnippet
    ? `[공식 연구학교 참고자료]\n${contextSnippet}\n\n[교사 질문]\n${sanitizedQuery}\n\n위 참고자료의 CREATE 모형 원리와 내용을 기본 바탕으로 하고, AI가 학습한 교육학적 전문 지식과 실천적인 수업 아이디어를 더하여 교사의 질문에 풍부하고 친절하게 답변해 주세요.`
    : `[참고자료] 공식 CREATE 수업설계 모형 길잡이 및 단원설계 원칙에 기반합니다.\n\n[교사 질문]\n${sanitizedQuery}\n\nCREATE 6단계(C 진단 - R 탐색 - E 실행 - A 분석·환류 - T 전이 - E 성장) 구조에 맞추어 풍부하고 친절하게 답변해 주세요.`;

  messages.push({
    role: 'user',
    content: finalUserContent
  });

  const requestBody: Record<string, any> = {
    messages
  };

  // 일반 Chat Completions 호출이거나 모델명이 지정된 경우 model 필드 포함
  if (!chatbotId || model) {
    requestBody.model = model || JEONBUK_AI_DEFAULTS.DEFAULT_MODEL;
  }

  try {
    console.log(`[Jeonbuk AI] Calling endpoint: ${endpointUrl}`);
    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'x-api-key': apiKey
      },
      body: JSON.stringify(requestBody)
    });

    if (response.status === 429) {
      return {
        answer:
          '> ⚠️ **[전북AI 호출 제한 안내]** 분당 요청 한도(챗봇 라우트 분당 30건 / 게이트웨이 분당 120건)에 도달했습니다. 잠시 후 다시 시도해 주세요.\n\n' +
          generateSearchFallbackAnswer(searchResults, userQuery),
        isFallback: true,
        modelUsed: 'jeonbuk-rate-limited'
      };
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.warn(`[Jeonbuk AI] HTTP ${response.status}:`, errText);
      return {
        answer:
          `> ⚠️ **[전북AI 응답 오류 (${response.status})]** 전북AI 게이트웨이 호출 중 오류가 발생하여 공식 자료 검색 모드로 안내해 드립니다.\n` +
          (errText ? `> 상세: \`${errText.slice(0, 180)}\`\n\n` : '\n') +
          generateSearchFallbackAnswer(searchResults, userQuery),
        isFallback: true,
        modelUsed: 'jeonbuk-error-fallback'
      };
    }

    const data: any = await response.json();
    const answerText =
      data?.choices?.[0]?.message?.content ||
      data?.choices?.[0]?.text ||
      data?.answer ||
      data?.response ||
      data?.output_text ||
      (typeof data?.content === 'string' ? data.content : '');

    if (answerText && String(answerText).trim()) {
      const cleanAnswer = String(answerText).trim();
      aiResponseCache.set(jeonbukCacheKey, { answer: cleanAnswer, timestamp: Date.now() });
      return {
        answer: cleanAnswer,
        isFallback: false,
        modelUsed: chatbotId ? `jeonbuk-chatbot:${chatbotId}` : `jeonbuk:${model}`
      };
    }
  } catch (err: any) {
    console.error('[Jeonbuk AI] Fetch exception:', err?.message || err);
  }

  return {
    answer:
      '> ⚠️ **[전북AI 연결 실패]** 전북AI 게이트웨이와 통신하지 못하여 공식 자료 검색 결과를 대신 표시합니다.\n\n' +
      generateSearchFallbackAnswer(searchResults, userQuery),
    isFallback: true,
    modelUsed: 'jeonbuk-network-fallback'
  };
}

/**
 * 검색 자료 및 CREATE 공식 모형 기반 구조화된 안내 생성
 */
export function generateSearchFallbackAnswer(searchResults: SearchResult[], userQuery?: string): string {
  let text = '💡 **[CREATE 모형 공식 안내 및 추천 수업 가이드]**\n\n';

  // 검색 결과가 있는 경우 실제 참고자료 인용
  if (searchResults.length > 0) {
    text += '연구학교 공식 문서에서 관련 교육자료를 찾았습니다:\n\n';
    searchResults.slice(0, 3).forEach((res, i) => {
      text += `### ${i + 1}. 📄 ${res.document_title} (p.${res.page_number})\n`;
      text += `> ${res.content.replace(/\n+/g, ' ').slice(0, 200)}...\n\n`;
    });
    text += '---\n\n';
  }

  text += '### 🎯 CREATE 6단계 교수·학습 모형 요약\n';
  text += '- **C (진단 / Check & Context)**: AI·디지털 도구로 학생 개별 특성을 파악해 맞춤형 학습 출발점 설정 (학습자 실태 분석)\n';
  text += '- **R (탐색 / Research & Resource)**: 진단 결과 바탕 자료·교육과정 준비 및 탐구 질문 준비\n';
  text += '- **E (실행 / Execution & Engage)**: 온·오프라인 연계 학생 맞춤형 탐구 실행, 협력·공유·피드백\n';
  text += '- **A (분석 / Analysis & Action)**: 학생 이해도 분석·평가 및 환류 여부 판단 (목표 도달 시 전이로, 미도달 시 실행 또는 탐색으로 복귀)\n';
  text += '- **T (전이 / Transfer & Think)**: 배운 개념을 타 교과 및 실생활 상황에 연결·적용\n';
  text += '- **E (성장 / Evolve & Evaluate)**: 단원 학습 정리 및 스스로 자기성찰 질문과 활동 수행\n\n';

  text += '🔄 **단계의 흐름 및 환류 규칙**:\n';
  text += '순차 흐름(C ➔ R ➔ E ➔ A ➔ T ➔ E)을 기본으로 하되, **A(분석)** 결과 이해도가 낮으면 **E(실행)**로 복귀하여 다시 실행하고, 필요하면 **R(탐색)**로 복귀하여 재설계 후 실행을 반복합니다.';

  return text;
}
