import React, { useRef, useEffect } from 'react';
import { Send, Trash2, Loader2 } from 'lucide-react';
import { AI_QUOTA_POLICY } from '@create-chatbot/shared';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  isLoading: boolean;
  hasMessages: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSubmit,
  onClear,
  isLoading,
  hasMessages
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 자동 높이 조절
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && value.trim()) {
        onSubmit();
      }
    }
  };

  return (
    <div className="sticky bottom-0 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent pt-4 pb-4 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <form
          onSubmit={e => {
            e.preventDefault();
            if (!isLoading && value.trim()) {
              onSubmit();
            }
          }}
          className="bg-white rounded-2xl border border-slate-300/80 shadow-lg shadow-slate-200/50 p-2 sm:p-2.5 transition-all focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20"
        >
          <div className="flex items-end gap-2">
            {/* 초기화 버튼 */}
            {hasMessages && (
              <button
                type="button"
                onClick={onClear}
                className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex-shrink-0"
                title="대화 초기화"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            {/* 질문 입력란 */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={value}
              maxLength={AI_QUOTA_POLICY.MAX_QUERY_LENGTH}
              onChange={e => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="CREATE 교수·학습 모형이나 단원설계에 대해 질문해 보세요... (Enter 전송, Shift+Enter 줄바꿈)"
              disabled={isLoading}
              className="flex-1 max-h-36 resize-none bg-transparent py-2 px-2 text-sm text-slate-800 placeholder-slate-400 outline-none leading-relaxed"
            />

            {/* 전송 버튼 */}
            <button
              type="submit"
              disabled={isLoading || !value.trim()}
              className={`p-2.5 rounded-xl font-medium flex items-center justify-center flex-shrink-0 transition-all ${
                isLoading || !value.trim()
                  ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                  : 'bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-500/20'
              }`}
              title="질문 전송"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* 하단 글자 수 및 안내 */}
          <div className="flex items-center justify-between px-2 pt-1 text-[11px] text-slate-400">
            <span>공식 연구학교 매뉴얼과 등록된 설계안을 기준으로 답변합니다.</span>
            <span>
              {value.length} / {AI_QUOTA_POLICY.MAX_QUERY_LENGTH}자
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};
