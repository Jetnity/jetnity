# JETNITY — R71 Development Reference Import Readiness — REPORT

**Date:** 18 October 2026
**Task (immutable):** `docs/JETNITY_DEV_REFERENCE_LOCAL_PG_IMPORT_READINESS_R71_TASK_2026-10-18.md`, blob `d6450fe742da2de6119925d5eb825f40bbea4c3f`.
**Writer:** `Jetnity Development Reference Import Readiness 1 — Cursor Generation 1` (local native Cursor, Claude Opus 5.5 High). See §12 for the independence limitation.
**Status:** PREPARATION AND READ-ONLY EVIDENCE ONLY. **No execution, no writes, no hosted connection, no Production.**

## 0. Verdict

**GO FOR FURTHER GATING. Not GO FOR WRITE.**

- **Writer source:** the merged, disarmed writer has **no unsafe defect** that needs a separate fix before further gating (§3).
- **The actual write is BLOCKED** until all of these hold:
  - P0-1 (recovery capability) is established;
  - P0-2 (branch lifecycle and durability; `develop` is `persistent=false`) is resolved;
  - the open P1 facts in §9 are closed or explicitly accepted by the TL/Product Owner;
  - the separate, explicit final Product Owner execution permission is given.

**R72 R2 correction:** this packet now includes the facts the Technical Lead independently observed in the [R72 review](https://github.com/Jetnity/jetnity/pull/963#pullrequestreview-5560768059) at head `4604a07b`. Those facts are labelled **TL-verified (R72)**; none of them was run by this author. They are:
- the branch is `persistent=false` (F1);
- the owner, privilege, `BYPASSRLS` and membership facts (F2);
- the 12 indexes, 0 triggers and session defaults (F3).

## 1. Identity and positions (author-observed, offline git)

| Item | Value |
|---|---|
| Protected `main` | `6b78cef4d9316805d388942c6493c28fb719ba53`, tree `afd519426f30bb8c2322f1f9c83d0307ce3d4ca8` (Merge #962) |
| Branch | `docs/dev-reference-local-pg-import-readiness-r71`, Draft [PR #963](https://github.com/Jetnity/jetnity/pull/963) |
| Seed head (TL task commit) | `f740584cd17b039ac126644ce9d2aea72e5fae62`, tree `33a8161e866c2ef57f167bc869dc856569135411` |
| Merge-base | `6b78cef4…` = `main`; seed was 1 ahead and 0 behind. This R71 docs commit makes it 2 ahead and 0 behind. |
| Code versus `main` | Identical for `scripts/`, `lib/`, `app/`, `supabase/`, `package*.json`, `.github/` and `.jetnity/`. |
| Writer lock | `scripts/dev-reference-local-pg-prep-1/importieren.ts:25` is `const SCHREIBEN_FREIGEGEBEN = false as boolean` (blob `5b761166…`, the same blob R70 recorded). |
| Operating mode | `NORMAL` (re-read at start). |

**R71 changed files:** only the three new docs `docs/JETNITY_DEV_REFERENCE_LOCAL_PG_IMPORT_READINESS_R71_{REPORT,SELF_REVIEW,HANDOFF}_2026-10-18.md`.

## 2. Evidence base, and who observed what

- **TL-observed** (task §1; cited, **not** re-run by this author), on Development `develop` / `yfvbxvijcorffwxbxahl` only:
  - `airports` and `places` each have 0 rows;
  - PostgreSQL 17.6, non-replica;
  - RLS is on for both tables;
  - anon SELECT grants and SELECT policies exist (metadata only);
  - `pg_trgm` 1.6 is in `extensions`;
  - the listed indexes exist;
  - both reference migrations are applied, among 79 migrations in total;
  - the `trips.origin_place_id` and `trip_stages.place_id` foreign keys reference `places(id)`.

  Production `qscbgcdmivbbnzrcyegn` was not queried.
- **TL-verified (R72) read-only, Development `yfvbxvijcorffwxbxahl` only** (cited from the R72 review; **not** run by this author, and not proof that a write is safe):
  - **Branch:** `list_branches` reports `develop` with `is_default=false`, **`persistent=false`** and `preview_project_status=ACTIVE_HEALTHY`.
  - **Server and rows:** PostgreSQL 17.6; `airports` 0 rows, `places` 0 rows.
  - **Ownership and privileges:**
    - **both tables are owned by `postgres`**;
    - `postgres` has INSERT and UPDATE on both tables, `rolbypassrls=true` and `rolsuper=false`, and is a **member of `anon`**;
    - `anon` has SELECT on both tables, and RLS is enabled on both.
  - **Indexes and triggers:** **12 indexes** across both tables, and **0 non-internal triggers**.
  - **Session defaults:** `statement_timeout=2min`, `lock_timeout=0`, idle timeouts 0. The writer sets its own stricter lock and idle limits.
- **Owner-run, source only, earlier (R63/R64):** 5,332 airports and 119,833 GeoNames places, all 11 required codes present. Separately, a standalone native psql 18.6 connection to Development with the official CA, `verify-full`, a masked password prompt and `\conninfo` succeeded. That was **not** the writer's own child-process pathway.
- **Synthetic CI history:**
  - R69 native suite: 13/13 on psql/postgres **16.15**, run [#39075727433](https://github.com/Jetnity/jetnity/actions/runs/39075727433).
  - Exact-head run [#39077009951](https://github.com/Jetnity/jetnity/actions/runs/39077009951), confirmed by the [R70 FINAL PASS](https://github.com/Jetnity/jetnity/pull/962#pullrequestreview-5560656353).
  - Post-merge run [#39079941999](https://github.com/Jetnity/jetnity/actions/runs/39079941999), per the task: 7,052 tests, 7,051 pass, 0 fail, 1 skip.
- **What the synthetic PASS does not show:** it proves the protocol, gates and stop paths on a throwaway, hand-copied schema. It proves nothing about the real Development server, network, TLS, password prompt, role attributes, scale or deadlines.
- **Author-run in R71:** offline source reading and `git` only. No database, `psql`, Supabase API, browser, `curl` or test suite was run (docs-only; exact main CI already passed).

## 3. Source cross-check of the merged writer (current `main`)

| Area | Where | Finding |
|---|---|---|
| Fixed target | `ziel.ts:18-25`, `296-302`; `psql.ts:27-40` | Host `db.yfvbxvijcorffwxbxahl.supabase.co`, port 5432, database `postgres`, user `postgres`, `sslmode=verify-full`, explicit `sslrootcert`, `gssencmode=disable`, `connect_timeout=15`. The frozen-object check rejects the Production ref. **OK.** |
| Arguments | `ziel.ts:79-129` | Only `--name value` pairs. The Production ref, URIs and `host=` text are rejected. `--stufe beide` is mandatory. **OK.** |
| Inherited overrides | `ziel.ts:58-69`, `131-139`; `psql.ts:54-68` | Any `PG*` name, plus the URL and `PSQL*` names, aborts the run; values are never read. The child environment is rebuilt from scratch: empty `HOME`, and `PGPASSFILE`, `PGSERVICEFILE` and `PSQLRC` point to `/dev/null`. **OK.** |
| Terminal and password | `ziel.ts:148-155`; `psql.ts:42-52`; `importieren.ts:27-34` | All three standard streams must be TTYs and `/dev/tty` must open. `--password` makes psql prompt on `/dev/tty`, so the parent process never sees the password. **OK. Never exercised against Development (P1-3).** |
| psql trust | `ziel.ts:204-252` | The real path must be under the Homebrew libpq Cellar, not writable by others, owned by the user or root, at least major version 16, with the reported version equal to the Cellar version. **OK.** |
| Lock and session | `sql.ts:149-155`; `ablauf.ts:221-227` | Session-level `pg_try_advisory_lock`. `statement_timeout` 120 s, `lock_timeout` 10 s, `idle_in_transaction_session_timeout` 120 s. **OK.** |
| Preflight | `sql.ts:163-175`; `ablauf.ts:148-160` | Checks database and role, not a replica, TLS on, standard strings on, required column **names**, and 0/0 rows. It does **not** check column types, CHECK definitions, the unique indexes behind `ON CONFLICT`, write privileges, table owner or `BYPASSRLS`. For the current state the Technical Lead verified these as metadata in R72 (§2, P1-2 closed); the writer itself still does not re-check them at run time. |
| Anon gate | `sql.ts:196-222`; `ablauf.ts:172-180` | Checks the catalog (grant, RLS, policy) and then runs a read-only probe as anon. That probe needs `postgres` to be a member of `anon`; if not, the run stops before any write. **OK.** |
| Stage order and binding | `ablauf.ts:236-283` | Confirm the project ref, write airports, check count and required codes, read back the exact IATA set, confirm `ORTE`, then write Places. **OK.** |
| Batches | `sql.ts:87-140` | Fixed 150-row batches, each `begin … commit` on its own. Values are literal-quoted and `standard_conforming_strings` is verified. The ICAO release statement only touches `airports`. **OK.** |
| SQL guard | `sql.ts:294-304` | Regex blocks `delete`, `truncate`, DDL, `grant`, `copy`, psql meta-commands and variables. Defence in depth; it is not a parser. |
| Journal and no retry | `ablauf.ts:108-125`, `304-310` | The journal is created exclusively (`wx`, mode 0600); an existing journal blocks the run. No retry and no rollback of committed batches. The public message strips paths. |
| Client timeout | `psql.ts:158-169` | 180 s per request, including the very first one, which waits on the password prompt (P3-3). |
| Parsers | `lib/airports/importieren.ts:143-183` | Each IATA code is unique (best row wins) and ICAO codes are deduplicated, so no unique-index conflict can happen inside a batch. Shared unchanged with the original importer. **OK.** |
| Original importers | `scripts/airports/importieren.ts:102-138`; `scripts/places/importieren.ts:21`, `122-138` | Same columns, `ON CONFLICT` targets and ICAO release; `sql.test.ts:32-33` compares them as source text. **Unchanged.** |

**Latent constraint mismatch (P3, data-dependent):**
- `lib/places/importieren.ts:164` sets an airport-derived place's `region` to `region ?? city`, and `city` may be up to 120 characters (`lib/airports/importieren.ts:132`).
- `places_region_laenge` allows at most 80 (`supabase/migrations/20260820120000_places_referenz.sql:30-31`).
- The fallback only triggers when OurAirports `iso_region` is empty, which is practically never in that dataset.
- If it did trigger, the run would fail in the last Places batches, after all airports and GeoNames rows are committed. The original importer shares the same behaviour.
- GeoNames `lat`/`lon` are checked for finiteness, not range (`lib/places/importieren.ts:174-177`), and NUL characters are not filtered. Both are equally unlikely, and the same pre-write check would cover them (P1-4).

## 4. Hosted schema versus checked-in migrations

- **Airports** (`20260815060111_baseline.sql:715-726`): owned by `postgres`, `name NOT NULL`. The baseline has trgm indexes on name, city and country; `20260817100400_schema_hygiene.sql:17-22` drops only their `_idx` duplicates.

  So the checked-in history implies `airports_pkey`, `airports_name_trgm`, `airports_city_trgm` and `airports_country_trgm` in addition to the TL-listed `airports_iata_unique`, `airports_icao_unique` and `airports_keywords_trgm`.

  **TL-verified (R72):** the hosted index set matches. There are 12 indexes across both tables:
  - `airports_pkey`;
  - `airports_{name,city,country,keywords}_trgm`;
  - the unique IATA and ICAO indexes;
  - five Places indexes.

  So P3-1 is closed for index names. The extra GIN indexes only slow airport inserts slightly.
- **Places** (`20260820120000_places_referenz.sql:15-63`): the CHECK constraints, unique `(source, source_id)`, two GIN trgm indexes, the `typ` index, RLS, the `places_lesen` policy and the grants match the TL list. The foreign keys from `trips` and `trip_stages` have **no `ON DELETE` clause**, so they default to `NO ACTION`, which matters for any later recovery (§6).

  The table owner is not visible in the checked-in SQL. **TL-verified (R72): both tables are owned by `postgres`** (P1-2 closed as metadata).
- **No triggers** on either table in any checked-in migration. **TL-verified (R72): 0 non-internal triggers on both tables.**
- Grants: `20260817100300_rechte.sql:30-50` revokes all and grants anon and authenticated SELECT only; `20260817100100_policies.sql:55-72` drops and recreates the SELECT-only policies.
- **What column metadata and SELECT cannot prove:** CHECK definitions, the index set, owner and `BYPASSRLS`, role memberships, role-level settings, backup state, and the actual anon-visible rows after an import.

  **After R72:** the Technical Lead verified the index set, triggers, owner, privileges, `BYPASSRLS`, `anon` membership and session defaults. **Still NOT VERIFIED:**
  - backup, PITR and restore;
  - branch lifecycle and retention;
  - the real network and TLS path;
  - per-row source validity;
  - storage quota and compute;
  - behaviour at the 125k-row scale;
  - the actual anon-visible rows after an import.

  None of these can be inferred from catalog structure.

## 5. Synthetic native PASS versus the real environment

- **Proven synthetically (CI, PostgreSQL 16.15):**
  - the marker protocol, lock and Zod schemas;
  - all three anon-gate denials;
  - stopping at the TLS gate, and the batch-2 error paths;
  - the foreign-writer read-back stop;
  - partial-state behaviour;
  - cleanup.
- **Not proven:**
  - server 17.6, and the psql **18.x** client;
  - TLS `verify-full` with the official CA;
  - the `/dev/tty` password prompt in the child-process setup;
  - the network path and hostname (P1-1);
  - the real role, owner and privileges: now **TL-verified (R72) as metadata only**, never exercised by an actual write;
  - the hosted schema details (§4): index set and triggers now TL-verified (R72);
  - about 125k rows over a WAN against the timeouts (§7).

## 6. STOP and recovery

- **Order and size:**
  - 5,332 airports in **36** batches;
  - then up to 125,165 Places (119,833 GeoNames plus up to 5,332 airport-derived) in **835** batches;
  - **up to 871 independently committed transactions** in total.
- **Any stop after the first commit leaves partial rows.** The writer never deletes, retries or resumes, and the existing journal blocks a rerun. Because the preflight requires 0/0, a fresh run is also refused once any row exists.
- **The journal is a hint, not proof:**
  - it can lag the database by **one batch** (connection lost after `commit` but before the marker);
  - it is not fsynced;
  - Ctrl+C leaves `status: gestartet`.

  **The database is the source of truth;** a stop must be reported from database counts, not from the journal alone. An uncommitted batch rolls back on the server: psql only sends `commit` after the insert result arrives (`sql.ts:101-113`).
- **Escalation on any stop:**
  1. Do not rerun.
  2. Keep the journal and terminal output private.
  3. Publish only the stage, batch numbers and status.
  4. The TL performs a read-only count by stage.
  5. The Product Owner decides the recovery path.
- **Possible recovery paths. None is authorised; each needs its own decision:**
  - (a) restore the branch from a verified backup or PITR, which also reverts unrelated Development changes made since;
  - (b) a reviewed, targeted reset of exactly the two reference tables. This is destructive and needs a Product-Owner gate; the default `NO ACTION` foreign keys would block it if any Development trip already references an imported place;
  - (c) a reviewed forward-completion mode that proves the existing rows are a subset of this source and upserts the rest. That is new code with its own review;
  - (d) knowingly leave the partial state on Development.
- **Before any write, a recovery capability must be verified and agreed (P0-1).** Today it is **not established**, so the write is **BLOCKED**. No destructive workaround is proposed as authorised.
- **Branch lifecycle (P0-2, UNVERIFIED, STOP), from the TL-verified (R72) fact `persistent=false`:**
  - **Why it matters:** per the official [Supabase branching documentation](https://supabase.com/docs/guides/deployment/branching), non-persistent preview branches can be paused or deleted on inactivity, or when a linked PR is merged or closed. If that happened, the whole imported catalog could be lost through ordinary PR workflow, independently of any import failure.
  - **What is not claimed:** this report does **not** claim that this branch will be deleted. Its actual GitHub linkage, retention and pause behaviour are **unverified**.
  - **Required before any import:**
    - the actual linkage confirmed;
    - retention across merges and deployments confirmed;
    - a verified durable environment and recovery plan.
  - **Forbidden as part of this:** creating, changing, merging or resetting branches; paid persistence upgrades; and any backup/PITR claim without independent evidence.
  - Path (a) above (restore from backup or PITR) is only available if that capability is verified for this branch.

## 7. Deadline and scale risk (assessment, not a PASS)

- **Deadlines:** the server cancels any single statement after 120 s. The client kills the session after 180 s per batch round-trip. A lock wait longer than 10 s aborts.
- **Round trips:** airport batches use 4 statements and Places batches 3, so about 2,650 network round trips. At 30 ms round-trip time that is about 80 s; at 150 ms about 400 s, plus server time.
- **Server work per batch:**
  - 150 rows into five indexes, including two GIN trgm indexes with keywords of up to 800 characters;
  - GIN pending-list flushes add occasional seconds;
  - expected well under 120 s on a healthy instance.
- **Realistic total:** about 5–30 minutes. Not measured.
- **Main deadline threats:**
  - a starved or very small Development compute;
  - a concurrent migration or deploy on the branch holding locks for more than 10 s;
  - the network dropping.

  Each of these turns into a **partial-state STOP**, not data corruption.
- **Volume:** about 125k Places rows plus GIN indexes is roughly 100–300 MB of table and index data, plus WAL. Disk headroom is unverified (P2-1).
- **Bounded synthetic check (not implemented):** a separate, reviewed, test-only CI slice that
  - builds the schema from the real migration files (with `pg_trgm` and a minimal `trips`/`trip_stages` stub), which also closes the R69 fixture-drift finding;
  - loads 5,332 airports and 125,165 Places with realistic field lengths;
  - asserts that the slowest batch stays far below 120 s.

  No new dependency and no external cost, but more CI time.

## 8. Future gates, in order (none executed here)

1. Branch isolation reconfirmed: `develop` / `yfvbxvijcorffwxbxahl`, non-default, Production untouched. Merges or migrations on the linked branch frozen for the run window (P2-4).
1a. **Branch lifecycle STOP gate (P0-2):** actual linkage, retention across merges and deployments, and a durable environment with a verified recovery plan, all confirmed. `persistent=false` is TL-verified (R72); everything else here is unverified.
2. Expected reference schema, grants, indexes, owner/`BYPASSRLS`/memberships and exact 0/0. **TL-verified (R72) as current metadata**; to be re-read by the TL just before the run, because a new head or time gap expires it.
3. Fresh public source files; offline plan mode with counts inside the `GRENZEN` limits, required codes, Japan/Zürich/ZRH, and recorded SHA-256 hashes (P2-2). Constraint pre-validation of every planned row (P1-4), or an explicit accepted risk.
4. Owner-private client verification:
   - the trusted libpq psql;
   - the official CA;
   - the exact host and user;
   - `verify-full`;
   - the TTY and password prompt, ideally through the writer's own pathway (P1-1, P1-3).
5. Recovery capability verified and the recovery path agreed in advance (P0-1).
6. A reviewed code head, still disarmed, with exact-head CI.
7. **Separate, explicit final Product Owner permission.** Only then a separate reviewed enabling commit and one supervised run.
8. Airport stage.
9. Independent read-back of the airport stage (counts and required codes).
10. Places stage.
11. Independently verified anon first-party search for Japan, Zürich and `airport:ZRH` through `app/api/search/places/route.ts` on a Preview that provably targets `develop` (P2-3).
12. Later: synthetic A/B saved-trip and mutual RLS QA under the separate #955 gate.

## 9. Missing facts (finite list)

| ID | P | Missing fact | Who | Why it matters |
|---|---|---|---|---|
| P0-1 | P0 | Does `develop` have a verified backup/PITR or restore path, and which recovery path from §6 is pre-agreed? | Owner + TL | A stop after the first commit leaves partial data with no authorised cleanup. **Write BLOCKED until settled.** |
| P0-2 | P0 (STOP) | Branch lifecycle. `persistent=false` is TL-verified (R72). Unverified: actual GitHub/PR linkage; retention across merges and deployments; pause/delete behaviour; durable environment and recovery plan. | Owner + TL | The whole imported catalog could be lost through ordinary PR workflow. **Write BLOCKED until settled**; no branch change or paid upgrade is implied. |
| P1-1 | P1 | Is the direct host `db.yfvbxvijcorffwxbxahl.supabase.co:5432` reachable from the Owner Mac (direct hosts may be IPv6-only without the IPv4 add-on)? Did the earlier standalone test use exactly this host and user `postgres`, not the pooler? | Owner | The writer has no other target. A mismatch fails before any write, but the exact path is unproven. |
| P1-2 | ~~P1~~ **closed as metadata** | Table owners, `rolbypassrls`, INSERT/UPDATE privilege for `postgres`, and `postgres` membership in `anon`. | TL-verified (R72) | Both tables are owned by `postgres`; INSERT and UPDATE are allowed; `BYPASSRLS` is true; `postgres` is a member of `anon`. In R71 this author recorded it as unknown; the TL closed it in R72. Not proof that a write is safe; re-read before a run. |
| P1-3 | P1 | The writer's real pathway (child psql 18.x, `/dev/tty` prompt, empty `HOME`, `verify-full`, marker protocol on server 17.6) has never run against Development. | TL decision | Optional fix: a separate reviewed **read-only preflight mode** (connect, lock, preflight, anon and privilege checks, exit with no writes), Owner-run with permission. |
| P1-4 | P1 | No pre-write check of every planned row against the checked-in CHECK constraints (code-point lengths, regex, ranges, NUL). | TL decision | Moves every data-dependent failure (for example §3 `region`) from mid-run to before the first write. Needs a reviewed code change, or an accepted risk. |
| P2-1 | P2 | Development compute size and disk headroom or storage quota. Session defaults are now TL-verified (R72): `statement_timeout=2min`, `lock_timeout=0`, idle timeouts 0; the writer sets its own limits. | TL metadata | Affects §7 deadline and disk risk. |
| P2-2 | P2 | Fresh source files and hashes close to execution (R63/R64 counts are from 17 October). | Owner, offline | Upstream data changes move the counts and the batch plan. |
| P2-3 | P2 | Which Preview/app environment provably targets `develop` for gate 11. | TL | Prevents a false "search works" result against the wrong project. |
| P2-4 | P2 | Which git branch is linked to Supabase `develop`, and whether automatic migrations could run during the window. | TL | A migration lock longer than 10 s leads to a partial STOP. Linkage also feeds P0-2. |
| P3-1 | ~~P3~~ **closed for indexes and triggers** | Hosted index set and triggers. | TL-verified (R72) | 12 indexes as listed in §4; 0 non-internal triggers. CHECK constraints and the trip foreign keys come from earlier TL source evidence. |
| P3-2 | P3 | psql 18 client natively in CI (PGDG client package) or via P1-3. | TL | Client-version difference from the 16.15 proof. |
| P3-3 | P3 | The 180 s client limit includes typing the password. | Owner | A timeout fails safely (nothing written) but uses up that journal path. |

Already verified, not asked again:
- by the TL in R71: 0/0 rows, both migrations, `pg_trgm`, RLS, the basic anon grants and policies;
- by the TL in R72: owners, privileges, `BYPASSRLS`, `anon` membership, 12 indexes, 0 triggers, session defaults.

**Still open:** P0-1, P0-2, P1-1, P1-3, P1-4, P2-1 (compute and disk), P2-2, P2-3, P2-4, P3-2, P3-3.

## 10. Risk matrix

| P | Risk | Consequence | Mitigation available |
|---|---|---|---|
| P0 | No verified recovery | Partial rows with no authorised path back | P0-1 decision before any write |
| P0 | Non-persistent branch (`persistent=false`, TL-verified R72) is paused or deleted after import | Whole imported catalog lost through ordinary PR workflow | P0-2 lifecycle STOP gate before any write |
| ~~P1~~ resolved as metadata | `places` not writable by `postgres` because of RLS | All airports committed, 0 Places | Closed by the TL-verified (R72) owner, privilege and `BYPASSRLS` read; re-read before a run |
| P1 | Data-dependent CHECK failure mid-stage | Partial Places | P1-4 pre-validation |
| P1 | Unexercised TLS/TTY/psql-18 pathway | Fails before writing (safe), or unknown protocol behaviour | P1-3 read-only preflight mode |
| P2 | Deadline, lock or network stop at scale | Partial state, journal ±1 batch | §7 synthetic scale test, window freeze, database counts |
| P2 | Wrong environment for the search check | False confidence | P2-3 |
| P3 | Regex SQL guard, journal not fsynced, Ctrl+C status | Documented, bounded | Database is the source of truth |

## 11. Explicit non-execution

- No hosted Development or Production connection, query, API call or browser session by this author.
- No import or data write, and no writer enablement: `SCHREIBEN_FREIGEGEBEN = false`.
- No migration, RLS, Auth, schema, code, package or workflow change.
- No credentials, `.env*`, keychain, pgpass or CA contents read.
- No new dependency or cost.
- This report contains **no executable write command** and grants no write authorisation.
- Traveller context: not relevant (reference data without traveller facts).

## 12. Independence limitation

This R71 session ran in the same local Cursor chat that authored the R65–R69 writer, and its context included that work. The cross-check in §3 is therefore **not independent of the code's author**. Independent assurance comes only from TL R72 and the earlier R66–R70 reviews.
