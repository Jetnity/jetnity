# R108-A — Activities Search and Selection Lifecycle 1 — STATUS

Date: 26 October 2026.

**Status: Supplemental R1 fixes are on the runtime head below. This documentation commit is the review head and does not change runtime. STOP for independent Technical-Lead review. Not a code PASS. Not Ready. Not merged.**

Writer: **Jetnity Activities Search and Selection Lifecycle 1 — Cursor Generation 1**. Same session. Draft PR [#1025](https://github.com/Jetnity/jetnity/pull/1025). Tracking [#1024](https://github.com/Jetnity/jetnity/issues/1024).

Session: `bc-0c04bed6-dbf2-41ff-853c-2b5509df4be3`  
Link: https://cursor.com/agents/bc-0c04bed6-dbf2-41ff-853c-2b5509df4be3  
Model: `grok-4.7-high-fast`. Not Auto.

Mode: `NORMAL`.

## Git

Rejected head: `8224f7ce061ac2dea85dc781594f3493af732502`, tree `c4cb82098ad9d9391addaf806d060e9590abd81a`.

Intermediate runtime `055055ac6b998693d30c9a8829aba8b7827c8ab2` is not accepted. Its operation key still changed when only labels, reasons, and konflikt changed.

Runtime proof head: `8adbb10c46acf6d7ca811d721e188026c5203a31`  
Tree: `4d804ff1be4b947427522a2ca917a0d4116ada61`  
`origin/main` and merge-base: `cdc5b47163c2f1bb272fb46ed6723e9522489e92`  
Ahead / behind at that head: **8 ahead / 0 behind**.

Immutable TASK blob `7abd6bcaeb63ac471ac299cec74d0aa58784a618` is unchanged.

This status, the handoff, the self-review and the evidence receipt sit on the following commit. That commit is the review head. If main is still `cdc5b47163c2f1bb272fb46ed6723e9522489e92`, the branch is then **9 ahead / 0 behind**. Re-read the tip SHA. A later head invalidates these gates.

## R1 corrections

- The adoption operation is trip, stage, day, and the existing writer-snapshot facts: title through 120 characters, place, duration, rating, rating count, cancellation, timeslot, price, currency, provider, externalRef. It does not include the client option id, description, coordinates, categories, tags, labels, reasons, or konflikt, and it does not include search epoch or generation. The same snapshot stays one operation when ranking presentation changes from frei to ueberschneidung. A different persisted fact or a different trip, stage, or day is a different operation. There is no new provenance model.
- The full visible card, including ranking fields, plus epoch and generation still rejects a stale handler. That check is separate from the operation lock.
- `null` is callback-accepted and stays closed for this mount. A string, synchronous throw, rejection, empty string, or malformed value is unconfirmed and stays closed. “Erneut anbieten” is the only deliberate unlock, and it does not call the writer. A new search is not reconciliation.
- A guest-like callback inserts the selected activity item and its window. Re-search with the resulting ranking change stays closed while pending, after `null`, and while unconfirmed.
- A present malformed `message` or `coverageNote` makes `ok` / `partial` non-actionable. Non-active statuses keep the minimal contract. AbortError from `res.json()` still propagates.

## Commands on the runtime head

| Command | Exit |
| --- | --- |
| `node --import tsx --test lib/activities/client-anfrage.test.ts lib/activities/suchlebenszyklus.test.ts` | 0 (21 pass) |
| `AUDIT_REPORT=/opt/cursor/artifacts/activities_ui_audit.json npm run audit:activities` | 0 (188 combinations, 0 failures) |
| `npm run typecheck` | 0 |
| `npx eslint .` | 0 (0 errors, 180 existing warnings) |
| `npm run build` | 0 |
| `npm run check:dead` | 0 |
| `npm run check:exports` | 0 |
| `npm run check:deps` | 0 |
| `npm run check:api-schutz` | 0 |
| `npm run check:schema-bezug` | 0 |

`check:schema-bezug` still prints pre-existing `LOCAL/UNAPPLIED` RPC notes. Native CI on the review head was not run here. Evidence: `docs/evidence/activities-search-selection-lifecycle-1/`. Synthetic fixtures only. Each lifecycle viewport recorded 28 explicit searches.

## Limits

Unmount drops the in-memory register and does not cancel an entered writer. There is no cross-tab serialization and no proof of the trip row. No Viator, provider call, DB, Auth, or cost change. Production stays hard-off.

**STOP. Independent Technical-Lead exact-head review only. Do not mark Ready. Do not merge. Do not start a follow-up slice.**
