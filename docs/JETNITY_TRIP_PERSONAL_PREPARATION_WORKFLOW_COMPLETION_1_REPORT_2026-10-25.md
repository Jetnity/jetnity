# Trip Personal Preparation Workflow Completion 1 — REPORT

Date: 2026-10-25. Writer: **Jetnity Trip Personal Preparation Workflow Completion 1 — Cursor Generation 1**. Session `bc-6bbca11e-14c9-4f1a-ac07-e729d8a54ca3`. Model `grok-4.7-high-fast`.

This report records what ran. It is not a Technical-Lead PASS. The first-delivery commands on `9838423e` stay historical and are not repeated here as proof of the R1 head.

## What R1 changed

`scheitern` with phase `unclear` records `lesePflicht[clientRef] = { seit, gelesen: null }` and unlocks the ref. `entscheiden` refuses another write for that ref while `gelesen` is null, including retry, edit, and delete. A known `error` does not create that obligation. The existing trip-scoped guest barrier is still checked first.

A successful read whose delivery is newer than `seit` marks the obligation read. The next deliberate action on the same ref keeps that `clientRef` and sets `PERSONAL_UNSICHER`. A field match after an unknown outcome becomes `reconciled` with `PERSONAL_ABGESTIMMT`. Absence after an unknown create or edit stays `absent_uncertain`. It does not prove the lost write will never commit.

`offeneLesen` reclassifies `awaiting`, `absent_uncertain`, `conflict`, `stale_unconfirmed`, `unclear`, and `blocked` when a new delivery is strictly newer than `beobachtetBei`. `kontoBeobachten` ignores a trip id other than the ledger trip and does not increment the delivery counter. `manuellLesen` and a successful guest read of the expected trip increment it, clear the barrier, and then reclassify. `{ art: 'props' }` does not.

Completion focus is stored as `fokusBei` at dispatch. `interaktion` advances `fokusGeneration`. Search focus, filter click, create focus, editor title focus, opening another editor, and preparation unmount call it. A monotonic `revision` stops an older render effect from overwriting that generation before a late result arrives. `terminal` focuses only when the generations still match, the composer or editor generation still matches, the row is connected and visible, and the phase is `confirmed` or `reconciled`.

## Counterexamples

Pure transitions in `personal-preparation-workflow.test.ts`:

- Unclear edit, then retry, edit, and delete: each returns `auftrag === null` and the hint matches `Lies zuerst`. `wrong_trip`, `missing`, and a different trip id leave the phase `unclear` and do not advance `lieferung`.
- A conflicting success read moves the unknown intent to `conflict`. The following retry returns the original `clientRef` and `PERSONAL_UNSICHER`.
- A matching success read moves a fresh unclear intent to `reconciled` / `PERSONAL_ABGESTIMMT`. A newer pending create stays `pending`, and its draft is unchanged.
- Accepted create, canonical absence, then a later matching account trip: `absent_uncertain`, then `confirmed`. Accepted edit, conflicting trip, then a matching trip: `conflict`, then `confirmed`. The same matching trip after `scheitern(..., 'unclear')` stays `reconciled` through both `manuellLesen` and `kontoBeobachten`.
- `interaktion` before a successful guest result leaves `fokusIntentId` null.

Mounted list in `personal-preparation-workflow-ui.test.ts`:

- Thrown write, then click `Erneut versuchen`: writer count stays 1, read count stays 0, and the copy says `Lies zuerst`.
- `wrong_trip` followed by another click: writer count stays 1.
- Conflict, then a deliberate retry: a second write uses the same `clientRef`, with `kein Beweis`.
- A matching read is `reconciled`, not `confirmed`. A later create stays pending.
- Accepted account create, first post-response list without the ref, then a matching delivery: phase `confirmed`, delivery counter 3, read count 1.
- Unclear plus `{ art: 'props' }` stays `unclear`. A later matching prop is `reconciled`.
- After dispatch, focusing search, opening editor B, choosing `Erledigt`, or leaving via the mode control keeps focus off A's row. B's draft stays `Beta bleibt`.

Mounted workspace in `arbeitsbereich.test.ts`:

- Guest create, title `Adapter neu`, status done, and delete use the real writer and reader. Storage loses the personal ref and keeps `entry-geschwister`.
- Real `Reiseplan` / `Vorbereitung` navigation keeps the pending intent. A thrown retry writes 0. `wrong_trip`, invalid JSON, and `unreadable` write 0 and leave the foreign or original bytes unchanged.
- A trip switch drops the pending intent. The deferred release writes 0.
- Account: a different empty object before acceptance stays pending. After acceptance the phase is `awaiting` and reads are 1. A later empty object becomes `absent_uncertain`. A later matching object becomes `confirmed`. Reads stay 1.
- Collapsing `#preparation-eigene-vorbereitung` stays closed and does not focus an input inside it.

The workspace harness refuses a deferred guest write when the in-memory trip id changed before release. That guard is in the harness, not in the frozen `GastArbeitsbereich` callback. The product callback still passes its current in-memory graph to `gastReadinessSetzen`. No compare-and-swap was added.

## Commands

Behavior commit `46ae6c153c1203f350452dd700a7651acceda2c0`. Lint-clean harness commit `570634e37f2d7494ffc2039668081da6cd961a8b`.

| Command | Exit | Result |
| --- | --- | --- |
| `node --import ./scripts/server-only-test-register.mjs --import tsx --test` on the workflow, wiring, readback, and identity files | 0 | 22 pass, 0 fail, 0 skip |
| `node scripts/trip-personal-preparation-workflow-completion-1/browser-lauf.mjs --ausgabe docs/evidence/trip-personal-preparation-workflow-completion-1/2026-10-25-r1` | 0 | 19 pass, 0 fail, 0 cancelled, 9680 ms |
| `npm run typecheck` | 0 | `next typegen` and `tsc --noEmit`; `scripts/` is outside `tsconfig.json` |
| `npm run lint` | 0 | 0 errors, 181 warnings, after the harness stopped writing a ref during render |
| `check:dead` | 0 | 0 unreferenced modules |
| `check:exports` | 0 | 0 unused named exports |
| `check:deps` | 0 | 0 unused packages |
| `check:api-schutz` | 0 | 12 admin routes |
| `check:schema-bezug` | 0 | generated structures present; existing LOCAL/UNAPPLIED RPC notes unchanged |
| `npm run build` | 0 | Next.js 16.4.1, prebuild `check:setup`, 31083 ms |

`npm run lint` on `46ae6c15` exited 1 with one `react-hooks/refs` error: the harness assigned `reiseRef.current` during render. The following commit removes that assignment. Every `setReise` in the harness already writes the ref in the same callback. The workspace suite was re-run after the removal: 5 pass, 0 fail. Lint and the five hygiene guards in the table were re-run on that correction and exited 0. The warning count stayed 181.

`npm test` was not re-run on this head. On `9838423e` it exited 1 with 7129 tests, 7113 pass, 11 local PostgreSQL 16 failures, and 5 skips. Those PostgreSQL proofs are an environment limit (`initdb` ENOENT) and were not pointed at a hosted database. The Playwright file is no longer under `lib/**/*.test.ts`, which is the native-suite change for the 11 cancelled CI cases on run 40157857026.

Source blobs at the behavior commit, with the harness blob from the lint-clean commit: workflow `7db0b86f68fca58a499b35e49ee60b541f23bc37`, hook `a11b25652281e9d04be29aad7e0d9cf53c28e4e1`, list `8be6d7fb3c5782173e97d07a82e24459d9f46608`, workspace harness `1ca85d87b5178858c6e60467ac8e8392a0d405cd`. TripWorkspace, KontoArbeitsbereich, GastArbeitsbereich, and gastspeicher blobs are unchanged from the first delivery: `6bb2268fb8f56295a01bf4fc712b1dc3592a56b1`, `fdad125b008b86ec1153e6140d5494fa3aa6f55d`, `90f9d8781e23a3f96f92abd1d3616174585460d2`, `f18bf24efaf8f86196276f02758e2f162915d33a`.

Node `v22.23.4`. Evidence: `docs/evidence/trip-personal-preparation-workflow-completion-1/2026-10-25-r1/`. The TAP log is gitignored; `zaehlung.json` transcribes its footer. `browser-lauf.json` is the runner's own exit record.

## Boundary

External `next/link`, `next/navigation`, `next/dynamic`, and `next/image` are local shims under `scripts/trip-personal-preparation-workflow-completion-1/shims/`. The page is served from `http://127.0.0.1` so `history.pushState` works. This does not establish hosted Account, the full Next router, Supabase, RLS, Production, native zoom, a physical device, or a screen reader. No new runtime cost or provider call.
