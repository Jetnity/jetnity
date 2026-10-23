# Jetnity — Direct Edit Lodging Coverage Preview 1 — Unterkunftsnächte vor Bestätigung vergleichen

Date: 23 October 2026 (Europe/Zurich)
Version: 1 — immutable Technical-Lead assignment
Issue: #970
Branch: `feat/direct-edit-lodging-coverage-preview-1`
Cursor-Agent: **Jetnity Direct Edit Lodging Coverage Preview 1 — Cursor Generation 1**
Authority: Technical Lead R98; Product Owner explicitly requested useful parallel Cursor assignments.
Status at creation: TASK ONLY. Implementation begins only after TL dispatch in this branch's existing Draft PR.

## 1. Purpose and verified starting point

Extend the existing unsaved manual-edit impact preview with honest before/after accommodation planning from the unchanged canonical unterkunftAbdeckung evaluator. A trip-date/stage-duration change currently warns that protected booking dates stay unchanged but does not show its recorded-night coverage consequence. Reuse the existing projection/group UI; keep #957 dormant.

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

**Your write allowlist:** lib/reiseaenderung/direct/auswirkungen.ts; NEW lib/reiseaenderung/direct-lodging-coverage-preview-1.test.ts; optionally components/trips/ReiseAenderungAuswirkungen.tsx only if required for accessible bounded presentation; task-owned docs only.

Task-owned documentation means new files under `docs/JETNITY_DIRECT_EDIT_LODGING_COVERAGE_PREVIEW_1_*` only, with this immutable TASK excluded from subsequent writes. A small task-owned synthetic evidence directory under `docs/evidence/direct-edit-lodging-coverage-preview-1/` is allowed only if needed for the specified UI evidence; never store real accounts, personal data, secrets or unrelated captures.
Global START_HERE, ACTIVE_WORK_STATUS, ROADMAP, DECISIONS, ARCHITECTURE and governance are TL-owned in this batch. Describe any genuinely necessary pointer update in your handoff; do not create a cross-agent documentation collision.
Stop and ask TL at a path/contract collision. No second writer on this branch. Read-only exploration may be delegated if actually available, but it is not independent TL/Guardian acceptance.


## 4. Existing architecture and bounded addition

Read before changing:
- lib/reiseaenderung/direct/auswirkungen.ts — existing projection already reports basic/date/stage/day/item changes, protected commercial dates, prospective temporal conflicts and preparation changes.
- components/trips/ReiseAenderungAuswirkungen.tsx — existing grouped details renderer, bounded 20-row paging and responsive presentation.
- components/trips/ReiseAenderungManuell.tsx — existing Guest/Account preview, explicit confirm, stale/uncertain handling and authoritative readback; READ ONLY.
- lib/trips/naechte-abdeckung.ts and its tests — canonical `unterkunftAbdeckung(trip, ohneTag)`; READ ONLY.
- lib/reiseaenderung/direct-trip-editing-1.test.ts and existing draft/commit contracts — READ ONLY.
- Original Change Impact Foundation 1 (#957) task — the accepted foundation is dormant Node-only saved-snapshot logic, not browser runtime or unsaved-draft authority. Do not import/activate it here.

Use the existing canonical night-coverage evaluator separately for the already available before and prospective after trip snapshots. Surface an additional comprehensible group inside the existing manual-edit preview, e.g. “Unterkunftsplanung nach der Änderung”.
Label states clearly: “Bisheriger gespeicherter Plan” and “Vorschau nach deiner Änderung”. User-controlled Guest state is still user planning data; persistence never upgrades it to supplier confirmation.

The value is recorded accommodation-night coverage after a date/duration/stage edit, while protected accommodation dates remain unchanged. Do not add a second impact framework, new editor, independent rebooking workflow, history/recovery or general diff engine.

## 5. Acceptance criteria and truth semantics

1. A trip-date shift and stage-duration/shortening change can show truthful before/after recorded accommodation coverage and canonical gap intervals before the existing confirmation.
2. Reuse canonical half-open check-in/check-out, overlapping-night union, stage association and “ohneTag” logic. Count unassigned accommodation input exactly once. Never reimplement the evaluator or attach stage coverage by name alone.
3. Show selected/user-marked booked coverage as recorded plan state, not supplier booking status, confirmed availability, geographic suitability or a guarantee of readiness.
4. Incomplete stage dates, unknown stay dates, `bekannt=false`, null totals, or any otherwise unqualified side must remain visibly unknown. The canonical evaluator can return known total nights while a stay still has status unknown: do not turn that into a conclusive global comparison.
5. Evaluate each side independently. If only one side is qualified, do not imply that a gap was resolved, a hotel was lost, or the trip became covered. A failure/unavailable evaluation must degrade to a clear unavailable/unknown preview, not fail the edit or generate a false zero.
6. Use only meaningful coverage changes. A title/budget-only edit must not invent accommodation impact or add repetitive noise. Stable stage IDs distinguish repeated names.
7. No mutation of either snapshot or any stored accommodation dates, amounts, selection/booking statuses, links or commercial metadata. No suggestion of automatically cancelling/rebooking.
8. Guest and Account paths share the same existing pure preview contract. Persistence, confirmation, revision/ownership, stale/uncertain and readback behavior remain unchanged.
9. Keep output bounded through the existing renderer. Prefer adding an existing-format group without touching the component. If a minimal accessible renderer change is actually necessary, explain why and preserve existing groups.
10. No DB/Auth/API/provider/LLM work, schema expansion, runtime flag, dependency or package change. #957 remains dormant. This is not a What-if/Recovery feature activation.

## 6. Required verification

Add the focused test file in the allowlist. Cover behavior, not a mirror of implementation:
- date shift with protected stay dates unchanged;
- duration/shortening against the canonical evaluator;
- overlaps counted as union;
- incomplete stage dates and unknown stays;
- multistage/repeated-name identity;
- “ohneTag” exactly once;
- title/budget-only edit without fabricated coverage impact;
- identical pure semantics for Guest/Account inputs and no persistence side effects;
- frozen input snapshots/nonmutation, bounded/unavailable truth.

Run the existing direct-edit and canonical night-coverage regressions without changing their contracts.
Inspect an isolated synthetic preview at desktop/mobile width and keyboard expand/focus if the existing environment supports it; keep evidence task-owned. Report the exact limitation if unavailable. No account login, real trips, personal browser or new hosted fixtures. Do not rerun the completed #955 cross-area audit.
Repository mandatory checks remain npm ci, typecheck, lint, npm test, build, check:dead, check:exports, check:deps, check:api-schutz, check:schema-bezug and check:operating-mode as applicable. Record actual commands/results; no replacement claims for skipped gates.

## 7. Hard boundaries and special gates

No Production or Development database calls/writes; no Supabase Auth/Admin/RLS/grant/role/migration/Edge Function changes; no new API/Server Action, persistence, ownership or security authority. Reading repository code/migrations for understanding is allowed.
No real user accounts, credentials, personal browser/profile, external messaging, provider/government/LLM calls, source polling, contracts/terms acceptance, payment, paid activation, deployment/alias/flag changes, new dependency or workflow/package changes.
Existing normal GitHub CI/Preview triggered by branch pushes may run; that does not authorize an ad hoc Production deployment or any blocked external test.
Do not retry previously denied operations or use an alternate route to obtain blocked data. Preserve #917/#944/#936/#937/#911/#913/#626/#968/#748 gates. #937 stays paused. No legacy Preview cleanup. No new Official-Truth foundation; no #955 re-audit. #957 stays dormant, with no UI/runtime activation.
No new legal/privacy policy, supplier truth, live availability or launch claim. These are normal bounded branch changes, not a Product-Owner gate waiver.

Requested Cursor model: **Claude Opus 5.5 High**. Do not silently select Auto or another fallback. State actual model/capability if exposed, otherwise explicitly unknown; a requested model is not evidence of the selected one. If the required setting cannot be honored, report that limitation to TL without choosing an alternative on your own.
Use the exact logical agent name above in all evidence. Rename the actual Cursor session only if its UI/API exposes that ability; otherwise state that UI rename was not verified. Record the actual session link/ID if available.

## 8. Deliverables, review contract and STOP

Commit and push only to `feat/direct-edit-lodging-coverage-preview-1`, in the existing Draft PR. Keep the diff focused. No force push, no main mutation, no branch cleanup.
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
