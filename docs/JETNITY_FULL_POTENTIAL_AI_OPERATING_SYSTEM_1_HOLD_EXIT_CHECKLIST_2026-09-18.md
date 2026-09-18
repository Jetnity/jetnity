# Jetnity – Dedicated HOLD→NORMAL evidence checklist

Stand: 18. September 2026  
Status: **REQUIRED CLOSURE RECORD / NOT COMPLETE / CI DOES NOT PROVE THESE FACTS**

The operating-mode guard can enforce **path shape** of a dedicated closure: authorized governance branch, base HOLD allowlist only, no product/runtime files in the same PR as a `NORMAL` flip.

The guard **cannot** prove that the external prerequisites are true. A green CI run, a `NORMAL` JSON value, or schema flags such as `requiresTenRoleExternalSetupAndVerification` are not live proof that the ten roles, routines, Evidence Bus, e2e verification, or GitHub baseline exist.

Do not change `.jetnity/operating-mode.json` to `NORMAL` until every row below is filled with verifiable evidence or an explicit Product-Owner accepted-limitation note. Attach exact SHAs, URLs, dates, and the actor who checked them.

Live OS-2 control surface for the still-open ten-role work:

`docs/JETNITY_FULL_POTENTIAL_AI_OPERATING_SYSTEM_2_EXTERNAL_SETUP_TRACKER_2026-09-18.md`

## 1. Foundation on `main`

| Prerequisite | Evidence required | Status | Evidence / limitation |
| --- | --- | --- | --- |
| PR #489 foundation merged to `main` | Merge SHA, PR URL | **verified** | PR https://github.com/Jetnity/jetnity/pull/489 merged at 2026-09-18T17:47:28Z by `Jetnity`. Merge/current main SHA `ff0df56ae32e3f28e0f9c160a40fa75de81ba133`. Accepted exact head before merge: `824e3a2f24f88140f6673b946139b5059f44d25b`. Issue #488 closed completed at 2026-09-18T17:47:30Z. Rechecked live by OS-2 writer 2026-09-18. |
| Post-merge CI on the exact merge SHA | Actions run ID + conclusion | **verified** | Push CI run `35376407897` / workflow run #1903 on exact `ff0df56ae32e3f28e0f9c160a40fa75de81ba133`: **SUCCESS**. Jobs: `Typecheck, Lint & Build` `105701998242` SUCCESS; `Auth-Konfiguration gegen config.toml` `105701999868` SUCCESS. URL: https://github.com/Jetnity/jetnity/actions/runs/35376407897. Rechecked live by OS-2 writer 2026-09-18. |
| Relevant Vercel Production evidence on that merge SHA | Deployment URL + READY | **verified** | GitHub Vercel commit status on exact `ff0df56ae32e3f28e0f9c160a40fa75de81ba133`: **success** / “Deployment has completed”. Production deployment `6529863195` environment `Production` state **success**. Vercel dashboard: https://vercel.com/jetnity-e1b93c82/jetnity-app/8KB6qrww2CVhcN5DETenZXAoK9Z5. Production URL recorded by GitHub: https://jetnity-ocbjz351n-jetnity-e1b93c82.vercel.app. Rechecked live by OS-2 writer 2026-09-18. |
| Independent Technical-Lead PASS that the repository OS is integrated | TL comment/review on the accepted head, then merge SHA | **verified** | Technical-Lead FINAL PASS comment `5733949233` on accepted head `824e3a2f24f88140f6673b946139b5059f44d25b`: https://github.com/Jetnity/jetnity/pull/489#issuecomment-5733949233. Technical-Lead post-merge verification comment `5733986499` on merge SHA `ff0df56ae32e3f28e0f9c160a40fa75de81ba133`: https://github.com/Jetnity/jetnity/pull/489#issuecomment-5733986499. This closes the repository foundation only. It does not lift HOLD. |

## 2. Ten-role external setup

| Prerequisite | Evidence required | Status | Evidence / limitation |
| --- | --- | --- | --- |
| All ten permanent Grok identities exist under their exact names | Identity list + where they live; not a Cursor claim | **verified persisted — profile #002** | Product-Owner comments through `5735008554`, Phase-1 `5735080935`, and profile #002 `5735489499`: all ten canonical responsibilities exist under their exact names. Product & UX Explorer persisted name is `Jetnity Product & UX Explorer` with no trailing period. Duplicate CoS is `Legacy Stabschef — DO NOT USE` (`5735135388`). Presence plus E2E #001 plus profile normalization does **not** complete routines or HOLD exit. |
| Approved read-only routines/schedules authorized once | Which routines, cadence, who authorized | **open — skill routine-ready / no routine created** | Private skill `Jetnity Daily Intelligence Orchestrator` is **routine-ready** after MANUAL TEST #002 (`5735700562`). TEST #001 `5735636786` required the hardening later proven on #002. No schedule. No routine created. This authorizes only the later controlled Daily Routine creation/verification layer, not HOLD exit. |
| Evidence-Bus path works | Example no-signal or material comment/handoff URL | **verified — E2E #001** | Controlled no-signal comment `5735190265` on PR #491. TEST_ID `JETNITY-EVIDENCE-BUS-E2E-001`. Path: Security & Privacy Red Team → Jetnity Chief of Staff → GitHub PR #491 → ChatGPT Technical Lead. Technical-Lead live receipt `5735209274`. One bounded transport test, not a recurring routine. |
| End-to-end verification that a no-signal run creates no work/merge/Production authority | Dated verification note | **verified — E2E #001** | Technical-Lead verification `5735209274` on live head `5edc72806c62c298c864ca77b9903f5fa7fe6cc5`: no Ready, merge, branch/task creation, routine start, code mutation or Product Development resume. HOLD unchanged. PR #487 remains parked. |
| Shared Grok environment still has no Production-admin / service-role / payment-admin / broad write tokens | Negative check recorded | **NOT CHECKED** | Phase 1 confirmed the shared Grok environment is one blast radius. This repository slice cannot independently inspect credentials. Do not invent a PASS. Next actor: Product Owner / Technical Lead with access to that environment. |
| Real platform limitation, if any | Explicit Product-Owner escalation/acceptance; do not silently drop a role | **recorded / not a role drop / profile normalization closed** | Earlier iOS save/reopen latency and stale #001 `5735410441` are superseded by mobile UI `5735465938` and persisted-profile #002 `5735489499`. Do not claim persistence is impossible. No role was dropped. This is **not** an accepted HOLD-exit substitute. |

## 3. GitHub hard-enforcement baseline

Canonical proposal: `docs/JETNITY_FULL_POTENTIAL_AI_OPERATING_SYSTEM_1_GITHUB_HARD_ENFORCEMENT_PLAN_2026-09-18.md`.

Live read-only API: https://api.github.com/repos/Jetnity/jetnity/rulesets/21875372  
HTML: https://github.com/Jetnity/jetnity/rules/21875372  
Checked by: Jetnity full-potential AI operating system 2, 2026-09-18. **No Ruleset/admin mutation was performed.**

| Prerequisite | Evidence required | Status | Evidence / limitation |
| --- | --- | --- | --- |
| Require PR before merging to `main` | Ruleset/protection screenshot or API readback | **verified** | Ruleset `21875372` `Jetnity main protection`, enforcement `active`, target include `refs/heads/main`. Rule type `pull_request` present. Allowed merge methods: `merge` only. |
| Required existing CI/status checks | Named checks | **verified** | Strict required status checks (`strict_required_status_checks_policy=true`): `Typecheck, Lint & Build` (integration 15368), `Auth-Konfiguration gegen config.toml` (integration 15368), `Vercel` (integration 8329). |
| Conversation resolution required | Readback | **verified** | `required_review_thread_resolution=true`. |
| Force push blocked | Readback | **verified** | Rule type `non_fast_forward` present. |
| `main` deletion blocked | Readback | **verified** | Rule type `deletion` present. |
| No Cursor/Guardian/Grok bypass actor | Actor list reviewed | **verified** | `bypass_actors` is empty/null. `current_user_can_bypass=never`. |
| Admin/PO bypass, if any, documented as emergency-only | Pointer to that note | **verified / none retained** | No bypass actor is configured. There is no emergency Admin/PO bypass to document. Residual: this is GitHub-enforced PR+checks, not independent review of enforcement-plane rewrites. Stronger CODEOWNERS / required-reviewer policy remains optional until a genuinely separate reviewer principal exists. |
| Accepted limitation instead of baseline | Explicit Product-Owner decision | **none unless accepted** | Not needed. Live readback matches the documented non-lockout baseline. |

Cursor must not activate these settings. This slice only recorded an already-active ruleset. Stronger CODEOWNERS / required-reviewer policy remains optional until a genuinely separate reviewer principal exists and must not deadlock a single-owner repository.

## 4. Dedicated closure shape

| Prerequisite | Evidence required | Status | Evidence / limitation |
| --- | --- | --- | --- |
| Closure PR is an authorized OS governance branch | Branch name | **open** | No dedicated HOLD→NORMAL closure PR exists. OS-2 Draft PR #491 is governance/evidence only and must **not** flip mode to `NORMAL`. |
| Head sets mode `NORMAL` and this checklist is complete | This file filled; no blank required rows | **open** | Mode remains `AI_OS_BUILD_HOLD`. Section 2 is still open / NOT CHECKED. |
| Same PR contains no product/runtime paths | `git diff --name-status -M -C` against live `main` | **open** | Not applicable until a dedicated closure PR exists. |
| Parked PR #487 is **not** unparked by this closure | Explicit non-unpark statement | **open** | Current live parked head remains `12d070a79c35fbb9f03d1302833eee8561ec17bd` (Draft / not Ready / not merged). OS-2 must not unpark it. The later closure must repeat this statement. |

## 5. Sign-off

| Role | May sign | May not |
| --- | --- | --- |
| Technical Lead | Completeness of this checklist and the dedicated closure | Pretend CI proved external facts |
| Product Owner | Accepted platform or GitHub-baseline limitation; special gates | Silent roster shrink |
| Cursor / Guardian / Grok | Supply evidence only | Ready, merge, activate Rulesets, flip mode without this record |

**Current HOLD-exit verdict: incomplete.** Repository OS-1 foundation is merged and post-merge verified. GitHub non-lockout baseline is live-verified. All ten Grok identities exist under exact persisted names. Evidence-Bus E2E #001 is verified. Profile normalization is verified complete. Daily Intelligence Orchestrator is **routine-ready** after TEST #002. No scheduled routine exists. Routine/automation verification and dedicated HOLD-exit completion remain **OPEN**. Mode stays `AI_OS_BUILD_HOLD`.
