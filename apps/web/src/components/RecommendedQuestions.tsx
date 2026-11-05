import React from 'react';
import { ArrowRight, RotateCcw, Sparkles, Layers, ChevronRight } from 'lucide-react';
import { RECOMMENDED_QUESTIONS, CREATE_STAGES } from '@create-chatbot/shared';

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

const STAGE_COLORS = [
  { border: 'border-[#d0e1fd]', badge: 'bg-[#2b6cb0] text-white', lightBg: 'bg-[#f0f6ff]' }, // C
  { border: 'border-[#c6f6d5]', badge: 'bg-[#276749] text-white', lightBg: 'bg-[#f0fff4]' }, // R
  { border: 'border-[#feebc8]', badge: 'bg-[#c05621] text-white', lightBg: 'bg-[#fffaf0]' }, // E
  { border: 'border-[#e9d8fd]', badge: 'bg-[#6b46c1] text-white', lightBg: 'bg-[#faf5ff]' }, // A (환류)
  { border: 'border-[#fed7d7]', badge: 'bg-[#9b2c2c] text-white', lightBg: 'bg-[#fff5f5]' }, // T
  { border: 'border-[#b2f5ea]', badge: 'bg-[#234e52] text-white', lightBg: 'bg-[#e6fffa]' }, // E
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

      {/* CREATE 6단계 한눈에 보기 & 단계의 흐름: 순차 + 환류 */}
      <section className="mb-10 bg-white border border-[#e5ebf5] rounded-[26px] p-5 sm:p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-[#edf1f8] gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-[#eaf1ff] text-[#5570d6]">
                <Layers className="w-3.5 h-3.5" />
              </span>
              <span className="text-[11px] font-black tracking-[1.5px] text-[#8495cb] uppercase">
                CREATE MODEL FRAMEWORK
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-[#2f3e58] tracking-tight mt-1">
              6단계 한눈에 보기 <span className="text-xs font-bold text-[#687fe0] ml-1 bg-[#eef3ff] px-2.5 py-0.5 rounded-full">순차 + 환류</span>
            </h2>
          </div>
          <span className="text-xs text-[#71829f] font-medium">
            💡 카드를 클릭하면 해당 단계의 상세 안내를 바로 질문합니다
          </span>
        </div>

        {/* 6단계 그리드 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mb-6">
          {CREATE_STAGES.map((stage, idx) => {
            const style = STAGE_COLORS[idx % STAGE_COLORS.length];
            const isFeedbackStage = stage.letter === 'A';

            return (
              <button
                key={`${stage.letter}-${stage.name}-${idx}`}
                type="button"
                onClick={() =>
                  onSelectQuestion(
                    isFeedbackStage
                      ? `CREATE 모형의 A(분석) 단계 환류 메커니즘과 복귀 규칙에 대해 알려주세요.`
                      : `CREATE 모형의 ${stage.letter}(${stage.name}) 단계 핵심 활동과 수업 설계 방법을 알려주세요.`
                  )
                }
                className={`text-left p-4 rounded-[18px] border ${style.border} ${style.lightBg} hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shadow-sm ${style.badge}`}>
                        {stage.letter}
                      </span>
                      <div>
                        <span className="text-base font-black text-[#28354f] group-hover:text-[#5570d6] transition-colors">
                          {stage.name}
                        </span>
                        <span className="block text-[11px] text-[#718096] font-semibold tracking-tight">
                          {stage.english}
                        </span>
                      </div>
                    </div>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${isFeedbackStage ? 'bg-purple-100 text-purple-700 font-extrabold animate-pulse' : 'bg-white/80 text-[#596982]'}`}>
                      {stage.flowRole}
                    </span>
                  </div>

                  <p className="text-xs text-[#42526e] leading-relaxed mb-3 line-clamp-2">
                    {stage.summary}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-black/5 flex items-start gap-1.5 text-[11px] text-[#556782]">
                  <span className="font-extrabold text-[#3a4960] shrink-0">핵심 활동:</span>
                  <span className="leading-snug text-[#60718d]">{stage.coreActivities}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* 단계의 흐름: 순차 + 환류 메커니즘 시각화 */}
        <div className="bg-[#f8faff] border border-[#e1e9f6] rounded-[20px] p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#5b73dc] text-white">
              <RotateCcw className="w-3 h-3" />
            </span>
            <h3 className="text-xs sm:text-sm font-black text-[#2d3d57]">
              단계의 흐름: 순차 + 환류
            </h3>
            <span className="text-[11px] text-[#6b7c99]">
              분석(A) 결과에 따라 전이로 나아가거나, 돌아가서 실행과 분석을 반복합니다
            </span>
          </div>

          {/* 단계 순차 배지 플로우 */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-xs font-bold text-[#3d4d67] mb-3">
            <div className="bg-white border border-[#d6e2f4] rounded-xl px-3 py-1.5 shadow-xs">
              <span className="font-black text-[#2b6cb0]">C</span> 진단 <span className="text-[10px] text-[#8696b0]">(출발점)</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#9fb0cb] shrink-0" />
            <div className="bg-white border border-[#d6e2f4] rounded-xl px-3 py-1.5 shadow-xs">
              <span className="font-black text-[#276749]">R</span> 탐색 <span className="text-[10px] text-[#8696b0]">(자료·질문)</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#9fb0cb] shrink-0" />
            <div className="bg-white border border-[#d6e2f4] rounded-xl px-3 py-1.5 shadow-xs">
              <span className="font-black text-[#c05621]">E</span> 실행 <span className="text-[10px] text-[#8696b0]">(맞춤형 탐구)</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#9fb0cb] shrink-0" />
            <div className="bg-[#f3e8ff] border-2 border-[#9061f9] rounded-xl px-3 py-1.5 shadow-xs text-[#581c87]">
              <span className="font-black text-[#6b46c1]">A</span> 분석 <span className="text-[10px] font-black text-[#7e22ce]">(목표 도달 판단 ⚡)</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#9fb0cb] shrink-0" />
            <div className="bg-white border border-[#d6e2f4] rounded-xl px-3 py-1.5 shadow-xs">
              <span className="font-black text-[#9b2c2c]">T</span> 전이 <span className="text-[10px] text-[#8696b0]">(삶에 적용)</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#9fb0cb] shrink-0" />
            <div className="bg-white border border-[#d6e2f4] rounded-xl px-3 py-1.5 shadow-xs">
              <span className="font-black text-[#234e52]">E</span> 성장 <span className="text-[10px] text-[#8696b0]">(정리·성찰)</span>
            </div>
          </div>

          {/* 환류(A) 분기 안내 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 border-t border-[#e5ecf7] text-[11px]">
            <div className="bg-white/90 border border-green-200 rounded-xl p-2.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
              <div>
                <strong className="text-emerald-800">목표 도달 시:</strong>
                <span className="text-slate-600 ml-1">T(전이) ➔ E(성장)으로 진행</span>
              </div>
            </div>
            <div className="bg-white/90 border border-amber-200 rounded-xl p-2.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
              <div>
                <strong className="text-amber-800">이해도 낮을 시:</strong>
                <span className="text-slate-600 ml-1">E(실행)로 복귀 (다시 실행)</span>
              </div>
            </div>
            <div className="bg-white/90 border border-indigo-200 rounded-xl p-2.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0"></span>
              <div>
                <strong className="text-indigo-800">필요 시 재설계:</strong>
                <span className="text-slate-600 ml-1">R(탐색)로 복귀 (재설계 후 실행)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

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
