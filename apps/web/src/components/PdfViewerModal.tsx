import React, { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  Download,
  FileText,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Layers,
  Copy,
  Check
} from 'lucide-react';

interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  docId: string | null;
  pageNumber: number;
  title: string;
}

interface ChunkItem {
  page_number: number;
  chunk_index: number;
  content: string;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  isOpen,
  onClose,
  docId,
  pageNumber: initialPageNumber,
  title
}) => {
  const [currentPage, setCurrentPage] = useState(initialPageNumber || 1);
  const [viewTab, setViewTab] = useState<'pdf' | 'text'>('pdf');
  const [chunks, setChunks] = useState<ChunkItem[]>([]);
  const [loadingChunks, setLoadingChunks] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCurrentPage(initialPageNumber || 1);
  }, [initialPageNumber]);

  // 해당 문서의 전체 페이지 텍스트 청크 가져오기
  useEffect(() => {
    if (!isOpen || !docId) return;

    let isMounted = true;
    setLoadingChunks(true);

    fetch(`/api/chatbot/documents/${docId}`)
      .then(res => res.json())
      .then(data => {
        if (isMounted && data.chunks) {
          setChunks(data.chunks);
        }
      })
      .catch(err => {
        console.warn('Failed to fetch document chunks:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingChunks(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, docId]);

  if (!isOpen || !docId) return null;

  const fileUrl = `/api/chatbot/documents/${docId}/file`;
  const viewerUrl = `${fileUrl}#page=${currentPage}&view=FitH`;

  // 현재 선택된 페이지의 청크들 필터링
  const pageChunks = chunks.filter(c => c.page_number === currentPage);
  const maxPage = chunks.length > 0 ? Math.max(...chunks.map(c => c.page_number)) : 5;

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden">
        {/* 모달 상단 헤더 */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 pr-4">
            <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center flex-shrink-0 shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div className="truncate">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">{title}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-brand-700 font-semibold bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                  참고 페이지: {currentPage}쪽
                </span>
                <span className="text-[11px] text-slate-400">
                  (전체 {maxPage}쪽 중)
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* 탭 전환 (PDF 뷰어 vs 원문 텍스트) */}
            <div className="bg-slate-200/80 p-0.5 rounded-lg flex items-center text-xs font-semibold mr-1">
              <button
                type="button"
                onClick={() => setViewTab('pdf')}
                className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                  viewTab === 'pdf'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">PDF 원본</span>
              </button>
              <button
                type="button"
                onClick={() => setViewTab('text')}
                className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                  viewTab === 'text'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">원문 텍스트</span>
              </button>
            </div>

            {/* 새 창 열기 */}
            <a
              href={viewerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
              title="새 창에서 원본 PDF 보기"
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

        {/* 페이지 넘김 툴바 */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="p-1 rounded hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
              title="이전 페이지"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold px-2">
              {currentPage} / {maxPage} 쪽
            </span>
            <button
              type="button"
              disabled={currentPage >= maxPage}
              onClick={() => setCurrentPage(prev => Math.min(maxPage, prev + 1))}
              className="p-1 rounded hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
              title="다음 페이지"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="text-[11px] text-slate-500 hidden sm:block">
            {viewTab === 'pdf'
              ? 'PDF 뷰어가 표시되지 않을 경우 상단의 [원문 텍스트] 탭을 눌러 본문을 확인하세요.'
              : 'D1 데이터베이스에 색인된 해당 페이지의 한글 원문 텍스트입니다.'}
          </div>
        </div>

        {/* 모달 본문 구역 */}
        <div className="flex-1 bg-slate-200 relative overflow-hidden flex flex-col">
          {viewTab === 'pdf' ? (
            <iframe
              key={viewerUrl}
              src={viewerUrl}
              title={title}
              className="w-full h-full border-0 bg-white"
            />
          ) : (
            <div className="flex-1 bg-white p-5 sm:p-7 overflow-y-auto">
              <div className="max-w-3xl mx-auto space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <span className="font-bold text-sm text-slate-800">
                    📖 {currentPage}쪽 등록 원문 내용
                  </span>
                  {pageChunks.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleCopyText(pageChunks.map(c => c.content).join('\n\n'))}
                      className="text-xs text-brand-700 hover:text-brand-900 font-semibold flex items-center gap-1 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>복사됨!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>본문 전체 복사</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {loadingChunks ? (
                  <div className="py-12 text-center text-slate-400 text-sm">
                    본문 텍스트를 불러오는 중입니다...
                  </div>
                ) : pageChunks.length > 0 ? (
                  pageChunks.map((chunk, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-sans"
                    >
                      {chunk.content}
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-slate-400 text-sm space-y-2">
                    <p>해당 페이지({currentPage}쪽)의 텍스트 청크가 아직 등록되지 않았습니다.</p>
                    <p className="text-xs text-slate-400">
                      관리자 화면(/chatbot/admin)을 통해 PDF를 업로드하시면 모든 페이지의 텍스트가 자동 추출되어 색인됩니다.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 하단 닫기 바 */}
        <div className="px-5 py-2.5 bg-white border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span className="text-[11px]">
            💡 관리자 화면에서 공식 PDF를 직접 업로드하시면 원본 인쇄본 PDF로 자동 교체됩니다.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
