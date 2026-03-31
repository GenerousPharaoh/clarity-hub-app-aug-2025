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
  type PdfSelection,
  type Tip,
  type PdfScaleValue,
  type ViewportPosition,
} from 'react-pdf-highlighter-extended-extended';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download,
  ExternalLink,
  MessageSquare,
  FileText,
  Loader2,
  Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import useAppStore from '@/store';
import {
  useFileAnnotations,
  useCreateAnnotation,
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
  const highlighterUtilsRef = useRef<PdfHighlighterUtils | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState<PdfScaleValue>('auto');

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

  const handleSelection = useCallback(
    (selection: PdfSelection) => {
      if (!highlighterUtilsRef.current) return;

      const ghost = selection.makeGhostHighlight();

      // Ghost highlights have ScaledPosition; we cast through unknown
      // to ViewportPosition since the library internally converts them
      // for tip positioning.
      const tipPosition = ghost.position as unknown as ViewportPosition;

      highlighterUtilsRef.current.setTip({
        position: tipPosition,
        content: (
          <SelectionTip
            selectedText={ghost.content.text ?? null}
            ghost={ghost}
            fileId={fileId}
            projectId={projectId}
            onSave={() => {
              highlighterUtilsRef.current?.setTip(null);
              highlighterUtilsRef.current?.removeGhostHighlight();
            }}
            createAnnotation={createAnnotation}
          />
        ),
      });
    },
    [fileId, projectId, createAnnotation],
  );

  const [highlightMode, setHighlightMode] = useState(true);
  const annotationCount = annotations.length;

  return (
    <div className="relative flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-surface-200 bg-white px-2 dark:border-surface-700 dark:bg-surface-900">
        {/* File name */}
        <div className="flex min-w-0 items-center gap-2">
          <FileText className="h-3.5 w-3.5 shrink-0 text-red-500" />
          <span
            className="truncate text-sm font-medium text-surface-600 dark:text-surface-300 max-w-[120px]"
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
          >
            <ZoomOut className="h-3.5 w-3.5" />
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
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Right: annotations sidebar toggle + download + open in tab */}
        <div className="flex items-center gap-1 rounded-lg bg-surface-100/80 p-0.5 dark:bg-surface-800/60">
          <button
            onClick={() => setSidebarOpen((s) => !s)}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-md',
              'transition-colors',
              sidebarOpen
                ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                : 'text-surface-400 hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-700 dark:hover:text-surface-300',
            )}
            title="Toggle annotations"
            aria-label="Toggle annotations sidebar"
          >
            <MessageSquare className="h-3.5 w-3.5" />
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

      {/* Annotation toolbar */}
      <div className="flex h-8 shrink-0 items-center gap-2 border-b border-surface-100 bg-surface-50 px-3 dark:border-surface-800 dark:bg-surface-850">
        <button
          onClick={() => setHighlightMode(!highlightMode)}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-all',
            highlightMode
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
              : 'text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700'
          )}
          title={highlightMode ? 'Highlight mode ON — select text to highlight' : 'Click to enable highlighting'}
        >
          <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: highlightMode ? '#FFEB3B' : '#d4d4d8' }} />
          Highlight
        </button>

        <div className="h-4 w-px bg-surface-200 dark:bg-surface-700" />

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={cn(
            'flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-all',
            sidebarOpen
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
              : 'text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700'
          )}
        >
          <MessageSquare className="h-3 w-3" />
          {annotationCount > 0 ? `${annotationCount} note${annotationCount > 1 ? 's' : ''}` : 'Notes'}
        </button>

        <span className="ml-auto text-[10px] text-surface-300 dark:text-surface-600">
          Select text to highlight &middot; Alt+drag for area
        </span>
      </div>

      {/* PDF viewer area */}
      <div className="relative flex-1 overflow-auto">
        <PdfLoader
          document={url}
          workerSrc={PDF_WORKER_URL}
          beforeLoad={() => (
            <div className="flex h-full flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
              <span className="text-xs text-surface-400">Loading PDF...</span>
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
              onSelection={handleSelection}
              onTotalPagesChange={setTotalPages}
              totalPages={totalPages}
            />
          )}
        </PdfLoader>

        {/* Annotations sidebar overlay */}
        <AnnotationSidebar
          annotations={annotations}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onScrollTo={handleScrollToHighlight}
          onDelete={(a) => handleDeleteAnnotation(a)}
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
  onSelection,
  onTotalPagesChange,
  totalPages,
}: {
  pdfDocument: Parameters<NonNullable<Parameters<typeof PdfLoader>[0]['children']>>[0];
  scale: PdfScaleValue;
  highlights: AnnotationHighlight[];
  highlighterUtilsRef: React.MutableRefObject<PdfHighlighterUtils | null>;
  onSelection: (selection: PdfSelection) => void;
  onTotalPagesChange: (pages: number) => void;
  totalPages: number;
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
      onSelection={onSelection}
      enableAreaSelection={(event) => event.altKey}
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
    viewportToScaled,
    screenshot,
    isScrolledTo,
    highlightBindings,
  } = useHighlightContainerContext<AnnotationHighlight>();

  const { toggleEditInProgress } = usePdfHighlighterContext();

  const isTextHighlight = highlight.type !== 'area';

  const tipContent = (
    <div className="rounded-lg border border-surface-200 bg-white px-3 py-2 shadow-lg dark:border-surface-700 dark:bg-surface-900">
      {highlight.content?.text && (
        <p className="max-w-[200px] text-xs leading-relaxed text-surface-600 dark:text-surface-300">
          {highlight.content.text.length > 100
            ? highlight.content.text.slice(0, 100) + '...'
            : highlight.content.text}
        </p>
      )}
      {('comment' in highlight) && (highlight as unknown as AnnotationHighlight).comment && (
        <p className="mt-1 max-w-[200px] text-[11px] italic text-surface-400 dark:text-surface-500">
          {highlight.comment}
        </p>
      )}
    </div>
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

/**
 * Floating tip shown when text is selected.
 * Lets the user pick a color, add a comment, and save.
 */
import { Copy, Highlighter, X as XIcon, Sparkles, FileSignature, Clock } from 'lucide-react';

type TipMode = 'menu' | 'highlight' | 'comment';

function SelectionTip({
  selectedText,
  ghost,
  fileId,
  projectId,
  onSave,
  createAnnotation,
}: {
  selectedText: string | null;
  ghost: GhostHighlight;
  fileId: string;
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
    const event = new CustomEvent('ask-ai-about-text', { detail: { text: selectedText, fileName: fileId } });
    window.dispatchEvent(event);
    onSave();
  }, [selectedText, fileId, onSave]);

  const handleAddToBrief = useCallback(() => {
    if (!selectedText) return;
    useAppStore.getState().setPendingBriefInsertion({
      text: selectedText,
      fileId,
      fileName: fileId, // Will be resolved by the drafter
      page: ghost.position.boundingRect.pageNumber,
    });
    useAppStore.getState().setCenterTab('drafts');
    onSave();
  }, [selectedText, fileId, ghost.position, onSave]);

  const handleAddToChronology = useCallback(() => {
    if (!selectedText) return;
    useAppStore.getState().setPendingChronologyEntry({
      text: selectedText,
      fileId,
      fileName: fileId,
      page: ghost.position.boundingRect.pageNumber,
    });
    useAppStore.getState().setCenterTab('timeline');
    onSave();
  }, [selectedText, fileId, ghost.position, onSave]);

  // Initial menu: actions grid
  if (mode === 'menu') {
    return (
      <div className={cn(
        'rounded-xl border border-surface-200 bg-white shadow-xl overflow-hidden',
        'dark:border-surface-700 dark:bg-surface-900',
      )}>
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
