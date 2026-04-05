import { useState, useCallback, useRef, useEffect } from 'react';
import { Plus, FileSignature, Trash2, Loader2, Sparkles, BookOpen, Mail, Scale, Shield, ArrowRight, X, Download, Copy, FileText, FileDown, FileType } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import useAppStore from '@/store';
import { useAuth } from '@/contexts/AuthContext';
import { useBriefDrafts, useCreateBriefDraft, useDeleteBriefDraft, useUpdateBriefDraft } from '@/hooks/useBriefDrafts';
import { BRIEF_TEMPLATES, TEMPLATE_PROMPTS, DRAFTING_SYSTEM_PROMPT, type BriefDraft, type BriefTemplate } from '@/types/drafting';
import { searchDocuments, formatSearchContext } from '@/services/documentSearchService';
import { aiRouter } from '@/services/aiRouter';
import { supabase } from '@/lib/supabase';
import { htmlToText, exportToPdf, exportToDocx, downloadBlob, downloadText } from '@/lib/export-utils';

const TEMPLATE_ICONS: Record<string, typeof Mail> = {
  Mail, Scale, BookOpen, Shield,
};

export function DraftsTab() {
  const { user } = useAuth();
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const { data: drafts, isLoading } = useBriefDrafts(selectedProjectId);
  const createDraft = useCreateBriefDraft();
  const deleteDraft = useDeleteBriefDraft();
  const updateDraft = useUpdateBriefDraft();

  const [showTemplates, setShowTemplates] = useState(false);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const pendingInsertion = useAppStore((s) => s.pendingBriefInsertion);
  const clearPendingInsertion = useAppStore((s) => s.setPendingBriefInsertion);

  useEffect(() => {
    if (showTemplates) return;

    if (!drafts || drafts.length === 0) {
      if (activeDraftId !== null) setActiveDraftId(null);
      return;
    }

    if (activeDraftId && drafts.some((draft) => draft.id === activeDraftId)) return;
    setActiveDraftId(drafts[0].id);
  }, [activeDraftId, drafts, showTemplates]);

  const activeDraft = drafts?.find((d) => d.id === activeDraftId) ?? null;

  const handleCreate = useCallback(async (template: BriefTemplate) => {
    if (!selectedProjectId) return;
    try {
      const draft = await createDraft.mutateAsync({
        project_id: selectedProjectId,
        template_type: template.slug,
        title: template.name,
      });
      setActiveDraftId(draft.id);
      setShowTemplates(false);
      toast.success(`Created "${template.name}" draft`);
    } catch {
      toast.error('Failed to create draft. Check your connection and try again.');
    }
  }, [selectedProjectId, createDraft]);

  const handleDelete = useCallback(async (id: string) => {
    if (!selectedProjectId) return;
    try {
      await deleteDraft.mutateAsync({ id, projectId: selectedProjectId });
      if (activeDraftId === id) setActiveDraftId(null);
      toast.success('Draft deleted');
    } catch {
      toast.error('Could not delete draft. Check your connection and try again.');
    }
  }, [selectedProjectId, deleteDraft, activeDraftId]);

  if (!selectedProjectId || !user) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-100 dark:bg-surface-800">
          <FileSignature className="h-5 w-5 text-surface-400 dark:text-surface-500" />
        </div>
        <h3 className="mt-4 font-heading text-sm font-semibold text-surface-700 dark:text-surface-200">
          No Project Selected
        </h3>
        <p className="mt-1.5 max-w-xs text-center text-xs leading-relaxed text-surface-400 dark:text-surface-500">
          Select a project to start drafting legal documents.
        </p>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex shrink-0 items-center justify-between border-b border-surface-200 px-4 py-3 dark:border-surface-700">
          <div className="h-4 w-20 animate-pulse rounded bg-surface-100 dark:bg-surface-800" />
          <div className="h-8 w-24 animate-pulse rounded-lg bg-surface-100 dark:bg-surface-800" />
        </div>
        <div className="flex-1 space-y-3 p-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-surface-200/80 bg-white p-4 dark:border-surface-700 dark:bg-surface-800">
              <div className="h-4 w-2/3 animate-pulse rounded bg-surface-100 dark:bg-surface-700" />
              <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-surface-100 dark:bg-surface-700" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Template picker
  if (showTemplates || (!activeDraft && (!drafts || drafts.length === 0))) {
    return (
      <div className="flex h-full flex-col overflow-y-auto p-6">
        <div className="mb-6">
          <h2 className="font-heading text-lg font-semibold text-surface-800 dark:text-surface-100">
            New Legal Document
          </h2>
          <p className="mt-1 text-sm text-surface-400 dark:text-surface-500">
            Choose a template. The AI will generate each section using your uploaded evidence.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {BRIEF_TEMPLATES.map((template) => {
            const Icon = TEMPLATE_ICONS[template.icon] || FileSignature;
            return (
              <button
                key={template.slug}
                onClick={() => handleCreate(template)}
                disabled={createDraft.isPending}
                className={cn(
                  'flex items-start gap-3 rounded-2xl border border-surface-200/80 bg-white p-4 text-left transition-all',
                  'hover:border-primary-300 hover:shadow-md',
                  'dark:border-surface-700 dark:bg-surface-800 dark:hover:border-primary-600',
                  createDraft.isPending && 'opacity-50 pointer-events-none'
                )}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/30">
                  <Icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-heading text-sm font-semibold text-surface-800 dark:text-surface-100">
                    {template.name}
                  </p>
                  <p className="mt-0.5 text-xs text-surface-400 dark:text-surface-500">
                    {template.description}
                  </p>
                  <p className="mt-1 text-xs text-surface-300 dark:text-surface-600">
                    {template.sections.length} sections &middot; {template.category}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {drafts && drafts.length > 0 && (
          <button
            onClick={() => setShowTemplates(false)}
            className="mt-4 text-sm text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
          >
            Back to drafts
          </button>
        )}
      </div>
    );
  }

  // Draft list + editor
  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Pending insertion from PDF viewer */}
      {pendingInsertion && (
        <div className="shrink-0 border-b border-amber-200 bg-amber-50 px-4 py-2 dark:border-amber-800 dark:bg-amber-900/20">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
                Text from PDF (page {pendingInsertion.page})
              </p>
              <p className="mt-0.5 line-clamp-2 text-xs text-amber-700 dark:text-amber-300">
                "{pendingInsertion.text}"
              </p>
            </div>
            <div className="ml-2 flex items-center gap-1">
              {activeDraft && (
                <button
                  onClick={() => {
                    // Insert into the first empty section, or append to the last section
                    const targetSection = activeDraft.sections.find((s) => !s.content_html)
                      ?? activeDraft.sections[activeDraft.sections.length - 1];
                    if (targetSection && selectedProjectId) {
                      const quote = `<blockquote><p>${pendingInsertion.text}</p><footer>Source: page ${pendingInsertion.page}</footer></blockquote>`;
                      const newHtml = targetSection.content_html
                        ? targetSection.content_html + '\n' + quote
                        : quote;
                      const updatedSections = activeDraft.sections.map((s) =>
                        s.key === targetSection.key ? { ...s, content_html: newHtml } : s
                      );
                      updateDraft.mutate({
                        id: activeDraft.id,
                        projectId: selectedProjectId,
                        sections: updatedSections,
                      });
                      toast.success(`Inserted into "${targetSection.heading}"`);
                    }
                    clearPendingInsertion(null);
                  }}
                  className="flex items-center gap-1 rounded-md bg-amber-600 px-2 py-1 text-xs font-medium text-white hover:bg-amber-700"
                >
                  <ArrowRight className="h-3 w-3" />
                  Insert
                </button>
              )}
              <button
                onClick={() => clearPendingInsertion(null)}
                className="rounded-md p-1 text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Draft list header */}
      <div className="flex shrink-0 items-center justify-between border-b border-surface-200 px-4 py-3 dark:border-surface-700">
        <div className="flex items-center gap-2">
          <FileSignature className="h-4 w-4 text-surface-400" />
          <span className="text-sm font-medium text-surface-600 dark:text-surface-300">
            {drafts?.length ?? 0} draft{(drafts?.length ?? 0) !== 1 ? 's' : ''}
          </span>
        </div>
        <button
          onClick={() => setShowTemplates(true)}
          className="flex items-center gap-1 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
        >
          <Plus className="h-3.5 w-3.5" />
          New Draft
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Draft sidebar */}
        <div className="w-56 shrink-0 overflow-y-auto border-r border-surface-200 dark:border-surface-700">
          {isLoading ? (
            <div className="space-y-0">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="border-b border-surface-100 px-3 py-3 dark:border-surface-800">
                  <div className="h-3.5 w-3/4 animate-pulse rounded bg-surface-100 dark:bg-surface-800" />
                  <div className="mt-1.5 h-2.5 w-1/2 animate-pulse rounded bg-surface-100 dark:bg-surface-800" />
                </div>
              ))}
            </div>
          ) : !drafts || drafts.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
              <FileSignature className="h-5 w-5 text-surface-300 dark:text-surface-600" />
              <p className="mt-2 text-xs text-surface-400 dark:text-surface-500">No drafts yet</p>
            </div>
          ) : (
            drafts.map((draft) => (
              <div
                key={draft.id}
                className={cn(
                  'flex items-center justify-between border-b border-surface-100 px-3 py-2.5 transition-colors cursor-pointer',
                  activeDraftId === draft.id
                    ? 'bg-primary-50 dark:bg-primary-900/20'
                    : 'hover:bg-surface-50 dark:hover:bg-surface-800',
                  'dark:border-surface-800'
                )}
              >
                <button
                  onClick={() => setActiveDraftId(draft.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="truncate text-sm font-medium text-surface-700 dark:text-surface-200" title={draft.title}>
                    {draft.title}
                  </p>
                  <p className="text-xs text-surface-400 dark:text-surface-500">
                    {draft.status} &middot; {draft.sections.length} sections
                  </p>
                </button>
                <button
                  onClick={() => handleDelete(draft.id)}
                  className="ml-1 shrink-0 rounded p-1 text-surface-300 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Active draft editor */}
        <div className="flex-1 overflow-y-auto">
          {activeDraft ? (
            <DraftEditor draft={activeDraft} projectId={selectedProjectId} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center px-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-100 dark:bg-surface-800">
                <FileSignature className="h-5 w-5 text-surface-400 dark:text-surface-500" />
              </div>
              <h3 className="mt-3 font-heading text-sm font-semibold text-surface-700 dark:text-surface-200">
                No Draft Selected
              </h3>
              <p className="mt-1.5 max-w-xs text-center text-xs leading-relaxed text-surface-400 dark:text-surface-500">
                Pick a draft from the sidebar to start editing.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Section-by-section draft editor with AI generation. */
function DraftEditor({ draft, projectId }: { draft: BriefDraft; projectId: string }) {
  const updateDraft = useUpdateBriefDraft();
  const [generatingSection, setGeneratingSection] = useState<string | null>(null);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [sectionInstructions, setSectionInstructions] = useState<Record<string, string>>({});

  // Check for files still processing or failed
  const allFiles = useAppStore((s) => s.files);
  const unprocessedCount = allFiles.filter(
    (f) =>
      f.project_id === projectId &&
      !f.is_deleted &&
      (f.processing_status === 'processing' || f.processing_status === 'failed'),
  ).length;

  const completedCount = draft.sections.filter((s) => s.content_html).length;
  const totalCount = draft.sections.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Cache project context so it's fetched once, reused across all section generations
  const projectContextRef = useRef<{
    fileSummaries: string;
    exhibitsContext: string;
    timelineContext: string;
    chronologyContext: string;
    fetchedAt: number;
  } | null>(null);

  const getProjectContext = useCallback(async () => {
    // Reuse cached context if fresh (within 60 seconds)
    if (projectContextRef.current && Date.now() - projectContextRef.current.fetchedAt < 60_000) {
      return projectContextRef.current;
    }

    const { data: files } = await supabase
      .from('files')
      .select('name, document_type, ai_summary')
      .eq('project_id', projectId)
      .eq('processing_status', 'completed')
      .is('is_deleted', false);

    const fileSummaries = (files ?? [])
      .map((f) => `- ${f.name}${f.document_type ? ` [${f.document_type}]` : ''}: ${f.ai_summary ?? 'No summary'}`)
      .join('\n');

    let exhibitsContext = '';
    const { data: exhibits } = await supabase
      .from('exhibit_markers')
      .select('exhibit_id, description, file_id')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true });

    if (exhibits && exhibits.length > 0) {
      exhibitsContext = `\n\n--- EXHIBITS ---\n${exhibits.map((ex) => `${ex.exhibit_id}${ex.description ? `: ${ex.description}` : ''}`).join('\n')}`;
    }

    let timelineContext = '';
    const { data: timelineEvents } = await supabase
      .from('timeline_events')
      .select('date, title, description, category, is_verified')
      .eq('project_id', projectId)
      .eq('is_hidden', false)
      .order('date', { ascending: true });

    if (timelineEvents && timelineEvents.length > 0) {
      timelineContext = `\n\n--- TIMELINE ---\n${timelineEvents.map((ev) => `${ev.date}: ${ev.title}${ev.description ? ` — ${ev.description}` : ''}${ev.is_verified ? ' [v]' : ''}`).join('\n')}`;
    }

    let chronologyContext = '';
    const { data: chronologyEntries } = await supabase
      .from('chronology_entries')
      .select('date_display, description, source_description, exhibit_ref, category')
      .eq('project_id', projectId)
      .eq('is_included', true)
      .order('date_sort', { ascending: true });

    if (chronologyEntries && chronologyEntries.length > 0) {
      chronologyContext = `\n\n--- CHRONOLOGY ---\n${chronologyEntries.map(e =>
        `${e.date_display}: ${e.description}${e.source_description ? ` (${e.source_description})` : ''}${e.exhibit_ref ? ` [${e.exhibit_ref}]` : ''}`
      ).join('\n')}`;
    }

    const ctx = { fileSummaries, exhibitsContext, timelineContext, chronologyContext, fetchedAt: Date.now() };
    projectContextRef.current = ctx;
    return ctx;
  }, [projectId]);

  const handleGenerateSection = useCallback(async (sectionKey: string) => {
    setGeneratingSection(sectionKey);
    try {
      const section = draft.sections.find((s) => s.key === sectionKey);
      if (!section) return;

      // Get cached project context (files, exhibits, timeline, chronology)
      const { fileSummaries, exhibitsContext, timelineContext, chronologyContext } = await getProjectContext();

      // RAG search — section-specific (this one can't be cached since query varies)
      const chunkLimit = (sectionKey === 'facts' || sectionKey === 'background' || sectionKey === 'damages' || sectionKey === 'law_argument') ? 20 : 12;
      const searchResults = await searchDocuments({
        query: `${section.heading} ${sectionInstructions[sectionKey] || ''}`.trim(),
        projectId,
        limit: chunkLimit,
      }).catch(() => []);

      const documentContext = formatSearchContext(searchResults);

      // Build template-specific prompt using TEMPLATE_PROMPTS
      const templatePrompts = TEMPLATE_PROMPTS[draft.template_type] ?? {};
      const systemInstruction = templatePrompts._system ?? 'You are drafting an Ontario legal document.';
      const sectionInstruction = templatePrompts[sectionKey] ?? `Draft the "${section.heading}" section.`;

      const userInstructions = sectionInstructions[sectionKey]
        ? `\n\nAdditional user instructions: ${sectionInstructions[sectionKey]}`
        : '';

      // Previously generated sections for context
      const priorSections = draft.sections
        .filter((s) => s.content_html && s.sort_order < section.sort_order)
        .map((s) => `## ${s.heading}\n${s.content_html.replace(/<[^>]+>/g, '')}`)
        .join('\n\n');

      const result = await aiRouter.routeQuery({
        query: `${DRAFTING_SYSTEM_PROMPT}

---

${systemInstruction}

Document metadata:
- Court/Tribunal: ${draft.court_name || 'Ontario Superior Court of Justice'}
- File Number: ${draft.file_number || '[To be assigned]'}
- Case Name: ${draft.case_name || '[Parties TBD]'}
- Party (your client): ${draft.party_name || '[Party name TBD]'}

SECTION TO DRAFT: ${section.heading}

${sectionInstruction}
${userInstructions}

IMPORTANT: Return ONLY the section content — no section heading (it will be added automatically). Do not fabricate case citations. If evidence is insufficient for a factual assertion, flag it with [EVIDENCE NEEDED].`,
        effortLevel: 'deep',
        caseContext: `--- PROJECT FILES ---\n${fileSummaries}\n\n${documentContext}${exhibitsContext}${timelineContext}${chronologyContext}\n\n${priorSections ? `--- PRIOR SECTIONS ---\n${priorSections}` : ''}`,
      });

      // Update the section with generated content
      const updatedSections = draft.sections.map((s) =>
        s.key === sectionKey
          ? { ...s, content_html: result.response, is_generated: true, generated_at: new Date().toISOString(), model_used: result.model }
          : s
      );

      await updateDraft.mutateAsync({
        id: draft.id,
        projectId,
        sections: updatedSections,
      });

      toast.success(`Generated "${section.heading}"`);
    } catch (err) {
      toast.error(`Failed to generate section: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setGeneratingSection(null);
    }
  }, [draft, projectId, updateDraft, sectionInstructions, getProjectContext]);

  const handleEditSection = useCallback(async (sectionKey: string, newHtml: string) => {
    const updatedSections = draft.sections.map((s) =>
      s.key === sectionKey ? { ...s, content_html: newHtml } : s
    );
    await updateDraft.mutateAsync({ id: draft.id, projectId, sections: updatedSections });
  }, [draft, projectId, updateDraft]);

  const [generateAllProgress, setGenerateAllProgress] = useState<{ current: number; total: number } | null>(null);

  const handleGenerateAll = useCallback(async () => {
    setGeneratingAll(true);
    const emptySections = draft.sections.filter((s) => !s.content_html);
    let successCount = 0;
    setGenerateAllProgress({ current: 0, total: emptySections.length });
    for (let i = 0; i < emptySections.length; i++) {
      setGenerateAllProgress({ current: i + 1, total: emptySections.length });
      try {
        await handleGenerateSection(emptySections[i].key);
        successCount++;
      } catch {
        // Continue with remaining sections even if one fails
      }
    }
    setGeneratingAll(false);
    setGenerateAllProgress(null);
    if (successCount === emptySections.length) {
      toast.success(`Generated all ${successCount} sections`);
    } else {
      toast.success(`Generated ${successCount} of ${emptySections.length} sections`);
    }
  }, [draft.sections, handleGenerateSection]);

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exporting, setExporting] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Close export menu on outside click
  useEffect(() => {
    if (!showExportMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showExportMenu]);

  /** Build formatted plain text from draft content, properly converting HTML. */
  const buildDraftText = useCallback(() => {
    const headerParts = [
      draft.court_name && `Court: ${draft.court_name}`,
      draft.file_number && `File No.: ${draft.file_number}`,
      draft.case_name && `${draft.case_name}`,
      draft.party_name && `Party: ${draft.party_name}`,
    ].filter(Boolean);

    const header = headerParts.join('\n');

    const sections = draft.sections
      .filter((s) => s.content_html)
      .map((s) => {
        const text = htmlToText(s.content_html);
        return `## ${s.heading}\n\n${text}`;
      })
      .join('\n\n---\n\n');

    return `# ${draft.title}\n\n${header}\n\n---\n\n${sections}`;
  }, [draft]);

  const handleExportDraft = useCallback(async (format: 'clipboard' | 'md' | 'txt' | 'pdf' | 'docx') => {
    setExporting(true);
    setShowExportMenu(false);
    try {
      const content = buildDraftText();
      const safeTitle = draft.title.replace(/[^a-zA-Z0-9\s-]/g, '').trim() || 'draft';

      switch (format) {
        case 'clipboard': {
          await navigator.clipboard.writeText(content);
          toast.success('Draft copied to clipboard');
          break;
        }
        case 'md': {
          downloadText(content, `${safeTitle}.md`, 'text/markdown');
          toast.success('Markdown file downloaded');
          break;
        }
        case 'txt': {
          // Strip markdown formatting for plain text
          const plain = content
            .replace(/#{1,6}\s/g, '')
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
          downloadText(plain, `${safeTitle}.txt`, 'text/plain');
          toast.success('Text file downloaded');
          break;
        }
        case 'pdf': {
          const blob = await exportToPdf(content, draft.title);
          downloadBlob(blob, `${safeTitle}.pdf`);
          toast.success('PDF downloaded');
          break;
        }
        case 'docx': {
          const blob = await exportToDocx(content, draft.title);
          downloadBlob(blob, `${safeTitle}.docx`);
          toast.success('DOCX downloaded');
          break;
        }
      }
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  }, [buildDraftText, draft.title]);

  return (
    <div className="p-4 space-y-4">
      {/* Processing status warning */}
      {unprocessedCount > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-800 dark:bg-amber-900/20">
          <span className="text-xs text-amber-700 dark:text-amber-300">
            {unprocessedCount} file{unprocessedCount !== 1 ? 's' : ''} still processing or need retry. Generated content may not include all evidence.
          </span>
        </div>
      )}

      {/* Draft header with progress + actions */}
      <div className="rounded-2xl border border-surface-200/80 bg-white p-4 shadow-sm dark:border-surface-700 dark:bg-surface-800">
        <div className="flex items-center justify-between">
          <h3 className="truncate font-heading text-sm font-semibold text-surface-700 dark:text-surface-200" title={draft.title}>{draft.title}</h3>
          <div className="flex items-center gap-2">
            {completedCount < totalCount && (
              <button
                onClick={handleGenerateAll}
                disabled={generatingAll || !!generatingSection}
                className={cn(
                  'flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                  generatingAll || generatingSection
                    ? 'bg-surface-100 text-surface-400 dark:bg-surface-800'
                    : 'bg-accent-600 text-white hover:bg-accent-700 shadow-sm dark:bg-accent-500 dark:hover:bg-accent-400'
                )}
              >
                {generatingAll ? (
                  <><Loader2 className="h-3 w-3 animate-spin" /> {generateAllProgress ? `${generateAllProgress.current}/${generateAllProgress.total}` : 'Generating...'}</>
                ) : (
                  <><Sparkles className="h-3 w-3" /> Generate All</>
                )}
              </button>
            )}
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => setShowExportMenu((p) => !p)}
                disabled={exporting}
                className="flex items-center gap-1 rounded-lg border border-surface-200 px-3 py-1.5 text-xs font-medium text-surface-500 hover:bg-surface-50 dark:border-surface-700 dark:text-surface-400 disabled:opacity-50"
              >
                {exporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                Export
              </button>
              {showExportMenu && (
                <div className="absolute right-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-xl border border-surface-200 bg-white shadow-lg dark:border-surface-700 dark:bg-surface-850">
                  <button onClick={() => handleExportDraft('clipboard')} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-surface-600 transition-colors hover:bg-surface-50 dark:text-surface-300 dark:hover:bg-surface-700">
                    <Copy className="h-3.5 w-3.5" /> Copy to clipboard
                  </button>
                  <button onClick={() => handleExportDraft('pdf')} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-surface-600 transition-colors hover:bg-surface-50 dark:text-surface-300 dark:hover:bg-surface-700">
                    <FileText className="h-3.5 w-3.5" /> Download PDF
                  </button>
                  <button onClick={() => handleExportDraft('docx')} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-surface-600 transition-colors hover:bg-surface-50 dark:text-surface-300 dark:hover:bg-surface-700">
                    <FileType className="h-3.5 w-3.5" /> Download DOCX
                  </button>
                  <button onClick={() => handleExportDraft('md')} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-surface-600 transition-colors hover:bg-surface-50 dark:text-surface-300 dark:hover:bg-surface-700">
                    <FileDown className="h-3.5 w-3.5" /> Download Markdown
                  </button>
                  <button onClick={() => handleExportDraft('txt')} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-surface-600 transition-colors hover:bg-surface-50 dark:text-surface-300 dark:hover:bg-surface-700">
                    <FileDown className="h-3.5 w-3.5" /> Download Plain Text
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 flex items-center gap-3">
          <div className="flex-1 h-1.5 rounded-full bg-surface-100 dark:bg-surface-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs text-surface-400 whitespace-nowrap">
            {completedCount}/{totalCount} sections
          </span>
        </div>
      </div>
      <div className="rounded-2xl border border-surface-200/80 bg-surface-50/50 p-4 dark:border-surface-700 dark:bg-surface-800/50">
        <div className="grid gap-3 sm:grid-cols-2">
          <MetadataInput placeholder="Court name" field="court_name" draft={draft} projectId={projectId} updateDraft={updateDraft} />
          <MetadataInput placeholder="File number" field="file_number" draft={draft} projectId={projectId} updateDraft={updateDraft} />
          <MetadataInput placeholder="Case name (e.g., Smith v. Jones)" field="case_name" draft={draft} projectId={projectId} updateDraft={updateDraft} />
          <MetadataInput placeholder="Party name" field="party_name" draft={draft} projectId={projectId} updateDraft={updateDraft} />
        </div>
      </div>

      {/* Sections */}
      {draft.sections.map((section) => {
        const isGenerating = generatingSection === section.key;
        return (
          <div
            key={section.key}
            className="rounded-2xl border border-surface-200/80 bg-white p-4 shadow-sm dark:border-surface-700 dark:bg-surface-800"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-heading text-sm font-semibold text-surface-700 dark:text-surface-200">
                {section.heading}
              </h3>
              <div className="flex items-center gap-2">
                {section.is_generated && (
                  <span className="text-xs text-surface-400">
                    {section.model_used === 'gpt' ? 'GPT-5.2' : 'Gemini'}
                  </span>
                )}
                <button
                  onClick={() => handleGenerateSection(section.key)}
                  disabled={isGenerating}
                  className={cn(
                    'flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                    section.content_html
                      ? 'border border-surface-200 text-surface-500 hover:border-primary-300 hover:text-primary-600 dark:border-surface-600 dark:text-surface-400'
                      : 'bg-primary-600 text-white hover:bg-primary-700',
                    isGenerating && 'opacity-50'
                  )}
                >
                  {isGenerating ? (
                    <><Loader2 className="h-3 w-3 animate-spin" /> Generating...</>
                  ) : section.content_html ? (
                    <><Sparkles className="h-3 w-3" /> Regenerate</>
                  ) : (
                    <><Sparkles className="h-3 w-3" /> Generate</>
                  )}
                </button>
              </div>
            </div>

            {/* Optional user instructions */}
            <input
              type="text"
              placeholder="Optional: instructions for this section..."
              value={sectionInstructions[section.key] ?? ''}
              onChange={(e) => setSectionInstructions((prev) => ({ ...prev, [section.key]: e.target.value }))}
              className="mb-2 w-full rounded-lg border border-surface-100 bg-surface-50 px-3 py-1.5 text-xs text-surface-600 placeholder:text-surface-400 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-300 dark:placeholder:text-surface-500"
            />

            {/* Section content */}
            {section.content_html ? (
              <div
                className="prose-chat text-sm leading-relaxed text-surface-700 dark:text-surface-200 [&_p]:mb-2 [&_ol]:ml-4 [&_ol]:list-decimal [&_ul]:ml-4 [&_ul]:list-disc"
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleEditSection(section.key, e.currentTarget.innerHTML)}
                dangerouslySetInnerHTML={{ __html: section.content_html }}
              />
            ) : (
              <p className="text-xs italic text-surface-300 dark:text-surface-600">
                Click "Generate" to create this section from your evidence.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Metadata input that saves on blur instead of every keystroke. */
function MetadataInput({ placeholder, field, draft, projectId, updateDraft }: {
  placeholder: string;
  field: 'court_name' | 'file_number' | 'case_name' | 'party_name';
  draft: BriefDraft;
  projectId: string;
  updateDraft: ReturnType<typeof useUpdateBriefDraft>;
}) {
  const [value, setValue] = useState(draft[field] ?? '');

  useEffect(() => {
    setValue(draft[field] ?? '');
  }, [draft[field]]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useCallback(() => {
    if (value !== (draft[field] ?? '')) {
      updateDraft.mutate({ id: draft.id, projectId, [field]: value || null });
    }
  }, [value, draft, field, projectId, updateDraft]);

  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => { if (e.key === 'Enter') save(); }}
      className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm placeholder:text-surface-400 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-200 dark:placeholder:text-surface-500"
    />
  );
}
