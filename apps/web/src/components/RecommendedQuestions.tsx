import React from 'react';
import {
  HelpCircle,
  Layers,
  Activity,
  FolderSearch,
  Lightbulb,
  AlertCircle
} from 'lucide-react';
import { RECOMMENDED_QUESTIONS } from '@create-chatbot/shared';

interface RecommendedQuestionsProps {
  onSelectQuestion: (question: string) => void;
}

const QUESTION_ICONS = [
  HelpCircle,
  Layers,
  Activity,
  FolderSearch,
  Lightbulb,
  AlertCircle
];

export const RecommendedQuestions: React.FC<RecommendedQuestionsProps> = ({
  onSelectQuestion
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto py-6 px-4 animate-fadeIn">
      <div className="text-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
          선생님을 위한 CREATE 수업 도우미
        </h2>
        <p className="text-sm text-slate-500 mt-1.5 max-w-lg mx-auto">
          연구학교 공식 매뉴얼 및 단원설계안 자료를 바탕으로 신뢰할 수 있는 안내를 제공합니다.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {RECOMMENDED_QUESTIONS.map((question, index) => {
          const Icon = QUESTION_ICONS[index % QUESTION_ICONS.length];
          return (
            <button
              key={question}
              type="button"
              onClick={() => onSelectQuestion(question)}
              className="flex items-start text-left gap-3.5 p-4 rounded-xl bg-white border border-slate-200/90 shadow-sm hover:border-brand-400 hover:shadow-md hover:-translate-y-0.5 transition-all group"
            >
              <div className="p-2.5 rounded-lg bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-colors flex-shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-brand-600 block mb-0.5">
                  추천 질문 {index + 1}
                </span>
                <p className="text-sm font-medium text-slate-800 group-hover:text-brand-900 transition-colors line-clamp-2">
                  {question}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
