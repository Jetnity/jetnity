# JETNITY — Local Development Reference Import Transport Preparation 1 — HANDOFF

**Date:** 17 October 2026
**State:** **STOP FOR INDEPENDENT TECHNICAL LEAD R66.** Draft only. No Ready, no merge, no follow-up slice.
**Writer:** `Jetnity Local Development Reference Import Transport Prep 1 — Cursor Generation 1` (Owner's local native Cursor IDE; model Claude Opus 5.5, "High" as selected by the Owner). R66 corrections return to this same logical writer/session.

## Where things stand

- Draft [PR #962](https://github.com/Jetnity/jetnity/pull/962), branch `feat/dev-reference-local-pg-writer-prep-1`, base `main@a2dbfc09468f819f05d150bf02e287eb6b00544d`, task seed `d7ce063596a38b4b17cca0596e4ac4c7a7b50461`. The review head is the branch tip after the delivery commit; its exact SHA/tree are in the PR evidence comment. Re-fetch before review.
- Delivered: a code-only, opt-in, fail-closed local psql transport in `scripts/dev-reference-local-pg-prep-1/**`, reusing the unchanged `lib/airports/importieren` and `lib/places/importieren` parsers and reproducing the original upsert SQL behind a source-level drift test. 90 offline tests with a fake psql.
- **Write path is disarmed in code** (`SCHREIBEN_FREIGEGEBEN = false` in `importieren.ts`). Even a merge of this PR does not enable or authorise any database write.
- Original `npm run airports:importieren` / `places:importieren`, `scripts/db/sql.mjs`, `scripts/auth/ziel.ts`, `lib/rollout/schreibauftrag.ts`: unchanged.

## What was NOT done (and must not be inferred)

- No connection, SQL, schema read or probe against `yfvbxvijcorffwxbxahl` or any host. `psql` is not even installed on the coding machine.
- No credential, `.env*`, keychain, `~/.pgpass`, `PGPASSWORD`, token or private-key access.
- No import, no data change, no migration, no Production (`qscbgcdmivbbnzrcyegn`), no Dashboard/browser.
- PR #955 untouched. No new branch/PR/issue. `docs/ACTIVE_WORK_STATUS.md` intentionally not edited (task scope; #751 is the live index).
- Last Owner-observed Development state stays: `public.airports` 0, `public.places` 0 (not re-read).

## Verification at delivery (local, offline)

- New tests: **90 pass / 0 fail** — `node --import ./scripts/server-only-test-register.mjs --import tsx --test "scripts/dev-reference-local-pg-prep-1/*.test.ts"`.
- `lib/airports/importieren.test.ts` + `lib/places/importieren.test.ts`: 13/13.
- New-file `tsc` (temporary extending config, deleted): exit 0. New-file ESLint: clean.
- `npm run typecheck` exit 0. `npm run lint` 0 errors / 146 pre-existing warnings.
- `check:operating-mode`, `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`: all exit 0.
- `npm test`: 6,837 pass / **10 fail** / 2 skipped. The 10 are existing disposable-PostgreSQL proofs failing on the missing Linux `initdb` path (`/usr/lib/postgresql/16/bin/initdb`); unrelated to this slice; **not a full PASS**.
- Exact-head GitHub CI and Vercel for the pushed tip exist only after push and were not claimed here. CI does not run the 90 new tests (test glob is `lib/**`).

## Open decisions for TL R66

1. Accept, or CHANGES REQUIRED on, the transport design (report §4) and the explicit semantic differences (report §5).
2. Whether to add `require_auth=scram-sha-256` / `channel_binding=require` to conninfo.
3. Whether to add the new tests to the CI test glob (separate reviewed change to `package.json`).
4. Only after an accepted R66 **and** a new narrow Owner write approval: a separate reviewed commit flipping `SCHREIBEN_FREIGEGEBEN`, then the Owner-run procedure in report §8.

## Exact next step

Independent Technical-Lead R66 review of the exact PR #962 head. Nothing else is started by this writer.

## Read order for a new agent

`.jetnity/operating-mode.json` → task file → this handoff → `docs/JETNITY_DEV_REFERENCE_LOCAL_PG_WRITER_PREP_1_REPORT_2026-10-17.md` → `docs/JETNITY_DEV_REFERENCE_LOCAL_PG_WRITER_PREP_1_SELF_REVIEW_2026-10-17.md` → PR #962 comments → #960 latest. Live evidence wins.
