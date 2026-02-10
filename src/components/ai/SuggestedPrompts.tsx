import { Scale, FileText, Search, BookOpen, ShieldCheck, Lightbulb } from 'lucide-react';
import type { ReactNode } from 'react';

interface SuggestedPromptsProps {
  onSelectPrompt: (prompt: string) => void;
}

interface Prompt {
  icon: ReactNode;
  label: string;
  text: string;
}

const PROMPTS: Prompt[] = [
  {
    icon: <Scale className="h-3.5 w-3.5" />,
    label: 'Analyze legal position',
    text: 'Analyze the strengths and weaknesses of my legal position based on the uploaded documents.',
  },
  {
    icon: <FileText className="h-3.5 w-3.5" />,
    label: 'Summarize a document',
    text: 'Summarize the key points from the currently selected document.',
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
];

export function SuggestedPrompts({ onSelectPrompt }: SuggestedPromptsProps) {
  return (
    <div className="grid grid-cols-1 gap-2 px-4 sm:grid-cols-2">
      {PROMPTS.map((prompt) => (
        <button
          key={prompt.label}
          onClick={() => onSelectPrompt(prompt.text)}
          className="group flex items-start gap-2.5 rounded-lg border border-surface-200 p-3 text-left transition-all hover:border-accent-300 hover:bg-accent-50/50 dark:border-surface-700 dark:hover:border-accent-700 dark:hover:bg-accent-900/10"
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
  );
}
