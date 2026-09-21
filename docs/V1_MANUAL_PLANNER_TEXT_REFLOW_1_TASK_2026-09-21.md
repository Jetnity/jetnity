# V1 Manual Planner Text Reflow 1 — Binding Task
Date: 21 September 2026
Agent: **Jetnity V1 manual planner text reflow 1**
Branch: `fix/v1-manual-planner-text-reflow-1`

## Goal and accepted residual
Fix the proven horizontal overflow on /planen with oversized text. #524 review5270762282, comparison/closure5766049962 and TL FINAL5270901970 established a **pre-existing** residual: at390x844, html font-size32px, clientWidth390 / scrollWidth403 / overflow13px on both baseline1103407b and capture76414940. #524 correctly preserved this limitation; that task is completed.
Source evidence: `docs/evidence/v1-manual-planning-entry-1/audit-compare-200.json` and compare200 images. New bounded repair, new Generation1; do not reopen the old manual-entry session.

The measured budget label/control is wider than its inner form space, but the exact CSS cause is NOT yet proven. First reproduce at current baseline with instrumentation, then fix only the demonstrated local cause. Negative sr-only bounds in the prior report do not establish a separate skip-link defect.

## Scope and exclusive ownership
Allowed runtime:
- `components/trips/TripPlanner.tsx`: classes/layout wrappers ONLY. Preserve all handlers/state/ref/validation/submission/create/prefill logic and all field meanings.
- `components/ui/feld.tsx`: ONLY minimal layout/wrapping correction IF reproduction proves its shared label/error/grid sizing is causal and a planner-local className solution is inadequate. Record why; inspect representative normal/long-label/error consumers for regression. No semantic/API/logic change.
Own optional `lib/trips/manual-planner-text-reflow-1.test.ts` only for meaningful executable behavior; `scripts/v1-manual-planner-text-reflow-1-audit.mjs`; `docs/evidence/v1-manual-planner-text-reflow-1/`; `docs/V1_MANUAL_PLANNER_TEXT_REFLOW_1_{TASK,STATUS,HANDOFF,SELF_REVIEW}_2026-09-21.md`.

Read-only: /planen page composition, PlanenEinstiegNavigation, PlanenCreateGate, Reiseidee, shared header/layout/globals, place search, form validation/actions/create/storage and every sibling copy path. If reproduction proves another component is causal and these allowed paths cannot repair it, return the concrete causal evidence and smallest requested ownership expansion to TL before editing outside scope. No hiding/clipping overflow at page/body level, shrinking the user's text, truncating required labels, arbitrary fixed widths, or redesign.

## Acceptance and evidence
1. Reproduce current baseline at390x844 with html font-size32px using real compiled CSS. Record document clientWidth/scrollWidth, scrollX, relevant parent/label/control bounding boxes and computed min-width/grid/overflow/wrapping styles at initial view, manual-pointer arrival, focused budget field and after tabbing. Reset horizontal scroll explicitly when measuring root cause; don't confuse a prior auto-scroll offset with an overflowing element.
2. Fix demonstrated cause with the smallest layout change. At390 and360 phone widths under the same200%-text simulation, no page horizontal scrolling caused by the manual form; all labels, optional/error text and controls readable, keyboard focus visible. Do not clip content to fake scrollWidth.
3. Before/after evidence for the390 baseline residual; after360/390 with normal and200% text; normal1024/1440 composition remains usable. Inspect the actual images, not only DOM numbers. This is simulated oversized text, not a claim of OS zoom/hardware/Safari or full WCAG certification.
4. Exercise empty and long user input, budget numeric control, validation errors and focus navigation. Use invalid local submission only if necessary to show client validation, with all network/server mutations blocked; never create a real account/trip. Correct labels/aria linkage, Tab order and guest-active-trip gate remain intact.
5. Preserve #524 manual pointer visibility/target focus and idea-first order. Focusing/editing/navigation must not submit, invoke model/provider calls, mutate persisted guest bytes or bypass existing active-trip gate. Existing create-entry/form/mobile-accessibility tests remain green.
6. If shared Feld changes, document its affected consumer inventory and targeted synthetic default/long/error checks. Prefer actual browser reflow proof over source-string or implementation-mirroring tests.

## Binding workflow, baseline and boundaries
Read JETNITY_START_HERE.md, AGENTS.md, current operating mode, TL operating standard, Multi-Agent Operating System and Slice Planning Standard, design/product/continuity standards and V1 binding build order before editing. Live evidence wins over historical snapshots.
Baseline main: **4278cd047b907b218fe64c122c4eed7dd61e0a7e**. TL live preflight: NORMAL; main push CI35645868567, Auth106486052753 and TLB106486053197 SUCCESS with every step successful; direct Production dpl_5WQ7ibwxQppWzXc5hBAhiKiSVQ1m READY at exact main, aliasError null; main unresolved toolbar threads0. Ruleset21875372 active/strict, no bypass. Latest closure: #512 comment5766417746. Completed #516/#517/#518/#520/#522/#524 and audits/specs #506/#509/#510 remain closed; do not restart their sessions.
Required model **Cursor Grok 4.6 High Fast**, no Auto/substitution. New logical task, **Generation1**. Record actual session and model; unavailable stays unavailable. Use exact assigned logical name in all receipts; rename UI session only if supported and actually performed. Immediate review fixes use this exact session.
No database/schema/migration/Auth/RLS/secret, traveller credential/readiness contract, storage/adoption/create mutation, provider/model/paid call, real signup/account, payment, Production-setting, public-launch or reserved PO gate crossing. No dependency/package/lockfile/workflow/design-token changes, global continuity rewrite or new general audit. Use disposable synthetic browser data; block/intercept all external provider/model requests and label simulation. Never bypass access restrictions.
Run relevant existing tests and required typecheck/lint/tests/hygiene/build. Capture narrowly targeted actual browser evidence with compiled product CSS/preflight; no approximate styles. Each image must bind exact clean product SHA/tree, capture timestamp, browser AND version, viewport, route/state, simulation class and action sequence. Blank/unpainted images fail evidence. Distinguish static rendering, synthetic browser and live authenticated evidence; no unsupported hardware/Safari/whole-site/E2E claims.
Deliver own TASK/STATUS/HANDOFF/SELF_REVIEW, evidence, changed-path manifest, risk assessment, limitations and exact next owner. Freeze substantive source/docs once. Final main/head/ahead-behind, actual model/session, CI/Auth/direct Preview/threads and STOP receipt go in PR comment to avoid bookkeeping head churn. Read main before freeze and report drift; no autonomous sibling merge/rebase. TL authorizes integration boundaries. New head invalidates prior gates.
**STOP FOR INDEPENDENT TECHNICAL-LEAD CODE AND VISUAL/INTERACTION REVIEW. Do not mark Ready. Do not merge. Do not start a follow-up slice.** TL alone may Ready/merge after independent review and complete exact-head gates. Special PO gates remain.

## Multi-Agent Suitability
Operating Mode NORMAL; no special PO gate crossed.
**Decision: MULTI_AGENT across two independent PRs; SINGLE_AGENT within each.**
- **Jetnity V1 workspace status language 1** owns the named coverage/status copy sources, gap labels and their tests/evidence.
- **Jetnity V1 manual planner text reflow 1** owns only manual-planner layout, narrowly justified shared Feld layout and its tests/evidence.
Separate branches from the same baseline; no shared runtime write paths or new domain contracts. Each consumes existing data/state contracts unchanged and can be reviewed independently. Extra writers within either task would add collision risk without benefit.
**TL integration order: workspace status language first, manual planner text reflow second.** This is an integration sequence, not an implementation dependency. After the first merge TL assesses drift and authorizes one integration boundary for the remaining same session.
TA-R3 Foundation-E degraded honesty is NOT part of either task: its account mapper currently expands absent child arrays from legacy fields, whereas canonical empty arrays stay empty. A warning alone would not prevent consumers using incomplete credentials. It needs a separately versioned read-state/consumer contract; do not change traveller/readiness types here or treat absent relations as empty data. Broader guest-storage legacy normalization and further Admin runtime remain undispatched.
Guardian risk assessment: bounded presentation with unchanged state/selection/Truth contracts, independently reviewed by TL; no external Guardian run required at dispatch. Reassess any discovered material Truth/Auth risk. Guardian is the separate PO app, never this Cursor writer.

Tracking issue: #527. Parallel status-language issue #525 / Draft PR #526.

## TL review amendment — 5271421930 (same session)

Reviewed head `f768db932f6d0517d54af9e20b624520124e6011`. Same writer/session; do not integrate main; #526 remains first TL slot and read-only.

**RF-R1 / P2 — 360 oversized-text ownership expansion.**  
TL authorizes the smallest layout/class-only change in `components/trips/PlanenEinstiegNavigation.tsx` and, only if causally necessary after that change, `components/trips/Reiseidee.tsx` to repair the demonstrated 360×800 / html-font-size-32px pointer/idea min-content overflow (observed 22px page overflow; pointer cut at the viewport edge). Preserve pointer href, focus, reduced-motion, hash, create gate, idea-first order, and all form/state/provider/model/create logic. No page/header/global CSS or overflow clipping. This supersedes the earlier read-only boundary for those two files only.

**RF-R2 / P3 — matched visible baseline evidence.**  
Historic `before_before_text-200_390x844_budget.png` is not budget proof (it shows the idea form). Capture one matched 390/200% budget-before from exact unmodified baseline `4278cd047b907b218fe64c122c4eed7dd61e0a7e` with compiled CSS, focused `#feld-budget` visible, scrollX reset, plus a matching corrected after. Bind 360 pointer before/after to those actual sources. Label historic captures as historic. No whole-audit recapture required.

**RF-R3 / P3 — tests and mutation blocking.**  
Remove `lib/trips/manual-planner-text-reflow-1.test.ts` (source-string / implementation-mirroring). Existing semantic tests plus browser geometry/interaction evidence remain the proof. The audit must actually abort/block unexpected mutation requests, including same-route `POST /planen` server actions, before any invalid-submit rerun. Logging alone is not blocking. Safe local Next internals may be explicitly accounted for. Report attempts versus completed calls honestly. No real mutation is authorized.
