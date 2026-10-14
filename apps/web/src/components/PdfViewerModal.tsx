import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ExternalLink,
  Download,
  FileText,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Layers,
  Copy,
  Check,
  Loader2
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// PDF.js 워커 세팅
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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
  const [totalPages, setTotalPages] = useState(1);
  const [scale, setScale] = useState(1.3);
  const [viewTab, setViewTab] = useState<'canvas' | 'text'>('canvas');
  const [loadingPdf, setLoadingPdf] = useState(true);
  const [renderError, setRenderError] = useState<string | null>(null);

  const [chunks, setChunks] = useState<ChunkItem[]>([]);
  const [loadingChunks, setLoadingChunks] = useState(false);
  const [copied, setCopied] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocRef = useRef<any>(null);
  const renderTaskRef = useRef<any>(null);

  useEffect(() => {
    setCurrentPage(initialPageNumber || 1);
  }, [initialPageNumber]);

  // 1. PDF 문서 바이너리 로드
  useEffect(() => {
    if (!isOpen || !docId) {
      pdfDocRef.current = null;
      return;
    }

    let isMounted = true;
    setLoadingPdf(true);
    setRenderError(null);

    const fileUrl = `/chatbot/api/documents/${docId}/file`;

    const loadingTask = pdfjsLib.getDocument({
      url: fileUrl,
      cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
      cMapPacked: true
    });

    loadingTask.promise
      .then(pdf => {
        if (!isMounted) return;
        pdfDocRef.current = pdf;
        setTotalPages(pdf.numPages);
        setLoadingPdf(false);
      })
      .catch(err => {
        console.error('Failed to load PDF via pdfjs:', err);
        if (isMounted) {
          setRenderError('PDF 문서를 웹 뷰어로 불러오는 중 오류가 발생했습니다.');
          setLoadingPdf(false);
        }
      });

    return () => {
      isMounted = false;
      try {
        loadingTask.destroy();
      } catch {}
    };
  }, [isOpen, docId]);

  // 2. 현재 페이지를 HTML5 Canvas에 직접 렌더링 (다운로드 없이 웹 화면에 즉시 표시)
  useEffect(() => {
    if (!pdfDocRef.current || viewTab !== 'canvas' || !canvasRef.current) return;

    let isMounted = true;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 이전 렌더링 작업이 진행 중이면 취소
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
      renderTaskRef.current = null;
    }

    pdfDocRef.current
      .getPage(currentPage)
      .then((page: any) => {
        if (!isMounted) return;

        const viewport = page.getViewport({ scale });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;

        return renderTask.promise;
      })
      .catch((err: any) => {
        if (err?.name !== 'RenderingCancelledException') {
          console.warn('Canvas render error:', err);
        }
      });

    return () => {
      isMounted = false;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [currentPage, scale, viewTab, loadingPdf]);

  // 3. 해당 문서의 전체 페이지 텍스트 청크 가져오기 (D1 데이터)
  useEffect(() => {
    if (!isOpen || !docId) return;

    let isMounted = true;
    setLoadingChunks(true);

    fetch(`/chatbot/api/documents/${docId}`)
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

  const fileUrl = `/chatbot/api/documents/${docId}/file`;
  const pageChunks = chunks.filter(c => c.page_number === currentPage);

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-[26px] shadow-[0_12px_40px_rgba(108,128,218,0.2)] border border-[#e8edf6] w-full max-w-5xl h-[94vh] flex flex-col overflow-hidden">
        {/* 모달 상단 헤더 */}
        <div className="px-4 sm:px-6 py-3.5 bg-[#f8faff] border-b border-[#e8edf6] flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 pr-4">
            <div className="w-10 h-10 rounded-2xl bg-[#e2eaff] text-[#687fe0] flex items-center justify-center flex-shrink-0 shadow-sm border border-[#cbd9fc]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="truncate">
              <h3 className="text-sm sm:text-base font-black text-[#30415e] truncate">{title}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-[#687fe0] font-bold bg-[#eaf2ff] px-2.5 py-0.5 rounded-full border border-[#d2e3fc]">
                  현재 열람: {currentPage}쪽
                </span>
                <span className="text-[11px] text-[#8b9ab7] font-medium">
                  (전체 {totalPages}페이지)
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* 탭 전환 (웹 캔버스 뷰어 vs 원문 텍스트) */}
            <div className="bg-[#eaf0fa] p-1 rounded-full flex items-center text-xs font-bold mr-1">
              <button
                type="button"
                onClick={() => setViewTab('canvas')}
                className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 ${
                  viewTab === 'canvas'
                    ? 'bg-[#687fe0] text-white shadow-sm'
                    : 'text-[#697b98] hover:text-[#30415e]'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">웹 PDF 뷰어</span>
              </button>
              <button
                type="button"
                onClick={() => setViewTab('text')}
                className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 ${
                  viewTab === 'text'
                    ? 'bg-[#687fe0] text-white shadow-sm'
                    : 'text-[#697b98] hover:text-[#30415e]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">원문 텍스트</span>
              </button>
            </div>

            {/* 새 창 열기 */}
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
              title="새 창에서 원본 보기"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* 다운로드 */}
            <a
              href={fileUrl}
              download={`${title}.pdf`}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
              title="PDF 파일 다운로드"
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

        {/* 인터랙티브 툴바: 페이지 넘김 및 확대/축소 컨트롤 */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center justify-between text-xs text-slate-700">
          {/* 페이지 이동 컨트롤 */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="p-1.5 rounded-md bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all flex items-center gap-1 font-medium"
              title="이전 페이지"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">이전 쪽</span>
            </button>

            <span className="font-bold text-slate-800 px-3 bg-white py-1 rounded-md border border-slate-300 shadow-sm">
              {currentPage} / {totalPages} 쪽
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="p-1.5 rounded-md bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all flex items-center gap-1 font-medium"
              title="다음 페이지"
            >
              <span className="hidden sm:inline">다음 쪽</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 줌 배율 조절 (캔버스 뷰어 모드일 때만 활성화) */}
          {viewTab === 'canvas' && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setScale(prev => Math.max(0.7, prev - 0.2))}
                className="p-1.5 rounded-md bg-white border border-slate-300 hover:bg-slate-50 shadow-sm transition-all"
                title="축소"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-semibold text-slate-600 px-1.5 min-w-[3rem] text-center">
                {Math.round(scale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setScale(prev => Math.min(2.5, prev + 0.2))}
                className="p-1.5 rounded-md bg-white border border-slate-300 hover:bg-slate-50 shadow-sm transition-all"
                title="확대"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setScale(1.3)}
                className="p-1.5 rounded-md bg-white border border-slate-300 hover:bg-slate-50 shadow-sm transition-all hidden sm:block"
                title="기본 크기"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* 뷰어 메인 영역 */}
        <div className="flex-1 bg-slate-800 relative overflow-auto flex items-start justify-center p-4">
          {viewTab === 'canvas' ? (
            <div className="flex flex-col items-center justify-center min-h-full">
              {loadingPdf && (
                <div className="py-20 flex flex-col items-center gap-3 text-white">
                  <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
                  <p className="text-sm font-medium">웹 화면에 PDF를 불러오는 중입니다...</p>
                </div>
              )}

              {renderError && (
                <div className="py-16 text-center text-white space-y-3">
                  <p className="text-rose-400 font-semibold">{renderError}</p>
                  <button
                    type="button"
                    onClick={() => setViewTab('text')}
                    className="px-4 py-2 rounded-lg bg-brand-600 text-white text-xs font-semibold"
                  >
                    원문 텍스트 탭으로 전환하기
                  </button>
                </div>
              )}

              {/* 브라우저 상에 직접 그려지는 HTML5 캔버스 (다운로드 불필요) */}
              <canvas
                ref={canvasRef}
                className={`bg-white shadow-2xl rounded-sm transition-opacity duration-200 ${
                  loadingPdf ? 'opacity-0' : 'opacity-100'
                }`}
                style={{ maxWidth: '100%' }}
              />
            </div>
          ) : (
            <div className="w-full h-full bg-white rounded-xl p-5 sm:p-7 overflow-y-auto">
              <div className="max-w-3xl mx-auto space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <span className="font-bold text-sm text-slate-800">
                    📖 {currentPage}쪽 등록 원문 텍스트
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
                    <p>해당 페이지({currentPage}쪽)의 텍스트가 아직 등록되지 않았습니다.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 하단 상태바 */}
        <div className="px-5 py-2.5 bg-white border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            💡 브라우저 화면에서 바로 고화질로 열람되며, <strong>[이전 쪽 / 다음 쪽]</strong> 또는 <strong>[확대 / 축소]</strong>를 사용하실 수 있습니다.
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
