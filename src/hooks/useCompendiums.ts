/**
 * Hooks for the Compendium / Exhibit Book Builder.
 *
 * Provides generation state management and file upload to Supabase Storage.
 * There is no dedicated `compendiums` DB table -- generated PDFs are saved
 * as regular project files in the `files` bucket.
 */
import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, STORAGE_BUCKET } from '@/lib/supabase';
import { downloadFile } from '@/services/storageService';
import {
  generateCompendium,
  generateTabLabels,
  type CompendiumConfig,
  type CompendiumEntry,
  type CompendiumResult,
} from '@/services/compendiumGenerator';
import type { ExhibitMarker, FileRecord } from '@/types';
import { toast } from 'sonner';

// ── Types ──────────────────────────────────────────────────

export interface CompendiumItem {
  exhibitId: string;
  exhibitDbId: string;
  fileId: string;
  fileName: string;
  filePath: string;
  fileType: string;
  displayTitle: string;
  tabLabel: string;
  selected: boolean;
}

export interface GenerationProgress {
  stage: string;
  current: number;
  total: number;
}

// ── Helpers ────────────────────────────────────────────────

function getFileCategory(fileName: string): 'pdf' | 'image' {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'].includes(ext)) return 'image';
  return 'pdf';
}

/**
 * Build the list of compendium items from exhibits and files.
 * Only includes exhibits that have a linked file.
 */
export function buildCompendiumItems(
  exhibits: ExhibitMarker[],
  files: FileRecord[],
  tabStyle: 'letter' | 'number'
): CompendiumItem[] {
  const linkedExhibits = exhibits.filter((e) => e.file_id);
  const labels = generateTabLabels(linkedExhibits.length, tabStyle);

  return linkedExhibits.map((exhibit, idx) => {
    const file = files.find((f) => f.id === exhibit.file_id);
    return {
      exhibitId: exhibit.exhibit_id,
      exhibitDbId: exhibit.id,
      fileId: exhibit.file_id!,
      fileName: file?.name ?? 'Unknown file',
      filePath: file?.file_path ?? '',
      fileType: file ? getFileCategory(file.name) : 'pdf',
      displayTitle: exhibit.description || file?.name || exhibit.exhibit_id,
      tabLabel: labels[idx],
      selected: true,
    };
  });
}

// ── useCompendiumBuilder ───────────────────────────────────

export function useCompendiumBuilder() {
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [result, setResult] = useState<CompendiumResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generate = useCallback(
    async (config: CompendiumConfig, items: CompendiumItem[]) => {
      setIsGenerating(true);
      setProgress({ stage: 'Starting', current: 0, total: items.length });
      setResult(null);

      try {
        // Download file blobs from Supabase Storage
        const entries: CompendiumEntry[] = [];
        const selectedItems = items.filter((item) => item.selected);

        for (let i = 0; i < selectedItems.length; i++) {
          const item = selectedItems[i];
          setProgress({
            stage: 'Downloading files',
            current: i + 1,
            total: selectedItems.length,
          });

          const blob = await downloadFile(item.filePath);
          entries.push({
            tabLabel: item.tabLabel,
            displayTitle: item.displayTitle,
            fileBlob: blob,
            fileType: item.fileType,
          });
        }

        // Generate the merged PDF
        const compendiumResult = await generateCompendium(config, entries, (stage, current, total) => {
          setProgress({ stage, current, total });
        });

        setResult(compendiumResult);
        setProgress(null);
        return compendiumResult;
      } catch (err) {
        console.error('[useCompendiumBuilder] Generation failed:', err);
        toast.error('Failed to generate compendium');
        setProgress(null);
        throw err;
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setProgress(null);
    setResult(null);
    setIsGenerating(false);
  }, []);

  return { generate, progress, result, isGenerating, reset };
}

// ── useSaveCompendium ──────────────────────────────────────

/**
 * Saves a generated compendium PDF to the project's file storage.
 */
export function useSaveCompendium() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      userId,
      blob,
      fileName,
    }: {
      projectId: string;
      userId: string;
      blob: Blob;
      fileName: string;
    }) => {
      // Upload to Supabase Storage
      const storagePath = `${projectId}/${fileName}`;
      const file = new File([blob], fileName, { type: 'application/pdf' });

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, file, { upsert: true, cacheControl: '3600' });

      if (uploadError) throw uploadError;

      // Create a record in the files table
      const { data, error: insertError } = await supabase
        .from('files')
        .insert({
          project_id: projectId,
          name: fileName,
          file_path: storagePath,
          file_type: 'application/pdf',
          added_by: userId,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return data;
    },
    onSuccess: (_data, variables) => {
      toast.success('Compendium saved to project files');
      // Invalidate files queries so the new file appears
      queryClient.invalidateQueries({ queryKey: ['files', variables.projectId] });
    },
    onError: (err) => {
      console.error('[useSaveCompendium] Save failed:', err);
      toast.error('Failed to save compendium');
    },
  });
}
