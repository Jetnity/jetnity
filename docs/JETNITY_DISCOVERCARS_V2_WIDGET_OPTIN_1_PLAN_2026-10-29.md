# DiscoverCars V2 widget opt-in 1 — plan

**Date:** 29 October 2026. **Tracking:** #1083. **Draft:** #1084. **Task blob unchanged:** `f4b0996471eb67b811382c1102f88285944335e5`.

## Session

Jetnity DiscoverCars Official Search Widget V2 Opt-In 1 — Cursor Generation 1. `originalModelName=grok-4.7-high-fast`. Session `bc-1885a130-36a8-4dcf-86bc-48aa6121c24e`. https://cursor.com/agents/bc-1885a130-36a8-4dcf-86bc-48aa6121c24e. Re-read after rename, before edits. Pre-code plan: https://github.com/Jetnity/jetnity/pull/1084#issuecomment-6505019628.

## Owner correction, 29 October 2026

The Product Owner asked why the widget looked tied to Bangkok. The standard V2 search is for every supported rental destination. Suvarnabhumi (BKK) is only the old isolated Work sample and the explicit V1 radio. It is not the widget default, not a whitelist, and not applied to other trips.

Two exports stay distinct:

- **General account widget**, verified 29 October 2026 from the Technical Lead’s exact 835-byte export, SHA-256 `5a9ea3edf4bfa5762850e0d1e6c9f5d777d860f9442fbe17bf9a76b1618cc8aa`. `data-location=""`, `data-lang="de"`, `data-currency="chf"`, `data-utm-source="jetnity"`, `data-aff-code="a_aid"`, script `https://www.discovercars.com/widget.js?v1`. Stored unaltered as `lib/providers/discovercars/widget/discovercars-widget-allgemein.html`.
- **BKK sample** `offizieller-widgetcode-bangkok.html`: still absent and not the default. Its `data-location` path is refused.

The bound export already has an empty pickup, so this slice does not stop on a missing general mode. Activation still stops because consent and the full origin list are missing. The fallback remains the existing generic V1 link.

## Source decision

**LIVE_SOURCE_VERIFIED / CONSENT_BLOCKED.** The general export above is the bound source. `widgetDarfAusfuehren()` stays `false`. PrivacyBee is only the legal-page loader. Issue #1073 is an open GetYourGuide consent decision, not clearance for this script. A click is not consent. Work saw `widget.discovercars.com` after a different load; that host plus `www.discovercars.com` is not a complete origin inventory. No `/embed/discovercars` route is added, because serving the script would be a live load. The sandbox was not weakened and the script was not fetched.

## What this slice builds

An inert housing in Mietwagen, under the honest “offers are being prepared” card and above the unchanged V1 links. Normal runtime has no load button, no frame, no script, no image, and no vendor request. Copy states that vehicles, pictures, prices and availability stay on DiscoverCars, and that Jetnity does not set a pickup place.

A code-owned seam `synthetisch-nicht-anbieter` exists only when a caller passes it. `MietwagenBereich` does not. The seam mounts a labelled local text fixture after a deliberate click. It is not DiscoverCars.

## What this slice does not build

No `app/embed/discovercars` route. No vendor adapter, no Search API, no native cards, no change to `DiscoverCarsAffiliateLinks.tsx` or `lib/providers/discovercars/affiliate/**`. No PrivacyBee, package, workflow, database, or TripWorkspace edit. No production activation.

## Privacy

PrivacyBee remains a legal-page loader (`widget.js` / `imprint-widget.js` on the privacy and imprint pages). Cookie consent UI was removed earlier. A load click is not marketing consent. GYG’s opt-in pattern was read only: nothing loads before a deliberate action, and a click is not consent. The export is now present. There is still no trustworthy consent state for this vendor’s third-party script, so real activation stays stopped.

## Validation

Synthetic gate and markup tests, the existing V1 affiliate markup tests, ESLint on owned files, `tsc`, `npm run build`, and a local Playwright harness of the real components. No third-party request in that harness. Browser-chrome zoom at 200% was not run. Chromium CSS zoom was recorded separately and is not that proof.

## Residual outside this allowlist

At 320px and a 32px root font, the untouched V1 label “Flughafen Suvarnabhumi (BKK)” paints 18px past the viewport. The new widget section’s own overflow is 0. Wrapping that label needs `DiscoverCarsAffiliateLinks.tsx`, which this task keeps read-only.
