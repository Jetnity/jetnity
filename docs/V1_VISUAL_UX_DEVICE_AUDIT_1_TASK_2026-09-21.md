# Jetnity — V1 Visual UX & Device Audit 1 — Binding Task

Date: 21 September 2026
Issue: #505
Branch: `audit/v1-visual-ux-device-audit-1`
Verified product baseline: `main@9f386d10816d7adcdaf2fcd6d3732e64f952fb50`
Agent: **Jetnity V1 visual UX device audit 1**
Generation: **1**
Required model: **Cursor Grok 4.6 High Fast** — no Auto/substitution.

## 1. Product-Owner intent and outcome

The Product Owner wants Jetnity assessed as a real visitor: where information appears, whether each area is logical, visual hierarchy, appropriate sizes, spacing, information density and an excellent experience on phones, tablets and larger screens. This is not another source-only code audit and not permission for an arbitrary redesign.

ChatGPT Technical Lead personally owns the independent visual/product evaluation, prioritization and eventual bounded repair tasks. Cursor supplies reproducible rendered-browser evidence, initial hypotheses and exact component mappings. The existing external **Jetnity Product & UX Explorer** may subsequently challenge the same evidence; it is not a new Cursor agent, and this task does not create or wake Grok bots/routines. Guardian's pending #494 security review stays separate.

First deliver a useful screenshot-backed priority report and the smallest repair scopes. Do not expand into months of planning before showing concrete usability findings. No runtime repair is authorized by this audit task.

## 2. Live precheck and topology

Verified when assigned:
- Operating mode: NORMAL; ordinary bounded work allowed.
- #492 is merged. Stale HOLD prose in START_HERE, ACTIVE_WORK_STATUS and checkpoint is historical and cannot override live mode/PR evidence. Do not repair those shared files here.
- #494 remains a Draft on `3de1d8e857a383dbf9bfb2e04f37374da552ac4a`, awaiting independent Guardian security review. It owns only its local DB proof/package script and slice docs.
- #497/#498 audit evidence and #500/#502/#504 fixes are already on this baseline; do not rebuild or reopen them blindly.
- GitHub Vercel status on the product baseline was success. TL's direct deployment lookup was unavailable/404; that does not certify a deployed target or a browser run. Establish your own source/deployment binding before calling any screen current.

**Multi-Agent Suitability: SINGLE_AGENT evidence writer, with TL independent visual review and a possible later external Product & UX Explorer challenge.** This audit may run parallel to #494 because ownership is disjoint and product code is read-only. Additional writers on shared layout/components are not authorized.

Integration order: keep this evidence PR Draft/unmerged while #494 remains frozen for Guardian, avoiding needless review-head/base churn. TL decides later merge order. Do not update, restart, rebase or comment-dispatch #494. Before final review, report live-main drift precisely. Do not silently recapture or invalidate the whole visual baseline just for unrelated docs changes.

## 3. Read and reuse before inspecting

Read current versions of:
- JETNITY_START_HERE.md and operating mode;
- AGENTS.md and Technical-Lead/Cursor operating standard;
- DESIGN_SYSTEM.md;
- docs/UX_INFORMATION_ARCHITECTURE_STANDARD.md;
- docs/PRODUCT_QUALITY_STANDARD.md;
- docs/JETNITY_V1_BINDING_BUILD_ORDER_2026-09-01.md (V1 scope takes precedence over older broad build-order readings);
- docs/V1_CORE_REGRESSION_HUNTER_1_REPORT_2026-09-21.md;
- docs/V1_LIVE_GAP_RECONCILIATION_1_REPORT_2026-09-21.md;
- current Mobile Accessibility 1 closure/evidence;
- existing workspace function-by-function and final-intelligence audit mandates.

Inspect existing `scripts/mobile-accessibility-1-audit.mjs`, `scripts/trip-workspace-ui-audit.mjs` and local-only UI audit facilities before creating temporary tooling. Reuse synthetic fixtures where possible. Do not introduce a second QA framework.

Preserve the existing brand, design tokens, green/cream direction and homepage direction. Issue #110 is a separate future intent feature, not permission to redesign the hero or build natural-language routing now. This pass is not TW-8/TW-9 closure, final homepage release, WCAG certification or a real-device acceptance.

## 4. Scope: inventory the site, deeply inspect the primary journey

### A. Coverage inventory, no silent omissions

List the actual routes/major surfaces for:
- homepage/navigation/discovery;
- existing search and provider-unavailable surfaces;
- trip creation;
- guest and account Trip Workspace;
- trip overview, ordered destinations, timeline/day/details, preparation/travellers;
- account home, trips/archive, settings/security/export/registry where present;
- existing admin home/system-health/provider-cost/security/account surfaces.

Classify each as RENDERED_CHECKED, SOURCE_ONLY, BLOCKED_ACCESS, NOT_REVIEWED or NOT_IMPLEMENTED. A login screen is not proof that the area behind login was visually checked.

### B. Deep first-pass journey

Prioritize the current **visitor -> search/trip creation -> guest Trip Workspace** journey.

Inspect at minimum:
1. Homepage initial screen, navigation opened and primary entry action.
2. Search/planning entry, place/date/traveller controls, validation and honest unavailable results without a real provider call.
3. Guest workspace in an empty/partially planned state and a complex synthetic multi-stage state.
4. Overview -> timeline/day -> item/detail/preparation navigation, returning/back/closing, long place names, multiple travellers/credential options where existing fixtures support them.
5. Loading/error/unavailable states using safe local fixture or browser interception only, explicitly labelled simulated.

Account/Admin: inspect only with existing safe local fixtures or an already-authorized synthetic session. No production session, real customer records, remote sign-up, factor/recovery action or bypass of auth. If not accessible, record the exact access gap and smallest safe later evidence step. Do not pretend this first pass covers the entire site.

## 5. Device/browser evidence

Representative viewport baselines (CSS pixels):
- 360x800 narrow phone;
- 390x844 larger phone;
- 768x1024 portrait tablet;
- 1024x768 landscape tablet;
- 1440x900 desktop;
- 1920x1080 wide desktop.

Use representative state coverage rather than brute-force every combination. Deeply exercise the primary journey at 390 and 1440, then inspect the same key screens at the remaining widths. Include keyboard-only focus, menu/dialog close/return focus, scroll/sticky behavior, text zoom and reduced motion where supported. A resized desktop browser is viewport evidence, NOT physical iPhone/Safari/keyboard/safe-area proof. List every untested browser/device explicitly.

First verify a real browser tool is available. Use screenshots plus DOM/computed-layout evidence; green tests or CSS reading do not prove visual quality. Prefer the pinned local build with existing non-production fixtures and an ephemeral browser profile. Record browser/version, dimensions, device scale, source SHA, URL, fixture and time for each capture. A moving Preview alias must not stand in for an immutable source/deployment binding.

If no usable browser is available, preserve a BLOCKED capability report and STOP; do not manufacture a visual PASS from source strings. Temporary local scripts outside the committed product are allowed for evidence collection; they must not change the audited source or be promoted into runtime.

## 6. Visual/product questions — explicit TL review criteria

For every important screen ask:
- Can a newcomer recognize location/context, current state and next useful action without interpreting internal jargon?
- Is there one clear primary task? Do cards, accent color, headings and button weight support it?
- Are hero/header/cards/dialogs too large for their value, or do controls/text become too small to understand/use?
- Do spacing and grouping explain relationships, or create unnecessary scrolling and fragmented content?
- Does desktop use width meaningfully rather than stretch text or scatter controls? Does phone adapt hierarchy rather than merely compress desktop?
- Are labels, back/save/cancel controls and state vocabulary consistent across areas?
- Is important content obscured by sticky controls, menus, nested scroll containers or a short viewport?
- Are error/empty/unknown/stale/unavailable states distinguishable and actionable?
- Does the design preserve traveller equality, source/truth boundaries and explicit user control over changes?

Separate three classes: reproducible defect; reasoned UX/design improvement; subjective preference. Size alone is not a defect: explain the user task, measured behavior and trade-off. Do not invent user-study results, conversion uplifts or competitor superiority.

## 7. Findings and tangible deliverables

Allowed new docs:
- `docs/V1_VISUAL_UX_DEVICE_AUDIT_1_REPORT_2026-09-21.md`
- `docs/V1_VISUAL_UX_DEVICE_AUDIT_1_STATUS_2026-09-21.md`
- `docs/V1_VISUAL_UX_DEVICE_AUDIT_1_HANDOFF_2026-09-21.md`
- `docs/V1_VISUAL_UX_DEVICE_AUDIT_1_SELF_REVIEW_2026-09-21.md`
- this task, only for a justified dated amendment.

Allowed evidence directory:
`docs/evidence/v1-visual-ux-device-audit-1/`

Persist a compact set of actual PNG/WebP screenshots, optional short recording and a JSON manifest. Keep evidence bounded; do not commit hundreds of duplicates or whole browser profiles. All content must be synthetic/non-sensitive, as the repository is public. No cookies/tokens, emails, real trip data, raw authenticated network responses or deployed environment values.

Report:
- sitewide coverage matrix and what was NOT checked;
- representative screenshot pairs (phone/tablet/desktop) from the same source/state;
- up to ten highest-value findings with ID, severity P0/P1/P2/P3, classification, route/state/device, exact screenshot/component, reproduction, observed vs desired behavior, user impact and confidence;
- additional findings only when materially distinct; no filler to reach ten;
- strengths worth preserving;
- concrete proposed information ordering/sizing/density corrections with rationale, not invented implementation;
- the first one to three smallest repair scopes, file ownership/dependencies, acceptance tests and any PO gate;
- a compact TL visual-review checklist and reusable evidence handoff for the existing Product & UX Explorer, without asserting that bot has executed.

When the first materially useful screens/findings are captured, publish one concise in-progress PR comment. Do not wait until every secondary surface is investigated and do not spam no-signal updates.

## 8. Hard exclusions

No committed changes to app/, components/, lib/, hooks/, types/, public/, styles/, DESIGN_SYSTEM.md, package.json/lockfiles, scripts/db/, .github/, .cursor/, .jetnity/, migrations or global continuity files. No product implementation/fixes in this audit. No competitor-driven rebrand, feature removal, new universal component system or giant redesign PR.

No deployed env changes, secrets, provider or paid model calls, remote DB/Management API, production/development writes, payments, account creation, emails or factor changes. Local synthetic guest state in a disposable browser is allowed. No new service/subscription, Grok bot, skill installation, schedule, permission or native-proof promotion.

Default remote browsing is non-mutating and anonymous. Do not use an access token or protection bypass to expand authorized visibility. Escalate access needs without asking for secrets in chat.

## 9. Evidence gates and STOP

Before handoff:
- verify committed changed-file scope;
- record audited product SHA separately from audit-doc HEAD;
- run relevant existing local browser audit/hygiene checks, with actual results and skipped items;
- fresh exact-head CI/Auth and Vercel state if ordinary repo automation runs; no green claim from previous head;
- record current main, merge-base, ahead/behind, review threads, agent name/generation/model/session;
- freeze the final head; final CI/Preview IDs belong in a PR comment, not a further evidence-only commit;
- no visual acceptance from automation alone;
- STOP FOR TECHNICAL-LEAD VISUAL/PRODUCT REVIEW.

No Ready. No merge. No follow-up slice. ChatGPT TL independently reads/screens the evidence and decides bounded repairs. No unreviewed author self-rating becomes TL or Product-Owner acceptance.

## 10. Dated amendment — 21 September 2026 — evidence transport only

Same session `bc-89494e60-e648-4519-bb84-0213d85bb04f`, Generation 1, model Cursor Grok 4.6 High Fast. No restart, recapture, redesign, finding change or product work.

Technical-Lead PNG retrieval failed as a transport problem (GitHub base64/UTF-8, fetch_blob, local download, no CI artifacts). This amendment authorizes only mechanically derived JPEG review copies inside `docs/evidence/v1-visual-ux-device-audit-1/`:

- Preserve every original PNG and original `manifest.json` / capture SHA.
- Eight named JPEG derivatives + 76-character-line `.base64.txt` + compact `review-transport.json`.
- Ordinary JPEG compression; phone native 360/390 width; desktop proportional readable width; aim ≤18 KiB; record any size exception rather than making text illegible.
- No generative edits. Strip EXIF. No secrets.
- GitHub user-image attachment only if an existing tool can produce it without new credentials or extra data upload. VM-local `/opt/cursor/artifacts` paths are not portable evidence.

Freeze after the bounded evidence commit; fresh exact-head CI/Preview in a PR comment; STOP. This does not award a visual PASS.
