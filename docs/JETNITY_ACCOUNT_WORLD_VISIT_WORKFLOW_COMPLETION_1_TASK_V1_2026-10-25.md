# Jetnity Account World Visit Workflow Completion 1 — TASK V1

Date: 2026-10-25. **Immutable Technical-Lead task.** Parent [R107 #1011](https://github.com/Jetnity/jetnity/issues/1011); tracking [#1013](https://github.com/Jetnity/jetnity/issues/1013); lane **W**.

## 1. Authority, baseline and first delivery

Cursor-Agent: **Jetnity Account World Visit Workflow Completion 1 — Cursor Generation 1**. Fresh genuine **Generation 1**, requested **Grok 4.7 High Fast / grok-4.7-high-fast**. No Auto or silent model substitution; if unavailable, STOP and report. Attest actual runtime model, exact session ID/link and logical name. A visible UI rename is best effort and must be reported as actually done or unavailable; no invented independent UI proof.

Branch: `feat/r107-account-world-visit-workflow-1`. Base/current main at dispatch: **a74c443c6be3f064f150fcf021ab6154bda325e5**, tree **c1fe5a50b0da710ef425674057f782b1dff6f8bc**, mode NORMAL. Root verified R106 closure, actual-main CI, Production/direct domain, open work and active strict ruleset 21875372. [Root precheck](https://github.com/Jetnity/jetnity/issues/1011) and [intake](https://github.com/Jetnity/jetnity/issues/751#issuecomment-6399573707) are binding.

**FIRST DELIVERY IS PLAN ONLY.** Read this complete TASK and the relevant actual code/contracts. Commit only `docs/JETNITY_ACCOUNT_WORLD_VISIT_WORKFLOW_COMPLETION_1_PLAN_2026-10-25.md` in addition to this immutable TASK. The plan must provide source-confirmed design, exact file ownership, reused contracts, failure/state matrix, proof approach, costs and limits. Post actual main/head/merge-base/ahead/behind, plan link/blob, model/session/name, then **STOP before any implementation, test addition, audit execution or other document changes**. Root will independently review the exact plan head and authorize this same session. This internal TL gate requires no additional Owner confirmation.

Required reading: AGENTS.md; JETNITY_START_HERE.md; Technical-Lead/Cursor Operating Standard; current handoff and ACTIVE_WORK_STATUS; live #751/#1011; three-phase strategy; V1 binding build order; Multi-Agent Slice Planning Standard; relevant existing contracts/tests. Earlier dated pending/current markers are historical snapshots. R106 is completed and must not be reopened.

## 2. Goal and source-confirmed need

Complete the existing **Deine Welt visit create → edit → revoke workflow** with operation-owned state, safe recovery and deliberate focus. Reuse the accepted map and event model and the existing server actions.

Source-confirmed gaps in AccountBesuche.tsx: one shared transition/status for three mutations; no local exception or malformed-response boundary; success clears editors and requests router.refresh() without proving current list delivery; status scroll and row/editor visibility are not owned by the initiating intent. Current inputs/actions are globally disabled during pending, so this TASK does not claim a demonstrated normal pending-window typing-loss bug. Reproduce actual cases before labeling them.

Existing besuche-aktionen.ts actions return Aktionsergebnis<null>, including creation. Repeated visits to the same place/date are valid; the response supplies no new event identity.

## 3. Exclusive allowed files

- components/account/AccountBesuche.tsx
- components/account/AccountBesuchFormular.tsx — only workflow/pending/error/focus props and existing fields
- New optional components/account/useAccountVisitWorkflow.ts
- New optional lib/account/account-visit-workflow.ts and .test.ts
- lib/account/besuche-copy.ts — only necessary workflow wording
- The lane's named proof/evidence/documentation paths in section 7.

Existing visit-management UI tests may be proposed in PLAN for an exact narrow adaptation if their UI-shape assertion becomes obsolete; do not add an open-ended test allowlist or weaken domain assertions. Root must approve named files before editing them.

Frozen: besuche-aktionen.ts, besuche-daten.ts, besuche.ts, besuche-eingabe.ts, visit-date-precision-1/zeitfeld.ts; app/account/welt/page.tsx; AccountWeltKarte.tsx, WeltZustaende.tsx, world-explorer-1/**; trip plans and map derivation; traveller registry; shared field/domain/date-validation/DB/Auth/RLS contracts. No new persistent state or second visit writer.

## 4. Required behavior

1. Complete all three existing actions with captured event/operation/draft identity, explicit pending state and a synchronous duplicate-dispatch guard. A same-turn click/Enter pair must not dispatch twice.
2. Preserve the correct draft and event target on known returned rejection. Handle thrown or malformed action responses conservatively; transport failure may mean an unknown server outcome, not proven rollback.
3. Keep acknowledged write, requested refresh and observed current history distinct. No synthetic success from a changed count or mere router.refresh() call.
4. Creation has no returned event ID: never correlate a new row through matching place/country/date/name, list order or count. Repeated identical visits stay distinct.
5. Edit/revoke observations use exact event ID and current valid read evidence. A failed read is not absence; observational equality is not proof of causal transaction acknowledgment.
6. Do not automatically repeat an uncertain create/edit/revoke. Provide explicit bounded read refresh/checking and preserve operation context; distinguish retryable known rejection from unresolved outcome.
7. New canonical props, filtering, disclosure collapse, confirmation cancellation and row removal must not route a late result or focus action to another target. An editor hidden by filtering retains a clear way to locate/discard the actual draft; avoid silently applying stale intent after target removal.
8. Preserve unknown/year/month/day date precision, existing place/country identity and repeated-event semantics in every success/failure path. No inferred country, artificial January 1 or plan→visit conversion.
9. Keep the map/counters/markers derived exclusively from supplied canonical visit/planning evidence. An unconfirmed local intention does not change them.
10. Provide named revoke confirmation, clear per-operation pending/error/unknown/accepted-awaiting-read text and predictable keyboard/cancel/return focus. Status updates must not steal focus from a newer draft or search interaction.
11. Preserve the independent planned-trips and confirmed-visits read failures. This lane changes neither reader nor map fallback logic. Document full-unmount and uncorrelated-read limits honestly.

## 5. Acceptance and evidence

- Actual mounted production AccountBesuche/form/hook with synthetic action and router boundaries, not only pure transitions.
- Create/edit/revoke: returned rejection, thrown/malformed response, delayed success/error/finally, rapid duplicate/Enter, retained draft/target, explicit checking/retry, accepted-awaiting-read, unchanged/old/new matching and nonmatching props.
- Identical repeated visits, missing event, failed read, filter hides edited row, row replacement/removal, switching confirmation and cancellation while older operation resolves.
- Assert no causal create association by place/date and no automatic repeat of unknown mutation; actual payload remains the exact existing action shape.
- Assert map/derivation inputs are unchanged by local pending state; date precision and real event IDs survive.
- Real pointer/keyboard/form interactions and project CSS at 320/390/768/1440 widths, root text 32px, long labels, 40-event density, open editor/confirmation and all failure states. No overflow-hiding workaround.
- Pure helper tests support the actual mounted wiring. Identify synthetic action/refresh boundaries and do not claim hosted Account/SQL/RLS/full Next-router/device acceptance.


## 6. Multi-Agent Suitability and frozen boundaries

Decision: **MULTI_AGENT**. Five independent lanes on one verified main: T traveller snapshot, W World visits, M My Trips collection/archive, D Admin user directory, S dependency advisory triage. This lane owns only its exact allowlist above and its named delivery files. All others are read-only dependencies. Shared contracts do not change silently. If an unlisted file or contract is truly necessary, describe the narrow need to TL and STOP at that boundary; do not alter the TASK yourself.

Integration priority **T → S → D → W → M**. Do not merge or cherry-pick sibling branches. Do not automatically merge/rebase new main into this branch: report drift and wait for the TL's explicit same-session integration instruction. Every new head requires fresh acceptance. Product-facing work must keep existing premium/mobile-first tokens and semantics.

Preserve #985/#982 scoped HOLD, including no retry/rephrase/reroute/substitute review or held-implementation inspection; #917 denied hosted-readback STOP (hosted UNKNOWN, Stage 2 NOT_ATTEMPTED; no alternate query/apply/connector/operator/manual-SQL route); #913/#911 block; #968 legacy Preview cleanup PAUSED; #748 personal-browser/CUA SUSPENDED; #626 STOP; #937/#936 PAUSED; Bern #934 HARD-BLOCKED; #944 no autostart; #585 deferred; #960 separate; #957 dormant.

No hosted DB operations, schema/migration/RLS/grant changes, Auth/AAL/session/identity expansion, new sensitive passport/MRZ/biometric/health fields, secret/protection modification, provider activation or paid call, payment, contract/legal acceptance, launch/indexing or new paid service. Existing prelaunch/noindex and USD 100 monthly infrastructure boundary remain. Routine repository and synthetic local development operations within this task are authorized. A denied action must not be bypassed.

No edits to global continuity/governance/ROADMAP/DECISIONS/ARCHITECTURE/DESIGN_SYSTEM, package files, lockfiles, workflows, operating mode or broad shared types unless explicitly included above. In this batch none of those global changes is allocated. Root owns consolidated continuity. Findings outside scope are reported with evidence and severity, not silently fixed.

## 7. Implementation/audit deliverables after TL PLAN acceptance

- Only named runtime/proof paths above and this lane's documentation:
  - `docs/JETNITY_ACCOUNT_WORLD_VISIT_WORKFLOW_COMPLETION_1_PLAN_2026-10-25.md`
  - `docs/JETNITY_ACCOUNT_WORLD_VISIT_WORKFLOW_COMPLETION_1_STATUS_2026-10-25.md`
  - `docs/JETNITY_ACCOUNT_WORLD_VISIT_WORKFLOW_COMPLETION_1_REPORT_2026-10-25.md`
  - `docs/JETNITY_ACCOUNT_WORLD_VISIT_WORKFLOW_COMPLETION_1_SELF_REVIEW_2026-10-25.md`
  - `docs/JETNITY_ACCOUNT_WORLD_VISIT_WORKFLOW_COMPLETION_1_HANDOFF_2026-10-25.md`
- Proof runners, if allowed above: `scripts/account-world-visit-workflow-completion-1/**`.
- Sanitized synthetic evidence: `docs/evidence/account-world-visit-workflow-completion-1/**`, with source/head/dirty-state binding, exact commands, exit codes, versions, test totals, stubs, screenshots where relevant, and honest failed/aborted/skipped limits. No real user data, credentials, raw sensitive platform responses, node_modules or reproducible bundle bulk.
- Never relabel pure/source/synthetic/mocked evidence as hosted, authenticated, native-device, full-router, SQL/RLS or Production evidence. A refresh request does not prove causal readback. A local operation guard does not prove atomicity or exactly-once writes.
- Product lanes must run meaningful focused regressions and actual-component interaction/CSS evidence as specified, then ordinary project Typecheck, lint, all five hygiene guards, production build and tests. Existing native App/Auth/Vercel gates are required; do not alter gates or use skipped work as a pass. Record local environment failures honestly. The read-only audit lane runs its specific evidence validation and the normal native docs gates; it does not introduce runtime tests mirroring its report.
- The two established conditional browser skips, 181 existing lint warnings, 11 previously reported untriaged dependency advisories, guest cross-tab non-atomicity and full-unmount limits are existing evidence limits, not new successes or globally accepted security clearance.

## 8. Mandatory STOP and handoff

At the next agreed delivery boundary, push only to the existing assigned branch/PR and report exact main/head/tree/merge-base/ahead/behind, full changed-file list, model/session/name, executed evidence, failed or skipped checks, open P0/P1/P2/P3 findings and remaining limits.

**Do not mark Ready. Do not merge. Do not close tracking issues. Do not write main. Do not start a follow-up slice.** Keep this TASK byte-identical. Self-review is not Technical-Lead PASS. Only root TL makes acceptance/Ready/merge decisions. An immediate CHANGES REQUIRED fix stays with this same original author/session; a changed head invalidates every previous exact-head gate.
