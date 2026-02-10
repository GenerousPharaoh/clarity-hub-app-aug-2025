import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '';
  return format(new Date(date), 'MMM d, yyyy');
}

export function formatRelativeDate(date: string | null | undefined): string {
  if (!date) return '';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

export function getFileTypeFromExtension(ext: string): string {
  const map: Record<string, string> = {
    pdf: 'pdf',
    png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', webp: 'image', svg: 'image',
    mp3: 'audio', wav: 'audio', m4a: 'audio', ogg: 'audio', flac: 'audio',
    mp4: 'video', mov: 'video', webm: 'video', avi: 'video',
    doc: 'document', docx: 'document', txt: 'text', rtf: 'document',
    xls: 'spreadsheet', xlsx: 'spreadsheet', csv: 'spreadsheet',
    ppt: 'presentation', pptx: 'presentation',
  };
  return map[ext] || 'other';
}

export function getFileType(filename: string): import('../types').ViewerFileType {
  const ext = getFileExtension(filename);
  const map: Record<string, import('../types').ViewerFileType> = {
    pdf: 'pdf',
    png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', webp: 'image', svg: 'image', bmp: 'image',
    mp3: 'audio', wav: 'audio', m4a: 'audio', ogg: 'audio', flac: 'audio', aac: 'audio',
    mp4: 'video', mov: 'video', webm: 'video', avi: 'video', mkv: 'video',
    txt: 'text', md: 'text', json: 'text', csv: 'text', xml: 'text', html: 'text',
    js: 'text', ts: 'text', jsx: 'text', tsx: 'text', css: 'text', py: 'text',
    log: 'text', yml: 'text', yaml: 'text', toml: 'text', ini: 'text', cfg: 'text',
  };
  return map[ext] || 'unsupported';
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
