# Activities Destination First 1 — Handoff

2026-11-01, Europe/Zurich. PR #1100. Sole writer now Codex, owner-authorized handover recorded in comment 6557791273. Historical Cursor session: https://cursor.com/agents/bc-b961dce1-751e-403e-ade6-52d2c56a648b. Cursor is stopped, no additional paid work. TASK V4 is the current publication direction; V1–V3 remain historical evidence.

## Resulting behavior

Organisieren → Aktivitäten opens the destination-first surface directly. A confirmed trip stage is selected even when the initial arrival day has no destination. Repeated visits retain separate stage IDs. Visitors may change destination and optionally day. Official Viator/GetYourGuide offers appear first; secondary native search stays explicit and retains the Viator API. Date-free native input has no unrelated trip-wide items. Adopting a native option still requires a real day of the selected stage. Widgets never write offers into the trip graph.

The Viator embed `/embed/viator` uses canonical public destination name, partner `P00328015`, widget `W-a3c98184-2fae-4bf6-919e-1c32bc42d788`, German and CHF. Sandbox remains `allow-scripts allow-popups allow-popups-to-escape-sandbox`, credentialless and no-referrer, without allow-same-origin. No private itinerary, travellers or dates are sent in the widget query.

## Opaque frame presentation correction

The unchanged official loader compares message origin with https://www.viator.com. In the isolated frame messages arrive as null, leaving the wrapper hidden. Its initial height can be zero; rejecting zero leaves the responsive provider with no measurable width. The owned bridge validates exact current child/source, origin null, expected `viw-` frame ID, matching wrapper, Viator HTTPS host, partner/widget path (including official de-DE variant), and finite numeric height 0..12000 before rounding. Height zero unhides the matching wrapper; later positive height drives outer sizing. Forged and removed-frame messages have no effect. No offer data is extracted for the host, and sandbox/CSP remain constrained.

Official loader hashes: widget-main.js `defb4b73526a793acca4bea3863a0d2da3c54fedafadb57c5de24b214429bca7`; widget.js `aeda2e30daff0bd54400a437a643673821f59eea2569646264c21a6092723a45`. Owned inline bridge CSP hash: `sha256-SRcRRAfLld8Awzlv8B6TdRivZ/eOaT92pb3XTnxvdww=`.

Viator attempt 7 paints actual Bangkok cards with German text/CHF at desktop and 320px. Prior six white-frame attempts remain failed historical evidence. Total 7 renders, 0 clicks, 0 HTTP403. GYG prior painted offers are separate from its actual-click HTTP403 STOP; no retry. Details and artifact paths: QA document. Neither partner parameters nor a render prove commission attribution.

## Activity-only rollout and remaining privacy work

Owner expressly deferred comprehensive privacy work and requested visible automatic offers. In the currently unreleased/absent CMP, the activity-only guard permits initial display. It does not fabricate consent or activate the shared CMP. Once a CMP is present/observed, pending, malformed, missing or negative reads block provider frames; all optional categories must be affirmatively satisfied until purpose mapping is reviewed. Event detail alone is never a grant. A negative session latch prevents losing the CMP API from silently restoring display, including after reload. Fresh reads on mount honor decisions made while Activities was closed.

Each provider can be hidden; that negative choice survives navigation and reload for the tab session, with memory fallback if storage is unavailable. Re-showing does not override a CMP refusal. Provider unmount removes the frame. The activity disclosure on the public privacy page now describes automatic loading, public context/IP transfer and these limits accurately. No legal acceptance or complete CMP/purpose classification is claimed. Shared CMP, 12Go/DiscoverCars gates, native Viator Production, environment, keys and database remain unchanged.

## Validation and release handoff

208 focused tests, typecheck, lint (0 errors), build and hygiene pass. Local full-suite environment/baseline exceptions are documented in QA. Independent review plus exact-head CI/Preview and Technical Lead release decision are still required at this revision; no Ready/Merge/Production result is asserted here. User has already authorized publication after completion, so ordinary release does not require another permission round.
