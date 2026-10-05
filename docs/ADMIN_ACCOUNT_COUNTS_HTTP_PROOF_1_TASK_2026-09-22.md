# Admin Account Counts HTTP Proof 1 — Binding Task v1

Date: 2026-09-22
Status: TL AUTHORIZED INDEPENDENT LOCAL VERIFICATION / NOT PRODUCT PASS / NOT READY
Agent: **Jetnity admin account counts HTTP proof 1**
Generation: **1 — NEW dedicated reviewer session**
Required model: **Cursor Grok 4.6 High Fast / cursor-grok-4.6-high-fast**, no Auto/substitution.
Branch: `audit/admin-account-counts-http-proof-1`
Verified branch baseline: `main@ff054f76c14cf1c434890ba342af4df5e536dd05`; mode NORMAL.
Actual session/footer/model must be established from acknowledgement and run-info. Do not invent an external UI rename.

## 1. Why this is useful now

The Product Owner asked whether additional agents can work while #553 finishes its residual R1 correction. TL checked current main, open PRs/issues, remaining-build-map, operating/slice-planning standards, #553 ownership and latest #512 checkpoint5784588945. A second implementation writer in #553 would collide. An independent executable proof of the stable SQL-to-HTTP boundary does not.

#550/#552/#551 are closed. #553 is **CHANGES REQUIRED**, not accepted as a whole: review5284045489 accepted bounded R2/R3/R4 corrections on dcf7bfee, but R1 effective shared-client target binding remains with the existing implementer under Addendum v3 at86f5d4847fe3c8779d137ba110b04207c9468577. Do not work on that correction, consume its changing loader, or imply it has passed.

The gap this task addresses is **real local PostgREST HTTP transport**, not another broad audit or repetition of #552's inner SQL review. Existing evidence comprises PostgreSQL16.15 mixed SQL/catalog/source checks and mocked/module application tests; authenticated PostgREST/browser E2E is explicitly absent. Test the unchanged guarded SQL producer + wrapper through actual HTTP using synthetic local identities, then pass actual JSON through the frozen parser. This is NOT Supabase GoTrue/login/browser/Production E2E.

## 2. Read and pin before running

Read AGENTS.md, JETNITY_START_HERE.md, the TL/Cursor operating standard, multi-agent operating system and slice-planning standard, current checkpoint and latest #512 conversation. Dated #551-only text is superseded by actual #553 dispatch/continuation. Preserve NORMAL, disabled TL automation, OS/Grok accepted limitations, Switzerland-first/Flight-first/provider-later and jetnity.com without cutover.

Read #553 v1/v2/v3 task files and reviews5283659145/5284045489 as context. This task is a separate independent evidence lane, not a product writer or Guardian.

Immutable examined snapshot: **dcf7bfee497ba3aa2038a43fe4bc2a09e541625f** in #553. Main lacks the wrapper/parser; export only the named sources using read-only git show/fetch into a run-owned temporary source directory. This is explicit TL permission for examining an unmerged snapshot, NOT permission to merge/cherry-pick/import sibling runtime into this branch.

Pin and verify:
- Accepted main producer `scripts/db/admin-account-counts-1-candidate.sql`, SHA256 `dcf4d35d894975b3c36860454ca8b0714af11c243fdcef900159a9929ccd4420`.
- Accepted bootstrap `scripts/db/admin-account-counts-1-bootstrap.sql`, SHA256 `0413821d7c75c76908dd437527d623fcbed59c524135adbf5e5974730e6f6ea2`.
- Unchanged snapshot wrapper `scripts/db/admin-account-counts-delivery-1-rpc.sql`, SHA256 `13fa3fe280d76d42ca6b2a1dff12077edc3d44a599a22300e89dd5578d63a6fb`.
- Snapshot parser `lib/admin/account-counts-delivery/parser.ts`, Git blob `6205ecbba621b048fff479856c5523fab5ec4f6d`.
- Snapshot contract `lib/admin/account-counts-delivery/contract.ts`, Git blob `6826eeea70aecc0507d05624daaeac47af0be9b8`.
- Read accepted isolation helpers in `scripts/db/admin-account-counts-1-local-proof.mjs` before reuse. These and all earlier proofs stay unchanged.

A source mismatch is BLOCKED, not permission to silently target a newer head. No tests of pending R1 activation/SSR/default-component code in this lane. TL later reconciles these source hashes to the final #553 head before accepting applicability.

## 3. Exclusive ownership

May add only:
- `scripts/db/admin-account-counts-http-proof-1.mjs` and optional same-prefix `.test.mjs` or `-fixture.sql` files, solely an isolated proof harness, not runtime code.
- `docs/evidence/admin-account-counts-http-proof-1/` for small sanitized text/JSON receipts, exact commands/versions/hashes and reproducibility notes.
- `docs/ADMIN_ACCOUNT_COUNTS_HTTP_PROOF_1_STATUS_2026-09-22.md`, `..._HANDOFF_2026-09-22.md`, `..._SELF_REVIEW_2026-09-22.md`.

This task is TL-owned, unchanged. All other paths are read-only. No edits to #553 files, shared server/auth/client/roles/AAL, checker/verwendung.mjs, accepted #550/#552 sources/evidence, central docs, app/components/lib/types, migrations/config, package/lock/CI, governance or provider files. Do not copy product snapshots into tracked runtime paths. Do not hide real application references from hygiene. Keep synthetic SQL/HTTP fixture code in the allowed proof paths; do not add a public app audit route.

## 4. Bounded capability preflight and isolation

First establish whether a real disposable PostgreSQL plus PostgREST process is possible in this session. Inspect installed binaries/container support and ordinary approved package sources. Prefer PostgreSQL17; PostgreSQL16 is acceptable with an explicit limitation, NOT Production17.6 equivalence. Pin/report exact PostgREST/PG versions and download provenance; local PostgREST version is NOT assumed to match hosted Supabase. Do not upgrade repository dependencies.

Ordinary free local binary/package setup inside the isolated agent environment is allowed. No cloud branch/project/container service provisioning, plan upgrade, account signup/Terms acceptance, paid service or infrastructure cost. If a dependency is unavailable after a bounded preflight and one supported setup route, STOP with exact blocker and a reproducible harness; do not repeatedly retry installs or substitute remote databases. A mocked response cannot be labelled HTTP proof.

Use only run-owned temporary directories, private permissions, a private PostgreSQL socket, explicitly chosen local DB identity, bounded subprocesses and bounded loopback HTTP requests. PostgREST must bind numeric loopback only, never 0.0.0.0 or a forwarded/public tunnel. Prefer native private processes; any existing container runtime may only create/remove explicitly run-labelled resources and must bind host ports to numeric loopback. Never stop/delete/reconfigure unrelated system clusters, containers, networks or volumes. Reuse reviewed lifecycle protections where possible: psql -X, sanitized connection variables, tracked resources before startup, verified stop before removing data.

Reject inherited remote database/Supabase/PostgREST connection defaults. Never import scripts/db/sql.mjs, use linked Supabase CLI, or read app .env files/connector credentials. Do not execute this against Production qscbgcdmivbbnzrcyegn, Development yfvbxvijcorffwxbxahl, Preview or any hosted project. All identities/account rows are synthetic. Locally generated per-run signing material is test-only, never a real service credential; do not persist keys, raw JWTs or credential-bearing connection strings in logs or Git.

## 5. Required executable proof

Use accepted bootstrap/producer and the exact wrapper unchanged in the disposable cluster. Any additional local authenticator/membership/test setup must be separately identified and least-privileged. Use PostgREST's real signature verification/role switching with synthetic local JWTs; merely SET ROLE in psql does not establish HTTP authentication evidence. Expose only public, not auth, jetnity_reporting or jetnity_internal. Do not disable auth.users RLS, change producer grants, give client roles auth.users SELECT, or introduce a second privileged wrapper to make a test pass.

Required evidence, with actual commands/status/body assertions and no raw JWTs:
1. A role-backed moderator-or-higher AAL2 synthetic caller receives one five-field aggregate row through the real zero-argument HTTP wrapper. Prove present>=1 and genuine window0 where fixtures warrant it, canonical decimal TEXT counts, original database timestamps and exact720hour interval. Pass the real response to the frozen parser. Show deterministic expected fixture counts, not just self-comparison between two calls. Separate HTTP requests have different clocks; never assert their measured_at values must be identical.
2. Positive roles and negative paths: ordinary user/creator; AAL1/missing AAL; missing/deleted/anonymous subject including privileged profile; anon and synthetic service_role; invalid/expired/tampered local token. No unauthorized counts or individual account rows may be disclosed. Record actual SQLSTATE/PostgREST/HTTP classes rather than force all failures into the same status.
3. Private schema/function and direct auth.users access remain unavailable over the exposed HTTP interface; caller metadata alone cannot confer a privileged profile role. Verify no new grants/owner/RLS change to accepted objects after wrapper setup. Distinguish local setup grants to the PostgREST authenticator from application-role privileges.
4. Use the application's ordinary POST zero-argument shape. Also cover supported read-only GET and extra arguments, including failure/empty/projection shapes that the parser must reject rather than present as a successful zero. Follow the chosen PostgREST version's real API semantics; not every filtered request must execute a function, but no denied caller may obtain counts.
5. Missing wrapper/schema-cache state is unavailable, not zero; reload/restart only the local schema cache as needed. Dropping the wrapper alone leaves the accepted producer intact. Record before/after schema-cache/ACL evidence and clean shutdown.
6. Large-number serialization need not fabricate trillions of account rows. A separately labelled disposable transport fixture may prove bigint-to-TEXT serialization of9007199254740993 and9223372036854775807 through HTTP; it is NOT the real aggregate result and must never replace the guarded producer or enter runtime. Keep its proof separate from actual wrapper/caller assertions.

Run the real HTTP proof at least once end-to-end if the preflight succeeds, plus local harness-safety tests. A PG17 run improves engine evidence but does not establish hosted Supabase parity. No full browser/UI/default-loader PASS, no login/MFA lifecycle PASS, no whole-system security PASS, no Guardian evidence and no live-count/Production readiness claim.

## 6. Reporting and integration

Deliver an executable small harness, source manifest, engine/process versions, setup provenance, exact commands/exit codes, sanitized outcomes and cleanup evidence. Distinguish HTTP/signature/role execution, SQL/catalog, pure parser, static checks, synthetic large-value transport and not-run tests. Each finding includes exact source/steps, severity and whether actual behaviour or environment limitation. Do not fix product findings; report them to TL so the existing #553 writer remains the only correction owner.

Run applicable repository hygiene/CI without changing its rules. Freeze once; report later CI/Auth/Preview in PR comments, not status-only commit loops. Preview for this evidence PR is integration evidence only. Existing #553 pending R1 and its special gates remain unchanged.

**Multi-Agent Suitability: MULTI_AGENT across disjoint lanes; SINGLE_AGENT within each.** #553 keeps sole ownership of delivery and v3 shared-source fix. This reviewer owns only the new proof/evidence files and examines immutable SQL/transport sources. No work is waiting on the changing activation module. No other additional agent is authorized by this task.

Serial integration: #553 has main integration priority. This proof may run before its final freeze, but no sibling main merge during #553 exact-head gating. TL assesses findings and the final source-hash match; later integrate evidence against an explicitly authorized accepted main. No merge/rebase/force/cherry-pick/reset/main sync by this reviewer without an exact TL instruction. Missing tooling is not permission to reopen accepted work or silently make this optional local proof a new V1 scope gate.

P0: no incident established. P1 prevention: accidental remote contact, credential leakage, role/grant widening. P2: transport/auth/schema-cache/source-binding correctness. P3: engine/version/GoTrue/browser applicability limits. Main and hosted services remain untouched.

Existing Cursor usage is the only commissioned model consumption; account balance/concurrency quota is not known. No free/unlimited claim, new infrastructure, budget increase, provider/model API, payments, tracking, domain/launch, legal/identity/retention change or live activation.

Primary technical references: https://docs.postgrest.org/en/stable/references/api/functions.html and https://docs.postgrest.org/en/stable/references/auth.html . Consult the actual installed version's official documentation. Supabase changelog HTML was consulted after Markdown retrieval was unsupported; no hosted upgrade is authorized.

**Do not mark Ready. Do not merge. Do not start another agent or follow-up slice. STOP FOR INDEPENDENT TECHNICAL-LEAD REVIEW.**
