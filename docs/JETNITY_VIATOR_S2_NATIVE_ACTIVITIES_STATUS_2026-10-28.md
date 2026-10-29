# Viator S2 native activities — STATUS

29 October 2026, Europe/Zurich. Draft #1079. Not Ready. Not merged.

## State

The Aktivitäten search uses Viator only when the sandbox guard is open. Missing `VIATOR_SANDBOX_API_KEY` or `VIATOR_SANDBOX_CALLS`, and Production, stay unavailable. No example offers are substituted.

Runtime destination resolution loads `GET /destinations`. For Viator, `activitiesSuchen` reads the selected place only after the provider is active and the rate limit allows it. A missing id, a null read, a different id, a country mismatch, or a display name outside the confirmed names stops before product search. A matching record replaces the client name and coordinates. Browser aliases are discarded. The reader timeout and errors stay inside the search response. The GeoNames fixture is not read.

A live check always sends a supported display currency. CHF, EUR, and USD are sent when that is the requested display currency. An unsupported trip currency asks for a choice and does not show a current price. The request omits `productOptionCode` for a product with no titled option, and never sends `TG1` or `DEFAULT` as a stand-in. Several start times stay unselected until the visitor chooses one. `daysOfWeek` comes from each pricing record, so a Monday-only time is not offered on Tuesday. A season without `endDate` is a hint through 384 days from the check clock, not availability. Changing the date while details are still loading does not discard that load. A new activity search clears the selected Viator product.

The day control is one native select labelled Reisetag. The closed control shows the selected day. Changing it keeps the stage and day identity and clears a Viator selection from another day. The availability label stays inside its button when the real page padding is present.

Live Sandbox HTTP remains BLOCKED. No secret was read. No Vercel login was requested. DiscoverCars and Trip Workspace were not edited. The shared scroll row was not edited.

## Checks

On 29 October 2026 the review of `ce0a5bcda6c227ef831a7b4534841b744af27e06` (comment 6485054044) left three corrections. This head addresses them.

`npx eslint . --quiet` passed. The unused `bestaetigt` binding is gone. `let ziel` is assigned again for a Viator request, so `prefer-const` stays enabled. `npx tsc -p tsconfig.json --noEmit` passed. `npm run build` passed (Next.js 16.4.1).

Focused tests passed: 6 search-orchestration, 9 Viator seam, 17 foundation/sandbox, and 3 browser tests. The seam tests still cover unknown id, mismatched id, Porto versus Lisbon, Lissabon, Wien, a throwing reader, a disabled provider with zero reads, and the ninth request returning 429 without a read.

The browser harness renders `AktivitaetenBereich` inside `main.mx-auto.max-w-3xl.p-4`. At root font 32px the measured main padding-left was 32px. "Verfügbarkeit prüfen" text was x66–254 inside a button at x58–262 on a 320px viewport, and x66–324 inside a button at x58–332 on a 390px viewport. "Angebot prüfen" stayed inside its button. The search body carried Bangkok, TH, and CHF. A late 111 was discarded. An empty repeat search cleared the selected product. ArrowDown moved the two-day trip from Bangkok to Phuket-Tag.

For 22 synthetic days the day group was 90px high and the search button was at document y 511 at 390px, and 90px / y 419 at 1440px, all at the normal 16px root. At 320px and root font 32px the group was 154px, the select was 88px, and the search button was at y 1199. ArrowDown moved Tag 1 to Tag 2. Tag 22 selected the Phuket stage. There is no day radio list.

Exact-head CI for this commit is not claimed. CI 40797421578 failed lint on `ce0a5bcd` and does not cover this head. CI 40795543573 and 40793295665 do not cover it either.

## Still blocked

Real Sandbox calls, image license, checkout currency, hosted acceptance, and a green exact-head CI run for this commit. No Ready. No merge.
