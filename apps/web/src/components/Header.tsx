import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles, Search, SlidersHorizontal, Shield, BookOpen } from 'lucide-react';
import { ChatMode } from '@create-chatbot/shared';

interface HeaderProps {
  mode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  hasActiveFilters: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  onModeChange,
  showFilters,
  onToggleFilters,
  hasActiveFilters
}) => {
  const location = useLocation();
  const isAdmin = location.pathname.includes('/admin');

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* 로고 및 서비스 명칭 */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">
                  CREATE AI 수업 도우미
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                  연구학교 공식
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                초등학교 연구학교 CREATE 교수·학습 모형 지원
              </p>
            </div>
          </Link>
        </div>

        {/* 우측 컨트롤: 모드 전환 및 관리자 링크 */}
        <div className="flex items-center gap-2 sm:gap-3">
          {!isAdmin && (
            <>
              {/* 필터 토글 버튼 */}
              <button
                type="button"
                onClick={onToggleFilters}
                className={`relative px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 border transition-all ${
                  showFilters || hasActiveFilters
                    ? 'bg-brand-50 border-brand-300 text-brand-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
                title="학년/교과/유형별 필터"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">자료 필터</span>
                {hasActiveFilters && (
                  <span className="w-2 h-2 rounded-full bg-brand-600 absolute -top-1 -right-1" />
                )}
              </button>

              {/* 하이브리드 답변 모드 스위치 */}
              <div className="bg-slate-100 p-0.5 rounded-xl flex items-center border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => onModeChange('search')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    mode === 'search'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                  title="등록된 공식 자료에서 직접 발췌 검색 (무료/신뢰도 100%)"
                >
                  <Search className="w-3.5 h-3.5 text-brand-600" />
                  <span>자료 검색</span>
                </button>
                <button
                  type="button"
                  onClick={() => onModeChange('ai')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    mode === 'ai'
                      ? 'bg-gradient-to-r from-brand-600 to-tealbrand-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                  title="Workers AI를 활용한 대화형 요약 및 수업설계 질의"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI 요약</span>
                </button>
              </div>
            </>
          )}

          {/* 관리자 링크 */}
          <Link
            to={isAdmin ? '/' : '/admin'}
            className={`p-2 rounded-lg border text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-all ${
              isAdmin
                ? 'bg-brand-600 border-brand-600 text-white'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title={isAdmin ? '챗봇 메인으로 돌아가기' : '관리자 화면 (PDF 업로드 및 색인)'}
          >
            <Shield className="w-4 h-4" />
            <span className="hidden md:inline">{isAdmin ? '챗봇 홈' : '관리자'}</span>
          </Link>
        </div>
      </div>
    </header>
  );
};
