# Guest Trip Read Recovery 1 — SELF REVIEW

Date: 24 October 2026
Author: **Jetnity Guest Trip Read Recovery 1 — Cursor Generation 1**
Session: `bc-2806475d-7ee4-40d0-980e-1d26bcb5b270`
Model: `grok-4.7-high-fast`
Draft PR: #994. Issue: #991 stays open.

**This self-review is not Technical-Lead PASS.** The author does not grant Ready or merge.

## Scope check

The diff is the allowlisted runtime files, the new readonly helper and presentation, the dedicated test, the synthetic harness, evidence, and this slice's delivery documents. TASK V1 is byte-identical (`9a089b26a6892ede8f235692b92f72dc225df147`). `gastspeicher.ts` and `create-entry.ts` are byte-identical to the task blobs. No sibling branch is merged. No global current-state file is edited. No dependency, workflow, config, or global style change.

`GastArbeitsbereich` still owns the same mutation callbacks. They run only after a matching trip is on screen. Their signatures are unchanged. `gastreiseLadenNach` is no longer imported there; the new observer is the read path.

## Acceptance judgment

I treat all eleven acceptance criteria as met inside the synthetic boundary described in the REPORT. The judgment rests on executed tests, not on a source-pattern scan alone:

- Storage tests record raw key bytes and write/remove counts for absence, valid match, invalid bytes, throwing reads, unreadable legacy, restored access, invalid→valid, invalid→absent, mid-read disagreement, persisted legacy, failed legacy without an id, queue-only, and invalid-plus-queue.
- The mounted runner records a loading frame before the empty state, keyboard activation of "Erneut prüfen", a tripId change that does not paint the previous title, and 320/390/1280 plus 200% reflow without horizontal overflow.
- Focused regressions of storage, active-draft preservation, create-entry, and the guest CTA stay green (185/185).

I do not treat that as hosted-account, physical-device, screen-reader, Preview, or Production proof.

## Decisions a reviewer should weigh

1. A valid legacy migration that persists is shown, and `schrieb` is true. A legacy draft without an id whose write fails stays `belegt_ohne_kennung` with no continue link. Showing a generated in-memory id would invent a continue target the device did not keep.
2. Queue-only keeps the list create link because occupancy confirms the active slot is empty. The workspace does not open a queue id as the current trip. Create in that workspace is the existing unavailable state, not a second draft beside a hidden active trip.
3. The read stays in an effect, with a one-line lint exception, because the loader may write. Moving it into render would migrate during render. The first paint is therefore the loading copy, which is the honest not-yet-observed state.
4. Disagreement copy is new fixed text. It does not quote the exception or the stored JSON.

## Failure, truth, privacy, security, accessibility, performance

Failure stays on the device: recheck reads again, and the tests that forbid writes observe zero product writes. Truth no longer calls an unread or unreadable slot the first trip. Privacy of the evidence is synthetic. Security surface is unchanged. Accessibility of the new states uses status/alert, busy, focus rings, and 44px targets; a screen reader was not run. The extra work per observation is two local occupancy reads and one existing load.

## Residuals

- P0: none found.
- P1: none found.
- P2: harness shims for Next server modules. See REPORT. Preview must still render the real route.
- P2: full `npm test` not run locally.
- P3: caniuse-lite age warning; not updated.
- P3: no physical device and no screen reader.

`npm run build` exited 0 (setup check, then Next compile). `npx eslint .` exited 0 with 144 warnings and 0 errors, none in this slice. Full `npm test` remains not run.

## Git at this review

Base and merge-base `913cf9353fd33491d2bd3130b3c430cc88990200`. Plan parent `de65696cc4233beb4dab02f04fefb31f7c1d8973`. Ahead/behind before the implementation commit: 2 / 0. Final head is the commit that contains this file. The PR comment has the exact SHA after push.

## Stop

No follow-up slice. Same logical author and this session only if the Technical Lead returns CHANGES REQUIRED on this head. Any new head needs new gates.
