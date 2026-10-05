# Intelligent Admin Analyst Runtime 1 — Binding Dispatch Task

Date: 21 September 2026
Issue: #515
Branch: `feat/intelligent-admin-analyst-runtime-1`
Baseline: `main@19a91a2594127eb2b6104b68da69786194e13865`
Agent: **Jetnity intelligent admin analyst runtime 1**
Generation: **1**
Required model: **Cursor Grok 4.6 High Fast**, no Auto/substitution.

## 1. Phase and authority

This is the selected implementation of accepted Foundation 1 (#510), not another architecture/audit cycle. #510 merged at b27a692d after FINAL 5269339147; IA-CR1 and IA-CR2 are corrected at specification level. #506 visual audit is now also accepted/merged with post-merge verification 5764730610. This new writer must not restart either completed specification/audit session.

Read canonical START_HERE, AGENTS, mode, TL/Cursor and multi-agent standards, current Admin code and all three accepted source documents:
1. `docs/INTELLIGENT_ADMIN_COPILOT_PRO_FOUNDATION_1_DECISION_2026-09-21.md`
2. `docs/INTELLIGENT_ADMIN_COPILOT_PRO_FOUNDATION_1_SOURCE_MATRIX_2026-09-21.md`
3. `docs/INTELLIGENT_ADMIN_COPILOT_PRO_FOUNDATION_1_RUNTIME_TASK_2026-09-21.md`

The existing RUNTIME_TASK is the detailed behavior/test contract. This file fills its dispatch coordinates and makes that bounded implementation authorized through the associated TL PR dispatch. Do not rewrite the accepted specification files or interpret their old NOT DISPATCHED label as cancelling this newer explicit task. Special Product-Owner gates remain unchanged.

## 2. Useful outcome

Add one read-only `Aktuelle Hinweise` section to existing `/admin`, before AdminNaechsteSchritte. It derives useful operational attention from **SystemHealthBericht only**. Do not build another dashboard, chat, static sermon, live monitoring platform or fake Copilot.

Deterministic status and safe navigation first; `modelExplanation.enabled=false`, `writeActions=[]`. No provider/model/paid call. Copilot Pro and Execute stay unavailable/later. Explain observations, age and limits in understandable German; field names such as checkedAt are not required as user-facing jargon, but their meaning must be preserved.

## 3. Invariants from IA-CR1 / IA-CR2

- Evaluate existing `betrieb-lesen` + AAL access before ANY source load. All AdminDenial variants, including both lookup failures, mean zero loader calls and no green/empty all-clear.
- Reuse the existing process-wide System Health collector, not a new cache or source. The report is a process observation, never proof that this viewer's session executed the airports read.
- Apply the explicit break-glass projection to cached success **and failure**: no database-backed fact attributed to that grant. A banner alone fails acceptance.
- Preserve original checkedAt. Re-evaluate age/freshness using original timestamp + evaluation clock; unknown and stale remain. Collector CACHE_MS is reuse policy, not a universal maximum displayed age.
- The session-wording overlay must remain consistent with the actual observed status: a failed/unknown read cannot become a successful-read claim through templating.
- No false green app/supabase parent, no incident count/confidence/ROI invention, no unsupported recommendation. Expected not_configured is coverage, not a demand for new tokens.
- Deduplicate and deterministically order observations. Only safe next link `/admin/system-health`; no execute endpoint/action.
- Source text is untrusted display data, escaped/plain text. No executable markup, prompts or model instructions.

## 4. Exclusive write ownership

Allow only the accepted runtime task's files:
- `lib/admin/analyst/typen.ts`
- `lib/admin/analyst/system-health-insights.ts` and `.test.ts`
- `lib/admin/analyst/index.ts` only for actually used exports
- `components/admin/home/AdminLagehinweise.tsx`
- `app/(admin)/admin/page.tsx` (compose one section)
- `lib/admin/ehrliche-zustaende.ts` and optional existing `.test.ts` (additive copy)
- optional `components/admin/home/AdminLagehinweise.test.tsx`

If needed for executable gate/load tests, a small dependency-injected `lib/admin/analyst/laden.ts` and `.test.ts` are additionally allowed; no independent cache, API route or new authorization model. Prefer deleting unnecessary files/exports over scaffolding.

Own TASK/STATUS/HANDOFF/SELF_REVIEW prefix `INTELLIGENT_ADMIN_ANALYST_RUNTIME_1_` and synthetic evidence directory `docs/evidence/intelligent-admin-analyst-runtime-1/`.

#513 / PR #516 owns workspace presentation. #514 / PR #517 owns guest storage/adoption/bridge. No overlap, sibling merges or shared/global continuity edits. No changes to System Health collector/cache/guard, roles/capabilities, Security widgets, provider-ops, package/lockfile, workflows, DB/RLS/migrations, finance/Ads/Bexio/CRM or existing specification docs. Return an unexpected shared-contract dependency to TL before expansion.

## 5. Verification

Implement all required executable T-* cases in the accepted RUNTIME_TASK, including A-to-B cache provenance, role-to-break-glass, allowed-to-denied, all denial mappings, missing/invalid/older checkedAt, stale re-aging, no universal 30s claim, truthful failure, no-signal, safe hrefs, no parent green, dedupe and text escaping. A source comment is not a test. Keep existing System Health, honest-copy, navigation and relevant admin authorization contracts green; run required repo typecheck/lint/tests/build/hygiene.

Record actual render evidence at 320/390 and desktop, including attention, expected coverage, denied, stale and break-glass cases. Use synthetic dependency-injected fixtures and existing local rendering/test tools. Temporary local render harness is permitted outside committed product routes; no production backdoor or auth bypass. No real signup/login, secret use or remote account/DB probe. If authenticated Preview access is unavailable, label the actual Preview click-through BLOCKED_ACCESS and distinguish the executable synthetic component render from real authenticated route acceptance; do not loosen guards to obtain a screenshot. No blanket accessibility/real-device claim.

Keep primary explanations readable, accessible keyboard links/focus and mobile reflow using existing tokens. Avoid copying an entire System Health board into the homepage; the section should prioritize and link to existing detail.

## 6. Stop and continuity

Persist code/test evidence and limitations, exact source/head, agent name/generation/model/session. Freeze once; exact-head CI/Auth/Vercel and review-thread IDs in PR comment only, not an evidence-only head change. Re-read main and report drift; one integration at TL's chosen boundary, not repeated sibling merging.

**STOP FOR INDEPENDENT TECHNICAL-LEAD CODE / AUTHORIZATION / SOURCE-TRUTH / VISUAL REVIEW.** No Ready, merge or follow-up by Cursor. No new source, model, secrets, paid cost, Production database/feature activation or external Grok routine is authorized. All existing special PO gates remain.
