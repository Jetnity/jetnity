# Jetnity Admin Security Console Completion 1 — Cursor Generation 1

**R109-A · TASK V1 · 26 October 2026 · immutable Technical-Lead assignment**

## Goal and source-confirmed need

Complete the existing Security console read/recovery/local-blocklist journey. SecurityWidget currently validates array shape only, retains data for every read error including current denial, polls every15seconds even with pending reads and dispatches mutations without a subject operation lock. Preserve the existing recorded-only/incomplete-ingestion/no-technical-IP-enforcement truth.

This is client workflow reliability through the existing server contract. It does not change authorization, close #626 or create an actual firewall.

## Exact owned files

- components/admin/security/SecurityWidget.tsx.
- New small owner-local components/CSS under components/admin/security/ named in PLAN.
- New lib/admin/security/response-contract.ts and .test.ts.
- New lib/admin/security/operation-lifecycle.ts and .test.ts.
- Narrow adaptations only if behavior legitimately changes: lib/admin/security/refresh-reihenfolge.test.ts; lib/admin/security/filter-ehrlichkeit.test.ts; lib/admin/security-event-coverage-truth.test.ts; lib/admin/security-event-taxonomy.test.ts.
- scripts/admin-security-console-completion-1/** and own docs/evidence.

FREEZE app/api/admin/security/**, lib/auth/**, all DB/SQL/RLS/retention/producer work, shared lib/admin/ladezustand.ts and shared error UI, taxonomy/copy contracts, all other Admin/User/Account surfaces, package/config/workflows.

## Acceptance criteria

1. Validate bounded payload shape and every displayed row/field. Malformed200 does not become empty/current data and cannot crash filter/rendering. Preserve unknown event-type honesty.
2. A current401/403 hides protected rows and KPIs and disables writes. A subsequent transient failure cannot resurrect old data. Only a later accepted authorized read may restore it.
3. Preserve latest-read ownership while preventing overlapping timer storms, post-unmount settlement and silent retries. Slow requests crossing multiple15second intervals cannot create unbounded concurrent polling.
4. Distinguish first load, valid empty, filter-empty, bounded200-row window, stale accepted report, malformed response, transient error and denial.
5. Capture exact IP and intent for local blocklist add/remove. Synchronous duplicate/conflicting same-subject dispatch is prevented; unrelated subject operations cannot clear each other's state.
6. Persistent pending/callback-accepted/unconfirmed feedback belongs to the captured subject and action. Transport failure after dispatch is not proof of no write. An explicit recovery/decision may allow another attempt; no automatic resubmit.
7. Old settlement cannot clear another pending action, overwrite edited form input or steal focus. A refresh request and absence from a bounded list are not causal persistence or global absence proof.
8. Current authority/read uncertainty disables actions appropriately. No added privilege, IP enforcement, producer/event capture, export or backend change.
9. Preserve taxonomy, recorded-only labels, filtering-vs-source-empty semantics, independent200-row coverage notes and existing accepted ordering behavior.
10. Accessible mobile/keyboard workflow, persistent safe error/recovery text, no raw server body/stack and no unauthenticated live admin testing.

## Required mounted counterexamples

Valid→401→503; valid→403→malformed200; accepted authorized recovery; old success after denial and old denial after newer success. Null/malformed rows, duplicate identifiers, invalid dates, oversized arrays. Slow poll crossing multiple intervals. Rapid double add; add/remove same IP; independent A/B with A settling while B pending. Dispatch→network failure→explicit decision with no silent resend. Form/filter edits while pending. Actual buttons/status/focus and projectCSS at narrow/desktop/enlarged text. Keep all existing taxonomy/filter/bound regressions.

## Authority, baseline and execution contract

Parent [R109 #1026](https://github.com/Jetnity/jetnity/issues/1026) records the Product Owner's explicit 26 October 2026 request for substantial Phase-1 work in parallel. This is a finite five-lane batch, not an automatic follow-up to R108-A.

Baseline main **6ae344f4453b16514f9048083bb8b07396135fa2**, tree **3bbc26038dfd2d2da471fbc2dea9d0b8331b0d61**, operating mode **NORMAL**. Before work re-read mode, main, this exact task, #751, sibling metadata and your branch. Unexpected branch/main changes return to TL; do not overwrite another writer or independently merge sibling branches.

**Cursor-Agent: Jetnity Admin Security Console Completion 1 — Cursor Generation 1**  
Required actual runtime: **Grok 4.7 High Fast / `grok-4.7-high-fast`**. No Auto or silent fallback. First reply records actual model, session ID/link and logical name. Attempt supported visible rename; an unavailable cosmetic rename is not a blocker. An unavailable/unverifiable required runtime is a capability blocker before implementation.

One fresh genuine Cursor session owns this branch and Draft PR. Immediate review corrections stay in that session. Read AGENTS.md, START_HERE, Technical-Lead/Cursor standard, Multi-Agent Operating System, slice-planning standard, model/name discipline, relevant architecture/vision/roadmap/design/quality/continuity documents, Phase-1 build order/DoD and the exact source contracts below. Later live receipts supersede dated historical task statuses.

Record a concise source-confirmed PLAN, then **implement the authorized scope**. No routine plan-only stop and no repeated general Owner approval. This TASK V1 is immutable: do not edit it. A genuinely necessary frozen-file/contract change must be proposed to Technical Lead before implementation.

## Multi-Agent Suitability — MULTI_AGENT

Five separate branches from the same accepted main: **S dependencies; T multi-stop creation/input bounds; A Admin Security; U Admin Users; K Account home/export**. Your lane is **A**. File ownership is exclusive; shared dependencies are read-only unless explicitly allowlisted below. T alone owns trip create schema/actions; S alone owns package resolution. No shared CSS, workflow, global documentation or sibling-branch writes.

Planned integration **S → T → A → U → K**. Root reviews each exact head independently and evaluates drift after every accepted merge. S changes the dependency baseline; later lanes require renewed combined-baseline gates. Authors must not auto-merge/rebase main or siblings. This task authorizes implementation from its seed, not integration.

## Common frozen boundaries

No hosted DB query/apply, new migration, RLS/grant/identity/Auth/session/MFA/AAL/capability change; no new sensitive fields, secret/environment changes, real provider/model requests, provider activation, payment, external terms, indexing/launch or new infrastructure cost. Existing native CI is allowed, not an alternate hosted SQL readback. No personally signed-in browser/CUA. Synthetic/local tests use blocked external networking; do not exercise real accounts or administrative mutations.

Preserve #985/#982 HOLD without inspecting held implementation as a substitute; #917 denied hosted-readback STOP; #913/#911 blocked; #968 cleanup PAUSED; #748 personal-browser SUSPENDED; #626 STOP; #937/#936 PAUSED; #934 HARD-BLOCKED; #944 no autostart; #585 deferred; #960 separate; #957 dormant. Official Truth OFF, noindex/prelaunch, Production provider hard-off and USD100/month remain.

Never modify AGENTS/operating mode/workflows/rulesets, shared auth/policies, global CSS or global continuity documents. For any file not explicitly owned, STOP at that boundary and report the exact proposal to TL. Root maintains global status.

## Verification and handoff

Use the project's Node 22 runtime and existing toolchain. No OS-package installation or infrastructure provisioning. Run focused meaningful behavioral/counterexample tests, typecheck, lint, the five existing hygiene checks and production build; run the existing test command and report all failures/skips honestly. Do not add tests that merely repeat version literals or source implementation. Do not weaken existing tests to conceal a failure.

For product UI, exercise actual mounted production components with project CSS using the existing isolated audit approach, synthetic fixtures and blocked external network. Prove clicks/keyboard/focus and real outcomes, not helper predicates alone. Include 320/390px, tablet and desktop, enlarged text, long content and error/recovery states. Do not ship an ungated public audit route or claim real-device/hosted acceptance.

Owned documentation prefix **docs/JETNITY_ADMIN_SECURITY_CONSOLE_COMPLETION_1**: PLAN, STATUS, REPORT, SELF_REVIEW and HANDOFF dated 2026-10-26; evidence under **docs/evidence/admin-security-console-completion-1**. Preserve original failures and limitations. Do not publish credentials, private logs, raw personal data or browser state.

Handoff must contain actual main/head/tree/merge-base/ahead/behind, changed-file list, exact session/model, tests and browser execution provenance, checked/not-checked systems, P0/P1/P2/P3 findings, CI/Preview links when available, remaining gate and next responsible actor. A callback acknowledgement, synthetic fixture or successful build is not persistence/Production proof.

Keep this PR Draft. **STOP for independent Technical-Lead review.** Only Root may PASS, Ready and merge.  
**do not mark Ready · do not merge · do not start a follow-up slice**
