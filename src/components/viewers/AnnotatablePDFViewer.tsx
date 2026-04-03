import {
  useState,
  useRef,
  useCallback,
  useLayoutEffect,
  useMemo,
  useEffect,
} from 'react';
import {
  PdfLoader,
  PdfHighlighter,
  TextHighlight,
  AreaHighlight,
  MonitoredHighlightContainer,
  useHighlightContainerContext,
  usePdfHighlighterContext,
  type PdfHighlighterUtils,
  type GhostHighlight,
  type Tip,
  type PdfScaleValue,
} from 'react-pdf-highlighter-extended-extended';
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ZoomIn,
  ZoomOut,
  Download,
  ExternalLink,
  Highlighter,
  MessageSquare,
  FileText,
  Loader2,
  Copy,
  X as XIcon,
  Sparkles,
  FileSignature,
  Clock,
  Save,
  Pencil,
  Trash2,
  RotateCw,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import useAppStore from '@/store';
import {
  useFileAnnotations,
  useCreateAnnotation,
  useUpdateAnnotation,
  useDeleteAnnotation,
} from '@/hooks/useAnnotations';
import {
  HIGHLIGHT_COLORS,
  annotationToHighlight,
  type AnnotationHighlight,
} from '@/types/annotations';
import { AnnotationSidebar } from './AnnotationSidebar';

// Required CSS for react-pdf-highlighter-extended-extended + pdfjs
import 'react-pdf-highlighter-extended-extended/dist/esm/style/pdf_viewer.css';
import 'react-pdf-highlighter-extended-extended/dist/esm/style/PdfHighlighter.css';
import 'react-pdf-highlighter-extended-extended/dist/esm/style/TextHighlight.css';
import 'react-pdf-highlighter-extended-extended/dist/esm/style/AreaHighlight.css';
import 'react-pdf-highlighter-extended-extended/dist/esm/style/MouseSelection.css';

// PDF.js worker — served from public/ for guaranteed availability
// (no bundler resolution, no hash mismatch, no version conflicts)
const PDF_WORKER_URL = '/pdf.worker.min.mjs';

interface AnnotatablePDFViewerProps {
  url: string;
  fileName: string;
  fileId: string;
  projectId: string;
}

export function AnnotatablePDFViewer({
  url,
  fileName,
  fileId,
  projectId,
}: AnnotatablePDFViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const highlighterUtilsRef = useRef<PdfHighlighterUtils | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState<PdfScaleValue>('auto');
  const [viewerWidth, setViewerWidth] = useState(0);

  // Annotation data
  const { data: annotations = [] } = useFileAnnotations(fileId);
  const createAnnotation = useCreateAnnotation();
  const deleteAnnotation = useDeleteAnnotation();

  // Convert DB annotations to highlight format
  const highlights: AnnotationHighlight[] = useMemo(
    () => annotations.map(annotationToHighlight),
    [annotations],
  );

  const handleZoomIn = useCallback(() => {
    setScale((prev) => {
      const numeric = typeof prev === 'number' ? prev : 1;
      return Math.min(numeric + 0.25, 3);
    });
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => {
      const numeric = typeof prev === 'number' ? prev : 1;
      return Math.max(numeric - 0.25, 0.5);
    });
  }, []);

  const handlePrevPage = useCallback(() => {
    if (!highlighterUtilsRef.current) return;
    const viewer = highlighterUtilsRef.current.getViewer();
    if (viewer && currentPage > 1) {
      viewer.currentPageNumber = currentPage - 1;
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);

  const handleNextPage = useCallback(() => {
    if (!highlighterUtilsRef.current) return;
    const viewer = highlighterUtilsRef.current.getViewer();
    if (viewer && currentPage < totalPages) {
      viewer.currentPageNumber = currentPage + 1;
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, totalPages]);

  const handleDownload = useCallback(() => {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
  }, [url, fileName]);

  const handleOpenInTab = useCallback(() => {
    window.open(url, '_blank');
  }, [url]);

  const handleScrollToHighlight = useCallback(
    (highlight: AnnotationHighlight) => {
      highlighterUtilsRef.current?.scrollToHighlight(highlight);
      setSidebarOpen(false);
    },
    [],
  );

  const handleDeleteAnnotation = useCallback(
    (annotation: { id: string }) => {
      deleteAnnotation.mutate({
        id: annotation.id,
        fileId,
        projectId,
      });
    },
    [deleteAnnotation, fileId, projectId],
  );

  // Selection is now handled via the selectionTip prop on PdfHighlighter
  // (see SelectionTipFromContext component)

  const [highlightMode, setHighlightMode] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const annotationCount = annotations.length;
  const compactToolbar = viewerWidth > 0 && viewerWidth < 520;
  const narrowToolbar = viewerWidth > 0 && viewerWidth < 760;
  const compactSidebar = viewerWidth > 0 && viewerWidth < 840;

  // Compute display zoom percentage
  const zoomPercent = typeof scale === 'number' ? Math.round(scale * 100) : null;

  useEffect(() => {
    const el = viewerRef.current;
    if (!el) return;

    const update = () => setViewerWidth(el.clientWidth);
    update();

    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!highlightMode) return;
    setSidebarOpen(true);
  }, [highlightMode]);

  // Apply rotation to the pdfjs viewer
  useEffect(() => {
    const viewer = highlighterUtilsRef.current?.getViewer();
    if (viewer) {
      viewer.pagesRotation = rotation;
    }
  }, [rotation, highlighterUtilsRef]);

  const handleRotate = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  // Zoom presets
  const handleZoomPreset = useCallback((preset: PdfScaleValue) => {
    setScale(preset);
  }, []);

  // Search: focus input when opened
  useEffect(() => {
    if (showSearch) {
      requestAnimationFrame(() => searchInputRef.current?.focus());
    } else {
      setSearchQuery('');
      // Clear search highlights via eventBus
      const viewer = highlighterUtilsRef.current?.getViewer() as Record<string, unknown> | undefined;
      const bus = viewer?.eventBus as { dispatch?: (name: string, data: Record<string, unknown>) => void } | undefined;
      if (bus?.dispatch) {
        bus.dispatch('find', { source: null, type: '', query: '', highlightAll: false });
      }
    }
  }, [showSearch, highlighterUtilsRef]);

  const dispatchFind = useCallback((opts: { query: string; type?: string; findPrevious?: boolean }) => {
    const viewer = highlighterUtilsRef.current?.getViewer() as Record<string, unknown> | undefined;
    const bus = viewer?.eventBus as { dispatch?: (name: string, data: Record<string, unknown>) => void } | undefined;
    if (!bus?.dispatch || !opts.query.trim()) return;
    bus.dispatch('find', {
      source: null,
      type: opts.type ?? '',
      query: opts.query,
      highlightAll: true,
      caseSensitive: false,
      entireWord: false,
      findPrevious: opts.findPrevious ?? false,
    });
  }, [highlighterUtilsRef]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    dispatchFind({ query });
  }, [dispatchFind]);

  const handleSearchNext = useCallback(() => {
    dispatchFind({ query: searchQuery, type: 'again', findPrevious: false });
  }, [dispatchFind, searchQuery]);

  const handleSearchPrev = useCallback(() => {
    dispatchFind({ query: searchQuery, type: 'again', findPrevious: true });
  }, [dispatchFind, searchQuery]);

  // Keyboard shortcuts
  useEffect(() => {
    const el = viewerRef.current;
    if (!el) return;

    const handler = (e: KeyboardEvent) => {
      // Ctrl/Cmd + F = search
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        setShowSearch(true);
        return;
      }
      // Escape = close search
      if (e.key === 'Escape') {
        if (showSearch) { setShowSearch(false); return; }
      }
      // Don't intercept when typing in inputs
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      // +/= = zoom in, - = zoom out
      if (e.key === '=' || e.key === '+') { handleZoomIn(); return; }
      if (e.key === '-') { handleZoomOut(); return; }
      // r = rotate
      if (e.key === 'r' && !e.metaKey && !e.ctrlKey) { handleRotate(); return; }
      // h = toggle highlight mode
      if (e.key === 'h' && !e.metaKey && !e.ctrlKey) { setHighlightMode((p) => !p); return; }
    };

    el.addEventListener('keydown', handler);
    return () => el.removeEventListener('keydown', handler);
  }, [showSearch, handleZoomIn, handleZoomOut, handleRotate]);

  return (
    <div ref={viewerRef} className="relative flex h-full min-w-0 flex-col outline-none" tabIndex={-1}>
      {/* Toolbar */}
      <div
        className={cn(
          'shrink-0 border-b border-surface-200 bg-white px-2 dark:border-surface-700 dark:bg-surface-900',
          narrowToolbar ? 'py-2' : 'h-10'
        )}
      >
        {/* File name */}
        <div className={cn('flex items-center justify-between gap-2', narrowToolbar && 'flex-wrap')}>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <FileText className="h-3.5 w-3.5 shrink-0 text-red-500" />
            <span
              className={cn(
                'truncate text-sm font-medium text-surface-600 dark:text-surface-300',
                compactToolbar ? 'max-w-[11rem]' : 'max-w-[18rem]'
              )}
              title={fileName}
            >
              {fileName}
            </span>
          </div>

          {/* Center: page nav + zoom */}
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-md',
                'text-surface-400 transition-colors',
                'hover:bg-surface-100 hover:text-surface-600',
                'disabled:opacity-30 disabled:hover:bg-transparent',
                'dark:hover:bg-surface-700 dark:hover:text-surface-300',
              )}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            <span className="min-w-[4rem] text-center text-xs text-surface-500 dark:text-surface-400">
              {totalPages > 0 ? `${currentPage} / ${totalPages}` : '--'}
            </span>

            <button
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-md',
                'text-surface-400 transition-colors',
                'hover:bg-surface-100 hover:text-surface-600',
                'disabled:opacity-30 disabled:hover:bg-transparent',
                'dark:hover:bg-surface-700 dark:hover:text-surface-300',
              )}
              aria-label="Next page"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>

            <div className="mx-1 h-4 w-px bg-surface-200 dark:bg-surface-700" />

            <button
              onClick={handleZoomOut}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-md',
                'text-surface-400 transition-colors',
                'hover:bg-surface-100 hover:text-surface-600',
                'dark:hover:bg-surface-700 dark:hover:text-surface-300',
              )}
              aria-label="Zoom out"
              title="Zoom out (-)"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>

            {/* Zoom level / preset dropdown */}
            <button
              onClick={() => handleZoomPreset(typeof scale === 'number' ? 'auto' : 1)}
              className="min-w-[3.2rem] rounded-md px-1 py-1 text-center text-[11px] font-medium text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-700 dark:text-surface-400 dark:hover:bg-surface-700 dark:hover:text-surface-300"
              title={typeof scale === 'number' ? 'Click for Fit Width' : 'Click for 100%'}
            >
              {zoomPercent ? `${zoomPercent}%` : 'Fit'}
            </button>

            <button
              onClick={handleZoomIn}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-md',
                'text-surface-400 transition-colors',
                'hover:bg-surface-100 hover:text-surface-600',
                'dark:hover:bg-surface-700 dark:hover:text-surface-300',
              )}
              aria-label="Zoom in"
              title="Zoom in (+)"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>

            <div className="mx-1 h-4 w-px bg-surface-200 dark:bg-surface-700" />

            {/* Rotate */}
            <button
              onClick={handleRotate}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-md',
                'text-surface-400 transition-colors',
                'hover:bg-surface-100 hover:text-surface-600',
                'dark:hover:bg-surface-700 dark:hover:text-surface-300',
              )}
              aria-label="Rotate page"
              title="Rotate (R)"
            >
              <RotateCw className="h-3.5 w-3.5" />
            </button>

            {/* Search */}
            <button
              onClick={() => setShowSearch((s) => !s)}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-md transition-colors',
                showSearch
                  ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                  : 'text-surface-400 hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-700 dark:hover:text-surface-300',
              )}
              aria-label="Find in document"
              title="Search (Ctrl+F)"
            >
              <Search className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Right: mode toggle + annotations + download + open */}
          <div className="flex items-center gap-1 rounded-lg bg-surface-100/80 p-0.5 dark:bg-surface-800/60">
            {/* Read / Annotate toggle */}
            <div className="flex items-center rounded-md border border-surface-200/60 bg-white p-px dark:border-surface-700/60 dark:bg-surface-800">
              <button
                onClick={() => setHighlightMode(false)}
                className={cn(
                  'rounded-[5px] px-2 py-1 text-[11px] font-medium transition-all',
                  !highlightMode
                    ? 'bg-surface-100 text-surface-700 shadow-sm dark:bg-surface-700 dark:text-surface-200'
                    : 'text-surface-400 hover:text-surface-600 dark:text-surface-500'
                )}
              >
                Read
              </button>
              <button
                onClick={() => setHighlightMode(true)}
                className={cn(
                  'flex items-center gap-1 rounded-[5px] px-2 py-1 text-[11px] font-medium transition-all',
                  highlightMode
                    ? 'bg-yellow-100 text-yellow-800 shadow-sm dark:bg-yellow-900/30 dark:text-yellow-300'
                    : 'text-surface-400 hover:text-surface-600 dark:text-surface-500'
                )}
              >
                <Highlighter className="h-3 w-3" />
                {!compactToolbar && 'Annotate'}
              </button>
            </div>

            <div className="mx-0.5 h-4 w-px bg-surface-200 dark:bg-surface-700" />

            <button
              onClick={() => setSidebarOpen((s) => !s)}
              className={cn(
                'flex h-7 items-center justify-center gap-1 rounded-md px-2',
                'transition-colors',
                sidebarOpen
                  ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                  : 'text-surface-400 hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-700 dark:hover:text-surface-300',
              )}
              title="Toggle annotations"
              aria-label="Toggle annotations sidebar"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              {!compactToolbar && <span className="text-xs font-medium">{annotationCount || 'No'} notes</span>}
            </button>
            <button
              onClick={handleDownload}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-md',
                'text-surface-400 transition-colors',
                'hover:bg-surface-100 hover:text-surface-600',
                'dark:hover:bg-surface-700 dark:hover:text-surface-300',
              )}
              title="Download PDF"
              aria-label="Download PDF"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleOpenInTab}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-md',
                'text-surface-400 transition-colors',
                'hover:bg-surface-100 hover:text-surface-600',
                'dark:hover:bg-surface-700 dark:hover:text-surface-300',
              )}
              title="Open in new tab"
              aria-label="Open in new tab"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="flex shrink-0 items-center gap-2 border-b border-surface-200 bg-surface-50 px-3 py-1.5 dark:border-surface-700 dark:bg-surface-850">
          <Search className="h-3 w-3 shrink-0 text-surface-400" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (e.shiftKey) handleSearchPrev();
                else handleSearchNext();
              }
              if (e.key === 'Escape') setShowSearch(false);
            }}
            placeholder="Find in document..."
            className="min-w-0 flex-1 bg-transparent text-xs text-surface-700 placeholder:text-surface-400 focus:outline-none dark:text-surface-200 dark:placeholder:text-surface-500"
          />
          <button
            onClick={handleSearchPrev}
            disabled={!searchQuery.trim()}
            className="flex h-5 w-5 items-center justify-center rounded text-surface-400 transition-colors hover:bg-surface-200 disabled:opacity-30 dark:hover:bg-surface-700"
            title="Previous match (Shift+Enter)"
          >
            <ChevronUp className="h-3 w-3" />
          </button>
          <button
            onClick={handleSearchNext}
            disabled={!searchQuery.trim()}
            className="flex h-5 w-5 items-center justify-center rounded text-surface-400 transition-colors hover:bg-surface-200 disabled:opacity-30 dark:hover:bg-surface-700"
            title="Next match (Enter)"
          >
            <ChevronDown className="h-3 w-3" />
          </button>
          <button
            onClick={() => setShowSearch(false)}
            className="flex h-5 w-5 items-center justify-center rounded text-surface-400 transition-colors hover:bg-surface-200 dark:hover:bg-surface-700"
            title="Close search (Esc)"
          >
            <XIcon className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* PDF viewer area */}
      <div className="relative flex-1 overflow-auto">
        <PdfLoader
          document={url}
          workerSrc={PDF_WORKER_URL}
          beforeLoad={() => (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-surface-300 dark:text-surface-600" />
            </div>
          )}
          errorMessage={(error) => (
            <div className="flex h-full flex-col items-center justify-center px-8 text-center">
              <div className="w-full max-w-sm rounded-2xl border border-red-300 bg-red-50 p-6 dark:border-red-800 dark:bg-red-950/40">
                <FileText className="mx-auto h-7 w-7 text-red-400" />
                <h3 className="mt-4 text-sm font-semibold text-surface-700 dark:text-surface-200">
                  Failed to load PDF
                </h3>
                <p className="mt-1.5 text-xs text-surface-400">
                  {error.message}
                </p>
              </div>
            </div>
          )}
        >
          {(pdfDocument) => (
            <PdfHighlighterInner
              pdfDocument={pdfDocument}
              scale={scale}
              highlights={highlights}
              highlighterUtilsRef={highlighterUtilsRef}
              fileId={fileId}
              fileName={fileName}
              projectId={projectId}
              createAnnotation={createAnnotation}
              onTotalPagesChange={setTotalPages}
              totalPages={totalPages}
              highlightMode={highlightMode}
            />
          )}
        </PdfLoader>

        {compactSidebar && sidebarOpen && (
          <button
            type="button"
            className="absolute inset-0 z-20 bg-surface-950/20 backdrop-blur-[1px]"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close annotations sidebar"
          />
        )}

        {/* Annotations sidebar overlay */}
        <AnnotationSidebar
          annotations={annotations}
          isOpen={sidebarOpen}
          highlightMode={highlightMode}
          onClose={() => setSidebarOpen(false)}
          onStartHighlighting={() => {
            setHighlightMode(true);
            setSidebarOpen(true);
          }}
          onScrollTo={handleScrollToHighlight}
          onDelete={(a) => handleDeleteAnnotation(a)}
          fileName={fileName}
          compact={compactSidebar}
        />
      </div>
    </div>
  );
}

/**
 * Inner component that receives the pdfDocument from PdfLoader's render prop.
 * This avoids the PDFDocumentProxy version mismatch between pdfjs-dist versions
 * by not importing the type directly — we let the library's own types flow through.
 */
function PdfHighlighterInner({
  pdfDocument,
  scale,
  highlights,
  highlighterUtilsRef,
  fileId,
  fileName,
  projectId,
  createAnnotation,
  onTotalPagesChange,
  totalPages,
  highlightMode,
}: {
  pdfDocument: Parameters<NonNullable<Parameters<typeof PdfLoader>[0]['children']>>[0];
  scale: PdfScaleValue;
  highlights: AnnotationHighlight[];
  highlighterUtilsRef: React.MutableRefObject<PdfHighlighterUtils | null>;
  fileId: string;
  fileName: string;
  projectId: string;
  createAnnotation: ReturnType<typeof useCreateAnnotation>;
  onTotalPagesChange: (pages: number) => void;
  totalPages: number;
  highlightMode: boolean;
}) {
  // Set total pages on initial load
  useEffect(() => {
    if (pdfDocument.numPages !== totalPages) {
      onTotalPagesChange(pdfDocument.numPages);
    }
  }, [pdfDocument.numPages, totalPages, onTotalPagesChange]);

  return (
    <PdfHighlighter
      pdfDocument={pdfDocument}
      pdfScaleValue={scale}
      highlights={highlights}
      utilsRef={(utils) => {
        highlighterUtilsRef.current = utils;
      }}
      selectionTip={
        highlightMode ? (
          <SelectionTipFromContext
            fileId={fileId}
            fileName={fileName}
            projectId={projectId}
            createAnnotation={createAnnotation}
          />
        ) : undefined
      }
      enableAreaSelection={highlightMode ? (event) => event.altKey : () => false}
      textSelectionColor="rgba(98, 121, 143, 0.15)"
      style={{
        height: '100%',
        width: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
      }}
    >
      <HighlightContainer />
    </PdfHighlighter>
  );
}

/**
 * Renders each highlight inside the PdfHighlighter.
 * Gets context from useHighlightContainerContext.
 */
function HighlightContainer() {
  const {
    highlight,
    isScrolledTo,
  } = useHighlightContainerContext<AnnotationHighlight>();

  const isTextHighlight = highlight.type !== 'area';

  const tipContent = (
    <HighlightActionPopover highlight={highlight} />
  );

  const highlightTip: Tip = {
    position: highlight.position,
    content: tipContent,
  };

  const component = isTextHighlight ? (
    <TextHighlight
      isScrolledTo={isScrolledTo}
      highlight={highlight}
      style={{
        background: highlight.color || 'rgba(255, 226, 100, 0.4)',
      }}
    />
  ) : (
    <AreaHighlight
      isScrolledTo={isScrolledTo}
      highlight={highlight}
      style={{
        background: highlight.color || 'rgba(255, 226, 100, 0.4)',
      }}
    />
  );

  return (
    <MonitoredHighlightContainer highlightTip={highlightTip}>
      {component}
    </MonitoredHighlightContainer>
  );
}

/** Action popover shown when clicking an existing highlight on the PDF. */
function HighlightActionPopover({ highlight: rawHighlight }: { highlight: unknown }) {
  // Cast to a workable shape
  const highlight = rawHighlight as { id: string; color: string; comment?: string; content?: { text?: string } };
  const [editing, setEditing] = useState(false);
  const [commentText, setCommentText] = useState(highlight.comment ?? '');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const updateAnnotation = useUpdateAnnotation();
  const deleteAnnotation = useDeleteAnnotation();
  const { setTip } = usePdfHighlighterContext();

  // The highlight.id is "annot-{uuid}" if from DB, or just the uuid
  const annotationId = highlight.id.startsWith('annot-') ? highlight.id.slice(6) : highlight.id;

  const handleDelete = useCallback(() => {
    // We need fileId and projectId — get from the store
    const state = useAppStore.getState();
    const fileId = state.selectedFileId;
    const projectId = state.selectedProjectId;
    if (!fileId || !projectId) return;
    deleteAnnotation.mutate({ id: annotationId, fileId, projectId });
    setTip(null);
  }, [annotationId, deleteAnnotation, setTip]);

  const handleSaveComment = useCallback(() => {
    updateAnnotation.mutate({ id: annotationId, comment: commentText.trim() || null });
    setEditing(false);
  }, [annotationId, commentText, updateAnnotation]);

  const handleChangeColor = useCallback((newColor: string) => {
    updateAnnotation.mutate({ id: annotationId, color: newColor });
    setShowColorPicker(false);
  }, [annotationId, updateAnnotation]);

  const handleCopy = useCallback(() => {
    if (highlight.content?.text) {
      navigator.clipboard.writeText(highlight.content.text).catch(() => {});
    }
    setTip(null);
  }, [highlight.content?.text, setTip]);


  if (editing) {
    return (
      <div className={cn(
        'w-64 rounded-xl border border-surface-200 bg-white p-3 shadow-xl',
        'dark:border-surface-700 dark:bg-surface-900',
      )}>
        <textarea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Write a note..."
          rows={3}
          autoFocus
          className="w-full resize-none rounded-lg border border-surface-200 px-2.5 py-2 text-xs text-surface-700 focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-300 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-200"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveComment(); }
            if (e.key === 'Escape') setEditing(false);
          }}
        />
        <div className="mt-2 flex justify-end gap-1">
          <button onClick={() => setEditing(false)} className="rounded-md px-2.5 py-1 text-xs text-surface-400 hover:bg-surface-100">Cancel</button>
          <button onClick={handleSaveComment} className="rounded-md bg-primary-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-primary-700">Save</button>
        </div>
      </div>
    );
  }

  if (showColorPicker) {
    return (
      <div className={cn(
        'flex items-center gap-1.5 rounded-xl border border-surface-200 bg-white p-2 shadow-xl',
        'dark:border-surface-700 dark:bg-surface-900',
      )}>
        {HIGHLIGHT_COLORS.map((c) => (
          <button
            key={c.name}
            onClick={() => handleChangeColor(c.value)}
            className={cn(
              'h-7 w-7 rounded-full transition-transform hover:scale-110',
              highlight.color === c.value ? 'ring-2 ring-primary-500 ring-offset-1' : 'ring-1 ring-surface-200'
            )}
            style={{ backgroundColor: c.value }}
            title={c.label}
          />
        ))}
        <button onClick={() => setShowColorPicker(false)} className="ml-1 rounded-md p-1 text-surface-300 hover:bg-surface-100">
          <XIcon className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div className={cn(
      'rounded-xl border border-surface-200 bg-white shadow-xl overflow-hidden',
      'dark:border-surface-700 dark:bg-surface-900',
    )}>
      {/* Text preview + comment */}
      {(highlight.content?.text || ('comment' in highlight && highlight.comment)) && (
        <div className="max-w-[240px] px-3 py-2 border-b border-surface-100 dark:border-surface-800">
          {highlight.content?.text && (
            <p className="line-clamp-2 text-xs leading-relaxed text-surface-600 dark:text-surface-300">
              "{highlight.content.text}"
            </p>
          )}
          {highlight.comment && (
            <div className="mt-1.5 rounded-md bg-blue-50 px-2 py-1 dark:bg-blue-900/20">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                {highlight.comment}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex">
        <button
          onClick={() => setEditing(true)}
          className="flex flex-1 items-center justify-center gap-1 px-2.5 py-2 text-xs font-medium text-surface-500 hover:bg-surface-50 dark:text-surface-400 dark:hover:bg-surface-800 border-r border-surface-100 dark:border-surface-800"
          title="Edit note"
        >
          <Pencil className="h-3 w-3" />
          Edit
        </button>
        <button
          onClick={() => setShowColorPicker(true)}
          className="flex flex-1 items-center justify-center gap-1 px-2.5 py-2 text-xs font-medium text-surface-500 hover:bg-surface-50 dark:text-surface-400 dark:hover:bg-surface-800 border-r border-surface-100 dark:border-surface-800"
          title="Change color"
        >
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: highlight.color }} />
          Color
        </button>
        <button
          onClick={handleCopy}
          className="flex flex-1 items-center justify-center gap-1 px-2.5 py-2 text-xs font-medium text-surface-500 hover:bg-surface-50 dark:text-surface-400 dark:hover:bg-surface-800 border-r border-surface-100 dark:border-surface-800"
          title="Copy text"
        >
          <Copy className="h-3 w-3" />
          Copy
        </button>
        <button
          onClick={handleDelete}
          className="flex flex-1 items-center justify-center gap-1 px-2.5 py-2 text-xs font-medium text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          title="Delete highlight"
        >
          <Trash2 className="h-3 w-3" />
          Delete
        </button>
      </div>
    </div>
  );
}


/**
 * Wrapper that reads the current selection from PdfHighlighter context
 * and renders the SelectionTip with the right data.
 * This is rendered via the `selectionTip` prop, so it automatically
 * appears when the user finishes selecting text.
 */
function SelectionTipFromContext({
  fileId,
  fileName,
  projectId,
  createAnnotation,
}: {
  fileId: string;
  fileName: string;
  projectId: string;
  createAnnotation: ReturnType<typeof useCreateAnnotation>;
}) {
  const { getCurrentSelection, setTip, removeGhostHighlight } = usePdfHighlighterContext();
  const selection = getCurrentSelection();

  if (!selection) return null;

  const ghost = selection.makeGhostHighlight();
  const selectedText = ghost.content.text ?? null;

  return (
    <SelectionTip
      selectedText={selectedText}
      ghost={ghost}
      fileId={fileId}
      fileName={fileName}
      projectId={projectId}
      onSave={() => {
        setTip(null);
        removeGhostHighlight();
      }}
      createAnnotation={createAnnotation}
    />
  );
}

/**
 * Floating tip shown when text is selected.
 * Lets the user pick a color, add a comment, and save.
 */

type TipMode = 'menu' | 'highlight' | 'comment';

function SelectionTip({
  selectedText,
  ghost,
  fileId,
  fileName,
  projectId,
  onSave,
  createAnnotation,
}: {
  selectedText: string | null;
  ghost: GhostHighlight;
  fileId: string;
  fileName: string;
  projectId: string;
  onSave: () => void;
  createAnnotation: ReturnType<typeof useCreateAnnotation>;
}) {
  const [mode, setMode] = useState<TipMode>('menu');
  const [color, setColor] = useState<string>(HIGHLIGHT_COLORS[0].value);
  const [comment, setComment] = useState('');

  const { updateTipPosition } = usePdfHighlighterContext();

  useLayoutEffect(() => {
    updateTipPosition();
  }, [mode, updateTipPosition]);

  const handleHighlight = useCallback((highlightColor: string) => {
    createAnnotation.mutate(
      {
        file_id: fileId,
        project_id: projectId,
        annotation_type: 'highlight',
        page_number: ghost.position.boundingRect.pageNumber,
        position_data: ghost.position,
        selected_text: selectedText || undefined,
        color: highlightColor,
      },
      { onSuccess: onSave },
    );
  }, [createAnnotation, fileId, projectId, ghost.position, selectedText, onSave]);

  const handleSaveComment = useCallback(() => {
    createAnnotation.mutate(
      {
        file_id: fileId,
        project_id: projectId,
        annotation_type: 'comment',
        page_number: ghost.position.boundingRect.pageNumber,
        position_data: ghost.position,
        selected_text: selectedText || undefined,
        comment: comment.trim() || undefined,
        color,
      },
      { onSuccess: onSave },
    );
  }, [createAnnotation, fileId, projectId, ghost.position, selectedText, comment, color, onSave]);

  const handleCopy = useCallback(() => {
    if (selectedText) {
      navigator.clipboard.writeText(selectedText).catch(() => {});
    }
    onSave(); // dismiss tip
  }, [selectedText, onSave]);

  const handleAskAI = useCallback(() => {
    if (!selectedText) return;
    // Switch to AI chat tab and pre-fill with the selected text
    useAppStore.getState().setRightTab('ai');
    useAppStore.getState().setRightPanel(true);
    // Store the text so the AI chat can pick it up
    const event = new CustomEvent('ask-ai-about-text', { detail: { text: selectedText, fileName } });
    window.dispatchEvent(event);
    onSave();
  }, [selectedText, fileName, onSave]);

  const handleAddToBrief = useCallback(() => {
    if (!selectedText) return;
    useAppStore.getState().setPendingBriefInsertion({
      text: selectedText,
      fileId,
      fileName,
      page: ghost.position.boundingRect.pageNumber,
    });
    useAppStore.getState().setCenterTab('drafts');
    onSave();
  }, [selectedText, fileId, fileName, ghost.position, onSave]);

  const handleAddToChronology = useCallback(() => {
    if (!selectedText) return;
    useAppStore.getState().setPendingChronologyEntry({
      text: selectedText,
      fileId,
      fileName,
      page: ghost.position.boundingRect.pageNumber,
    });
    useAppStore.getState().setCenterTab('timeline');
    onSave();
  }, [selectedText, fileId, fileName, ghost.position, onSave]);

  // Initial menu: actions grid
  if (mode === 'menu') {
    return (
      <div className={cn(
        'max-w-[22rem] overflow-hidden rounded-xl border border-surface-200 bg-white shadow-xl',
        'dark:border-surface-700 dark:bg-surface-900',
      )}>
        {selectedText && (
          <div className="border-b border-surface-100 px-3 py-2 dark:border-surface-800">
            <p className="line-clamp-3 text-xs leading-relaxed text-surface-600 dark:text-surface-300">
              "{selectedText}"
            </p>
            <p className="mt-1 text-[10px] text-surface-400 dark:text-surface-500">
              Choose what to do with this passage.
            </p>
          </div>
        )}
        {/* Primary actions row */}
        <div className="flex border-b border-surface-100 dark:border-surface-800">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium text-surface-600 hover:bg-surface-50 dark:text-surface-300 dark:hover:bg-surface-800 border-r border-surface-100 dark:border-surface-800"
            title="Copy selected text"
          >
            <Copy className="h-3.5 w-3.5" />
            Copy
          </button>
          <button
            onClick={() => setMode('highlight')}
            className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium text-surface-600 hover:bg-yellow-50 dark:text-surface-300 dark:hover:bg-yellow-900/20 border-r border-surface-100 dark:border-surface-800"
            title="Highlight this text"
          >
            <Highlighter className="h-3.5 w-3.5 text-yellow-600" />
            Highlight
          </button>
          <button
            onClick={() => setMode('comment')}
            className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium text-surface-600 hover:bg-blue-50 dark:text-surface-300 dark:hover:bg-blue-900/20"
            title="Add a comment"
          >
            <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
            Comment
          </button>
        </div>
        {/* Secondary actions row */}
        <div className="flex">
          <button
            onClick={handleAskAI}
            className="flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/20 border-r border-surface-100 dark:border-surface-800"
            title="Ask AI about this text"
          >
            <Sparkles className="h-3 w-3" />
            Ask AI
          </button>
          <button
            onClick={handleAddToBrief}
            className="flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-surface-500 hover:bg-surface-50 dark:text-surface-400 dark:hover:bg-surface-800 border-r border-surface-100 dark:border-surface-800"
            title="Insert into a legal draft"
          >
            <FileSignature className="h-3 w-3" />
            Brief
          </button>
          <button
            onClick={handleAddToChronology}
            className="flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-surface-500 hover:bg-surface-50 dark:text-surface-400 dark:hover:bg-surface-800"
            title="Add to chronology"
          >
            <Clock className="h-3 w-3" />
            Timeline
          </button>
        </div>
      </div>
    );
  }

  // Highlight mode: pick a color → instant save
  if (mode === 'highlight') {
    return (
      <div className={cn(
        'flex items-center gap-1.5 rounded-xl border border-surface-200 bg-white p-2 shadow-xl',
        'dark:border-surface-700 dark:bg-surface-900',
      )}>
        {selectedText && (
          <p className="mr-2 max-w-[10rem] truncate text-[10px] text-surface-400 dark:text-surface-500" title={selectedText}>
            {selectedText}
          </p>
        )}
        <span className="text-[10px] font-medium text-surface-400 mr-1">Color:</span>
        {HIGHLIGHT_COLORS.map((c) => (
          <button
            key={c.name}
            onClick={() => handleHighlight(c.value)}
            className="h-7 w-7 rounded-full transition-transform hover:scale-110 ring-1 ring-surface-200 hover:ring-2 hover:ring-surface-400 dark:ring-surface-700"
            style={{ backgroundColor: c.value }}
            title={c.label}
          />
        ))}
        <button
          onClick={() => setMode('menu')}
          className="ml-1 rounded-md p-1 text-surface-300 hover:bg-surface-100 hover:text-surface-500 dark:hover:bg-surface-800"
          title="Back"
        >
          <XIcon className="h-3 w-3" />
        </button>
      </div>
    );
  }

  // Comment mode: color picker + text input + save
  return (
    <div className={cn(
      'w-72 rounded-xl border border-surface-200 bg-white p-3 shadow-xl',
      'dark:border-surface-700 dark:bg-surface-900',
    )}>
      {selectedText && (
        <div className="mb-2 rounded-lg bg-surface-50 px-2.5 py-2 dark:bg-surface-800/80">
          <p className="line-clamp-3 text-xs leading-relaxed text-surface-500 dark:text-surface-300">
            "{selectedText}"
          </p>
        </div>
      )}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-surface-400">Color</span>
          <div className="flex gap-1.5">
            {HIGHLIGHT_COLORS.map((c) => (
              <button
                key={c.name}
                onClick={() => setColor(c.value)}
                className={cn(
                  'h-5 w-5 rounded-full transition-all',
                  color === c.value
                    ? 'ring-2 ring-primary-500 ring-offset-1 dark:ring-offset-surface-900'
                    : 'ring-1 ring-surface-200 hover:ring-surface-300 dark:ring-surface-700',
                )}
                style={{ backgroundColor: c.value }}
                title={c.label}
              />
            ))}
          </div>
        </div>
        <button
          onClick={() => setMode('menu')}
          className="rounded-md p-1 text-surface-300 hover:bg-surface-100 hover:text-surface-500 dark:hover:bg-surface-800"
          title="Back"
        >
          <XIcon className="h-3 w-3" />
        </button>
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Write your comment..."
        rows={3}
        autoFocus
        className={cn(
          'w-full resize-none rounded-lg border border-surface-200 px-2.5 py-2',
          'text-xs text-surface-700 placeholder:text-surface-400',
          'focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-300',
          'dark:border-surface-700 dark:bg-surface-800 dark:text-surface-200',
        )}
      />

      <div className="mt-2 flex justify-end">
        <button
          onClick={handleSaveComment}
          disabled={createAnnotation.isPending}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-3 py-1.5',
            'bg-primary-600 text-xs font-medium text-white',
            'hover:bg-primary-700 disabled:opacity-50',
            'shadow-sm shadow-primary-500/25',
          )}
        >
          {createAnnotation.isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Save className="h-3 w-3" />
          )}
          Save
        </button>
      </div>
    </div>
  );
}
