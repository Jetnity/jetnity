# Intelligent Admin Model Usage Attention 1 — binding implementation task

Date: 2026-09-22
Issue: #537
Status: TL SELECTED / IMPLEMENT ONLY AFTER EXPLICIT CURSOR DISPATCH
Baseline: main@fb4c9ece0a139e2ceebc85dcba35effd0bb5ceee
Branch: feat/intelligent-admin-model-usage-attention-1
Cursor-Agent: Jetnity intelligent admin model usage attention 1
Generation: 1 of this new slice (not a restart of completed #518)
Required model: Cursor Grok 4.6 High Fast. No Auto or silent substitution; report unavailable and STOP.

## 1. Authority and fresh binding precheck

Product Owner requested on 2026-09-22: leave today's failed Daily, await tomorrow, check the next Cursor tasks and start them. Scheduled TL monitoring remains disabled. This task does not resume the Daily or any scheduled monitor.

Read first JETNITY_START_HERE.md, AGENTS.md, TL/Cursor Operating Standard, Binding Slice Precheck, Multi-Agent Slice Planning Standard, V1 Binding Build Order, the latest #512 comments, and the accepted #510 Foundation decision/source matrix/runtime task and #518 final closure.

Live baseline reconstruction by TL:
- NORMAL / normalProductSlices allowed; special PO gates unchanged.
- #518 first System Health analyst merged, accepted head 1965160e9cbde28b20ce9a13bb6584b220604802, final TL review 5270326377, closure 5765509162.
- Subsequent product fixes through #536 are merged; main fb4c9ece.
- Exact-main push CI 35678774235 completed success; direct Production dpl_2QPvS4N6A2ywNfjnRYuffGtwCwna READY, exact main, production target.
- Ruleset 21875372 active. Open PR inventory before this task: historical Drafts #52/#50/#40/#39/#28 only. Complete 186-branch inventory contains no model-usage attention writer.
- Prior #518 logical agent/session bc-d984b8d4-cc45-4889-96ec-2a10599881c4 is completed/STOP, not reused for a new slice. No direct Cursor UI-wide visibility is claimed; repository dispatch and STOP receipts are the available session evidence.
- Accepted #506 UX and #509 Trip/Account repairs are complete; do not duplicate them.

Selection rationale: TL Operating Standard §3a permits ordinary bounded follow-up selection in NORMAL without a new special PO gate. Accepted Foundation RUNTIME_TASK §10 and Source Matrix §2 explicitly name model-usage as the next separate snapshot. This task selects that optional existing-source follow-up now under V1 §9 Admin cost/operations visibility. It adds no Full Admin D–K programme or V1 launch prerequisite. The older #512 comment 5770309075 correctly records closure of the previous task queue; its categorical "only PO-gated work remains" conclusion is refined by this source-backed ordinary follow-up selection. No special gate is lifted by generic start authorization.

## 2. Concrete user outcome

An entitled Admin can see on the existing home whether recorded model-usage evidence is readable, missing, stale or unavailable, with one link to the existing Provider & Kosten page. A failed read must not look like zero spend. The home must not require visiting a separate board to discover this evidence gap.

Implement the small working product change, not another general audit or a specification-only substitute.

## 3. Current source contract — independently read on exact baseline

Reuse lib/admin/provider-ops-board/runtime.ts: ladeProviderOpsBoardFuerSeite().
The collector returns ProviderOpsBoardBericht. Select ONLY the unique item id model-usage; discard the other three parent items and all their checks.
The existing read selects only created_at,kosten_mikro_usd from model_usage through the existing session client, newest first, at most 200 rows within a rolling 30-day window. This is not all spending or a complete monthly ledger.
Collector reuse cache: process-wide 30 seconds. Model-usage evidence TTL: 120 seconds. Cache reuse does not guarantee displayed age and does not prove the current caller made the original read.
item.checkedAt is the read observation time; metadata.juengsteCreatedAt is NOT observation time. Preserve original item time; report-level checkedAt must not replace a missing item timestamp.
Raw detail can contain a backend error. Never copy it, summary, metadata, raw rows, source strings or unchecked free text to the new view/report. Use a closed Jetnity-owned copy map over validated source status/time; source identity is a fixed internal reference.
No costs, row counts or latest usage timestamps are displayed in this slice.

## 4. Exact ownership

Allowed runtime files:
- NEW lib/admin/analyst/model-usage-typen.ts
- NEW lib/admin/analyst/model-usage-insights.ts
- NEW lib/admin/analyst/model-usage-laden.ts
- NEW associated *.test.ts for the above and focused rendering
- NEW components/admin/home/AdminModellnutzungHinweis.tsx
- app/(admin)/admin/page.tsx: additive composition only, adjacent to existing AdminLagehinweise; preserve the existing health block, stats and directory
- lib/admin/ehrliche-zustaende.ts and its test: additive honest copy only if useful

Use a small dedicated report for this source rather than weakening the existing SystemHealth AnalystBericht or converting the system into a generic dashboard engine. No empty scaffolding. Import existing AdminDecision/AdminDenial/reachesDatabase/messageForDenial and existing board types/freshness helpers when they satisfy the contract.

Owned delivery docs:
docs/INTELLIGENT_ADMIN_MODEL_USAGE_ATTENTION_1_{STATUS,HANDOFF,SELF_REVIEW}_2026-09-22.md
Evidence: docs/evidence/intelligent-admin-model-usage-attention-1/

Forbidden edits:
Existing System Health/analyst source files and tests (except the new named files), provider-ops-board collector/runtime/bewertung, auth/roles/guard, API routes, middleware, database/schema/migrations, package/lockfiles/dependencies, global startup/status/build-order/governance, Homepage/Trip/Account/Guest files, Grok bots/routines.
If a forbidden/shared change is necessary, STOP at that boundary and explain it to TL.

## 5. Security, source and interaction contract

1. evaluateAdminAccess({ capability: 'betrieb-lesen', surface: 'admin-home-model-usage' }) before any board loader access. Existing evaluator includes AAL2.
2. All denied states: zero board-loader calls. Preserve exact denial; lookup-failed and aal-lookup-failed mean verification unavailable, never logged-out/empty/zero. No source observation or investigate hop.
3. Allowed break-glass: reachesDatabase is false. ZERO board-loader calls; show only an honest not-attributed/access coverage state, no DB time/status/count/cost, no cached role facts and no investigate hop. A banner alone is insufficient.
4. Only allowed role-backed access may invoke the existing loader. No service role, new query or broader privileges.
5. Collector rejection => source_failed with no fabricated source timestamp. A valid board must contain exactly one model-usage item. Missing/duplicate/malformed item => honest source/partial failure, not first-match selection or healthy fallback.
6. Closed handling for every board status:
   - available: recorded usage rows were readable, neutral coverage; never healthy finances/budget/limit enforcement.
   - empty: no recorded rows found in the bounded source read; NOT no spend or 0 USD.
   - unavailable: attention for failed source read.
   - unknown: evidence unknown; never empty.
   - foundation_only / disabled / not_configured: conservative coverage, explicitly no usable model-usage evidence; no provider activation or setup recommendation.
7. Status and freshness remain separate. Use original item.checkedAt plus explicit evaluation now and source TTL 120000. Missing/invalid/future timestamps: unknown with no fabricated age/current claim (future must not become fresh via Math.max clamp). A stale available/empty is visibly stale and cannot produce a current quiet/all-clear claim. No 30-second displayed-age SLA.
8. Process-recent attribution for actual loaded snapshots. Same cached object used by role A then B must keep original time and no "in this session" wording. Denied/break-glass derivations must never reuse a previous allowed report.
9. Bound scope copy visible: existing recorded model usage, rolling30days/max200 read; not complete spending, provider bills or global budget. No monetary totals, forecasts or thresholds.
10. One stable id / one small source card; deterministic output. Do not turn missing unrelated board parents into this source's incident. No new overall health summary combining System Health with model usage.
11. Only fixed link /admin/provider-ops labelled Provider & Kosten öffnen, kind investigate, for allowed role source states. No dynamic hrefs. No Execute/Auto/Repair/Apply/configure-token buttons.
12. writeActions=[] and modelExplanation.enabled=false. No model/provider call, polling, hidden retry, persistence or second cache.
13. Text only, escaped; no markdown-to-HTML. No raw errors, metadata, user identifiers, emails, tokens, prompts, trips or security rows anywhere in rendered/serialized report or evidence.
14. Existing Admin noindex and access shell unchanged. Preserve original #518 source scope, observation age, denial and break-glass semantics without weakening its tests.
15. Existing tokens, mobile-first, keyboard accessible, visible focus, semantic heading. Do not claim operational Copilot Pro or live monitoring.

## 6. Multi-Agent Suitability

Decision: SINGLE_AGENT for runtime.
One writer owns source derivation, permission wrapper and small composed card; these contracts are tightly coupled. A second runtime writer would cause avoidable shared rendering/type collisions. TL performed an additional independent read-only precheck; it did not implement or write project files.
No unrelated second task solely to fill slots. Future genuine disjoint slices may run separately after their own precheck.
New branch from exact main; no dependency on unmerged siblings. Merge order: this PR independently, then reevaluate. Immediate review fixes reuse its returned Cursor session.

## 7. Required evidence and acceptance

Executable tests with injected access/loader/clock and clearly synthetic fixtures:
- Each of five AdminDenials => zero loader calls, exact denial and no source facts/hop.
- Allowed break-glass => zero calls, no cached available/empty/unavailable values. Role → break-glass → denied sequence stays isolated.
- Access evaluation completes before any role loader call; allowed role uses existing source.
- All statuses distinct, especially available/empty/unavailable/unknown. No whole-budget, no-cost or activation claim.
- Missing/duplicate/malformed model-usage; unrelated items malicious or absent do not contaminate source-specific report.
- Loader throw/timeout distinct from empty; no raw error/detail or metadata serialized.
- Original item vs board timestamp divergence, boundary120s, stale, missing/invalid/future timestamp; age and visible time use one original instant; newest recorded usage time not substituted.
- A then B using identical cached snapshot => identical original time, process-recent, no session claim.
- Strict fixed link and empty writes/model disabled; source with hostile strings/HTML/errors/PII never appears.
- Existing #518 analyst/loader/render, SystemHealth, provider-ops-board, admin-access and honest-copy relevant regression suites unchanged and pass.

Run repo typecheck, owned-file lint and applicable required CI/hygiene/build gates. No skips disguised as pass.
Browser evidence: compiled actual product CSS at 320/390 and desktop, normal/200% text, visible timestamp/status, neutral empty versus unavailable/stale, keyboard focus/link, zero overflow. Record actual screenshots and source SHA. No static HTML screenshot falsely described as authenticated route evidence.
Authenticated Preview if existing authorized access is available; otherwise explicitly BLOCKED_ACCESS and use labelled synthetic component evidence (same accepted evidence class as #518). Do not request/obtain new credentials or weaken Auth to create evidence.
No Production DB/Auth/provider/model/secret/cost writes or fixture seeding. Never include credential/environment dumps.

## 8. Delivery and STOP

Before coding acknowledge exact logical name, generation, branch, baseline and actual model/session evidence in this PR. If required model unavailable, STOP; no substitution.
Implement, self-review skeptically, commit/push own allowed scope. Keep own status/handoff accurate; actual UI session rename only if capability exists, otherwise do not claim it.
Before handoff re-read origin/main; report drift/merge-base/ahead/behind. No repeated main merges or sibling integration without TL direction. Pin final exact head, changed files, executed tests, CI/Auth/Preview IDs, review threads, browser evidence classes, risks and residual limitations.
STOP FOR INDEPENDENT TECHNICAL-LEAD REVIEW.
Do not mark Ready. Do not merge. Do not start a follow-up slice.
Agent completion/self-review is not TL PASS. Any changed head invalidates earlier exact-head gates.
