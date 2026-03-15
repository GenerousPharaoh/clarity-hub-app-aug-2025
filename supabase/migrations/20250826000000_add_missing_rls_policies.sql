-- ADD MISSING RLS POLICIES FOR notes, exhibit_markers, chat_messages
--
-- These three tables were identified as having NO RLS policies,
-- meaning any authenticated user could read/write any record.
--
-- This migration adds per-operation policies scoped through project
-- ownership (projects.owner_id = auth.uid()) or collaboration
-- (projects_users.user_id = auth.uid()), consistent with the pattern
-- established in 20250825000001_fix_security_and_performance.sql.
--
-- KNOWN SCHEMA MISMATCH (do not "fix" without verifying live DB):
--   The earlier migration (20250825000001) references files.owner_id and
--   files.uploaded_by_user_id, but the client-side type definition in
--   src/types/database.ts shows the actual column as "added_by".
--   If those columns were renamed or aliased, the files policies may
--   need a corresponding update in a future migration.
--
-- Column inventory (from src/types/database.ts):
--   notes:           id, project_id, title, content, created_by, created_at, last_modified
--   exhibit_markers: id, project_id, exhibit_id, file_id, description, created_at  (NO user column)
--   chat_messages:   id, project_id, role, content, model, file_context, created_at,
--                    sources, complexity, effort_level, follow_ups            (NO user column)

-- =============================================================================
-- Step 1: Enable RLS (idempotent — no-op if already enabled)
-- =============================================================================
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE exhibit_markers ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- Step 2: NOTES policies
-- =============================================================================

-- SELECT: any project member can read notes
DROP POLICY IF EXISTS "notes_select_project_member" ON notes;
CREATE POLICY "notes_select_project_member"
  ON notes FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = notes.project_id
      AND p.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects_users pu
      WHERE pu.project_id = notes.project_id
      AND pu.user_id = auth.uid()
    )
  );

-- INSERT: any project member can create notes; created_by must be the caller
DROP POLICY IF EXISTS "notes_insert_project_member" ON notes;
CREATE POLICY "notes_insert_project_member"
  ON notes FOR INSERT TO authenticated
  WITH CHECK (
    -- created_by must match the authenticated user
    created_by = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = notes.project_id
        AND p.owner_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM projects_users pu
        WHERE pu.project_id = notes.project_id
        AND pu.user_id = auth.uid()
        AND pu.role IN ('editor', 'admin')
      )
    )
  );

-- UPDATE: only the note creator OR project owner can update
DROP POLICY IF EXISTS "notes_update_creator_or_owner" ON notes;
CREATE POLICY "notes_update_creator_or_owner"
  ON notes FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = notes.project_id
      AND p.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = notes.project_id
      AND p.owner_id = auth.uid()
    )
  );

-- DELETE: only the note creator OR project owner can delete
DROP POLICY IF EXISTS "notes_delete_creator_or_owner" ON notes;
CREATE POLICY "notes_delete_creator_or_owner"
  ON notes FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = notes.project_id
      AND p.owner_id = auth.uid()
    )
  );

-- =============================================================================
-- Step 3: EXHIBIT_MARKERS policies
-- =============================================================================
-- exhibit_markers has no user/creator column, so access is purely project-scoped.
-- Write operations are restricted to project owners and editors/admins.

-- SELECT: any project member can read exhibit markers
DROP POLICY IF EXISTS "exhibit_markers_select_project_member" ON exhibit_markers;
CREATE POLICY "exhibit_markers_select_project_member"
  ON exhibit_markers FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = exhibit_markers.project_id
      AND p.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects_users pu
      WHERE pu.project_id = exhibit_markers.project_id
      AND pu.user_id = auth.uid()
    )
  );

-- INSERT: project owner or editor/admin collaborator
DROP POLICY IF EXISTS "exhibit_markers_insert_project_member" ON exhibit_markers;
CREATE POLICY "exhibit_markers_insert_project_member"
  ON exhibit_markers FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = exhibit_markers.project_id
      AND p.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects_users pu
      WHERE pu.project_id = exhibit_markers.project_id
      AND pu.user_id = auth.uid()
      AND pu.role IN ('editor', 'admin')
    )
  );

-- UPDATE: project owner or editor/admin collaborator
DROP POLICY IF EXISTS "exhibit_markers_update_project_member" ON exhibit_markers;
CREATE POLICY "exhibit_markers_update_project_member"
  ON exhibit_markers FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = exhibit_markers.project_id
      AND p.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects_users pu
      WHERE pu.project_id = exhibit_markers.project_id
      AND pu.user_id = auth.uid()
      AND pu.role IN ('editor', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = exhibit_markers.project_id
      AND p.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects_users pu
      WHERE pu.project_id = exhibit_markers.project_id
      AND pu.user_id = auth.uid()
      AND pu.role IN ('editor', 'admin')
    )
  );

-- DELETE: project owner or editor/admin collaborator
DROP POLICY IF EXISTS "exhibit_markers_delete_project_member" ON exhibit_markers;
CREATE POLICY "exhibit_markers_delete_project_member"
  ON exhibit_markers FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = exhibit_markers.project_id
      AND p.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects_users pu
      WHERE pu.project_id = exhibit_markers.project_id
      AND pu.user_id = auth.uid()
      AND pu.role IN ('editor', 'admin')
    )
  );

-- =============================================================================
-- Step 4: CHAT_MESSAGES policies
-- =============================================================================
-- chat_messages has no user/creator column. Access is purely project-scoped.
-- Any project member can read and write messages (the AI chat is collaborative).
-- DELETE is restricted to project owner (used by clearChat).

-- SELECT: any project member can read messages
DROP POLICY IF EXISTS "chat_messages_select_project_member" ON chat_messages;
CREATE POLICY "chat_messages_select_project_member"
  ON chat_messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = chat_messages.project_id
      AND p.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects_users pu
      WHERE pu.project_id = chat_messages.project_id
      AND pu.user_id = auth.uid()
    )
  );

-- INSERT: any project member can send messages
DROP POLICY IF EXISTS "chat_messages_insert_project_member" ON chat_messages;
CREATE POLICY "chat_messages_insert_project_member"
  ON chat_messages FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = chat_messages.project_id
      AND p.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects_users pu
      WHERE pu.project_id = chat_messages.project_id
      AND pu.user_id = auth.uid()
    )
  );

-- UPDATE: any project member can update (e.g. editing a message)
DROP POLICY IF EXISTS "chat_messages_update_project_member" ON chat_messages;
CREATE POLICY "chat_messages_update_project_member"
  ON chat_messages FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = chat_messages.project_id
      AND p.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects_users pu
      WHERE pu.project_id = chat_messages.project_id
      AND pu.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = chat_messages.project_id
      AND p.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects_users pu
      WHERE pu.project_id = chat_messages.project_id
      AND pu.user_id = auth.uid()
    )
  );

-- DELETE: project owner only (clearChat deletes all messages for a project)
DROP POLICY IF EXISTS "chat_messages_delete_project_owner" ON chat_messages;
CREATE POLICY "chat_messages_delete_project_owner"
  ON chat_messages FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = chat_messages.project_id
      AND p.owner_id = auth.uid()
    )
  );

-- =============================================================================
-- Step 5: Performance indexes for the new policy sub-selects
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_notes_project_id
  ON notes(project_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_by
  ON notes(created_by);
CREATE INDEX IF NOT EXISTS idx_exhibit_markers_project_id
  ON exhibit_markers(project_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_project_id
  ON chat_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_project_created
  ON chat_messages(project_id, created_at);

-- Update table statistics
ANALYZE notes;
ANALYZE exhibit_markers;
ANALYZE chat_messages;
