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
    <div className="bg-white border-b border-slate-200 px-4 py-3 sm:px-6 shadow-sm transition-all animate-fadeIn">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold text-slate-700">검색 범위 설정:</span>

          {/* 자료 유형 선택 */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="filter-category" className="text-slate-500">
              유형:
            </label>
            <select
              id="filter-category"
              value={filter.category || '전체'}
              onChange={handleCategoryChange}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
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
            <label htmlFor="filter-grade" className="text-slate-500">
              학년:
            </label>
            <select
              id="filter-grade"
              value={filter.grade || '전체'}
              onChange={handleGradeChange}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
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
            <label htmlFor="filter-subject" className="text-slate-500">
              교과:
            </label>
            <select
              id="filter-subject"
              value={filter.subject || '전체'}
              onChange={handleSubjectChange}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
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
            className="flex items-center gap-1 text-slate-500 hover:text-rose-600 text-xs transition-colors ml-auto"
          >
            <RotateCcw className="w-3 h-3" />
            <span>필터 초기화</span>
          </button>
        )}
      </div>
    </div>
  );
};
