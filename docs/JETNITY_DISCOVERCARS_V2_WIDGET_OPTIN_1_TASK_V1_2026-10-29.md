# Jetnity DiscoverCars V2 — Official Search Widget Opt-In 1 — IMMUTABLE TASK V1

**Date:** 29 October 2026, Europe/Zurich. **Tracking:** #1083. **Seed base/main:** e462cf7c5910ce75fa6350928326c04e33d94eee (DiscoverCars V1 #1059 merged), operating mode NORMAL. All older main snapshots and CI claims are historical. New branch feat/discovercars-v2-official-widget-optin-1, Draft PR created from this immutable task-only seed.

## Purpose and verified vendor rights
The Product Owner has explicitly selected the next step: a usable official DiscoverCars search widget inside existing Jetnity Trip Workspace > Organisieren > Mobilität > Mietwagen. The current V1 affiliate linkout is live on jetnity.com and MUST remain working. No new main integration or Production script activation is authorized by this task.

Independent Work DiscoverCars account audit on 29 Oct 2026: approved affiliate account, active car-rental and Full-Coverage campaigns, public affiliate id jetnity. The official widget-generator export was **successfully embedded without modification on a separate local Work test page** and a deliberate click navigated to DiscoverCars search results with data-utm-source=jetnity, data-aff-code=a_aid and outbound a_aid=jetnity. The generator's own preview produced UNKNOWN_PORTAL, whereas the separately embedded export did not. The individual new widget click was NOT conclusively matched in the partner dashboard. The displayed results were on DiscoverCars only, not native Jetnity vehicle cards; no booking, commission or sales attribution proof.

**CRITICAL CURRENT SOURCE GAP:** The submitted Work report is a narrative, NOT the exact generated HTML/script export. Prior 27-Oct Work handoff names a separate artifact offizieller-widgetcode-bangkok.html with data-location Thailand/Bangkok/Suvarnabhumi (BKK); that artifact has not been mounted, uploaded or otherwise read by this Technical Lead. A public third-party website shows a DiscoverCars widget sample, but another affiliate's code is NOT Jetnity's original account-approved export. The static historical BKK generator link is NOT a general city/location mapping. Do not invent an exact vendor script URL, required attributes, loader, dynamic destination parameters, cookie logic or commercial tracking from fragments. Obtain an independently grounded complete original snippet and note source/hash BEFORE making actual third-party script executable in any environment.

Official public references (evidence of product options, not account-specific API permission):
- https://www.discovercars.com/affiliate
- https://www.discovercars.com/affiliate/widget
- https://www.discovercars.com/affiliate-conditions
- https://www.discovercars.com/landing-page-generator
- https://pages.discovercars.com/b4b

Terms have affiliate-site approved-link rules, prohibited paid traffic and an explicit concern for missing referral URL in §3.8. No paid traffic, seller/affiliate contract modifications or new vendor outreach by the coding agent.

## Author and mandatory pre-code proof
ONE genuine new Cursor Cloud author. Logical/stored display name exactly:
**Jetnity DiscoverCars Official Search Widget V2 Opt-In 1 — Cursor Generation 1**.
Use actual originalModelName grok-4.7-high-fast, not Auto/fallback. Before editing code: read actual Cursor run-info; rename-chat if supported; re-read originalModelName, stored name, actual bcId and session URL. Verify main, branch, HEAD/tree, merge-base, mode, concurrently owned files, and the source gap. Post an independent PRE-CODE PLAN on the Draft PR with true values. If the requested model or same session details cannot be verified, STOP without editing. The @cursor ACK/footer is not proof of session/model.

## Allowed scope and implementation phases

### Phase R0: independently establish the exact vendor source or report missing
Check only authorized source locations: current repository/evidence and accessible official public generator documentation or a legitimate pre-existing account-authorized browser if genuinely available. Never demand passwords, one-time codes, API keys or personal browser files. Do not reinterpret other affiliates' sample code as an account-signed export, scrape internal APIs or recreate from observed URL parameters. If the exact full original export is NOT accessible, mark VENDOR_EXPORT_MISSING and proceed only with offline/fail-closed preparation below, then STOP. Do not silently claim that a widget is integrated.

### Phase R1: safe, testable UI preparation (may proceed if R0 blocked)
Implement one compact, opt-in widget housing within the existing MietwagenBereich under the honest unavailable car offers and/or next to the V1 affiliate links, preserving manual rental entries and full V1 CTA behavior. The UI has clear sponsor/external-website wording and a deliberate click action 'Mietwagensuche bei DiscoverCars laden'; before click there must be **zero** DiscoverCars script/frame/pixel/image/request and no network from the widget. A visible vendor search requires actual independently verified source and privacy gates; if absent, do not render a dead "load" action in normal runtime: keep the housing inert/nonactivated behind a purely code-owned non-Production test seam and preserve the existing V1 linkout for guests. Do not introduce a user-facing claim that real vehicles, prices or availability are inside Jetnity. A visitor may choose pickup, return and rental period inside vendor widget if it is actually loaded, but do not automatically transfer trip details into undocumented vendor parameters.

Prevent content carryover and stale state across trip switches, repeated visits, stage or day changes. BKK is only an explicit user-selected airport example, not a global default derived from Bangkok/Thailand. Unknown, city-only, multi-stop, cross-border, one-way and ferry contexts stay user-controlled on the vendor site. Do not infer dates, age, residence, passengers or quote. Provide loading/failed/disabled/retry and full V1 fallback states, accessible controls and keyboard focus.

If and only if R0 supplies the account-generated full verified snippet, implement the bounded provider adapter and controlled isolated embed. Use an origin allowlist, CSP/referrer no-referrer, sandbox/frame restrictions actually supported by that original widget; do not casually use srcDoc if it weakens isolation or causes attribution loss. Never load vendor JS globally or before explicit visitor action plus actual required consent. Reuse relevant existing Jetnity privacy/consent guard where compatible; an affirmative 'load widget' click is not by itself proof of legally adequate cookie consent. If current PrivacyBee setup does not provide a trustworthy consent state for the vendor's third-party purposes, STOP at opt-in nonactive preparation and document a specific privacy decision. Do not bypass consent, disable noindex or degrade app protections.

### Explicit non-scope
No DiscoverCars Search/XML/Full API, no vehicle feed or native image/price cards (unlicensed), no Widget form DOM scraping, no internal vendor endpoint calls, no booking/payment/booking mark, no widget auto-deep-link from travel profile, no external subID including private trip/customer data, no extra provider contract, API keys, new cost/infra/hosting, no account or partner settings changes. No Viator/GYG/12Go code edits, no shared rental factory/provenance/rate limiter, no TripWorkspace core, no auth/identity/MFA, no DB/SQL/RLS/Supabase, no Vercel env/domain/protection, no package/workflow changes, no global consent/banner changes without a separately approved TL contract.

### Exclusive writable paths
- components/trips/MietwagenBereich.tsx only narrow mount changes, plus new components/trips/DiscoverCarsWidgetOptin.tsx and DiscoverCars-specific siblings if needed;
- new lib/providers/discovercars/widget/** only, focused tests alongside;
- if justified and unshared, new app/embed/discovercars/route.ts (no general proxy), and scripts/discovercars-v2-widget-optin-1/** for local synthetic Playwright evidence;
- own docs/JETNITY_DISCOVERCARS_V2_WIDGET_OPTIN_1_{PLAN,STATUS,HANDOFF,SELF_REVIEW,REPORT}_2026-10-29.md.
All other paths read-only including existing DiscoverCarsAffiliateLinks.tsx, lib/providers/discovercars/affiliate/**, lib/rental-cars/**, MobilitaetBereich.tsx, GetYourGuide integration, app global layout, PrivacyBee settings, provider ops, original immutable TASK V1, shared docs/ACTIVE_WORK_STATUS, README and workflows. If the existing V1 affiliate code must change, first report the concrete minimal compatibility need and STOP for TL scope decision.

## Meaningful validation (no paid/real-provider network from normal tests)
Synthetic dependency-injected tests: zero vendor network before click; no thirdparty load at initial mount, hydration, tab switch, route change, other trip or re-render; no cross-trip leaks; exact-source/allowed-origin fail-closed, malformed/unknown/duplicated attributes blocked; no arbitrary externally supplied URL/script, no private trip ID in provider URL/referrer; failure after load gives stable V1 fallback; keyboard Tab/Space/Enter, Escape/remove focus restoration; mobile 320/390/768/1440px, root-font 200% and actual browser zoom 200% if run, no overflow, full manual rental form unaffected; no fabricated vehicle results. Use harmless local synthetic HTML asset only in UI tests and clearly label it as a fixture—not a deployed simulation of the real vendor. Browser test may use local UI-audit route only when already authorized, no real provider call, no customer data.

Run focused tests, typecheck, lint, build, original native exact-head GitHub App/Auth CI and matching Vercel Preview after push, documenting any pending jobs as pending. Include proof that V1 production behavior is unchanged. No tests silently weakened or skipped.

## Required author delivery and STOP
Precise confirmed source status (original export/hash + allowed origins, or VENDOR_EXPORT_MISSING); list of all changed files; exact final HEAD/tree/main merge-base/ahead-behind, true Cursor session/name/model; source and local synthetic UI proof, responsive snapshots, test/CI/Preview outcomes (distinguish author run from independent TL); privacy/affiliate/consent risks and remaining real hosted widget acceptance gate. Keep this PR Draft, do not mark Ready, do not merge, do not start a follow-up slice. Do not touch Production. STOP for independent Technical Lead review. This task is a bounded implementation/preparation slice, NOT an advance approval for active real vendor-widget runtime or eventual production rollout.
