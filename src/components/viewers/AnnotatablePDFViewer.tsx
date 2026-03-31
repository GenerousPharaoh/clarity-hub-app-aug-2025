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
} from 'react-pdf-highlighter-extended';
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

// Required CSS for react-pdf-highlighter-extended + pdfjs
import 'react-pdf-highlighter-extended/dist/esm/style/pdf_viewer.css';
import 'react-pdf-highlighter-extended/dist/esm/style/PdfHighlighter.css';
import 'react-pdf-highlighter-extended/dist/esm/style/TextHighlight.css';
import 'react-pdf-highlighter-extended/dist/esm/style/AreaHighlight.css';
import 'react-pdf-highlighter-extended/dist/esm/style/MouseSelection.css';

// PDF.js worker — Vite's ?url suffix gives us the correct production asset path
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

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

  return (
    <div className="relative flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-surface-200 px-2 shadow-sm dark:border-surface-700">
        {/* File name */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <FileText className="h-3.5 w-3.5 shrink-0 text-red-500" />
          <span
            className="truncate text-sm font-medium text-surface-600 dark:text-surface-300"
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

      {/* PDF viewer area */}
      <div className="relative flex-1 overflow-hidden">
        <PdfLoader
          document={url}
          workerSrc={pdfjsWorkerUrl}
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
        position: 'relative',
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
      onChange={(boundingRect) => {
        toggleEditInProgress(false);
        // Area highlight edit — keep refs alive for potential future use
        void viewportToScaled(boundingRect);
        void screenshot;
      }}
      bounds={highlightBindings.textLayer}
      onEditStart={() => toggleEditInProgress(true)}
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
  const [color, setColor] = useState<string>(HIGHLIGHT_COLORS[0].value);
  const [comment, setComment] = useState('');
  const [expanded, setExpanded] = useState(false);

  const { updateTipPosition } = usePdfHighlighterContext();

  useLayoutEffect(() => {
    updateTipPosition();
  }, [expanded, updateTipPosition]);

  const handleSave = useCallback(() => {
    createAnnotation.mutate(
      {
        file_id: fileId,
        project_id: projectId,
        annotation_type: comment.trim() ? 'comment' : 'highlight',
        page_number: ghost.position.boundingRect.pageNumber,
        position_data: ghost.position,
        selected_text: selectedText || undefined,
        comment: comment.trim() || undefined,
        color,
      },
      { onSuccess: onSave },
    );
  }, [
    createAnnotation,
    fileId,
    projectId,
    ghost.position,
    selectedText,
    comment,
    color,
    onSave,
  ]);

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className={cn(
          'flex items-center gap-1.5 rounded-lg px-3 py-1.5',
          'border border-surface-200 bg-white shadow-lg',
          'text-xs font-medium text-surface-600',
          'transition-colors hover:bg-surface-50',
          'dark:border-surface-700 dark:bg-surface-900 dark:text-surface-300',
          'dark:hover:bg-surface-800',
        )}
      >
        <Save className="h-3 w-3" />
        Highlight
      </button>
    );
  }

  return (
    <div
      className={cn(
        'w-64 rounded-xl border border-surface-200 bg-white p-3 shadow-xl',
        'dark:border-surface-700 dark:bg-surface-900',
      )}
    >
      {/* Color picker */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-surface-400">
          Color
        </span>
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
              aria-label={`${c.name} highlight`}
              title={c.name}
            />
          ))}
        </div>
      </div>

      {/* Comment input */}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Add a note (optional)"
        rows={2}
        className={cn(
          'mt-2 w-full resize-none rounded-lg border border-surface-200 px-2.5 py-1.5',
          'text-xs text-surface-700 placeholder:text-surface-400',
          'focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-300',
          'dark:border-surface-700 dark:bg-surface-800 dark:text-surface-200',
          'dark:placeholder:text-surface-600 dark:focus:border-primary-600 dark:focus:ring-primary-600',
        )}
      />

      {/* Save button */}
      <div className="mt-2 flex justify-end">
        <button
          onClick={handleSave}
          disabled={createAnnotation.isPending}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-3 py-1.5',
            'bg-primary-600 text-xs font-medium text-white',
            'transition-colors hover:bg-primary-700',
            'disabled:opacity-50',
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
