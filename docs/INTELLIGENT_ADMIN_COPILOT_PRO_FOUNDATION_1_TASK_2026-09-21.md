# Jetnity — Intelligent Admin / Copilot Pro Foundation 1 — Binding Task

Date: 21 September 2026
Issue: #508
Branch: `architecture/intelligent-admin-copilot-pro-foundation-1`
Verified baseline: `main@c7fb9f0f693ba9f020add7b26a041263aa7e3b07`
Agent: **Jetnity intelligent admin copilot pro foundation 1**
Generation: **1**
Required model: **Cursor Grok 4.6 High Fast** — no Auto/substitution.

## 1. Product Owner intent and exact phase

The Product Owner reaffirmed the promised first Intelligent Admin / Copilot Pro foundation in parallel with Trip Workspace + Account revalidation. Visual UX Audit #506 does not replace this. Full Admin D–K being later-phase work does not cancel the small read-only foundation.

This is the source/capability/architecture decision and implementation-ready task, NOT runtime implementation or a second broad Admin audit. Deliver one small buildable analyst slice inside the existing Admin: explain a genuinely observed operational state, reference its evidence/freshness, prioritize the useful next investigation and disclose missing coverage. No autonomous action.

Do not claim a Copilot is built or operational merely because these documents exist. After independent acceptance, TL will separately dispatch the concrete runtime task. No extra generic planning cycle is required unless a material blocker is found.

## 2. Reuse and current evidence

Read current operating mode, TL/Cursor and multi-agent standards, V1 binding build order/DoD/release gate. NORMAL is live; #492 is merged. #494 is merged with bounded post-merge PASS in comment 5762848189. Old global HOLD text is stale, not active authority.

Reuse:
- existing Admin A–C decisions and runtime;
- `app/(admin)/admin/page.tsx` and components/admin/home/;
- `lib/admin/ehrliche-zustaende.ts`, `lib/admin/kennzahlen.ts` and `lib/admin/security-event-taxonomy.ts`;
- existing system-health/provider-cost source contracts and routes, after locating their actual paths;
- existing AdminNaechsteSchritte/current recommendation surface before proposing another one;
- current role/AAL2/capability guards, read-only error/freshness shapes and runbooks;
- #497 current gap reconciliation, #498 regression evidence, #500/#504 corrections and #494 local-only limits;
- historical Admin D–K/Growth audit and PR #40 only as historical target/evidence, never as current implementation truth.

If a named historical document is not on main, locate its historical record and label it; do not invent a file or revive an old agent. The newer V1 plan governs what must precede launch.

## 3. Multi-Agent Suitability / ownership

Overall: MULTI_AGENT, disjoint deliverables. This branch: SINGLE_AGENT specification writer.
- #506: rendered visual/device audit; no changes or repeat assignment here.
- #509 / Issue #507: Trip Workspace + Account functional revalidation; consume later as evidence, no dependency requiring a wait.
- #508: this Admin source/analysis contract and exact next implementation scope.
- TL: final product/architecture/review/integration decisions.

All three may read the same baseline. Only this slice's docs may be written. No second runtime writer, no shared contract mutation, no sibling branch merge. An unaccepted sibling report is labelled input, not canonical truth.

## 4. Source-to-insight matrix

For each candidate source establish:
- actual file/function/API/RPC and current consumer;
- semantic meaning and coverage, including what it cannot establish;
- required role/capability/current AAL and behavior on access denied;
- whether reads already exist or would introduce a new privilege/secret;
- available timestamp/freshness, window and missing/error/stale states;
- safe aggregate fields; forbidden PII/raw fields;
- concrete user-visible explanation/recommendation it can support.

Candidate areas: existing system-health results, provider/cost state, aggregate security presentation, operational counts and support/incident readiness. Select only one or two useful areas for the first runtime slice. Do NOT require all sources, live monitoring providers, real revenue or a completed account programme to begin a truthful bounded analyst.

Source configured != healthy; absent events != no incidents; a code-level provider foundation != a live provider. #494's private ledger exists only in the disposable fixture and must not be queried as a live production object.

## 5. Chosen first analyst contract

Choose one minimal architecture, not an unranked menu. Prefer deterministic derivation over existing sanitized typed snapshots for the first read-only slice. Keep a future model-explanation seam optional and disabled; there is no model/paid-call authorization here.

Specify an insight shape in the decision document, reusing existing types when possible. It should convey stable identity/category, source reference, observed state/time or honest unknown, severity/materiality, explanation of impact, limitations and a safe next navigation/investigation. Do not add a storage table to record a view of existing facts.

Hard requirements:
- Permission checks occur before aggregation; hiding a card is not authorization.
- No escalation of data access through a lower-permission summary or global cache.
- No false green/zero on denied, unavailable, stale or partially failed sources.
- No fabricated timestamps, confidence scores, incident counts or ROI.
- No-signal means no invented recommendation; stable findings deduplicate.
- Read-only navigation is allowlisted and does not execute repairs, payments, provider switches or DB operations.
- Evidence text is untrusted display data, never instructions or executable markup.
- No public indexing, browser secret, cross-user data or sensitive export.
- The existing external Grok team and in-product Copilot remain separate. No workspace credentials, automatic ingestion or new bot/routine.

Examples must be labelled synthetic design cases, not observed production incidents. Distinguish a rule-based analysis from an LLM response; do not market fake autonomous intelligence.

## 6. Concrete next runtime task

Deliver one complete but **NOT YET DISPATCHED** runtime task suitable for TL review:
- actual user problem and chosen first source(s);
- exact existing seams plus smallest new file set;
- integration into existing Admin hierarchy, not a duplicate dashboard;
- no dead Execute/Auto buttons or claim that full Copilot Pro is live;
- acceptance tests for healthy, degraded, unknown, missing, stale, partial error and access-denied inputs;
- deterministic ordering/dedupe and safe navigation tests;
- role/AAL/PII/truth boundary tests;
- responsive/keyboard/focus evidence expectations, reusing the design system;
- clear exclusions and any prerequisite that genuinely needs PO decision.

The task must be implementable without new providers, secrets, model calls, tables, roles, schedulers or remote mutations. If no meaningful safe slice exists, name the exact blocker and the smallest decision rather than inventing a placeholder foundation.

Keep full future Copilot operator capabilities, Ads/CRM/Bexio/finance/growth as a separate staged target. They are not cancelled, newly authorized or launch prerequisites by this task.

## 7. Deliverables and bounds

Allowed files only:
- this TASK (dated amendment only);
- docs/INTELLIGENT_ADMIN_COPILOT_PRO_FOUNDATION_1_DECISION_2026-09-21.md;
- docs/INTELLIGENT_ADMIN_COPILOT_PRO_FOUNDATION_1_SOURCE_MATRIX_2026-09-21.md;
- docs/INTELLIGENT_ADMIN_COPILOT_PRO_FOUNDATION_1_RUNTIME_TASK_2026-09-21.md;
- docs/INTELLIGENT_ADMIN_COPILOT_PRO_FOUNDATION_1_STATUS_2026-09-21.md;
- docs/INTELLIGENT_ADMIN_COPILOT_PRO_FOUNDATION_1_HANDOFF_2026-09-21.md;
- docs/INTELLIGENT_ADMIN_COPILOT_PRO_FOUNDATION_1_SELF_REVIEW_2026-09-21.md.

No runtime/SQL/test implementation, package/lockfile, app/components/lib/styles, global continuity, governance, schema, migration, Auth/RLS or sibling edits. No remote DB/Management API, protected user-data probe, provider/model/paid call, credential read/write, new service, account, email, payment, Ads/Bexio/CRM write or permission change. No production logging/retention activation. Existing repository automation may run normally.

## 8. Evidence and stop

Record exact audited SHA separately from docs HEAD, current main/merge-base/ahead/behind, changed paths, checked versus unchecked evidence, existing safe checks actually run, CI/Auth/Preview, open threads and agent/session/model. A docs-only CI pass is not runtime/security/browser acceptance.

Freeze head after substantive completion. Final CI/Preview IDs in PR comment only; no self-invalidating evidence commit. If main moves, record delta and let TL choose a single final integration point rather than continual rebase churn.

STOP FOR TECHNICAL-LEAD ARCHITECTURE / PRODUCT REVIEW.
No Ready. No merge. No implementation or follow-up dispatch by Cursor.

---

## 9. Dated amendment — 21 September 2026 (Generation 1)

Specification writer **Jetnity intelligent admin copilot pro foundation 1**, Generation 1, session `bc-cc0fed7b-39ba-4c81-8b39-7030dc14264c`, model Cursor Grok 4.6 High Fast, executed this task without changing §§1–8.

Delivered: source matrix, one System-Health Attention Analyst decision, complete undispatched runtime task, status, handoff, self-review. No runtime implementation. No follow-up dispatch. Head freeze and exact-head CI/Auth/Preview belong in the #510 PR comment.

---

## 10. Dated amendment — 21 September 2026 (Generation 1, IA-CR1)

Same agent/session. Independent TL review `5268850363` on `3e0d36827bd4cf7c12ae8d3d1fce4243009dfd2d` required a source-context correction.

Chosen policy: reuse the existing System Health report as a **process-recent observation** with no current-session attribution, plus an explicit break-glass projection. Denial mapping reuses `AdminDenial` and `ANALYST_DENIAL_TO_OBSERVED` (`aal-lookup-failed` → observed `lookup-failed`). Executable T-cache-* tests are specified. No runtime, no collector/guard change, no new cache/permission system, no rebase onto later main/continuity PRs.

---

## 11. Dated amendment — 21 September 2026 (Generation 1, IA-CR2)

Same agent/session. Independent TL review `5269097070` on `7a752a2410d04d79cd1b1ea2b6211196e22f3bfd` required an evidence-age correction.

`CACHE_MS = 30_000` is the existing collector’s **reuse policy**, not an unconditional displayed-age promise. Age/freshness derive from original `checkedAt` + evaluation time, including stale and missing/invalid timestamps. The general hint and mandatory limitation must not say “höchstens 30s”. Future executable cases: T-age-older-than-cache, T-age-missing-checkedAt, T-age-invalid-checkedAt, T-stale-reage (no 30s claim), T-hint-no-universal-30s. IA-CR1, break-glass projection, denial-before-load, one source, disabled model seam and no execute authority stay unchanged.

Live `origin/main` after docs-only #512 is `d3d42047ba247ded8d6c584e447db1573b80f19a`. Drift vs task baseline `c7fb9f0f` is recorded **once**. No rebase / no repeated sibling reintegration request. No runtime, no collector/cache/permissions/model/DB change.
