# Jetnity — V1 Support Runbook Reconciliation 1 — vorhandene Funktionen und echte Grenzen dokumentieren

Date: 23 October 2026 (Europe/Zurich)
Version: 1 — immutable Technical-Lead assignment
Issue: #971
Branch: `docs/v1-support-runbook-reconciliation-1`
Cursor-Agent: **Jetnity V1 Support Runbook Reconciliation 1 — Cursor Generation 1**
Authority: Technical Lead R98; Product Owner explicitly requested useful parallel Cursor assignments.
Status at creation: TASK ONLY. Implementation begins only after TL dispatch in this branch's existing Draft PR.

## 1. Purpose and verified starting point

Correct the canonical support runbook's stale current-state claims that self-service export/deletion, legal pages and own SMTP do not exist. Reconcile all affected sections against current source and accepted closure evidence. Preserve unsupported/unknown limits, no mailbox access, no external replies, no new legal policy or new support authority.

Verified main: `5269b9192a2300c6c03fc8659964583130d2d1d1`, tree `961641af883a23126e4479849a78b0a27f042c1e`.
Operating mode re-read before preparation: NORMAL. Main CI 39946141112 completed/success.
Production `dpl_9UAm5wyirSTmDyPex9CfDZst5Wnm` was independently re-read READY on this main, with jetnity.com alias and no alias error. This is baseline evidence, not this task's acceptance.
Task seed head and immutable TASK blob will be recorded by TL in the dispatch. They cannot be self-referentially embedded here.

Continuity: [R97 FINAL](https://github.com/Jetnity/jetnity/issues/751#issuecomment-6365800695), [R98.1 selection precheck](https://github.com/Jetnity/jetnity/issues/751#issuecomment-6367099463). Read the newest material #751 and #748 comments before starting; historical instructions do not reopen closed work.

## 2. Mandatory orientation and implementation plan

Read JETNITY_START_HERE.md, AGENTS.md, .jetnity/operating-mode.json, docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md, docs/JETNITY_MULTI_AGENT_OPERATING_SYSTEM.md, docs/JETNITY_MULTI_AGENT_SLICE_PLANNING_STANDARD.md, the current referenced handoff and ACTIVE_WORK_STATUS, relevant vision/architecture/decisions/design/quality/continuity documents and the code/tests below.

Produce a short task-owned implementation plan before changes: goal, exact files, no DB/API changes, risks, security/privacy/cost effects, tests and effect on the existing product contract. Do not spend the slice generating a new architecture framework.

This TASK is immutable. Do not change its scope, acceptance or baseline to fit an implementation. Report a real conflict to TL. Use the existing branch and Draft PR; do not open a replacement PR.

## 3. Multi-Agent Suitability and ownership

Decision: **MULTI_AGENT across R98; SINGLE_WRITER inside each branch**.

- #969: Jetnity Visit Date Precision Fix 1 — Cursor Generation 1; visit input form and task-local pure helper/tests.
- #970: Jetnity Direct Edit Lodging Coverage Preview 1 — Cursor Generation 1; existing manual-edit impact projection, dedicated test file and only if necessary its presentation.
- #971: Jetnity V1 Support Runbook Reconciliation 1 — Cursor Generation 1; canonical support runbook and task-local docs.

All three start independently from the same verified main. No branch depends on another unmerged branch. They own disjoint files. Shared schemas, server actions, persistence/auth contracts and the canonical accommodation evaluator remain read-only.
TL integration priority: visit defect, lodging preview, support reconciliation. This is review ordering, not authorization for any writer to merge. Main drift is assessed by TL; no silent rebase/merge/cherry-pick of another assignment.
Parallelization reduces independent implementation time without competing writers or migrations.

**Your write allowlist:** docs/V1_SUPPORT_PROCESS_RUNBOOK_2026-09-18.md; NEW task-owned report/handoff documentation only; NO runtime files.

Task-owned documentation means new files under `docs/JETNITY_V1_SUPPORT_RUNBOOK_RECONCILIATION_1_*` only, with this immutable TASK excluded from subsequent writes. A small task-owned synthetic evidence directory under `docs/evidence/v1-support-runbook-reconciliation-1/` is allowed only if needed for the specified UI evidence; never store real accounts, personal data, secrets or unrelated captures.
Global START_HERE, ACTIVE_WORK_STATUS, ROADMAP, DECISIONS, ARCHITECTURE and governance are TL-owned in this batch. Describe any genuinely necessary pointer update in your handoff; do not create a cross-agent documentation collision.
Stop and ask TL at a path/contract collision. No second writer on this branch. Read-only exploration may be delegated if actually available, but it is not independent TL/Guardian acceptance.


## 4. Reconcile the existing canonical runbook

Only substantive target: docs/V1_SUPPORT_PROCESS_RUNBOOK_2026-09-18.md.
It still presents outdated “current” claims across sections 0, 1, 3, 8, 11, 12, 13, 14 and 15: no self-service export/deletion, absent legal routes, no own SMTP, and reply templates/backlog directions that assume those features do not exist.

Read and distinguish source facts from dated accepted runtime evidence:
- app/account/settings/page.tsx: existing account security link, JSON export and guarded deletion UI.
- app/api/account/export/route.ts, lib/account/datenexport.ts and V1_ACCOUNT_DATA_EXPORT_1 evidence: actual authenticated export scope and limits. It is not an automatic complete legal DSAR.
- components/account/KontoLoeschen.tsx and its referenced guard/actions: existing password reauthentication, confirmation and conditional TOTP; no support-email bypass.
- docs/PRODUCTION_ACCOUNT_ERASURE_POST_MERGE_CLOSURE_2026-09-28.md: accepted production flow, but the test account was empty. It did not prove deletion of a populated trip/traveller/visit/security/storage lifecycle or a verified MFA account. #626 remains blocked; do not repeat it.
- app/(public)/privacy/page.tsx, app/(public)/impressum/page.tsx, app/(public)/terms/page.tsx; PrivacyBee integration evidence and docs/TERMS_CH_DE_1_0_INTEGRATION_CLOSURE_2026-09-28.md.
- #581/#582 actual closure comments, especially [#582 accepted delivery closure](https://github.com/Jetnity/jetnity/issues/582#issuecomment-5858252535). The configured sender is **no-reply@jetnity.com**, not the old proposal no-reply@jetnity.ch. Recorded reset/signup delivery and physical-iPhone callback acceptance are dated evidence, not a fresh inbox/SMTP test.
- #585 remaining legal/provider wording issue is separate; do not declare it fixed or rewrite privacy text.
- Current Footer/contact navigation only as needed to correct factual support paths.

Canonical public support contact stays **info@jetnity.ch**. Do not invent monitored hours, an SLA, named mailbox ownership, staffing, delivered messages, legal completeness or provider health.

## 5. Acceptance criteria

1. Correct all contradictory current-state statements and response templates consistently, including end-of-document acceptance/backlog sections. Historical creation date may remain; add an explicit reconciliation date and exact source baseline.
2. Clearly separate “implemented in current source”, “accepted runtime evidence on date X, with scope Y” and “not checked / remaining”. Current source does not prove mail delivery today.
3. Describe the existing authenticated self-service export/deletion route and actual limitations accurately. Support must not execute identity/account deletion merely because somebody emails a request; preserve existing identity, privacy and least-privilege boundaries.
4. State legal pages exist without claiming comprehensive legal compliance or closing #585. Keep remaining genuinely open monitoring/process/launch/privacy work visible.
5. Replace obsolete “implement export/deletion/SMTP/legal route” next steps with the correct bounded existing follow-up or uncertainty. Do not start any follow-up.
6. Use exact repository paths and dated accepted issue/closure links. Do not cite stale issue-body proposals as completed configuration.
7. No runtime or legal-policy text change, no settings/auth/SMTP/provider/DB operation, no mailbox/contact/read or external message, no real-user support handling.
8. Keep the existing runbook usable and compact. This is a factual reconciliation, not a new support organization, generic compliance framework or broad documentation refresh.
9. Handoff lists each material old claim, its corrected truth, evidence and remaining limitation.

## 6. Required verification

Read the entire edited runbook and check internal consistency, exact route/path/link targets and the full diff. Document a short coverage table for the affected sections and remaining unknowns.
No new tests are needed for prose. Existing repository CI must remain intact. Record any CI/checks actually run and distinguish task-only validation from repository-wide runtime acceptance. Do not fix unrelated failures or alter workflows, package/dependencies or runtime files to obtain green status.
No production email, authentication, deletion, export, PrivacyBee or DB test is authorized by this docs-only task.

## 7. Hard boundaries and special gates

No Production or Development database calls/writes; no Supabase Auth/Admin/RLS/grant/role/migration/Edge Function changes; no new API/Server Action, persistence, ownership or security authority. Reading repository code/migrations for understanding is allowed.
No real user accounts, credentials, personal browser/profile, external messaging, provider/government/LLM calls, source polling, contracts/terms acceptance, payment, paid activation, deployment/alias/flag changes, new dependency or workflow/package changes.
Existing normal GitHub CI/Preview triggered by branch pushes may run; that does not authorize an ad hoc Production deployment or any blocked external test.
Do not retry previously denied operations or use an alternate route to obtain blocked data. Preserve #917/#944/#936/#937/#911/#913/#626/#968/#748 gates. #937 stays paused. No legacy Preview cleanup. No new Official-Truth foundation; no #955 re-audit. #957 stays dormant, with no UI/runtime activation.
No new legal/privacy policy, supplier truth, live availability or launch claim. These are normal bounded branch changes, not a Product-Owner gate waiver.

Requested Cursor model: **Claude Opus 5.5 High**. Do not silently select Auto or another fallback. State actual model/capability if exposed, otherwise explicitly unknown; a requested model is not evidence of the selected one. If the required setting cannot be honored, report that limitation to TL without choosing an alternative on your own.
Use the exact logical agent name above in all evidence. Rename the actual Cursor session only if its UI/API exposes that ability; otherwise state that UI rename was not verified. Record the actual session link/ID if available.

## 8. Deliverables, review contract and STOP

Commit and push only to `docs/v1-support-runbook-reconciliation-1`, in the existing Draft PR. Keep the diff focused. No force push, no main mutation, no branch cleanup.
Deliver task-owned PLAN, STATUS, SELF_REVIEW and HANDOFF documentation; concise artifacts may cross-reference a single evidence table without duplicating logs. Keep this TASK unchanged.

Every material handoff must state:
- exact main/base, branch/head/tree, merge-base and ahead/behind after a fresh origin/main read;
- exact logical agent/generation, actual session link/ID, requested versus observed model/capability;
- immutable TASK blob and files changed;
- implementation decisions and acceptance evidence;
- commands actually run, exit/results, exact CI/Preview binding if visible; missing/skipped/failed checks must remain explicit;
- DB/Auth/Production/provider actions not performed, and untested runtime/device limits;
- P0/P1/P2/P3 findings, unresolved gates, next responsible actor;
- clear distinction between your self-review and TL acceptance.

Post a material completion handoff in the PR Evidence Bus with exact head. A docs-only commit after tests creates a new head: report the actual final head and do not pretend previous exact-head CI applies automatically.
If TL returns CHANGES REQUIRED, the same named writer and same session handle that bounded immediate fix. Any changed head invalidates prior exact-head gates.
**STOP for independent Technical-Lead review. DO NOT MARK READY. DO NOT MERGE. DO NOT START A FOLLOW-UP SLICE.**
