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
    <div className="sticky bottom-0 bg-gradient-to-t from-[#f8faff] via-[#f8faff]/95 to-transparent pt-3 pb-4 px-4 sm:px-6">
      <div className="max-w-[1160px] mx-auto">
        <form
          onSubmit={e => {
            e.preventDefault();
            if (!isLoading && value.trim()) {
              onSubmit();
            }
          }}
          className="bg-white rounded-[24px] border border-[#e2e8f4] shadow-card-hover p-2 sm:p-2.5 transition-all focus-within:border-[#8ba0ed] focus-within:ring-4 focus-within:ring-[#687fe0]/15"
        >
          <div className="flex items-end gap-2">
            {/* 초기화 버튼 */}
            {hasMessages && (
              <button
                type="button"
                onClick={onClear}
                className="p-2.5 rounded-[13px] text-[#8b9ab7] hover:text-rose-600 hover:bg-rose-50 transition-colors flex-shrink-0"
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
              placeholder="CREATE 모형이나 단원설계안에 대해 질문해 보세요... (Enter 전송, Shift+Enter 줄바꿈)"
              disabled={isLoading}
              className="flex-1 max-h-36 resize-none bg-transparent py-2.5 px-3 text-sm text-[#30415e] placeholder-[#9aa7bd] outline-none leading-relaxed font-sans"
            />

            {/* 전송 버튼 */}
            <button
              type="submit"
              disabled={isLoading || !value.trim()}
              className={`p-3 rounded-[14px] font-black flex items-center justify-center flex-shrink-0 transition-all ${
                isLoading || !value.trim()
                  ? 'bg-[#f0f4fc] text-[#b6c2db] cursor-not-allowed'
                  : 'bg-[#687fe0] hover:bg-[#566ecf] text-white shadow-btn hover:-translate-y-0.5'
              }`}
              title="질문 전송"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#687fe0]" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* 하단 글자 수 및 안내 */}
          <div className="flex items-center justify-between px-3 pt-1.5 text-[11px] text-[#8b9ab7] font-medium">
            <span>공식 CREATE 연구학교 매뉴얼과 등록된 설계안을 기준으로 답변합니다.</span>
            <span>
              {value.length} / {AI_QUOTA_POLICY.MAX_QUERY_LENGTH}자
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};
