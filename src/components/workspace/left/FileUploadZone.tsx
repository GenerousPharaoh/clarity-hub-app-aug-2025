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
  const aiEnabled = useAppStore((s) => s.aiEnabled);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejections: FileRejection[]) => {
      for (const rejection of rejections) {
        const reasons = rejection.errors.map((e) => e.message).join(', ');
        toast.error(`Rejected: ${rejection.file.name}`, {
          description: reasons,
        });
      }

      for (const file of acceptedFiles) {
        try {
          setUploadingFile(file.name);
          const fileRecord = await uploadFile.mutateAsync({ file, projectId });
          toast.success(`Uploaded ${file.name}`, {
            icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
          });

          if (processOnUpload && aiEnabled) {
            void processFile(fileRecord.id, projectId, {
              fileSizeBytes: file.size,
              source: 'auto',
            })
              .then(() => {
                toast.success(`Processed ${file.name} for AI search`);
              })
              .catch((err) => {
                const description =
                  err instanceof Error ? err.message : 'Processing skipped';
                toast.error(
                  `Uploaded ${file.name}, but processing was skipped`,
                  { description }
                );
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
    [processFile, processOnUpload, aiEnabled, projectId, uploadFile]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    noClick: true,
    noKeyboard: false,
  });

  return (
    <div {...getRootProps()} className="shrink-0">
      <input {...getInputProps()} />

      {/* Drag active overlay */}
      {isDragActive ? (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-primary-400 bg-primary-50/60 px-3 py-3 text-center dark:border-primary-500 dark:bg-primary-900/15">
          <Upload className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />
          <span className="text-xs font-medium text-primary-700 dark:text-primary-300">
            Drop files here
          </span>
          <span className="text-[10px] text-primary-500 dark:text-primary-400">
            (max {formatFileSize(MAX_FILE_SIZE)})
          </span>
        </div>
      ) : uploadingFile ? (
        /* Upload progress — compact bar */
        <div className="flex items-center gap-2 rounded-lg border border-surface-200 bg-surface-50 px-2.5 py-2 dark:border-surface-700 dark:bg-surface-800">
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-primary-500" />
          <div className="min-w-0 flex-1">
            <p
              className="truncate text-xs font-medium text-surface-700 dark:text-surface-200"
              title={uploadingFile}
            >
              {uploadingFile}
            </p>
            <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-surface-200 dark:bg-surface-700">
              <div className="h-full w-1/3 animate-[indeterminate_1.5s_ease-in-out_infinite] rounded-full bg-primary-500" />
            </div>
          </div>
          <span className="shrink-0 text-[10px] font-medium uppercase tracking-wider text-surface-400">
            Uploading
          </span>
        </div>
      ) : (
        /* Idle — single compact upload button */
        <button
          type="button"
          onClick={isDemoMode ? undefined : open}
          disabled={isDemoMode}
          className={cn(
            'flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed px-3 py-1.5',
            'text-xs font-medium transition-all duration-100',
            isDemoMode
              ? 'border-surface-200 text-surface-400 dark:border-surface-700 dark:text-surface-500'
              : 'border-surface-300 text-surface-500 hover:border-primary-400 hover:bg-primary-50/50 hover:text-primary-700 dark:border-surface-700 dark:text-surface-400 dark:hover:border-primary-600 dark:hover:bg-primary-950/20 dark:hover:text-primary-300'
          )}
          title={
            isDemoMode
              ? 'Uploads disabled in demo'
              : 'Click to choose files or drag & drop'
          }
        >
          <Upload className="h-3 w-3" />
          {isDemoMode ? 'Uploads disabled' : 'Upload or drop files'}
        </button>
      )}
    </div>
  );
}
