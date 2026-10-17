# JETNITY — Local Development Reference Import Transport Preparation 1
**IMMUTABLE TECHNICAL LEAD TASK — 17 October 2026**

**Status:** CODE/TEST-ONLY PREPARATION. **NO LIVE DATABASE ACCESS OR IMPORT. NOT APPROVED TO WRITE.**

**Logical sole author:** `Jetnity Local Development Reference Import Transport Prep 1 — Cursor Generation 1`
**Implementation:** local Cursor IDE on Product Owner's separate clean Mac clone, **Claude Opus 5.5 High** explicitly selected, not Auto.
**Repository:** `Jetnity/jetnity`
**Parent issue:** [#960](https://github.com/Jetnity/jetnity/issues/960)
**Task branch:** `feat/dev-reference-local-pg-writer-prep-1`; use the existing Draft PR for this branch.
**Frozen base main:** `a2dbfc09468f819f05d150bf02e287eb6b00544d`.
**Existing unrelated Trip Audit Draft:** [#955](https://github.com/Jetnity/jetnity/pull/955) `e88464ab223dfcee039b8444e1e8f20dd71a637d` — DO NOT TOUCH.
**Timebox:** aim 60–90 minutes; if safe design needs substantial work, report BLOCKED and STOP; no multi-day infrastructure project.

## 0. Product Owner decision and actual evidence

Owner expressly authorized **preparing and independently reviewing** a safe *local, Development-only PostgreSQL import route*, **not running any new direct-Postgres database writes yet**. This is an extra method gate after the original limited R56 authorization to import **airport rows first, then Places** through Jetnity's existing guarded Management API scripts.

Owner already personally observed on nondefault **Supabase develop/PREVIEW `yfvbxvijcorffwxbxahl`**:
- `public.airports` **0 records** and `public.places` **0 records** at that observation time (not a locked snapshot).
- Actual `psql 18.6` native, **only** `db.yfvbxvijcorffwxbxahl.supabase.co:5432`, `sslmode=verify-full`, locally downloaded *official* CA and owner-private masked DB password authenticated successfully; **no SQL performed**.
- SOURCE-ONLY existing `npm run airports:importieren` PASS: 5,332 OurAirports candidates, 80,926 ignored, all mandatory ZRH/GVA/etc; no DB reads/writes.
- SOURCE-ONLY `npm run places:importieren` PASS: 119,833 GeoNames candidates, 9 ignored; no DB reads/writes.
- Supabase parent `main` **Production** project ref `qscbgcdmivbbnzrcyegn` is STRICTLY OUT OF SCOPE.
- Existing Management API PAT in a prior Cursor Cloud operator run returned HTTP 401; scoped PAT UI only displayed the parent project, and **no broad production-capable PAT was delegated**.
- Original nonrelated DEV-PREP-1 platform-blocked Official Truth SELECT from #917 remains STOP; do not replay/rephrase/reroute that operation under this task.

Read [#960 R64](https://github.com/Jetnity/jetnity/issues/960#issuecomment-6238648741), [#751 latest](https://github.com/Jetnity/jetnity/issues/751), `JETNITY_START_HERE.md`, `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`, `docs/ACTIVE_WORK_STATUS.md`, and current machine mode `.jetnity/operating-mode.json` before touching source. **LIVE EVIDENCE WINS**.

## 1. Objective

Prepare a **small, audited, opt-in, fail-closed local psql transport implementation/design** for the *already existing* Jetnity two-stage airport/Places import normalization, without modifying Production behavior or performing any hosted operation now. Preserve canonical parsing/filtering, stable IDs, upsert semantics and the two-stage dependency. A new source-of-truth places importer or a third-party provider is **not** allowed.

At this stage, produce a code-only adapter, meaningful **offline/mocked regression/security tests** and concise evidence to let the independent Technical Lead decide in a later R66 review whether direct Development writes can be separately authorized. If the safest architecture requires an invasive refactor, STOP with a precise minimal design and risks rather than broadening scope.

## 2. Strict trust boundaries

- **ABSOLUTE: ZERO direct remote SQL, SQL SELECT, hosted connection probe, management API call, data import, data mutation, credential check, schema read, login, Supabase Dashboard/Browser access in this coding slice**. Only source/code/offline tests. Do not use `psql` against Supabase even with read-only flags.
- **DO NOT read, grep, list, echo, capture, infer, request, paste, access or log owner credentials**, `.env*` contents, keychain, `~/.pgpass`, `PGPASSWORD`, `PGPASSFILE`, management tokens, database URLs, browser/Agent secrets, raw auth sessions, local certificate *private keys*, or owner personal user data. The public CA certificate is not a secret, but do not copy it into Git or logs.
- Owner passwords stay **exclusively owner-entered in a private, masked interactive TTY** during any *future separately approved* run; no password in args, env, script, file, process output, terminal history, subprocess captures, diagnostic archives, PR or code. Design must make insecure fallback impossible.
- **One literal allowlisted target:** `db.yfvbxvijcorffwxbxahl.supabase.co:5432`, database `postgres`, only nondefault Development branch. Reject production `db.qscbgcdmivbbnzrcyegn.supabase.co`, any parent project host, unknown/env/URI override, non-literal port or dynamic host, `PG*` overrides and SSL downgrades.
- Require `sslmode=verify-full`, owner-provided official CA *path*, psql process under local owner control and certificate hostname validation before any future write. Fail CLOSED if CA missing, hostname mismatch, noninteractive/no confirmed private TTY, target ambiguity or unexpected environment. No `sslmode=require`, no `sslrootcert=system` fallback, no `-k`/insecure bypass.
- **No `--bereinigen`**, delete/truncate/drop, migration/DDL/grant/RLS/Auth/role modification, role escalation, service_role, SQL editor, Production query/data or third-party travel providers/payments.
- No changes to `scripts/db/sql.mjs` (original Management API guard), `scripts/auth/ziel.ts`, `lib/rollout/schreibauftrag.ts`, app/runtime/Account/Trip/Official Truth/Production/CI security guard/lockfile. No unapproved dependency or npm-script lifecycle addition. If extending the two original import entrypoints is absolutely necessary, do so **only with an opt-in explicit Development path** whose default and Production behavior remain byte-for-byte behaviorally identical; test and explain the exact diff. Prefer new task-owned files in `scripts/dev-reference-local-pg-prep-1/**` and `docs/JETNITY_DEV_REFERENCE_LOCAL_PG_WRITER_PREP_1_{REPORT,HANDOFF,SELF_REVIEW}_2026-10-17.md`.
- No changes or commits in original owner clone, main, #955 branch/PR or unrelated Drafts. This task branch is the **only** code writer. No auto retry, automatic follow-up or secret collection.

## 3. Acceptance criteria — CODING STAGE ONLY

1. **Read-only inspection of original code** and smallest reviewed extension path. Reuse existing `lib/airports/importieren`, `lib/places/importieren`, `scripts/airports/importieren.ts`, `scripts/places/importieren.ts` contracts rather than reimplement canonical source semantics. If impossible within tight scope, document exact blocker instead of creating an unsanctioned parallel loader.
2. Clear separation **offline prepare/test vs owner-authorized future write**. Default invocation (including `npm run airports:importieren` and `npm run places:importieren`) must remain no-DB dry-run; adding a new path must NOT silently make `--schreiben --entwicklung` use direct SQL. The original guarded Management API path is not removed or bypassed.
3. Offline fake/spy `psql` executable or comparable deterministic adapter tests verify that *no actual database or external network is contacted* and the exact-target/TLS/TTY/password/no-override checks fail CLOSED. Test at least: wrong/prod host, missing CA, wrong SSL mode, noninteractive environment, PGHOST/PGSERVICE/PGPASSWORD/PGPASSFILE overrides, wrong/extra flags, missing user preflight, bad batch output, partial write failure and attempted automatic retry. Test source-side importer required IATA, country/city and airport-derived ZRH expectations via synthetic fixtures. **No real password** in tests.
4. Proposed first-write preflight for LATER execution includes actual exact-target current snapshot: both affected `public` tables, expected schema and counts, branch identity and resource/backup readiness; Airport first, verify ZRH/GVA and inserted rows, **then** Places with Japan country, Zürich city and airport ZRH, and normal first-party `anon` Places suggestions. Real writes are batch/non-atomic; record partial stage and STOP on failures, do not automatically rerun or rollback. Guard against parallel or duplicate writer, excessive statements, and unexpected preexisting rows. Preserve semantic differences from original upserts explicitly.
5. Keep all tests synthetic/local: targeted tests + any relevant safe existing tests + typecheck/lint where appropriate. If dependencies missing or safe test impossible, state NOT VERIFIED and STOP. No live DB check during this stage, even read-only.
6. Output report with: exact main/branch/head/tree/source changed paths, model/session, approved scope vs non-scope, exact offline test commands/result counts, key threat model, potential password-in-TTY and PG* pitfalls, no new secrets/files/deploys/Production/SQL, migration compatibility, and a **recommended minimal future operating procedure** subject to INDEPENDENT TL REVIEW and renewed narrow write approval. Do not call source-only tests an actual hosted import PASS.

## 4. Deliverable and STOP

- Add only the scoped source/test/report/handoff/self-review to the **existing Draft PR** on `feat/dev-reference-local-pg-writer-prep-1`; **IMMUTABLE this TASK**, do not modify it. One original logical sole writer `Jetnity Local Development Reference Import Transport Prep 1 — Cursor Generation 1`, same session for R-review corrections.
- No Ready, no Merge, no new branch/PR/Issue, no import or execution against Development or Production, no migrations or account changes, no more Owner approvals solicited by Cursor. For this implementation task even a PR merge is NOT permission for a database write.
- Publish sanitized technical evidence in that Draft PR and **STOP FOR INDEPENDENT TECHNICAL LEAD R66**. If blocked by safety/tech/timebox, publish NOT VERIFIED with precise reason and STOP. **Do not start a follow-up slice.**
