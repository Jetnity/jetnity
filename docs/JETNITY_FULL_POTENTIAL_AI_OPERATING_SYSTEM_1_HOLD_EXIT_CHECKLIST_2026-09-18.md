# Jetnity – Dedicated HOLD→NORMAL evidence checklist

Stand: 18. September 2026  
Status: **REQUIRED CLOSURE RECORD / NOT COMPLETE / CI DOES NOT PROVE THESE FACTS**

The operating-mode guard can enforce **path shape** of a dedicated closure: authorized governance branch, base HOLD allowlist only, no product/runtime files in the same PR as a `NORMAL` flip.

The guard **cannot** prove that the external prerequisites are true. A green CI run, a `NORMAL` JSON value, or schema flags such as `requiresTenRoleExternalSetupAndVerification` are not live proof that the ten roles, routines, Evidence Bus, e2e verification, or GitHub baseline exist.

Do not change `.jetnity/operating-mode.json` to `NORMAL` until every row below is filled with verifiable evidence or an explicit Product-Owner accepted-limitation note. Attach exact SHAs, URLs, dates, and the actor who checked them.

## 1. Foundation on `main`

| Prerequisite | Evidence required | Status | Evidence / limitation |
| --- | --- | --- | --- |
| PR #489 foundation merged to `main` | Merge SHA, PR URL | **open** | |
| Post-merge CI on the exact merge SHA | Actions run ID + conclusion | **open** | |
| Relevant Vercel Production evidence on that merge SHA | Deployment URL + READY | **open** | |
| Independent Technical-Lead PASS that the repository OS is integrated | TL comment/review on the accepted head, then merge SHA | **open** | |

## 2. Ten-role external setup

| Prerequisite | Evidence required | Status | Evidence / limitation |
| --- | --- | --- | --- |
| All ten permanent Grok identities exist under their exact names | Identity list + where they live; not a Cursor claim | **open** | |
| Approved read-only routines/schedules authorized once | Which routines, cadence, who authorized | **open** | |
| Evidence-Bus path works | Example no-signal or material comment/handoff URL | **open** | |
| End-to-end verification that a no-signal run creates no work/merge/Production authority | Dated verification note | **open** | |
| Shared Grok environment still has no Production-admin / service-role / payment-admin / broad write tokens | Negative check recorded | **open** | |
| Real platform limitation, if any | Explicit Product-Owner escalation/acceptance; do not silently drop a role | **none unless escalated** | |

## 3. GitHub hard-enforcement baseline

Canonical proposal: `docs/JETNITY_FULL_POTENTIAL_AI_OPERATING_SYSTEM_1_GITHUB_HARD_ENFORCEMENT_PLAN_2026-09-18.md`.

| Prerequisite | Evidence required | Status | Evidence / limitation |
| --- | --- | --- | --- |
| Require PR before merging to `main` | Ruleset/protection screenshot or API readback | **open** | |
| Required existing CI/status checks | Named checks | **open** | |
| Conversation resolution required | Readback | **open** | |
| Force push blocked | Readback | **open** | |
| `main` deletion blocked | Readback | **open** | |
| No Cursor/Guardian/Grok bypass actor | Actor list reviewed | **open** | |
| Admin/PO bypass, if any, documented as emergency-only | Pointer to that note | **open** | |
| Accepted limitation instead of baseline | Explicit Product-Owner decision | **none unless accepted** | |

Cursor must not activate these settings. Stronger CODEOWNERS / required-reviewer policy remains optional until a genuinely separate reviewer principal exists and must not deadlock a single-owner repository.

## 4. Dedicated closure shape

| Prerequisite | Evidence required | Status | Evidence / limitation |
| --- | --- | --- | --- |
| Closure PR is an authorized OS governance branch | Branch name | **open** | |
| Head sets mode `NORMAL` and this checklist is complete | This file filled; no blank required rows | **open** | |
| Same PR contains no product/runtime paths | `git diff --name-status -M -C` against live `main` | **open** | |
| Parked PR #487 is **not** unparked by this closure | Explicit non-unpark statement | **open** | |

## 5. Sign-off

| Role | May sign | May not |
| --- | --- | --- |
| Technical Lead | Completeness of this checklist and the dedicated closure | Pretend CI proved external facts |
| Product Owner | Accepted platform or GitHub-baseline limitation; special gates | Silent roster shrink |
| Cursor / Guardian / Grok | Supply evidence only | Ready, merge, activate Rulesets, flip mode without this record |

**Current HOLD-exit verdict: incomplete.** Mode stays `AI_OS_BUILD_HOLD`.
