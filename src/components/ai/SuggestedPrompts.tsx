import { Scale, FileText, Search, BookOpen, ShieldCheck, Lightbulb, Image, Headphones, Video } from 'lucide-react';
import type { ReactNode } from 'react';

interface SuggestedPromptsProps {
  onSelectPrompt: (prompt: string) => void;
  selectedFileType?: string | null;
  selectedFileName?: string | null;
}

interface Prompt {
  icon: ReactNode;
  label: string;
  text: string;
}

const GENERAL_PROMPTS: Prompt[] = [
  {
    icon: <Scale className="h-3.5 w-3.5" />,
    label: 'Analyze legal position',
    text: 'Analyze the strengths and weaknesses of my legal position based on the uploaded documents.',
  },
  {
    icon: <Search className="h-3.5 w-3.5" />,
    label: 'Find relevant case law',
    text: 'What relevant case law applies to the issues in my case?',
  },
  {
    icon: <BookOpen className="h-3.5 w-3.5" />,
    label: 'Explain a legal concept',
    text: 'Explain the legal test for constructive dismissal in Ontario.',
  },
  {
    icon: <ShieldCheck className="h-3.5 w-3.5" />,
    label: 'Review for risks',
    text: 'Review the evidence and identify any potential risks or weaknesses in my arguments.',
  },
  {
    icon: <Lightbulb className="h-3.5 w-3.5" />,
    label: 'Suggest strategy',
    text: 'Based on the facts of my case, what legal strategy would you recommend?',
  },
  {
    icon: <FileText className="h-3.5 w-3.5" />,
    label: 'Draft an argument',
    text: 'Help me draft a legal argument based on the evidence in this case.',
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
          label: 'Summarize this document',
          text: `Summarize the key points from ${name}.`,
        },
        {
          icon: <Search className="h-3.5 w-3.5" />,
          label: 'Extract key facts',
          text: `Extract all key facts, dates, and names from ${name}.`,
        },
        {
          icon: <Scale className="h-3.5 w-3.5" />,
          label: 'Legal significance',
          text: `What is the legal significance of ${name}? How does it support or weaken my position?`,
        },
        {
          icon: <ShieldCheck className="h-3.5 w-3.5" />,
          label: 'Identify contradictions',
          text: `Are there any contradictions or inconsistencies in ${name}?`,
        },
      ];
    case 'image':
      return [
        {
          icon: <Image className="h-3.5 w-3.5" />,
          label: 'Describe this image',
          text: `Describe what you see in ${name} and its potential relevance as evidence.`,
        },
        {
          icon: <Search className="h-3.5 w-3.5" />,
          label: 'Extract text from image',
          text: `Extract any visible text, dates, or identifiable information from ${name}.`,
        },
        {
          icon: <Scale className="h-3.5 w-3.5" />,
          label: 'Evidentiary value',
          text: `What is the evidentiary value of ${name}? What does it prove or demonstrate?`,
        },
        {
          icon: <ShieldCheck className="h-3.5 w-3.5" />,
          label: 'Authenticity concerns',
          text: `Are there any concerns about the authenticity or admissibility of ${name}?`,
        },
      ];
    case 'audio':
      return [
        {
          icon: <Headphones className="h-3.5 w-3.5" />,
          label: 'Transcribe audio',
          text: `Transcribe and summarize the contents of ${name}.`,
        },
        {
          icon: <Search className="h-3.5 w-3.5" />,
          label: 'Key statements',
          text: `Identify the key statements or admissions made in ${name}.`,
        },
        {
          icon: <Scale className="h-3.5 w-3.5" />,
          label: 'Legal relevance',
          text: `What is the legal relevance of the statements in ${name}?`,
        },
        {
          icon: <ShieldCheck className="h-3.5 w-3.5" />,
          label: 'Admissibility issues',
          text: `Are there any admissibility concerns with ${name} as evidence?`,
        },
      ];
    case 'video':
      return [
        {
          icon: <Video className="h-3.5 w-3.5" />,
          label: 'Analyze video content',
          text: `Describe and analyze the content of ${name}.`,
        },
        {
          icon: <Search className="h-3.5 w-3.5" />,
          label: 'Key moments',
          text: `Identify the key moments and statements in ${name}.`,
        },
        {
          icon: <Scale className="h-3.5 w-3.5" />,
          label: 'Evidentiary value',
          text: `What is the evidentiary value of ${name}? What does it prove?`,
        },
        {
          icon: <ShieldCheck className="h-3.5 w-3.5" />,
          label: 'Admissibility concerns',
          text: `Are there any admissibility or authenticity concerns with ${name}?`,
        },
      ];
    default:
      return [];
  }
}

export function SuggestedPrompts({ onSelectPrompt, selectedFileType, selectedFileName }: SuggestedPromptsProps) {
  const filePrompts = selectedFileType ? getFilePrompts(selectedFileType, selectedFileName ?? null) : [];
  const prompts = filePrompts.length > 0 ? filePrompts : GENERAL_PROMPTS;

  return (
    <div className="w-full">
      {filePrompts.length > 0 && (
        <p className="mb-2 px-4 text-[10px] font-medium uppercase tracking-wider text-surface-400 dark:text-surface-500">
          Suggestions for selected file
        </p>
      )}
      <div className="grid grid-cols-1 gap-2 px-4 sm:grid-cols-2">
        {prompts.map((prompt) => (
          <button
            key={prompt.label}
            onClick={() => onSelectPrompt(prompt.text)}
            className="group flex items-start gap-2.5 rounded-lg border border-surface-200 bg-white p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent-300 hover:bg-accent-50/50 hover:shadow-md dark:border-surface-700 dark:bg-surface-800 dark:hover:border-accent-700 dark:hover:bg-accent-900/20 dark:hover:shadow-lg dark:hover:shadow-surface-950/30"
          >
            <div className="mt-0.5 shrink-0 text-surface-400 transition-colors group-hover:text-accent-500 dark:text-surface-500 dark:group-hover:text-accent-400">
              {prompt.icon}
            </div>
            <span className="text-xs leading-relaxed text-surface-600 transition-colors group-hover:text-surface-800 dark:text-surface-400 dark:group-hover:text-surface-200">
              {prompt.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
