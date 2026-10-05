# Admin Account Counts Browser Acceptance 1 — Binding Task v1

Date: 2026-09-23
Status: TL AUTHORIZED INDEPENDENT LOCAL APPLICATION PROOF / NOT PRODUCTION APPROVAL
Agent: **Jetnity admin account counts browser acceptance 1**
Generation: **1 — NEW dedicated session**
Required model: **Cursor Grok 4.6 High Fast / cursor-grok-4.6-high-fast**. No Auto/substitution.
Branch: `audit/admin-account-counts-browser-acceptance-1`
Exact product baseline: **f0237baf8809e5528b5f73e918f0e37a7d9b4477**, NORMAL.
Record the real new session/footer/model. Do not claim UI rename without capability/evidence.

## 1. Why this independent lane exists

PO requested continuation and multiple agents where possible. TL selected rollout preparation in #512 comment5787415489 following closed #550/#552/#551/#553/#554. Those agents stay completed.

The missing outcome here is the real LOCAL application path: browser login, actual Auth-issued session, actual TOTP challenge/verification to AAL2, request cookies, unchanged shared server client/guard/reader, local PostgREST producer and rendered Admin counts. #554's isolated signed-token HTTP proof does not establish that path. Do not repeat it and label it browser E2E.

Parallel **#555**, agent `Jetnity admin account counts rollout preparation 1`, G1, branch `feat/admin-account-counts-rollout-preparation-1`, owns candidate install/rollback rehearsal plus future environment design and PO packet. You do not consume that changing work. You independently examine existing accepted main, so neither lane waits for the other to begin.

## 2. Read and pin

Read AGENTS.md, JETNITY_START_HERE.md, TL/Cursor standard, multi-agent operating system and slice-planning standard, current checkpoint/latest #512, closure5786315762, accepted #553/#554 source/tests and their limitations. Historical startup prose is not current writer status.

Product source pin is the full exact baseline above, including:
- producer `scripts/db/admin-account-counts-1-candidate.sql`, SHA256 **dcf4d35d894975b3c36860454ca8b0714af11c243fdcef900159a9929ccd4420**;
- wrapper `scripts/db/admin-account-counts-delivery-1-rpc.sql`, SHA256 **13fa3fe280d76d42ca6b2a1dff12077edc3d44a599a22300e89dd5578d63a6fb**;
- contract blob **6826eeea70aecc0507d05624daaeac47af0be9b8**, parser blob **6205ecbba621b048fff479856c5523fab5ec4f6d**;
- activation blob **10f1bf99ac3d71eca6b1c69f04325947d0786c20**; reader blob **02dcafd80502067935eee78f3d8a7b21e417d720**;
- `lib/supabase/server.ts`, actual login/MFA/step-up routes, `lib/auth/admin-guard.ts`, admin-access/AAL/roles, actual Admin page/component, necessary public-schema migrations and `supabase/config.toml` at this exact main.

Record all runtime/auth/config/SQL sources actually used, exact hashes and any test-only environment/config differences. No silent target change. Full stack here must use its real managed Auth schema: **do not run the lightweight #550 bootstrap over GoTrue auth.users**. That bootstrap is a reduced synthetic SQL fixture, not a full Supabase initialization script. Reuse only identified source-faithful public dependencies where appropriate; missing replayable schema is a concrete blocker, not permission to fabricate auth contracts.

## 3. Exclusive write ownership

May ADD only:
- `scripts/e2e/admin-account-counts-browser-acceptance-1/` for a bounded executable runner/spec, safe local fixture provisioning, test-only stack configuration/source manifest and tests. Keep it small; no general test platform.
- `docs/ADMIN_ACCOUNT_COUNTS_BROWSER_ACCEPTANCE_1_{REPORT,STATUS,HANDOFF,SELF_REVIEW}_2026-09-23.md`.
- `docs/evidence/admin-account-counts-browser-acceptance-1/` for small sanitized text/JSON receipts and strictly necessary screenshots of final non-secret UI.

TASK is TL-owned and immutable. Every existing product/Auth/shared client/SQL/proof/migration/config/package/lock/checker/CI/central-document path is READ ONLY. Do not patch application code even in the executed copy and then call it the accepted build. Do not create app API routes or substitute guard/loader/components. No sibling files/imports/cherry-picks.

A real product defect returns to TL with exact repro/severity; you are not a second product writer. Do not broaden into a full Auth redesign or whole-journey audit.

## 4. Bounded capability preflight — before application testing

Inspect available browser (prefer agent-browser; otherwise existing Playwright), Node/package tooling, local Docker-compatible runtime and Supabase CLI/official local services. First verify help/version and the official local-development/TOTP documentation. Do not assume historical Compose/Kong defaults or unpinned image compatibility. Supabase changelog HTML has relevant self-hosted gateway changes; document the exact selected supported version/configuration.

Use one supported ordinary free setup route with a bounded preflight; no repeated alternative provisioning loops. No remote Docker context/socket, new cloud/hosted Supabase branch/project, paid runner, account signup/Terms, privileged container/daemon setup, disabling host security or new infrastructure. If the local full stack cannot run, deliver **BLOCKED** with exact missing prerequisite, commands/errors, a source-bound reproducible harness/runbook, and a clear NOT RUN matrix; never substitute fake responses, forged AAL2, Production or hosted Development. Report capability outcome promptly in PR conversation, not a new unrelated agent.

You may install ordinary free local tooling in the isolated agent environment without repository dependency changes. Pin versions/provenance. Use only a new run-labelled private local project/network/containers/volumes/processes; never reuse/reset/stop/prune existing resources. Bind all exposed services, local mail sink and Next.js server to numeric loopback. Reject remote/default connection variables before any DB command, prove resource ownership/target and prevent application outbound provider/model/SMTP/telemetry traffic. Local browser/service communication within the owned stack is allowed. Do not tunnel/forward it publicly.

No app .env or connected credentials may be read/copied. Use per-run synthetic secrets and test accounts only. Service/admin credentials may be used solely by fixture provisioning for this owned local stack, never by the application reader. Keep keys/cookies/passwords/TOTP secrets/raw JWT/QR/otpauth strings and auth state out of Git, logs, screenshots, traces and final evidence. Use 0600 private state, redact before recording and remove after confirmed stop. No real email delivery; use the owned local mail sink or explicitly labelled local test-user confirmation through the local Auth admin API.

The local application may receive an explicit clean LOCAL child environment, existing flag `JETNITY_ADMIN_ACCOUNT_COUNTS_LOCAL_ENABLED=true`, matching loopback Supabase URL and synthetic key. Do not delete hosted markers from a genuinely hosted deployment or modify the activation function to force a PASS. Record the local process environment boundary (not its secret values).

## 5. Required acceptance path when preflight succeeds

1. Provision a small deterministic fixture set through real local Auth, add source-faithful profile roles in the owned local DB, install accepted unchanged producer/wrapper locally only and identify expected counts from the fixture manifest. Never forge user JWT/AAL or write fake MFA success. Account fixtures are not the old HTTP proof's 10/0 by assumption.
2. Start the actual source-pinned application locally and immediately verify page load, console/network errors and main UI with browser automation. The actual login UI, request cookies and server path must be used. Record only sanitized status/UI outcomes, not tokens.
3. Role-backed moderator-or-higher: successful password login, actual TOTP enrollment/challenge/verify as needed, AAL1 denied/step-up before AAL2, then Admin page renders both exact counts, definition/window and measurement time through the actual reader. Use real local Auth APIs via the UI, not a mocked Auth server or injected session cookie. Exercise an existing enrolled factor in a fresh browser session; no forced duplicate enrollment. No QR/secret screenshot may be persisted.
4. Default OFF: no new count section and no count RPC call. ON: correct source-backed positive, real recent-account delta and genuine zero-window scenario where warranted. Unknown/failure must not render invented zeros. Observe requests read-only without response substitution; a small local request-count observer must not alter client/response behavior.
5. Ordinary user/creator, unauthenticated, insufficient AAL, and profile role downgrade must not disclose counts. Check the direct local HTTP boundary with the same real Auth-issued session as well as page restrictions where needed. Include deleted/anonymous/no-subject only where achievable source-faithfully; report exact not-run reasons rather than enabling anonymous sign-in or forging identities.
6. Explicitly distinguish profile.status banned/disabled, Auth-level ban, stale token/session and role downgrade. Current shared role lookup selects role only and SQL's current checks are not blanket status guarantees. Test a synthetic restricted privileged account and record actual behavior; any missing enforcement is a **future rollout blocker**, not permission to silently change source/roles or mark global security PASS. Do not treat an expected potential blocker as harness failure to hide.
7. Missing wrapper local state: page must show honest unavailable/failure and not 0. Restore only the local owned object; confirm source fingerprint and normal state. Do not shut down arbitrary processes or remote DBs. Leave broad fault injection to existing accepted tests unless necessary for this UI path.
8. At least desktop and a mobile viewport for the new section: readable count labels, keyboard/step-up accessibility and no overflow. This is scoped browser evidence, not a whole-site/device or Production release certification.
9. Confirm bounded teardown for owned app/Auth/PostgREST/DB/browser/resources, with no removal while an owned process remains active. Reuse reviewed lifecycle patterns; no shell-wide pkill/prune. Prove failure/preflight cleanup with appropriate safe controls. Keep local SMTP, third-party calls and credentials absent from persisted output.

Treat the executed result as local stack/version-specific evidence. A local full-stack PASS is still not hosted Supabase/version parity, Production activation, real-user/partner metric proof or Guardian evidence. Distinguish environment failures, product findings, not-run gates and genuine successful assertions.

## 6. Environment/reference baseline supplied by TL

On 23 September TL re-read main f0237baf, successful CI35798706913 (jobs106983875471/106983875787), Vercel Production dpl_FHHisK2NMkvRc3sbhjXsJTJA27sA READY exact main. READ ONLY Production metadata: PG17.6 UTC, reporting schema/inner function/public wrapper absent, latest migration20260917120000 account_visits, auth.users owner supabase_auth_admin/RLS true/FORCE false/policies0, postgres NOSUPERUSER/BYPASSRLS with existing SELECT. This is supplied dated evidence, NOT permission for you to connect to Production **qscbgcdmivbbnzrcyegn** or hosted Development **yfvbxvijcorffwxbxahl**.

Existing config specifies db major17, local Auth password policy/confirmation/rotation/MFA and no CAPTCHA. Read full config, do not infer all settings from this summary. Test-only port/project/mail/third-party-disable differences must be disclosed and must not weaken the behavior under test.

## 7. Multi-Agent Suitability and integration

Decision: **MULTI_AGENT with #555, SINGLE_AGENT within this browser lane**.

Both start exact f0237baf and reuse stable already-merged source contracts. #555 owns rollout package and proposed future enablement design; you own only browser fixtures/harness/evidence. Neither has application or global Auth write authority. TL alone reconciles findings, design and evidence. No dependency on unreviewed sibling code and no automatic agent-to-agent implementation.

Integration order: #555 preparation first when independently acceptable, then this evidence after TL-authorized exact accepted-main synchronization/re-gating. This does not prohibit parallel execution now. No main/sibling merge/rebase/reset/force/cherry-pick until TL gives an exact instruction. Freeze final content once; subsequent exact-head CI/Auth/Preview goes into conversation, not status-only commit churn. New head invalidates old gates. Same-session review fixes only.

## 8. Deliver and stop

REPORT includes preflight, exact source/runtime/service/browser versions, setup/reproduction commands, expected-vs-observed results, source manifest, sanitized screens/requests, cleanup, limitations and P0/P1/P2/P3 findings. STATUS/HANDOFF/SELF_REVIEW must allow continuation without chat. No invented full-stack proof if only a subset ran. Even a concrete environment BLOCKED result must be persisted, never converted into a cloud request.

No hosted apply/config/secret/account query, Production/Preview flag change, provider/model/paid call, payment, production SMTP, tracking, domain/indexing/store launch, new infrastructure or budget/plan increase. Existing Cursor model usage only; quota unknown. Keep Switzerland-first, Flight-first/provider-later, jetnity.com and accepted OS/Guardian limitations.

Official primary references: https://supabase.com/docs/guides/local-development , https://supabase.com/docs/guides/auth/auth-mfa/totp , https://supabase.com/changelog . Use installed tooling help and actual browser snapshots; version claims require evidence.

**Do not mark Ready. Do not merge. Do not start another agent or follow-up slice. STOP FOR INDEPENDENT TECHNICAL-LEAD REVIEW.**
