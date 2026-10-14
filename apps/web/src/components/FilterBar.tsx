import React from 'react';
import {
  GRADE_OPTIONS,
  SUBJECT_OPTIONS,
  DOCUMENT_CATEGORIES,
  SearchFilter
} from '@create-chatbot/shared';
import { RotateCcw } from 'lucide-react';

interface FilterBarProps {
  filter: SearchFilter;
  onChange: (filter: SearchFilter) => void;
  onReset: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({ filter, onChange, onReset }) => {
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filter, category: e.target.value });
  };

  const handleGradeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filter, grade: e.target.value });
  };

  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filter, subject: e.target.value });
  };

  const isFiltered =
    (filter.category && filter.category !== '전체') ||
    (filter.grade && filter.grade !== '전체') ||
    (filter.subject && filter.subject !== '전체');

  return (
    <div className="bg-white/95 border-b border-[#e8edf7] px-4 py-3 sm:px-6 shadow-sm transition-all animate-fadeIn">
      <div className="max-w-[1160px] mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-black text-[#34476a]">검색 범위 필터:</span>

          {/* 자료 유형 선택 */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="filter-category" className="text-[#8b9ab7] font-extrabold">
              유형
            </label>
            <select
              id="filter-category"
              value={filter.category || '전체'}
              onChange={handleCategoryChange}
              className="bg-[#f8faff] border border-[#e2e8f4] text-[#30415e] text-xs font-extrabold rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-[#687fe0]/30 focus:border-[#687fe0] outline-none"
            >
              <option value="전체">전체 유형</option>
              {DOCUMENT_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* 학년 선택 */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="filter-grade" className="text-[#8b9ab7] font-extrabold">
              학년
            </label>
            <select
              id="filter-grade"
              value={filter.grade || '전체'}
              onChange={handleGradeChange}
              className="bg-[#f8faff] border border-[#e2e8f4] text-[#30415e] text-xs font-extrabold rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-[#687fe0]/30 focus:border-[#687fe0] outline-none"
            >
              {GRADE_OPTIONS.map(g => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* 교과 선택 */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="filter-subject" className="text-[#8b9ab7] font-extrabold">
              교과
            </label>
            <select
              id="filter-subject"
              value={filter.subject || '전체'}
              onChange={handleSubjectChange}
              className="bg-[#f8faff] border border-[#e2e8f4] text-[#30415e] text-xs font-extrabold rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-[#687fe0]/30 focus:border-[#687fe0] outline-none"
            >
              {SUBJECT_OPTIONS.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isFiltered && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 text-[#687fe0] hover:text-[#566ecf] font-extrabold text-xs transition-colors ml-auto bg-[#eaf0ff] px-2.5 py-1 rounded-lg"
          >
            <RotateCcw className="w-3 h-3" />
            <span>필터 초기화 ↺</span>
          </button>
        )}
      </div>
    </div>
  );
};
