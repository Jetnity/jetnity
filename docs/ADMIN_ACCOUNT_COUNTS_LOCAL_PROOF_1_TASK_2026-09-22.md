# Admin Account Counts Local Proof 1 — Binding Task v1
Date: 2026-09-22
Status: TL AUTHORIZED LOCAL IMPLEMENTATION / NO PRODUCTION APPLY / NOT READY
Cursor-Agent: **Jetnity admin account counts local proof 1**
Generation: **1 — new dedicated session**
Required model: **Grok 4.6 High Fast / cursor-grok-4.6-high-fast**. No Auto/substitution.
Branch: `feat/admin-account-counts-local-proof-1`
Baseline: main **e71218b47c1299397deb2ae3f6a4c264dc695b2b**, mode NORMAL.
Session: establish from real Cursor acknowledgement/footer and actual run-info; never invent or claim UI rename.

## Purpose and authorization
The PO requested real Admin account/product/partner statistics. Inventory #549 has corrected source contracts and is awaiting final integration sync. TL accepted content at4d618d9a in5281789519, but rejected automatically implementing its placeholder/unavailable-metric overview. This task supplies the first missing actual aggregate producer and executable privilege proof. It does NOT re-audit the full Admin/Growth programme.
Deliver concrete SQL candidate + real disposable local PostgreSQL verification + concise promotion checklist. No remote database apply, exposed RPC/UI or production claim. A later independently reviewed activation can use this work; it is not a separate permanent statistics platform.

Read startup/AGENTS, operating standard, multi-agent standards, current handoff/checkpoint and later PR512 comments. Task authority is this file. #549 docs may be read at the accepted head as audit evidence, not imported as an unmerged runtime dependency. Parent requirement5780510581; latest TL checkpoint5781498417. Primary domain jetnity.com (PO5781400067); no domain work here.
Retain three-phase / Flight-first build order. This is a narrow user-requested Admin measure, not new V1 launch gating or Growth M0–M6 expansion.

## Verified baseline and parallel work
#548 merged as e71218b4 after TL PASS5281778725;70 focused TL tests; post-merge CI35764518842 jobs106870547652/106870547912 SUCCESS and Production dpl_RV1LUx7XMCQDN8S23tdNgHowGWwU READY exactmain. #545/#547 already merged; do not reactivate.
#549: branch audit/admin-audience-partner-reporting-1, agent Jetnity admin audience partner reporting preflight1 G1, session bc-ea4a0209-f139-4b47-8943-16ddf78e4270. Final sync dispatched5781456608, same-session ack5781458713. Owns its six docs only. #549 is next integration; report main drift, no sibling merges/rebase/force unless TL separately authorizes.
Historical open #52/#50/#40/#39/#28 are not new writers. #395 provider gate and reserved external/production actions remain closed.

TL independently read Production METADATA ONLY on2026-09-22:
- auth.users: id UUID NOT NULL; created_at timestamptz NULLABLE; deleted_at timestamptz NULLABLE; confirmed_at timestamptz NULLABLE; is_anonymous boolean NOT NULL.
- DB TimeZone UTC.
- public.darf_konten_verwalten() and darf_betrieb_lesen(): hat_rolle_mindestens('moderator') AND aktuelles_admin_aal2(); SECURITY INVOKER, search_path pg_catalog.
- aktuelle_rolle(): SECURITY DEFINER, looks up profiles.role by auth.uid(); it does not itself establish active/nondeleted caller.
No personal rows/counts were read. This is not a full schema/privilege/live-caller PASS. No remote SQL is needed from this writer.

## Exclusive ownership
NEW only:
- scripts/db/admin-account-counts-1-candidate.sql
- scripts/db/admin-account-counts-1-bootstrap.sql
- scripts/db/admin-account-counts-1-local-proof.mjs
- optional scripts/db/admin-account-counts-1-local-proof.test.mjs for real runner safety cases
- docs/ADMIN_ACCOUNT_COUNTS_LOCAL_PROOF_1_STATUS_2026-09-22.md
- docs/ADMIN_ACCOUNT_COUNTS_LOCAL_PROOF_1_HANDOFF_2026-09-22.md
- docs/ADMIN_ACCOUNT_COUNTS_LOCAL_PROOF_1_SELF_REVIEW_2026-09-22.md
- docs/evidence/admin-account-counts-local-proof-1/* (small text/JSON receipts)
Task TL-owned, do not rewrite. Keep contract and promotion checklist in status/handoff; no extra audit document.
READ ONLY: existing scripts/harnesses, migrations, schema, types, auth/capability logic, app/components/lib, package/lock/CI, all global/current-work docs and other agents' files.
No supabase/migrations file, generated production types, app route, UI mounting or package-script edit in this local proof. Migration runners discover supabase/migrations/*.sql; candidate must remain outside them.

## Metric contract
Version `jetnity.admin-account-counts.v1`.
1. Present registered/non-anonymous auth accounts: rows in auth.users where deleted_at IS NULL AND is_anonymous IS FALSE.
2. Of that same present set, rows created in a fixed rolling30day half-open [window_start, measured_at) interval.
Return only two bigint counts, one database-measured timestamp, window bounds and fixed definition version. UTC interpretation; single consistent clock for the result. No caller-supplied user ID, filter, window, timestamp or grouping that permits probing.
created_at=NULL counts in present total but not created-in-window. Document incomplete timestamp coverage; never invent a date. Future timestamps do not count in prior30days.
No join to profiles for TARGET counting: valid accounts without profiles must count.
Test/internal accounts stay included without proven exclusion; unconfirmed, invited or banned accounts are not silently removed. This is a measure of present auth rows, not humans, active users, visitors, successful confirmations or all historical registrations.
Anonymous-to-permanent conversion keeps original row-creation semantics; do not claim registration conversion time. Hard delete removes the row; soft delete excluded. No backfill.
No counts from profiles, last_seen_at, account_visits, trips, payments or commercial snapshots. No clean partner-audience claim.
No SQL implementation of fixture/test/bot exclusions without a source; caveat rather than invented heuristics.

## Privilege contract and SQL implementation
Build a small candidate aggregate function in a NEW narrowly scoped non-exposed reporting schema. Do not grant authenticated/service_role usage on existing jetnity_internal or weaken its protections. This task does not expose a Data API RPC.
Reuse existing public.darf_konten_verwalten() / current AAL2 semantics; no new role hierarchy or helper edits. Explicit auth.uid() required; caller must exist and not be soft-deleted or anonymous. Do not authorize from editable user_metadata or break-glass/app-shell state.
If SECURITY DEFINER needed to aggregate protected auth.users, explain the narrow necessity. Fully qualify objects, fixed safe search_path, no dynamic SQL, revoke default PUBLIC/anon/service_role execution; only explicit minimal execute/usage for testing the intended authenticated capability-bound caller. No direct SELECT grants on auth.users to clients.
Authorization failure must be distinguishable from authorized count0 (defined exception or empty result); never return a success row of zero counts on deny. No row IDs/email/name/IP/trip fields in result or logs. No secret/service-role key or Auth-admin listing fallback.
The candidate is LOCAL/UNAPPLIED; future production owner, grants, RPC wrapper and deployment need explicit review and reserved PO approval. Do not solve this by mutating existing auth.users, profiles, capability helpers, RLS or internal commercial schemas.

## Disposable local proof
Reuse #494's pattern, read-only:
scripts/db/security-events-producer-contract-lokal.mjs and bootstrap/contract SQL,
scripts/db/besuche-rls-lokal.mjs,
actual current role/capability/AAL SQL including20260827170000_admin_aal2_data_plane_alignment.sql.
#494 bootstrap auth.users has only id: it cannot prove this contract unchanged. Use an own minimal fixture schema matching verified field types/nullability, and actual existing authorization definitions where feasible. Clearly distinguish extracted source from fixture substitutes. Never replace the guard with allow=true and claim auth proof.
Use REAL local PostgreSQL. No hosted/Development/Preview/Production Supabase, no remote DSN, no network or cloud provisioning, no real accounts.
Runner must force an isolated disposable database/cluster/socket owned by this run. Sanitize/reject inherited PGHOST/PGPORT/PGSERVICE/PGDATABASE and other connection/environment overrides; do not connect to or drop an arbitrary existing DB. Never use scripts/db/sql.mjs remote defaults. Cleanup only resources created by this run, including failure paths. No printing credential values.
If local binaries absent, install/use an appropriate local engine only if possible without external service cost; otherwise report BLOCKED with concrete missing prerequisites. Do not substitute an in-memory mock or test-source regex for real SQL permission execution.
Run via node scripts/db/admin-account-counts-1-local-proof.mjs; no package edit needed.

Meaningful assertions:
- approved role levels with AAL2 return exact expected fixture aggregates;
- AAL1/missing/wrong AAL, ordinary account, absent profile, absent/deleted/anonymous caller, anon, service-role shortcut, break-glass and user_metadata role claims cannot retrieve aggregates;
- direct auth.users SELECT remains forbidden to authenticated/anon;
- target account without profile included; anonymous/soft-deleted excluded; hard deletion changes current count;
- unconfirmed/internal/test fixture included and honestly described;
- null timestamp, both half-open edges, future timestamp, UTC and non-UTC session timezones;
- authorized empty target set can return genuine0 without weakening caller validation (design a testable correct case or explain the minimum caller-count constraint);
- actual output shape and ACL/search_path catalogs, no default public execute leak;
- runner rejects remote/connection overrides, cleanup and no unrelated local DB touch.
Keep distinct executed SQL assertions vs static checks; do not inflate counts. Record exact candidate source hashes, PostgreSQL version, commands, summaries and limits.

## Promotion checklist
Prepare a concise next-step plan for review, not another generic audit:
- exact candidate function/permissions and rollback scope;
- future smallest production migration + public RPC exposure plan preserving internal-schema protections;
- minimal Admin display of the two measures with unavailable/error/forbidden/zero truth;
- required fresh metadata drift check before apply;
- Product-Owner approval for Production migration/privilege exposure is still outstanding.
No production-ready/live-statistics claim solely from fixture tests.

## Multi-Agent Suitability
Decision SINGLE_AGENT inside this tightly coupled SQL/guard/proof scope; MULTI_AGENT across disjoint streams (#549 docs final sync).
One writer owns candidate and proof. A second writer for same SQL risks split security contracts. TL may independently review read-only. No shared writes. #549 integrates first; this new PR is independently reviewable and must report drift rather than merge siblings.

## Verification, risks and STOP
Run real disposable proof + meaningful runner guard tests if implemented, relevant existing auth tests and required typecheck/lint/build/repository hygiene, exacthead CI/Auth/Vercel. Vercel is integration only, not DB proof. No browser proof necessary without UI.
P0: no current incident claimed. P1 prevention: unauthorized global account disclosure, PUBLIC grants, remote-DB fallback, logging personal data. P2: lifecycle/window semantics, fixture-vs-production mismatch and future permission exposure. P3: stale evidence pins.
No production migration, remote apply, provider calls/terms/secrets, tracking SDK, paid calls, domain cutover/indexing, money movement or new recurring costs.
Freeze once with exactSHA, merge-base/ahead/behind, model/run-info/footer, independent evidence limits and P0–P3 findings. Report asynchronous checks in PR comments rather than another evidence-only commit.
**Do not mark Ready. Do not merge. Do not start a follow-up slice. STOP FOR INDEPENDENT TECHNICAL-LEAD REVIEW.** Production activation remains a later explicit gate after concrete review.
