/**
 * Project Export Service
 *
 * Exports a complete project as a ZIP archive the user can download and
 * take elsewhere. Runs entirely client-side:
 *
 * - Supabase reads go through the user's JWT, so RLS is enforced.
 * - File binaries are downloaded from Supabase Storage via signed URLs.
 * - JSON tables are serialized as pretty-printed UTF-8.
 * - Everything is zipped in the browser via JSZip — no serverless memory limit.
 *
 * Addresses the "can we get our data out?" audit finding for firm-level
 * procurement. Open formats (PDF binaries + JSON) mean the export is
 * useful even if Clarity Hub goes away tomorrow.
 */

import JSZip from 'jszip';
import { supabase } from '@/lib/supabase';
import { getFileUrl } from './storageService';

export interface ExportProgress {
  phase: 'metadata' | 'files' | 'archive';
  current: number;
  total: number;
  message: string;
}

export type ExportProgressListener = (progress: ExportProgress) => void;

interface ExportOptions {
  projectId: string;
  projectName: string;
  includeFileBinaries?: boolean;
  onProgress?: ExportProgressListener;
  signal?: AbortSignal;
}

const README = `# Clarity Hub — Project Export

This archive contains a complete export of a single matter, generated on EXPORT_DATE_PLACEHOLDER.

## Format

- project.json             — matter metadata
- files.json               — per-file metadata (classification, summary, extracted text)
- files/                   — original uploaded binaries (PDFs, images, docs, etc.)
- notes.json               — strategy notes
- chat_messages.json       — AI chat transcript (question, answer, sources, citations)
- timeline_events.json     — chronological events extracted from the record
- pdf_annotations.json     — highlights, comments, exhibit markers on PDFs
- exhibit_markers.json     — exhibit-book entries
- compendiums.json         — exhibit-book configurations
- compendium_entries.json  — items inside each compendium
- brief_drafts.json        — working drafts built in the editor
- brief_citations.json     — citations tracked against drafts
- chronology_entries.json  — curated chronology entries

## Open formats

All metadata is JSON (UTF-8, pretty-printed). File binaries retain their
original MIME type and filename. You can open them in any tool — no
Clarity-Hub-specific software is needed to read this archive.

## Cross-references

Each JSON row keeps its original UUIDs so you can reconstruct relationships
outside the app. For example, \`pdf_annotations.file_id\` matches the
\`id\` in \`files.json\`, and the binary lives at \`files/<id>-<filename>\`
in this archive.
`;

function toPrettyJson(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Build a filesystem-safe path for a file binary inside the archive.
 * Preserves the original filename so a human opening the ZIP sees
 * something recognizable — but prefixes with the file id so two files
 * that happen to share a name don't collide.
 */
function safeFilePath(fileId: string, originalName: string): string {
  const safeName = originalName.replace(/[^\w.\- ]+/g, '_').slice(0, 120) || 'file';
  return `files/${fileId}-${safeName}`;
}

async function fetchProjectScoped<T>(table: string, projectId: string): Promise<T[]> {
  const { data, error } = await supabase
    // The generated Database types are missing a handful of tables that exist
    // in the DB (compendium_entries, compendiums, etc.). Rather than fail the
    // export, cast and filter defensively.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from(table as any)
    .select('*')
    .eq('project_id', projectId);
  if (error) throw new Error(`Export failed on ${table}: ${error.message}`);
  return (data ?? []) as T[];
}

async function fetchByForeignKey<T>(
  table: string,
  foreignKeyColumn: string,
  foreignKeyValues: string[]
): Promise<T[]> {
  if (foreignKeyValues.length === 0) return [];
  const { data, error } = await supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from(table as any)
    .select('*')
    .in(foreignKeyColumn, foreignKeyValues);
  if (error) throw new Error(`Export failed on ${table}: ${error.message}`);
  return (data ?? []) as T[];
}

/**
 * Export a project as a downloadable ZIP. Returns a Blob the caller can
 * save with e.g. URL.createObjectURL.
 */
export async function exportProject(options: ExportOptions): Promise<Blob> {
  const {
    projectId,
    projectName,
    includeFileBinaries = true,
    onProgress,
    signal,
  } = options;

  const checkAborted = () => {
    if (signal?.aborted) {
      throw new Error('Export cancelled');
    }
  };

  const report = (progress: ExportProgress) => {
    checkAborted();
    onProgress?.(progress);
  };

  const zip = new JSZip();

  // ── 1. Metadata tables ──────────────────────────────────────────────────
  report({ phase: 'metadata', current: 0, total: 1, message: 'Fetching matter metadata…' });

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();
  if (projectError || !project) {
    throw new Error(`Could not load project: ${projectError?.message ?? 'unknown'}`);
  }

  // Tables scoped by project_id. Ordered roughly by how often they're queried
  // back — chat is first because that's what firms worry about most.
  const tables = [
    'files',
    'notes',
    'chat_messages',
    'timeline_events',
    'pdf_annotations',
    'exhibit_markers',
    'compendiums',
    'brief_drafts',
    'chronology_entries',
  ] as const;

  zip.file(
    'README.md',
    README.replace('EXPORT_DATE_PLACEHOLDER', new Date().toISOString())
  );
  zip.file('project.json', toPrettyJson(project));

  const tableResults: Record<string, unknown[]> = {};
  for (let i = 0; i < tables.length; i++) {
    const table = tables[i];
    report({
      phase: 'metadata',
      current: i + 1,
      total: tables.length + 1,
      message: `Fetching ${table.replace(/_/g, ' ')}…`,
    });
    const rows = await fetchProjectScoped<Record<string, unknown>>(table, projectId);
    tableResults[table] = rows;
    zip.file(`${table}.json`, toPrettyJson(rows));
  }

  // Child tables scoped by foreign key instead of project_id —
  // pull them by the parent IDs we just collected.
  const compendiumIds = (tableResults['compendiums'] as Array<{ id: string }>).map((c) => c.id);
  const compendiumEntries = await fetchByForeignKey(
    'compendium_entries',
    'compendium_id',
    compendiumIds
  );
  zip.file('compendium_entries.json', toPrettyJson(compendiumEntries));

  const briefIds = (tableResults['brief_drafts'] as Array<{ id: string }>).map((d) => d.id);
  const briefCitations = await fetchByForeignKey(
    'brief_citations',
    'brief_id',
    briefIds
  );
  zip.file('brief_citations.json', toPrettyJson(briefCitations));

  // ── 2. File binaries ───────────────────────────────────────────────────
  if (includeFileBinaries) {
    const files = tableResults['files'] as Array<{
      id: string;
      name: string;
      file_path: string;
      is_deleted: boolean | null;
    }>;
    const liveFiles = files.filter((f) => !f.is_deleted);

    for (let i = 0; i < liveFiles.length; i++) {
      const file = liveFiles[i];
      report({
        phase: 'files',
        current: i + 1,
        total: liveFiles.length,
        message: `Downloading ${file.name}…`,
      });

      try {
        const { url } = await getFileUrl(file.file_path);
        if (!url) continue;
        const response = await fetch(url, { signal });
        if (!response.ok) continue;
        const blob = await response.blob();
        zip.file(safeFilePath(file.id, file.name), blob);
      } catch (err) {
        // Non-fatal: skip the binary, keep the metadata. A firm can always
        // re-download via the API if needed — but losing one file shouldn't
        // abort a 500-file export.
        console.warn(`Failed to include ${file.name} in export:`, err);
      }
    }
  }

  // ── 3. Zip ──────────────────────────────────────────────────────────────
  report({ phase: 'archive', current: 0, total: 1, message: 'Compressing archive…' });

  const blob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      report({
        phase: 'archive',
        current: Math.round(metadata.percent),
        total: 100,
        message: `Compressing archive… ${Math.round(metadata.percent)}%`,
      });
    }
  );

  report({ phase: 'archive', current: 1, total: 1, message: 'Done' });

  return blob;
}

/**
 * Kick off a project export and stream the resulting ZIP to the user's
 * downloads folder. Handles the browser-side plumbing so the caller only
 * has to worry about progress UI.
 */
export async function downloadProjectExport(
  options: ExportOptions
): Promise<void> {
  const blob = await exportProject(options);
  const url = URL.createObjectURL(blob);
  const datestamp = new Date().toISOString().slice(0, 10);
  const safeName = options.projectName.replace(/[^\w.\- ]+/g, '_').slice(0, 60) || 'project';
  const a = document.createElement('a');
  a.href = url;
  a.download = `clarity-hub-${safeName}-${datestamp}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Release the blob URL on the next tick so the download has time to start.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
