# Clarity Hub Production Main-Mode Stress Test Report

Date: 2026-03-31
Tester: Codex via Playwright headed Chromium
Target: https://clarity-hub-app.vercel.app/
Auth path: Manual Google OAuth by user, then continued under the authenticated browser session

## Scope

Covered in this pass:
- Dashboard load, search, sort, and navigation into a live matter
- Settings page load and preference toggles
- Workspace tabs: Overview, Docs, Exhibits, Timeline, Drafts
- Viewer panel and AI chat in a real project
- Responsive/mobile pass at `390x844`

Intentionally not exercised in production:
- Sign out
- Matter deletion
- File upload
- Draft deletion
- Other destructive account-level actions

## Summary

The production app is usable end-to-end for the main read paths. Google auth worked, live matters loaded, settings changes persisted, the overview and drafts pages rendered, the PDF viewer loaded a signed storage asset correctly, and the exhibit-book wizard generated a downloadable PDF.

The main confirmed failures are in two live backend write/query paths:
- manual timeline event creation fails with a `400`
- AI chat hits a `search_documents` RPC `400` because the database function result shape no longer matches the expected type

There is also a confirmed responsive-state bug on mobile and a lower-severity external font loading issue.

## Confirmed Findings

### 1. High: Manual timeline event creation fails on the live backend

Impact:
- Users cannot add timeline events manually in the tested matter.

Repro:
1. Open a live matter.
2. Go to `Timeline`.
3. Click `Add Event`.
4. Enter a date and title.
5. Click `Add Event`.

Expected:
- The event is created and appears in the timeline.

Actual:
- The request fails, the timeline stays empty, and the UI shows:
  - `Failed to create event`
  - `Unknown error`

Evidence:
- Console log: `/Users/kareemhassanein/Desktop/clarity-hub-app/.playwright-cli/console-2026-04-01T02-54-12-210Z.log`
  - line 8: `timeline_events` `400`
- Snapshot after failure:
  - `/Users/kareemhassanein/Desktop/clarity-hub-app/.playwright-cli/page-2026-04-01T03-04-11-698Z.yml`

Notes:
- This reproduces on the real backend, not just demo mode.
- The error handling is too generic to help diagnose the real cause from the UI.

### 2. High: AI chat document-search RPC returns `400` due to a schema/function mismatch

Impact:
- AI chat retrieval is partially broken.
- The assistant can still answer, but the intended search/RAG path is erroring and likely degrading relevance, latency, or both.

Repro:
1. Open a live matter.
2. Select a file in the viewer lane.
3. Open `AI Chat`.
4. Ask a question about the selected document.

Expected:
- The search path completes cleanly and the AI response is generated without backend errors.

Actual:
- The app logs a failed `search_documents` RPC request:
  - `Returned type numeric does not match expected type double precision in column 8.`
- The chat eventually returned an answer, so there appears to be a fallback or partial recovery path.

Evidence:
- Console log: `/Users/kareemhassanein/Desktop/clarity-hub-app/.playwright-cli/console-2026-04-01T02-54-12-210Z.log`
  - lines 6-7: `search_documents` `400` and function result-type mismatch
- Snapshot while testing AI chat:
  - `/Users/kareemhassanein/Desktop/clarity-hub-app/.playwright-cli/page-2026-04-01T03-00-29-317Z.yml`
  - `/Users/kareemhassanein/Desktop/clarity-hub-app/.playwright-cli/page-2026-04-01T03-00-59-878Z.yml`
- Network capture:
  - `/Users/kareemhassanein/Desktop/clarity-hub-app/output/playwright/main-mode-2026-03-31/network-2026-03-31.txt`

Notes:
- This looks like a database function contract drift rather than a client-only issue.
- Because the answer still arrives, this is easy to miss if you only look at UI success/failure.

### 3. Medium: Mobile `Viewer` bottom-nav state can display AI chat instead of the viewer

Impact:
- On mobile, the bottom navigation can indicate `Viewer` while the screen still shows AI chat content.
- This is confusing and makes the active mobile panel unreliable.

Repro:
1. In desktop layout, switch the right panel to `AI Chat`.
2. Resize to a mobile viewport (`390x844`).
3. Tap the bottom `Viewer` button.

Expected:
- The viewer panel opens and the content matches the active `Viewer` nav state.

Actual:
- The bottom `Viewer` button is active while the visible content still shows the `AI Chat` panel.

Evidence:
- Mobile snapshot before tap:
  - `/Users/kareemhassanein/Desktop/clarity-hub-app/.playwright-cli/page-2026-04-01T03-06-21-674Z.yml`
- Mobile snapshot after tapping `Viewer`:
  - `/Users/kareemhassanein/Desktop/clarity-hub-app/.playwright-cli/page-2026-04-01T03-06-37-214Z.yml`

Notes:
- This reproduces in production, so it is not isolated to demo-mode state handling.

### 4. Low: Geist font CDN requests are blocked by Chromium ORB

Impact:
- The app falls back to a different font stack.
- This is mostly visual, but it can change layout/typography and creates noisy network failures.

Repro:
1. Load the app in Chromium.

Expected:
- The configured Geist stylesheet loads successfully.

Actual:
- Requests to the jsDelivr Geist stylesheet fail with `net::ERR_BLOCKED_BY_ORB`.

Evidence:
- Network capture:
  - `/Users/kareemhassanein/Desktop/clarity-hub-app/output/playwright/main-mode-2026-03-31/network-2026-03-31.txt`

## Successful Live Flows

Confirmed working during this production pass:
- Google OAuth login and redirect into the authenticated app
- Dashboard render with live matters
- Dashboard search and sort controls
- Navigation into an existing matter
- Settings page load with real profile data
- Theme toggle and auto-processing toggle persistence
- Overview tab render
- Docs area render and document list access
- PDF viewer load with signed Supabase storage URL
- PDF annotation fetch for the selected PDF
- Drafts list and saved draft render
- Exhibit-book wizard through generated downloadable PDF
- AI chat response generation despite the broken search RPC

## Environment Notes

- The authenticated flow landed on the deployed Vercel app, so this pass was executed against the real production frontend and backend.
- During the test, settings were temporarily changed and then restored:
  - theme restored to `System`
  - auto-processing restored to `enabled`
