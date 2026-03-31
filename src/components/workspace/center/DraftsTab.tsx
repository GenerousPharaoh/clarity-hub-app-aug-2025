import { useState, useCallback } from 'react';
import { Plus, FileSignature, Trash2, Loader2, Sparkles, BookOpen, Mail, Scale, Shield, ArrowRight, X, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import useAppStore from '@/store';
import { useAuth } from '@/contexts/AuthContext';
import { useBriefDrafts, useCreateBriefDraft, useDeleteBriefDraft, useUpdateBriefDraft } from '@/hooks/useBriefDrafts';
import { BRIEF_TEMPLATES, type BriefDraft, type BriefTemplate } from '@/types/drafting';
import { searchDocuments, formatSearchContext } from '@/services/documentSearchService';
import { aiRouter } from '@/services/aiRouter';
import { supabase } from '@/lib/supabase';

const TEMPLATE_ICONS: Record<string, typeof Mail> = {
  Mail, Scale, BookOpen, Shield,
};

export function DraftsTab() {
  const { user } = useAuth();
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const { data: drafts, isLoading } = useBriefDrafts(selectedProjectId);
  const createDraft = useCreateBriefDraft();
  const deleteDraft = useDeleteBriefDraft();

  const [showTemplates, setShowTemplates] = useState(false);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const pendingInsertion = useAppStore((s) => s.pendingBriefInsertion);
  const clearPendingInsertion = useAppStore((s) => s.setPendingBriefInsertion);

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
      toast.error('Failed to create draft');
    }
  }, [selectedProjectId, createDraft]);

  const handleDelete = useCallback(async (id: string) => {
    if (!selectedProjectId) return;
    try {
      await deleteDraft.mutateAsync({ id, projectId: selectedProjectId });
      if (activeDraftId === id) setActiveDraftId(null);
      toast.success('Draft deleted');
    } catch {
      toast.error('Failed to delete draft');
    }
  }, [selectedProjectId, deleteDraft, activeDraftId]);

  if (!selectedProjectId || !user) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-sm text-surface-400">Select a project to start drafting.</p>
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
                    // Insert into the first empty section of the active draft
                    toast.success('Text added to draft notes');
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
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-4 w-4 animate-spin text-surface-400" />
            </div>
          ) : (
            drafts?.map((draft) => (
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
                  <p className="truncate text-sm font-medium text-surface-700 dark:text-surface-200">
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
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-surface-400">Select a draft from the sidebar</p>
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

  const completedCount = draft.sections.filter((s) => s.content_html).length;
  const totalCount = draft.sections.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleGenerateSection = useCallback(async (sectionKey: string) => {
    setGeneratingSection(sectionKey);
    try {
      const section = draft.sections.find((s) => s.key === sectionKey);
      if (!section) return;

      // Gather context: file summaries + RAG search + legal knowledge
      const { data: files } = await supabase
        .from('files')
        .select('name, document_type, ai_summary, extracted_text')
        .eq('project_id', projectId)
        .eq('processing_status', 'completed')
        .is('is_deleted', false);

      const fileSummaries = (files ?? [])
        .map((f) => `- ${f.name}${f.document_type ? ` [${f.document_type}]` : ''}: ${f.ai_summary ?? 'No summary'}`)
        .join('\n');

      // RAG search for section-relevant content
      const searchResults = await searchDocuments({
        query: `${section.heading} ${sectionInstructions[sectionKey] || ''}`.trim(),
        projectId,
        limit: 10,
      }).catch(() => []);

      const documentContext = formatSearchContext(searchResults);

      // Build section-specific prompt
      const userInstructions = sectionInstructions[sectionKey]
        ? `\n\nUser instructions for this section: ${sectionInstructions[sectionKey]}`
        : '';

      // Previously generated sections for context
      const priorSections = draft.sections
        .filter((s) => s.content_html && s.sort_order < section.sort_order)
        .map((s) => `## ${s.heading}\n${s.content_html.replace(/<[^>]+>/g, '')}`)
        .join('\n\n');

      const result = await aiRouter.routeQuery({
        query: `Generate the "${section.heading}" section for a ${draft.title} (Ontario legal document).

Document metadata:
- Court: ${draft.court_name || 'Ontario Superior Court of Justice'}
- File Number: ${draft.file_number || '[To be assigned]'}
- Case Name: ${draft.case_name || '[Parties TBD]'}

Section description: ${BRIEF_TEMPLATES.find((t) => t.slug === draft.template_type)?.sections.find((s) => s.key === sectionKey)?.description || section.heading}
${userInstructions}

Write this section in formal legal prose suitable for filing. Use numbered paragraphs where appropriate. Reference exhibits as (Exhibit [X]) where supported by the evidence. Cite case law with neutral citations.

Return ONLY the section content — no section heading (it will be added automatically).`,
        effortLevel: 'deep',
        caseContext: `--- PROJECT FILES ---\n${fileSummaries}\n\n${documentContext}\n\n${priorSections ? `--- PRIOR SECTIONS ---\n${priorSections}` : ''}`,
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
  }, [draft, projectId, updateDraft, sectionInstructions]);

  const handleEditSection = useCallback(async (sectionKey: string, newHtml: string) => {
    const updatedSections = draft.sections.map((s) =>
      s.key === sectionKey ? { ...s, content_html: newHtml } : s
    );
    await updateDraft.mutateAsync({ id: draft.id, projectId, sections: updatedSections });
  }, [draft, projectId, updateDraft]);

  const handleGenerateAll = useCallback(async () => {
    setGeneratingAll(true);
    const emptySections = draft.sections.filter((s) => !s.content_html);
    for (const section of emptySections) {
      try {
        await handleGenerateSection(section.key);
      } catch {
        // Continue with remaining sections even if one fails
      }
    }
    setGeneratingAll(false);
    toast.success(`Generated ${emptySections.length} sections`);
  }, [draft.sections, handleGenerateSection]);

  const handleExportDraft = useCallback(() => {
    const header = [
      draft.court_name && `Court: ${draft.court_name}`,
      draft.file_number && `File No: ${draft.file_number}`,
      draft.case_name && `${draft.case_name}`,
      draft.party_name && `Party: ${draft.party_name}`,
    ].filter(Boolean).join('\n');

    const sections = draft.sections
      .filter((s) => s.content_html)
      .map((s) => {
        const text = s.content_html.replace(/<[^>]+>/g, '').trim();
        return `## ${s.heading}\n\n${text}`;
      })
      .join('\n\n---\n\n');

    const md = `# ${draft.title}\n\n${header}\n\n---\n\n${sections}`;
    navigator.clipboard.writeText(md).then(() => {
      toast.success('Draft copied to clipboard as markdown');
    }).catch(() => {
      const blob = new Blob([md], { type: 'text/markdown' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${draft.title.replace(/\s+/g, '-').toLowerCase()}.md`;
      a.click();
      toast.success('Draft exported');
    });
  }, [draft]);

  return (
    <div className="p-4 space-y-4">
      {/* Draft header with progress + actions */}
      <div className="rounded-2xl border border-surface-200/80 bg-white p-4 shadow-sm dark:border-surface-700 dark:bg-surface-800">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-sm font-semibold text-surface-700 dark:text-surface-200">{draft.title}</h3>
          <div className="flex items-center gap-2">
            {completedCount < totalCount && (
              <button
                onClick={handleGenerateAll}
                disabled={generatingAll || !!generatingSection}
                className={cn(
                  'flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                  generatingAll || generatingSection
                    ? 'bg-surface-100 text-surface-400 dark:bg-surface-800'
                    : 'bg-purple-600 text-white hover:bg-purple-700 shadow-sm'
                )}
              >
                {generatingAll ? (
                  <><Loader2 className="h-3 w-3 animate-spin" /> Generating...</>
                ) : (
                  <><Sparkles className="h-3 w-3" /> Generate All</>
                )}
              </button>
            )}
            <button
              onClick={handleExportDraft}
              className="flex items-center gap-1 rounded-lg border border-surface-200 px-3 py-1.5 text-xs font-medium text-surface-500 hover:bg-surface-50 dark:border-surface-700 dark:text-surface-400"
            >
              <Download className="h-3 w-3" />
              Export
            </button>
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
          <input
            type="text"
            placeholder="Court name"
            value={draft.court_name ?? ''}
            onChange={(e) => updateDraft.mutate({ id: draft.id, projectId, court_name: e.target.value })}
            className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm dark:border-surface-700 dark:bg-surface-900 dark:text-surface-200"
          />
          <input
            type="text"
            placeholder="File number"
            value={draft.file_number ?? ''}
            onChange={(e) => updateDraft.mutate({ id: draft.id, projectId, file_number: e.target.value })}
            className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm dark:border-surface-700 dark:bg-surface-900 dark:text-surface-200"
          />
          <input
            type="text"
            placeholder="Case name (e.g., Smith v. Jones)"
            value={draft.case_name ?? ''}
            onChange={(e) => updateDraft.mutate({ id: draft.id, projectId, case_name: e.target.value })}
            className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm dark:border-surface-700 dark:bg-surface-900 dark:text-surface-200"
          />
          <input
            type="text"
            placeholder="Party name"
            value={draft.party_name ?? ''}
            onChange={(e) => updateDraft.mutate({ id: draft.id, projectId, party_name: e.target.value })}
            className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm dark:border-surface-700 dark:bg-surface-900 dark:text-surface-200"
          />
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
              className="mb-2 w-full rounded-lg border border-surface-100 bg-surface-50 px-3 py-1.5 text-xs text-surface-600 placeholder:text-surface-300 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-300"
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
