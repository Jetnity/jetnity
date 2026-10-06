# Trip Workspace direct-flight schedule readback 1 — Report

Date: 6 October 2026. Issue #874 / Draft PR #878.

Classification: **TRIP_WORKSPACE_DIRECT_FLIGHT_SCHEDULE_READBACK_READY**.
This is the implementation handoff classification, not Technical-Lead PASS or GitHub Ready.

## Result and scope

F-03 from #871 is addressed: `FlugRoute` now renders its existing `segmentZeit` output directly below the route summary when the display is direct and exactly one stored segment exists. The added paragraph uses existing text tokens, natural wrapping and `break-words`; no disclosure is needed. Runtime change: five added lines in one component.

The renderer and route facts are unchanged. Exact local strings remain in departure/arrival order, including NRT→LAX `2026-11-02 23:30 → 2026-11-01 12:00`. No timezone conversion, UTC instant, flight duration, missing clock or legacy-summary fallback is introduced. Partial schedules use the existing renderer; a segment with no schedule fields says `Zeiten unbekannt`. A display without segment facts gains no schedule.

Connection rendering remains unchanged. `FlugBestand.tsx`, route/coverage logic, validation, persistence, DB/Supabase, providers, Official Truth/F8 and global continuity are untouched. No new API, package, security boundary, network operation or running cost is introduced by the product change. The existing travel graph remains the only source of facts.

## Fresh reconstruction

- Live #751: machine mode NORMAL; Codex implementation/commit/push authorized; Technical Lead owns exact-head acceptance, Ready and merge.
- #874 and #878: correct bounded F-03 scope; PR open, Draft, unmerged; seed `d2c2905b8e51e48d8611d57d51a93a89a25b47f8`.
- Remote main and merge-base at reconstruction and pre-publication: `b16a250b95715418c125a92a2d407ba2ec3f89fa`; seed ahead/behind 1/0.
- Immutable TASK: `docs/TRIP_WORKSPACE_DIRECT_FLIGHT_SCHEDULE_READBACK_1_TASK_2026-10-06.md`, blob `d5e019c9002a9fbe8404b1f5c74c8c9eb53a02b9`.
- Read #871 F-03 and its distinction between preserved itinerary values and hidden readback; inspected route domain/display/fixtures, manual-flight projection, local time contract, component callers, relevant tests and repository guidance.
- Parallel slices #877/#879/#880 retain their separate files/contracts. No shared existing test was edited.

## Verification actually executed

Environment: Node `v22.23.3`; dependencies installed from the lockfile using `npm ci --offline --ignore-scripts --no-audit --no-fund` (530 packages). Install scripts deliberately skipped; package/lockfile unchanged.

| Check | Result |
| --- | --- |
| New readback test against unchanged TASK seed | 13 failures / 3 passes: missing direct schedules reproduced before the fix |
| New test + manual-flight + all route tests + flight-time tests | **233/233 PASS**, 0 failures/skips; includes **16 new tests** |
| New test with `TZ=Pacific/Honolulu` | **16/16 PASS** |
| New test with `TZ=Asia/Tokyo` | **16/16 PASS** |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS: 0 errors, 145 pre-existing warnings outside changed files |
| ESLint on both changed TS/TSX files, `--max-warnings 0` | PASS, no warnings |
| `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug` | All PASS; schema check is static, no DB access |
| `npm run build` | PASS, optimized production build and 25 static pages generated |
| `git diff --check` | PASS |
| Complete two-segment render vs TASK-seed component | Byte-identical HTML |
| Narrow browser render with real component and compiled repository CSS | PASS at 10 viewports; visible exact schedules, no horizontal overflow, connection disclosure opens/closes |

Focused command:

```sh
node --import ./scripts/server-only-test-register.mjs --import tsx --test \
  lib/trips/flug-route-readback.test.ts lib/trips/flug-manuell.test.ts \
  'lib/route/*.test.ts' lib/flights/zeit.test.ts
```

The new tests cover normal/Date-Line/local-clock reversal, both missing-clock variants, date-only, clock-only, one-sided and entirely unknown schedules, display-only/no-facts behavior, explicit display, multi-segment details, exactly-one-segment guard, no duplicate schedule, no inferred UTC/duration and unchanged facts.

Browser: isolated headless Chrome `154.0.8037.95` via installed Playwright; real `FlugRoute` server markup and repository Tailwind/CSS in a synthetic wrapper. Viewports: 280×760, 320×760, 360×800, 375×812, 390×844, 430×860, 768×1024, 1280×800, 667×375, 844×390. Screenshots at 390 and 1280 were visually inspected. Browser requests were blocked. The `vercel:agent-browser` workflow was consulted; its CLI was absent, so existing Playwright/Chrome provided the narrow render check. Scratch harness/logs/screenshots are local, outside the repository allowlist.

The first sandboxed build stopped at a local tsx IPC permission error before building. The same `npm run build` passed with reviewed local-process permission. Non-blocking existing build warnings: no `.env/.local`, stale Browserslist data. No secrets or live backend were needed.

## Findings and limits

- No unresolved finding within this readback slice after self-review. F-03 is fixed for the authorized exactly-one-segment case.
- Physical mobile hardware, Safari/WebKit, authenticated Account E2E and hosted Preview UI were not exercised. The browser result is a component render check, not whole-workspace acceptance.
- Full `npm test`, DB/RLS/Auth live checks and Production verification were not run. Focused tests are reported without a full-suite claim.
- Final remote head, main, ahead/behind, TASK readback and exact-head CI/Preview status belong to the post-push STOP receipt; seed checks do not validate this delivery.

Execution: Codex Desktop, logical writer **Trip Workspace direct-flight schedule readback 1**, this single implementation session (no replacement/delegation). Session `01a111cd-6d00-73b2-84ab-f64a3d9ed809`; persisted `turn_context` records model `gpt-6-astra`, effort `xhigh`.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**
