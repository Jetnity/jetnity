# Jetnity GetYourGuide Manual Widget Integration 1 — TASK V1

Date: 26 October 2026. Immutable Root task; do not rewrite this task to excuse an implementation deviation.

## 1. Authority, baseline and exact writer

Parent product contract: #1023 V5. Tracking: #1040.
Branch: `feat/getyourguide-manual-widget-integration-1`.
Baseline main: `7d52da97efc1f40fbea5c07d978c2e81e6b76659`.
Baseline tree: `608321f4a8813adf1de23c3132039d39f9c27e98`. Operating mode NORMAL.
Foundation #1038 / PR#1039 is complete, independently accepted on actual main:
https://github.com/Jetnity/jetnity/pull/1039#issuecomment-6427951360

**Sole writer: Jetnity GetYourGuide Manual Widget Integration 1 — Cursor Generation 1.**
Start one fresh genuine session for this separate slice. Do not reuse the completed foundation session.
Required runtime: **Grok 4.7 High Fast / `grok-4.7-high-fast`**, no Auto or silent model fallback. Before implementation publish actual observed runtime, metadata source, session ID/link and exact logical name. UI rename only if actually available.
Immediate review fixes later stay in this same new session.

Latest explicit Owner direction:
> wir versenden nichts wenn es nicht nötig ist. wir intergrirren es so wie es dort steht und fertig

Root decision: https://github.com/Jetnity/jetnity/issues/1023#issuecomment-6428171400
**Do not send a provider inquiry.** Written special answers are not a blanket prerequisite for the documented standard manual-widget path. This task is the Owner-requested next implementation, not an automatic agent follow-up. The previously closed foundation task remains immutable.

The instruction authorizes this bounded standard GYG widget integration, controlled real-widget tests using public/synthetic destinations, and normal Root-reviewed integration. It does not authorize new terms/contracts/API access, sensitive external data disclosure, payments, new infrastructure or unrelated providers.

## 2. Product outcome

Visitors in the existing Trip → Organize → Activities surface can explicitly load real official GetYourGuide activity widgets showing pictures, concrete offers and product-specific provider actions, using their already confirmed trip context. The provider chooses search results; Jetnity does not manufacture offers or product equivalence.

Use the documented manual search mode, generally for confirmed city/region/island/country contexts. **No Bangkok/Panama/Bali/etc. runtime allowlist, no hand-maintained example registry, no GeoNames-ID-to-GYG-ID guess.** Country inspiration remains distinctly labelled and available before day assignment; it does not assert departure point or day feasibility.

Preserve the native activities search, populated cards, pending adoption and accepted identity. GYG errors or removal must not reset or corrupt them.

## 3. Read before implementation

Read AGENTS.md and the complete Technical Lead/Cursor operating standard, current mode, vision/architecture/roadmap/decisions/design/quality/continuity standards and relevant multi-agent rules.
Read current #1023 V5 plus the Owner decision above, #1040, #751, the completed foundation actual-main receipt, and relevant current PR comments.
Inspect:
- components/trips/GetYourGuideAktivitaeten.tsx and its caller in AktivitaetenBereich.tsx;
- lib/activities/getyourguide/* and existing mounted harness;
- lib/places/domain.ts and the existing exact-ID ortBestaetigen(id, 'ziel') action; do not modify Places;
- existing privacy/legal display and removed-cookie-consent inventory.

Publish a short plan with files, data flow, provider exposure, privacy boundary, tests and actual risks before writing product code.

## 4. Actual supported evidence

Official manual-widget instructions:
https://partner.getyourguide.support/hc/en-us/articles/13981142981789-Widgets-101
Manual mode supports search terms, specific URLs or location. Generated fragment goes at the desired position, mandatory Analyzer in the document head; one Analyzer serves that document's widgets.

Analyzer instructions:
https://partner.getyourguide.support/hc/en-us/articles/13980983394333-How-to-install-the-Integration-Analyzer
Its public no-third-party-cookie statement is not a statement that no data is processed.

Received sanitized Work V2 intake:
https://github.com/Jetnity/jetnity/issues/1038#issuecomment-6425782867
The actual account-generated search fragment was:

```html
<div data-gyg-href="https://widget.getyourguide.com/default/activities.frame" data-gyg-locale-code="de-CH" data-gyg-widget="activities" data-gyg-number-of-items="3" data-gyg-cmp="jetnity_work_validation" data-gyg-partner-id="2MQHT6Z" data-gyg-q="San Blas Panama"><span>Powered by <a target="_blank" rel="sponsored" href="https://www.getyourguide.com/s/%3Fq=Panama+City&amp;lc=811&amp;et=1335095&amp;searchSource=3&amp;src=search_bar">GetYourGuide</a></span></div>
```

Actual shared Analyzer:

```html
<script async defer src="https://widget.getyourguide.com/dist/pa.umd.production.min.js" data-gyg-partner-id="2MQHT6Z"></script>
```

The q fragment has no location-id. Work also generated city/country/island location IDs and product492343, but those are test evidence, not a production catalogue. Availability-widget CHF is not an activities-widget currency contract. Portal previews remained empty; no prior real embedded success is claimed.

**Branding detail:** the generated search sample's Powered-by href points to Panama City. Do not copy that destination-specific fallback to arbitrary destinations. Keep visible official branding, using the official generic GetYourGuide homepage as a neutral branding link if needed. A branding link is never the required product-click proof. Do not alter or scrape the provider-rendered offers.

Do not invent latitude/longitude/radius/date/participants/currency attributes or initialization/refresh/destroy functions. Preserve original external script URL and supported widget attributes; campaign must be fixed and non-personal (e.g. jetnity_activities).

## 5. General destination configuration and existing foundation

Introduce an explicit typed **search configuration** distinct from the previous exact public-identifier mapping. Do not hide a search string inside oeffentlicheKennung or pretend it is a resolved GYG location ID.

Use canonical public place name and confirmed country, using existing canonical country labels/validated country code as appropriate. Never use editable trip titles, stage free text, notes, user preferences, traveller data or internal IDs. Ort.region may contain an admin1 code; do not blindly concatenate it as a region name. Preserve the type for Jetnity's explanation, not as an invented provider parameter.

Use the existing exact-ID Places confirmation where needed. The current component explicitly permits resolver/renderer only for herkunft='pruefung'; this task authorizes replacing those closed-only conditions with the real, typed application adapter. The old closed-only tests must be updated to the new meaningful boundaries, not simply deleted.

Preserve all foundation corrections: invalid requested day never falls back to the first day; unknown/conflicting country never silently becomes a chosen country; per-occurrence validation before grouping; explicit country choice without days; missing/malformed canonical country remains unconfirmed; late async resolutions and renderer completions cannot change the current context.

## 6. Small isolated document and real browser compatibility

Preferred smallest implementation: a neutral HTML Route Handler at **app/embed/getyourguide/route.ts**, with no React app layout, private metadata, authentication/database lookup or private session forwarding. It receives only the bounded public search configuration. Validate and safely escape all HTML/attribute/JSON inputs; fixed script/iframe origins and public partner ID cannot be overridden by URL input.

Each deliberate load creates a **new child document** with the official manual fragment and Analyzer once in its head. Target switch, retry, removal and unmount destroy the old document. No vendor refresh API is required. Reuse existing operation/generation ownership and abort/dispose guarantees.

Start with an opaque sandbox:
`allow-scripts allow-popups allow-popups-to-escape-sandbox`
and **no allow-same-origin** on the same origin as the private workspace. Apply the sandbox through a response CSP as well, with restrictive frame-ancestors, no-referrer and noindex headers. Parent iframe also has referrerPolicy='no-referrer'. Use an actual neutral URL containing only public query data, not a srcdoc base URL inherited from a private page.

A directly opened embed route should remain inactive and not load the Analyzer. Gate the active HTML response to the intended embedding context using Fetch Metadata and framing policy; do not describe those headers as consent or authentication. Handle invalid, duplicated, oversized and unexpected inputs without external loading.

Browser references, architecture inputs rather than a provider support claim:
- https://html.spec.whatwg.org/multipage/iframe-embed-object.html
- https://w3c.github.io/webappsec-csp/#directive-sandbox
- https://w3c.github.io/webappsec-fetch-metadata/

**Verify actual compatibility early.** Opaque sandbox may affect vendor storage/CORS. If it fails, record the specific error and successful/failed control; do not loosen same-origin isolation to gain access to private parent DOM. A separate cookiefree origin is a possible later technical remedy, not in scope for automatic DNS/deployment/domain changes. Do not stop merely because there is no written special SPA contract.

If height/loading messages are necessary, accept only the current owned iframe window, expected origin including explicitly handled opaque origin, exact small schema and bounded finite numeric values. Reject stale/wrong-frame/malformed messages. Do not accept product data, navigation commands or trip writes through this channel. Script onload/iframe onload is not proof of visible offers or an empty result.

## 7. Visitor control and private data boundary

Provide a short, accurate notice next to the load action explaining that GetYourGuide content and its Analyzer are loaded and a connection to GetYourGuide is made. Include appropriate provider privacy information. Use a clear load action and visible remove/close action.

Before the visitor's action there must be **zero provider script, iframe, image, preconnect or prefetch requests**, including initial mount, hover and context changes. Permission is local to this UI operation/context. A target/context change removes the old document and requires the intended explicit new load; do not install a global consent platform or persist a new tracking identifier.

Removing the widget ends further embedding; do not promise retroactive deletion of already sent requests/data.

The child document must not have private parent URL/referrer, trip/user/day/stage IDs, private title/notes, cookies/tokens, passport/documents, dates or participant details. Referrer suppression alone is insufficient; test parent-DOM and storage isolation. Private operations stay in the parent. Do not load Analyzer in root/account/admin layouts.

If updating Jetnity's privacy information is necessary, make a narrow factual addition for this actual integration. Do not edit externally generated PrivacyBee text, claim legal certification or accept legal agreements.

## 8. Allowed implementation paths

- components/trips/GetYourGuideAktivitaeten.tsx
- lib/activities/getyourguide/** (small typed application/search/renderer/document helpers and adjacent tests)
- app/embed/getyourguide/route.ts and adjacent bounded tests
- scripts/getyourguide-manual-widget-integration-1/** for reproducible proof; existing foundation harness only where needed to preserve/extend its checks
- app/(public)/privacy/page.tsx only for a narrow truthful integration notice if needed
- lib/legal/ap6a-gate0-legal-foundation-inventory.test.ts only if its pre-integration assertions need truthful scoped updates, never to disable privacy checks
- ARCHITECTURE.md, ROADMAP.md, DECISIONS.md: bounded current GYG additions and honest completed-foundation/current-integration state
- docs/JETNITY_GETYOURGUIDE_MANUAL_WIDGET_INTEGRATION_1_STATUS_2026-10-26.md
- docs/JETNITY_GETYOURGUIDE_MANUAL_WIDGET_INTEGRATION_1_HANDOFF_2026-10-26.md
- docs/JETNITY_GETYOURGUIDE_MANUAL_WIDGET_INTEGRATION_1_SELF_REVIEW_2026-10-26.md

Read any further path before asking Root for a concrete bounded addition; do not expand silently. The existing native caller is already wired; do not alter native ActivityOption/card/search/adoption, Trip/Places domain, database, RLS, Auth, dependencies/workflows/global styles/security headers or infrastructure.

The immutable TASK V1 and historical foundation task/handoff remain historical evidence. A new ADR may supersede the earlier closed-only decision for this explicitly authorized path without rewriting its past truth.

## 9. Meaningful acceptance and required evidence

On the exact delivered head, prove:

1. General query configuration for canonical city/region/island/country and a destination outside the Work examples; no sample runtime registry. Same-name countries, unknown/conflicting context and no-days country inspiration behave honestly.
2. Actual visible provider images and concrete offers in the real integration document, using public destination cases. Show screenshots and precise observed request provenance. Test a city, country and island/region when the provider supplies results; report actual provider empty/failure rather than inventing offers.
3. A product action from a visible offer opens that particular product with partner_id=2MQHT6Z preserved. Branding/city search clicks do not satisfy this. No checkout, test purchase, booking or commission claim.
4. Zero provider network before load; removing/target-switching/unmount disposes the current document. A→B→A, retry, multiple instances, late messages and StrictMode do not revive stale content.
5. Synthetic private canaries in parent URL/title/DOM/storage do not enter the child or captured provider requests. Parent DOM/cookie/storage access remains isolated. Use no real private user data or signed-in production trip.
6. Validation/XSS, malformed queries, direct embed navigation, spoofed/stale messages, script/iframe errors and blocked network are handled without false success/false empty claims.
7. Real mobile layout at320/390px and200% text, plus768/1440, keyboard entry/exit and actual product navigation. Verify clipping within ancestors, not only page overflow.
8. Native populated activity search/adoption survives GYG loading, retry, failure, context switch and removal.

Separate synthetic tests, real-provider observations, candidate CI/Preview and actual-main acceptance. Never relabel a local fixture as Production or an unobserved screen as successful.

Run Node22 matching CI where available; focused tests plus normal typecheck/lint/full tests/hygiene/build. Preserve exact failures and skips. Do not modify CI/timeouts or hide PostgreSQL/provider/network limitations.

Bounded live verification may load the official public widget/Analyzer and follow actual product links with synthetic/public context, as requested by the Owner. No API keys, direct private provider endpoints, scraping of product lists, provider portal mutation, outreach or personal Browser/CUA use. #748 personal-browser suspension and #917 hosted-readback STOP remain intact.

## 10. Delivery and STOP

Commit product changes and honest documents to the existing task branch and Draft PR. Before final handoff freshly read origin/main; report head/tree/parent/merge-base/ahead/behind, complete changed paths, exact commands/runtime/results, reproducible browser artifacts and observed network limits. Do not merge/rebase main or rewrite the task without Root instruction.

Publish actual Cursor model/session evidence, exact final head, remaining risks, unresolved blockers and what was not tested. No self-PASS. Keep Draft.
**do not mark Ready**
**do not merge**
**do not start a follow-up slice**

STOP for independent Technical-Lead review. Same original session handles immediate CHANGES REQUIRED. Root alone decides FINAL PASS, Ready, expected-head merge and separate actual-main CI/Production/domain acceptance. No activation claim until those checks are independently completed. Official Truth OFF, prelaunch/noindex, all unrelated holds and USD100/month remain.
