import React from 'react';
import { ArrowRight } from 'lucide-react';
import { RECOMMENDED_QUESTIONS } from '@create-chatbot/shared';

interface RecommendedQuestionsProps {
  onSelectQuestion: (question: string) => void;
}

const QUESTION_EMOJIS = ['💡', '🧩', '🌱', '📘', '🎨', '📖'];
const QUESTION_COLORS = [
  'bg-[#eaf2ff] text-[#586fca]', // blue
  'bg-[#e6f8ef] text-[#349c71]', // mint
  'bg-[#fff0e3] text-[#cf7a38]', // peach
  'bg-[#f1ecff] text-[#7a59d9]', // lavender
  'bg-[#ffedf3] text-[#cf4876]', // pink
  'bg-[#e6f8fa] text-[#29919c]', // aqua
];

export const RecommendedQuestions: React.FC<RecommendedQuestionsProps> = ({
  onSelectQuestion
}) => {
  return (
    <div className="w-full max-w-[1160px] mx-auto py-4 px-2 sm:px-4 animate-fadeIn">
      {/* Hero 소개 섹션 (create.allforedu.kr hero 스타일 완벽 동기화) */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#eef4ff] via-[#ffffff] to-[#f7f3ff] border border-[#e8edf7] rounded-[28px] p-6 sm:p-10 text-center mb-8 shadow-sm">
        {/* 플로팅 배경 이모지 (create.allforedu.kr hero 요소) */}
        <span className="absolute left-[5%] top-[20%] text-3xl sm:text-4xl opacity-75 select-none -rotate-12 hidden sm:inline" aria-hidden="true">
          ✏️
        </span>
        <span className="absolute right-[6%] top-[18%] text-3xl sm:text-4xl opacity-75 select-none rotate-12 hidden sm:inline" aria-hidden="true">
          📚
        </span>
        <span className="absolute right-[14%] bottom-[16%] text-2xl sm:text-3xl opacity-75 select-none hidden sm:inline" aria-hidden="true">
          ✨
        </span>

        <div className="max-w-2xl mx-auto relative z-10">
          <span className="inline-block text-[11px] font-black tracking-[1.8px] text-[#91a0d0] uppercase mb-2">
            ✦ CREATE RESEARCH SCHOOL AI ASSISTANT ✦
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-[#34476a] tracking-tight leading-[1.3] mb-3">
            함께 설계하고,<br />
            <span className="text-[#687fe0]">AI로 배움을 지원하다</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#697b98] leading-relaxed max-w-lg mx-auto mb-5">
            CREATE 교수·학습 모형의 공식 매뉴얼과 연구학교 단원설계안을 바탕으로<br className="hidden sm:inline" />
            신뢰할 수 있는 정확한 답변과 PDF 원문 근거를 제공합니다.
          </p>

          {/* 히어로 칩 (create.allforedu.kr chips 스타일) */}
          <div className="flex items-center justify-center gap-2 flex-wrap text-xs font-extrabold text-[#6d7f9d]">
            <span className="bg-white/90 border border-white rounded-full px-3 py-1 shadow-sm">
              📘 단원 설계
            </span>
            <span className="bg-white/90 border border-white rounded-full px-3 py-1 shadow-sm">
              🎨 교수학습 자료
            </span>
            <span className="bg-white/90 border border-white rounded-full px-3 py-1 shadow-sm">
              📖 실증수업 지도안
            </span>
            <span className="bg-white/90 border border-white rounded-full px-3 py-1 shadow-sm">
              ✨ 100% 무료 검색 & 요약
            </span>
          </div>
        </div>
      </div>

      {/* 추천 질문 타이틀 */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div>
          <span className="text-[11px] font-black tracking-[1.5px] text-[#91a0d0] uppercase block">
            EXPLORE QUESTIONS
          </span>
          <h2 className="text-lg sm:text-xl font-black text-[#33445f] tracking-tight">
            자주 묻는 CREATE 질문 <span className="text-[#e3a7d1]">✦</span>
          </h2>
        </div>
        <span className="text-xs font-extrabold text-[#7b8db3] bg-[#eaf0ff] rounded-full px-3 py-1">
          {RECOMMENDED_QUESTIONS.length}개 추천 질문
        </span>
      </div>

      {/* 추천 질문 카드 그리드 (create.allforedu.kr .content-card 스타일) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {RECOMMENDED_QUESTIONS.map((question, index) => {
          const emoji = QUESTION_EMOJIS[index % QUESTION_EMOJIS.length];
          const colorClass = QUESTION_COLORS[index % QUESTION_COLORS.length];

          return (
            <button
              key={question}
              type="button"
              onClick={() => onSelectQuestion(question)}
              className="group text-left p-5 rounded-[22px] bg-white border border-[#e8edf6] shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-11 h-11 rounded-[14px] flex items-center justify-center text-xl ${colorClass}`}>
                    {emoji}
                  </div>
                  <span className="text-[10px] font-extrabold text-[#8490a8] bg-[#f4f6fb] rounded-full px-2.5 py-1 uppercase">
                    QUESTION 0{index + 1}
                  </span>
                </div>

                <p className="text-sm font-extrabold text-[#34415c] group-hover:text-[#687fe0] transition-colors line-clamp-2 leading-relaxed">
                  {question}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#edf0f6] flex items-center justify-between text-xs font-black text-[#6179d8]">
                <span className="text-[11px] font-extrabold text-[#8a96aa]">바로 질문하기</span>
                <span className="inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  답변 확인
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
