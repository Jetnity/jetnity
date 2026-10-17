# JETNITY — Local Development Reference Import Transport Preparation 1 — REPORT

**Date:** 17 October 2026
**Status:** CODE + OFFLINE TESTS ONLY. **No database connection, no SQL against any hosted database, no import, no data change.** The write path is hard-disarmed in code. This report is not a hosted import PASS.
**Task (immutable):** `docs/JETNITY_DEV_REFERENCE_LOCAL_PG_WRITER_PREP_1_TASK_2026-10-17.md`
**Parent issue:** [#960](https://github.com/Jetnity/jetnity/issues/960) (R64/R65)
**Draft PR:** [#962](https://github.com/Jetnity/jetnity/pull/962), branch `feat/dev-reference-local-pg-writer-prep-1`
**Logical sole writer:** `Jetnity Local Development Reference Import Transport Prep 1 — Cursor Generation 1`
**Runtime:** Product Owner's local native Cursor IDE on the separate clean Mac clone. The model answering in this session is Claude Opus 5.5. The "High" setting and "not Auto" were selected by the Owner; this session cannot independently read that UI setting. No Cursor session ID is exposed to the agent; none is claimed.
**Revision:** R66 correction (same writer/session) for the binding TL review [R66 CHANGES REQUIRED on `936da80b`](https://github.com/Jetnity/jetnity/pull/962#pullrequestreview-5559709389). See §0. Sections below are updated to the corrected state.

## 0. R66 correction summary (F1–F5)

| Finding | Fix (task-owned code only) | Proving tests |
|---|---|---|
| **F1 P1** incomplete airports could feed Places | Separate stages removed. `--stufe` accepts only `beide`; both sources are mandatory; the run always starts at 0 airports and 0 Places. Before the `ORTE` confirmation, the airports read back from the DB must equal the **exact IATA set** of this run's verified source (same length, no duplicates, no extras, no missing code), on top of the exact count + required-code check. | `R66-F1: Teilbestand von 3.001 Flughäfen mit neuem Journal` (zero batches, zero confirmations); 4× `zurückgelesener Flughafenbestand ≠ Quelle` (zero Places batches, no `ORTE` prompt); `getrennte oder unbekannte Stufe abgelehnt` ×4; `verbundener Lauf braucht beide Quellen`; CLI `getrennte Orts-Stufe ist auch über die CLI gesperrt`; happy path still completes |
| **F2 P1** any executable accepted as psql | `psqlPfadPruefen` now accepts only a Homebrew **libpq** binary: realpath must match `^/opt/homebrew/Cellar/libpq/<ver>/bin/psql$` or `^/usr/local/Cellar/libpq/<ver>/bin/psql$`; regular executable file; every component from the file up to the `Cellar/libpq` root is not a symlink, owned by the current user or root, and not group/other-writable; then (only then) `psql --version` runs with `PATH=/usr/bin:/bin` and must report major ≥ 16 and `major.minor` equal to the Cellar version. The returned branded type `VertrauenswuerdigesPsql` is the only type `sitzungStarten` accepts; the fake is injected by an explicit cast in the offline harness only. | `vertrauenswürdiges psql` suite: default roots are exactly the two libpq Cellars and frozen; `/tmp` wrapper, repo `fake-psql.mjs`, a rebuilt Cellar tree elsewhere, a spoofed `…/opt/homebrew/Cellar/libpq/…` prefix → rejected and **never executed**; `postgresql@18` formula / file outside `bin` rejected; group-writable file or version dir rejected; foreign owner, non-executable, version mismatch, unparseable version, version 15 rejected; positive case incl. `opt/` symlink resolving into Cellar; `schreibauftragPruefen lehnt im echten Modus ein Test-Double ab` |
| **F3 P2** private paths / raw stderr in public evidence | `Herkunft` = `{ datei: <basename>, sha256 }` (the orchestrator applies `basename()` again defensively). `journal.meldung` = `oeffentlicheMeldung(err)`: for psql failures only the fixed text `psql beendet (Code N).` / `psql nicht startbar.`; other messages get every absolute-path token replaced by `<pfad>` and are cut at 300 characters. Raw stderr stays only in the thrown error shown on the Owner's private terminal. Exact schema in §4.7. | `R66-F3: Journal enthält weder private Pfade noch rohes stderr` (private marker in source dirs + secret marker, `password=`, IP and absolute path in synthetic stderr → none in the journal file; exact key set; basenames only; sha256 format); `R66-F3: öffentliche Meldung ersetzt Pfade und kürzt`; partial-failure test asserts `meldung` has no stderr; source test asserts basenames |
| **F4 P2** anon read checked only after writes | New read-only `anon` gate between preflight and the first Owner confirmation: catalog check (`has_table_privilege('anon','public.places','SELECT')`, `relrowsecurity`, a `SELECT`/`ALL` policy for `anon` or `public`) in `begin transaction read only … rollback`, then a smoke read `set local role anon; select count(*) from public.places` in its own read-only transaction (must run as `anon`, see 0 rows). Any denial or psql error → STOP before any confirmation or batch. Final anon check after Places kept unchanged. No DDL/RLS edit. | 7× `R66-F4: anon-Lesecheck vor dem ersten Schreiben stoppt` (no grant, RLS off, no policy, not anon, rows visible, permission-denied psql error, unexpected shape) → zero batches, zero confirmations, `stapelFertig {0,0}`; happy path asserts order `sitzung, vorpruefung, anon-rechte, anon-leseprobe, stapel…` |
| **F5 P2** tests outside `npm test`/CI | Not changed (`package.json`/CI out of scope). Required explicit gate command and reproducible sanitized output in §6. | — |

`SCHREIBEN_FREIGEGEBEN` stays `false`; proven by the CLI test (write mode exits 1, no psql start, no journal) and a source test (exactly one assignment, literally `const SCHREIBEN_FREIGEGEBEN = false as boolean`).

## 1. Exact Git state

| Item | Value |
|---|---|
| Frozen base `main` | `a2dbfc09468f819f05d150bf02e287eb6b00544d` |
| Task seed (branch start) | `d7ce063596a38b4b17cca0596e4ac4c7a7b50461` (1 ahead / 0 behind base at start) |
| R66 reviewed head | `936da80b7271dc35fffc3c30078ffc99f3c14fd2` |
| R66 R2 review head | branch tip after the R66 correction commit; exact SHA and tree are in the PR #962 evidence comment |
| Machine mode | `.jetnity/operating-mode.json` → `NORMAL` (read before any edit) |
| PR #955 | not touched (no checkout, no fetch of its branch, no comment) |

### Changed paths (all new, all task-owned)

- `scripts/dev-reference-local-pg-prep-1/ziel.ts` — literal Development target, strict flag parser (`--stufe beide` only), env-name / TTY / CA / trusted-libpq-psql / journal guards.
- `scripts/dev-reference-local-pg-prep-1/sql.ts` — batch SQL mirroring the original upserts; preflight, read-only anon gate, verification and lock queries; strict response schemas; last-line SQL guard.
- `scripts/dev-reference-local-pg-prep-1/psql.ts` — fixed psql argv, rebuilt child environment, one-session marker protocol; accepts only the branded trusted psql path; errors carry a separate public-safe text.
- `scripts/dev-reference-local-pg-prep-1/quelle.ts` — offline local source reading via the unchanged `lib/airports/importieren` and `lib/places/importieren` parsers; provenance as basename + SHA-256.
- `scripts/dev-reference-local-pg-prep-1/ablauf.ts` — single combined orchestrator (airports, exact read-back binding, then Places), once-only journal, advisory lock, early anon gate, Owner confirmations, sanitized journal, STOP on any failure.
- `scripts/dev-reference-local-pg-prep-1/importieren.ts` — CLI; default `--modus plan` (offline); write mode disarmed by `SCHREIBEN_FREIGEGEBEN = false`.
- `scripts/dev-reference-local-pg-prep-1/fake-psql.mjs` — test double for the offline harness only; opens no socket; never admitted by `psqlPfadPruefen`.
- `scripts/dev-reference-local-pg-prep-1/{ziel,sql,ablauf}.test.ts` — 116 offline tests.
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

### 4.3a Trusted psql client (R66-F2)

All of the guarantees above only hold if the binary really is psql and honours the fixed argv. The write path therefore admits only a Homebrew `libpq` psql (`brew install libpq`; usual entry `/opt/homebrew/opt/libpq/bin/psql`, which resolves into the Cellar). Order of checks in `psqlPfadPruefen`: safe absolute path → realpath → not inside the repo → realpath matches `<root>/<ver>/bin/psql` for `root ∈ {/opt/homebrew/Cellar/libpq, /usr/local/Cellar/libpq}` → regular executable file → every component from the file up to the root: no symlink, owner ∈ {current uid, root}, `mode & 0o022 == 0` → only now `psql --version` (env `PATH=/usr/bin:/bin`, `LC_ALL=C`, 5 s timeout, no shell) → major ≥ 16 and `major.minor` equals the Cellar directory version. An untrusted file is never executed, not even for `--version`.

Local observation (no connection, only `psql --version` through this gate): `/opt/homebrew/opt/libpq/bin/psql` is accepted and resolves to `/opt/homebrew/Cellar/libpq/18.6_1/bin/psql`.

Limit, stated plainly: the trust anchor is "installed by Homebrew under the Owner's account". A process already running as the Owner's uid could replace that file. That is outside what any in-repo check can prevent. Pinning a binary SHA-256 would add a supply-chain check, but Homebrew updates would then require a reviewed hash change; it is offered as a TL option, not implemented.

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

- Only one stage mode exists (`beide`): both tables must be **0** rows (Owner's last observation). Any pre-existing row, including a partial earlier airport import of any size, → STOP before the anon gate, before any confirmation and before any batch (R66-F1).
- A missing table makes the `count(*)` fail → psql exits → STOP.

Directly after the preflight, before the first Owner confirmation, the read-only **anon gate** runs (R66-F4): catalog check `{anonSelect, rls, anonPolicy}` all `true`, then a smoke read as `anon` that must report `rolle = anon` and `orte = 0`. Both statements run in `begin transaction read only … rollback`. A permission error makes psql exit (`ON_ERROR_STOP`) → STOP.

### 4.6 Stage order and verification

1. Owner types the exact Development ref `yfvbxvijcorffwxbxahl` after seeing the snapshot (also attesting Dashboard checks: correct non-default branch, backup state, resources). Anything else, including the Production ref, aborts without writing.
2. Airports batches → verify `count(*) = planned` and ZRH, GVA, BSL, LHR, LGW, JFK, EWR, DXB, BKK, HND, NRT present.
3. Read airports back (same columns and filter as the original `flughaefenHolen`). The read-back IATA set must equal this run's source IATA set exactly (R66-F1); otherwise STOP with "Keine Orte geschrieben". Then derive airport Places with `ortAusFlughafen`, merge GeoNames-first, require `airport:ZRH`.
4. Owner types `ORTE`.
5. Places batches → verify **as `anon`** in a `begin transaction read only; set local role anon; … rollback;` block: count = planned, Japan (`country`, `JP`), Zürich (`city`, `CH`), `airport:ZRH`, and `current_user = anon`. This exercises the normal first-party public read path (`places_lesen` RLS policy, `grant select … to anon`).

Any mismatch → journal `abgebrochen` with stage and last committed batch, psql closed, non-zero exit. Nothing is retried, repaired or rolled back automatically. A partial stop is never resumed by this tool: the next run would find non-empty tables and STOP at preflight.

### 4.7 Journal / receipt format (R66-F3)

The journal is the only receipt. It is written with mode 0600 outside the repo and has exactly these keys (test-enforced):

```json
{
  "ziel": "db.yfvbxvijcorffwxbxahl.supabase.co:5432/postgres",
  "ablauf": "flughaefen-dann-orte",
  "status": "gestartet | abgeschlossen | abgebrochen",
  "aktuelleStufe": "vorpruefung | flughaefen | orte | fertig",
  "geplant": { "flughaefen": 5332, "orte": null },
  "stapelFertig": { "flughaefen": 0, "orte": 0 },
  "vorher": { "flughaefen": 0, "orte": 0 },
  "herkunft": [{ "datei": "airports.csv", "sha256": "<64 hex>" }],
  "meldung": null,
  "aktualisiert": "<ISO-8601 UTC>"
}
```

- `herkunft[].datei` is a basename only (`airports.csv`, `countries.csv`, `regions.csv`, `countryInfo.txt`, `allCountries.zip|txt`); no directory, no user name.
- `meldung` is `null` or a public-safe text: `psql beendet (Code N).`, `psql nicht startbar.`, or an `Abgebrochen: …` message from this tool with absolute paths replaced by `<pfad>`, at most 300 characters. psql stderr is never stored.
- The Owner's terminal may show a psql stderr excerpt on failure. That output is private and must not be pasted publicly.
- Even though the format is designed to be public-safe, the raw journal stays private until the TL has reviewed it and approved what is posted.

## 5. Semantic differences from the original importers (explicit)

1. Per-batch transaction: original airports runs the ICAO release and the upsert as two separate Management API calls; here both run in one `begin … commit`. Stricter, same end state.
2. The upsert is wrapped in a CTE with `returning 1` to verify the written row count. Same `ON CONFLICT … DO UPDATE` effect.
3. First-write preconditions (empty tables, schema columns, TLS, not a replica, lock, read-only anon gate) exist only here; the original has none.
4. Source acquisition: the Owner downloads the same public files beforehand (`airports.csv`, `countries.csv`, `regions.csv`; `countryInfo.txt`, `allCountries.zip`) and passes directories; the original fetches them in-process. Parsing/filtering is identical; SHA-256 of every source file goes into the journal.
5. No `--bereinigen` (the original allows it in Development).
6. Stronger post-checks: exact airport count; Japan/Zürich/ZRH as `anon` (the original Places script only prints samples).
7. Session settings: `statement_timeout 120s`, `lock_timeout 10s`, `idle_in_transaction_session_timeout 120s`.
8. One combined run only (`--stufe beide`), with Owner confirmation per stage and an exact read-back binding between them; the original Places script reads whatever airports exist. Separate airport-only or Places-only runs are not possible (R66-F1).

## 6. Offline verification (this machine, sandboxed, no network used by the code)

No psql is on `PATH` here. A keg-only Homebrew `libpq` 18.6 exists at `/opt/homebrew/opt/libpq/bin/psql`. In the R66 session it was invoked only as `psql --version` through the trust gate (§4.3a). It was never connected anywhere and never given SQL.

### 6.0 Required gate command (R66-F5)

**R68 update:** under the supplemental task `docs/JETNITY_DEV_REFERENCE_LOCAL_PG_CI_GATES_R68_TASK_2026-10-17.md`, the `package.json` `test` script now also globs `"scripts/dev-reference-local-pg-prep-1/*.test.ts"`, so `npm test` and the unchanged CI workflow run these tests. Local `npm test`: 6,965 tests, 6,953 pass, 10 fail (the same existing native-PostgreSQL proofs), 2 skipped — not a full PASS. The exact-head GitHub CI result is for the TL to verify. The text below describes the state before R68; the direct command remains valid for running the suite on its own.

These tests are **not** run by `npm test` or CI (`package.json`/CI unchanged by task rule). The R66 R2 gate must run, from the repo root at the exact review head with Node 22 and `npm ci` done:

```bash
node --import ./scripts/server-only-test-register.mjs --import tsx --test "scripts/dev-reference-local-pg-prep-1/*.test.ts"
```

Expected sanitized output (summary lines of the TAP reporter; durations omitted because they vary). Observed on this Mac with Node v22.23.3, exit code 0:

```text
# tests 116
# suites 10
# pass 116
# fail 0
# cancelled 0
# skipped 0
# todo 0
```

To see that the R66 tests ran: `grep -cE '^\s*ok .* - R66-'` on the TAP output prints `14` (the stage-restriction and trust-gate tests in `ziel.test.ts` are named in German, without the prefix). The tests need no network, no secret and no database. They create temporary directories under the OS temp dir and spawn only `node` (the fake psql) and `unzip`. The output contains no local absolute path (checked with `grep -E '/Users/|/private/|/var/folders'` → nothing).

| Command | Result |
|---|---|
| gate command above | **116 pass / 0 fail**, 10 suites |
| same runner on `lib/airports/importieren.test.ts lib/places/importieren.test.ts` | 13 pass / 0 fail |
| temporary `tsc -p` config extending `tsconfig.json` with `scripts/dev-reference-local-pg-prep-1/**/*.ts` (deleted after use) | exit 0 |
| `npx eslint scripts/dev-reference-local-pg-prep-1` | 0 errors, 0 warnings |
| `npm run typecheck` | exit 0 |
| `npm run lint` | 0 errors, 146 pre-existing warnings (none in new files) |
| `check:operating-mode`, `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug` | all exit 0 |
| `npm test` (full) | 6,849 tests / 821 suites: **6,837 pass, 10 fail, 2 skipped** — see §6.1 |

Mutation sanity checks (each file backed up, mutated, tests run, restored byte-identically, then all gates rerun):

| Mutation | Failing tests |
|---|---|
| R65: reorder Places update columns | drift test |
| R65: disable per-batch row-count check | "wrong reported row count" |
| R66: skip the early anon gate | 8 |
| R66: disable the exact airport read-back binding | 4 |
| R66: store raw error text in `journal.meldung` | 2 |
| R66: store unreduced `datei` in journal provenance | 1 |
| R66: accept any `--stufe` value | 5 |
| R66: drop the libpq Cellar realpath binding | 3 |
| R66: drop the owner/writability walk | 2 |

### 6.1 Full `npm test`

**NOT a full PASS.** Rerun after the R66 correction: again 6,849 tests / 821 suites, 6,837 pass, 10 fail, 2 skipped, exit 1, with exactly the same ten failing test names as in R65; the log again contains the `initdb ENOENT` / `local_postgresql_not_available` markers (per-test attribution below is from R65 and was not redone one by one). All 10 failures are existing disposable local-PostgreSQL proofs (source-catalog gateway, trusted-store gateway, catalog hardening, S1 cutover, accepted-store projection, R3/R5 native, composed v2 bundles, M1–M4 custody). Each fails with `spawnSync /usr/lib/postgresql/16/bin/initdb ENOENT` or `local_postgresql_not_available`: that Linux PostgreSQL 16 path does not exist on this Mac. This matches the "10 local native PG failures" already recorded in #751 for other local Mac runs. None of these tests imports the new files, and this slice changes no `lib/**` file, so they are unrelated by construction. They were **not** re-run on base `main` in this session.

Note: `npm test` only globs `lib/**/*.test.ts` and the operating-mode guard test, so **the 116 new tests are not executed by `npm test` or CI**. See §6.0 and §9.

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
| partial write failure | psql error in Places batch 2 → journal stage `orte`, batches `{flughaefen:1, orte:1}`, exactly one psql start, `meldung` without stderr |
| R66-F1 incomplete airports before Places | partial 3,001 airports + new journal → 0 batches, 0 confirmations; read-back ≠ source (missing, swapped, extra, duplicate) → 0 Places batches, no `ORTE` prompt; `--stufe orte/flughaefen` rejected (parser and CLI) |
| R66-F2 untrusted psql | see §0; default trust rejects every non-Cellar-libpq path without executing it |
| R66-F3 private data in receipt | private-marker dirs + secret-bearing stderr → journal has neither; exact key set; basenames only |
| R66-F4 anon before first write | 7 denial variants → 0 batches, 0 confirmations; order check in happy path |
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
- The fake psql proves the protocol and guards, not real psql/libpq behaviour. A real psql was executed only as `--version`; real psql/PostgreSQL semantics of the session protocol, the anon gate and the batches remain **NOT VERIFIED**.
- **Trust anchor (F2):** the gate trusts a Homebrew-installed libpq owned by the Owner's account; malware already running as that account could replace it (§4.3a).
- **anon gate (F4) is a compatibility smoke check,** not a full policy proof: it proves grant + RLS + a matching policy exist and that `anon` can read the empty table. A policy whose `USING` filter hides rows would still pass on an empty table; the unchanged final anon check (Japan, Zürich, ZRH visible) catches that, but only after the writes.
- **Exact-head PR CI** for the new head is NOT VERIFIED by this report; see the PR checks.

## 8. Recommended minimal future operating procedure (subject to independent TL R66 R2 and a renewed narrow Owner write approval)

0. Install the trusted client: `brew install libpq` (keg-only; do not rely on `PATH`). Use `--psql /opt/homebrew/opt/libpq/bin/psql`. Any other psql is rejected.
1. TL R66 R2 reviews this exact head. If accepted, a **separate** reviewed commit sets `SCHREIBEN_FREIGEGEBEN = true` (nothing else), and the Owner gives a narrow approval for one Development write via this path.
2. Owner, in macOS Terminal.app on the clean clone at that exact head: confirm no `PG*`/`DATABASE_URL` variables are set (`env | cut -d= -f1 | grep -E '^PG|DATABASE_URL'` prints nothing).
3. Owner downloads the public sources into two directories outside the repo: OurAirports `airports.csv`, `countries.csv`, `regions.csv`; GeoNames `countryInfo.txt`, `allCountries.zip`.
4. Offline plan: `node --import tsx scripts/dev-reference-local-pg-prep-1/importieren.ts --quelle-flughaefen <dir> --quelle-orte <dir>`; expect ≈5,332 airports and ≈119,833 GeoNames Places, all required codes, Japan/Zürich/ZRH "ja".
5. Owner checks in the Dashboard that `develop` / `yfvbxvijcorffwxbxahl` is the non-default branch, notes backup/PITR state and resources, and that both tables still show 0 rows.
6. Write: `node --import tsx scripts/dev-reference-local-pg-prep-1/importieren.ts --modus schreiben-entwicklung-psql --stufe beide --psql /opt/homebrew/opt/libpq/bin/psql --ca <abs path to official CA> --journal <abs path outside repo, new file> --quelle-flughaefen <dir> --quelle-orte <dir>`. Enter the branch password only at psql's masked prompt; type `yfvbxvijcorffwxbxahl`, later `ORTE`.
7. On any STOP: do not rerun (the tool refuses anyway). Keep the journal and terminal output private. Report on #960 only the status, stage and batch counts; the TL decides what else may be posted after reviewing the journal.
8. On success: same rule for the journal; TL verifies the app's Places search (Japan, Zürich, ZRH) on the Development Preview as a separate read-only check.

## 9. Proactive findings

- **P2 — new tests are not in CI (R66-F5, documented, not fixed).** `npm test` globs only `lib/**/*.test.ts`. Before any Ready or write enablement, an independently approved gate is needed, e.g. a reviewed change adding `scripts/dev-reference-local-pg-prep-1/*.test.ts` to the test glob. Until then the §6.0 command is the required manual gate.
- **P3 — optional binary pin.** A SHA-256 allowlist for the libpq psql binary would harden F2 against a replaced Cellar file, at the cost of a reviewed update after every `brew upgrade libpq`. TL decision.
- **P3 — original importers are untestable as modules** (top-level `main()`). A later refactor exporting their SQL builders would let both transports share one implementation and remove the drift test. Not in scope.
- **Traveller context:** not relevant. Airport/Places reference data contains no traveller, citizenship or document facts; no traveller credentials are collected or propagated.

## 10. Costs, security, database

- New recurring cost: none. New dependency/service: none.
- Database: no migration, no schema change, no RLS change. The code expects the existing schema from `20260820110000_airports_referenz.sql` and `20260820120000_places_referenz.sql` and verifies the columns at preflight.
- Secrets: none read, none added. No `.env*` accessed.
