# Jetnity — Visit Date Precision Fix 1 — optionale Besuchsdatierung korrekt vereinfachen

Date: 23 October 2026 (Europe/Zurich)
Version: 1 — immutable Technical-Lead assignment
Issue: #969
Branch: `fix/visit-date-precision-1`
Cursor-Agent: **Jetnity Visit Date Precision Fix 1 — Cursor Generation 1**
Authority: Technical Lead R98; Product Owner explicitly requested useful parallel Cursor assignments.
Status at creation: TASK ONLY. Implementation begins only after TL dispatch in this branch's existing Draft PR.

## 1. Purpose and verified starting point

Fix the evidenced client-form defect when reducing a recorded visit date from full precision to year-only or unknown. Clearing month currently leaves a disabled stale day; clearing year leaves stale month/day. The unchanged server correctly rejects these inconsistent payloads. Keep current validation and all saved-data authority.

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

**Your write allowlist:** components/account/AccountBesuchFormular.tsx; NEW lib/account/visit-date-precision-1/** only for a minimal pure helper and focused synthetic regression; task-owned docs only.

Task-owned documentation means new files under `docs/JETNITY_VISIT_DATE_PRECISION_FIX_1_*` only, with this immutable TASK excluded from subsequent writes. A small task-owned synthetic evidence directory under `docs/evidence/visit-date-precision-1/` is allowed only if needed for the specified UI evidence; never store real accounts, personal data, secrets or unrelated captures.
Global START_HERE, ACTIVE_WORK_STATUS, ROADMAP, DECISIONS, ARCHITECTURE and governance are TL-owned in this batch. Describe any genuinely necessary pointer update in your handoff; do not create a cross-agent documentation collision.
Stop and ask TL at a path/contract collision. No second writer on this branch. Read-only exploration may be delegated if actually available, but it is not independent TL/Guardian acceptance.


## 4. Verified defect and intended behavior

Read-only source map:
- components/account/AccountBesuchFormular.tsx: shared create/edit form, `besuchEingabeAus` serializer.
- components/account/AccountBesuche.tsx: create/edit callers.
- lib/account/besuche-eingabe.ts: canonical date validation.
- lib/account/besuche-aktionen.ts and lib/account/besuche.test.ts: unchanged write validation and regressions.
- lib/account/besuche-copy.ts: optional precision product contract.

Current full date `2004 / 5 / 9` becomes `2004 / "" / 9` when month is cleared. Day is disabled but still serialized; the server correctly says a day needs a month.
Clearing year currently leaves month/day populated while month is disabled; the server correctly says a month needs a year.
This is a P2 input-state defect. Do not weaken or duplicate server validation to accept inconsistent data.

When a user deliberately removes a parent precision, discard its dependent values in form state and payload:
- clearing month clears day;
- clearing year clears month and day;
- filling a parent again does not resurrect discarded values.
Keep ordinary valid edits unchanged. If changing a nonempty year/month makes an existing date invalid (e.g. 29 February in a non-leap year), retain the existing explicit validation behavior; do not invent/clamp calendar values or silently rewrite a saved date.

## 5. Acceptance criteria

1. Shared create/edit form both support full date → year/month → year-only → no date according to user action.
2. Clear month from 2004/5/9: form shows no month/day and serializes 2004/null/null, accepted by unchanged canonical validation.
3. Clear year from 2004/5/9: form shows no year/month/day and serializes null/null/null, accepted by unchanged canonical validation.
4. Re-entry of year/month never restores removed descendants. Untouched full/year-month/year-only/unknown values are preserved.
5. Existing invalid/future dates and impossible leap-day changes are still rejected by canonical validation. No January 1 default, no arbitrary date invention, no silent server sanitization.
6. Country/place identity, create/edit workflow, field accessibility, labels and pending/disabled behavior stay coherent.
7. No database, server action, auth, visits schema, world-map or shared type change. No new saved data authority.
8. Keep the smallest maintainable fix. A minimal pure task-local helper is allowed if it makes the actual form transition testable; do not add a generic form-state framework or a parallel serializer.
9. The focused regression must exercise the logic actually wired into the component and the resulting payload through unchanged validation. A source-regex assertion alone is insufficient.

## 6. Required verification

- Focused synthetic transitions for clearing month/year, re-entry, normal valid precision and invalid leap/future values; use no real account data.
- Existing lib/account/besuche.test.ts remains unchanged and passes.
- Verify both create and edit use the corrected shared form. A small isolated synthetic form exercise is appropriate if available; do not log into an account or access the Owner's browser for it.
- Follow repository mandatory checks: npm ci, typecheck, lint, npm test, build, check:dead, check:exports, check:deps, check:api-schutz, check:schema-bezug and check:operating-mode as applicable on the actual final implementation. Use existing CI and commands, without weakening failures or adding dependencies.
- No DB/Auth live gate is newly required because these surfaces must not change. Do not run privileged/live scripts to pad the report. Missing environment-dependent checks remain not checked; source/unit evidence is not a hosted account test.

## 7. Hard boundaries and special gates

No Production or Development database calls/writes; no Supabase Auth/Admin/RLS/grant/role/migration/Edge Function changes; no new API/Server Action, persistence, ownership or security authority. Reading repository code/migrations for understanding is allowed.
No real user accounts, credentials, personal browser/profile, external messaging, provider/government/LLM calls, source polling, contracts/terms acceptance, payment, paid activation, deployment/alias/flag changes, new dependency or workflow/package changes.
Existing normal GitHub CI/Preview triggered by branch pushes may run; that does not authorize an ad hoc Production deployment or any blocked external test.
Do not retry previously denied operations or use an alternate route to obtain blocked data. Preserve #917/#944/#936/#937/#911/#913/#626/#968/#748 gates. #937 stays paused. No legacy Preview cleanup. No new Official-Truth foundation; no #955 re-audit. #957 stays dormant, with no UI/runtime activation.
No new legal/privacy policy, supplier truth, live availability or launch claim. These are normal bounded branch changes, not a Product-Owner gate waiver.

Requested Cursor model: **Claude Opus 5.5 High**. Do not silently select Auto or another fallback. State actual model/capability if exposed, otherwise explicitly unknown; a requested model is not evidence of the selected one. If the required setting cannot be honored, report that limitation to TL without choosing an alternative on your own.
Use the exact logical agent name above in all evidence. Rename the actual Cursor session only if its UI/API exposes that ability; otherwise state that UI rename was not verified. Record the actual session link/ID if available.

## 8. Deliverables, review contract and STOP

Commit and push only to `fix/visit-date-precision-1`, in the existing Draft PR. Keep the diff focused. No force push, no main mutation, no branch cleanup.
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
