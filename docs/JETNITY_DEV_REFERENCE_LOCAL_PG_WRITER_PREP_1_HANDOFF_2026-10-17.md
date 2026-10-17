# JETNITY — Local Development Reference Import Transport Preparation 1 — HANDOFF

**Date:** 17 October 2026
**State:** **STOP FOR INDEPENDENT TECHNICAL LEAD R70.** Draft only. No Ready, no merge, no follow-up slice, no live import.

## R69 update (native local PostgreSQL protocol proof)

- Task: `docs/JETNITY_DEV_REFERENCE_LOCAL_PG_NATIVE_PROTOCOL_R69_TASK_2026-10-17.md` (blob `e4b25000…`, unchanged). Start head `91d446d0`. Code commit `97e155eb` (tree `69d2deb0…`), then this docs-only commit.
- New, test-only: `scripts/dev-reference-local-pg-prep-1/nativ.test.ts` and `nativ-psql-umleitung.mjs`. No product source, importer, `package.json`, workflow, migration or old task changed. `SCHREIBEN_FREIGEGEBEN = false` unchanged.
- Local Mac: no PostgreSQL server binaries, so the native suite is skipped with a `NOT VERIFIED` reason. Direct suite: 116 pass, 0 fail, plus the native suite and the CI-only test skipped. `npm test`: 6,966 tests, 6,953 pass, the same **10 fail** (existing native proofs, missing `initdb`), 3 skipped. **Not a full PASS.** typecheck, lint (0 errors / 146 pre-existing warnings), operating-mode and the five hygiene checks exit 0.
- GitHub CI run `39075727433` on `97e155eb` (author-observed, **TL R70 verifies independently**): success. 7,052 tests, 7,051 pass, 0 fail, 1 skip (the existing layout audit). The R69 suite ran 13/13 on real psql/postgres 16.15, and the "CI without binaries fails" test passed.
- Details, design and remaining unverified layers: report §11. Self-check: self-review "R69 self-check".

## R68 update (CI test gate)

- Task: `docs/JETNITY_DEV_REFERENCE_LOCAL_PG_CI_GATES_R68_TASK_2026-10-17.md` (TL-seeded on this branch; unchanged). R67 code-only signoff and R66 thread resolution are recorded there.
- Only change in code/config: the existing `package.json` `scripts.test` string gains `"scripts/dev-reference-local-pg-prep-1/*.test.ts"` after the unchanged `"lib/**/*.test.ts"` and `"scripts/operating-mode-guard.test.mjs"`. No other script, dependency, lockfile, workflow, guard or source file changed.
- Local Mac (offline): direct suite 116/0. `npm test` 6,965 tests / 831 suites: 6,953 pass, **10 fail**, 2 skipped; that is exactly the previous 6,849 / 821 plus the 116 tests in 10 suites, and the same 10 existing native-PostgreSQL proofs that fail on the missing Linux `initdb` path. **Not a full PASS.** typecheck exit 0; lint 0 errors / 146 pre-existing warnings; `check:operating-mode`, `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug` exit 0; `git diff --check` clean.
- `.github/workflows/ci.yml` (unchanged) runs `npm test` on `ubuntu-latest` / Node 22, so CI now runs the 116 tests. **Exact-head GitHub CI result: NOT VERIFIED by the author;** TL R68 checks it.
- R66-F5 is closed by this change if the exact-head CI passes.
- `SCHREIBEN_FREIGEGEBEN = false` unchanged. No DB connection, no SQL, no import, no secrets.

The sections below describe the R66 correction state and remain valid except where this R68 update supersedes them.
**Writer:** `Jetnity Local Development Reference Import Transport Prep 1 — Cursor Generation 1` (Owner's local native Cursor IDE; model Claude Opus 5.5, "High" as selected by the Owner). The R66 correction was made by this same logical writer/session.

## Where things stand

- Draft [PR #962](https://github.com/Jetnity/jetnity/pull/962), branch `feat/dev-reference-local-pg-writer-prep-1`, base `main@a2dbfc09468f819f05d150bf02e287eb6b00544d`, task seed `d7ce063596a38b4b17cca0596e4ac4c7a7b50461`.
- TL [R66 CHANGES REQUIRED](https://github.com/Jetnity/jetnity/pull/962#pullrequestreview-5559709389) on `936da80b7271dc35fffc3c30078ffc99f3c14fd2`, findings F1–F5, addressed in one correction commit on top of it. The R66 R2 review head is the branch tip after that commit; its exact SHA/tree are in the PR evidence comment. Re-fetch before review.
- Delivered: a code-only, opt-in, fail-closed local psql transport in `scripts/dev-reference-local-pg-prep-1/**`, reusing the unchanged `lib/airports/importieren` and `lib/places/importieren` parsers and reproducing the original upsert SQL behind a source-level drift test. 116 offline tests with a fake psql.
- R66 fixes (report §0):
  - **F1:** combined run only (`--stufe beide`), both sources mandatory, both tables must start empty, exact read-back IATA-set binding before Places.
  - **F2:** only a Homebrew libpq psql (Cellar realpath, owner, writability, version) is admitted. The fake is injected by the offline harness only.
  - **F3:** the journal stores basenames + SHA-256 and a public-safe `meldung`, never raw stderr. Exact format in report §4.7. The raw journal stays private until TL-reviewed redaction.
  - **F4:** a read-only anon grant/RLS/policy check and an anon smoke read run before the first confirmation and the first write. The final anon check is kept.
  - **F5:** required gate command and expected output in report §6.0.
- **Write path is disarmed in code** (`SCHREIBEN_FREIGEGEBEN = false` in `importieren.ts`, test-proven). Even a merge of this PR does not enable or authorise any database write.
- Original `npm run airports:importieren` / `places:importieren`, `scripts/db/sql.mjs`, `scripts/auth/ziel.ts`, `lib/rollout/schreibauftrag.ts`, `package.json`, lockfile, CI: unchanged.

## What was NOT done (and must not be inferred)

- No connection, SQL, schema read or probe against `yfvbxvijcorffwxbxahl` or any host. The local Homebrew libpq psql was run only as `psql --version` through the trust gate.
- No credential, `.env*`, keychain, `~/.pgpass`, `PGPASSWORD`, token or private-key access.
- No import, no data change, no migration, no Production (`qscbgcdmivbbnzrcyegn`), no Dashboard/browser.
- PR #955 untouched. No new branch/PR/issue. The immutable TASK is unchanged. `docs/ACTIVE_WORK_STATUS.md` intentionally not edited (task scope; #751 is the live index).
- Last Owner-observed Development state stays: `public.airports` 0, `public.places` 0 (not re-read).

## Verification at the R66 correction (local, offline)

- Required gate (report §6.0): **116 pass / 0 fail**, 10 suites, exit 0.
- `lib/airports/importieren.test.ts` + `lib/places/importieren.test.ts`: 13/13.
- New-file `tsc` (temporary extending config, deleted): exit 0. New-file ESLint: clean.
- `npm run typecheck` exit 0. `npm run lint` 0 errors / 146 pre-existing warnings.
- `check:operating-mode`, `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`: all exit 0. `git diff --check` clean.
- Mutation checks for every R66 fix bite (report §6).
- `npm test`: see report §6.1 (**not a full PASS**; the existing local-PostgreSQL proofs need a Linux `initdb` path missing on this Mac).
- Exact-head GitHub CI and Vercel for the pushed tip exist only after push and are not claimed here. CI does not run the 116 new tests.

## Open decisions for TL R66 R2

1. PASS or CHANGES REQUIRED on F1–F4 at the exact new head; acceptance of F5 as documented (manual gate) for this Draft.
2. Optional hardening (not implemented): SHA-256 pin of the libpq binary; `require_auth=scram-sha-256` / `channel_binding=require` in conninfo.
3. A separately approved gate solution for the new tests in CI before any Ready or write enablement.
4. Only after an accepted review **and** a new narrow Owner write approval: a separate reviewed commit flipping `SCHREIBEN_FREIGEGEBEN`, then the Owner-run procedure in report §8.

## Exact next step

Independent Technical-Lead R66 R2 review of the exact PR #962 head. Nothing else is started by this writer.

**R69:** superseded by: independent Technical-Lead R70 review of the exact PR #962 head published in the R69 evidence comment. Nothing else is started by this writer.

## Read order for a new agent

`.jetnity/operating-mode.json` → task file → this handoff → `docs/JETNITY_DEV_REFERENCE_LOCAL_PG_WRITER_PREP_1_REPORT_2026-10-17.md` → `docs/JETNITY_DEV_REFERENCE_LOCAL_PG_WRITER_PREP_1_SELF_REVIEW_2026-10-17.md` → PR #962 reviews and comments → #960 latest. Live evidence wins.
