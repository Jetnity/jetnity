# Jetnity Dependency Patch Remediation 1 — Cursor Generation 1

**R109-S · TASK V1 · 26 October 2026 · immutable Technical-Lead assignment**

## Goal and source-confirmed need

Resolve only the two compatible transitive patch targets from [COS018 TL intake](https://github.com/Jetnity/jetnity/issues/748#issuecomment-6412497717). Current lock: @supabase/realtime-js2.15.5 → ws8.18.3; next16.4.1 → postcss8.5.23 → source-map-js1.2.1. These are affected-version findings, not a demonstrated compromise.

Required targets: **ws8.21.0** and **source-map-js1.2.2**. Primary references:
- https://github.com/advisories/GHSA-96hv-2xvq-fx4p
- https://github.com/advisories/GHSA-58qx-3vcg-4xpx
- https://github.com/advisories/GHSA-68fv-2mgg-jv7q

Independently re-fetch primary advisory and registry/integrity evidence before editing. If those exact patches are unavailable or primary evidence conflicts, STOP with precise evidence; no guessed package versions.

## Exact owned files

- package-lock.json.
- package.json ONLY if precise target resolution controls are genuinely necessary; preserve existing scripts, engines, direct dependencies and simple-swizzle override.
- Lane-specific documents/evidence named in the common contract.

No application source, tests requiring application edits, scripts/global configuration, supabase or lib/trips files. T owns resource guards; do not implement them here.

## Acceptance criteria

1. Prefer a lockfile-only same-major resolution update. Do not add transitive packages as artificial direct dependencies. Explain any narrowly required override.
2. Preserve Next16.4.1, React/React-DOM19.2.8, Zod3.25.76, existing Supabase resolutions and every unrelated package identity.
3. Compare the entire old/new lock package map. Version/resolved/integrity changes must be limited to the intended target instances; no incidental dependency churn.
4. Verify actual installed dependency trees and relevant copies after a clean lockfile install on Node22. No affected older duplicate of either target may survive in the relevant tree.
5. Required normal tests/build/typecheck/lint/hygiene pass; a changed package graph needs new exact-head CI/Preview. No broad npm update, audit fix --force, Node/Next/React/Supabase upgrade or bypass.
6. Report the two ws and one source-map advisory dispositions separately. Zod remains unchanged/open, even if T's bounded guards later pass. No global security clearance or claim that all42 R107 pairs are fixed.
7. Report install audit output as observed findings, not proof of exploitability or a reason to broaden this task.

Evidence must bind advisory retrieval, registry patch identity, lock map comparison, clean installed resolution, tests and build to exact head. No live vulnerability test, stress/OOM test or private application input.

## Authority, baseline and execution contract

Parent [R109 #1026](https://github.com/Jetnity/jetnity/issues/1026) records the Product Owner's explicit 26 October 2026 request for substantial Phase-1 work in parallel. This is a finite five-lane batch, not an automatic follow-up to R108-A.

Baseline main **6ae344f4453b16514f9048083bb8b07396135fa2**, tree **3bbc26038dfd2d2da471fbc2dea9d0b8331b0d61**, operating mode **NORMAL**. Before work re-read mode, main, this exact task, #751, sibling metadata and your branch. Unexpected branch/main changes return to TL; do not overwrite another writer or independently merge sibling branches.

**Cursor-Agent: Jetnity Dependency Patch Remediation 1 — Cursor Generation 1**  
Required actual runtime: **Grok 4.7 High Fast / `grok-4.7-high-fast`**. No Auto or silent fallback. First reply records actual model, session ID/link and logical name. Attempt supported visible rename; an unavailable cosmetic rename is not a blocker. An unavailable/unverifiable required runtime is a capability blocker before implementation.

One fresh genuine Cursor session owns this branch and Draft PR. Immediate review corrections stay in that session. Read AGENTS.md, START_HERE, Technical-Lead/Cursor standard, Multi-Agent Operating System, slice-planning standard, model/name discipline, relevant architecture/vision/roadmap/design/quality/continuity documents, Phase-1 build order/DoD and the exact source contracts below. Later live receipts supersede dated historical task statuses.

Record a concise source-confirmed PLAN, then **implement the authorized scope**. No routine plan-only stop and no repeated general Owner approval. This TASK V1 is immutable: do not edit it. A genuinely necessary frozen-file/contract change must be proposed to Technical Lead before implementation.

## Multi-Agent Suitability — MULTI_AGENT

Five separate branches from the same accepted main: **S dependencies; T multi-stop creation/input bounds; A Admin Security; U Admin Users; K Account home/export**. Your lane is **S**. File ownership is exclusive; shared dependencies are read-only unless explicitly allowlisted below. T alone owns trip create schema/actions; S alone owns package resolution. No shared CSS, workflow, global documentation or sibling-branch writes.

Planned integration **S → T → A → U → K**. Root reviews each exact head independently and evaluates drift after every accepted merge. S changes the dependency baseline; later lanes require renewed combined-baseline gates. Authors must not auto-merge/rebase main or siblings. This task authorizes implementation from its seed, not integration.

## Common frozen boundaries

No hosted DB query/apply, new migration, RLS/grant/identity/Auth/session/MFA/AAL/capability change; no new sensitive fields, secret/environment changes, real provider/model requests, provider activation, payment, external terms, indexing/launch or new infrastructure cost. Existing native CI is allowed, not an alternate hosted SQL readback. No personally signed-in browser/CUA. Synthetic/local tests use blocked external networking; do not exercise real accounts or administrative mutations.

Preserve #985/#982 HOLD without inspecting held implementation as a substitute; #917 denied hosted-readback STOP; #913/#911 blocked; #968 cleanup PAUSED; #748 personal-browser SUSPENDED; #626 STOP; #937/#936 PAUSED; #934 HARD-BLOCKED; #944 no autostart; #585 deferred; #960 separate; #957 dormant. Official Truth OFF, noindex/prelaunch, Production provider hard-off and USD100/month remain.

Never modify AGENTS/operating mode/workflows/rulesets, shared auth/policies, global CSS or global continuity documents. For any file not explicitly owned, STOP at that boundary and report the exact proposal to TL. Root maintains global status.

## Verification and handoff

Use the project's Node 22 runtime and existing toolchain. No OS-package installation or infrastructure provisioning. Run focused meaningful behavioral/counterexample tests, typecheck, lint, the five existing hygiene checks and production build; run the existing test command and report all failures/skips honestly. Do not add tests that merely repeat version literals or source implementation. Do not weaken existing tests to conceal a failure.

For product UI, exercise actual mounted production components with project CSS using the existing isolated audit approach, synthetic fixtures and blocked external network. Prove clicks/keyboard/focus and real outcomes, not helper predicates alone. Include 320/390px, tablet and desktop, enlarged text, long content and error/recovery states. Do not ship an ungated public audit route or claim real-device/hosted acceptance.

Owned documentation prefix **docs/JETNITY_DEPENDENCY_PATCH_REMEDIATION_1**: PLAN, STATUS, REPORT, SELF_REVIEW and HANDOFF dated 2026-10-26; evidence under **docs/evidence/dependency-patch-remediation-1**. Preserve original failures and limitations. Do not publish credentials, private logs, raw personal data or browser state.

Handoff must contain actual main/head/tree/merge-base/ahead/behind, changed-file list, exact session/model, tests and browser execution provenance, checked/not-checked systems, P0/P1/P2/P3 findings, CI/Preview links when available, remaining gate and next responsible actor. A callback acknowledgement, synthetic fixture or successful build is not persistence/Production proof.

Keep this PR Draft. **STOP for independent Technical-Lead review.** Only Root may PASS, Ready and merge.  
**do not mark Ready · do not merge · do not start a follow-up slice**
