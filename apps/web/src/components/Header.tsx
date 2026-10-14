import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles, Search, SlidersHorizontal, Shield, ExternalLink } from 'lucide-react';
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
    <>
      {/* 상단 장식 별 라인 (create.allforedu.kr 동일) */}
      <div className="w-full text-center text-xs tracking-[14px] sm:tracking-[17px] text-[#c5d4fa] py-1 select-none font-sans" aria-hidden="true">
        ✦　✧　✦　✧　✦
      </div>

      {/* 사이트 헤더 */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#e8edf7] transition-all">
        <div className="max-w-[1160px] mx-auto px-4 sm:px-6 h-[72px] flex items-center justify-between">
          {/* 브랜드 로고 (create.allforedu.kr 통일) */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5 text-left group">
              <div className="w-11 h-11 rounded-[14px] bg-[#e2eaff] flex items-center justify-center text-2xl text-[#6b7fe0] shadow-sm group-hover:scale-105 transition-transform">
                ✳
              </div>
              <div>
                <strong className="text-xl font-black text-[#374f7e] tracking-wider leading-none block">
                  CREATE
                </strong>
                <small className="text-[9px] font-bold tracking-[1.8px] text-[#8b9ab7] uppercase mt-1 block">
                  AI ASSISTANT · RESEARCH SCHOOL
                </small>
              </div>
            </Link>

            {/* 메인 포털 상단 메뉴 네비게이션 */}
            <nav className="hidden lg:flex items-center gap-1 text-xs font-extrabold text-[#697997]">
              <a
                href="https://create.allforedu.kr/"
                className="px-3.5 py-2 rounded-xl hover:bg-[#edf1ff] hover:text-[#586fca] transition-colors flex items-center gap-1"
                title="CREATE 성과 공유 플랫폼 홈으로 이동"
              >
                <span>홈</span>
              </a>
              <a
                href="https://create.allforedu.kr/#library"
                className="px-3.5 py-2 rounded-xl hover:bg-[#edf1ff] hover:text-[#586fca] transition-colors flex items-center gap-1"
                title="자료 둘러보기"
              >
                <span>자료 둘러보기</span>
              </a>
              <Link
                to="/"
                className={`px-3.5 py-2 rounded-xl transition-all ${
                  !isAdmin
                    ? 'bg-[#687fe0] text-white shadow-pill'
                    : 'hover:bg-[#edf1ff] hover:text-[#586fca]'
                }`}
              >
                <span>AI 수업 도우미</span>
              </Link>
            </nav>
          </div>

          {/* 우측 컨트롤: 모드 전환, 필터, 관리자 */}
          <div className="flex items-center gap-2 sm:gap-3">
            {!isAdmin && (
              <>
                {/* 필터 토글 버튼 (create.allforedu.kr .filter 스타일) */}
                <button
                  type="button"
                  onClick={onToggleFilters}
                  className={`relative px-3.5 py-2 rounded-[13px] text-xs font-extrabold flex items-center gap-1.5 border transition-all ${
                    showFilters || hasActiveFilters
                      ? 'bg-[#687fe0] border-[#687fe0] text-white shadow-pill'
                      : 'bg-white border-[#e4eaf5] text-[#67768e] hover:-translate-y-0.5 hover:border-[#8ba0ed]'
                  }`}
                  title="학년/교과/유형별 필터 선택"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">자료 필터</span>
                  {hasActiveFilters && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 absolute -top-1 -right-1 ring-2 ring-white" />
                  )}
                </button>

                {/* 하이브리드 답변 모드 스위치 */}
                <div className="bg-[#f0f4fc] p-1 rounded-2xl flex items-center border border-[#e2e8f4]">
                  <button
                    type="button"
                    onClick={() => onModeChange('search')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                      mode === 'search'
                        ? 'bg-white text-[#34476a] shadow-sm'
                        : 'text-[#8b9ab7] hover:text-[#34476a]'
                    }`}
                    title="등록된 공식 자료에서 직접 발췌 검색 (무료 100% 신뢰)"
                  >
                    <Search className={`w-3.5 h-3.5 ${mode === 'search' ? 'text-[#687fe0]' : ''}`} />
                    <span>자료 검색</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onModeChange('ai')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                      mode === 'ai'
                        ? 'bg-[#687fe0] text-white shadow-pill'
                        : 'text-[#8b9ab7] hover:text-[#34476a]'
                    }`}
                    title="Workers AI (Llama 3.3 70B) 기반 대화형 요약"
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
              className={`px-3 py-2 rounded-[13px] border text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                isAdmin
                  ? 'bg-[#34476a] border-[#34476a] text-white'
                  : 'bg-white border-[#e4eaf5] text-[#67768e] hover:bg-[#f8faff] hover:border-[#8ba0ed]'
              }`}
              title={isAdmin ? '챗봇 메인으로 돌아가기' : '관리자 화면 (비밀번호: 7703)'}
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isAdmin ? '챗봇 홈' : '관리자'}</span>
            </Link>
          </div>
        </div>
      </header>
    </>
  );
};
