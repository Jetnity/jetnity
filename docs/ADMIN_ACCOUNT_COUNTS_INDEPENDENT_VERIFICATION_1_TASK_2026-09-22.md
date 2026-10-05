# Admin Account Counts Independent Verification 1 — Binding Task v1

Date: 2026-09-22
Status: TL AUTHORIZED TARGETED REVIEW / EVIDENCE ONLY / NOT A TL PASS
Cursor-Agent: **Jetnity admin account counts independent verification 1**
Generation: **1 — new independent session**
Required model: **Cursor Grok 4.6 High Fast / cursor-grok-4.6-high-fast**, no Auto/substitution.
Evidence branch: `audit/admin-account-counts-independent-verification-1`
Evidence-branch baseline: main `e28ab43b53faf38aef163ccea82c45aedf3a7d06`, mode NORMAL.
Exact PRODUCT REVIEW TARGET: **PR #550 @ b5bbe211bc82c16da34bc8f48b58f39920af5f5a**.
Product branch: `feat/admin-account-counts-local-proof-1`.
Session: obtain actual new footer/run-info; never reuse the builder or continuity session.

## Authority and purpose

Product Owner approved the additional-agent recommendation in #512 comment 5782408305: targeted independent verification after the corrected #550 freeze. That prerequisite now has repository evidence: corrected STATUS at b5bbe211 and builder freeze comment **5782471633**, plus updated same-session comment 5782313255. This is a review dispatch, NOT acceptance of the correction.

Act as an independent Cursor SQL/security reviewer. Execute the exact frozen candidate in a disposable local PostgreSQL environment and try to falsify its authorization, lifecycle, window and isolation claims. Do not just summarize builder 56/56 or 10/10 receipts. This is **Cursor specialist evidence**, not Guardian evidence and not Technical-Lead PASS. ChatGPT/TL alone consolidates findings, sends fixes to the original builder, marks Ready or merges.

## Read and reconstruct

Read startup/AGENTS, TL/Cursor operating standard, multi-agent operating system and slice planning standard, current handoff and latest #512 comments. Read #550 binding task, all 12 changed files, original TL CHANGES REQUIRED review **5282427169**, and correction delivery **5782471633**.

At commissioning #550 is Draft/open/unmerged, target b5bbe211, same builder **Jetnity admin account counts local proof 1**, Generation 1, session **bc-49dd67e9-5979-44af-9476-1df8bcdfff93**. Existing #551 docs writer **Jetnity V1 continuity refresh 3**, Generation 1, session **bc-e268a98c-10c1-428f-94ae-99f3246f460a** owns central current-work documents. Do not reuse or interfere with either session.

Fetch exact target objects and use a detached, temporary local worktree/copy for inspection/execution. **Do not merge/cherry-pick the unmerged product branch into your evidence branch.** The evidence PR must contain only your permitted docs/evidence. Re-read #550 head at start and finish. If it changes, label target evidence stale, report the new SHA and STOP for TL retargeting; do not chase changing heads or implement fixes.

## Exclusive write ownership

Only NEW:
- `docs/ADMIN_ACCOUNT_COUNTS_INDEPENDENT_VERIFICATION_1_REPORT_2026-09-22.md`
- `docs/ADMIN_ACCOUNT_COUNTS_INDEPENDENT_VERIFICATION_1_HANDOFF_2026-09-22.md`
- `docs/ADMIN_ACCOUNT_COUNTS_INDEPENDENT_VERIFICATION_1_SELF_REVIEW_2026-09-22.md`
- `docs/evidence/admin-account-counts-independent-verification-1/*` (small text/JSON receipts and minimal self-contained reviewer repros; no secrets, binaries, large dumps or copied whole codebase).

This task is TL-owned, unchanged. All #550 candidate/bootstrap/runner/tests/docs are READ ONLY. All central docs, app/components/lib/types/scripts/supabase/package/lock/CI/governance/operating-mode files are READ ONLY. No alternate implementation, package/CI change, migration, RPC or UI. Local scratch probes may use temporary test objects but must not alter the original reviewed source; distinguish a probe from an exact-source run.

## Safe execution boundary

Before executing ANY supplied script, inspect process invocation, file/network access and cleanup for safe containment. Use an isolated VM/run-owned cluster and private socket, with inherited credentials/connection defaults removed, psql startup files disabled, bounded commands and no access to unrelated local clusters. Never import remote-default database helpers. Reject all remote DSNs. No hosted Supabase (Production/Development/Preview), no remote metadata query, no real account data, no real provider or model calls.

Run real local PostgreSQL, preferably matching live major 17 when already available; 16 is acceptable with the limitation explicitly stated. Local engine installation may use ordinary approved package sources without cloud provisioning or new service cost; no repository dependency edits. If safe real SQL execution is unavailable, report BLOCKED with exact prerequisites; never substitute mocks/static scans for SQL PASS. Do not enable a disabled system cluster. On an unsafe runner finding, do not execute the unsafe path against anything real: use only a controlled harmless local repro and report.

## Verification targets

1. **R1 startup isolation:** inspect EVERY psql invocation, including test/control helpers. Execute controlled PSQLRC and home-startup sentinel cases on run-owned private sockets; prove negative controls actually run the harmless sentinel and normal invocations suppress it. No real remote target. Check all inherited connection overrides, explicit socket/database/user/port handling, password prompts, subprocess environment and logged output.
2. **R2 fixed window:** verify actual candidate has one database clock, fixed 720-hour half-open window and no caller-supplied probing filter. Deterministic spring/fall DST tests, UTC/non-UTC sessions, exact lower/upper edges, NULL and future timestamps. Verify the proof-only clock seam preserves candidate logic rather than testing an unrelated reimplementation. Use an independent duration/count oracle.
3. **R3 cluster lifecycle:** verify resources are tracked before fallible init/start, private permissions, bounded init/start/SQL/stop, and no removal before confirmed process termination. Exercise normal cleanup and meaningful init/start/SQL/stop failure cases. Distinguish simulated failures from real subprocess evidence. Check status/PID/path assumptions and report any residual; never kill/drop unrelated processes/databases.
4. **R4 faithful privileges/RLS:** using only the dated TL metadata below, confirm local auth.users has RLS on, FORCE off, distinct auth owner and no policies, and trusted postgres is NOSUPERUSER+BYPASSRLS with pre-existing SELECT represented as fixture setup. Prove ordinary SELECT grants on a non-owner do not bypass this RLS, then verify the selected existing trusted owner through the actual narrow SECURITY DEFINER candidate. No new client SELECT, client postgres membership, managed-auth policy change, disabled RLS or new privileged role in candidate SQL. Explicitly discuss trusted owner's broader authority.
5. **Adversarial caller/output contract:** approved role levels+AAL2; ordinary user/creator; missing/wrong AAL; missing/absent/deleted/anonymous subject including privileged leftover/anonymous profile; no-profile caller; editable metadata and break-glass claims; direct table reads; anon/service-role execution and schema access; fixed search_path and ACL/default PUBLIC leaks; output has only specified counts/timestamps/version, never identities. Target no-profile/unconfirmed/internal/banned rows, hard/soft deletion, original creation semantics after anonymous conversion. Authorization failure must not become success-zero. Authorized present count minimum is 1; an empty window may be genuine 0.
6. Verify target file hashes, complete diff/allowlist, source vs receipt agreement, actual test assertions (not inflated counts), head/main/merge-base/ahead/behind and available exact-head CI/Auth/Vercel. Integration greens do not prove SQL. Do not require a browser UI proof for a local-only slice.

Add useful independent cases beyond rerunning the builder's suite; negative controls must demonstrate the assertion can fail. Do not invent new product requirements or weaken the existing accepted guard semantics. Report related out-of-scope risks separately, without editing them.

## Dated external evidence — not fresh reviewer access

TL review 5282427169 independently read Production METADATA ONLY on 22 September: PostgreSQL17.6, UTC; auth.users RLS=true, FORCE=false, owner=supabase_auth_admin, no policies; profiles RLS=true, owner=postgres; postgres NOSUPERUSER+BYPASSRLS with auth.users SELECT; no authenticated/anon SELECT; no authenticated/anon/service_role jetnity_internal USAGE. Reporting schema/function/new-owner role absent. Known auth timestamp columns nullable; is_anonymous NOT NULL. Five existing helper bodies were checked. Do not query Production to refresh this; fixture compatibility remains bounded by that dated metadata.

Correction delivery reports candidate sha256 `dcf4d35d894975b3c36860454ca8b0714af11c243fdcef900159a9929ccd4420`, bootstrap `0413821d7c75c76908dd437527d623fcbed59c524135adbf5e5974730e6f6ea2`, 56 mixed-category checks plus 10 Node tests; CI35772116946, jobs106896127697/106896128209, Preview6da5vghJfNPMqw3k3BSF65jnL8xg. Reproduce/re-read before using as your evidence. None is a TL PASS.

Primary PostgreSQL references for semantics, not substitute execution:
- https://www.postgresql.org/docs/17/app-psql.html
- https://www.postgresql.org/docs/17/ddl-rowsecurity.html
- https://www.postgresql.org/docs/17/functions-datetime.html

## Findings and handoff contract

Report reviewed product SHA separately from your evidence-branch SHA. Each finding: ID, P0/P1/P2/P3, affected path/lines, expected/actual, minimal reproducible evidence, FACT/INFERENCE/RISK, exact source version, and remediation direction (do not implement). Give a bounded specialist verdict, tested/not-tested systems, actual commands/exit codes/engine version/hashes, distinct SQL/catalog/static/Node/probe counts and failure logs without secrets. Test limitations remain explicit. No all-clear based solely on self-review or green CI.

Post one concise result pointer in #550 WITHOUT @cursor (avoid waking builder); full report/handoff lives on your own branch/PR. Technical Lead consolidates one fix package if required. Freeze once; report asynchronous integration checks in comments, not repeated evidence-only commits.

## Multi-Agent Suitability and integration

Decision MULTI_AGENT across three disjoint lanes: #550 sole product writer; #551 sole central-doc writer; this independent reviewer owns only its named evidence. No reviewer write authority on product. #550 retains product integration priority and stays unmerged pending TL independent review and relevant evidence. Reviewer evidence must be usable before #550 merge without importing unaccepted product code. Central docs integrate separately after fresh drift checks. No sibling merges/rebase/force or automatic main sync; report drift.

All Production migration/owner/privilege exposure, provider/terms/secrets/paid calls, real payments, sensitive-data expansion, launch/indexing/domain, automation and new recurring-cost gates remain reserved. No remote DB, no plan upgrade/spend-limit increase, no model substitution. Preserve provider-later, three-phase/Flight-first order and disabled TL automation.

**Do not mark Ready. Do not merge. Do not start another agent or follow-up slice. STOP FOR INDEPENDENT TECHNICAL-LEAD CONSOLIDATION/REVIEW.**
