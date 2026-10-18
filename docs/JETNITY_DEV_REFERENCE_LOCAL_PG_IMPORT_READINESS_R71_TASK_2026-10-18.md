# JETNITY — R71 Development Reference Import Readiness & Owner Execution Decision Packet

**IMMUTABLE TECHNICAL-LEAD TASK — 18 October 2026 — ONE BOUNDED PREPARATION SLICE**

**Status:** `PREPARATION + READ-ONLY EVIDENCE ONLY`. **NO ACTUAL IMPORT. NO DEVELOPMENT OR PRODUCTION WRITES. NO WRITER ENABLEMENT. NO AUTH/DDL/RLS/SCHEMA CHANGES.**

## 0. Binding identity, baseline, owner decision

- Repository: `Jetnity/jetnity`.
- Parent Issue: [#960](https://github.com/Jetnity/jetnity/issues/960). Canonical ongoing live index: [#751](https://github.com/Jetnity/jetnity/issues/751).
- Original safely integrated writer preparation: merged [PR #962](https://github.com/Jetnity/jetnity/pull/962), independent [R70 FINAL PASS](https://github.com/Jetnity/jetnity/pull/962#pullrequestreview-5560656353), exact protected `main@6b78cef4d9316805d388942c6493c28fb719ba53`. Re-fetch latest `main` before writing.
- Final post-merge GitHub [CI #39079941999](https://github.com/Jetnity/jetnity/actions/runs/39079941999) **COMPLETED SUCCESS**, 7,052 tests / 7,051 PASS / 0 FAIL / 1 SKIP, native isolated Linux Postgres/psql 16.15 R69 13/13 PASS. Vercel Production `dpl_GFTNMv5vqqZpL97MVFqsccZ6gTmH` READY with `jetnity.com`, `aliasError=null`, exact main.
- This new task's ONLY branch: `docs/dev-reference-local-pg-import-readiness-r71`. The Technical Lead creates the one initial task-only Draft PR from exact main; do not create a second PR, issue or branch.
- Logical original R71 writer: **`Jetnity Development Reference Import Readiness 1 — Cursor Generation 1`**, *new bounded distinct slice* in **local native Mac Cursor IDE**, owner-selected **Claude Opus 5.5 High**, not Auto, Cursor Cloud, Codex or Work. The Product Owner must start this local session manually; GitHub task publication does not assert that the author has started. Author may commit/push ONLY to this task-owned Draft branch and STOP for independent TL R72.
- Earlier original local builder `Jetnity Local Development Reference Import Transport Prep 1 — Cursor Generation 1` finished after R69; do not pretend it is an active R71 agent or reuse its historical head.
- **Exact Product Owner approval:** in Technical-Lead chat replied **“Genehmig”** to the narrow request to *prepare a one-time local direct-Postgres Development import, including necessary Development checks, with real execution only after full independent safety review*. Receipt: [#960 R71 PO consent](https://github.com/Jetnity/jetnity/issues/960#issuecomment-6243357660). This is NOT approval to actually write, to flip `SCHREIBEN_FREIGEGEN`/`SCHREIBEN_FREIGEGEBEN`, to handle owner's password, to run production, or to repeat forbidden hosted Official Truth queries.
- Machine mode on main was `NORMAL` at latest TL check. Re-read mode `.jetnity/operating-mode.json` before any work.

## 1. Independently observed exact Development-only truth

**Development branch identity (read-only Supabase management metadata):** Parent Production/default `main` ref `qscbgcdmivbbnzrcyegn` is strictly OUT OF SCOPE; a separate branch list shows `develop`, ref `yfvbxvijcorffwxbxahl`, `is_default=false`, `preview_project_status=ACTIVE_HEALTHY`. The connector's `get_project(yfv...)` doesn't treat the branch as an independent project, but explicit `project_id=yfvbxvijcorffwxbxahl` for Dev-specific table/migration/SQL read endpoints succeeded. **Do NOT silently replace Dev ref with parent project ID.**

Fresh independent **non-mutating** SQL `SELECT` on exactly Development `yfvbxvijcorffwxbxahl` (not browser screenshot/inferred rows):
- `public.airports COUNT(*) = 0`; `public.places COUNT(*) = 0`.
- Database `postgres`, server PostgreSQL 17.6 (`server_version_num=170006`), non-replica.
- Both tables `relrowsecurity=true`.
- `anon` `SELECT` table grants for both tables and matching catalog `SELECT` policies present. This is privilege/policy **metadata** only; **actual post-import anon-visible rows and normal first-party search NOT VERIFIED**.
- Dev-specific schema metadata gives expected airport and places reference columns and existing `trips.origin_place_id` / `trip_stages.place_id` foreign keys referring to `places(id)`.
- `pg_trgm` extension 1.6 installed under `extensions`. Read-only `pg_indexes` shows `airports_iata_unique`, `airports_icao_unique`, `airports_keywords_trgm`, `places_pkey`, `places_quelle_eindeutig`, `places_name_trgm`, `places_keywords_trgm`, `places_typ_idx`. Expected public reference constraints present.
- `list_migrations` for exact Dev ref showed 79 applied migrations, including `20260820110000_airports_referenz` and `20260820120000_places_referenz`.
- None of the above reads any traveller rows, credentials or secrets; no changes were made. **No user/trip private records in reports.**

Earlier Owner-run **SOURCE-ONLY** evidence, not newly rerun at R71: 5,332 suitable OurAirports airports (required ZRH/GVA/BSL/LHR/LGW/JFK/EWR/DXB/BKK/HND/NRT pass), 119,833 suitable GeoNames Places. **0 rows imported**. The previous Owner standalone native `psql 18.6` + official CA + `verify-full` + masked password `\conninfo` succeeded against Dev only, but it was **not a test of the new writer's actual child-process/TTY/TLS pathway**.

Production `qscbgcdmivbbnzrcyegn` has **NOT** been SQL-queried or modified for these R71 facts.

## 2. Objective: an independently reviewable future one-time import go/no-go packet

Produce an exact, minimal technical and operational **readiness/decision packet** for a future one-time **owner-supervised Development reference dataset restore** using the already merged but source-disarmed local native Postgres adapter. **Do NOT implement, start or enable actual import.** No executable activation request, token, keychain, private CA contents, password, live database operation, or trial data write.

Do an original **code/source read-only cross-check** on current `main`:
1. `scripts/dev-reference-local-pg-prep-1/{ziel,psql,sql,quelle,ablauf,importieren}.ts` — fail-closed literal Dev host/branch, TLS verify-full/CA, Homebrew libpq psql trust check, TTY handling, inherited PG* overrides, stage order, empty-table preflight, anon/RLS, advisory lock, journal/no retry/partial-stop, fixed batch size and timeout.
2. Original `scripts/airports/importieren.ts`, `scripts/places/importieren.ts` and pure parsers `lib/airports/importieren`, `lib/places/importieren` — validate source parsing/column order, stable ID, collision/ICAO and Upsert handling, source hashes and expected data shape. Never alter original scripts.
3. Actual checked-in `supabase/migrations/20260820110000_airports_referenz.sql`, `20260820120000_places_referenz.sql` plus relevant base schema; compare with the precise **TL-observed Development metadata above**, noting what `list_tables` and catalog SELECT alone cannot prove. No reliance on the hand-copied R69 fixture as hosted-schema proof. **No migrations applied.**
4. R69 full source and independent R70 final review + Linux proof; distinguish **synthetic native protocol PASS** from **real Development environment/large import NOT VERIFIED**.
5. Review the STOP and recovery constraints: ~5,332 airports first, then ~119,833 GeoNames + airport-derived Places; multiple independently committed 150-row batches (~835 total). A crash/constraint/deadline failure can leave partial rows. There is **NO UNAPPROVED CLEANUP/DELETE/TRUNCATE/RESET/RETRY**. Document no-auto-retry, exact journal trust, partial-state reporting, escalation, and the requirement for *verified restore/backup/PITR/branch recovery* before any actual write; if backup/recovery cannot be established, flag **BLOCKED**. Do not propose a destructive workaround as an authorized action.
6. Quantify the 120-second SQL/transport deadline risks and ~125k-row scale **as a risk assessment**, not as a performance PASS. Propose a bounded synthetic test-only check if vital, but do not implement new harness, dependencies or a broad perf framework in this slice.
7. Give the exact sequence of **future gates only**, including: branch-isolation confirmation → expected reference schema/grants/indexes and precise empty preflight → valid source files & offline hashes/counts → safe owner-private CA/client/TLS/TTY verification → owned restore capability/readiness → reviewed code head with writer still disarmed → **separate explicit final Product Owner permission** before any proposed enablement and first write → airport stage → independent stage readback → Places stage → independently verified `anon` Japan/Zürich/`airport:ZRH` first-party search → later synthetic A/B saved-trip and mutual RLS QA under independent #955 gate. Don't claim any later step executed.
8. Identify a finite list of only *actual missing facts* with criticality P0/P1/P2/P3 and owner action requirements. Avoid repeated questions about already verified 0/0, both migrations, `pg_trgm`, RLS and basic grants.

## 3. Strict execution boundary

**This author (Cursor R71) is OFFLINE/REPOSITORY-READ-ONLY outside the allowed report files.** The Technical Lead already executed independently scoped read-only hosted Development metadata and SQL with explicit new PO authorization. The R71 Cursor agent **MUST NOT** call Supabase SQL, Management API, Cloud Browser, `psql` against any hosted endpoint, `DATABASE_URL`, login, `curl` or contact any hosted database, even for SELECT. If a further live Development read is truly essential, record precise request and STOP for the Technical Lead; do not reroute a refusal to another tool. Prior unrelated #917/DEV-PREP-1 denied readback stays FORBIDDEN.

Do not inspect `.env*`, secrets, Keychain, `~/.pgpass`, owner passwords, service role, private credential files, CA contents, any user or real Trip data. No install, new external provider/service, costly or paid calls.

Do not modify `main`, #955, Auth/RLS/migrations/schema, `scripts/dev-reference-local-pg-prep-1/**`, source importers, `app/**`, `lib/**`, `supabase/**`, package/lock/workflows/operating mode. `SCHREIBEN_FREIGEGEBEN=false` stays locked. Do NOT provide ready-to-run write command as an executed instruction. No write authorization inferred from current PO preparation consent.

Do not create a second issue/branch/PR, mark Ready, merge, or start automatic follow-up.

## 4. Allowed R71 files / acceptance

Allowed only NEW:
- `docs/JETNITY_DEV_REFERENCE_LOCAL_PG_IMPORT_READINESS_R71_REPORT_2026-10-18.md`
- `docs/JETNITY_DEV_REFERENCE_LOCAL_PG_IMPORT_READINESS_R71_SELF_REVIEW_2026-10-18.md`
- `docs/JETNITY_DEV_REFERENCE_LOCAL_PG_IMPORT_READINESS_R71_HANDOFF_2026-10-18.md`

This **IMMUTABLE TASK** must remain unchanged; original immutable R65/R68/R69 tasks unchanged.

Evidence should include exact current `main`, own branch/head/tree, merge-base/ahead/behind, actual changed file list, source references and relevant line ranges, concrete live TL facts **cited as previously observed** rather than claimed as author-run, synthetic CI history, unverified preconditions, P0–P3 risk matrix, explicit NO EXECUTION / NO WRITES / NO PRODUCTION, and a clear recommended **GO FOR FURTHER GATING or BLOCKED** (never GO FOR WRITE under this task).

If code/source inspection finds an actual unsafe defect in the already merged writer, STOP and classify `CHANGES REQUIRED / SEPARATE REVIEWED FIX NEEDED`; don't quietly edit it here. Keep report public-safe with **no local path identifiers, logs, credential metadata, private files or secrets**.

Run safe offline doc hygiene (diff/check) and any limited existing repo checks necessary to support factual findings; **do not rerun huge suites for a docs-only change if exact untouched main CI already passed**. Be honest about non-run gates.

Timebox 60–90 minutes. One original R71 local Cursor writer on existing task Draft, ordinary branch-only commit/push, sanitized handoff, then **STOP FOR INDEPENDENT TL R72**.

**DO NOT READY. DO NOT MERGE. DO NOT ENABLE THE WRITER. DO NOT IMPORT. DO NOT START A FOLLOW-UP.**
