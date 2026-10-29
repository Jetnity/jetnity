# Viator S2 native activities — STATUS

28 October 2026. Draft #1079. Not Ready. Not merged.

## State

The Aktivitäten search uses Viator only when the sandbox guard is open. Missing `VIATOR_SANDBOX_API_KEY` or `VIATOR_SANDBOX_CALLS`, and Production, stay unavailable. No example offers are substituted.

Runtime destination resolution loads `GET /destinations`. A place matches a CITY, TOWN, or ISLAND through a COUNTRY ancestor whose English name equals Jetnity `landName`. Alternate names come only from the confirmed place record passed into the resolver. The GeoNames fixture is not read. A country identity is not turned into a city. Unknown and duplicate names stay unresolved.

A live check always sends a supported display currency. CHF, EUR, and USD are sent when that is the requested display currency. An unsupported trip currency asks for a choice and does not show a current price. The request omits `productOptionCode` for a product with no titled option, and never sends `TG1` or `DEFAULT` as a stand-in. Several start times stay unselected until the visitor chooses one. `daysOfWeek` comes from each pricing record, so a Monday-only time is not offered on Tuesday. A season without `endDate` is a hint through 384 days from the check clock, not availability. Changing the date while details are still loading does not discard that load. A new activity search clears the selected Viator product.

Live Sandbox HTTP remains BLOCKED. No secret was read. No Vercel login was requested. DiscoverCars and Trip Workspace were not edited.

## Checks

Focused Viator unit tests passed, including Lisbon/Lissabon, Ko Chang, Phuket, Panama City, CHF/EUR/USD, and Monday-only times. The browser harness renders the real Aktivitäten area and passed at 320, 390, 768, and 1440. The search body carried Bangkok, TH, and CHF. A date change during loading still showed the age bands. A second search that returns no offers clears the selected product and does not request product details again. The Phuket day clears it as well. The browser harness lives under `scripts/viator-s2-native-integration/`, so the reachability check does not treat it as orphaned. A late 111 was discarded. Text enlargement set the document root font to 32px. That is not browser zoom. At that size the summary labels no longer share a box, and the day value "Bangkok erster Besuch" stays inside the section at 320 and 390. CI 40781976364 on `0603a4e3` stays a recorded failure. Exact-head CI for this commit is not claimed here.

## Still blocked

Real Sandbox calls, image license, checkout currency, and hosted acceptance. No Ready. No merge.
