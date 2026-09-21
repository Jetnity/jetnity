# V1 Workspace Status Language 1 — Binding Task
Date: 21 September 2026
Agent: **Jetnity V1 workspace status language 1**
Branch: `fix/v1-workspace-status-language-1`

## Goal and accepted decision
Implement accepted #506 **VUX-3**, TL FINAL5269760171: P2 wording/comprehension improvement. Overview, Jetzt wichtig and flight/stay/mobility gap details repeatedly expose internal “Abdeckung / bestimmbar / Lage / Pflichtlücke” language. Present understandable status and the available next step while retaining every underlying distinction.
This is implementation of an accepted finding, not another audit. #506 closure5764730610 remains complete.

## Scope and exclusive ownership
Allowed runtime:
- `lib/trips/uebersicht.ts`: displayed status/progress strings only.
- `lib/trips/attention.ts`: ONLY coverageTitel flight/stay display strings; no other signal changes.
- `lib/trips/detail.ts`: DETAIL_LAGE_TEXT, gap fallback text and gapNaechsterSchritt strings only.
- `components/trips/TripWorkspaceDetail.tsx`: gap eyebrow/status/secondary wording only; no item-detail trust/date/booking copy change.
- `lib/trips/flug-abdeckung.ts`: ONLY strings in abschnittWort/zusammenfassungAus.
- `lib/trips/naechte-abdeckung.ts`: ONLY strings in zusammenfassungAus.
- `lib/mobility/kanten.ts`: ONLY strings in statusWort/zusammenfassungAus.

These canonical summary sources are included because bereichStatus feeds their strings into both overview and gap detail. Do not add a second formatter that parses/replaces localized strings or independently reconstructs coverage. All conditions, counts, identities, dates, order, state enums, function signatures, actions and data remain unchanged. No new shared contract.
Tests: matching existing tests for these modules; `lib/trips/arbeitsbereich.test.ts` only corresponding expected-string updates; optional NEW `lib/trips/workspace-status-language-1.test.ts` for real state distinctions/render invariants.
Own `scripts/v1-workspace-status-language-1-audit.mjs`, `docs/evidence/v1-workspace-status-language-1/`, and `docs/V1_WORKSPACE_STATUS_LANGUAGE_1_{TASK,STATUS,HANDOFF,SELF_REVIEW}_2026-09-21.md`.
Other UI, planner, routing, navigation/focus/scroll, search mount, official/safety/seasonal/readiness engines, types and persisted truth remain read-only. Do not change the accepted #520 item.date_mismatch signal or wording.

## Acceptance
1. Replace audit vocabulary on the scoped overview/attention/gap surfaces with concise natural German. Give unknown a clearly uncertain label (for example “Noch unklar”); known open/partial/selected/booked/no-needed states retain distinct meanings. Exact phrasing is an implementation detail within these constraints.
2. **Reject blanket unknown→“noch nicht gewählt”, unknown→known gap, and “Anbieter folgt”.** Only assert not selected where the existing branch proves it. A stored selection is not current availability or booking. Fully covered sections are not a whole-trip ready/booked/all-clear claim.
3. Explain uncertain flight/stay status without asserting a specific missing input unless the existing branch establishes it. Safe next-step language can ask the user to check trip data and existing entries; it cannot promise a result/provider/live check.
4. Gap header must not label every unknown or optional/covered state as a confirmed “Lücke”. Preserve optional activities, covered-by-flight mobility, lack of live mobility search and explicit-user-action search behavior in understandable wording. Never add a button/action the existing code does not offer. Preserve the existing return/focus behavior.
5. Preserve material numeric and route information, distinctions between chosen/booked entries, partial nights and known versus unknown segments. Do not shorten by discarding counts or the unresolved remainder. Do not global-replace unrelated official/safety/seasonal vocabulary.
6. Produce a compact before/after wording matrix keyed by existing machine states and representative fixtures. Regression evidence must show unchanged non-text outputs (states, counts, identities, order, actions, commercial protection); use current canonical derivations. Keep existing tests that establish commercial/date protection and unknown/unavailable/stale distinctions. No superficial source-string-only “truth proof”.
7. Narrow actual-style before/after captures at390x844 and1440x900: representative unknown/mixed overview and flight/stay gaps; known-open, partial and fully covered/optional mobility cases may use bounded representative captures rather than a full matrix. One200%-text phone check and keyboard open/back interaction confirm changed wording remains usable and no navigation regression. Known no-live-provider states remain honestly labelled; no provider/model call. Keep screenshot/simulation limits explicit.

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

Tracking issue: #525.

## Same-session correction — TL review 5271416938

Immediate review fix on reviewed head `5b80a8213fecab575ae5d47aed76ea970baa7d50`. Same agent/session/model. Only SL-R1 and SL-R2:

- **SL-R1:** `belegt` / no-required / zero-item must not claim inventory exists. Neutral wording valid for both actual coverage and not-needed. Preserve machine states, counts and explicit no-needed summaries. No localized-string parsing or new coverage derivation.
- **SL-R2:** `belegt` next-step must match offered actions. No implied mobility search when `sucheAnbietbar=false`. No implied existing entries when count may be 0.

Canonical same-place zero-item display regression is required. Recapture only affected/new representative states; unchanged screenshots keep source-equivalence. Do not extend Bestand residual or #528 paths. Main remains `4278cd047b907b218fe64c122c4eed7dd61e0a7e`. No Ready/merge/follow-up.
