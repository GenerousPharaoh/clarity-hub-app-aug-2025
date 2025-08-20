// Legal Document Collaboration Components Export Index
export { default as CollaborationDashboard } from './CollaborationDashboard';

// Presence Components - for legal document collaboration
export { default as UserPresenceIndicator } from './presence/UserPresenceIndicator';
export { default as CursorTracker } from './presence/CursorTracker';

// Comments Components - for document annotations
export { default as CommentSystem } from './comments/CommentSystem';

// Version Control Components - for document versioning
export { default as VersionControl } from './versions/VersionControl';

// Collaborative Viewers - for document review
export { default as CollaborativeDocumentViewer } from './viewers/CollaborativeDocumentViewer';

// Context and Hooks
export { CollaborationProvider, useCollaboration } from '../../contexts/CollaborationContext';
export type {
  UserPresence,
  DocumentComment,
  ProjectActivity,
  ChatMessage,
  CollaborationState,
} from '../../contexts/CollaborationContext';