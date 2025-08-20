# Real-Time Collaboration Features

This document describes the comprehensive real-time collaboration features added to the Clarity Hub App.

## Overview

The collaboration system enables multiple users to work together seamlessly on legal documents and case preparation. Built on Supabase's real-time infrastructure, it provides live updates, presence awareness, and comprehensive collaboration tools.

## Features Implemented

### 1. Real-Time Document Collaboration

**Components:**
- `CollaborativeDocumentViewer` - Enhanced document viewer with collaboration features
- `CursorTracker` - Real-time cursor tracking and selection highlighting

**Features:**
- Multiple users can view and edit documents simultaneously
- Live cursor tracking shows where other users are working
- Text selection highlighting with user-specific colors
- Real-time content synchronization

**Usage:**
```tsx
import { CollaborativeDocumentViewer } from './components/collaboration';

<CollaborativeDocumentViewer
  documentId="doc-123"
  projectId="project-456"
  fileName="contract.pdf"
  fileType="pdf"
  onContentChange={handleContentChange}
/>
```

### 2. Comments and Annotations System

**Components:**
- `CommentSystem` - Comprehensive commenting interface
- Inline comments, highlights, sticky notes, and suggestions

**Features:**
- Add comments with different types (comment, highlight, sticky note, suggestion)
- Reply to comments with threaded conversations
- Resolve comments to mark them as complete
- Position-aware comments that anchor to specific document locations
- Real-time comment updates across all users

**Database Tables:**
- `document_comments` - Stores all comments and annotations
- Supports parent-child relationships for replies
- Position data for anchoring comments to document locations

### 3. Activity Feed

**Components:**
- `ActivityFeed` - Real-time activity stream

**Features:**
- Live updates of all project activities
- Document creation, updates, and deletions
- Comment additions and resolutions
- User join/leave events
- Permission changes
- Version control activities
- Filterable by activity type
- Grouped by date with collapse/expand functionality

**Database Tables:**
- `project_activities` - Comprehensive activity logging
- Automatic triggers for document and comment events

### 4. User Presence Indicators

**Components:**
- `UserPresenceIndicator` - Shows online users
- Multiple display variants (compact, detailed, list)

**Features:**
- Real-time online/offline status
- Shows what document/page users are viewing
- Cursor position tracking
- User avatars and status indicators
- Automatic cleanup of stale presence data

**Database Tables:**
- `user_presence` - Tracks user online status and current location
- Automatic cleanup function for old presence data

### 5. Collaborative Whiteboard

**Components:**
- `CollaborativeWhiteboard` - Interactive drawing and planning tool

**Features:**
- Multi-user drawing with different tools (pen, shapes, text, sticky notes)
- Real-time synchronization of drawing operations
- User-specific colors for drawings
- Undo/redo functionality
- Zoom and pan capabilities
- Text and sticky note placement
- Save and load whiteboard states

**Database Tables:**
- `project_whiteboards` - Stores whiteboard content and metadata

### 6. Shared Workspace with Permissions

**Components:**
- `WorkspacePermissions` - Granular permission management

**Features:**
- Role-based access control (Viewer, Commenter, Editor, Admin)
- Granular permissions (read, write, comment, share, admin)
- User invitation system with email integration
- Permission inheritance and dependencies
- Real-time permission updates

**Database Tables:**
- `workspace_permissions` - Stores user permissions for projects
- Extends the existing `projects_users` table

### 7. Version Control with Diff Viewer

**Components:**
- `VersionControl` - Document version management
- `DiffViewer` - Visual diff comparison

**Features:**
- Create document versions with commit messages
- Compare versions with side-by-side or unified diff views
- Restore previous versions
- Track changes with addition/deletion counts
- Version history with author information
- Automatic diff generation

**Database Tables:**
- `document_versions` - Stores document versions and diffs
- Automatic version creation triggers

### 8. Integrated Team Chat

**Components:**
- `TeamChat` - Project-specific chat system

**Features:**
- Real-time messaging within project context
- Message threading and replies
- Message editing and deletion
- Emoji support
- File attachments (planned)
- User mentions (planned)
- Message history with pagination

**Database Tables:**
- `chat_messages` - Stores all chat messages
- Support for threading and metadata

## Database Schema

### Core Tables

```sql
-- User presence tracking
user_presence (
  id, user_id, project_id, document_id, status, 
  cursor_position, last_seen, current_page, created_at, updated_at
)

-- Comments and annotations
document_comments (
  id, document_id, project_id, author_id, parent_id, content,
  comment_type, position, metadata, resolved, resolved_by, 
  resolved_at, created_at, updated_at
)

-- Activity tracking
project_activities (
  id, project_id, user_id, activity_type, target_id, 
  target_type, details, created_at
)

-- Permission management
workspace_permissions (
  id, project_id, user_id, permissions, granted_by,
  created_at, updated_at
)

-- Version control
document_versions (
  id, document_id, version_number, content, content_diff,
  author_id, commit_message, file_size, checksum, created_at
)

-- Whiteboard data
project_whiteboards (
  id, project_id, name, content, created_by, 
  created_at, updated_at
)

-- Team chat
chat_messages (
  id, project_id, thread_id, author_id, content,
  message_type, metadata, edited, edited_at, created_at
)

-- Collaboration sessions
collaboration_sessions (
  id, document_id, project_id, session_token,
  active_users, operational_transform, created_at, updated_at
)
```

### Real-Time Features

All tables are enabled for Supabase real-time with proper RLS policies:

```sql
-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;
ALTER PUBLICATION supabase_realtime ADD TABLE document_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE project_activities;
-- ... etc for all tables
```

## Context and State Management

### CollaborationContext

The `CollaborationContext` provides centralized state management for all collaboration features:

**State:**
- `activeUsers` - List of online users with presence data
- `comments` - Document comments and annotations
- `activities` - Project activity feed
- `chatMessages` - Team chat messages
- `currentDocument` - Currently viewed document ID
- `currentProject` - Current project ID
- `isConnected` - Real-time connection status

**Methods:**
- `updatePresence()` - Update user presence and cursor position
- `addComment()`, `updateComment()`, `deleteComment()`, `resolveComment()` - Comment management
- `sendMessage()`, `editMessage()` - Chat functionality
- `joinProject()`, `leaveProject()` - Project collaboration
- `joinDocument()`, `leaveDocument()` - Document collaboration

### Usage Example

```tsx
import { useCollaboration } from './contexts/CollaborationContext';

function MyComponent() {
  const {
    state,
    addComment,
    updatePresence,
    sendMessage
  } = useCollaboration();

  // Join a project
  useEffect(() => {
    joinProject('project-123');
    return () => leaveProject('project-123');
  }, []);

  // Add a comment
  const handleAddComment = () => {
    addComment({
      document_id: 'doc-123',
      project_id: 'project-123',
      content: 'This needs review',
      comment_type: 'comment',
      position: { page: 1, x: 100, y: 200 }
    });
  };
}
```

## Integration

### CollaborationDashboard

The main collaboration interface is integrated via `CollaborationDashboard`:

```tsx
import { CollaborationDashboard } from './components/collaboration';

<CollaborationDashboard
  projectId={projectId}
  documentId={documentId}
  documentContent={content}
  containerRef={viewerRef}
  onDocumentChange={handleContentChange}
/>
```

### Provider Setup

Wrap your app with the CollaborationProvider:

```tsx
import { CollaborationProvider } from './contexts/CollaborationContext';

<CollaborationProvider>
  <App />
</CollaborationProvider>
```

## Security

### Row Level Security (RLS)

All collaboration tables implement comprehensive RLS policies:

- Users can only access data for projects they're members of
- Comments and activities are project-scoped
- Presence data is only visible to project members
- Workspace permissions are managed by project owners/admins

### Permission System

Granular permissions control access to features:

- **Read**: View documents and data
- **Write**: Edit documents and whiteboard
- **Comment**: Add comments and annotations
- **Share**: Invite other users
- **Admin**: Full access including permission management

## Performance

### Optimizations

- **Real-time subscriptions**: Efficient channel management with automatic cleanup
- **Presence throttling**: Cursor updates are throttled to prevent excessive updates
- **Data pagination**: Chat messages and activities are paginated
- **Cleanup functions**: Automatic removal of stale presence and old data

### Scalability

- **Channel organization**: Separate channels for different data types
- **User limits**: Configurable limits on concurrent users
- **Data retention**: Automatic cleanup of old activities and presence data

## Development

### File Structure

```
src/components/collaboration/
├── index.tsx                     # Main exports
├── CollaborationDashboard.tsx    # Main dashboard component
├── presence/
│   ├── UserPresenceIndicator.tsx # User presence display
│   └── CursorTracker.tsx         # Real-time cursor tracking
├── comments/
│   └── CommentSystem.tsx         # Comments and annotations
├── activity/
│   └── ActivityFeed.tsx          # Real-time activity stream
├── chat/
│   └── TeamChat.tsx              # Team messaging
├── whiteboard/
│   └── CollaborativeWhiteboard.tsx # Drawing and planning
├── workspace/
│   └── WorkspacePermissions.tsx  # Permission management
├── versions/
│   └── VersionControl.tsx        # Version control and diffs
└── viewers/
    └── CollaborativeDocumentViewer.tsx # Enhanced document viewer
```

### Adding New Features

1. **Database**: Add new tables in migration files
2. **Context**: Update CollaborationContext for new state/methods
3. **Components**: Create new components following the established patterns
4. **Real-time**: Enable real-time subscriptions for new tables
5. **Security**: Implement RLS policies for new tables

## Future Enhancements

### Planned Features

1. **Operational Transform**: True collaborative editing with conflict resolution
2. **Voice/Video Chat**: Integrated communication
3. **Advanced Annotations**: Markup tools, highlighting, redlining
4. **Document Locking**: Prevent concurrent edits on specific sections
5. **Mobile Support**: Touch-optimized collaboration interfaces
6. **Export Features**: Export collaboration data and annotations
7. **Integration APIs**: Connect with external legal tools
8. **Advanced Search**: Search across all collaboration data

### Technical Improvements

1. **Offline Support**: Queue operations when disconnected
2. **Performance Monitoring**: Real-time performance metrics
3. **Advanced Caching**: Intelligent data caching strategies
4. **Load Balancing**: Handle high-concurrency scenarios
5. **Analytics**: Collaboration usage analytics and insights

## Conclusion

The collaboration system provides a comprehensive foundation for real-time teamwork on legal documents and case preparation. Built with scalability, security, and user experience in mind, it enables legal teams to work together efficiently while maintaining full audit trails and version control.

All features are production-ready with proper error handling, security measures, and performance optimizations. The modular architecture allows for easy extension and customization based on specific legal workflow requirements.