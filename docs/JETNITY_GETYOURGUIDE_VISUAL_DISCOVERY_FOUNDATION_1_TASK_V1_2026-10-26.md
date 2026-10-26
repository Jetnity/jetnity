# Jetnity GetYourGuide Visual Discovery Foundation 1 — TASK V1

Date: 26 October 2026 (Europe/Zurich).
Status: immutable Technical-Lead task, authorized code-only first implementation.
Tracking: #1038. Parent: #1023, current R108 V5 product contract.
Exact writer: **Jetnity GetYourGuide Visual Discovery Foundation 1 — Cursor Generation 1**.
Required runtime: **Grok 4.7 High Fast / grok-4.7-high-fast**, not Auto.
Branch: **feat/getyourguide-visual-discovery-foundation-1**.

## 1. Authority and current baseline

The Owner clarified that both Viator and GetYourGuide must supply pictures and concrete activities inside the existing Jetnity activities surface, with clicks opening the selected provider's product. Bangkok suggestions and Panama/San Blas inspiration are examples. The Owner then authorized starting with GetYourGuide. This task is that one bounded start; no Viator dependency or automatic next slice.

Baseline main: **3a25fc15a38087190c72b49373fb2233af1f6248**.
Baseline tree: **e8e1e4da5eb3e867545563320027cf78ea4a7c1c**.
Operating mode freshly verified **NORMAL**.
R109, parent #1026 and all five original product writers are complete/STOP.

Root refreshed open PR/issue metadata: eight existing held Draft PRs, no competing activities writer; #1038 is the new tracking. Previous Docs head79e76dab436ef562b8e05c41fe633917070916b3 is 0ahead/1behind actual main, merge-base equal to that head, no remaining diff. Latest native actual-main run40365341426 is SUCCESS; its existing original-log receipt6422741200 remains authoritative (7431tests/878suites/7429pass/2conditional browser skips). Productiondpl_6aQU4wZmBFdAnJEZM6qbJ6UGDCr2 and separate jetnity.com alias are READY on exact main; last Docs Previewdpl_BxAEWf2asvPRenSAbVgRyqLvgmR2 remains READY on79e76. Main unresolved Vercel threads0, #1037 reviews0/threads0. Strict main ruleset21875372 remains enforced, merge-only, required App/Auth/Vercel checks, no bypass. No new #748 material delta at intake.

These are pre-dispatch facts, not acceptance of future code. Re-read actual main before handoff; report drift rather than merging/rebasing it without Root instruction.

## 2. Product result and precise completion boundary

Deliver a **working, independently testable GetYourGuide context and display foundation** inside Trip → Organize → Activities. It must support the later official manual activity widget and preserve city/stage versus country-inspiration truth, context ownership, explicit loading intent and safe teardown.

The current blocker is specific: no account-generated manual-widget configuration or verified private-page Analyzer/loading contract has been supplied. Public documentation does not establish its exact manual markup, SPA refresh API, country-ID contract or supported iframe isolation. **Do not guess those.**

Therefore this task must complete the useful Jetnity code now while the real application renderer/configuration remains **closed/unconfigured**. A test-only renderer with unmistakably synthetic local content proves behavior. It does not prove live pictured offers, real attribution, provider permission or a working production integration.

A generic GetYourGuide destination link alone does not satisfy the Owner's visual-offer goal and is not this task's substitute deliverable. The end-state goal remains real pictures and concrete offers; this task is the code foundation leading to it.

## 3. Mandatory reading and exact-source anchors

Read AGENTS.md, JETNITY_START_HERE.md, the Technical-Lead/Cursor operating standard, current R109 handoff, ACTIVE_WORK_STATUS, current #751 and #1023 V5; follow current live receipts over historical pending wording. Read relevant vision/architecture/decisions/roadmap/design/quality/logic/continuity and independent-review standards.

Inspect sources and relevant tests independently before writing a short PLAN:
- components/trips/AktivitaetenBereich.tsx: actual day.stageId ownership, explicit native search, stale/duplicate/adoption lifecycle; it currently returns early when days is empty.
- lib/activities/tageskontext.ts and suchlebenszyklus.ts: preserve accepted behavior.
- lib/activities/domain.ts/schema.ts/client-sicht.ts: search facts deliberately exclude affiliate/booking URLs. Do not decode opaque widget contents into ActivityOption.
- types/trips.ts: TripStage has placeId/countryCode/coordinates but not geographic type.
- lib/places/domain.ts and aktionen.ts: exact-ID ortBestaetigen(id, "ziel") returns canonical Ort. Do not use name-fallback canonicalization.
- lib/legal/ap6a-gate0-legal-foundation-inventory.test.ts: CookieConsent was intentionally removed. There is no general consent platform to reuse.
- components/legal/PrivacyBeeEinbettung.tsx: a legal-page loader, not a consent manager or a safe template for a private-workspace global third-party script.

Official inputs:
- https://partner.getyourguide.support/hc/en-us/articles/13981142981789-Widgets-101
- https://partner.getyourguide.support/hc/en-us/articles/13980983394333-How-to-install-the-Integration-Analyzer
- https://partner.getyourguide.support/hc/en-us/articles/13981143170333-FAQ-automatic-activity-widget
- https://partner.getyourguide.support/hc/en-us/articles/13981133907613-API-integration-and-requirements

Manual activity widgets support explicit location/search/specific-URL targeting and visual offers. Analyzer is mandatory for widgets. The public AUTO snippet is not a manual-widget contract; automatic content scanning is not selected. Do not download/execute provider scripts or call providers in this task.

## 4. Owned files and shared boundaries

Existing product file:
- components/trips/AktivitaetenBereich.tsx — minimal integration of the GYG block, including the no-days view. Preserve native activity search/adoption behavior.

New production modules, create only what is necessary:
- components/trips/GetYourGuideAktivitaeten.tsx
- lib/activities/getyourguide/kontext.ts
- lib/activities/getyourguide/freigabe.ts
- lib/activities/getyourguide/widget.ts
- lib/activities/getyourguide/lebenszyklus.ts (only if extraction improves clarity)
- adjacent focused *.test.ts files for those modules.

Task-owned test harness:
- scripts/getyourguide-visual-discovery-1/** — local, explicitly synthetic mounted verification; no publicly reachable test/demo route or environment bypass. Do not copy an entire application.

Task-owned documents:
- docs/JETNITY_GETYOURGUIDE_VISUAL_DISCOVERY_FOUNDATION_1_PLAN_2026-10-26.md
- docs/JETNITY_GETYOURGUIDE_VISUAL_DISCOVERY_FOUNDATION_1_STATUS_2026-10-26.md
- docs/JETNITY_GETYOURGUIDE_VISUAL_DISCOVERY_FOUNDATION_1_REPORT_2026-10-26.md
- docs/JETNITY_GETYOURGUIDE_VISUAL_DISCOVERY_FOUNDATION_1_SELF_REVIEW_2026-10-26.md
- docs/JETNITY_GETYOURGUIDE_VISUAL_DISCOVERY_FOUNDATION_1_HANDOFF_2026-10-26.md
- docs/JETNITY_GETYOURGUIDE_VISUAL_DISCOVERY_FOUNDATION_1_WORK_PACKET_2026-10-26.md

For architecture/decision/roadmap continuity, a small clearly dated additive section/pointer is authorized in ARCHITECTURE.md, DECISIONS.md and ROADMAP.md, accurately labeled code-only/inactive; preserve all pre-existing text. No broad cleanup or history rewrite. Root owns live #751/#1038 coordination.

TASK V1 is immutable. Do not edit it to match an implementation or silence tests.

Frozen: native ActivityOption/schema/ranking/factory/nachweis/konto-uebernahme and existing suchlebenszyklus behavior; native card implementation; trip model/writers/RPC/migrations; places resolver implementation; commercial provenance; provider runtime/transport/gates; Auth/RLS/admin/Official Truth; legal pages/PrivacyBee; global layout/CSS/Next config/package/lock/workflows; Root current startup docs. Existing files outside the allowlist require a concrete dependency report before editing.

This is a GYG-specific boundary, not a generic multi-provider SDK, arbitrary-HTML plugin system or new consent platform.

## 5. Destination and context contract

A. Selected-day mode:
- Use the actual selected day and its actual stage occurrence.
- Resolve canonical place identity/country/type through a narrow existing exact-ID confirmation seam when permitted. Test with injected canonical fixtures; configuration/gating must be checked before any lookup, and this task performs no hosted lookup.
- A name, trip title, coordinate or stage:<id> fallback is not provider mapping evidence.
- Bangkok city and same-name region remain distinct. Thailand is not Bangkok. Preserve repeated city occurrences.
- Missing/invalid day or absent/deleted/unassigned stage must not use stages[0] or a previous target.
- The current native area falls back from an invalid requested day ID to its first day. Preserve its frozen native behavior, but the GYG context must validate the original requested selection independently and reject an invalid ID; do not inherit that fallback through an already-resolved tag prop.

B. Country inspiration:
- Explicitly distinguish country inspiration from selected-day fit.
- A confirmed country target, or an explicit country selection supported by confirmed canonical destination facts, can allow Panama ideas without an existing San Blas stage.
- It must be usable within the existing activities area even for a trip with no dates/days.
- Do not turn Panama into Panama City. Do not infer pickup/departure/travel time/day feasibility from country membership.
- When multiple countries or unconfirmed legacy facts exist, preserve uncertainty and explicit selection rather than arbitrary first-country defaults.
- Unknown canonical facts or absent provider mapping produce honest unsupported/unavailable states, never empty-offer claims.

Keep internal operation identity (trip/stage/day/scope/generation) separate from the minimal future provider descriptor (reviewed public destination/configuration identity). No private IDs, names, itinerary text or internal URLs cross into a renderer/configuration request. Do not forward dates, party/ages or currency without an official supported contract.

## 6. Closed configuration and renderer boundary

Implement a small typed GYG-specific seam for the host lifecycle and reviewed configuration identity. **The application-selected live renderer/configuration registry remains null/empty/closed on this task, including Production.** No environment variable, URL parameter, localStorage value, browser-provided HTML/URL or mutable client flag may activate it.

Tests may inject a fake resolver/renderer only through a clearly isolated harness/dependency seam. Do not ship test offers, demo images or a fixture switch in ordinary application paths.

Do not invent manual data attributes, guessed script methods, widget destination IDs or product links. No dangerouslySetInnerHTML from arbitrary content, vendor script download/execution, DOM extraction, scraping, silent automatic-widget fallback, external image prefetch or broad image-host allowlisting. A future iframe is a candidate requiring separate evidence, not presumed safe/supported isolation.

No new general consent banner or assertion that a button alone constitutes legally sufficient consent. Model required permission/configuration as explicit future prerequisites; block loading while they are absent. Never put the Analyzer in global Account/Admin/private-trip DOM.

## 7. Lifecycle and user experience

- Existing activities area only, provider visibly identified as GetYourGuide.
- Honest product-facing wording; no developer implementation jargon.
- Distinguish unconfigured/disabled/unsupported, awaiting deliberate action, loading, failed and provider-content display states as actually supportable.
- External content may only be requested after reviewed configuration/permission and an explicit user action. No request on mount/hover/context change; a newly selected context requires a new deliberate action.
- On trip/day/stage/scope/confirmed-target changes, immediately invalidate old display and callbacks, cancel/dispose its operation, and retain no old outbound target labeled as the new destination.
- Handle repeated Bangkok → Phuket → Bangkok and repeated same-city stages; key by occurrence and operation generation, not name alone.
- Unmount/remount, permission withdrawal, renderer rejection and retries must not leak listeners, duplicate loads or revive stale content.
- A script/iframe load event proves resource load only. Never claim offer count, empty catalogue, date availability or verified attribution from onload. Without sanctioned readiness/result semantics, content remains provider-owned/opaque.
- Do not apply “Jetnity empfiehlt”, commission-neutral native ranking, selected-day availability or planning-conflict badges to unscored widget/country inspiration.
- Do not change native search availability/failure/selection results when GYG fails.
- No trip write, booking mutation or adoption callback from GYG load/referral. Saving and booking remain outside this task.

Mobile-first using existing tokens: readable at320/390px, desktop, enlarged text; keyboard reachable/retry/focus behavior and useful accessible labels. Preserve native day selection. Show missing configuration honestly if the block is visible; do not advertise live offers when it is closed.

## 8. Meaningful acceptance evidence

Use isolated local fixtures, block and record every external request, and label all artifacts synthetic. Verify actual mounted behavior, not only static strings.

Required counterexamples:
1. Canonical Bangkok city vs region; Thailand country; valid/invalid/forged/legacy/mismatched IDs/country/type.
2. Confirmed Panama country inspiration without San Blas stage and without trip.days; no inferred Panama City departure or guaranteed day fit.
3. Multiple countries, unknown target, unassigned/deleted day or stage; no implicit first-stage fallback.
4. Bangkok → Phuket → Bangkok, repeated same-city stage, changed trip; delayed resolver and delayed renderer completion after every invalidation.
5. Retry/double action/unmount/remount/permission withdrawal; exactly owned mount/dispose and no stale UI or targets.
6. Unconfigured/disabled/current Production gate: zero provider/Analyzer/image requests AND no hosted resolver request on mount, hover, day/scope switch or action.
7. Injected renderer gets only the reviewed minimal public descriptor; assert absence of trip/user/traveller/private itinerary identifiers, internal URLs and unsupported date/party/currency.
8. onload does not become available/empty/count/booking truth; separate errors from no-results and unsupported states.
9. GYG failure does not erase native results; PR#1025 stale-response/duplicate/adoption semantics regressions still pass.
10. Real mounted320/390/768/1440px and200% text, long labels, no-days and failure/retry, keyboard/focus; test image/offer content stays inside the synthetic harness. No physical-device or live-provider claims.

Run the required Node22 typecheck/lint/test/build and hygiene checks per AGENTS. Narrow test failures must not be hidden in aggregates. Report baseline lint warnings and conditional skips honestly. Do not weaken checks, add skips, change workflows/timeouts or install new infrastructure/dependencies to get green.

CI/Preview exact-head gates and Root review remain required. Native Auth CI is existing permitted workflow behavior, not a new hosted SQL/RLS acceptance claim.

## 9. Work packet — concrete missing provider evidence

Produce a short ready-to-use packet in the owned WORK_PACKET document, containing:
- Generate the official **manual activity widget** from the existing account (partner2MQHT6Z), not the automatic/city widget; supply sanitized actual generated widget and associated Analyzer snippets through the approved evidence channel.
- One Bangkok **city** configuration. One Panama/San Blas configuration using an actually supported location selection or explicit real product URLs; record country inspiration, venue and evidenced departure separately.
- Record target product links, image/title display, language/count and officially supported currency/date/party controls, if present. Do not assume controls exist.
- Establish permitted Analyzer/page scope, data flows and applicable consent plus manual widget mounting/destination-change/disposal behavior; note unknowns instead of inventing guidance.
- Do not expose credentials, bank details, account-specific remuneration or private trip content. No test purchase, API application, broad terms acceptance, live Jetnity installation or duplicate Viator inquiry.
- Separate code display, correct product/partner link, reported click and actual booking/commission proof. A URL is not commission proof.

Work remains vendor clarification/later independent review. This task does not contact Work or an external provider through a messaging tool.

## 10. Special gates, residual risks and non-scope

No hosted SQL/query/migration, new DB/schema, RLS/grants/identity/Auth/session/MFA/AAL change, secrets, provider/model calls, payments, contracts/DPA/terms acceptance, global Analyzer/consent deployment, Production provider enablement, launch/indexing or new paid services. Keep noindex/Official Truth OFF/provider and Account-proof hard-off, USD100/month.

Preserve #985/#982 HOLD; #917 denied hosted-readback STOP (UNKNOWN/Stage2 NOT_ATTEMPTED/support READY-UNSENT; no alternative connector/query/operator/credential workaround); #913/#911 blocked; #968 PAUSED; #748 personal Browser/CUA SUSPENDED; #626 STOP; #937/#936 PAUSED; #934 HARD-BLOCKED; #944 no autostart; #585 deferred; #960 separate; #957 dormant.

Existing broader dependency/Zod risks, A-P2 KPI freshness, CI timeout/retry provenance, T/U layout qualifications, held provider/Official Truth gates are not resolved by this task. No whole Phase1/Admin/Account/launch completion.

## 11. Workflow and deliverables

1. First publish actual runtime/session/logical-name evidence from observed Cursor run metadata. Required model cannot be guessed from the prompt; report a real capability blocker if unavailable. Rename visible session only if the product exposes that capability.
2. Read source/contracts, record PLAN; then implement the full authorized code foundation. Do not stop at a plan merely because actual live widget evidence is outstanding.
3. Maintain only the author PR block and owned PLAN/STATUS/REPORT/SELF_REVIEW/HANDOFF/WORK_PACKET. Preserve prior evidence and failures. State precisely what is implemented versus unconfigured/unverified.
4. Use this single existing branch and Draft PR. No sibling/main merge, rebase, new writer or new PR without TL instruction.
5. Before delivery re-read main; report exact head/tree/parent/merge-base/ahead/behind/diff/files and actual tests/build/UI/network evidence. All synthetic/live distinctions stay explicit.
6. STOP for independent Technical-Lead review. Same session handles immediate CHANGES REQUIRED. Every changed head invalidates prior gates.

**do not mark Ready**
**do not merge**
**do not start a follow-up slice**

Root alone decides FINAL PASS, Ready, merge and actual-main acceptance.
