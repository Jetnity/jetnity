# DiscoverCars V2 widget opt-in 1 — plan

**Date:** 29 October 2026. **Tracking:** #1083. **Draft:** #1084. **Task blob unchanged:** `f4b0996471eb67b811382c1102f88285944335e5`.

## Session

Jetnity DiscoverCars Official Search Widget V2 Opt-In 1 — Cursor Generation 1. `originalModelName=grok-4.7-high-fast`. Session `bc-1885a130-36a8-4dcf-86bc-48aa6121c24e`. https://cursor.com/agents/bc-1885a130-36a8-4dcf-86bc-48aa6121c24e. Re-read after rename, before edits. Pre-code plan: https://github.com/Jetnity/jetnity/pull/1084#issuecomment-6505019628.

## Owner correction, 29 October 2026

The Product Owner asked why the widget looked tied to Bangkok. The standard V2 search is for every supported rental destination. Suvarnabhumi (BKK) is only the old isolated Work sample and the explicit V1 radio. It is not the widget default, not a whitelist, and not applied to other trips.

Two exports stay distinct:

- **General account widget** (`jetnity`, German, CHF, responsive, pickup chosen by the visitor inside DiscoverCars): **not in the repository and not verified.** The public generator says a location can be chosen as a default. That sentence does not prove an empty or unselected pickup attribute, and this slice does not invent one.
- **BKK sample** `offizieller-widgetcode-bangkok.html`: still absent. If it arrives later it is optional reference only. Its `data-location` path is refused by the gate and is not the normal widget.

If a future official export shows that DiscoverCars requires one fixed pickup per snippet and has no general mode, activation stops. The fallback remains the existing generic V1 link. A later UX may offer only exact official snippets the visitor chooses. It must not invent location parameters or map a city to an airport.

## Source decision

**VENDOR_EXPORT_MISSING.** The repository has no general export and no `offizieller-widgetcode-bangkok.html`. The public generator page `https://www.discovercars.com/affiliate/widget`, read on 29 October 2026, shows generator chrome (“Paste these codes”, “Your affiliate code”) and does not contain Jetnity’s snippet, script URL, or attribute list. Narrative attributes from #1083 are not an export. No hash, no allowed origin, no executable vendor document. `lib/providers/discovercars/widget/vertrag.ts` keeps an empty origin list and `widgetDarfAusfuehren()` returns `false`.

## What this slice builds

An inert housing in Mietwagen, under the honest “offers are being prepared” card and above the unchanged V1 links. Normal runtime has no load button, no frame, no script, no image, and no vendor request. Copy states that vehicles, pictures, prices and availability stay on DiscoverCars, and that Jetnity does not set a pickup place.

A code-owned seam `synthetisch-nicht-anbieter` exists only when a caller passes it. `MietwagenBereich` does not. The seam mounts a labelled local text fixture after a deliberate click. It is not DiscoverCars.

## What this slice does not build

No `app/embed/discovercars` route. No vendor adapter, no Search API, no native cards, no change to `DiscoverCarsAffiliateLinks.tsx` or `lib/providers/discovercars/affiliate/**`. No PrivacyBee, package, workflow, database, or TripWorkspace edit. No production activation.

## Privacy

PrivacyBee remains a legal-page loader (`widget.js` / `imprint-widget.js` on the privacy and imprint pages). Cookie consent UI was removed earlier. A load click is not marketing consent. GYG’s opt-in pattern was read only: nothing loads before a deliberate action, and a click is not consent. Because there is no trustworthy consent state for this vendor’s third-party purposes, real activation stays stopped even after a future export arrives.

## Validation

Synthetic gate and markup tests, the existing V1 affiliate markup tests, ESLint on owned files, `tsc`, `npm run build`, and a local Playwright harness of the real components. No third-party request in that harness. Browser-chrome zoom at 200% was not run. Chromium CSS zoom was recorded separately and is not that proof.

## Residual outside this allowlist

At 320px and a 32px root font, the untouched V1 label “Flughafen Suvarnabhumi (BKK)” paints 18px past the viewport. The new widget section’s own overflow is 0. Wrapping that label needs `DiscoverCarsAffiliateLinks.tsx`, which this task keeps read-only.
