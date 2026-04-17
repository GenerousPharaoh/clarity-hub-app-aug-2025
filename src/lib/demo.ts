import type { ExhibitMarker, FileRecord, Note, Project } from '@/types';

export const DEMO_MODE_KEY = 'clarity-hub-demo-mode';
const DEMO_STATE_KEY = 'clarity-hub-demo-state-v1';
const DEMO_STATE_VERSION = 1;

export const DEMO_USER_ID = '00000000-0000-0000-0000-000000000000';

export interface DemoAuthUser {
  id: string;
  email: string;
  created_at: string;
  user_metadata: {
    full_name: string;
    avatar_url: string | null;
    demo: true;
  };
}

interface DemoState {
  projects: Project[];
  files: FileRecord[];
  notes: Note[];
  exhibits: ExhibitMarker[];
}

interface StoredDemoState {
  version: number;
  state: DemoState;
}

export const DEMO_AUTH_USER: DemoAuthUser = {
  id: DEMO_USER_ID,
  email: 'demo@clarityhubtester.com',
  created_at: '2026-01-12T15:00:00.000Z',
  user_metadata: {
    full_name: 'Demo Counsel',
    avatar_url: null,
    demo: true,
  },
};

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cloneState(state: DemoState): DemoState {
  return {
    projects: state.projects.map((project) => ({ ...project })),
    files: state.files.map((file) => ({ ...file })),
    notes: state.notes.map((note) => ({ ...note })),
    exhibits: state.exhibits.map((exhibit) => ({ ...exhibit })),
  };
}

function createSeedState(): DemoState {
  return {
    projects: [
      {
        id: 'demo-project-raven-imports',
        owner_id: DEMO_USER_ID,
        name: 'Raven Imports Termination',
        description:
          'A wrongful dismissal matter focused on notice entitlement, bad-faith termination conduct, and preserving the key documentary record.',
        goal_type: 'Employment',
        created_at: '2026-02-18T14:10:00.000Z',
        updated_at: '2026-03-04T16:45:00.000Z',
        case_analysis: null,
        case_analysis_at: null,
        case_analysis_file_count: null,
      },
      {
        id: 'demo-project-north-shore',
        owner_id: DEMO_USER_ID,
        name: 'North Shore Accommodation',
        description:
          'An accommodation file tracking the timeline, internal communications, and the strongest exhibits for a human-rights focused claim.',
        goal_type: 'Accommodation',
        created_at: '2026-02-11T10:20:00.000Z',
        updated_at: '2026-03-03T12:30:00.000Z',
        case_analysis: null,
        case_analysis_at: null,
        case_analysis_file_count: null,
      },
    ],
    files: [
      {
        id: 'demo-file-termination-letter',
        project_id: 'demo-project-raven-imports',
        name: 'Termination Letter.txt',
        file_path: '/demo/termination-letter.txt',
        file_type: 'text',
        added_by: DEMO_USER_ID,
        added_at: '2026-03-01T09:15:00.000Z',
        content: null,
        last_modified: '2026-03-01T09:15:00.000Z',
        is_deleted: false,
        processing_status: 'completed',
        processed_at: '2026-03-01T09:18:00.000Z',
        ai_summary:
          'Termination without cause with four weeks of pay, immediate cutoff of systems access, and no mention of bonus treatment or benefits continuation.',
        extracted_text:
          'Termination without cause with four weeks of pay, immediate cutoff of systems access, and no mention of bonus treatment or benefits continuation.',
        chunk_count: 3,
        processing_error: null,
        document_type: null,
        classification_metadata: null,
        classification_confidence: null,
        classification_source: null,
        classified_at: null,
      },
      {
        id: 'demo-file-manager-email',
        project_id: 'demo-project-raven-imports',
        name: 'Manager Follow-up Email.txt',
        file_path: '/demo/manager-follow-up-email.txt',
        file_type: 'text',
        added_by: DEMO_USER_ID,
        added_at: '2026-03-02T13:05:00.000Z',
        content: null,
        last_modified: '2026-03-02T13:05:00.000Z',
        is_deleted: false,
        processing_status: 'completed',
        processed_at: '2026-03-02T13:08:00.000Z',
        ai_summary:
          'Internal email frames the departure as a quick leadership reset and suggests limiting transition messaging, which may be relevant to bad-faith conduct.',
        extracted_text:
          'Internal email frames the departure as a quick leadership reset and suggests limiting transition messaging, which may be relevant to bad-faith conduct.',
        chunk_count: 2,
        processing_error: null,
        document_type: null,
        classification_metadata: null,
        classification_confidence: null,
        classification_source: null,
        classified_at: null,
      },
      {
        id: 'demo-file-accommodation-timeline',
        project_id: 'demo-project-north-shore',
        name: 'Accommodation Timeline.txt',
        file_path: '/demo/accommodation-timeline.txt',
        file_type: 'text',
        added_by: DEMO_USER_ID,
        added_at: '2026-02-27T08:40:00.000Z',
        content: null,
        last_modified: '2026-02-27T08:40:00.000Z',
        is_deleted: false,
        processing_status: 'completed',
        processed_at: '2026-02-27T08:43:00.000Z',
        ai_summary:
          'Chronology of accommodation requests, physician restrictions, and employer responses showing repeated delay before a structured return-to-work plan.',
        extracted_text:
          'Chronology of accommodation requests, physician restrictions, and employer responses showing repeated delay before a structured return-to-work plan.',
        chunk_count: 4,
        processing_error: null,
        document_type: null,
        classification_metadata: null,
        classification_confidence: null,
        classification_source: null,
        classified_at: null,
      },
      {
        id: 'demo-file-performance-review',
        project_id: 'demo-project-north-shore',
        name: 'Performance Review Excerpt.txt',
        file_path: '/demo/performance-review-excerpt.txt',
        file_type: 'text',
        added_by: DEMO_USER_ID,
        added_at: '2026-02-28T11:25:00.000Z',
        content: null,
        last_modified: '2026-02-28T11:25:00.000Z',
        is_deleted: false,
        processing_status: 'completed',
        processed_at: '2026-02-28T11:27:00.000Z',
        ai_summary:
          'Review praises quality of work but raises concerns about consistency during the period when medical restrictions were being discussed.',
        extracted_text:
          'Review praises quality of work but raises concerns about consistency during the period when medical restrictions were being discussed.',
        chunk_count: 2,
        processing_error: null,
        document_type: null,
        classification_metadata: null,
        classification_confidence: null,
        classification_source: null,
        classified_at: null,
      },
    ],
    notes: [
      {
        id: 'demo-note-raven-strategy',
        project_id: 'demo-project-raven-imports',
        title: 'Settlement strategy',
        content:
          '# Objectives\n\n- Preserve the bad-faith narrative.\n- Quantify notice using role, tenure, and compensation structure.\n- Use the follow-up email as leverage for a stronger opening demand.\n\n## Next steps\n\n1. Confirm bonus language.\n2. Pull comparable notice cases.\n3. Draft demand letter with exhibit references.',
        created_by: DEMO_USER_ID,
        created_at: '2026-03-03T10:15:00.000Z',
        last_modified: '2026-03-04T15:10:00.000Z',
      },
      {
        id: 'demo-note-accommodation-chronology',
        project_id: 'demo-project-north-shore',
        title: 'Chronology and gaps',
        content:
          '# Chronology\n\n- Employee disclosed restrictions on January 12.\n- Employer requested more detail on January 19.\n- Return-to-work proposal was not discussed until February 7.\n\n## Gaps to test\n\n- Whether modified duties were actually explored.\n- Whether scheduling decisions matched the stated restrictions.',
        created_by: DEMO_USER_ID,
        created_at: '2026-03-01T09:05:00.000Z',
        last_modified: '2026-03-03T12:20:00.000Z',
      },
    ],
    exhibits: [
      {
        id: 'demo-exhibit-raven-a',
        project_id: 'demo-project-raven-imports',
        exhibit_id: 'Exhibit A',
        file_id: 'demo-file-termination-letter',
        description: 'Termination letter delivered on March 1, 2026.',
        created_at: '2026-03-01T09:30:00.000Z',
        sort_order: 0,
      },
      {
        id: 'demo-exhibit-raven-b',
        project_id: 'demo-project-raven-imports',
        exhibit_id: 'Exhibit B',
        file_id: 'demo-file-manager-email',
        description: 'Manager email discussing the optics of the departure.',
        created_at: '2026-03-02T13:20:00.000Z',
        sort_order: 1,
      },
      {
        id: 'demo-exhibit-north-shore-a',
        project_id: 'demo-project-north-shore',
        exhibit_id: 'Exhibit A',
        file_id: 'demo-file-accommodation-timeline',
        description: 'Chronology of accommodation requests and responses.',
        created_at: '2026-02-27T09:00:00.000Z',
        sort_order: 0,
      },
    ],
  };
}

function touchProject(state: DemoState, projectId: string): void {
  state.projects = state.projects.map((project) =>
    project.id === projectId
      ? { ...project, updated_at: new Date().toISOString() }
      : project
  );
}

function readStoredState(): StoredDemoState | null {
  if (!canUseStorage()) return null;

  try {
    const raw = window.localStorage.getItem(DEMO_STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredDemoState;
  } catch {
    return null;
  }
}

export function isDemoModeEnabled(): boolean {
  if (!canUseStorage()) return false;
  return window.localStorage.getItem(DEMO_MODE_KEY) === '1';
}

export function enableDemoMode(): void {
  if (!canUseStorage()) return;
  try { window.localStorage.setItem(DEMO_MODE_KEY, '1'); } catch { /* ignore */ }
}

export function disableDemoMode(): void {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(DEMO_MODE_KEY);
}

export function readDemoState(): DemoState {
  const stored = readStoredState();
  if (!stored || stored.version !== DEMO_STATE_VERSION) {
    return createSeedState();
  }

  return cloneState(stored.state);
}

export function writeDemoState(state: DemoState): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(
      DEMO_STATE_KEY,
      JSON.stringify({
        version: DEMO_STATE_VERSION,
        state,
      } satisfies StoredDemoState)
    );
  } catch { /* ignore QuotaExceededError */ }
}

export function ensureDemoState(): DemoState {
  const state = readDemoState();
  writeDemoState(state);
  return cloneState(state);
}

export function resetDemoState(): DemoState {
  const seed = createSeedState();
  writeDemoState(seed);
  return cloneState(seed);
}

function updateDemoState<T>(updater: (state: DemoState) => T): T {
  const state = readDemoState();
  const result = updater(state);
  writeDemoState(state);
  return result;
}

export function getDemoProjects(): Project[] {
  return ensureDemoState().projects;
}

export function getDemoFiles(projectId?: string | null): FileRecord[] {
  const files = ensureDemoState().files.filter((file) => !file.is_deleted);
  if (!projectId) return files;
  return files.filter((file) => file.project_id === projectId);
}

export function getDemoNotes(projectId?: string | null): Note[] {
  const notes = ensureDemoState().notes;
  if (!projectId) return notes;
  return notes.filter((note) => note.project_id === projectId);
}

export function getDemoExhibits(projectId?: string | null): ExhibitMarker[] {
  const exhibits = ensureDemoState().exhibits;
  if (!projectId) return exhibits;
  return exhibits.filter((exhibit) => exhibit.project_id === projectId);
}

export function getDemoProjectFileCounts(projectIds: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const file of getDemoFiles()) {
    if (!projectIds.includes(file.project_id)) continue;
    counts[file.project_id] = (counts[file.project_id] || 0) + 1;
  }
  return counts;
}

export function createDemoProject(input: {
  name: string;
  description?: string;
  goalType?: string;
  ownerId?: string | null;
}): Project {
  return updateDemoState((state) => {
    const now = new Date().toISOString();
    const project: Project = {
      id: createId('demo-project'),
      owner_id: input.ownerId ?? DEMO_USER_ID,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      goal_type: input.goalType?.trim() || null,
      created_at: now,
      updated_at: now,
      case_analysis: null,
      case_analysis_at: null,
      case_analysis_file_count: null,
    };

    state.projects.unshift(project);
    return { ...project };
  });
}

export function updateDemoProject(
  projectId: string,
  updates: {
    name?: string;
    description?: string | null;
  }
): Project {
  return updateDemoState((state) => {
    let updatedProject: Project | null = null;

    state.projects = state.projects.map((project) => {
      if (project.id !== projectId) return project;

      updatedProject = {
        ...project,
        ...(updates.name !== undefined ? { name: updates.name.trim() } : {}),
        ...(updates.description !== undefined ? { description: updates.description } : {}),
        updated_at: new Date().toISOString(),
      };

      return updatedProject;
    });

    if (!updatedProject) {
      throw new Error('Demo project not found');
    }

    return updatedProject;
  });
}

export function deleteDemoProject(projectId: string): void {
  updateDemoState((state) => {
    state.projects = state.projects.filter((project) => project.id !== projectId);
    state.files = state.files.filter((file) => file.project_id !== projectId);
    state.notes = state.notes.filter((note) => note.project_id !== projectId);
    state.exhibits = state.exhibits.filter((exhibit) => exhibit.project_id !== projectId);
  });
}

export function deleteDemoFile(fileId: string): FileRecord {
  return updateDemoState((state) => {
    const file = state.files.find((entry) => entry.id === fileId);
    if (!file) {
      throw new Error('Demo file not found');
    }

    const deletedFile = {
      ...file,
      is_deleted: true,
      last_modified: new Date().toISOString(),
    };

    state.files = state.files.map((entry) => (entry.id === fileId ? deletedFile : entry));
    touchProject(state, file.project_id);
    return deletedFile;
  });
}

export function createDemoNote(input: {
  projectId: string;
  title?: string;
  content?: string;
  createdBy?: string | null;
}): Note {
  return updateDemoState((state) => {
    const now = new Date().toISOString();
    const note: Note = {
      id: createId('demo-note'),
      project_id: input.projectId,
      title: input.title?.trim() || 'Untitled',
      content: input.content ?? null,
      created_by: input.createdBy ?? DEMO_USER_ID,
      created_at: now,
      last_modified: now,
    };

    state.notes.unshift(note);
    touchProject(state, input.projectId);
    return { ...note };
  });
}

export function updateDemoNote(
  noteId: string,
  updates: {
    title?: string;
    content?: string;
  }
): Note {
  return updateDemoState((state) => {
    let updatedNote: Note | null = null;

    state.notes = state.notes.map((note) => {
      if (note.id !== noteId) return note;

      updatedNote = {
        ...note,
        ...(updates.title !== undefined ? { title: updates.title } : {}),
        ...(updates.content !== undefined ? { content: updates.content } : {}),
        last_modified: new Date().toISOString(),
      };

      return updatedNote;
    });

    if (!updatedNote) {
      throw new Error('Demo note not found');
    }

    const nextNote = updatedNote as Note;
    touchProject(state, nextNote.project_id);
    return nextNote;
  });
}

export function deleteDemoNote(noteId: string): { id: string; projectId: string } {
  return updateDemoState((state) => {
    const note = state.notes.find((entry) => entry.id === noteId);
    if (!note) {
      throw new Error('Demo note not found');
    }

    state.notes = state.notes.filter((entry) => entry.id !== noteId);
    touchProject(state, note.project_id);
    return { id: noteId, projectId: note.project_id };
  });
}

export function createDemoExhibit(input: {
  projectId: string;
  exhibitId: string;
  description?: string;
  fileId?: string | null;
}): ExhibitMarker {
  return updateDemoState((state) => {
    const maxOrder = state.exhibits
      .filter((e) => e.project_id === input.projectId)
      .reduce((max, e) => Math.max(max, e.sort_order), -1);

    const exhibit: ExhibitMarker = {
      id: createId('demo-exhibit'),
      project_id: input.projectId,
      exhibit_id: input.exhibitId,
      description: input.description?.trim() || null,
      file_id: input.fileId || null,
      created_at: new Date().toISOString(),
      sort_order: maxOrder + 1,
    };

    state.exhibits.push(exhibit);
    touchProject(state, input.projectId);
    return { ...exhibit };
  });
}

export function updateDemoExhibit(
  exhibitId: string,
  updates: {
    description?: string;
    fileId?: string | null;
    exhibitId?: string;
  }
): ExhibitMarker {
  return updateDemoState((state) => {
    let updatedExhibit: ExhibitMarker | null = null;

    state.exhibits = state.exhibits.map((exhibit) => {
      if (exhibit.id !== exhibitId) return exhibit;

      updatedExhibit = {
        ...exhibit,
        ...(updates.description !== undefined
          ? { description: updates.description.trim() || null }
          : {}),
        ...(updates.fileId !== undefined ? { file_id: updates.fileId || null } : {}),
        ...(updates.exhibitId !== undefined ? { exhibit_id: updates.exhibitId } : {}),
      };

      return updatedExhibit;
    });

    if (!updatedExhibit) {
      throw new Error('Demo exhibit not found');
    }

    const nextExhibit = updatedExhibit as ExhibitMarker;
    touchProject(state, nextExhibit.project_id);
    return nextExhibit;
  });
}

export function deleteDemoExhibit(exhibitId: string): { id: string; projectId: string } {
  return updateDemoState((state) => {
    const exhibit = state.exhibits.find((entry) => entry.id === exhibitId);
    if (!exhibit) {
      throw new Error('Demo exhibit not found');
    }

    state.exhibits = state.exhibits.filter((entry) => entry.id !== exhibitId);
    touchProject(state, exhibit.project_id);
    return { id: exhibitId, projectId: exhibit.project_id };
  });
}
