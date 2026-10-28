# UX V1 U1-A3 header density — self review

**28 October 2026. Author review only. Not a Technical Lead PASS.**

## Scope

Diff is the task document's parent plus:

- `components/trips/TripWorkspaceKopf.tsx`
- `components/trips/TripWorkspaceUebersicht.tsx`
- `lib/trips/ux-u1a3-header-density-1.ts`
- `lib/trips/ux-u1a3-header-density-1-client.ts`
- `lib/trips/ux-u1a3-header-density-1.test.ts`
- `scripts/ux-u1a3-header-density-1/audit.mjs`
- this task's plan, status, handoff, self-review, report, and `docs/evidence/ux-v1-u1a3-header-density-1/`

No edit to `TripWorkspace.tsx`, mode navigation, `ux-u1a-shell-1`, plan, global header, guest storage, providers, package, CI, SQL, Auth, RLS, env, or `docs/ACTIVE_WORK_STATUS.md`. `next dev` rewrote `next-env.d.ts` and appended a Next.js block to `AGENTS.md`. Both were left unstaged.

## What I checked

- Save truth, full title (`overflow-wrap: anywhere`, no clamp), route, dates, `Noch offen` budget, and the 44px traveller/budget summary remain.
- Reise ändern keeps visible text, `min-h-11`, `aria-expanded`, and `aria-controls="reise-aenderung"`. Enter focuses the existing edit-surface title. Escape closes and returns focus to the trigger.
- Help sentences required by existing source tests remain visible, beside the button from 1024px and under it below that.
- `fortschrittText` and `planText` both render. The overview file still has no `%`.
- Attention, trip audit, and destination essentials are still mounted in the same order.
- Pure density decision and the two existing source-contract tests passed (11 tests, 0 failed).
- ESLint on the owned sources exited 0.
- Mounted Chrome audit: 280/320/360/390/430/768/1440, long title, guest, account, root 32. Overflow 0. No matching provider API request.

## What I did not check

- Native browser zoom 200%, a physical keyboard, safe-area hardware, VoiceOver, or Work A01–A16.
- A second production build in this session. Native App/Auth CI and Vercel Preview belong to the pushed head and were not green at authoring time.
- The real `GastArbeitsbereich` discard button's confirm dialog. The harness only inserts the label. The parent file was not modified, so that confirm path is unchanged.
- Whether #1076's nav fix changes these y values after it merges. It will. This head is measured without that fix.

## Judgment

The phone gain is real and limited by chrome this slice must not remove. The desktop gain brings the first three attention rows and the start of the trip audit into the 1000px viewport in this harness. I would not call the phone first-row clear of the current bottom nav.
