import React from 'react';
import { X, ExternalLink, Download, FileText, ChevronLeft, ChevronRight } from 'lucide-react';

interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  docId: string | null;
  pageNumber: number;
  title: string;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  isOpen,
  onClose,
  docId,
  pageNumber,
  title
}) => {
  if (!isOpen || !docId) return null;

  const fileUrl = `/api/chatbot/documents/${docId}/file`;
  const viewerUrl = `${fileUrl}#page=${pageNumber}&view=FitH`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
        {/* 모달 상단 바 */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0 pr-4">
            <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="truncate">
              <h3 className="text-sm font-bold text-slate-800 truncate">{title}</h3>
              <p className="text-xs text-brand-700 font-semibold">
                지정된 참고 페이지: {pageNumber}쪽
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* 새 창에서 열기 (Future School 연계 지원) */}
            <a
              href={viewerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
              title="새 창에서 원본 PDF 전체보기"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* 다운로드 */}
            <a
              href={fileUrl}
              download={`${title}.pdf`}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
              title="PDF 다운로드"
            >
              <Download className="w-4 h-4" />
            </a>

            {/* 닫기 */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors ml-1"
              title="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF 뷰어 프레임 (브라우저 내장 최적화 뷰어 사용, 모바일 및 PC 대응) */}
        <div className="flex-1 bg-slate-200 relative">
          <iframe
            src={viewerUrl}
            title={title}
            className="w-full h-full border-0"
          />
        </div>

        {/* 하단 툴바 안내 */}
        <div className="px-5 py-2.5 bg-white border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span>
            💡 PDF 뷰어에서 <strong>{pageNumber}쪽</strong>으로 바로 이동하지 않는 경우, 뷰어 상단에서 페이지 번호를 직접 입력하실 수 있습니다.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
