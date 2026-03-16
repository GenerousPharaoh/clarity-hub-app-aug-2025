import { Scale, FileText, Search, BookOpen, ShieldCheck, Lightbulb, Image, Headphones, Video, DollarSign, PenTool } from 'lucide-react';
import type { ReactNode } from 'react';

interface SuggestedPromptsProps {
  onSelectPrompt: (prompt: string) => void;
  selectedFileType?: string | null;
  selectedFileName?: string | null;
  compact?: boolean;
}

interface Prompt {
  icon: ReactNode;
  label: string;
  text: string;
}

const GENERAL_PROMPTS: Prompt[] = [
  {
    icon: <Scale className="h-3.5 w-3.5" />,
    label: 'Bardal Factors',
    text: 'Calculate reasonable notice using Bardal factors for this employee.',
  },
  {
    icon: <Search className="h-3.5 w-3.5" />,
    label: 'Constructive Dismissal',
    text: 'Is this a constructive dismissal? Analyze the changes to employment terms.',
  },
  {
    icon: <ShieldCheck className="h-3.5 w-3.5" />,
    label: 'Mitigation',
    text: 'What are the employee\'s mitigation obligations and how long should they search?',
  },
  {
    icon: <DollarSign className="h-3.5 w-3.5" />,
    label: 'Costs Exposure',
    text: 'Estimate costs exposure under the Ontario Rules of Civil Procedure.',
  },
  {
    icon: <PenTool className="h-3.5 w-3.5" />,
    label: 'Demand Letter',
    text: 'Draft a demand letter based on the facts of this case.',
  },
  {
    icon: <BookOpen className="h-3.5 w-3.5" />,
    label: 'ESA Entitlements',
    text: 'Calculate minimum ESA entitlements for termination and severance pay.',
  },
];

function getFilePrompts(fileType: string | null, fileName: string | null): Prompt[] {
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
          text: `Describe this image and its relevance as evidence.`,
        },
        {
          icon: <Search className="h-3.5 w-3.5" />,
          label: 'Extract Text',
          text: `Extract any visible text from this image.`,
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
          text: `Identify any admissions or significant statements.`,
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
          text: `Identify any admissions or significant statements.`,
        },
      ];
    default:
      return [];
  }
}

export function SuggestedPrompts({
  onSelectPrompt,
  selectedFileType,
  selectedFileName,
  compact = false,
}: SuggestedPromptsProps) {
  const filePrompts = selectedFileType ? getFilePrompts(selectedFileType, selectedFileName ?? null) : [];
  const prompts = filePrompts.length > 0 ? filePrompts : GENERAL_PROMPTS;
  const visiblePrompts = compact ? prompts.slice(0, 4) : prompts;

  return (
    <div className="w-full">
      {filePrompts.length > 0 && (
        <p className="mb-2 px-4 text-[10px] font-medium uppercase tracking-wider text-surface-400 dark:text-surface-500">
          Suggestions for selected file
        </p>
      )}
      <div
        className={compact
          ? 'grid grid-cols-1 gap-2 px-3'
          : 'grid grid-cols-[repeat(auto-fit,minmax(164px,1fr))] gap-2 px-4'}
      >
        {visiblePrompts.map((prompt) => (
          <button
            key={prompt.label}
            onClick={() => onSelectPrompt(prompt.text)}
            className={compact
              ? 'group interactive-lift flex items-start gap-2 rounded-lg border border-translucent bg-white px-2.5 py-2 text-left shadow-sm hover:border-accent-300 hover:bg-accent-50/50 dark:bg-surface-800 dark:hover:border-accent-700 dark:hover:bg-accent-900/20'
              : 'group interactive-lift flex min-h-20 items-start gap-2.5 rounded-lg border border-translucent bg-white p-3 text-left shadow-sm hover:border-accent-300 hover:bg-accent-50/50 dark:bg-surface-800 dark:hover:border-accent-700 dark:hover:bg-accent-900/20'}
          >
            <div className="mt-0.5 shrink-0 text-surface-400 transition-colors group-hover:text-accent-500 dark:text-surface-500 dark:group-hover:text-accent-400">
              {prompt.icon}
            </div>
            <span className={compact
              ? 'text-[11px] leading-snug text-surface-600 transition-colors group-hover:text-surface-800 dark:text-surface-400 dark:group-hover:text-surface-200'
              : 'text-xs leading-snug text-surface-600 transition-colors group-hover:text-surface-800 dark:text-surface-400 dark:group-hover:text-surface-200'}
            >
              {prompt.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
