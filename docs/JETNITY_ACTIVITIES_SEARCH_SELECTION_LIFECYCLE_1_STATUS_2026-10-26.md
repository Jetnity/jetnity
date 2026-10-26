# R108-A — Activities Search and Selection Lifecycle 1 — STATUS

Date: 26 October 2026.

**Status: The supplemental R2 corrections are on the runtime head below. This documentation commit is the review head and does not change runtime. STOP for independent Technical-Lead review. Not a code PASS. Not Ready. Not merged.**

Writer: **Jetnity Activities Search and Selection Lifecycle 1 — Cursor Generation 1**. Same session. Draft PR [#1025](https://github.com/Jetnity/jetnity/pull/1025). Tracking [#1024](https://github.com/Jetnity/jetnity/issues/1024).

Session: `bc-0c04bed6-dbf2-41ff-853c-2b5509df4be3`  
Link: https://cursor.com/agents/bc-0c04bed6-dbf2-41ff-853c-2b5509df4be3  
Model: `grok-4.7-high-fast`. Not Auto.

Mode: `NORMAL`.

## Git

Supplemental review head `0bd3ddd1b67e487aca1c96022f1d5753cd6ee10d` is not the review head. R2 delivery `05d6f934beefc5c174794905a775e8655257ecc3` and its runtime `055055ac6b998693d30c9a8829aba8b7827c8ab2` stay historical. Rejected head `8224f7ce061ac2dea85dc781594f3493af732502` stays historical. The earlier notice-ownership runtime `09c79a84ac9669406007d1a5391978ed0ce81af2` is superseded by the snapshot alignment below.

Runtime proof head: `79a109615857940812b05b5d99a1041b8d76750f`  
Tree: `e2b3b3451acf9f760f23f833cce0fa64c1ece28c`  
`origin/main` and merge-base, re-read before this documentation commit: `cdc5b47163c2f1bb272fb46ed6723e9522489e92`  
Ahead / behind at the runtime head: **13 ahead / 0 behind**.

Immutable TASK blob `7abd6bcaeb63ac471ac299cec74d0aa58784a618` is unchanged.

This status, the handoff, the self-review and the evidence receipt sit on the following commit. That commit is the review head. If main is still `cdc5b47163c2f1bb272fb46ed6723e9522489e92`, the branch is then **14 ahead / 0 behind**. Re-read the tip SHA. A later head invalidates these gates.

## Corrections on this runtime

- The adoption operation is trip, stage, day, and the JSON of `alsActivityMomentaufnahme` for that day date. The frozen mapper is called and is not edited. A rating of 9.01 and 9.02 with the same count is one operation. A null rating with a different count is one operation, because the snapshot omits both. A present rating with a different count changes the stored note and stays a different operation. Labels, reasons, konflikt, epoch and generation do not reopen a pending, callback-accepted or unconfirmed write.
- The full raw card, including the unrounded rating, still rejects a stale handler. That check stays separate from the operation lock.
- A direct audit capture or invocation returns `{ ok: false, grund: 'fehlt' }` when no callable was stored. It does not count as a rejected write. The mounted probes require `ok: true`.
- A notice belongs to its operation. A visible result shows it only beside that card. An older `null` or unconfirmed settlement does not announce itself on a newer pending card. While the day is idle, each distinct sentence for that day is shown once.
- A present malformed `message` or `coverageNote` keeps an active response non-actionable.

## Commands on the runtime head

Node `v22.23.4`.

| Command | Exit |
| --- | --- |
| `node --import tsx --test lib/activities/client-anfrage.test.ts lib/activities/suchlebenszyklus.test.ts` | 0 (23 pass) |
| `AUDIT_REPORT=/opt/cursor/artifacts/activities_ui_audit.json npm run audit:activities` | 0 (188 combinations, 0 failures) |
| `npm run typecheck` | 0 |
| `npx eslint .` | 0 (0 errors, 180 existing warnings) |
| `npm run build` | 0 |
| `npm run check:dead` | 0 |
| `npm run check:exports` | 0 |
| `npm run check:deps` | 0 |
| `npm run check:api-schutz` | 0 |
| `npm run check:schema-bezug` | 0 |

`check:schema-bezug` still prints pre-existing `LOCAL/UNAPPLIED` RPC notes. Native CI on the review head was not run here. Evidence: `docs/evidence/activities-search-selection-lifecycle-1/`. Synthetic fixtures only. Each lifecycle viewport recorded 32 explicit searches.

## Limits

Unmount drops the in-memory register and does not cancel an entered writer. There is no cross-tab serialization and no proof of the trip row. An idle-day sentence does not name which option it belongs to. No Viator, provider call, DB, Auth, or cost change. Production stays hard-off.

**STOP. Independent Technical-Lead exact-head review only. Do not mark Ready. Do not merge. Do not start a follow-up slice.**
