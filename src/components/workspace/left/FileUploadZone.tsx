import { useState, useCallback } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { Upload, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from '@/lib/constants';
import { useUploadFile } from '@/hooks/useFiles';
import { useProcessFile } from '@/hooks/useProcessFile';
import { formatFileSize } from '@/lib/utils';
import useAppStore from '@/store';
import { useAuth } from '@/contexts/AuthContext';

interface FileUploadZoneProps {
  projectId: string;
}

export function FileUploadZone({ projectId }: FileUploadZoneProps) {
  const uploadFile = useUploadFile();
  const { processFile } = useProcessFile();
  const { isDemoMode } = useAuth();
  const processOnUpload = useAppStore((s) => s.processOnUpload);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);

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
          setUploadingFile(file.name);

          const fileRecord = await uploadFile.mutateAsync({ file, projectId });

          toast.success(`Uploaded ${file.name}`, {
            icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
          });

          if (processOnUpload) {
            void processFile(fileRecord.id, projectId, {
              fileSizeBytes: file.size,
              source: 'auto',
            })
              .then(() => {
                toast.success(`Processed ${file.name} for AI search`);
              })
              .catch((err) => {
                const description = err instanceof Error ? err.message : 'Processing skipped';
                toast.error(`Uploaded ${file.name}, but processing was skipped`, {
                  description,
                });
              });
          }

          setUploadingFile(null);
        } catch (err) {
          setUploadingFile(null);
          const message =
            err instanceof Error ? err.message : 'Upload failed';
          toast.error(`Failed to upload ${file.name}`, {
            description: message,
            icon: <AlertCircle className="h-4 w-4 text-red-500" />,
          });
        }
      }
    },
    [processFile, processOnUpload, projectId, uploadFile]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    noClick: true, // We use a separate button for click-to-upload
    noKeyboard: false,
  });

  return (
    <div className="shrink-0">
      {/* Drop zone overlay */}
      <div
        {...getRootProps()}
        className={cn(
          'relative overflow-hidden rounded-[22px] border border-dashed transition-all duration-200',
          isDragActive
            ? 'border-primary-400 bg-white/92 shadow-[0_20px_48px_-32px_rgba(30,43,57,0.42)] ring-1 ring-primary-500/12 dark:border-primary-500 dark:bg-surface-900/82 dark:ring-primary-400/18'
            : 'border-surface-200/90 bg-surface-50/80 dark:border-surface-700/80 dark:bg-surface-950/30'
        )}
      >
        <input {...getInputProps()} />

        {/* Drag active state */}
        {isDragActive && (
          <div className="flex flex-col items-center gap-2 px-4 py-7 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-100/85 dark:bg-primary-900/30">
              <Upload className="h-4 w-4 text-primary-600 dark:text-primary-400" />
            </div>
            <p className="text-sm font-semibold text-primary-700 dark:text-primary-300">
              Drop files here
            </p>
            <p className="max-w-[16rem] text-[11px] leading-5 text-primary-600/80 dark:text-primary-300/70">
              Max {formatFileSize(MAX_FILE_SIZE)} per file
            </p>
          </div>
        )}

        {/* Upload progress */}
        {!isDragActive && uploadingFile && (
          <div className="flex items-center gap-3 px-3 py-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary-50 dark:bg-primary-900/20">
              <Loader2 className="h-4 w-4 animate-spin text-primary-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-surface-700 dark:text-surface-200">
                {uploadingFile}
              </p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-100 dark:bg-surface-700">
                <div className="h-full w-1/3 animate-[indeterminate_1.5s_ease-in-out_infinite] rounded-full bg-primary-500" />
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-surface-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-surface-500 dark:bg-surface-800 dark:text-surface-400">
              Uploading
            </span>
          </div>
        )}

        {/* Upload button (persistent, always visible when not dragging and not uploading) */}
        {!isDragActive && !uploadingFile && (
          <div className="p-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-surface-200/80 dark:bg-surface-900 dark:ring-surface-700/80">
                <Upload className="h-4 w-4 text-primary-500 dark:text-primary-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-surface-400 dark:text-surface-500">
                  Intake
                </p>
                <p className="mt-1 text-sm font-medium text-surface-800 dark:text-surface-100">
                  {isDemoMode ? 'Uploads require sign-in' : 'Drop evidence or browse'}
                </p>
                <p className="mt-1 text-[11px] leading-5 text-surface-500 dark:text-surface-400">
                  PDF, DOCX, image, audio, video, and text files are supported.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={isDemoMode ? undefined : open}
              disabled={isDemoMode}
              className={cn(
                'mt-3 flex w-full items-center justify-center gap-2 rounded-2xl px-3 py-2.5',
                'border border-dashed border-surface-300 bg-white text-xs font-medium text-surface-600 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-300',
                'transition-all duration-150',
                'hover:border-primary-400 hover:bg-surface-50 hover:text-primary-700',
                'dark:hover:border-primary-500 dark:hover:bg-surface-900 dark:hover:text-primary-300',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1',
                'dark:focus-visible:ring-offset-surface-900',
                isDemoMode && 'cursor-not-allowed opacity-60 hover:border-surface-300 hover:bg-white hover:text-surface-600 dark:hover:border-surface-700 dark:hover:bg-surface-900 dark:hover:text-surface-300'
              )}
            >
              <Upload className="h-3.5 w-3.5" />
              {isDemoMode ? 'Uploads disabled in demo' : 'Choose files'}
            </button>
          </div>
        )}
      </div>

      {isDemoMode && (
        <p className="mt-2 px-1 text-[11px] leading-relaxed text-surface-400 dark:text-surface-500">
          Demo workspaces include seeded files only. Sign in with Google to upload and process your own documents.
        </p>
      )}
    </div>
  );
}
