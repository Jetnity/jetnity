# R108-A — Activities Search and Selection Lifecycle 1 — STATUS

Date: 26 October 2026.

**Status: The remaining R2 idle-notice correction is on the runtime head below, together with the writer-snapshot identity and the fail-closed audit actions. This documentation commit is the review head and does not change runtime. STOP for independent Technical-Lead review. Not a code PASS. Not Ready. Not merged.**

Writer: **Jetnity Activities Search and Selection Lifecycle 1 — Cursor Generation 1**. Same session. Draft PR [#1025](https://github.com/Jetnity/jetnity/pull/1025). Tracking [#1024](https://github.com/Jetnity/jetnity/issues/1024).

Session: `bc-0c04bed6-dbf2-41ff-853c-2b5509df4be3`  
Link: https://cursor.com/agents/bc-0c04bed6-dbf2-41ff-853c-2b5509df4be3  
Model: `grok-4.7-high-fast`. Not Auto.

Mode: `NORMAL`.

## Git

Reviewed idle-path base `d8f89dc4df3c7dc571a88e9ca0930a6c1cec186f` is not the review head. Snapshot-alignment runtime `79a109615857940812b05b5d99a1041b8d76750f` and its documentation `5202613afa0c82de291579a629193bae4cd9f497` are superseded by the runtime below. Supplemental review head `0bd3ddd1b67e487aca1c96022f1d5753cd6ee10d`, R2 delivery `05d6f934beefc5c174794905a775e8655257ecc3`, runtime `055055ac6b998693d30c9a8829aba8b7827c8ab2`, and rejected head `8224f7ce061ac2dea85dc781594f3493af732502` stay historical.

Runtime proof head: `3c24d85509ace94bc6f69ecbef6b333ec0c2d611`  
Tree: `9c13f157b07fc32ccfd72398020af323591f5bc9`  
`origin/main` and merge-base, re-read before this documentation commit: `cdc5b47163c2f1bb272fb46ed6723e9522489e92`  
Ahead / behind at the runtime head: **16 ahead / 0 behind**.

Immutable TASK blob `7abd6bcaeb63ac471ac299cec74d0aa58784a618` is unchanged.

This status, the handoff, the self-review and the evidence receipt sit on the following commit. That commit is the review head. If main is still `cdc5b47163c2f1bb272fb46ed6723e9522489e92`, the branch is then **17 ahead / 0 behind**. Re-read the tip SHA. A later head invalidates these gates.

## Corrections on this runtime

- The adoption operation is trip, stage, day, and the JSON of `alsActivityMomentaufnahme` for that day date. The frozen mapper is called and is not edited. A rating of 9.01 and 9.02 with the same count is one operation. A null rating with a different count is one operation, because the snapshot omits both. A present rating with a different count changes the stored note and stays a different operation. Labels, reasons, konflikt, epoch and generation do not reopen a pending, callback-accepted or unconfirmed write.
- The full raw card, including the unrounded rating, still rejects a stale handler. That check stays separate from the operation lock.
- A direct audit capture or invocation returns `{ ok: false, grund: 'fehlt' }` when no callable was stored. `freigeben(id)` does the same when that pending resolver is absent and does not release any other waiter. A no-id release with an empty waiter map also returns `fehlt`. These results are not a rejected write. The mounted probes require `ok: true` when a release or invocation is expected.
- A notice belongs to its operation. A visible result shows the bare sentence only beside that card. An older `null` or unconfirmed settlement does not announce itself on a newer pending card. While no current response is showing, each retained same-day notice is `captured activity: sentence`, including the time when one was captured. That named line stays visible when a newer adoption is still pending. The write claim is not dropped to hide it. Another day does not show it. Two identical named lines collapse; two activities that share only the sentence stay separate.
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

`check:schema-bezug` still prints pre-existing `LOCAL/UNAPPLIED` RPC notes. Native CI on the review head was not run here. Evidence: `docs/evidence/activities-search-selection-lifecycle-1/`. Synthetic fixtures only. Each lifecycle viewport recorded 38 explicit searches.

## Limits

Unmount drops the in-memory register and does not cancel an entered writer. There is no cross-tab serialization and no proof of the trip row. The idle notice names the captured activity; it does not add a provenance model or a readback. No Viator, provider call, DB, Auth, or cost change. Production stays hard-off.

**STOP. Independent Technical-Lead exact-head review only. Do not mark Ready. Do not merge. Do not start a follow-up slice.**
