# R108-A — Activities Search and Selection Lifecycle 1 — STATUS

Date: 26 October 2026.

**Status: bounded implementation is on the runtime head below. This documentation commit is the review head and does not change runtime. STOP for independent Technical-Lead review. Not a code PASS. Not Ready. Not merged.**

Writer: **Jetnity Activities Search and Selection Lifecycle 1 — Cursor Generation 1**. One fresh session. Draft PR [#1025](https://github.com/Jetnity/jetnity/pull/1025). Tracking [#1024](https://github.com/Jetnity/jetnity/issues/1024). Vendor clarification stays [#1023](https://github.com/Jetnity/jetnity/issues/1023).

Session: `bc-0c04bed6-dbf2-41ff-853c-2b5509df4be3`  
Link: https://cursor.com/agents/bc-0c04bed6-dbf2-41ff-853c-2b5509df4be3  
Model: `grok-4.7-high-fast` (`originalModelName` on this run). Not Auto. No silent fallback.

Mode: `NORMAL`.

## Git

Runtime proof head: `728235723a4ceb606e6a610765f43fa4254e10d5`  
Tree: `909c1ba9099caadd986061552e93c497eeb5b87b`  
`origin/main` and merge-base: `cdc5b47163c2f1bb272fb46ed6723e9522489e92`  
Ahead / behind at that head: **3 ahead / 0 behind**.

Seed: `889d91ce9b9979040647c79aec2f073f0a8cdb60`. Immutable TASK blob `7abd6bcaeb63ac471ac299cec74d0aa58784a618` is unchanged.

This file, the handoff, the self-review, the evidence receipt and the `ACTIVITIES.md` / `ROADMAP.md` pointer sit on the following commit. That commit is the review head. If main is still `cdc5b47163c2f1bb272fb46ed6723e9522489e92`, the branch is then **4 ahead / 0 behind**. Re-read the tip SHA. A later head invalidates these gates.

## What landed

Deliberate activity search and selection in the existing trip workspace:

- no request on mount, remount, day change, trip change, or section leave/return
- one request for “Für diesen Tag suchen” / “Erneut suchen”; a same-tick second dispatch is rejected
- visible canonical destination, day, date or “Datum noch offen”, traveller count, and currency
- epoch and generation ownership; A→B→A and the same payload in another trip do not revive the old cards
- a reused option id cannot submit the previous option content
- callback stays `onUebernehmen(etappe, tag, option)`
- `null` is only the callback’s success report; a string, throw, rejection, or malformed value is unconfirmed
- another attempt needs a new explicit search and a new click
- allowlisted client envelope; non-2xx success-shaped bodies are not actionable
- card price label “Preisangabe”
- shared controlled day selection is unchanged

## Recovery boundary

An unconfirmed adoption is not replayed and is not unlocked by unrelated props. The notice says to inspect the trip. It does not say the write failed, succeeded, or happened once. Abort of the browser read does not cancel an entered writer. Full unmount drops the in-memory register only. There is no cross-tab serialization and no readback endpoint.

## Commands on the runtime head

| Command | Exit |
| --- | --- |
| `node --import tsx --test lib/activities/client-anfrage.test.ts lib/activities/suchlebenszyklus.test.ts` | 0 (17 pass) |
| `AUDIT_REPORT=/opt/cursor/artifacts/activities_ui_audit.json npm run audit:activities` | 0 (188 combinations, 0 failures) |
| `npm run typecheck` | 0 |
| `npx eslint .` | 0 (0 errors, 180 existing warnings) |
| `npm run build` | 0 |
| `npm run check:dead` | 0 |
| `npm run check:exports` | 0 |
| `npm run check:deps` | 0 |
| `npm run check:api-schutz` | 0 |
| `npm run check:schema-bezug` | 0 |

`check:schema-bezug` still prints pre-existing `LOCAL/UNAPPLIED` RPC notes. They are not from this slice. Native CI on the review head was not run here.

Evidence: `docs/evidence/activities-search-selection-lifecycle-1/`. Synthetic fixtures only.

## Limits

No Viator adapter, API, content, key, or provider call. Factory and proof stay null. Production stays hard-off. No DB, Auth, RLS, migration, package, CI, or ruleset change. No new age, price, or provenance model. No booking or payment. USD 100/month ceiling unchanged. Held work and #917 were not reopened.

**STOP. Independent Technical-Lead exact-head review only. Do not mark Ready. Do not merge. Do not start a follow-up slice.**
