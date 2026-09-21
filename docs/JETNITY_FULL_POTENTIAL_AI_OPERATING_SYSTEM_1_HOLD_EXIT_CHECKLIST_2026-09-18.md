# Jetnity – Dedicated HOLD→NORMAL evidence checklist

Stand: 21. September 2026  
Status: **FILLED FOR DEDICATED CLOSURE PR #492 / NORMAL PROPOSED ON THIS BRANCH / LIVE MAIN REMAINS HOLD UNTIL TL MERGE / CI DOES NOT PROVE THESE FACTS**

The operating-mode guard can enforce **path shape** of a dedicated closure: authorized governance branch, base HOLD allowlist only, no product/runtime files in the same PR as a `NORMAL` flip.

The guard **cannot** prove that the external prerequisites are true. A green CI run, a `NORMAL` JSON value, or schema flags such as `requiresTenRoleExternalSetupAndVerification` are not live proof that the ten roles, routines, Evidence Bus, e2e verification, or GitHub baseline exist.

Do not treat this filled record as live-main HOLD exit until Technical-Lead exact-head PASS, Ready/Merge of PR #492, and separate post-merge verification. Every row below is filled with verifiable evidence or an explicit Product-Owner accepted-limitation note.

Live OS-2 control surface:

`docs/JETNITY_FULL_POTENTIAL_AI_OPERATING_SYSTEM_2_EXTERNAL_SETUP_TRACKER_2026-09-18.md`

Dedicated closure record:

`docs/JETNITY_FULL_POTENTIAL_AI_OPERATING_SYSTEM_2_HOLD_CLOSURE_STATUS_2026-09-21.md`

## 1. Foundation on `main`

| Prerequisite | Evidence required | Status | Evidence / limitation |
| --- | --- | --- | --- |
| PR #489 foundation merged to `main` | Merge SHA, PR URL | **verified** | PR https://github.com/Jetnity/jetnity/pull/489 merged at 2026-09-18T17:47:28Z by `Jetnity`. Merge/current main SHA `ff0df56ae32e3f28e0f9c160a40fa75de81ba133`. Accepted exact head before merge: `824e3a2f24f88140f6673b946139b5059f44d25b`. Issue #488 closed completed at 2026-09-18T17:47:30Z. Rechecked live by OS-2 writer 2026-09-18. |
| Post-merge CI on the exact merge SHA | Actions run ID + conclusion | **verified** | Push CI run `35376407897` / workflow run #1903 on exact `ff0df56ae32e3f28e0f9c160a40fa75de81ba133`: **SUCCESS**. Jobs: `Typecheck, Lint & Build` `105701998242` SUCCESS; `Auth-Konfiguration gegen config.toml` `105701999868` SUCCESS. URL: https://github.com/Jetnity/jetnity/actions/runs/35376407897. Rechecked live by OS-2 writer 2026-09-18. |
| Relevant Vercel Production evidence on that merge SHA | Deployment URL + READY | **verified** | GitHub Vercel commit status on exact `ff0df56ae32e3f28e0f9c160a40fa75de81ba133`: **success** / “Deployment has completed”. Production deployment `6529863195` environment `Production` state **success**. Vercel dashboard: https://vercel.com/jetnity-e1b93c82/jetnity-app/8KB6qrww2CVhcN5DETenZXAoK9Z5. Production URL recorded by GitHub: https://jetnity-ocbjz351n-jetnity-e1b93c82.vercel.app. Rechecked live by OS-2 writer 2026-09-18. |
| Independent Technical-Lead PASS that the repository OS is integrated | TL comment/review on the accepted head, then merge SHA | **verified** | Technical-Lead FINAL PASS comment `5733949233` on accepted head `824e3a2f24f88140f6673b946139b5059f44d25b`: https://github.com/Jetnity/jetnity/pull/489#issuecomment-5733949233. Technical-Lead post-merge verification comment `5733986499` on merge SHA `ff0df56ae32e3f28e0f9c160a40fa75de81ba133`: https://github.com/Jetnity/jetnity/pull/489#issuecomment-5733986499. This closes the repository OS-1 foundation only. |
| OS-2 governance/evidence merged and post-merge verified | Merge SHA, TL PASS, post-merge CI | **verified** | PR https://github.com/Jetnity/jetnity/pull/491 merged 2026-09-21T07:35:32Z by `Jetnity`. Accepted head `37beea87daad00706e08ec6470f6b29ce40493aa`. Merge/current main `780210f47ec1085e6dd995a7aef80d16bfeafa8c`. Issue #490 closed. TL FINAL integration PASS `5756999582`. Post-merge verification PASS `5757035124`: CI `35573688546` SUCCESS; Typecheck/Lint/Build `106250627770` SUCCESS; Auth `106250627925` SUCCESS; exact merge-SHA GitHub Vercel status success. Not Production-data or product-UI smoke proof. Checked by OS-2 writer 2026-09-21. |

## 2. Ten-role external setup

| Prerequisite | Evidence required | Status | Evidence / limitation |
| --- | --- | --- | --- |
| All ten permanent Grok identities exist under their exact names | Identity list + where they live; not a Cursor claim | **verified persisted — profile #002** | Product-Owner comments through `5735008554`, Phase-1 `5735080935`, and profile #002 `5735489499`: all ten canonical responsibilities exist under their exact names. Product & UX Explorer persisted name is `Jetnity Product & UX Explorer` with no trailing period. Duplicate CoS is `Legacy Stabschef — DO NOT USE` (`5735135388`). Presence is **not** ten-role operational FINAL. Checked actor: Product Owner / CoS; recorded by OS-2 writer. |
| Approved read-only routines/schedules authorized once | Which routines, cadence, who authorized | **satisfied with accepted operational limitations** | Daily V2 ACTIVE at canonical Europe/Zurich times (`5741925172`). Weekly ACTIVE Monday 08:30 (`5742253536`). Guardian event routine enabled (`5742304439`). Weekly Path A INSTALLED-SOURCE PASS `5745439900` (`5e77164e7f0858886d1c4523d31f81f46cffe9d235918ed8d49c0cb9634beb18`). Sep20/Sep21 Daily and Sep21 Weekly output-consistency PASSes with run-scoped provenance limitations (`5748343178`, `5756712854` decision 1). `native_scheduled_pass=false`. Gate remains `scheduled_only_provisional` / scheduled=true / live_manual=false / SHA256 `f6490963c0fe5aefd917cafb2c4704c05f3f7fceb3611901d9496d6cef20293d`. Chat/push is provisional BEST EFFORT (`5756712854` decision 2). Native archive proof remains false (`5756712854` decision 3). Conditional writers remain manual/interactive only. Matrix: `docs/JETNITY_FULL_POTENTIAL_AI_OPERATING_SYSTEM_2_ACCEPTANCE_MATRIX_2026-09-20.md`. Checked actor: Technical Lead / Product Owner; recorded by OS-2 writer 2026-09-21. |
| Evidence-Bus path works | Example no-signal or material comment/handoff URL | **verified — E2E #001** | Controlled no-signal comment `5735190265` on PR #491. TEST_ID `JETNITY-EVIDENCE-BUS-E2E-001`. Path: Security & Privacy Red Team → Jetnity Chief of Staff → GitHub PR #491 → ChatGPT Technical Lead. Technical-Lead live receipt `5735209274`. One bounded transport test, not a recurring routine. |
| End-to-end verification that a no-signal run creates no work/merge/Production authority | Dated verification note | **verified — E2E #001** | Technical-Lead verification `5735209274` on live head `5edc72806c62c298c864ca77b9903f5fa7fe6cc5`: no Ready, merge, branch/task creation, routine start, code mutation or Product Development resume. HOLD unchanged at that time. PR #487 remained parked. |
| Shared Grok environment still has no Production-admin / service-role / payment-admin / broad write tokens | Negative check recorded | **SATISFIED BY EXPLICIT ACCEPTED LIMITATION — not verified absence** | Technical class remains UNAVAILABLE / NOT CHECKED. Product Owner accepted this visibility gap on 2026-09-21 (`5757763756`) after proposal `5757736391`. Shared-host inventory `PERMISSION_INVENTORY.json` SHA256 `9c09c415ed23ba1a8e42c199e00688dd299440dc9f8f34d34aa207fe5720f7f3` (PO-forwarded; Cursor did not read Grok disk). Absent connectors/env names are partial negatives only. Secret-file contents were deliberately not inspected. Shared-host credential/ACL isolation is NOT CHECKED; profile rules are not hard isolation. Separate GitHub evidence: TL-observed fine-grained PAT **Jetnity Grok Guardian**, settings record `19785513` (`5757572020`): Jetnity/jetnity only; READ actions/code/commit statuses/deployments/metadata; READ+WRITE issues/PRs; no user permissions; expiration NOT VERIFIED. PO confirmed OWNER_CONFIRMED binding (`5757736391`); metadata-only CoS binding report SHA256 `ab72cfa692dde49e170703382f10553eb2b1c223087c2977930e5f631155bf70` remains historical UNAVAILABLE. Scoped issue/PR writes are disclosed, not blanket read-only. MCP tool-catalog presence is not effective-permission proof. No new access, secret inspection, write probe or future blanket credential approval. Checked actors: Product Owner + Technical Lead; recorded by OS-2 writer 2026-09-21. |
| Real platform limitation, if any | Explicit Product-Owner escalation/acceptance; do not silently drop a role | **recorded / no role dropped / later visibility limitation accepted** | Earlier iOS save/reopen latency and stale #001 `5735410441` are superseded by mobile UI `5735465938` and persisted-profile #002 `5735489499`. No role was dropped. Additional HOLD-closure limitation: residual Production-admin / service-role / payment-admin / isolation visibility (`5757763756`). Operational limitations `5756712854` remain: Sep21 provenance THIS RUN ONLY; chat/push BEST EFFORT; native archive proof deferred. |

## 3. GitHub hard-enforcement baseline

Canonical proposal: `docs/JETNITY_FULL_POTENTIAL_AI_OPERATING_SYSTEM_1_GITHUB_HARD_ENFORCEMENT_PLAN_2026-09-18.md`.

Live read-only API: https://api.github.com/repos/Jetnity/jetnity/rulesets/21875372  
HTML: https://github.com/Jetnity/jetnity/rules/21875372  
Checked by: Jetnity full-potential AI operating system 2, 2026-09-18; Technical-Lead re-read 2026-09-21 (`5756999582` / HOLD-closure task); Cursor API confirm 2026-09-21 (`enforcement=active`, `bypass_actors=null`). **No Ruleset/admin mutation was performed.**

| Prerequisite | Evidence required | Status | Evidence / limitation |
| --- | --- | --- | --- |
| Require PR before merging to `main` | Ruleset/protection screenshot or API readback | **verified** | Ruleset `21875372` `Jetnity main protection`, enforcement `active`, target include `refs/heads/main`. Rule type `pull_request` present. Allowed merge methods: `merge` only. |
| Required existing CI/status checks | Named checks | **verified** | Strict required status checks (`strict_required_status_checks_policy=true`): `Typecheck, Lint & Build` (integration 15368), `Auth-Konfiguration gegen config.toml` (integration 15368), `Vercel` (integration 8329). |
| Conversation resolution required | Readback | **verified** | `required_review_thread_resolution=true`. |
| Force push blocked | Readback | **verified** | Rule type `non_fast_forward` present. |
| `main` deletion blocked | Readback | **verified** | Rule type `deletion` present. |
| No Cursor/Guardian/Grok bypass actor | Actor list reviewed | **verified** | `bypass_actors` is empty/null. `current_user_can_bypass=never`. Reconfirmed 2026-09-21. |
| Admin/PO bypass, if any, documented as emergency-only | Pointer to that note | **verified / none retained** | No bypass actor is configured. There is no emergency Admin/PO bypass to document. Residual: this is GitHub-enforced PR+checks, not independent review of enforcement-plane rewrites. Stronger CODEOWNERS / required-reviewer policy remains optional until a genuinely separate reviewer principal exists. |
| Accepted limitation instead of baseline | Explicit Product-Owner decision | **none unless accepted** | Not needed. Live readback matches the documented non-lockout baseline. |

Cursor must not activate these settings. This slice only recorded an already-active ruleset. Stronger CODEOWNERS / required-reviewer policy remains optional until a genuinely separate reviewer principal exists and must not deadlock a single-owner repository.

## 4. Dedicated closure shape

| Prerequisite | Evidence required | Status | Evidence / limitation |
| --- | --- | --- | --- |
| Closure PR is an authorized OS governance branch | Branch name | **filled — proposed on #492** | Draft PR https://github.com/Jetnity/jetnity/pull/492 on `governance/full-potential-ai-operating-system-2-hold-closure`. Class `governance/full-potential-ai-operating-system-` plus exact branch recorded. Seed `163502d7`. Same existing writer session `bc-36b222c4-88a8-43ed-8c4a-a0f5ade7491c`. |
| Head sets mode `NORMAL` and this checklist is complete | This file filled; no blank required rows | **filled on this branch — live main still HOLD** | This head proposes `.jetnity/operating-mode.json` `mode=NORMAL`. Live `main` remains `AI_OS_BUILD_HOLD` until TL Ready/Merge and post-merge verification. Every required row above is filled. |
| Same PR contains no product/runtime paths | `git diff --name-status -M -C` against live `main` | **filled — verify on exact head** | Closure-only governance/continuity/evidence/enforcement-metadata paths under the base HOLD allowlist. No `app/`, `components/`, `lib/`, `hooks/`, `supabase/`, `types/` or `public/` changes. Reviewer must re-run the name-status on the exact persist SHA. |
| Parked PR #487 is **not** unparked by this closure | Explicit non-unpark statement | **filled / still parked** | Live parked head remains `12d070a79c35fbb9f03d1302833eee8561ec17bd` (Draft / not Ready / not merged). This closure does **not** resume, Ready or merge #487. Later integration requires a separate independent Technical-Lead review. |

## 5. Sign-off

| Role | May sign | May not |
| --- | --- | --- |
| Technical Lead | Completeness of this checklist and the dedicated closure | Pretend CI proved external facts; claim live main already exited HOLD before merge |
| Product Owner | Accepted platform or GitHub-baseline limitation; special gates | Silent roster shrink |
| Cursor / Guardian / Grok | Supply evidence only | Ready, merge, activate Rulesets, flip live main without this record |

**Current HOLD-exit verdict: filled as a dedicated-branch proposal.** Repository OS-1 and OS-2 foundations are merged and post-merge verified. GitHub non-lockout baseline is live-verified. All ten Grok identities exist under exact persisted names. Evidence-Bus E2E #001 is verified. Profile normalization is verified complete. Approved routines exist with explicit accepted operational limitations. Residual credential/role-isolation visibility is SATISFIED BY EXPLICIT ACCEPTED LIMITATION `5757763756`, not verified absence. `native_scheduled_pass` remains false. `native_material_archive_proof` remains false. Path B DECLARED residuals and original serialized ordering remain explicit. #487 remains parked. This branch proposes `NORMAL`. Live main remains `AI_OS_BUILD_HOLD` until Technical-Lead Ready/Merge of PR #492 and separate post-merge verification. Cursor does not Ready or merge.
