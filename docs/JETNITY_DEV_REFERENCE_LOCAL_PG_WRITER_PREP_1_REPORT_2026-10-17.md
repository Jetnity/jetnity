# JETNITY — Local Development Reference Import Transport Preparation 1 — REPORT

**Date:** 17 October 2026
**Status:** CODE + OFFLINE TESTS ONLY. **No database connection, no SQL against any hosted database, no import, no data change.** The write path is hard-disarmed in code. This report is not a hosted import PASS.
**Task (immutable):** `docs/JETNITY_DEV_REFERENCE_LOCAL_PG_WRITER_PREP_1_TASK_2026-10-17.md`
**Parent issue:** [#960](https://github.com/Jetnity/jetnity/issues/960) (R64/R65)
**Draft PR:** [#962](https://github.com/Jetnity/jetnity/pull/962), branch `feat/dev-reference-local-pg-writer-prep-1`
**Logical sole writer:** `Jetnity Local Development Reference Import Transport Prep 1 — Cursor Generation 1`
**Runtime:** Product Owner's local native Cursor IDE on the separate clean Mac clone. The model answering in this session is Claude Opus 5.5. The "High" setting and "not Auto" were selected by the Owner; this session cannot independently read that UI setting. No Cursor session ID is exposed to the agent; none is claimed.

## 1. Exact Git state

| Item | Value |
|---|---|
| Frozen base `main` | `a2dbfc09468f819f05d150bf02e287eb6b00544d` |
| Task seed (branch start) | `d7ce063596a38b4b17cca0596e4ac4c7a7b50461` (1 ahead / 0 behind base at start) |
| Review head | branch tip after the delivery commit that adds this report; exact SHA and tree are in the PR #962 evidence comment |
| Machine mode | `.jetnity/operating-mode.json` → `NORMAL` (read before any edit) |
| PR #955 | not touched (no checkout, no fetch of its branch, no comment) |

### Changed paths (all new, all task-owned)

- `scripts/dev-reference-local-pg-prep-1/ziel.ts` — literal Development target, strict flag parser, env-name / TTY / CA / psql-path / journal guards.
- `scripts/dev-reference-local-pg-prep-1/sql.ts` — batch SQL mirroring the original upserts; preflight, verification and lock queries; strict response schemas; last-line SQL guard.
- `scripts/dev-reference-local-pg-prep-1/psql.ts` — fixed psql argv, rebuilt child environment, one-session marker protocol.
- `scripts/dev-reference-local-pg-prep-1/quelle.ts` — offline local source reading via the unchanged `lib/airports/importieren` and `lib/places/importieren` parsers.
- `scripts/dev-reference-local-pg-prep-1/ablauf.ts` — two-stage orchestrator (airports, then Places), once-only journal, advisory lock, Owner confirmations, STOP on any failure.
- `scripts/dev-reference-local-pg-prep-1/importieren.ts` — CLI; default `--modus plan` (offline); write mode disarmed by `SCHREIBEN_FREIGEGEBEN = false`.
- `scripts/dev-reference-local-pg-prep-1/fake-psql.mjs` — test double; opens no socket.
- `scripts/dev-reference-local-pg-prep-1/{ziel,sql,ablauf}.test.ts` — 90 offline tests.
- `docs/JETNITY_DEV_REFERENCE_LOCAL_PG_WRITER_PREP_1_{REPORT,HANDOFF,SELF_REVIEW}_2026-10-17.md`.

**Unchanged (verified by `git status` / diff):** `scripts/airports/importieren.ts`, `scripts/places/importieren.ts`, `scripts/db/sql.mjs`, `scripts/auth/ziel.ts`, `lib/rollout/schreibauftrag.ts`, all `lib/**`, `app/**`, `supabase/**`, `package.json`, lockfile, CI workflows, operating-mode guard. No dependency added. No npm script added. `npm run airports:importieren` and `npm run places:importieren` keep their exact default dry-run and Management-API write behaviour; `--schreiben --entwicklung` still means the original Management API path and never the new psql path.

`docs/ACTIVE_WORK_STATUS.md` was deliberately **not** edited: the task scopes deliverables to source/test/report/handoff/self-review, and #751 is the canonical live index. The handoff file carries the progress persistence for this slice.

## 2. Approved scope vs non-scope

**In scope (done):** read-only inspection of the original importers; a new, opt-in, fail-closed local psql transport that reuses the canonical lib parsers and reproduces the original upsert SQL; offline tests with a fake psql; this report, handoff and self-review.

**Not done, by design:** any connection to `db.yfvbxvijcorffwxbxahl.supabase.co` or any other host; any SQL; any credential, `.env*`, keychain, `~/.pgpass`, `PGPASSWORD`, token or certificate private key read; Management API calls; Supabase Dashboard/browser; migrations/DDL/RLS/Auth/roles; `--bereinigen`/delete/truncate; Production (`qscbgcdmivbbnzrcyegn`); provider/payment; new branch/PR/issue; Ready/merge; follow-up slice.

## 3. Reuse of existing importer contracts

| Concern | Source of truth reused | How |
|---|---|---|
| OurAirports parsing/filtering | `flughaefenAusOurAirports` (`lib/airports/importieren.ts`) | called unchanged on the three local CSVs |
| GeoNames parsing/filtering | `geoNamesTsvZeile`, `geoNamesZeileRelevant`, `orteAusGeoNames`, `laenderAusCountryInfo` | called unchanged; streaming pre-filter identical to the original download path, so `verworfen` has the same meaning as Owner run R64 (119,833 / 9) |
| Airport-derived Places | `ortAusFlughafen` | called unchanged on rows read back from `public.airports`, exactly like `flughaefenHolen()` |
| Stable IDs | `ortId` via `orteAusGeoNames`; `airport:<IATA>` via `ortAusFlughafen` | unchanged |
| Upsert columns / value order / `ON CONFLICT` / ICAO release / batch size 150 / required airport codes / merge order | private in `scripts/{airports,places}/importieren.ts` | reproduced in `sql.ts`; `sql.test.ts` parses the **original script source** and fails on any drift |

The original entrypoints are monolithic (they call `main()` on import and keep SQL builders private), so they could not be imported without modifying them. Reproducing the private SQL text behind a source-level drift test was chosen over editing the original entrypoints, which the task allows only as a last resort.

## 4. Design and threat model

### 4.1 Target pinning

- `ZIEL` is a frozen literal: host `db.yfvbxvijcorffwxbxahl.supabase.co`, port `5432`, db `postgres`, user `postgres`, `sslmode=verify-full`. No flag, environment variable or URI can set host, port, db, user or SSL mode.
- `verbindungsText()` re-validates that the target object deep-equals the frozen constant before building conninfo (a tampered/Production object throws).
- Any argument value containing the Production ref, `://` or `host=` is rejected. Unknown, duplicate, short (`-h`) and positional arguments are rejected.

### 4.2 TLS

- conninfo always carries `sslmode=verify-full sslrootcert=<owner CA path> gssencmode=disable`. There is no code path producing `sslmode=require`, `sslrootcert=system` or any insecure option.
- CA path must be absolute, normalised, free of spaces/quotes (so conninfo needs no quoting), a regular file of plausible size, PEM `BEGIN CERTIFICATE`, and must not contain `PRIVATE KEY`. The CA content is never logged or copied.
- After connecting, the preflight re-checks `pg_stat_ssl.ssl = true` for the own backend.

### 4.3 Password handling

- psql is started with `--password`, so psql itself prompts once per run, masked, via `/dev/tty`. The Node process never sees, stores or logs the password; stdin of psql is only SQL.
- **Pitfall handled:** libpq's `simple_prompt` falls back to stdin/stderr when `/dev/tty` cannot be opened. That would feed SQL text into the password prompt. The write path therefore requires stdin/stdout/stderr to be TTYs **and** `/dev/tty` openable, and fails closed otherwise.
- Child environment is rebuilt from scratch (no inheritance): `PGPASSFILE=/dev/null` (no `~/.pgpass`), `PGSERVICEFILE=/dev/null`, `PGSYSCONFDIR=<empty dir>`, `PSQLRC=/dev/null`, `PSQL_HISTORY=/dev/null`, `HOME=<fresh empty temp dir>` (no `~/.postgresql/root.crt`, client cert or key), `PATH=/usr/bin:/bin`. `--no-psqlrc` is also passed.
- **PG\* pitfall handled:** before anything else, the parent environment is checked **by name only** (values are never read). Any `PG*` name, `DATABASE_URL`, `POSTGRES_URL*`, `SUPABASE_DB_URL`, `SUPABASE_DB_PASSWORD`, `PSQLRC`, `PSQL_HISTORY`, `PSQL_PAGER` or `CI` aborts the run. A generic `PAGER` is tolerated because the child environment is rebuilt and never inherits it.
- No password in argv, env, files, journal, logs or code. `ps` shows conninfo with host and CA path only.

### 4.4 Write discipline

- **Disarmed:** `importieren.ts` throws before any guard, file read or spawn while `SCHREIBEN_FREIGEGEBEN = false`. Arming requires a separate, independently reviewed commit after a new narrow Owner approval.
- **Once-only journal:** created with `O_EXCL` (`wx`, mode 0600) outside the repository. If it exists the run refuses before psql starts. This blocks duplicate writers on the same machine and any automatic or manual "just rerun" after a partial stop.
- **Advisory lock:** `pg_try_advisory_lock(7096200965)` at session start; failure → STOP before preflight (parallel writer from another machine).
- **One psql process per run, no respawn.** Requests are SQL + `\echo <random marker>`; `ON_ERROR_STOP=1` makes psql exit on the first error; the session is never restarted.
- **Per-batch commit:** each batch is `begin; [icao release;] with geschrieben as (insert … on conflict … returning 1) select jsonb_build_object('n', count(*)); commit;`. The returned `n` must equal the batch size, else STOP. A failing batch rolls back only itself; earlier committed batches stay (non-atomic run, as required). No automatic rollback or retry.
- **SQL guard before send:** after stripping literals and comments, any `delete|truncate|drop|alter|grant|revoke|create|comment on|copy|vacuum|reindex|cluster`, psql meta-command or psql variable aborts.
- **Excessive statements:** source size limits before connecting — airports 3,000–10,000, GeoNames Places 80,000–200,000, total Places ≤ 200,000 — so at most 67 airport and 1,334 Places batches. Duplicate IATA codes or duplicate Place IDs abort.

### 4.5 Preflight snapshot (first statement after the lock)

One JSON line, strict schema (extra or missing fields abort): `current_database()`, `current_user`, `pg_is_in_recovery()`, own-backend TLS, `standard_conforming_strings` (must be `on` because literals are quoted by doubling `'`), `server_version_num`, the actual column lists of `public.airports` and `public.places` (must contain every insert column), and both row counts.

- Stage `flughaefen`/`beide`: both tables must be **0** rows (Owner's last observation). Any pre-existing row → STOP.
- Stage `orte`: airports must already be ≥ 3,000 and Places 0.
- A missing table makes the `count(*)` fail → psql exits → STOP.

### 4.6 Stage order and verification

1. Owner types the exact Development ref `yfvbxvijcorffwxbxahl` after seeing the snapshot (also attesting Dashboard checks: correct non-default branch, backup state, resources). Anything else, including the Production ref, aborts without writing.
2. Airports batches → verify `count(*) = planned` and ZRH, GVA, BSL, LHR, LGW, JFK, EWR, DXB, BKK, HND, NRT present.
3. Read airports back (same columns and filter as the original `flughaefenHolen`), derive airport Places with `ortAusFlughafen`, merge GeoNames-first, require `airport:ZRH`.
4. Owner types `ORTE`.
5. Places batches → verify **as `anon`** in a `begin transaction read only; set local role anon; … rollback;` block: count = planned, Japan (`country`, `JP`), Zürich (`city`, `CH`), `airport:ZRH`, and `current_user = anon`. This exercises the normal first-party public read path (`places_lesen` RLS policy, `grant select … to anon`).

Any mismatch → journal `abgebrochen` with stage and last committed batch, psql closed, non-zero exit. Nothing is retried, repaired or rolled back automatically.

## 5. Semantic differences from the original importers (explicit)

1. Per-batch transaction: original airports runs the ICAO release and the upsert as two separate Management API calls; here both run in one `begin … commit`. Stricter, same end state.
2. The upsert is wrapped in a CTE with `returning 1` to verify the written row count. Same `ON CONFLICT … DO UPDATE` effect.
3. First-write preconditions (empty tables, schema columns, TLS, not a replica, lock) exist only here; the original has none.
4. Source acquisition: the Owner downloads the same public files beforehand (`airports.csv`, `countries.csv`, `regions.csv`; `countryInfo.txt`, `allCountries.zip`) and passes directories; the original fetches them in-process. Parsing/filtering is identical; SHA-256 of every source file goes into the journal.
5. No `--bereinigen` (the original allows it in Development).
6. Stronger post-checks: exact airport count; Japan/Zürich/ZRH as `anon` (the original Places script only prints samples).
7. Session settings: `statement_timeout 120s`, `lock_timeout 10s`, `idle_in_transaction_session_timeout 120s`.
8. Stages are separable (`--stufe flughaefen|orte|beide`) with Owner confirmation per stage; the original Places script reads airports implicitly in the same run.

## 6. Offline verification (this machine, sandboxed, no network used by the code)

`psql` is not installed on this machine (`which psql` → not found), so no real psql could even be started.

| Command | Result |
|---|---|
| `node --import ./scripts/server-only-test-register.mjs --import tsx --test "scripts/dev-reference-local-pg-prep-1/*.test.ts"` | **90 pass / 0 fail**, 9 suites |
| same runner on `lib/airports/importieren.test.ts lib/places/importieren.test.ts` | 13 pass / 0 fail |
| temporary `tsc -p` config extending `tsconfig.json` with `scripts/dev-reference-local-pg-prep-1/**/*.ts` (deleted after use) | exit 0 |
| `npx eslint scripts/dev-reference-local-pg-prep-1` | 0 errors, 0 warnings |
| `npm run typecheck` | exit 0 |
| `npm run lint` | 0 errors, 146 pre-existing warnings (none in new files) |
| `check:operating-mode`, `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug` | all exit 0 |
| `npm test` (full) | 6,849 tests / 821 suites: **6,837 pass, 10 fail, 2 skipped** — see §6.1 |

Mutation sanity check: temporarily reordering the Places update columns made the drift test fail; temporarily disabling the per-batch row-count check made the "wrong reported row count" test fail. Both files were restored before the gates above were rerun.

### 6.1 Full `npm test`

**NOT a full PASS.** All 10 failures are existing disposable local-PostgreSQL proofs (source-catalog gateway, trusted-store gateway, catalog hardening, S1 cutover, accepted-store projection, R3/R5 native, composed v2 bundles, M1–M4 custody). Each fails with `spawnSync /usr/lib/postgresql/16/bin/initdb ENOENT` or `local_postgresql_not_available`: that Linux PostgreSQL 16 path does not exist on this Mac. This matches the "10 local native PG failures" already recorded in #751 for other local Mac runs. None of these tests imports the new files, and this slice changes no `lib/**` file, so they are unrelated by construction. They were **not** re-run on base `main` in this session.

Note: `npm test` only globs `lib/**/*.test.ts` and the operating-mode guard test, so **the 90 new tests are not executed by `npm test` or CI**. See §9.

### 6.2 Test coverage against acceptance criterion 3

| Required case | Test(s) |
|---|---|
| wrong / Production host | `verändertes Ziel (Production-Host)…`, Production-ref / URI / conninfo argument tests, Production ref typed at confirmation |
| missing CA | `fehlendes CA-Zertifikat`, CA private-key / non-PEM / relative / space / `..` tests |
| wrong SSL mode | `sslmode-Override` rejected; conninfo exact-equality test (no `require`/`system`) |
| non-interactive environment | `stdinTty/stdoutTty/stderrTty=false`, no `/dev/tty`, `CI` set |
| PGHOST/PGSERVICE/PGPASSWORD/PGPASSFILE (+12 more) overrides | one test per name; child env exact key set; fake psql records env without any of them |
| wrong / extra flags | host/port/dbname/sslmode/user/password/`--bereinigen`/duplicate/short/positional/no-value; original `--schreiben --entwicklung` unlocks nothing |
| missing user preflight | no confirmation, wrong text, Production ref → zero batches sent |
| bad batch output | non-JSON batch answer; preflight with extra field; wrong reported row count |
| partial write failure | psql error in Places batch 2 → journal stage `orte`, batches `{flughaefen:1, orte:1}`, exactly one psql start |
| attempted automatic retry | second run with same journal refused before psql; immediate connection failure → no second start |
| source-side IATA / country / city / ZRH | synthetic `lib/*/fixtures`: all required IATA, ZRH city/country, `airport:ZRH` derivation, Japan country, Zürich city, ambiguous zip+txt rejected |
| write path disarmed | CLI write mode → exit 1, no psql start, no journal |
| plan mode offline | CLI plan with fixtures → counts, no psql |

## 7. Key residual risks

- **Supabase direct host is commonly IPv6-only.** The Owner's R62 native connection succeeded, so the path works on that Mac; another network may not.
- **Terminal capture.** The password is masked and never echoed, but an agent-observable integrated terminal still records surrounding output. Recommend running a future write in macOS Terminal.app, not in an agent-observed Cursor terminal.
- **libpq hardening not added:** `require_auth=scram-sha-256` and `channel_binding=require` would further reduce credential exposure to a spoofed server, but server compatibility cannot be verified offline. `verify-full` already blocks a spoofed host. TL decision for R66.
- **Branch identity and backup readiness** cannot be proven over SQL; they remain an Owner attestation at the confirmation prompt, plus the literal host.
- **Source mutability:** counts will differ from the August 124,811 baseline and possibly from the R63/R64 runs; the limits are ranges, not exact values.
- **Non-atomic run:** a stop mid-Places leaves a partially filled `public.places`. Recovery needs a new reviewed decision (journal blocks reruns).
- The fake psql proves the protocol and guards, not real psql/libpq behaviour; a real psql was never executed.

## 8. Recommended minimal future operating procedure (subject to independent TL R66 and a renewed narrow Owner write approval)

1. TL R66 reviews this exact head. If accepted, a **separate** reviewed commit sets `SCHREIBEN_FREIGEGEBEN = true` (nothing else), and the Owner gives a narrow approval for one Development write via this path.
2. Owner, in macOS Terminal.app on the clean clone at that exact head: confirm no `PG*`/`DATABASE_URL` variables are set (`env | cut -d= -f1 | grep -E '^PG|DATABASE_URL'` prints nothing).
3. Owner downloads the public sources into two directories outside the repo: OurAirports `airports.csv`, `countries.csv`, `regions.csv`; GeoNames `countryInfo.txt`, `allCountries.zip`.
4. Offline plan: `node --import tsx scripts/dev-reference-local-pg-prep-1/importieren.ts --quelle-flughaefen <dir> --quelle-orte <dir>`; expect ≈5,332 airports and ≈119,833 GeoNames Places, all required codes, Japan/Zürich/ZRH "ja".
5. Owner checks in the Dashboard that `develop` / `yfvbxvijcorffwxbxahl` is the non-default branch, notes backup/PITR state and resources, and that both tables still show 0 rows.
6. Write: `node --import tsx scripts/dev-reference-local-pg-prep-1/importieren.ts --modus schreiben-entwicklung-psql --stufe beide --psql <abs path to psql 18> --ca <abs path to official CA> --journal <abs path outside repo, new file> --quelle-flughaefen <dir> --quelle-orte <dir>`. Enter the branch password only at psql's masked prompt; type `yfvbxvijcorffwxbxahl`, later `ORTE`.
7. On any STOP: do not rerun. Post the sanitized journal (no secrets in it) to #960 for TL decision.
8. On success: post journal and console summary; TL verifies the app's Places search (Japan, Zürich, ZRH) on the Development Preview as a separate read-only check.

## 9. Proactive findings

- **P2 — new tests are not in CI.** `npm test` globs only `lib/**/*.test.ts`. Recommend that the TL either adds `scripts/dev-reference-local-pg-prep-1/*.test.ts` to the test script in a reviewed change or keeps the explicit command above as a required R66 gate. Not done here because `package.json` was outside the task's preferred change set.
- **P3 — original importers are untestable as modules** (top-level `main()`). A later refactor exporting their SQL builders would let both transports share one implementation and remove the drift test. Not in scope.
- **Traveller context:** not relevant. Airport/Places reference data contains no traveller, citizenship or document facts; no traveller credentials are collected or propagated.

## 10. Costs, security, database

- New recurring cost: none. New dependency/service: none.
- Database: no migration, no schema change, no RLS change. The code expects the existing schema from `20260820110000_airports_referenz.sql` and `20260820120000_places_referenz.sql` and verifies the columns at preflight.
- Secrets: none read, none added. No `.env*` accessed.
