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
  onOpenPdf: (docId: string, pageNumber: number, title: string) => void;
  previousUserMessage?: string;
}

/**
 * XSS 방지 및 기본 마크다운 파서
 */
function renderMarkdown(content: string) {
  // HTML 태그 이스케이프
  const escaped = content
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
          <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <User className="w-4 h-4" />
          </div>
          <div className="bg-brand-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm text-sm leading-relaxed">
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-6 animate-fadeIn">
      <div className="max-w-[92%] sm:max-w-[85%] flex items-start gap-3">
        {/* 어시스턴트 아바타 */}
        <div className="w-8 h-8 rounded-full bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
          <Bot className="w-4 h-4" />
        </div>

        <div className="flex-1 bg-white border border-slate-200/90 rounded-2xl rounded-tl-sm p-4 sm:p-5 shadow-sm">
          {/* 상단 뱃지: 모드 및 폴백 상태 */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-100 text-xs">
            <div className="flex items-center gap-1.5">
              {message.mode === 'ai' && !message.is_fallback ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-tealbrand-50 text-tealbrand-600 font-medium">
                  <Sparkles className="w-3 h-3" />
                  Workers AI 요약
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 font-medium">
                  <Search className="w-3 h-3 text-brand-600" />
                  공식 자료 발췌 검색
                </span>
              )}

              {message.is_fallback && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                  무료한도 검색모드 전환
                </span>
              )}
            </div>

            {/* 유틸 버튼: 복사 / 다시 질문 */}
            <div className="flex items-center gap-1 text-slate-400">
              <button
                type="button"
                onClick={handleCopy}
                className="p-1 rounded hover:bg-slate-100 hover:text-slate-700 transition-colors"
                title="답변 내용 복사"
              >
                {copied ? (
                  <span className="flex items-center gap-1 text-tealbrand-600 font-medium text-[11px]">
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
                  className="p-1 rounded hover:bg-slate-100 hover:text-slate-700 transition-colors"
                  title="이 질문 다시 하기"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* 본문 렌더링 */}
          <div className="prose-chat text-slate-800">{renderMarkdown(message.content)}</div>

          {/* 출처 목록 (Citations) */}
          {message.citations && message.citations.length > 0 && (
            <div className="mt-4 pt-3.5 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                📌 참고 공식 자료 ({message.citations.length}건)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {message.citations.map((cite, idx) => (
                  <button
                    key={`${cite.document_id}-${cite.page_number}-${idx}`}
                    type="button"
                    onClick={() =>
                      onOpenPdf(cite.document_id, cite.page_number, cite.document_title)
                    }
                    className="flex items-center justify-between text-left p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 hover:bg-brand-50/70 hover:border-brand-300 transition-all group"
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <FileText className="w-4 h-4 text-brand-600 flex-shrink-0" />
                      <div className="truncate">
                        <p className="text-xs font-semibold text-slate-800 group-hover:text-brand-900 truncate">
                          {cite.document_title}
                        </p>
                        <span className="text-[11px] text-brand-700 font-medium">
                          {cite.page_number}쪽 바로가기
                        </span>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-600 flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
