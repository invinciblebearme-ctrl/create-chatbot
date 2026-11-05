import React, { useState } from 'react';
import {
  ChatMessage,
  Citation
} from '@create-chatbot/shared';
import {
  Copy,
  Check,
  RotateCcw,
  FileText,
  ExternalLink,
  Sparkles,
  Search,
  AlertTriangle,
  User,
  Bot
} from 'lucide-react';

interface ChatMessageItemProps {
  message: ChatMessage;
  onRetry?: (query: string) => void;
  onRetrySummary?: (query: string) => void;
  onOpenPdf: (docId: string, pageNumber: number, title: string) => void;
  previousUserMessage?: string;
}

/**
 * [테스트용 샘플] 및 관련 문구 완벽 제거 헬퍼
 */
export function cleanSampleText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\[\s*테스트용\s*샘플(?:\s*데이터)?\s*\]\s*/gi, '')
    .replace(/테스트용\s*샘플(?:\s*데이터)?/gi, '')
    .trim();
}

/**
 * XSS 방지 및 기본 마크다운 파서
 */
function renderMarkdown(content: string) {
  // [테스트용 샘플] 제거 및 HTML 태그 이스케이프
  const escaped = cleanSampleText(content)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const lines = escaped.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let inList = false;
  let listItems: string[] = [];

  const flushList = (keyPrefix: string) => {
    if (inList && listItems.length > 0) {
      elements.push(
        <ul key={`${keyPrefix}-list`} className="list-disc pl-5 my-2 space-y-1 text-slate-700">
          {listItems.map((item, idx) => (
            <li key={idx} dangerouslySetInnerHTML={{ __html: parseInline(item) }} />
          ))}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  const parseInline = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-slate-100 px-1 py-0.5 rounded text-brand-700 text-xs font-mono">$1</code>');
  };

  lines.forEach((line, index) => {
    // 코드 블록 토글
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre
            key={`code-${index}`}
            className="bg-slate-900 text-slate-100 p-3 rounded-lg overflow-x-auto text-xs my-2 font-mono"
          >
            <code>{codeBlockContent.join('\n')}</code>
          </pre>
        );
        codeBlockContent = [];
        inCodeBlock = false;
      } else {
        flushList(`before-code-${index}`);
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      return;
    }

    // 인용구
    if (line.startsWith('&gt; ') || line.startsWith('> ')) {
      flushList(`before-quote-${index}`);
      const quoteText = line.replace(/^(&gt;|>)\s?/, '');
      elements.push(
        <blockquote
          key={`quote-${index}`}
          className="border-l-4 border-brand-500 bg-brand-50/60 text-slate-700 px-3 py-1.5 rounded-r my-2 text-sm"
          dangerouslySetInnerHTML={{ __html: parseInline(quoteText) }}
        />
      );
      return;
    }

    // 제목
    if (line.startsWith('### ')) {
      flushList(`before-h3-${index}`);
      elements.push(
        <h4 key={`h3-${index}`} className="font-bold text-base text-slate-900 mt-3 mb-1">
          {line.replace('### ', '')}
        </h4>
      );
      return;
    }
    if (line.startsWith('## ')) {
      flushList(`before-h2-${index}`);
      elements.push(
        <h3 key={`h2-${index}`} className="font-bold text-lg text-slate-900 mt-4 mb-2">
          {line.replace('## ', '')}
        </h3>
      );
      return;
    }

    // 리스트 아이템
    if (line.match(/^[\-\*]\s+/)) {
      inList = true;
      listItems.push(line.replace(/^[\-\*]\s+/, ''));
      return;
    }
    if (line.match(/^\d+\.\s+/)) {
      inList = true;
      listItems.push(line.replace(/^\d+\.\s+/, ''));
      return;
    }

    // 구분선
    if (line.trim() === '---') {
      flushList(`before-hr-${index}`);
      elements.push(<hr key={`hr-${index}`} className="my-3 border-slate-200" />);
      return;
    }

    // 일반 문단
    flushList(`before-p-${index}`);
    if (line.trim()) {
      elements.push(
        <p
          key={`p-${index}`}
          className="my-1.5 leading-relaxed text-sm text-slate-800"
          dangerouslySetInnerHTML={{ __html: parseInline(line) }}
        />
      );
    }
  });

  flushList('end');
  return elements;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  onRetry,
  onRetrySummary,
  onOpenPdf,
  previousUserMessage
}) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isUser) {
    return (
      <div className="flex justify-end mb-4 animate-fadeIn">
        <div className="max-w-[85%] sm:max-w-[75%] flex items-start gap-2.5 flex-row-reverse">
          <div className="w-8 h-8 rounded-[12px] bg-[#374f7e] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <User className="w-4 h-4" />
          </div>
          <div className="bg-[#687fe0] text-white rounded-[20px] rounded-tr-sm px-4 py-3 shadow-btn text-sm leading-relaxed">
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-6 animate-fadeIn">
      <div className="max-w-[94%] sm:max-w-[88%] flex items-start gap-3">
        {/* 어시스턴트 아바타 (create.allforedu.kr 심볼 ✳) */}
        <div className="w-9 h-9 rounded-[13px] bg-[#e2eaff] text-[#6b7fe0] flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5 text-base font-black">
          ✳
        </div>

        <div className="flex-1 bg-white border border-[#e8edf6] rounded-[22px] rounded-tl-sm p-4 sm:p-5 shadow-card">
          {/* 상단 뱃지: 모드 및 폴백 상태 */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-[#edf0f6] text-xs">
            <div className="flex items-center gap-1.5 font-extrabold">
              {message.mode === 'ai' && !message.is_fallback ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#f1ecff] text-[#7a59d9]">
                  <Sparkles className="w-3 h-3" />
                  Workers AI 요약
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#eaf2ff] text-[#586fca]">
                  <Search className="w-3 h-3 text-[#687fe0]" />
                  공식 자료 발췌 검색
                </span>
              )}

              {message.is_fallback && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#fff0e3] text-[#cf7a38]">
                  <AlertTriangle className="w-3 h-3 text-[#cf7a38]" />
                  무료한도 검색모드 전환
                </span>
              )}
            </div>

            {/* 유틸 버튼: AI 요약 다시 질문 / 복사 / 일반 다시 질문 */}
            <div className="flex items-center gap-1.5 text-[#8b9ab7]">
              {onRetrySummary && previousUserMessage && (
                <button
                  type="button"
                  onClick={() => onRetrySummary(previousUserMessage)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[10px] bg-gradient-to-r from-[#f0ebff] to-[#f4f0ff] hover:from-[#e7deff] hover:to-[#eee6ff] text-[#6f4bd8] border border-[#e2d5ff] font-extrabold text-[11px] shadow-2xs transition-all hover:scale-[1.02] active:scale-[0.98]"
                  title="이 질문을 Workers AI 요약 모드로 다시 질문하기"
                >
                  <Sparkles className="w-3 h-3 text-[#7f5de0]" />
                  <span>AI 요약으로 다시 질문</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleCopy}
                className="p-1 rounded-lg hover:bg-[#f0f4fc] hover:text-[#34476a] transition-colors"
                title="답변 내용 복사"
              >
                {copied ? (
                  <span className="flex items-center gap-1 text-[#4aab82] font-extrabold text-[11px]">
                    <Check className="w-3.5 h-3.5" /> 복사됨
                  </span>
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>

              {onRetry && previousUserMessage && (
                <button
                  type="button"
                  onClick={() => onRetry(previousUserMessage)}
                  className="p-1 rounded-lg hover:bg-[#f0f4fc] hover:text-[#34476a] transition-colors"
                  title="이 질문 다시 하기"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* 본문 렌더링 */}
          <div className="prose-chat text-[#30415e] text-sm leading-relaxed">{renderMarkdown(message.content)}</div>

          {/* 출처 목록 (Citations) */}
          {message.citations && message.citations.length > 0 && (
            <div className="mt-4 pt-3.5 border-t border-[#edf0f6]">
              <span className="text-[11px] font-black text-[#8b9ab7] uppercase tracking-wider block mb-2">
                📌 참고 공식 교육자료 ({message.citations.length}건)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {message.citations.map((cite, idx) => (
                  <button
                    key={`${cite.document_id}-${cite.page_number}-${idx}`}
                    type="button"
                    onClick={() =>
                      onOpenPdf(cite.document_id, cite.page_number, cleanSampleText(cite.document_title))
                    }
                    className="flex items-center justify-between text-left p-2.5 rounded-[13px] bg-[#f8faff] border border-[#e8edf6] hover:bg-[#eef4ff] hover:border-[#8ba0ed] transition-all group"
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <FileText className="w-4 h-4 text-[#687fe0] flex-shrink-0" />
                      <div className="truncate">
                        <p className="text-xs font-extrabold text-[#34415c] group-hover:text-[#687fe0] truncate">
                          {cleanSampleText(cite.document_title)}
                        </p>
                        <span className="text-[11px] text-[#6179d8] font-bold">
                          {cite.page_number}쪽 바로보기 (PDF)
                        </span>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-[#8b9ab7] group-hover:text-[#687fe0] flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 하단 질문 재질문 액션 바 */}
          {onRetrySummary && previousUserMessage && (
            <div className="mt-4 pt-3.5 border-t border-[#edf0f6] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-[#f8faff] -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 p-3.5 sm:px-5 sm:py-3 rounded-b-[22px]">
              <div className="flex items-center gap-1.5 text-xs text-[#627392]">
                <span className="font-bold text-[#445579]">💡 대답이 마음에 들지 않으신가요?</span>
                <span className="hidden md:inline text-[#8a99b2]">AI가 전체 문서를 종합 분석하여 다시 답변해 드립니다.</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {onRetry && (
                  <button
                    type="button"
                    onClick={() => onRetry(previousUserMessage)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-[#d9e2f2] hover:bg-[#f0f4fc] text-[#617392] hover:text-[#30415e] text-xs font-bold transition-all shadow-2xs"
                    title="기존 모드로 다시 질문하기"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>다시 질문</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onRetrySummary(previousUserMessage)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#687fe0] via-[#7462e0] to-[#8854dc] hover:opacity-95 text-white text-xs font-black shadow-pill hover:shadow-btn hover:-translate-y-0.5 active:translate-y-0 transition-all"
                  title="Workers AI 요약 모드로 전환하여 답변 다시 생성"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                  <span>AI 요약으로 다시 질문</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
