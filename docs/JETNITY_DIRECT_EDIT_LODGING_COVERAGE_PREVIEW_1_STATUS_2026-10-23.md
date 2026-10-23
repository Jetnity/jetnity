# Direct Edit Lodging Coverage Preview 1 — status

Date: 23 October 2026
Writer: **Jetnity Direct Edit Lodging Coverage Preview 1 — Cursor Generation 1**
Issue #970 / Draft PR #973 / branch `feat/direct-edit-lodging-coverage-preview-1`

This status is a self-report. It is not Technical-Lead PASS, Ready, or merge.

## Identity

- Session: https://cursor.com/agents/bc-0d71c6f4-154a-44a7-a147-e5b83c166ec1 (`bc-0d71c6f4-154a-44a7-a147-e5b83c166ec1`)
- Session title was set through the available rename API and read back as the logical name above.
- Requested model at first dispatch: Claude Opus 5.5 High.
- Observed model: `originalModelName=grok-4.7-high-fast`. This run cannot switch models. No alternate model was chosen inside the session.
- Product Owner acceptance of Grok 4.7 High Fast, R101, supersedes only the model STOP from R100. This status does not claim Claude.

## Topology at the documentation commit

Re-read after `git fetch origin main` on 23 October 2026, before this documentation commit. Main had not moved again.

- `origin/main`: `8f64d5fdb819065791235879822b1074205899c0`
- main tree: `73ee0a59570d2f92744e95605ec818296948f533`
- merge-base with this branch before the docs commit: that same main commit
- behind 0
- ordinary merge commit: `da4db5cb40c7e4f21609ec25c8b59acfe9f6fb3c`
- merge parents: `d494d143fae8c437936c61afc3c6619416b37b0b` and `8f64d5fdb819065791235879822b1074205899c0`
- integrated tree, before this documentation commit: `92dca4b171bc1a6363c1955b7cf7a1b140438dc6`
- ahead of main by 7 at that merge. This documentation commit makes the branch one commit further ahead. It does not change runtime code.
- The review head is the tip after this documentation commit. The PR evidence comment states that SHA. `da4db5cb` is not the review head.
- R100 head `3b383fc4ccec97e5c9a72d08ef305946f683cc21` and fix head `d494d143fae8c437936c61afc3c6619416b37b0b` are ancestors, not current.

Immutable blobs, unchanged:

- TASK `258bed9fc85ae8dbcc978ef1715132e9b0978e58`
- V2 `07d68779031b2fb2d8a88207be89738f9d1ab8e9`

Mode re-read at start: NORMAL.

## What landed

The unsaved manual-edit preview now adds one group, “Unterkunftsplanung nach der Änderung”, when lodging-relevant facts change. Numbers, half-open gap intervals and stage ids come from one call per admitted side to the unchanged `unterkunftAbdeckung`. The existing disclosure, 20-row pager and focus behavior are untouched.

Before either call, every trip, stage and stay interval is measured by date arithmetic. An interval longer than `GRENZEN.reisedauerInTagen` (365) is rejected. Estimated repeated walks (required intervals three times when the reader will close gaps, otherwise twice, plus each stay once) must stay within 40_000 across both snapshots. A rejected side is “nicht verfügbar”, is not passed to the reader, and is not shown as zero. One unqualified side blocks a conclusive comparison. Title and budget edits do not call the reader and do not add the group.

R101 review fix, same writer and session, against R100 findings F1 and F2:

- A side with stages is a definite plan only when the canonical result is qualified and every stage has a valid half-open arrival/departure interval. One incomplete stage, and two stages that are both incomplete, stay “Unterkunftsstand noch unklar” even though the unchanged reader returns numeric trip-date coverage. A trip with no stages still uses that fallback and can show numbers. The canonical file was not edited.
- The lodging lines no longer say “Unterkunftsdaten bleiben unverändert”. They say nothing is cancelled or rebooked automatically with a supplier. An unconfirmed unpriced stay without provider, booking link or external reference moves with the date edit. The editor and `istKommerziell` were not edited.

## Verification actually run on the integrated merge

Commands below were run on merge `da4db5cb40c7e4f21609ec25c8b59acfe9f6fb3c`, tree `92dca4b171bc1a6363c1955b7cf7a1b140438dc6`. This documentation commit does not change runtime code. It is a later head and needs its own CI.

| Command | Result |
| --- | --- |
| focused preview, direct-edit, canonical night coverage, and the merged visit-date tests | 79 pass, 0 fail |
| `npm run typecheck` | pass |
| `npm run lint` | exit 0, 0 errors, 146 warnings (pre-existing) |
| `npm test` | 7014 tests, 6999 pass, 10 fail, 5 skipped |
| `npm run build` | pass, including `check:setup` (one pre-existing warning: no `.env` file) |
| `check:operating-mode`, `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug` | pass. Schema reference still lists pre-existing LOCAL/UNAPPLIED RPCs. This slice added none. |
| `npm ci` | not re-run. The existing workspace install was used. |
| `auth:pruefen` | not run. This integration does not change auth. Final-head CI is the auth evidence, and it was not finished at authoring. |
| styled desktop/mobile and keyboard expand | not checked. See handoff. |

The 10 `npm test` failures are existing local PostgreSQL proofs: `spawnSync /usr/lib/postgresql/16/bin/initdb ENOENT`, `local_proof_connection_override_forbidden`, or `NOT_VERIFIED: local PostgreSQL binaries are required; no hosted fallback or emulator`. They are outside this allowlist. This session did not install PostgreSQL, did not change connection environment, and did not contact a database. The 5 skips are pre-existing environment gates (native PostgreSQL or an explicit loopback layout server), not this preview. Prior-head CI and Preview are not evidence for this head. Merge-head CI [39980980806](https://github.com/Jetnity/jetnity/actions/runs/39980980806) was in progress on `da4db5cb` when this document was written. That run does not bind the documentation tip.

## Boundaries

No DB, Auth, RLS, API, provider, LLM, dependency, flag, migration, or shared-evaluator change. #957 was not imported. Global status, roadmap and governance were not edited. No Ready. No merge. No follow-up slice.
