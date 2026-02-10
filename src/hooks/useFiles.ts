import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import useAppStore from '@/store';
import type { FileRecord } from '@/types';
import { uploadFile as uploadToStorage, deleteFile as deleteFromStorage } from '@/services/storageService';

const FILES_KEY = 'files';

function filesQueryKey(projectId: string | null) {
  return [FILES_KEY, projectId] as const;
}

/**
 * Fetches all non-deleted files for the given project.
 * Results are synced into the Zustand store for cross-component access.
 */
export function useFiles(projectId: string | null) {
  const setFiles = useAppStore((s) => s.setFiles);

  return useQuery<FileRecord[]>({
    queryKey: filesQueryKey(projectId),
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('project_id', projectId)
        .is('is_deleted', false)
        .order('added_at', { ascending: false });

      if (error) throw error;

      const files = data ?? [];
      setFiles(files);
      return files;
    },
    enabled: !!projectId,
  });
}

/**
 * Uploads a file to Supabase Storage, then creates a database record.
 *
 * Storage path format: {userId}/{projectId}/{timestamp}_{filename}
 * After success, adds the new file to Zustand and invalidates the query cache.
 */
export function useUploadFile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const addFile = useAppStore((s) => s.addFile);
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);

  return useMutation({
    mutationFn: async ({
      file,
      projectId,
    }: {
      file: File;
      projectId: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Build a unique storage path
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `${user.id}/${projectId}/${timestamp}_${safeName}`;

      // 1. Upload to Supabase Storage
      const { path } = await uploadToStorage(storagePath, file, {
        upsert: false,
      });

      // 2. Determine file type category from extension
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const typeMap: Record<string, string> = {
        pdf: 'pdf',
        png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', webp: 'image', svg: 'image',
        mp3: 'audio', wav: 'audio', m4a: 'audio', ogg: 'audio', flac: 'audio',
        mp4: 'video', mov: 'video', webm: 'video', avi: 'video',
        doc: 'document', docx: 'document', rtf: 'document',
        txt: 'text', csv: 'spreadsheet',
        xls: 'spreadsheet', xlsx: 'spreadsheet',
      };
      const fileType = typeMap[ext] || 'other';

      // 3. Insert database record
      const { data, error } = await supabase
        .from('files')
        .insert({
          project_id: projectId,
          name: file.name,
          file_path: path,
          file_type: fileType,
          added_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as FileRecord;
    },
    onSuccess: (fileRecord) => {
      addFile(fileRecord);
      queryClient.invalidateQueries({
        queryKey: filesQueryKey(selectedProjectId),
      });
    },
  });
}

/**
 * Soft-deletes a file: removes from Supabase Storage,
 * marks the DB record as deleted, and removes from Zustand.
 */
export function useDeleteFile() {
  const queryClient = useQueryClient();
  const removeFile = useAppStore((s) => s.removeFile);
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);

  return useMutation({
    mutationFn: async (file: FileRecord) => {
      // 1. Delete from storage (best-effort; record still marked deleted)
      try {
        await deleteFromStorage(file.file_path);
      } catch (err) {
        console.warn('[useDeleteFile] Storage delete failed (continuing):', err);
      }

      // 2. Soft-delete in database
      const { error } = await supabase
        .from('files')
        .update({ is_deleted: true })
        .eq('id', file.id);

      if (error) throw error;
      return file.id;
    },
    onSuccess: (fileId) => {
      removeFile(fileId);
      queryClient.invalidateQueries({
        queryKey: filesQueryKey(selectedProjectId),
      });
    },
  });
}
