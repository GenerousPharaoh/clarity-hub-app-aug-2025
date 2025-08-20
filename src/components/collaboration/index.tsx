// Collaboration Components Export Index
export { default as CollaborationDashboard } from './CollaborationDashboard';

// Presence Components
export { default as UserPresenceIndicator } from './presence/UserPresenceIndicator';
export { default as CursorTracker } from './presence/CursorTracker';

// Comments Components
export { default as CommentSystem } from './comments/CommentSystem';

// Activity Components
export { default as ActivityFeed } from './activity/ActivityFeed';

// Chat Components
export { default as TeamChat } from './chat/TeamChat';

// Whiteboard Components
export { default as CollaborativeWhiteboard } from './whiteboard/CollaborativeWhiteboard';

// Workspace Components
export { default as WorkspacePermissions } from './workspace/WorkspacePermissions';

// Version Control Components
export { default as VersionControl } from './versions/VersionControl';

// Collaborative Viewers
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