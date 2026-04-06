import { useState } from 'react';
import {
  Scale,
  FileText,
  Search,
  BookOpen,
  ShieldCheck,
  Image,
  Headphones,
  Video,
  DollarSign,
  PenTool,
  GitCompare,
  Quote,
  FileSearch,
  Gavel,
  Calculator,
  Mail,
  Calendar,
  AlertTriangle,
  BarChart3,
  Swords,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  PROMPT_TEMPLATES,
  TEMPLATE_CATEGORIES,
  type PromptTemplate,
  type TemplateCategory,
} from '@/lib/promptTemplates';

// ── Props ──────────────────────────────────────────────────────────

interface SuggestedPromptsProps {
  onSelectPrompt: (prompt: string) => void;
  selectedFileType?: string | null;
  selectedFileName?: string | null;
  compact?: boolean;
  /** When true, show the full task library with category filters */
  showTaskLibrary?: boolean;
}

// ── Icon lookup ────────────────────────────────────────────────────

const ICON_MAP: Record<string, ReactNode> = {
  FileText: <FileText className="h-3.5 w-3.5" />,
  GitCompare: <GitCompare className="h-3.5 w-3.5" />,
  Quote: <Quote className="h-3.5 w-3.5" />,
  ShieldCheck: <ShieldCheck className="h-3.5 w-3.5" />,
  Scale: <Scale className="h-3.5 w-3.5" />,
  FileSearch: <FileSearch className="h-3.5 w-3.5" />,
  Gavel: <Gavel className="h-3.5 w-3.5" />,
  Calculator: <Calculator className="h-3.5 w-3.5" />,
  PenTool: <PenTool className="h-3.5 w-3.5" />,
  Mail: <Mail className="h-3.5 w-3.5" />,
  Calendar: <Calendar className="h-3.5 w-3.5" />,
  AlertTriangle: <AlertTriangle className="h-3.5 w-3.5" />,
  BarChart3: <BarChart3 className="h-3.5 w-3.5" />,
  Swords: <Swords className="h-3.5 w-3.5" />,
  DollarSign: <DollarSign className="h-3.5 w-3.5" />,
  Search: <Search className="h-3.5 w-3.5" />,
  BookOpen: <BookOpen className="h-3.5 w-3.5" />,
  Image: <Image className="h-3.5 w-3.5" />,
  Headphones: <Headphones className="h-3.5 w-3.5" />,
  Video: <Video className="h-3.5 w-3.5" />,
};

function getTemplateIcon(template: PromptTemplate): ReactNode {
  return ICON_MAP[template.icon] ?? <FileText className="h-3.5 w-3.5" />;
}

// ── File-specific prompts (kept for when a file is selected) ──────

interface FilePrompt {
  icon: ReactNode;
  label: string;
  text: string;
}

function getFilePrompts(fileType: string | null, fileName: string | null): FilePrompt[] {
  const name = fileName ? `"${fileName}"` : 'this file';

  switch (fileType) {
    case 'pdf':
    case 'document':
    case 'text':
      return [
        {
          icon: <FileText className="h-3.5 w-3.5" />,
          label: 'Summarize',
          text: `Summarize the key facts, dates, and parties in ${name}.`,
        },
        {
          icon: <Scale className="h-3.5 w-3.5" />,
          label: 'Legal Issues',
          text: `Identify the legal issues raised by ${name}.`,
        },
        {
          icon: <Search className="h-3.5 w-3.5" />,
          label: 'Timeline',
          text: `Extract a chronology of events from ${name}.`,
        },
        {
          icon: <ShieldCheck className="h-3.5 w-3.5" />,
          label: 'Contradictions',
          text: `Find contradictions or inconsistencies in ${name}.`,
        },
      ];
    case 'image':
      return [
        {
          icon: <Image className="h-3.5 w-3.5" />,
          label: 'Describe',
          text: 'Describe this image and its relevance as evidence.',
        },
        {
          icon: <Search className="h-3.5 w-3.5" />,
          label: 'Extract Text',
          text: 'Extract any visible text from this image.',
        },
      ];
    case 'audio':
      return [
        {
          icon: <Headphones className="h-3.5 w-3.5" />,
          label: 'Transcribe',
          text: `Transcribe the key statements in ${name}.`,
        },
        {
          icon: <Search className="h-3.5 w-3.5" />,
          label: 'Key Admissions',
          text: 'Identify any admissions or significant statements.',
        },
      ];
    case 'video':
      return [
        {
          icon: <Video className="h-3.5 w-3.5" />,
          label: 'Transcribe',
          text: `Transcribe the key statements in ${name}.`,
        },
        {
          icon: <Search className="h-3.5 w-3.5" />,
          label: 'Key Admissions',
          text: 'Identify any admissions or significant statements.',
        },
      ];
    default:
      return [];
  }
}

// ── Category color accents ─────────────────────────────────────────

const CATEGORY_COLORS: Record<TemplateCategory, string> = {
  evidence_analysis: 'text-blue-500 dark:text-blue-400',
  legal_research: 'text-violet-500 dark:text-violet-400',
  drafting: 'text-emerald-500 dark:text-emerald-400',
  timeline: 'text-amber-500 dark:text-amber-400',
  strategy: 'text-rose-500 dark:text-rose-400',
};

// ── Component ──────────────────────────────────────────────────────

export function SuggestedPrompts({
  onSelectPrompt,
  selectedFileType,
  selectedFileName,
  compact = false,
  showTaskLibrary = false,
}: SuggestedPromptsProps) {
  const [activeCategory, setActiveCategory] = useState<TemplateCategory | 'all'>('all');
  const filePrompts = selectedFileType ? getFilePrompts(selectedFileType, selectedFileName ?? null) : [];

  // If a file is selected and we are NOT in full task-library mode, show file-specific prompts
  if (filePrompts.length > 0 && !showTaskLibrary) {
    const visiblePrompts = compact ? filePrompts.slice(0, 4) : filePrompts;
    return (
      <div className="w-full">
        <p className="mb-2 px-4 text-sm font-medium uppercase tracking-wider text-surface-400 dark:text-surface-500">
          Suggestions for selected file
        </p>
        <div
          className={
            compact
              ? 'grid items-stretch grid-cols-1 gap-2 px-3'
              : 'grid items-stretch grid-cols-[repeat(auto-fit,minmax(164px,1fr))] gap-2 px-4'
          }
        >
          {visiblePrompts.map((prompt) => (
            <button
              key={prompt.label}
              onClick={() => onSelectPrompt(prompt.text)}
              className={
                compact
                  ? 'group flex h-full items-start gap-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-white px-2.5 py-2 text-left shadow-sm hover:border-accent-300 hover:bg-accent-50/50 dark:bg-surface-800 dark:hover:border-accent-700 dark:hover:bg-accent-900/20'
                  : 'group flex h-full min-h-20 items-start gap-2.5 rounded-lg border border-surface-200 dark:border-surface-700 bg-white p-3 text-left shadow-sm hover:border-accent-300 hover:bg-accent-50/50 dark:bg-surface-800 dark:hover:border-accent-700 dark:hover:bg-accent-900/20'
              }
            >
              <div className="mt-0.5 shrink-0 text-surface-400 transition-colors group-hover:text-accent-500 dark:text-surface-500 dark:group-hover:text-accent-400">
                {prompt.icon}
              </div>
              <span
                className="line-clamp-2 text-xs leading-snug text-surface-600 transition-colors group-hover:text-surface-800 dark:text-surface-400 dark:group-hover:text-surface-200"
                title={prompt.label}
              >
                {prompt.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Template library view
  const filteredTemplates =
    activeCategory === 'all'
      ? PROMPT_TEMPLATES
      : PROMPT_TEMPLATES.filter((t) => t.category === activeCategory);

  const visibleTemplates = compact && !showTaskLibrary ? filteredTemplates.slice(0, 6) : filteredTemplates;

  return (
    <div className="w-full">
      {/* Category filter chips */}
      <div className={cn('mb-3 flex flex-wrap gap-1.5', compact ? 'px-3' : 'px-4')}>
        {TEMPLATE_CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={cn(
              'rounded-full px-2.5 py-1 text-xs font-medium transition-all',
              activeCategory === cat.key
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
                : 'text-surface-500 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-700'
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Template grid */}
      <div
        className={cn(
          'grid items-stretch gap-2',
          compact
            ? 'grid-cols-1 px-3'
            : 'grid-cols-[repeat(auto-fit,minmax(180px,1fr))] px-4'
        )}
      >
        {visibleTemplates.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelectPrompt(template.promptText)}
            className="group flex h-full items-start gap-2.5 rounded-lg border border-surface-200 bg-white p-3 text-left shadow-sm transition-all hover:border-accent-300 hover:bg-accent-50/50 hover:shadow-md dark:border-surface-700 dark:bg-surface-800 dark:hover:border-accent-700 dark:hover:bg-accent-900/20"
          >
            <div
              className={cn(
                'mt-0.5 shrink-0 transition-colors',
                CATEGORY_COLORS[template.category]
              )}
            >
              {getTemplateIcon(template)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium leading-snug text-surface-700 transition-colors group-hover:text-surface-900 dark:text-surface-200 dark:group-hover:text-surface-50">
                {template.name}
              </p>
              {!compact && (
                <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-surface-400 dark:text-surface-500">
                  {template.description}
                </p>
              )}
            </div>
            {template.suggestedEffort === 'deep' && (
              <span className="mt-0.5 shrink-0 rounded-full bg-violet-100 px-1.5 py-0.5 text-[9px] font-medium text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
                Deep
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
