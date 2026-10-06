# Trip Timeline Core 1 — implementation report

Date: 6 October 2026. Issue #884 / Draft PR #888. Branch: `feat/trip-timeline-core-1`.

Classification: **TRIP_TIMELINE_CORE_1_READY** for independent exact-head review. This is not a PR Ready decision or merge approval.

## Live reconstruction and scope

Fresh authenticated clone/fetch and live GitHub reads confirmed:

- `origin/main`: `fc2734ca60ae3c578fbcd414055fe983773d74d2` (re-read before delivery).
- Seed head: `6e5b60d4c91d100d29d71941b4e102031f98a7eb`.
- Operating mode: `NORMAL`; #751 authorizes bounded Codex implementation through commit/push/STOP.
- #884 open; #888 open, Draft, not merged. No human correction comments on #884/#888 at startup.
- Immutable TASK: `docs/TRIP_TIMELINE_CORE_1_TASK_2026-10-06.md`, blob `2f7dcd635d3e78bc85c4c62be9dae4ff4b0c1567`.
- Product Differentiation Doctrine, repository instructions, relevant vision/architecture/quality/design/continuity decisions, TripItem, timeline/navigation tests and existing UI audit code were read before implementation.

Only TASK-allowlisted paths changed. #889/#890/#891 ownership stays separate. No global continuity files changed. No DB/schema/Auth/provider/API/Official Truth changes and no new dependencies or recurring costs.

## Delivered behavior

`lib/trips/trip-timeline-core-1.ts` provides the pure ordering contract:

- `lokalePlanzeit`: exact five-character ASCII `HH:MM`, 00:00–23:59; no trimming, normalization, timezone or UTC conversion.
- `tagesTimelineAbleiten`: local minute ascending, then canonical `position`, then deterministic code-unit ID comparison. Invalid/missing times follow all valid times, ordered by position/ID.
- Nonempty groups: Morgen [00:00,12:00), Mittag [12:00,14:00), Nachmittag [14:00,18:00), Abend [18:00,24:00), then Flexibel.
- New arrays/wrappers retain original item references. Source `TripDay.items`, item IDs, position, dayId, stageId, price and booking facts are unchanged.

`timelineAbleiten(...).tagesplan` exposes this presentation independently from the unchanged canonical selected day. `TripWorkspacePlan` consumes it as a vertical rail with markers, time/type/title hierarchy and a separated flexible section. Unknown/invalid times never render as `<time>`. Unplanned items remain separately listed, in their existing order.

Navigation, original callbacks, selected state, point form and commercial text remain intact. Cards wrap their actions when enlarged text needs the width. Existing Tagesplan/day-navigation audit anchors remain available; new narrow markers identify group and original item identity.

No conflicts, gaps/free time, transfer duration, buffers, next-up, map, weather, opening hours, daily costs, Change Impact or drag/drop were implemented.

## Validation

| Check | Result |
| --- | --- |
| `npm ci` | PASS; lockfile unchanged |
| New pure + real server-render tests | 10/10 PASS |
| New core + existing timeline/premium tests | 27/27 PASS |
| All `lib/trips/*test.ts` | 886/886 PASS, zero skips, final source |
| `npm test` | 5,486 PASS / 4 environment failures / 5,490 total, zero skips, final source |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS, zero errors; 145 existing warnings |
| ESLint on all five changed code/test/audit files | PASS, zero warnings/errors |
| `npm run check:setup:ci` | PASS; missing local .env warning, no secrets needed |
| `npm run build` | PASS, optimized Next 16.3.8 production build |
| `check:dead`, `check:exports`, `check:deps` | PASS |
| `check:api-schutz`, `check:schema-bezug`, `check:operating-mode` | PASS; mode NORMAL |
| `git diff --check` | PASS |

The initial sandbox invocation of the tsx CLI could not open its local IPC socket (EPERM). Setup/build were then run successfully with the authorized local process permissions. No application change was used to bypass validation.

The four full-suite failures all occur before database assertions because `/usr/lib/postgresql/16/bin/initdb` is absent on this macOS host. They were reproduced against an unchanged `origin/main` source export: the same four files produce 127 PASS / 4 FAIL of 131 tests. Files: `official-truth-catalog-hardening-schema.test.ts`, `official-truth-content-identity-schema-v2.test.ts`, `official-truth-source-catalog-server.test.ts`, `official-truth-store-server.test.ts` under `lib/readiness/`. These tests and their product modules were not changed. This is an explicit local coverage gap, not a claimed full-suite pass.

## Browser and render evidence

The final production build was served only on loopback with the existing local audit flag. Synthetic fixture graphs were used, with provider/API/nonlocal requests blocked.

- New audit: **40/40** scenarios, Chromium, **360×800, 390×844, 768×1024, 1440×900**.
- Same graph in Guest and Account display modes: same chronology at every width.
- Every width: default text and **200% root text (32px)**, long unbroken titles/notes, all six item types, form entry/cancel, no horizontal page overflow, no hidden focused element; row action targets at least 44×44 CSS px.
- Real Workspace: chronological groups; malformed time absent; empty/flexible-only days; day navigation; original special-character ID in open/deep link; mismatched day deep link reconciles to its original day; selected state; Escape and focus return.
- Real Plan mounted in a temporary React callback harness: keyboard open/delete, flexible and unplanned delete, create arguments, original graph unchanged, on all four widths at 200% text. The existing Workspace audit callbacks are no-ops, so this separate callback observation is deliberate and is not represented as persistence E2E.
- Final audit: zero page/hydration errors and zero blocked attempted API/nonlocal calls.
- Existing contextual-navigation audit: **57/57 PASS** at 360/390/1440 on the implementation before the final action-wrap-only CSS refinement; the final new audit repeats the affected open/deep-link/focus/keyboard paths.
- Existing premium-plan browser audit: **26 scenarios, four obsolete order assertions fail** at line 563, all other assertions pass. It expects `Tsukiji Outer Market | Freier Nachmittag | Flug nach Osaka`. The mandated new result is `Tsukiji Outer Market | Flug nach Osaka | Freier Nachmittag`. This script is outside the allowlist and was not modified. The new audit replaces its chronology assertion with the binding contract; its other navigation/long-trip checks remained passing.
- Eight full-page screenshots (four widths × default/200%) were recorded. Default phone/desktop and enlarged phone rendering were visually inspected.

Evidence: `docs/evidence/trip-timeline-core-1/audit.json`, `validation.json`, and `screens/`. `headAtRun` is the task-seed checkout HEAD while the new files were in the working tree; **it is not a claim that the seed contained the implementation**. The audit records SHA-256 hashes of the actual executed implementation/audit sources. The delivery verifies those hashes against the committed files. The exact delivered commit is reported in the final external delivery receipt; a commit cannot embed its own SHA in this file.

## Coverage gaps and severity

- **P0:** none found in scope.
- **P1:** none found in scope.
- **P2:** no known in-scope functional defect. Authenticated account persistence E2E, physical devices, Safari/WebKit and screen-reader operation were not run. Account audit means source-mode rendering, not a logged-in account.
- **P3:** legacy premium audit retains its now-obsolete list-order expectation; local PostgreSQL proof coverage is unavailable as detailed above. Existing lint/Browserslist warnings and npm's unchanged locked-dependency audit warnings (19: 2 moderate, 17 high) remain outside this slice; no dependency-security clearance is claimed.

CI/Preview exact-head evidence is a separate post-push/Technical-Lead gate; local evidence does not replace it. Ready/Merge and production acceptance remain Technical-Lead authority.

## Session and STOP

Codex Desktop session: `01a1124b-f76e-7103-9688-40167b5529b2`.
Local session metadata: model `gpt-6-astra`, reasoning `xhigh`, CLI `0.160.0`.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.** PR remains Draft. No follow-up slice started.

## Complete changed files versus main

The TASK entry is the original seed addition and remains byte-identical.

- `components/trips/TripWorkspacePlan.tsx`
- `docs/TRIP_TIMELINE_CORE_1_HANDOFF_2026-10-06.md`
- `docs/TRIP_TIMELINE_CORE_1_REPORT_2026-10-06.md`
- `docs/TRIP_TIMELINE_CORE_1_SELF_REVIEW_2026-10-06.md`
- `docs/TRIP_TIMELINE_CORE_1_TASK_2026-10-06.md`
- `docs/evidence/trip-timeline-core-1/audit.json`
- `docs/evidence/trip-timeline-core-1/screens/workspace-1440-text200.png`
- `docs/evidence/trip-timeline-core-1/screens/workspace-1440.png`
- `docs/evidence/trip-timeline-core-1/screens/workspace-360-text200.png`
- `docs/evidence/trip-timeline-core-1/screens/workspace-360.png`
- `docs/evidence/trip-timeline-core-1/screens/workspace-390-text200.png`
- `docs/evidence/trip-timeline-core-1/screens/workspace-390.png`
- `docs/evidence/trip-timeline-core-1/screens/workspace-768-text200.png`
- `docs/evidence/trip-timeline-core-1/screens/workspace-768.png`
- `docs/evidence/trip-timeline-core-1/validation.json`
- `lib/trips/timeline.ts`
- `lib/trips/trip-timeline-core-1.test.ts`
- `lib/trips/trip-timeline-core-1.ts`
- `scripts/trip-timeline-core-1-audit.mjs`
