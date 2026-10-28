# Viator S2 native activities — STATUS

28 October 2026. Draft #1079. Not Ready. Not merged.

## State

The Aktivitäten search uses Viator only when the sandbox guard is open. Missing `VIATOR_SANDBOX_API_KEY` or `VIATOR_SANDBOX_CALLS`, and Production, stay unavailable. No example offers are substituted.

Runtime destination resolution loads `GET /destinations`. A place matches a CITY or TOWN only through a COUNTRY ancestor whose English name equals Jetnity `landName`. Destination records have no invented country code. `lookupId` is stored and is not treated as an ISO code. Unknown hierarchy and duplicate names stay unresolved.

A live check always sends a supported display currency. CHF is sent when the trip currency is the labelled CHF flow. Any other supported trip currency is sent under that code. An unsupported trip currency asks for a choice and does not show a current price. The request omits `productOptionCode` for a product with no titled option, and never sends `TG1` or `DEFAULT` as a stand-in. Several start times stay unselected until the visitor chooses one. A season without `endDate` is a hint through 384 days from the check clock, not availability.

Live Sandbox HTTP remains BLOCKED. No secret was read. No Vercel login was requested. DiscoverCars and Trip Workspace were not edited.

## Checks

Focused Viator unit tests passed, including currency, standard product, horizon, and country-ancestor cases. The browser harness passed at 320, 390, 768, and 1440. It selected Morgentour by its title, sent CHF with option `TG1` and start time `10:00`, and discarded a late 111 after the date changed. Text enlargement set the document root font to 32px. That is not browser zoom. Exact-head CI for this contract correction starts on push and is not claimed here. Earlier CI does not cover this head.

## Still blocked

Real Sandbox calls, image license, checkout currency, and hosted acceptance. No Ready. No merge.
