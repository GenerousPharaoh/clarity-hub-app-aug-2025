import { useState, useCallback } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { Upload, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from '@/lib/constants';
import { useUploadFile } from '@/hooks/useFiles';
import { formatFileSize } from '@/lib/utils';

interface FileUploadZoneProps {
  projectId: string;
}

export function FileUploadZone({ projectId }: FileUploadZoneProps) {
  const uploadFile = useUploadFile();
  const [uploadProgress, setUploadProgress] = useState<{
    fileName: string;
    progress: number;
  } | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejections: FileRejection[]) => {
      // Handle rejected files
      for (const rejection of rejections) {
        const reasons = rejection.errors.map((e) => e.message).join(', ');
        toast.error(`Rejected: ${rejection.file.name}`, {
          description: reasons,
        });
      }

      // Upload accepted files sequentially
      for (const file of acceptedFiles) {
        try {
          setUploadProgress({ fileName: file.name, progress: 10 });

          // Simulate progress stages since Supabase doesn't provide progress callbacks
          const progressInterval = setInterval(() => {
            setUploadProgress((prev) => {
              if (!prev || prev.progress >= 85) return prev;
              return { ...prev, progress: prev.progress + Math.random() * 15 };
            });
          }, 200);

          await uploadFile.mutateAsync({ file, projectId });

          clearInterval(progressInterval);
          setUploadProgress({ fileName: file.name, progress: 100 });

          toast.success(`Uploaded ${file.name}`, {
            icon: <CheckCircle2 className="h-4 w-4 text-success" />,
          });

          // Clear progress after brief success display
          setTimeout(() => setUploadProgress(null), 800);
        } catch (err) {
          setUploadProgress(null);
          const message =
            err instanceof Error ? err.message : 'Upload failed';
          toast.error(`Failed to upload ${file.name}`, {
            description: message,
            icon: <AlertCircle className="h-4 w-4 text-error" />,
          });
        }
      }
    },
    [projectId, uploadFile]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    noClick: true, // We use a separate button for click-to-upload
    noKeyboard: false,
  });

  return (
    <div className="shrink-0 px-3 pb-1">
      {/* Drop zone overlay */}
      <div
        {...getRootProps()}
        className={cn(
          'relative rounded-lg border-2 border-dashed transition-all duration-200',
          isDragActive
            ? 'border-primary-400 bg-primary-50/80 dark:border-primary-500 dark:bg-primary-900/20'
            : 'border-transparent'
        )}
      >
        <input {...getInputProps()} />

        {/* Drag active state */}
        {isDragActive && (
          <div className="flex flex-col items-center gap-1.5 py-6 px-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-800/40">
              <Upload className="h-4 w-4 text-primary-600 dark:text-primary-400" />
            </div>
            <p className="text-xs font-medium text-primary-600 dark:text-primary-400">
              Drop files here
            </p>
            <p className="text-[11px] text-primary-500/70 dark:text-primary-400/60">
              Max {formatFileSize(MAX_FILE_SIZE)} per file
            </p>
          </div>
        )}

        {/* Upload progress */}
        {!isDragActive && uploadProgress && (
          <div className="flex items-center gap-2.5 py-2.5 px-1">
            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-primary-500" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-surface-700 dark:text-surface-200">
                {uploadProgress.fileName}
              </p>
              <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-surface-100 dark:bg-surface-700">
                <div
                  className="h-full rounded-full bg-primary-500 transition-[width] duration-300 ease-out"
                  style={{ width: `${Math.min(uploadProgress.progress, 100)}%` }}
                />
              </div>
            </div>
            <span className="shrink-0 text-[11px] tabular-nums text-surface-400">
              {Math.round(uploadProgress.progress)}%
            </span>
          </div>
        )}

        {/* Upload button (persistent, always visible when not dragging and not uploading) */}
        {!isDragActive && !uploadProgress && (
          <button
            type="button"
            onClick={open}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2',
              'border border-dashed border-surface-300 dark:border-surface-600',
              'text-xs font-medium text-surface-500 dark:text-surface-400',
              'transition-all duration-150',
              'hover:border-primary-400 hover:bg-primary-50/50 hover:text-primary-600',
              'dark:hover:border-primary-500 dark:hover:bg-primary-900/20 dark:hover:text-primary-400',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1',
              'dark:focus-visible:ring-offset-surface-800'
            )}
          >
            <Upload className="h-3.5 w-3.5" />
            Upload
          </button>
        )}
      </div>
    </div>
  );
}
