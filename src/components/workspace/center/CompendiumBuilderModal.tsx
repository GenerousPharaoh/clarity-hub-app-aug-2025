/**
 * CompendiumBuilderModal
 *
 * A three-step modal for building a court-ready Exhibit Book / Compendium:
 *   Step 1 - Select & arrange exhibits
 *   Step 2 - Configure cover page & options
 *   Step 3 - Generate, download, and optionally save to project
 */
import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  X,
  ChevronUp,
  ChevronDown,
  Check,
  ArrowRight,
  ArrowLeft,
  Download,
  Save,
  Loader2,
  FileText,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatFileSize } from '@/lib/utils';
import { downloadBlob } from '@/lib/export-utils';
import { generateTabLabels } from '@/services/compendiumGenerator';
import type { CompendiumConfig } from '@/services/compendiumGenerator';
import {
  buildCompendiumItems,
  useCompendiumBuilder,
  useSaveCompendium,
  type CompendiumItem,
} from '@/hooks/useCompendiums';
import type { ExhibitMarker, FileRecord } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

// ── Props ──────────────────────────────────────────────────

interface CompendiumBuilderModalProps {
  open: boolean;
  onClose: () => void;
  exhibits: ExhibitMarker[];
  files: FileRecord[];
  projectId: string;
}

// ── Component ──────────────────────────────────────────────

export function CompendiumBuilderModal({
  open,
  onClose,
  exhibits,
  files,
  projectId,
}: CompendiumBuilderModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 state: items & ordering
  const [tabStyle, setTabStyle] = useState<'letter' | 'number'>('letter');
  const [items, setItems] = useState<CompendiumItem[]>([]);

  // Step 2 state: config
  const [config, setConfig] = useState<CompendiumConfig>({
    title: 'Compendium of Exhibits',
    courtName: '',
    fileNumber: '',
    caseName: '',
    partyName: '',
    counselName: '',
    tabStyle: 'letter',
    includeCoverPage: true,
    includeIndex: true,
    includeTabDividers: true,
    includePageNumbers: true,
  });

  // Step 3 state: generation
  const { generate, progress, result, isGenerating, reset } = useCompendiumBuilder();
  const saveCompendium = useSaveCompendium();

  // Initialize items when modal opens
  useEffect(() => {
    if (open) {
      const built = buildCompendiumItems(exhibits, files, tabStyle);
      setItems(built);
      setStep(1);
      reset();
    }
  }, [open, exhibits, files, tabStyle, reset]);

  // Recalculate tab labels when tab style or selection changes
  const updateTabLabels = useCallback(
    (currentItems: CompendiumItem[], style: 'letter' | 'number') => {
      const selected = currentItems.filter((item) => item.selected);
      const labels = generateTabLabels(selected.length, style);
      let labelIdx = 0;
      return currentItems.map((item) => ({
        ...item,
        tabLabel: item.selected ? labels[labelIdx++] || '' : '',
      }));
    },
    []
  );

  // Toggle selection
  const handleToggle = useCallback(
    (idx: number) => {
      setItems((prev) => {
        const next = [...prev];
        next[idx] = { ...next[idx], selected: !next[idx].selected };
        return updateTabLabels(next, tabStyle);
      });
    },
    [tabStyle, updateTabLabels]
  );

  // Move item up/down
  const handleMove = useCallback(
    (idx: number, direction: 'up' | 'down') => {
      setItems((prev) => {
        const next = [...prev];
        const target = direction === 'up' ? idx - 1 : idx + 1;
        if (target < 0 || target >= next.length) return prev;
        [next[idx], next[target]] = [next[target], next[idx]];
        return updateTabLabels(next, tabStyle);
      });
    },
    [tabStyle, updateTabLabels]
  );

  // Edit display title
  const handleTitleChange = useCallback((idx: number, title: string) => {
    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], displayTitle: title };
      return next;
    });
  }, []);

  // Switch tab style
  const handleTabStyleChange = useCallback(
    (style: 'letter' | 'number') => {
      setTabStyle(style);
      setItems((prev) => updateTabLabels(prev, style));
      setConfig((prev) => ({ ...prev, tabStyle: style }));
    },
    [updateTabLabels]
  );

  // Count selected
  const selectedCount = useMemo(() => items.filter((i) => i.selected).length, [items]);

  // Generate the compendium
  const handleGenerate = useCallback(async () => {
    const selectedItems = items.filter((i) => i.selected);
    if (selectedItems.length === 0) return;
    try {
      await generate({ ...config, tabStyle }, selectedItems);
    } catch {
      // Error already toasted in hook
    }
  }, [items, config, tabStyle, generate]);

  // Download the result
  const handleDownload = useCallback(() => {
    if (!result) return;
    const safeTitle = config.title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-');
    downloadBlob(result.blob, `${safeTitle}.pdf`);
  }, [result, config.title]);

  // Save to project
  const handleSave = useCallback(() => {
    if (!result || !user) return;
    const safeTitle = config.title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-');
    const fileName = `${safeTitle}-${Date.now()}.pdf`;
    saveCompendium.mutate({
      projectId,
      userId: user.id,
      blob: result.blob,
      fileName,
    });
  }, [result, user, config.title, projectId, saveCompendium]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-surface-950/30 backdrop-blur-sm dark:bg-surface-950/60"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-labelledby="compendium-dialog-title"
        className={cn(
          'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
          'w-[90vw] max-w-2xl max-h-[85vh] flex flex-col',
          'rounded-2xl border border-translucent bg-white shadow-overlay',
          'dark:bg-surface-800',
          'animate-in fade-in-0 zoom-in-95 duration-150'
        )}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-translucent px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30">
              <BookOpen className="h-4 w-4 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2
                id="compendium-dialog-title"
                className="font-heading text-sm font-semibold text-surface-800 dark:text-surface-100"
              >
                Build Exhibit Book
              </h2>
              <p className="text-xs text-surface-400 dark:text-surface-500">
                Step {step} of 3
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-xl text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-700"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex shrink-0 items-center gap-1 border-b border-translucent px-5 py-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-1">
              <div
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold',
                  s === step
                    ? 'bg-primary-600 text-white'
                    : s < step
                      ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                      : 'bg-surface-100 text-surface-400 dark:bg-surface-700 dark:text-surface-500'
                )}
              >
                {s < step ? <Check className="h-3 w-3" /> : s}
              </div>
              <span
                className={cn(
                  'text-xs',
                  s === step ? 'font-medium text-surface-700 dark:text-surface-200' : 'text-surface-400 dark:text-surface-500'
                )}
              >
                {s === 1 ? 'Select' : s === 2 ? 'Configure' : 'Generate'}
              </span>
              {s < 3 && (
                <div className="border-translucent mx-1 h-px w-6 border-t" />
              )}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {step === 1 && (
            <StepSelect
              items={items}
              tabStyle={tabStyle}
              onToggle={handleToggle}
              onMove={handleMove}
              onTitleChange={handleTitleChange}
              onTabStyleChange={handleTabStyleChange}
            />
          )}
          {step === 2 && (
            <StepConfigure config={config} onChange={setConfig} />
          )}
          {step === 3 && (
            <StepGenerate
              progress={progress}
              result={result}
              isGenerating={isGenerating}
              isSaving={saveCompendium.isPending}
              isSaved={saveCompendium.isSuccess}
              onGenerate={handleGenerate}
              onDownload={handleDownload}
              onSave={handleSave}
              selectedCount={selectedCount}
            />
          )}
        </div>

        {/* Footer navigation */}
        <div className="flex shrink-0 items-center justify-between border-t border-translucent px-5 py-3">
          <button
            onClick={() => {
              if (step === 1) onClose();
              else setStep((s) => (s - 1) as 1 | 2 | 3);
            }}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium text-surface-500 transition-colors hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-700"
          >
            {step === 1 ? (
              'Cancel'
            ) : (
              <>
                <ArrowLeft className="h-3 w-3" /> Back
              </>
            )}
          </button>

          {step < 3 ? (
            <button
              onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
              disabled={step === 1 && selectedCount === 0}
              className={cn(
                'flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-sm font-medium text-white transition-colors',
                'bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              Next <ArrowRight className="h-3 w-3" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="rounded-xl px-3 py-1.5 text-sm font-medium text-surface-500 transition-colors hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-700"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// ── Step 1: Select & Arrange ───────────────────────────────

function StepSelect({
  items,
  tabStyle,
  onToggle,
  onMove,
  onTitleChange,
  onTabStyleChange,
}: {
  items: CompendiumItem[];
  tabStyle: 'letter' | 'number';
  onToggle: (idx: number) => void;
  onMove: (idx: number, dir: 'up' | 'down') => void;
  onTitleChange: (idx: number, title: string) => void;
  onTabStyleChange: (style: 'letter' | 'number') => void;
}) {
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      {/* Tab style toggle */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-surface-600 dark:text-surface-300">
          {items.filter((i) => i.selected).length} of {items.length} exhibits selected
        </p>
        <div className="flex items-center gap-1 rounded-xl border border-translucent p-0.5">
          <button
            onClick={() => onTabStyleChange('letter')}
            className={cn(
              'rounded-md px-2.5 py-1 text-sm font-medium transition-colors',
              tabStyle === 'letter'
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                : 'text-surface-400 hover:text-surface-600 dark:hover:text-surface-300'
            )}
          >
            A, B, C
          </button>
          <button
            onClick={() => onTabStyleChange('number')}
            className={cn(
              'rounded-md px-2.5 py-1 text-sm font-medium transition-colors',
              tabStyle === 'number'
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                : 'text-surface-400 hover:text-surface-600 dark:hover:text-surface-300'
            )}
          >
            1, 2, 3
          </button>
        </div>
      </div>

      {/* Item list */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-300 bg-white/80 px-4 py-10 text-center dark:border-surface-700 dark:bg-surface-900/60">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-100 dark:bg-surface-800">
            <FileText className="h-5 w-5 text-surface-400 dark:text-surface-500" />
          </div>
          <h3 className="mt-3 font-heading text-xs font-semibold text-surface-700 dark:text-surface-200">
            No exhibits found
          </h3>
          <p className="mt-1 text-xs text-surface-400 dark:text-surface-500">
            Link files to exhibits first.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div
              key={item.exhibitDbId}
              className={cn(
                'flex items-center gap-2 rounded-xl border p-2.5 transition-colors',
                item.selected
                  ? 'border-primary-200 bg-primary-50/50 dark:border-primary-800/40 dark:bg-primary-900/10'
                  : 'border-translucent bg-surface-50 opacity-60 dark:bg-surface-800/50'
              )}
            >
              {/* Checkbox */}
              <button
                onClick={() => onToggle(idx)}
                className={cn(
                  'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                  item.selected
                    ? 'border-primary-500 bg-primary-500 text-white'
                    : 'border-surface-300 dark:border-surface-600'
                )}
              >
                {item.selected && <Check className="h-2.5 w-2.5" />}
              </button>

              {/* Tab label badge */}
              {item.selected && (
                <span className="flex h-6 min-w-[32px] shrink-0 items-center justify-center rounded-lg bg-primary-100 px-1.5 text-xs font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                  {item.tabLabel}
                </span>
              )}

              {/* Title */}
              <div className="min-w-0 flex-1">
                {editingIdx === idx ? (
                  <input
                    type="text"
                    value={item.displayTitle}
                    onChange={(e) => onTitleChange(idx, e.target.value)}
                    onBlur={() => setEditingIdx(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') setEditingIdx(null);
                    }}
                    autoFocus
                    className={cn(
                      'w-full rounded-lg border px-2 py-1 text-xs',
                      'border-primary-300 bg-white text-surface-700 outline-none',
                      'focus:ring-2 focus:ring-primary-500/15',
                      'dark:border-primary-700 dark:bg-surface-900 dark:text-surface-200'
                    )}
                  />
                ) : (
                  <button
                    onClick={() => setEditingIdx(idx)}
                    className="w-full text-left"
                  >
                    <p className="truncate text-sm font-medium text-surface-700 dark:text-surface-200" title={item.displayTitle}>
                      {item.displayTitle}
                    </p>
                    <p className="truncate text-xs text-surface-400" title={`${item.exhibitId} · ${item.fileName}`}>
                      {item.exhibitId} &middot; {item.fileName}
                    </p>
                  </button>
                )}
              </div>

              {/* Move buttons */}
              {item.selected && (
                <div className="flex shrink-0 flex-col gap-0.5">
                  <button
                    onClick={() => onMove(idx, 'up')}
                    disabled={idx === 0}
                    className="rounded p-0.5 text-surface-400 transition-colors hover:bg-surface-200 hover:text-surface-600 disabled:opacity-30 dark:hover:bg-surface-700"
                    title="Move up"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => onMove(idx, 'down')}
                    disabled={idx === items.length - 1}
                    className="rounded p-0.5 text-surface-400 transition-colors hover:bg-surface-200 hover:text-surface-600 disabled:opacity-30 dark:hover:bg-surface-700"
                    title="Move down"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Step 2: Configure ──────────────────────────────────────

function StepConfigure({
  config,
  onChange,
}: {
  config: CompendiumConfig;
  onChange: (config: CompendiumConfig) => void;
}) {
  const update = (partial: Partial<CompendiumConfig>) =>
    onChange({ ...config, ...partial });

  return (
    <div className="space-y-5">
      {/* Document info */}
      <div className="space-y-3">
        <h3 className="font-heading text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
          Document Information
        </h3>

        <InputField
          label="Title"
          value={config.title}
          onChange={(v) => update({ title: v })}
          placeholder="Compendium of Exhibits"
        />
        <InputField
          label="Court / Tribunal"
          value={config.courtName ?? ''}
          onChange={(v) => update({ courtName: v })}
          placeholder="e.g., Ontario Superior Court of Justice"
        />
        <InputField
          label="File / Court Number"
          value={config.fileNumber ?? ''}
          onChange={(v) => update({ fileNumber: v })}
          placeholder="e.g., CV-24-12345"
        />
        <InputField
          label="Case Name / Style of Cause"
          value={config.caseName ?? ''}
          onChange={(v) => update({ caseName: v })}
          placeholder="e.g., Smith v. Jones et al."
        />
        <InputField
          label="Party Description"
          value={config.partyName ?? ''}
          onChange={(v) => update({ partyName: v })}
          placeholder="e.g., Applicant's Compendium"
        />
        <InputField
          label="Counsel Name"
          value={config.counselName ?? ''}
          onChange={(v) => update({ counselName: v })}
          placeholder="e.g., Jane Doe, Self-Represented"
        />
      </div>

      {/* Options */}
      <div className="space-y-3">
        <h3 className="font-heading text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
          Options
        </h3>

        <CheckboxField
          label="Include cover page"
          checked={config.includeCoverPage}
          onChange={(v) => update({ includeCoverPage: v })}
        />
        <CheckboxField
          label="Include table of contents"
          checked={config.includeIndex}
          onChange={(v) => update({ includeIndex: v })}
        />
        <CheckboxField
          label="Include tab divider pages"
          checked={config.includeTabDividers}
          onChange={(v) => update({ includeTabDividers: v })}
        />
        <CheckboxField
          label="Add page numbers"
          checked={config.includePageNumbers}
          onChange={(v) => update({ includePageNumbers: v })}
        />
      </div>
    </div>
  );
}

// ── Step 3: Generate ───────────────────────────────────────

function StepGenerate({
  progress,
  result,
  isGenerating,
  isSaving,
  isSaved,
  onGenerate,
  onDownload,
  onSave,
  selectedCount,
}: {
  progress: { stage: string; current: number; total: number } | null;
  result: { blob: Blob; pageCount: number; fileSize: number } | null;
  isGenerating: boolean;
  isSaving: boolean;
  isSaved: boolean;
  onGenerate: () => void;
  onDownload: () => void;
  onSave: () => void;
  selectedCount: number;
}) {
  return (
    <div className="flex flex-col items-center py-6">
      {!result && !isGenerating && (
        <>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 dark:bg-primary-900/30">
            <BookOpen className="h-7 w-7 text-primary-600 dark:text-primary-400" />
          </div>
          <h3 className="mt-4 font-heading text-sm font-semibold text-surface-700 dark:text-surface-200">
            Ready to Generate
          </h3>
          <p className="mt-1 text-center text-xs text-surface-400">
            {selectedCount} exhibit{selectedCount !== 1 ? 's' : ''} will be merged into a single PDF.
          </p>
          <button
            onClick={onGenerate}
            disabled={selectedCount === 0}
            className={cn(
              'mt-5 flex items-center gap-2 rounded-xl px-5 py-2.5',
              'bg-primary-600 text-sm font-medium text-white',
              'transition-colors hover:bg-primary-700',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <BookOpen className="h-4 w-4" />
            Generate Compendium
          </button>
        </>
      )}

      {isGenerating && progress && (
        <>
          <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
          <h3 className="mt-4 font-heading text-sm font-semibold text-surface-700 dark:text-surface-200">
            {progress.stage}...
          </h3>
          <p className="mt-1 text-xs text-surface-400">
            {progress.current} / {progress.total}
          </p>
          {/* Progress bar */}
          <div className="mt-3 h-1.5 w-48 overflow-hidden rounded-full bg-surface-100 dark:bg-surface-700">
            <div
              className="h-full rounded-full bg-primary-500 transition-all duration-300"
              style={{
                width: `${Math.round((progress.current / Math.max(progress.total, 1)) * 100)}%`,
              }}
            />
          </div>
        </>
      )}

      {result && !isGenerating && (
        <>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 dark:bg-green-900/30">
            <Check className="h-7 w-7 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="mt-4 font-heading text-sm font-semibold text-surface-700 dark:text-surface-200">
            Compendium Ready
          </h3>
          <div className="mt-2 flex items-center gap-3 text-xs text-surface-400">
            <span>{result.pageCount} pages</span>
            <span className="h-1 w-1 rounded-full bg-surface-300" />
            <span>{formatFileSize(result.fileSize)}</span>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={onDownload}
              className={cn(
                'flex items-center gap-2 rounded-xl px-4 py-2',
                'bg-primary-600 text-sm font-medium text-white',
                'transition-colors hover:bg-primary-700'
              )}
            >
              <Download className="h-3.5 w-3.5" />
              Download PDF
            </button>
            <button
              onClick={onSave}
              disabled={isSaving || isSaved}
              className={cn(
                'flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors',
                isSaved
                  ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800/50 dark:bg-green-900/20 dark:text-green-400'
                  : 'border-translucent text-surface-600 hover:bg-surface-50 dark:text-surface-300 dark:hover:bg-surface-700',
                'disabled:opacity-70 disabled:cursor-not-allowed'
              )}
            >
              {isSaving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : isSaved ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              {isSaved ? 'Saved' : 'Save to Project'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Shared form fields ─────────────────────────────────────

function InputField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-surface-500 dark:text-surface-400">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full rounded-xl border px-3 py-2 text-xs transition-colors',
          'border-surface-200 bg-surface-50/80 text-surface-700 placeholder-surface-300',
          'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/15',
          'dark:border-surface-700 dark:bg-surface-800/70 dark:text-surface-200 dark:placeholder-surface-600',
          'dark:focus:border-primary-400 dark:focus:ring-primary-400/20'
        )}
      />
    </div>
  );
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
          checked
            ? 'border-primary-500 bg-primary-500 text-white'
            : 'border-surface-300 dark:border-surface-600'
        )}
      >
        {checked && <Check className="h-2.5 w-2.5" />}
      </button>
      <span className="text-xs text-surface-600 dark:text-surface-300">{label}</span>
    </label>
  );
}
