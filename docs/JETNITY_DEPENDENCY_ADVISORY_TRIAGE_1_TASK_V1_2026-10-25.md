# Jetnity Dependency Advisory Triage 1 — TASK V1

Date: 2026-10-25. **Immutable Technical-Lead task.** Parent [R107 #1011](https://github.com/Jetnity/jetnity/issues/1011); tracking [#1016](https://github.com/Jetnity/jetnity/issues/1016); lane **S**.

## 1. Authority, baseline and first delivery

Cursor-Agent: **Jetnity Dependency Advisory Triage 1 — Cursor Generation 1**. Fresh genuine **Generation 1**, requested **Grok 4.7 High Fast / grok-4.7-high-fast**. No Auto or silent model substitution; if unavailable, STOP and report. Attest actual runtime model, exact session ID/link and logical name. A visible UI rename is best effort and must be reported as actually done or unavailable; no invented independent UI proof.

Branch: `audit/r107-dependency-advisory-triage-1`. Base/current main at dispatch: **a74c443c6be3f064f150fcf021ab6154bda325e5**, tree **c1fe5a50b0da710ef425674057f782b1dff6f8bc**, mode NORMAL. Root verified R106 closure, actual-main CI, Production/direct domain, open work and active strict ruleset 21875372. [Root precheck](https://github.com/Jetnity/jetnity/issues/1011) and [intake](https://github.com/Jetnity/jetnity/issues/751#issuecomment-6399573707) are binding.

**FIRST DELIVERY IS PLAN ONLY.** Read this complete TASK and the relevant actual code/contracts. Commit only `docs/JETNITY_DEPENDENCY_ADVISORY_TRIAGE_1_PLAN_2026-10-25.md` in addition to this immutable TASK. The plan must provide source-confirmed design, exact file ownership, reused contracts, failure/state matrix, proof approach, costs and limits. Post actual main/head/merge-base/ahead/behind, plan link/blob, model/session/name, then **STOP before any implementation, test addition, audit execution or other document changes**. Root will independently review the exact plan head and authorize this same session. This internal TL gate requires no additional Owner confirmation.

Required reading: AGENTS.md; JETNITY_START_HERE.md; Technical-Lead/Cursor Operating Standard; current handoff and ACTIVE_WORK_STATUS; live #751/#1011; three-phase strategy; V1 binding build order; Multi-Agent Slice Planning Standard; relevant existing contracts/tests. Earlier dated pending/current markers are historical snapshots. R106 is completed and must not be reopened.

## 2. Goal and source-confirmed need

Produce a complete, source-bound dependency risk and minimal-remediation decision packet for the exact current package graph. This is an independent **read-only audit**, not a package-upgrade implementation task.

Actual-main installation in run 40202059080 reported **11 vulnerabilities/advisories (2 moderate, 9 high)**. This is the historical observed baseline, not a promise that a new registry audit will return identical counts or evidence of Production exploitability.

Pinned repository inputs at a74c443c:
- package.json Git blob **e6187432cb8f224c10281b7b476bb24eb8ef1c1b**
- package-lock.json Git blob **4c64e03d16a54ae6c648dc3e40c88d6b94c5cfbe**

## 3. Exclusive allowed files and read scope

Write only this lane's named documentation/evidence paths in section 7. Optional scripts/dependency-advisory-triage-1/** may contain small read-only inventory/evidence validation scripts if the accepted PLAN justifies them. No app, library, package, lockfile, dependency override, configuration, workflow, .npmrc or installed repository dependency mutation.

Read exact package/lock entries, existing package use, build/test configuration and current authoritative primary advisory/registry/maintainer documentation needed to assess direct/transitive dependency paths. Inspect only ordinary authorized source needed for reachability. **Do not inspect held-lane implementation or use this audit as a substitute review for #985/#982, #917, #913/#911, #937/#936/#934 or other recorded held work.** Mark any affected reachability boundary NOT ASSESSED/UNKNOWN with the reason.

Allowed external reads are public official advisory/registry/maintainer metadata, through supported unauthenticated tools. No credentials, environment inventory, npmrc/token inspection, internal services, Production probing, exploit delivery or logged-in browser. No audit-time dependency installation at all: no npm/pnpm/yarn/bun install, ci, add, implicit npx downloads or equivalent installers, even with --ignore-scripts. No npm audit fix, --force, override or lockfile regeneration. Use only already available read-only tooling against unchanged pinned inputs; record the actual command and versions. The unchanged native CI installation remains part of its existing gate, not an authorization for new audit-time installation.

## 4. Required audit result

1. Independently verify both pinned input blobs and inventory all concrete direct/transitive locked/resolved package instances and dependency paths from the lockfile, including duplicates, dev/optional flags and relevant runtime constraints. A lockfile does not establish actual installation, optional-platform selection or deployment; identify separate evidence for each. Do not infer deployed reachability merely from a dependency flag.
2. Retrieve current authoritative advisory identifiers, affected and fixed ranges, publication/update/retrieval timestamps and canonical primary URLs. Preserve dated raw public evidence. If unavailable, record the exact gap; do not invent advisory IDs or classify unknown as safe.
3. Reconcile unique advisory IDs, affected package instances and npm aggregate counts. Explain changes from the observed 11 baseline, and distinguish vulnerable version evidence from actual reachable/exploitable conditions.
4. For each advisory, trace all relevant dependency paths and classify application-server, client bundle, build/CI, development-only, or unassessed exposure using actual source/config evidence. A package can occupy multiple contexts. Document preconditions and limitations without performing exploitation.
5. Keep official advisory severity separate from Jetnity-specific priority/confidence. No global “safe”, “no vulnerability”, or accepted P3 downgrade without evidence; absence of a found import is not proof of absence.
6. Produce a minimal ordered remediation proposal per affected path: concrete candidate fixed version or upstream dependency change supported by current official evidence; compatibility/runtime/Next-React coupling constraints; exact package/lock/consumer files likely affected; expected tests and residual risk.
7. Group fixes that must be atomic and separate unrelated updates. Prefer the smallest responsible change; no mass “latest everything” plan, automatic major upgrade, stack change or framework replacement.
8. Flag a supported P0/P1 finding immediately to root in the existing PR, with exact source/advisory evidence and affected scope. Implementation remains unassigned until root allocates a precise fix; this audit does not self-authorize it.
9. End with a concrete triage table and bounded next-step decision packet. “Untriaged” must only be removed for rows whose evidence was actually assessed. Held or unavailable facts remain open.

## 5. Acceptance and evidence

- Exact source/head and package/lock SHA256/Git blob binding, original command/version/exit evidence, and before/after tracked status proving no package or runtime mutation.
- Complete current advisory/package-instance matrix with direct/transitive paths, primary citations, version-range reasoning, deployment-context evidence and explicit unsupported inferences.
- Distinguish tool failure, network unavailability, missing metadata and non-applicability. No rerouting a denied action.
- Read-only evidence validation for completeness/duplicate identifiers/links/hash consistency; meaningful original outputs retained after sanitization. No credential-bearing registry configuration or personal system paths in public evidence.
- Assessment is about the audited package graph at this head. Later lockfile changes invalidate it. Sibling runtime changes may change reachability and must be flagged for integration recheck.
- Native project checks remain necessary for merging the report branch. This report is not a security clearance, Production penetration test or permission to resume held lanes.


## 6. Multi-Agent Suitability and frozen boundaries

Decision: **MULTI_AGENT**. Five independent lanes on one verified main: T traveller snapshot, W World visits, M My Trips collection/archive, D Admin user directory, S dependency advisory triage. This lane owns only its exact allowlist above and its named delivery files. All others are read-only dependencies. Shared contracts do not change silently. If an unlisted file or contract is truly necessary, describe the narrow need to TL and STOP at that boundary; do not alter the TASK yourself.

Integration priority **T → S → D → W → M**. Do not merge or cherry-pick sibling branches. Do not automatically merge/rebase new main into this branch: report drift and wait for the TL's explicit same-session integration instruction. Every new head requires fresh acceptance. Product-facing work must keep existing premium/mobile-first tokens and semantics.

Preserve #985/#982 scoped HOLD, including no retry/rephrase/reroute/substitute review or held-implementation inspection; #917 denied hosted-readback STOP (hosted UNKNOWN, Stage 2 NOT_ATTEMPTED; no alternate query/apply/connector/operator/manual-SQL route); #913/#911 block; #968 legacy Preview cleanup PAUSED; #748 personal-browser/CUA SUSPENDED; #626 STOP; #937/#936 PAUSED; Bern #934 HARD-BLOCKED; #944 no autostart; #585 deferred; #960 separate; #957 dormant.

No hosted DB operations, schema/migration/RLS/grant changes, Auth/AAL/session/identity expansion, new sensitive passport/MRZ/biometric/health fields, secret/protection modification, provider activation or paid call, payment, contract/legal acceptance, launch/indexing or new paid service. Existing prelaunch/noindex and USD 100 monthly infrastructure boundary remain. Routine repository and synthetic local development operations within this task are authorized. A denied action must not be bypassed.

No edits to global continuity/governance/ROADMAP/DECISIONS/ARCHITECTURE/DESIGN_SYSTEM, package files, lockfiles, workflows, operating mode or broad shared types unless explicitly included above. In this batch none of those global changes is allocated. Root owns consolidated continuity. Findings outside scope are reported with evidence and severity, not silently fixed.

## 7. Implementation/audit deliverables after TL PLAN acceptance

- Only named runtime/proof paths above and this lane's documentation:
  - `docs/JETNITY_DEPENDENCY_ADVISORY_TRIAGE_1_PLAN_2026-10-25.md`
  - `docs/JETNITY_DEPENDENCY_ADVISORY_TRIAGE_1_STATUS_2026-10-25.md`
  - `docs/JETNITY_DEPENDENCY_ADVISORY_TRIAGE_1_REPORT_2026-10-25.md`
  - `docs/JETNITY_DEPENDENCY_ADVISORY_TRIAGE_1_SELF_REVIEW_2026-10-25.md`
  - `docs/JETNITY_DEPENDENCY_ADVISORY_TRIAGE_1_HANDOFF_2026-10-25.md`
- Proof runners, if allowed above: `scripts/dependency-advisory-triage-1/**`.
- Sanitized audit evidence (identify retrieved official metadata separately from any synthetic validator fixtures): `docs/evidence/dependency-advisory-triage-1/**`, with source/head/dirty-state binding, exact commands, exit codes, versions, test totals, stubs, screenshots where relevant, and honest failed/aborted/skipped limits. No real user data, credentials, raw sensitive platform responses, node_modules or reproducible bundle bulk.
- Never relabel pure/source/synthetic/mocked evidence as hosted, authenticated, native-device, full-router, SQL/RLS or Production evidence. A refresh request does not prove causal readback. A local operation guard does not prove atomicity or exactly-once writes.
- Product lanes must run meaningful focused regressions and actual-component interaction/CSS evidence as specified, then ordinary project Typecheck, lint, all five hygiene guards, production build and tests. Existing native App/Auth/Vercel gates are required; do not alter gates or use skipped work as a pass. Record local environment failures honestly. The read-only audit lane runs its specific evidence validation and the normal native docs gates; it does not introduce runtime tests mirroring its report.
- The two established conditional browser skips, 181 existing lint warnings, 11 previously reported untriaged dependency advisories, guest cross-tab non-atomicity and full-unmount limits are existing evidence limits, not new successes or globally accepted security clearance.

## 8. Mandatory STOP and handoff

At the next agreed delivery boundary, push only to the existing assigned branch/PR and report exact main/head/tree/merge-base/ahead/behind, full changed-file list, model/session/name, executed evidence, failed or skipped checks, open P0/P1/P2/P3 findings and remaining limits.

**Do not mark Ready. Do not merge. Do not close tracking issues. Do not write main. Do not start a follow-up slice.** Keep this TASK byte-identical. Self-review is not Technical-Lead PASS. Only root TL makes acceptance/Ready/merge decisions. An immediate CHANGES REQUIRED fix stays with this same original author/session; a changed head invalidates every previous exact-head gate.
