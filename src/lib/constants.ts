export const APP_NAME = 'Clarity Hub';

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'],
  'audio/*': ['.mp3', '.wav', '.m4a', '.ogg', '.flac'],
  'video/*': ['.mp4', '.mov', '.webm', '.avi'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
  'text/csv': ['.csv'],
};

export const FILE_TYPE_COLORS: Record<string, string> = {
  pdf: 'text-red-500',
  image: 'text-blue-500',
  audio: 'text-purple-500',
  video: 'text-orange-500',
  document: 'text-sky-500',
  spreadsheet: 'text-green-500',
  text: 'text-slate-500',
  other: 'text-slate-400',
};

export const PANEL_WIDTHS_KEY = 'clarity-hub-panel-widths';
export const THEME_KEY = 'clarity-hub-theme';
