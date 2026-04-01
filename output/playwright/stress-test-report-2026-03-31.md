# Clarity Hub Stress Test Report

Date: March 31, 2026
Local timezone: America/Toronto
App under test: `http://localhost:5040`
Method: manual browser stress pass with Playwright CLI on desktop (`1440x1100`) and mobile (`390x844`)

## Coverage

Tested areas:
- Login page and demo entry
- Dashboard: search, sort, create, rename, delete, navigation into a matter
- Settings: theme toggle, auto-process toggle, demo controls
- Workspace desktop: files panel, viewer, AI chat, overview, docs, exhibits, timeline, drafts
- Workspace mobile: bottom-tab navigation, files/content/viewer flows
- Global command palette (`Cmd+K`)

Working flows observed:
- Demo login flow
- Dashboard project CRUD in demo mode
- Settings toggles and navigation
- File selection and text-file viewing
- AI chat demo responses
- Command palette open/navigation
- Mobile bottom navigation between Files, Content, and Viewer
- Docs note creation and note title editing in demo mode

## Findings

### 1. Exhibit book generation fails in demo mode

Severity: High

Repro:
1. Enter demo mode.
2. Open `Raven Imports Termination`.
3. Go to `Exhibits`.
4. Click `Build Book` and continue to `Generate Compendium`.

Observed:
- Generation fails instead of producing a PDF.
- Console shows a storage download failure against the demo seed file path.

Evidence:
- Console log: `.playwright-cli/console-2026-04-01T02-35-44-298Z.log` lines 4-10
- Relevant code paths:
  - `src/hooks/useCompendiums.ts:85-125`
  - `src/services/storageService.ts:121-129`

Likely cause:
- Demo exhibits reference `/demo/...` paths, but compendium generation still downloads from Supabase Storage instead of using demo/local data.

### 2. Overview tab triggers live `pdf_annotations` requests in demo mode

Severity: Medium

Repro:
1. Enter demo mode.
2. Open any demo matter.
3. Open `Overview`.

Observed:
- The page renders, but every visit produces `400` errors against `pdf_annotations`.

Evidence:
- Console log: `.playwright-cli/console-2026-04-01T02-35-44-298Z.log` lines 2-3
- Relevant code paths:
  - `src/components/workspace/center/ProjectOverview.tsx:1265-1279`
  - `src/hooks/useAnnotations.ts:35-49`

Likely cause:
- The overview highlight summary bypasses demo-mode guards and always queries Supabase.

### 3. Manual timeline event creation is broken in demo mode

Severity: High

Repro:
1. Enter demo mode.
2. Open a matter.
3. Go to `Timeline`.
4. Click `Add Event`, fill the required fields, and submit.

Observed:
- No event is created.
- Console logs a `400` against `timeline_events`.

Evidence:
- Console log: `.playwright-cli/console-2026-04-01T02-35-44-298Z.log` line 11
- Relevant code path:
  - `src/hooks/useTimeline.ts:46-93`

Likely cause:
- `useTimelineEvents` returns an empty array in demo mode, but `useCreateTimelineEvent` still inserts into Supabase instead of writing to demo state.

### 4. Drafts tab is not demo-safe

Severity: High

Repro:
1. Enter demo mode.
2. Open a matter.
3. Go to `Drafts`.
4. Click a template such as `Demand Letter`.

Observed:
- The tab loads, but console logs `400` errors against `brief_drafts`.
- Clicking a template does not open a visible draft flow and appears inert from the user perspective.

Evidence:
- Console log: `.playwright-cli/console-2026-04-01T02-35-44-298Z.log` lines 12-14
- Relevant code path:
  - `src/hooks/useBriefDrafts.ts:14-67`

Likely cause:
- Draft listing and draft creation go straight to Supabase with no demo-mode fallback.

### 5. Primary heading font is fetched from jsDelivr and is blocked on load

Severity: Low

Repro:
1. Load the app from a clean browser session.

Observed:
- Requests for the Geist stylesheet fail with `net::ERR_BLOCKED_BY_ORB`.
- UI falls back to alternate fonts.

Evidence:
- Network failures were visible immediately on login/dashboard load.
- Relevant code path:
  - `index.html:12-19`

Likely cause:
- The app depends on a third-party CDN stylesheet that is not reliably accepted by the browser environment used in testing.

### 6. Mobile `Viewer` bottom-tab can land on AI Chat instead of the file viewer

Severity: Low

Repro:
1. Open a matter on desktop and switch the right panel to `AI Chat`.
2. Resize to mobile or reopen the matter on mobile.
3. Tap the bottom `Viewer` tab.

Observed:
- The mobile tab is labeled `Viewer`, but the screen can open on the right-panel `AI Chat` sub-tab because the last `rightTab` state is restored.

Evidence:
- Relevant code path:
  - `src/components/workspace/WorkspacePage.tsx:107-117`

Likely cause:
- Mobile restoration forces `mobileTab='viewer'` when the persisted right-side state is `ai`, so the label and initial content can diverge.

## Summary

The app is usable for basic demo exploration, but demo-mode isolation is incomplete. Dashboard, settings, notes, file viewing, AI chat, and command palette worked, while multiple workspace features still attempted live Supabase access and either logged runtime errors or failed outright.

Highest-priority fixes:
1. Add demo-aware fallbacks for highlights/annotations, timeline events, and brief drafts.
2. Make compendium generation work with demo seed files or explicitly disable it in demo mode.
3. Remove or self-host the blocked external font dependency.
