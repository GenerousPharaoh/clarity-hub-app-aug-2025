import type { FileRecord, Note, Project } from '@/types';

const WORKSPACE_SESSION_KEY = 'clarity-hub-workspace-session-v1';

export type WorkspaceCenterTab = 'overview' | 'editor' | 'exhibits' | 'timeline' | 'drafts';
export type WorkspaceRightTab = 'viewer' | 'ai';

export interface WorkspaceSession {
  projectId: string;
  projectName: string | null;
  fileId: string | null;
  fileName: string | null;
  noteId: string | null;
  noteTitle: string | null;
  centerTab: WorkspaceCenterTab;
  rightTab: WorkspaceRightTab;
  visitedAt: string;
}

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function createDefaultSession(projectId: string): WorkspaceSession {
  return {
    projectId,
    projectName: null,
    fileId: null,
    fileName: null,
    noteId: null,
    noteTitle: null,
    centerTab: 'editor',
    rightTab: 'viewer',
    visitedAt: new Date().toISOString(),
  };
}

export function readWorkspaceSession(): WorkspaceSession | null {
  if (!canUseStorage()) return null;

  try {
    const raw = window.localStorage.getItem(WORKSPACE_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as WorkspaceSession;
  } catch {
    return null;
  }
}

export function clearWorkspaceSession(): void {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(WORKSPACE_SESSION_KEY);
}

function writeWorkspaceSession(session: WorkspaceSession): WorkspaceSession {
  if (!canUseStorage()) return session;
  window.localStorage.setItem(WORKSPACE_SESSION_KEY, JSON.stringify(session));
  return session;
}

export function saveWorkspaceProject(project: Pick<Project, 'id' | 'name'>): WorkspaceSession {
  const current = readWorkspaceSession();
  const next =
    current?.projectId === project.id
      ? {
          ...current,
          projectName: project.name,
          visitedAt: new Date().toISOString(),
        }
      : {
          ...createDefaultSession(project.id),
          projectName: project.name,
        };

  return writeWorkspaceSession(next);
}

export function saveWorkspaceFile(file: Pick<FileRecord, 'id' | 'name' | 'project_id'>): WorkspaceSession {
  const session = readWorkspaceSession();
  const current = session?.projectId === file.project_id ? session : null;

  return writeWorkspaceSession({
    ...(current ?? createDefaultSession(file.project_id)),
    fileId: file.id,
    fileName: file.name,
    projectId: file.project_id,
    rightTab: 'viewer',
    visitedAt: new Date().toISOString(),
  });
}

export function saveWorkspaceNote(note: Pick<Note, 'id' | 'title' | 'project_id'>): WorkspaceSession {
  const session = readWorkspaceSession();
  const current = session?.projectId === note.project_id ? session : null;

  return writeWorkspaceSession({
    ...(current ?? createDefaultSession(note.project_id)),
    noteId: note.id,
    noteTitle: note.title || 'Untitled',
    projectId: note.project_id,
    centerTab: 'editor',
    visitedAt: new Date().toISOString(),
  });
}

export function saveWorkspaceView(update: {
  projectId: string;
  centerTab?: WorkspaceCenterTab;
  rightTab?: WorkspaceRightTab;
}): WorkspaceSession {
  const session = readWorkspaceSession();
  const current = session?.projectId === update.projectId ? session : null;

  return writeWorkspaceSession({
    ...(current ?? createDefaultSession(update.projectId)),
    ...(update.centerTab ? { centerTab: update.centerTab } : {}),
    ...(update.rightTab ? { rightTab: update.rightTab } : {}),
    projectId: update.projectId,
    visitedAt: new Date().toISOString(),
  });
}
