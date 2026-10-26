# Jetnity Admin User Mutation Safety 1 — Cursor Generation 1

**R109-U · TASK V1 · 26 October 2026 · immutable Technical-Lead assignment**

## Goal and source-confirmed need

Complete the existing role/status mutation UI, preserving the separately accepted R107 directory-read/navigation lifecycle and all backend authority. Current UsersTable uses one pendingId for all actions, clears it in every finally, does not disable action items by it, and reports only toasts. Users page maps unknown role to DEFAULT_ROLE and unknown status to active. R107 intentionally excluded those mutations and this P2 mapping; this task now owns them.

Existing actions return void after error checks/revalidation. A fulfilled callback is not an independently observed changed row.

## Exact owned files

- components/admin/UsersTable.tsx.
- app/(admin)/admin/users/page.tsx ONLY displayed row mapping; freeze guards/client/query bounds/selected columns/ownership.
- New lib/admin/user-mutation-lifecycle.ts and .test.ts.
- New lib/admin/user-row-truth.ts and .test.ts if justified.
- New components/admin/users/UserMutationConfirmation.tsx and owner-local confirmation CSS/helpers under components/admin/users/, individually named in PLAN.
- Narrow adaptation lib/admin/users-directory-read.test.ts only to replace old frozen-source-shape assertions with equivalent preserved behavior.
- scripts/admin-user-mutation-safety-1/** and own docs/evidence.

FREEZE app/(admin)/admin/users/actions.ts, lib/auth/**, role/status/capability constants, existing directory query/search-navigation modules, all DB/RLS, shared UI primitives/Admin shell and Security/Payments/Account areas.

## Acceptance criteria

1. Unknown/malformed stored role or status is visibly unknown and non-actionable. No guessed privilege rank/default active state. Malformed target identity cannot dispatch.
2. Valid known rows retain all existing self/peer/assignable-role restrictions. Server remains sole authority; do not change policy or broaden data access.
3. Deliberate accessible confirmation names the exact target and requested role/status. Revalidate captured target/intent against current row at dispatch; stale/removed/changed/unknown targets cannot submit.
4. Stable target operation ownership synchronously suppresses duplicate/conflicting writes for that target. Different targets may proceed independently without old A completion clearing B.
5. Distinguish pending, fulfilled callback and unconfirmed outcome from subsequently observed canonical row state. A refresh request or fulfilled void action is not confirmed persistence.
6. Relevant query/page changes within the mounted table cannot reopen pending/unconfirmed claims when a row disappears/reappears. No automatic replay after rejection/timeout/navigation.
7. Persistent subject-bound feedback survives relevant view changes without claiming an outcome for the currently visible different user. Explicit recovery never itself writes.
8. Preserve R107 debounce, Back/Forward, query-bound acknowledgement/retry, out-of-range behavior, read error semantics and responsive directory. No second navigation lifecycle or competing directory model.
9. Retain honest full-unmount/reload/cross-tab limitations. No localStorage persistence of user-operation identifiers, no private data in evidence/logs.
10. Accessible confirmation/cancel/recovery, focus restoration, long names and enlarged text at mobile/desktop.

## Required mounted counterexamples

Same-turn double activation; role then status for one pending target; A/B pending and A settles first; unknown role/status/identity; captured row changed before confirm; fulfilled callback with absent/unchanged/contradictory refreshed row; old error after newer query; transport ambiguity and explicit no-resend recovery. Preserve all accepted R107 actual query/navigation witnesses and test rendered controls/disablement/callback counts, not only reducer predicates.

## Authority, baseline and execution contract

Parent [R109 #1026](https://github.com/Jetnity/jetnity/issues/1026) records the Product Owner's explicit 26 October 2026 request for substantial Phase-1 work in parallel. This is a finite five-lane batch, not an automatic follow-up to R108-A.

Baseline main **6ae344f4453b16514f9048083bb8b07396135fa2**, tree **3bbc26038dfd2d2da471fbc2dea9d0b8331b0d61**, operating mode **NORMAL**. Before work re-read mode, main, this exact task, #751, sibling metadata and your branch. Unexpected branch/main changes return to TL; do not overwrite another writer or independently merge sibling branches.

**Cursor-Agent: Jetnity Admin User Mutation Safety 1 — Cursor Generation 1**  
Required actual runtime: **Grok 4.7 High Fast / `grok-4.7-high-fast`**. No Auto or silent fallback. First reply records actual model, session ID/link and logical name. Attempt supported visible rename; an unavailable cosmetic rename is not a blocker. An unavailable/unverifiable required runtime is a capability blocker before implementation.

One fresh genuine Cursor session owns this branch and Draft PR. Immediate review corrections stay in that session. Read AGENTS.md, START_HERE, Technical-Lead/Cursor standard, Multi-Agent Operating System, slice-planning standard, model/name discipline, relevant architecture/vision/roadmap/design/quality/continuity documents, Phase-1 build order/DoD and the exact source contracts below. Later live receipts supersede dated historical task statuses.

Record a concise source-confirmed PLAN, then **implement the authorized scope**. No routine plan-only stop and no repeated general Owner approval. This TASK V1 is immutable: do not edit it. A genuinely necessary frozen-file/contract change must be proposed to Technical Lead before implementation.

## Multi-Agent Suitability — MULTI_AGENT

Five separate branches from the same accepted main: **S dependencies; T multi-stop creation/input bounds; A Admin Security; U Admin Users; K Account home/export**. Your lane is **U**. File ownership is exclusive; shared dependencies are read-only unless explicitly allowlisted below. T alone owns trip create schema/actions; S alone owns package resolution. No shared CSS, workflow, global documentation or sibling-branch writes.

Planned integration **S → T → A → U → K**. Root reviews each exact head independently and evaluates drift after every accepted merge. S changes the dependency baseline; later lanes require renewed combined-baseline gates. Authors must not auto-merge/rebase main or siblings. This task authorizes implementation from its seed, not integration.

## Common frozen boundaries

No hosted DB query/apply, new migration, RLS/grant/identity/Auth/session/MFA/AAL/capability change; no new sensitive fields, secret/environment changes, real provider/model requests, provider activation, payment, external terms, indexing/launch or new infrastructure cost. Existing native CI is allowed, not an alternate hosted SQL readback. No personally signed-in browser/CUA. Synthetic/local tests use blocked external networking; do not exercise real accounts or administrative mutations.

Preserve #985/#982 HOLD without inspecting held implementation as a substitute; #917 denied hosted-readback STOP; #913/#911 blocked; #968 cleanup PAUSED; #748 personal-browser SUSPENDED; #626 STOP; #937/#936 PAUSED; #934 HARD-BLOCKED; #944 no autostart; #585 deferred; #960 separate; #957 dormant. Official Truth OFF, noindex/prelaunch, Production provider hard-off and USD100/month remain.

Never modify AGENTS/operating mode/workflows/rulesets, shared auth/policies, global CSS or global continuity documents. For any file not explicitly owned, STOP at that boundary and report the exact proposal to TL. Root maintains global status.

## Verification and handoff

Use the project's Node 22 runtime and existing toolchain. No OS-package installation or infrastructure provisioning. Run focused meaningful behavioral/counterexample tests, typecheck, lint, the five existing hygiene checks and production build; run the existing test command and report all failures/skips honestly. Do not add tests that merely repeat version literals or source implementation. Do not weaken existing tests to conceal a failure.

For product UI, exercise actual mounted production components with project CSS using the existing isolated audit approach, synthetic fixtures and blocked external network. Prove clicks/keyboard/focus and real outcomes, not helper predicates alone. Include 320/390px, tablet and desktop, enlarged text, long content and error/recovery states. Do not ship an ungated public audit route or claim real-device/hosted acceptance.

Owned documentation prefix **docs/JETNITY_ADMIN_USER_MUTATION_SAFETY_1**: PLAN, STATUS, REPORT, SELF_REVIEW and HANDOFF dated 2026-10-26; evidence under **docs/evidence/admin-user-mutation-safety-1**. Preserve original failures and limitations. Do not publish credentials, private logs, raw personal data or browser state.

Handoff must contain actual main/head/tree/merge-base/ahead/behind, changed-file list, exact session/model, tests and browser execution provenance, checked/not-checked systems, P0/P1/P2/P3 findings, CI/Preview links when available, remaining gate and next responsible actor. A callback acknowledgement, synthetic fixture or successful build is not persistence/Production proof.

Keep this PR Draft. **STOP for independent Technical-Lead review.** Only Root may PASS, Ready and merge.  
**do not mark Ready · do not merge · do not start a follow-up slice**
