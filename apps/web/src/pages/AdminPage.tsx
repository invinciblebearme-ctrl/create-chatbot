import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Document,
  DocumentCategory,
  DOCUMENT_CATEGORIES,
  GRADE_OPTIONS,
  SUBJECT_OPTIONS,
  AdminStats,
  splitTextIntoChunks
} from '@create-chatbot/shared';
import {
  adminFetchDocuments,
  adminUploadDocument,
  adminDeleteDocument,
  adminReindexDocument,
  adminFetchStats,
  adminTestSearch
} from '../api';
import {
  UploadCloud,
  FileText,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ShieldCheck,
  Eye,
  Sliders,
  Database,
  Cpu,
  Lock,
  KeyRound,
  LogOut,
  Sparkles,
  Clock,
  BarChart3,
  AlertCircle
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { PdfViewerModal } from '../components/PdfViewerModal';

// PDF.js 워커 세팅
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export const AdminPage: React.FC = () => {
  // 관리자 비밀번호 PIN 인증 상태 (기본값: 7703)
  const [adminPin, setAdminPin] = useState<string>(() => sessionStorage.getItem('admin_pin') || '');
  const [inputPin, setInputPin] = useState('');
  const [pinError, setPinError] = useState('');
  const isUnlocked = adminPin === '7703';

  const [activeTab, setActiveTab] = useState<'upload' | 'documents' | 'test'>('upload');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 업로드 폼 상태
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('CREATE 모형 안내');
  const [grade, setGrade] = useState('공통');
  const [subject, setSubject] = useState('융합/통합');
  const [tags, setTags] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [manualText, setManualText] = useState('');
  const [useManualText, setUseManualText] = useState(false);

  // 추출 진행 상태
  const [extractionProgress, setExtractionProgress] = useState<{
    status: string;
    progress: number;
  } | null>(null);

  // 테스트 검색 상태
  const [testQuery, setTestQuery] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);

  // PDF 뷰어 모달
  const [viewerModal, setViewerModal] = useState<{
    isOpen: boolean;
    docId: string | null;
    pageNumber: number;
    title: string;
  }>({
    isOpen: false,
    docId: null,
    pageNumber: 1,
    title: ''
  });

  const loadData = async () => {
    try {
      const [fetchedStats, fetchedDocs] = await Promise.all([
        adminFetchStats().catch(() => null),
        adminFetchDocuments().catch(() => [])
      ]);
      if (fetchedStats) setStats(fetchedStats);
      setDocuments(fetchedDocs);
    } catch (err: any) {
      console.warn('Failed to load admin initial data:', err);
    }
  };

  useEffect(() => {
    if (isUnlocked) {
      loadData();
    }
  }, [isUnlocked]);

  const handlePinSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (inputPin.trim() === '7703') {
      sessionStorage.setItem('admin_pin', '7703');
      setAdminPin('7703');
      setPinError('');
    } else {
      setPinError('비밀번호가 일치하지 않습니다. (비밀번호: 7703)');
      setInputPin('');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_pin');
    setAdminPin('');
    setInputPin('');
    setPinError('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.type !== 'application/pdf' && !selected.name.endsWith('.pdf')) {
        alert('PDF 형식의 파일만 업로드할 수 있습니다.');
        return;
      }
      setFile(selected);
      if (!title) {
        setTitle(selected.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  // 브라우저 측 PDF.js 텍스트 추출 및 청크 분할
  const extractPdfTextAndChunks = async (
    pdfFile: File
  ): Promise<{ pageCount: number; chunks: Array<{ page_number: number; chunk_index: number; content: string }> }> => {
    setExtractionProgress({ status: 'PDF 파일 로딩 중...', progress: 10 });
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;

    const allChunks: Array<{ page_number: number; chunk_index: number; content: string }> = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      setExtractionProgress({
        status: `${pageNum} / ${numPages} 페이지 텍스트 추출 중...`,
        progress: Math.round(10 + (pageNum / numPages) * 75)
      });

      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
        .trim();

      if (pageText) {
        const pageChunks = splitTextIntoChunks(pageText, 600, 100);
        pageChunks.forEach((chunkContent, idx) => {
          allChunks.push({
            page_number: pageNum,
            chunk_index: idx,
            content: chunkContent
          });
        });
      }
    }

    setExtractionProgress({ status: '청크 분할 완료 및 서버 업로드 준비', progress: 90 });
    return { pageCount: numPages, chunks: allChunks };
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file && !useManualText) {
      alert('PDF 파일을 선택하거나 수동 텍스트를 입력해 주세요.');
      return;
    }
    if (!title.trim()) {
      alert('자료 제목을 입력해 주세요.');
      return;
    }

    setLoading(true);
    setNotice(null);

    try {
      let pageCount = 1;
      let chunks: Array<{ page_number: number; chunk_index: number; content: string }> = [];

      if (file && !useManualText) {
        const extraction = await extractPdfTextAndChunks(file);
        pageCount = extraction.pageCount;
        chunks = extraction.chunks;

        if (chunks.length === 0) {
          const proceed = window.confirm(
            '선택한 PDF에서 텍스트가 감지되지 않았습니다. (스캔된 이미지 PDF일 수 있습니다)\n' +
            '수동 텍스트 탭을 통해 텍스트를 직접 입력하거나 그대로 등록하시겠습니까?'
          );
          if (!proceed) {
            setLoading(false);
            setExtractionProgress(null);
            return;
          }
        }
      } else if (useManualText && manualText.trim()) {
        const textChunks = splitTextIntoChunks(manualText, 600, 100);
        chunks = textChunks.map((content, idx) => ({
          page_number: 1,
          chunk_index: idx,
          content
        }));
      }

      setExtractionProgress({ status: '서버 D1 및 R2에 동기화 중...', progress: 95 });

      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('category', category);
      formData.append('grade', grade);
      formData.append('subject', subject);
      formData.append('is_public', isPublic ? '1' : '0');
      formData.append('page_count', pageCount.toString());
      formData.append(
        'tags',
        JSON.stringify(
          tags
            .split(',')
            .map(t => t.trim())
            .filter(Boolean)
        )
      );
      formData.append('chunks', JSON.stringify(chunks));

      if (file) {
        formData.append('file', file);
      }

      await adminUploadDocument(formData);

      setNotice({
        type: 'success',
        message: `자료가 성공적으로 등록되었습니다. (총 ${chunks.length}개 검색 청크 색인 완료)`
      });

      // 폼 초기화
      setFile(null);
      setTitle('');
      setDescription('');
      setTags('');
      setManualText('');
      setUseManualText(false);
      setExtractionProgress(null);

      // 데이터 리로드
      await loadData();
      setActiveTab('documents');
    } catch (err: any) {
      console.error('Upload failed:', err);
      setNotice({
        type: 'error',
        message: err.message || '자료 등록 중 오류가 발생했습니다.'
      });
    } finally {
      setLoading(false);
      setExtractionProgress(null);
    }
  };

  const handleDelete = async (docId: string, docTitle: string) => {
    if (!window.confirm(`정말 "${docTitle}" 자료를 삭제하시겠습니까?\n관련된 모든 검색 색인도 함께 삭제됩니다.`)) {
      return;
    }

    try {
      await adminDeleteDocument(docId);
      setNotice({ type: 'success', message: '문서가 정상적으로 삭제되었습니다.' });
      loadData();
    } catch (err: any) {
      alert(err.message || '삭제 실패');
    }
  };

  const handleReindex = async (docId: string) => {
    try {
      await adminReindexDocument(docId);
      alert('재색인이 완료되었습니다.');
      loadData();
    } catch (err: any) {
      alert(err.message || '재색인 실패');
    }
  };

  const handleRunTestSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testQuery.trim()) return;

    setTestLoading(true);
    try {
      const res = await adminTestSearch(testQuery.trim());
      setTestResult(res);
    } catch (err: any) {
      alert(err.message || '테스트 검색 실패');
    } finally {
      setTestLoading(false);
    }
  };

  // 관리자 비밀번호 미인증 시 잠금 화면 렌더링
  if (!isUnlocked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        {/* 상단 장식 별 */}
        <div className="text-center mb-5 text-[13px] tracking-[16px] text-[#c5d4fa] select-none font-serif pl-4">
          ✦　✧　✦　✧　✦
        </div>

        <div className="max-w-md w-full bg-white rounded-[26px] shadow-[0_12px_36px_rgba(108,128,218,0.12)] border border-[#e8edf6] p-7 sm:p-9 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-2xl bg-[#e2eaff] border border-[#cbd9fc] flex items-center justify-center mx-auto mb-4 text-[#687fe0] shadow-sm">
            <span className="text-2xl font-black">✳</span>
          </div>

          <h2 className="text-xl font-black text-[#30415e] tracking-tight">
            CREATE 관리자 보안 인증
          </h2>
          <p className="text-xs text-[#697b98] mt-2 mb-6 leading-relaxed">
            연구학교 공식 자료 등록, D1 색인 및 AI 무료 사용량 모니터링을 위해 관리자 비밀번호를 입력해 주세요.
          </p>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                maxLength={8}
                value={inputPin}
                onChange={e => {
                  setInputPin(e.target.value);
                  if (pinError) setPinError('');
                }}
                autoFocus
                placeholder="비밀번호 입력 (7703)"
                className="w-full text-center text-2xl tracking-[0.35em] font-mono py-3.5 px-4 rounded-2xl border-2 border-[#e2eaff] focus:border-[#687fe0] focus:ring-4 focus:ring-[#e2eaff]/50 outline-none transition-all placeholder:text-[#8b9ab7] placeholder:tracking-normal placeholder:font-sans placeholder:text-sm text-[#30415e] bg-[#f8faff]"
              />
            </div>

            {pinError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-center gap-1.5 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{pinError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-[#687fe0] hover:bg-[#566ecf] active:scale-[0.99] text-white font-bold text-sm shadow-[0_7px_16px_rgba(108,128,218,0.27)] transition-all flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>관리자 대시보드 입장</span>
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#e8edf6] flex items-center justify-between text-xs text-[#697b98]">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-[#697b98] hover:text-[#687fe0] font-semibold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              챗봇 홈으로 이동
            </Link>
            <span className="text-[11px] text-[#687fe0] bg-[#eaf2ff] border border-[#d2e3fc] px-2.5 py-1 rounded-full font-mono font-semibold">
              PIN: 7703
            </span>
          </div>
        </div>
      </div>
    );
  }

  const aiToday = stats?.ai_requests_today ?? 0;
  const aiLimit = stats?.ai_limit_daily ?? 250;
  const aiRemaining = Math.max(0, aiLimit - aiToday);
  const aiUsagePercent = Math.min(100, (aiToday / aiLimit) * 100);

  return (
    <div className="min-h-screen flex flex-col">
      {/* 상단 장식 별 */}
      <div className="w-full text-center py-1 text-[11px] tracking-[14px] text-[#c5d4fa] select-none font-serif bg-white/70 border-b border-[#eef3fb]">
        ✦　✧　✦　✧　✦
      </div>

      {/* 관리자 탑 헤더 */}
      <header className="bg-white/95 backdrop-blur-md border-b border-[#e8edf6] sticky top-0 z-30 shadow-[0_2px_12px_rgba(108,128,218,0.06)]">
        <div className="max-w-[1160px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="p-2 rounded-xl bg-[#f8faff] hover:bg-[#eaf2ff] text-[#697b98] hover:text-[#687fe0] border border-[#e8edf6] transition-colors"
              title="챗봇 화면으로 돌아가기"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#e2eaff] border border-[#cbd9fc] flex items-center justify-center text-[#687fe0] font-black text-lg shadow-sm">
                ✳
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-base text-[#30415e] tracking-tight">CREATE 관리자 대시보드</span>
                  <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-[#e6f8ef] text-[#1c7d54] border border-[#c6ebd6] font-semibold">
                    <ShieldCheck className="w-3 h-3" />
                    PIN: 7703 인증됨
                  </span>
                </div>
                <p className="text-xs text-[#697b98]">PDF 공식 자료 등록 · D1 색인 · AI 무료 사용량 모니터링</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadData}
              className="px-3 py-1.5 rounded-xl bg-[#f8faff] hover:bg-[#eaf2ff] text-[#697b98] hover:text-[#687fe0] border border-[#e8edf6] transition-colors text-xs font-semibold flex items-center gap-1.5"
              title="새로고침"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">새로고침</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl bg-[#fff0f4] hover:bg-[#ffe3eb] text-[#e05675] border border-[#ffd2df] transition-colors text-xs font-semibold flex items-center gap-1.5"
              title="관리자 화면 잠금 (로그아웃)"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">잠금</span>
            </button>
          </div>
        </div>
      </header>

      {/* 대시보드 메트릭 카드 */}
      <div className="max-w-[1160px] mx-auto px-4 sm:px-6 pt-6 w-full space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="bg-white rounded-[22px] p-4 border border-[#e8edf6] shadow-[0_5px_22px_rgba(164,176,202,0.12)]">
            <div className="flex items-center justify-between text-[#697b98] mb-1">
              <span className="text-xs font-bold text-[#34476a]">전체 등록 문서</span>
              <div className="w-7 h-7 rounded-lg bg-[#eaf2ff] text-[#687fe0] flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-[#30415e]">
              {stats?.total_documents ?? documents.length}
            </p>
            <span className="text-[11px] text-[#8b9ab7] font-medium">
              공개: {stats?.public_documents ?? documents.filter(d => d.is_public).length}건
            </span>
          </div>

          <div className="bg-white rounded-[22px] p-4 border border-[#e8edf6] shadow-[0_5px_22px_rgba(164,176,202,0.12)]">
            <div className="flex items-center justify-between text-[#697b98] mb-1">
              <span className="text-xs font-bold text-[#34476a]">D1 색인 완료</span>
              <div className="w-7 h-7 rounded-lg bg-[#e6f8ef] text-[#1c7d54] flex items-center justify-center">
                <Database className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-[#1c7d54]">
              {stats?.indexed_documents ?? documents.filter(d => d.status === 'COMPLETED').length}
            </p>
            <span className="text-[11px] text-[#8b9ab7] font-medium">실시간 검색 가동 중</span>
          </div>

          <div className="bg-white rounded-[22px] p-4 border border-[#e8edf6] shadow-[0_5px_22px_rgba(164,176,202,0.12)]">
            <div className="flex items-center justify-between text-[#697b98] mb-1">
              <span className="text-xs font-bold text-[#34476a]">오늘 AI 요청</span>
              <div className="w-7 h-7 rounded-lg bg-[#f1ecff] text-[#7c5ce5] flex items-center justify-center">
                <Cpu className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-[#7c5ce5]">
              {aiToday}
              <span className="text-xs font-normal text-[#8b9ab7] ml-1">/ {aiLimit}회</span>
            </p>
            <span className="text-[11px] text-[#8b9ab7] font-medium">일일 무료 보호 한도</span>
          </div>

          <div className="bg-white rounded-[22px] p-4 border border-[#e8edf6] shadow-[0_5px_22px_rgba(164,176,202,0.12)]">
            <div className="flex items-center justify-between text-[#697b98] mb-1">
              <span className="text-xs font-bold text-[#34476a]">남은 무료 쿼터</span>
              <div className="w-7 h-7 rounded-lg bg-[#fff0e3] text-[#e07f38] flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-[#e07f38]">
              {aiRemaining}
              <span className="text-xs font-normal text-[#8b9ab7] ml-1">회</span>
            </p>
            <span className="text-[11px] text-[#1c7d54] font-bold">100% 무료 보장</span>
          </div>
        </div>

        {/* Cloudflare Workers AI 무료 사용량 및 쿼터 모니터링 패널 */}
        <div className="bg-white rounded-[22px] border border-[#e8edf6] shadow-[0_5px_22px_rgba(164,176,202,0.12)] p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#e8edf6]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#eaf2ff] border border-[#d2e3fc] flex items-center justify-center text-[#687fe0] shrink-0 font-bold">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-[#30415e] flex items-center gap-2">
                  Cloudflare Workers AI 무료 사용량 및 쿼터 모니터링
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#e6f8ef] text-[#1c7d54] font-bold border border-[#c6ebd6]">
                    비용: 0원 (무료 티어)
                  </span>
                </h4>
                <p className="text-xs text-[#697b98]">
                  매일 250회의 무료 AI 생성 요청이 제공되며, 매일 밤 자정(KST 00:00)에 0회로 자동 초기화됩니다.
                </p>
              </div>
            </div>
            <div className="text-xs font-bold text-[#34476a] self-start sm:self-center bg-[#f8faff] px-3 py-1.5 rounded-xl border border-[#e8edf6] shrink-0">
              오늘 사용률: <span className="text-[#687fe0] font-black">{aiUsagePercent.toFixed(1)}%</span> ({aiToday}/{aiLimit}회)
            </div>
          </div>

          {/* 게이지 바 */}
          <div className="mt-4">
            <div className="w-full bg-[#eaf0fa] rounded-full h-3.5 overflow-hidden p-0.5 border border-[#e0e8f5]">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  aiToday > 200
                    ? 'bg-rose-500'
                    : aiToday > 150
                    ? 'bg-amber-500'
                    : 'bg-[#687fe0]'
                }`}
                style={{
                  width: `${Math.min(100, Math.max(aiToday > 0 ? 3 : 0, aiUsagePercent))}%`
                }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] text-[#8b9ab7] mt-1.5 px-0.5 font-medium">
              <span>0회 (시작)</span>
              <span>125회 (50%)</span>
              <span>250회 (일일 한도)</span>
            </div>
          </div>

          {/* 안내 그리드 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-3 border-t border-[#e8edf6] text-xs">
            <div className="p-3.5 rounded-[18px] bg-[#f8faff] border border-[#e8edf6]">
              <div className="font-bold text-[#30415e] flex items-center gap-1.5 mb-1">
                <Cpu className="w-3.5 h-3.5 text-[#687fe0]" />
                탑재된 AI 모델
              </div>
              <p className="font-mono text-[11px] text-[#34476a] truncate" title="@cf/meta/llama-3.3-70b-instruct-fp8-fast">
                @cf/meta/llama-3.3-70b-instruct-fp8-fast
              </p>
              <p className="text-[11px] text-[#8b9ab7] mt-0.5 font-medium">Llama 3.3 70B (공식 한국어 고품질 무료 모델)</p>
            </div>

            <div className="p-3.5 rounded-[18px] bg-[#e6f8ef]/60 border border-[#c6ebd6]">
              <div className="font-bold text-[#1c7d54] flex items-center gap-1.5 mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#1c7d54]" />
                과금 방지 안전장치
              </div>
              <p className="text-[11px] text-[#1c7d54] leading-snug font-medium">
                250회 한도 도달 시 자동 고속 D1 검색 모드로 전환되어 <strong className="font-bold underline">추가 요금 0원</strong>을 철저히 보장합니다.
              </p>
            </div>

            <div className="p-3.5 rounded-[18px] bg-[#eaf2ff]/60 border border-[#d2e3fc]">
              <div className="font-bold text-[#687fe0] flex items-center gap-1.5 mb-1">
                <Clock className="w-3.5 h-3.5 text-[#687fe0]" />
                D1 자료 검색 한도
              </div>
              <p className="text-[11px] text-[#34476a] leading-snug font-medium">
                PDF 색인 자료 검색과 원문 조증 확인은 AI 쿼터와 무관하게 <strong className="font-bold text-[#687fe0]">무제한 무료</strong>로 작동합니다.
              </p>
            </div>
          </div>
        </div>

        {/* 안내 알림 배너 */}
        {notice && (
          <div
            className={`mt-4 p-3.5 rounded-2xl border flex items-center justify-between text-xs sm:text-sm font-medium ${
              notice.type === 'success'
                ? 'bg-[#e6f8ef] border-[#c6ebd6] text-[#1c7d54]'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <span>{notice.message}</span>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="font-bold px-2 py-0.5 text-lg leading-none"
            >
              ×
            </button>
          </div>
        )}

        {/* 탭 네비게이션 */}
        <div className="flex flex-wrap items-center gap-2 mt-6">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-full transition-all flex items-center gap-1.5 ${
              activeTab === 'upload'
                ? 'bg-[#687fe0] text-white shadow-[0_4px_12px_rgba(108,128,218,0.25)]'
                : 'bg-white text-[#697b98] hover:text-[#30415e] border border-[#e8edf6]'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            PDF 자료 등록 및 색인
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('documents')}
            className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-full transition-all flex items-center gap-1.5 ${
              activeTab === 'documents'
                ? 'bg-[#687fe0] text-white shadow-[0_4px_12px_rgba(108,128,218,0.25)]'
                : 'bg-white text-[#697b98] hover:text-[#30415e] border border-[#e8edf6]'
            }`}
          >
            <FileText className="w-4 h-4" />
            등록된 공식 자료 목록 ({documents.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('test')}
            className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-full transition-all flex items-center gap-1.5 ${
              activeTab === 'test'
                ? 'bg-[#687fe0] text-white shadow-[0_4px_12px_rgba(108,128,218,0.25)]'
                : 'bg-white text-[#697b98] hover:text-[#30415e] border border-[#e8edf6]'
            }`}
          >
            <Sliders className="w-4 h-4" />
            검색 품질 점검 콘솔
          </button>
        </div>
      </div>

      {/* 탭 본문 컨텐츠 */}
      <div className="max-w-[1160px] mx-auto px-4 sm:px-6 py-6 w-full flex-1">
        {/* 탭 1: PDF 등록 */}
        {activeTab === 'upload' && (
          <div className="bg-white rounded-[24px] border border-[#e8edf6] shadow-[0_5px_22px_rgba(164,176,202,0.12)] p-5 sm:p-7">
            <h3 className="text-base font-black text-[#30415e] mb-1">
              신규 CREATE 공식 자료 등록
            </h3>
            <p className="text-xs text-[#697b98] mb-6">
              PDF를 업로드하면 브라우저 내에서 안전하게 텍스트를 추출하고, 페이지별 청크로 분할하여 Cloudflare D1에 색인합니다.
            </p>

            <form onSubmit={handleUploadSubmit} className="space-y-5">
              {/* 파일 선택 드래그 앤 드롭 */}
              {!useManualText ? (
                <div className="border-2 border-dashed border-[#cbd9fc] rounded-[20px] p-6 text-center hover:border-[#687fe0] hover:bg-[#eaf2ff]/30 transition-all cursor-pointer relative bg-[#f8faff]">
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="w-12 h-12 rounded-2xl bg-[#e2eaff] text-[#687fe0] flex items-center justify-center mx-auto mb-3 shadow-sm">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  {file ? (
                    <div>
                      <p className="text-sm font-bold text-[#30415e]">{file.name}</p>
                      <span className="text-xs text-[#697b98]">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB • PDF 파일 준비됨
                      </span>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-bold text-[#30415e]">
                        PDF 파일을 드래그하여 놓거나 클릭하여 선택하세요
                      </p>
                      <p className="text-xs text-[#8b9ab7] mt-1 font-medium">
                        최대 30MB • PDF 형식 전용 (실행 파일 차단)
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#34476a]">
                      수동 텍스트 직접 입력 (스캔된 PDF 대응)
                    </label>
                    <span className="text-[11px] text-[#e07f38] font-semibold">
                      * 스캔본 PDF는 텍스트를 복사하여 이곳에 붙여넣으세요.
                    </span>
                  </div>
                  <textarea
                    rows={6}
                    value={manualText}
                    onChange={e => setManualText(e.target.value)}
                    placeholder="문서의 내용을 이곳에 직접 입력하거나 붙여넣어 주세요..."
                    className="w-full text-xs p-3.5 rounded-2xl border border-[#e8edf6] outline-none focus:ring-2 focus:ring-[#687fe0] focus:border-[#687fe0] text-[#30415e] bg-[#f8faff]"
                  />
                </div>
              )}

              {/* 대체 텍스트 입력 모드 토글 */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setUseManualText(!useManualText)}
                  className="text-xs text-[#687fe0] font-bold hover:underline"
                >
                  {useManualText ? '← PDF 파일 업로드 모드로 전환' : '스캔 PDF를 위한 직접 텍스트 입력 모드 →'}
                </button>
              </div>

              {/* 진행률 바 */}
              {extractionProgress && (
                <div className="p-4 rounded-2xl bg-[#eaf2ff] border border-[#cbd9fc] space-y-2">
                  <div className="flex justify-between text-xs font-bold text-[#687fe0]">
                    <span>{extractionProgress.status}</span>
                    <span>{extractionProgress.progress}%</span>
                  </div>
                  <div className="w-full bg-[#d6e3fc] rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-[#687fe0] h-2.5 transition-all duration-300 rounded-full"
                      style={{ width: `${extractionProgress.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* 메타데이터 입력 그리드 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#34476a] mb-1.5">
                    자료 제목 *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="예: 5학년 CREATE 과학 단원설계안"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#e8edf6] bg-white outline-none focus:ring-2 focus:ring-[#687fe0] focus:border-[#687fe0] text-[#30415e]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#34476a] mb-1.5">
                    자료 유형 *
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as DocumentCategory)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#e8edf6] bg-white outline-none focus:ring-2 focus:ring-[#687fe0] focus:border-[#687fe0] text-[#30415e]"
                  >
                    {DOCUMENT_CATEGORIES.map(c => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#34476a] mb-1.5">
                    대상 학년
                  </label>
                  <select
                    value={grade}
                    onChange={e => setGrade(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#e8edf6] bg-white outline-none focus:ring-2 focus:ring-[#687fe0] focus:border-[#687fe0] text-[#30415e]"
                  >
                    {GRADE_OPTIONS.map(g => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#34476a] mb-1.5">
                    해당 교과
                  </label>
                  <select
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#e8edf6] bg-white outline-none focus:ring-2 focus:ring-[#687fe0] focus:border-[#687fe0] text-[#30415e]"
                  >
                    {SUBJECT_OPTIONS.map(s => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#34476a] mb-1.5">
                  태그 (쉼표로 구분)
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                  placeholder="예: CREATE모형, 5학년, 과학, 신재생에너지"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#e8edf6] bg-white outline-none focus:ring-2 focus:ring-[#687fe0] focus:border-[#687fe0] text-[#30415e]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#34476a] mb-1.5">
                  자료 설명
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="자료의 핵심 내용 요약..."
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#e8edf6] bg-white outline-none focus:ring-2 focus:ring-[#687fe0] focus:border-[#687fe0] text-[#30415e]"
                />
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#f8faff] border border-[#e8edf6]">
                <input
                  type="checkbox"
                  id="isPublicCheck"
                  checked={isPublic}
                  onChange={e => setIsPublic(e.target.checked)}
                  className="w-4 h-4 rounded text-[#687fe0] focus:ring-[#687fe0] border-[#cbd9fc]"
                />
                <label htmlFor="isPublicCheck" className="text-xs font-bold text-[#30415e] cursor-pointer">
                  일반 교사 및 방문자에게 검색 공개 (체크 해제 시 관리자만 열람 가능)
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3.5 rounded-xl font-bold text-sm text-white shadow-[0_7px_16px_rgba(108,128,218,0.27)] transition-all ${
                  loading
                    ? 'bg-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-[#687fe0] hover:bg-[#566ecf] active:scale-[0.99]'
                }`}
              >
                {loading ? '자료 처리 및 색인 등록 중...' : 'PDF 자료 등록 및 D1 색인 시작'}
              </button>
            </form>
          </div>
        )}

        {/* 탭 2: 등록된 자료 목록 */}
        {activeTab === 'documents' && (
          <div className="bg-white rounded-[24px] border border-[#e8edf6] shadow-[0_5px_22px_rgba(164,176,202,0.12)] overflow-hidden">
            <div className="p-5 border-b border-[#e8edf6] flex justify-between items-center bg-[#f8faff]/50">
              <h3 className="font-black text-sm text-[#30415e]">
                등록된 공식 자료 목록 ({documents.length}건)
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#34476a]">
                <thead className="bg-[#f8faff] text-[#30415e] font-bold border-b border-[#e8edf6]">
                  <tr>
                    <th className="px-5 py-3.5">자료명</th>
                    <th className="px-4 py-3.5">유형</th>
                    <th className="px-4 py-3.5">학년/교과</th>
                    <th className="px-4 py-3.5">쪽수</th>
                    <th className="px-4 py-3.5">상태</th>
                    <th className="px-4 py-3.5">공개</th>
                    <th className="px-5 py-3.5 text-right">작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e8edf6]">
                  {documents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-10 text-center text-[#8b9ab7] font-medium">
                        등록된 자료가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    documents.map(doc => (
                      <tr key={doc.id} className="hover:bg-[#f8faff] transition-colors">
                        <td className="px-5 py-3.5 font-bold text-[#30415e] max-w-xs truncate">
                          {doc.title}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="px-2.5 py-1 rounded-full bg-[#eaf2ff] text-[#687fe0] text-[11px] font-bold">
                            {doc.category}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-medium text-[#697b98]">
                          {doc.grade} / {doc.subject}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-[#34476a]">{doc.page_count}쪽</td>
                        <td className="px-4 py-3.5">
                          {doc.status === 'COMPLETED' ? (
                            <span className="inline-flex items-center gap-1 text-[#1c7d54] font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" /> 색인완료
                            </span>
                          ) : (
                            <span className="text-[#e07f38] font-bold">{doc.status}</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          {doc.is_public ? (
                            <span className="text-[#687fe0] font-bold">공개</span>
                          ) : (
                            <span className="text-[#8b9ab7] font-medium">비공개</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                setViewerModal({
                                  isOpen: true,
                                  docId: doc.id,
                                  pageNumber: 1,
                                  title: doc.title
                                })
                              }
                              className="p-1.5 rounded-lg text-[#697b98] hover:text-[#687fe0] hover:bg-[#eaf2ff] transition-colors"
                              title="PDF 미리보기"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReindex(doc.id)}
                              className="p-1.5 rounded-lg text-[#697b98] hover:text-[#687fe0] hover:bg-[#eaf2ff] transition-colors"
                              title="재색인"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(doc.id, doc.title)}
                              className="p-1.5 rounded-lg text-[#697b98] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="삭제"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 탭 3: 검색 품질 테스트 콘솔 */}
        {activeTab === 'test' && (
          <div className="bg-white rounded-[24px] border border-[#e8edf6] shadow-[0_5px_22px_rgba(164,176,202,0.12)] p-5 sm:p-7 space-y-5">
            <div>
              <h3 className="font-black text-base text-[#30415e]">검색 엔진 매칭 품질 테스트</h3>
              <p className="text-xs text-[#697b98] mt-1">
                질문이나 키워드를 입력하여 D1 인덱스에서 추출되는 청크 점수와 한국어 키워드 매칭 상태를 검증합니다.
              </p>
            </div>

            <form onSubmit={handleRunTestSearch} className="flex gap-2">
              <input
                type="text"
                value={testQuery}
                onChange={e => setTestQuery(e.target.value)}
                placeholder="테스트할 질문이나 키워드를 입력하세요... (예: 5학년 단원설계안, C단계 활동)"
                className="flex-1 text-xs px-4 py-3 rounded-xl border border-[#e8edf6] outline-none focus:ring-2 focus:ring-[#687fe0] focus:border-[#687fe0] text-[#30415e] bg-[#f8faff]"
              />
              <button
                type="submit"
                disabled={testLoading}
                className="px-5 py-3 rounded-xl bg-[#687fe0] hover:bg-[#566ecf] text-white font-bold text-xs shadow-[0_4px_12px_rgba(108,128,218,0.25)] flex items-center gap-1.5 transition-all"
              >
                <Search className="w-3.5 h-3.5" />
                <span>테스트 실행</span>
              </button>
            </form>

            {testResult && (
              <div className="space-y-4 pt-3 border-t border-[#e8edf6]">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-bold text-[#34476a]">추출된 키워드:</span>
                  {testResult.keywords?.map((kw: string) => (
                    <span key={kw} className="px-2.5 py-0.5 rounded-full bg-[#eaf2ff] text-[#687fe0] font-bold">
                      {kw}
                    </span>
                  ))}
                  <span className="text-[#8b9ab7] ml-auto font-medium">
                    매칭 청크: {testResult.matched_count}건
                  </span>
                </div>

                <div className="space-y-2.5">
                  {testResult.evaluated?.map((item: any, i: number) => (
                    <div
                      key={item.chunk_id || i}
                      className="p-4 rounded-[18px] bg-[#f8faff] border border-[#e8edf6] text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#30415e]">
                          {item.doc_title} (p.{item.page_number})
                        </span>
                        <span className="font-bold px-2.5 py-0.5 rounded-full bg-[#eaf2ff] text-[#687fe0]">
                          점수: {item.score}
                        </span>
                      </div>
                      <p className="text-[#697b98] leading-relaxed">{item.content_preview}...</p>
                      <div className="flex items-center gap-1 text-[11px] text-[#687fe0] font-bold">
                        <span>일치 키워드: {item.matched_keywords?.join(', ') || '없음'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* PDF 뷰어 모달 */}
      <PdfViewerModal
        isOpen={viewerModal.isOpen}
        onClose={() => setViewerModal(prev => ({ ...prev, isOpen: false }))}
        docId={viewerModal.docId}
        pageNumber={viewerModal.pageNumber}
        title={viewerModal.title}
      />
    </div>
  );
};
