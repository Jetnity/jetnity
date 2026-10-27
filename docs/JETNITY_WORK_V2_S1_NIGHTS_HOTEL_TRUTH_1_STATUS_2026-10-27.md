# V2-S1 Nights and Hotel Truth 1 — STATUS

Date 27 October 2026. Draft PR #1052. Branch `fix/v2-s1-overnight-hotel-truth-1`.
Writer: Jetnity V2 Nights and Hotel Truth 1 — Cursor Generation 1.
Session `bc-eafe2d65-2a92-47d4-b18e-d73539d11eca`. Model `grok-4.7-high-fast` from `run-info.originalModelName`.

## State

R1 corrections for the reviewed head `7f3f0520d99e44755aa9aa3af8e681bb0cab6a99` are in product head `b91256e32f01512a506dc54f0d9a250495f2eea5`, tree `109824ea7befe180c50fdf140551194cacd9628b`. This file is docs-only on top of that head. Not Ready. Not merged. No follow-up slice. `origin/main` moved to `d698ee9e3e365b09295effc1db5a4f9db165eec8` during this correction (8 commits this branch does not contain). Root handles the non-force sync. This writer did not merge or rebase.

## R1

- A dated trip counts only its calendar, N days to N−1 nights. Stage intervals are clipped to that window. Pieces outside are `ausserhalb` and are not added to `naechteGesamt`. Booked and selected stays keep their status. A stay that misses the calendar stays outside the night balance.
- Several stages with any missing interval keep `kalenderNaechte` when the calendar is valid, and `naechteGesamt` null. Those nights are not called transitions and do not become hotel gaps.
- Proven transitions remain only when every stage interval is known and a calendar night sits outside those clipped stages.
- The multi-stage hotel search still refuses a missing stage period. One stage without its own dates still uses the trip span.

## Evidence on this machine

- `lib/trips`, `lib/hotels`, `lib/reiseaenderung`, and `lib/mobility` tests: 1398 tests, 1396 pass, 0 fail, 2 skip.
- `npx tsc -p tsconfig.json --noEmit` exit 0.
- `npm run build` exit 0.
- ESLint on the edited files exit 0.
- No browser, private account, CUA, provider call, or viewport pass at 320/390/768 or 200% host font.
- Full `npm test` was not re-run on this correction. The earlier run’s 11 PostgreSQL 16 failures were an environment limit, not a lodging failure. CI on this new head is not claimed. The previous Preview does not cover `b91256e3`.

## Not touched

Flight and mobility audit sections, #1043 activity files, S0/S2/S3 product sources, CI, SQL, Auth, RLS, indexing, and `docs/ACTIVE_WORK_STATUS.md`. #751 was not edited.
