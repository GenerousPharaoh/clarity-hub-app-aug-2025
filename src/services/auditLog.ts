/**
 * Audit log client
 *
 * Thin wrapper around the `log_audit_event` Postgres RPC. Never throws —
 * audit writes are best-effort so they never block a user action. The
 * events we care about most: file upload, file delete, project create,
 * project delete, project export, consent accept/revoke, flagged-citation
 * copy.
 *
 * The server-side RPC enforces that user_id = auth.uid(), so a client
 * cannot forge events on behalf of another user. RLS prevents read
 * across accounts.
 */

import { supabase } from '@/lib/supabase';

export type AuditAction =
  | 'file.upload'
  | 'file.delete'
  | 'file.restore'
  | 'project.create'
  | 'project.delete'
  | 'project.rename'
  | 'project.export'
  | 'consent.accept'
  | 'consent.revoke'
  | 'chat.copy_flagged'
  | 'chat.copy_clean'
  | 'draft.create'
  | 'draft.delete'
  | 'auth.sign_out';

export interface AuditEvent {
  action: AuditAction;
  projectId?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Best-effort audit log write. Failures are swallowed and logged to the
 * console — a missing audit row should never block a user action, but it
 * should be visible to developers during local testing.
 */
export async function logAuditEvent(event: AuditEvent): Promise<void> {
  try {
    // The RPC isn't yet in the auto-generated Database types; cast through.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.rpc as any)('log_audit_event', {
      p_action: event.action,
      p_target_type: event.targetType ?? null,
      p_target_id: event.targetId ?? null,
      p_project_id: event.projectId ?? null,
      p_metadata: event.metadata ?? {},
    });
    if (error) {
      console.warn('[audit] write failed:', error.message);
    }
  } catch (err) {
    console.warn('[audit] exception:', err);
  }
}
