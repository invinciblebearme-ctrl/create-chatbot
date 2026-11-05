import React from 'react';
import { ArrowRight, RotateCcw, CheckCircle2 } from 'lucide-react';
import { RECOMMENDED_QUESTIONS, OFFICIAL_CREATE_STAGES } from '@create-chatbot/shared';

interface RecommendedQuestionsProps {
  onSelectQuestion: (question: string) => void;
}

const STAGE_QUESTIONS: Record<string, string> = {
  'C': 'C단계 진단(Check & Context)의 한 줄 정의와 핵심 활동을 알려주세요.',
  'R': 'R단계 탐색(Research & Resource)에서는 어떤 자료와 교육과정을 준비하나요?',
  'E1': 'E단계 실행(Execution & Engage)에서 맞춤형 탐구 실행 및 피드백 방법은 무엇인가요?',
  'A': 'A단계 분석(Analysis & Action)에서 목표 도달 여부에 따른 환류(E 또는 R 복귀) 흐름을 설명해주세요.',
  'T': 'T단계 전이(Transfer & Think)에서 타 교과 및 실생활 연계는 어떻게 이루어지나요?',
  'E2': 'E단계 성장(Evolve & Evaluate)의 단원 학습 정리 및 자기성찰 활동을 알려주세요.'
};

const STAGE_COLORS: Record<string, { badge: string; border: string; bg: string; text: string }> = {
  'C': { badge: 'bg-[#eaf2ff] text-[#3d65d8]', border: 'hover:border-[#3d65d8]', bg: 'bg-[#f4f7ff]', text: 'text-[#3d65d8]' },
  'R': { badge: 'bg-[#eef8f2] text-[#248a58]', border: 'hover:border-[#248a58]', bg: 'bg-[#f2faf5]', text: 'text-[#248a58]' },
  'E1': { badge: 'bg-[#fff4eb] text-[#d4651a]', border: 'hover:border-[#d4651a]', bg: 'bg-[#fff7f0]', text: 'text-[#d4651a]' },
  'A': { badge: 'bg-[#f5eeff] text-[#703bc9]', border: 'hover:border-[#703bc9]', bg: 'bg-[#f8f3ff]', text: 'text-[#703bc9]' },
  'T': { badge: 'bg-[#eaf7fa] text-[#1c7e8c]', border: 'hover:border-[#1c7e8c]', bg: 'bg-[#f1fafb]', text: 'text-[#1c7e8c]' },
  'E2': { badge: 'bg-[#fdf0f5] text-[#b82f63]', border: 'hover:border-[#b82f63]', bg: 'bg-[#fcf3f7]', text: 'text-[#b82f63]' },
};

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
      {/* Hero 소개 섹션 */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#eef4ff] via-[#ffffff] to-[#f7f3ff] border border-[#e8edf7] rounded-[28px] p-6 sm:p-10 text-center mb-8 shadow-sm">
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
            ✦ AI DIGITAL RESEARCH SCHOOL AI ASSISTANT ✦
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-[#34476a] tracking-tight leading-[1.3] mb-3">
            함께 설계하고,<br />
            <span className="text-[#687fe0]">AI로 배움을 지원하다</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#697b98] leading-relaxed max-w-lg mx-auto mb-5">
            CREATE 교수·학습 모형의 공식 매뉴얼과 연구학교 단원설계안을 바탕으로<br className="hidden sm:inline" />
            신뢰할 수 있는 정확한 답변과 PDF 원문 근거를 제공합니다.
          </p>

          {/* 히어로 칩 */}
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

      {/* CREATE 6단계 한눈에 보기 (첨부 공식 이미지 반영) */}
      <div className="bg-white border border-[#e5ebf5] rounded-[24px] p-5 sm:p-7 mb-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#edf1f8]">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#e9f0ff] text-[#3e66db] text-xs font-black px-2.5 py-0.5 rounded-full">
                6단계 한눈에 보기
              </span>
              <span className="text-xs font-bold text-[#8997b0]">
                순차 진행 + A단계 환류(복귀)
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-[#2e3e5c] mt-1">
              CREATE 교수·학습 모형 단계 안내
            </h2>
          </div>
          <span className="text-xs text-[#71829e]">
            각 단계를 클릭하면 AI 도우미에게 즉시 질문할 수 있습니다.
          </span>
        </div>

        {/* 6단계 카드 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 mb-4">
          {OFFICIAL_CREATE_STAGES.map((stage, idx) => {
            const stageKey = idx === 2 ? 'E1' : idx === 5 ? 'E2' : stage.code;
            const colors = STAGE_COLORS[stageKey] || STAGE_COLORS['C'];
            const question = STAGE_QUESTIONS[stageKey] || `${stage.name} 단계에 대해 알려주세요.`;

            return (
              <button
                key={`${stage.code}-${idx}`}
                type="button"
                onClick={() => onSelectQuestion(question)}
                className={`group relative text-left p-3.5 rounded-[18px] bg-[#fafbfc] border border-[#e8edf6] ${colors.border} hover:bg-white hover:shadow-md transition-all duration-200 flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-black w-7 h-7 rounded-lg flex items-center justify-center ${colors.badge}`}>
                      {stage.code}
                    </span>
                    <span className="text-[10px] font-black text-[#8795ad] bg-white border border-[#e7edf6] px-1.5 py-0.5 rounded">
                      {stage.subTitle}
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-[#2b3a58] group-hover:text-[#4168dd] transition-colors">
                    {stage.name}
                  </h3>
                  <p className="text-[10px] font-bold text-[#8695ad] mb-2">
                    {stage.english}
                  </p>

                  <p className="text-[11px] font-medium text-[#5c6c86] leading-snug line-clamp-3 mb-2">
                    {stage.oneLineDef}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#edf1f8] text-[10px] font-black text-[#5e77d9] flex items-center justify-between">
                  <span>핵심활동 질문</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>

        {/* 단계의 흐름: 순차 + 환류 배너 */}
        <div className="bg-gradient-to-r from-[#f0f4ff] via-[#f7f9ff] to-[#f4f0ff] border border-[#dce5fb] rounded-[16px] p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-start sm:items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#4168dd] text-white flex items-center justify-center shrink-0">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <div className="font-black text-[#2f4164] flex items-center gap-1.5 flex-wrap">
                <span>단계의 흐름: 순차 + 환류</span>
                <span className="text-[11px] font-extrabold text-[#5368a5] bg-white px-2 py-0.5 rounded-full border border-[#d6e0f7]">
                  C 진단 ➔ R 탐색 ➔ E 실행 ➔ A 분석 ➔ T 전이 ➔ E 성장
                </span>
              </div>
              <p className="text-[#5a6c8e] text-[11px] mt-0.5">
                <strong>분석(A)</strong> 결과 목표 도달 시 <strong>전이(T)·성장(E)</strong>으로 진행하며, 이해도가 낮으면 <strong>실행(E)</strong>으로 복귀, 필요하면 <strong>탐색(R)</strong>으로 복귀하여 재설계합니다.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectQuestion('A단계 분석에서 환류(되돌아가기) 메커니즘과 복귀 조건에 대해 자세히 설명해 주세요.')}
            className="shrink-0 self-end md:self-center px-3 py-1.5 bg-white hover:bg-[#eef3ff] text-[#3d65d8] border border-[#ccd8f7] rounded-full font-black text-[11px] transition-colors flex items-center gap-1 shadow-2xs"
          >
            <span>환류 메커니즘 질문하기</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 추천 질문 타이틀 */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div>
          <span className="text-[11px] font-black tracking-[1.5px] text-[#91a0d0] uppercase block">
            EXPLORE QUESTIONS
          </span>
          <h2 className="text-lg sm:text-xl font-black text-[#33445f] tracking-tight">
            자주 묻는 질문 <span className="text-[#e3a7d1]">✦</span>
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
