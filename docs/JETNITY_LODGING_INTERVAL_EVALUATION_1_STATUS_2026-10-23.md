# Lodging Interval Evaluation 1 — STATUS

Date: 23 October 2026
Writer: **Jetnity Lodging Interval Evaluation 1 — Cursor Generation 1**
Issue #981 / Draft PR #984 / branch `perf/lodging-interval-evaluation-1`

Status: **IMPLEMENTED / DRAFT / NOT A PASS**. Self-review is not Technical-Lead PASS. Cursor does not Ready and does not merge.

## Session / model

- Session: https://cursor.com/agents/bc-6ae8a8df-dae6-402b-b8b8-b9dd21aff61a
- `bcId`: `bc-6ae8a8df-dae6-402b-b8b8-b9dd21aff61a`
- Requested and actual model: `grok-4.7-high-fast` (`originalModelName` from this run). Not Auto.
- UI title renamed to the exact logical name. Rename is supported on this run.

## Identity at the implementation commit

These SHAs are the implementation commit, not this status commit. The PR comment names the exact head that contains these docs.

- Implementation head `56348b52ac4b71c92a2bae7e44f8b67502459608`, tree `6a71e90f1e6166cfa8a21555b77fc2c67f2c5329`.
- Fresh `origin/main` re-read `ba0725d6dd2ce3d5e170eb1eab03cedef2def1de`. Merge-base is that same SHA. No main drift. At that read the branch was 3 ahead / 0 behind, before this status commit.
- Immutable TASK blob `400724c3a82aedffb6b893bd96e3a91bc2c62dc7`. Unchanged.
- Mode `NORMAL`.

## What landed

`unterkunftAbdeckung` now measures half-open intervals. It no longer builds a night set, a per-night stage map, or a per-night gap walk. `naechteHalboffen` still returns the public night list. Public types and summary strings are unchanged.

## Local verification on the implementation

- `npm run typecheck` — exit 0.
- `npx eslint .` — exit 0, 146 warnings, 0 errors. Touched files have 0 warnings. Baseline preserved.
- `npm run build` — exit 0. Next.js 16.4.1 compiled; 26 static pages. Setup check warned that no `.env` is present in this environment.
- Hygiene, all exit 0: `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`, `check:operating-mode`. `check:schema-bezug` printed the existing LOCAL/UNAPPLIED RPC lines. Those RPCs were not touched.
- Focused lodging tests: 37 pass, 0 fail (`lodging-interval-evaluation-1.test.ts` and `naechte-abdeckung.test.ts`).
- Related reader tests in the same run as the focused file plus preview, audit, workspace status and change-impact acceptance: 105 pass, 0 fail.
- `npm test`: 7035 tests, 7019 pass, 11 fail, 5 skipped. Every failure is local PostgreSQL 16 missing (`initdb` ENOENT, `local_proof_connection_override_forbidden`, or `NOT_VERIFIED: local PostgreSQL binaries are required`). No lodging assertion failed. This is not a pass of those proofs.
- `auth:pruefen` was not run here. It needs hosted Supabase credentials. CI runs that job. A missing local secret is not a local PASS.

Remote CI and Preview for the final head are not claimed in this file. The PR comment carries them.

## P0–P3

- P0: none newly established.
- P1: #968 and #748 remain unresolved and independent. This slice does not touch them.
- P2: the per-night evaluator defect is implemented on this draft and still needs independent exact-head review. Unrelated source, hosting and privacy residuals stay as they were.
- P3: `naechteHalboffen` can still expand if a future caller uses it on a long range. `lib/trips/trip-audit-v1/limits.ts` still says the canonical reader enumerates; that comment is now stale and was left untouched because #955 is closed and outside this allowlist. #973 still estimates night walks before calling the reader, so a long span can stay unavailable in that preview. 146 lint warnings remain. Two conditional browser skips were not re-run (`T09` shared Workspace layout; `shared responsive layout` without `SHARED_LAYOUT_AUDIT_BASE`).

## Stop

No follow-up slice. Same session for an immediate review fix. A new head invalidates this gate.
