# V2-S3 Guest Navigation and Large Text 1 — PLAN

Date 27 October 2026. Tracking #1050. Parent #1046. Draft PR #1054.
Immutable task: `docs/JETNITY_WORK_V2_S3_GUEST_NAV_TEXT_1_TASK_V1_2026-10-27.md`. This plan does not edit that task.

## Writer

Logical name: **Jetnity V2 Guest Navigation and Large Text 1 — Cursor Generation 1**.
Cursor Cloud `run-info.originalModelName`: `grok-4.7-high-fast` (metadata source `cursor-cloud` `run-info`). Not Auto.
Session: https://cursor.com/agents/bc-16a84de0-d3be-44eb-9f80-f7b3cf9de306
Display name set with `rename-chat`. The run title at start was `Guest resume links readability`.

## Pre-edit gate

`git fetch origin main` before product edits: `origin/main` `d31a16afdac5e97d4b02f4cb5824f5adc290577c`.
Seed HEAD `269e837a0055b973ba9e7b4985610795d95441cf` was 1 ahead / 0 behind.
`.jetnity/operating-mode.json` mode `NORMAL`.
#751 on 27 October 2026 names the same product main after CI-only #1045. No drift. No Ready. No merge.

## F08

`GastCreateLink` applied `gastspeicherLaden()` only when `createHref`, `createLabel`, or `sitzung` changed. A same-tab write does not change those dependencies, and the browser `storage` event does not fire in the writing document.

Accepted active-key writers already go through `schreibenVersuch` readback:

- `gastreiseSpeichern`, `gastreiseAnlegen`, `gastreiseAblegen`, `gastreiseEntfernen` via `schreibenMuss`
- `legacyUebernehmen` and `uebernommenStreichen` when the active-key attempt succeeds

The signal is necessary. After a confirmed active-key byte change, `gastspeicher.ts` queues one same-window `CustomEvent` named `jetnity:gastspeicher-aktualisiert` with no detail and no trip id. Failed readback and identical bytes do not signal. Return values, stored bytes, and the one-guest rule are unchanged. There is no second store, no polling, and no `postMessage`.

`GastCreateLink` re-reads the existing guest store only when `sitzung === 'gast'`. `unbekannt` and `konto` keep the generic create target. A cross-tab `storage` event for the active key, or a full clear, triggers the same re-read and ignores `newValue`. Invalid or unreadable bytes stay fail-closed (`aktiv: null`, raw bytes untouched).

## F09

Below `sm` (640px) the mode nav was `grid-cols-2` plus `whitespace-nowrap`. At CSS 320/390 and a 32px root, `text-sm` is 28px and Organisieren / Vorbereitung overflowed the cell. The row is now one column below `sm` (`grid-cols-1`, `whitespace-normal`, `min-w-0`, `break-words`) and the existing nowrap scroller remains from `sm` up. Labels stay visible. Font size stays `text-sm`. Sticky offset, `min-h-11`, focus ring, and Enter (`detail === 0`) stay.

## Paths

- `components/trips/GastCreateLink.tsx`
- `components/trips/TripWorkspaceModeNavigation.tsx`
- `lib/trips/gastspeicher.ts`
- `lib/trips/gastspeicher.test.ts`
- `lib/trips/trip-workspace-premium-experience-3.test.ts`
- `lib/trips/guest-nav-text-1.test.ts`
- `lib/trips/guest-nav-text-1/harness.tsx`
- `lib/trips/guest-nav-text-1/link.tsx`
- `lib/trips/guest-nav-text-1/supabase-stub.ts`
- these PLAN / STATUS / HANDOFF / SELF_REVIEW docs

Not edited: Day/Stage, night/hotel, person/prep, Activities/GYG, auth/session behavior, DB/RLS/SQL, CI, providers, indexing, `ACTIVE_WORK_STATUS.md`, `DECISIONS.md`. The local `next-env.d.ts` dirt was environment noise and was not committed.
