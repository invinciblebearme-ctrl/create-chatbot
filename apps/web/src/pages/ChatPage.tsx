import React, { useState, useEffect, useRef } from 'react';
import {
  ChatMessage,
  ChatMode,
  SearchFilter
} from '@create-chatbot/shared';
import { Header } from '../components/Header';
import { FilterBar } from '../components/FilterBar';
import { RecommendedQuestions } from '../components/RecommendedQuestions';
import { ChatMessageItem } from '../components/ChatMessageItem';
import { ChatInput } from '../components/ChatInput';
import { PdfViewerModal } from '../components/PdfViewerModal';
import { sendChatMessage } from '../api';
import { AlertCircle, Sparkles } from 'lucide-react';

const SESSION_STORAGE_KEY = 'create_chatbot_session_messages';

export const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<ChatMode>('search');
  const [showFilters, setShowFilters] = useState(false);
  const [filter, setFilter] = useState<SearchFilter>({
    category: '전체',
    grade: '전체',
    subject: '전체'
  });
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // PDF 뷰어 모달 상태
  const [viewerModal, setViewerModal] = useState<{
    isOpen: boolean;
    docId: string | null;
    pageNumber: number;
    title: string;
  }>({
    isOpen: false,
    docId: null,
    pageNumber: 1,
    title: ''
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  // 브라우저 세션 스토리지에만 대화 임시 보존 (서버 미저장)
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to save to sessionStorage:', e);
    }
  }, [messages]);

  // 새 메시지 시 자동 스크롤
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    setErrorNotice(null);
    setInput('');

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const activeFilter =
        filter.category !== '전체' || filter.grade !== '전체' || filter.subject !== '전체'
          ? filter
          : undefined;

      const response = await sendChatMessage(query, mode, activeFilter);

      const botMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.answer,
        mode: response.mode_used,
        citations: response.citations,
        is_fallback: response.is_fallback,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setErrorNotice(err.message || '답변을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm('현재 대화 내역을 초기화하시겠습니까?')) {
      setMessages([]);
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      setErrorNotice(null);
    }
  };

  const handleResetFilters = () => {
    setFilter({ category: '전체', grade: '전체', subject: '전체' });
  };

  const hasActiveFilters =
    (filter.category && filter.category !== '전체') ||
    (filter.grade && filter.grade !== '전체') ||
    (filter.subject && filter.subject !== '전체');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* 고정 헤더 */}
      <Header
        mode={mode}
        onModeChange={setMode}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(prev => !prev)}
        hasActiveFilters={!!hasActiveFilters}
      />

      {/* 필터 바 */}
      {showFilters && (
        <FilterBar
          filter={filter}
          onChange={setFilter}
          onReset={handleResetFilters}
        />
      )}

      {/* 오류 발생 시 안내 배너 */}
      {errorNotice && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-2.5 text-xs text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-4xl mx-auto w-full">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorNotice(null)}
            className="text-rose-500 hover:text-rose-800 font-bold ml-2"
          >
            ×
          </button>
        </div>
      )}

      {/* 메인 채팅 영역 */}
      <main className="flex-1 max-w-[1160px] w-full mx-auto px-4 sm:px-6 py-6 flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center items-center py-4">
            <RecommendedQuestions onSelectQuestion={handleSendMessage} />
          </div>
        ) : (
          <div className="flex-1 space-y-4 max-w-4xl mx-auto w-full">
            {messages.map((msg, idx) => {
              const prevUserMsg =
                msg.role === 'assistant' && idx > 0 && messages[idx - 1].role === 'user'
                  ? messages[idx - 1].content
                  : undefined;

              return (
                <ChatMessageItem
                  key={msg.id}
                  message={msg}
                  previousUserMessage={prevUserMsg}
                  onRetry={handleSendMessage}
                  onOpenPdf={(docId, pageNumber, title) =>
                    setViewerModal({
                      isOpen: true,
                      docId,
                      pageNumber,
                      title
                    })
                  }
                />
              );
            })}

            {/* 로딩 표시 */}
            {loading && (
              <div className="flex items-start gap-3 animate-pulse">
                <div className="w-9 h-9 rounded-[13px] bg-[#e2eaff] flex items-center justify-center text-[#687fe0] flex-shrink-0 text-base font-black">
                  ✳
                </div>
                <div className="bg-white border border-[#e8edf6] rounded-[22px] rounded-tl-sm p-4 w-52 shadow-card">
                  <div className="h-3 bg-[#e8edf6] rounded w-3/4 mb-2.5"></div>
                  <div className="h-3 bg-[#e8edf6] rounded w-1/2"></div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        )}
      </main>

      {/* 입력 영역 */}
      <ChatInput
        value={input}
        onChange={setInput}
        onSubmit={() => handleSendMessage()}
        onClear={handleClearChat}
        isLoading={loading}
        hasMessages={messages.length > 0}
      />

      {/* 사이트 푸터 (create.allforedu.kr 스타일 완벽 동기화) */}
      <footer className="border-t border-[#e9edf7] bg-white/70 mt-auto py-6">
        <div className="max-w-[1160px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#8996ab]">
          <div>
            <strong className="text-sm text-[#617392] font-black block">
              ✳ CREATE 모형 연구학교
            </strong>
            <p className="mt-1 text-[11px] text-[#8b9ab7]">
              수업의 성장과 배움의 나눔을 위한 성과 공유 공간 · AI 수업 도우미
            </p>
          </div>
          <div className="text-center sm:text-right text-[11px]">
            <span className="font-bold">© CREATE Research School</span>
            <span className="block text-[#a0aebb] mt-0.5">Powered by Cloudflare Pages & Workers AI</span>
          </div>
        </div>
      </footer>

      {/* PDF 전자책 / 원본 뷰어 모달 */}
      <PdfViewerModal
        isOpen={viewerModal.isOpen}
        onClose={() => setViewerModal(prev => ({ ...prev, isOpen: false }))}
        docId={viewerModal.docId}
        pageNumber={viewerModal.pageNumber}
        title={viewerModal.title}
      />
    </div>
  );
};
