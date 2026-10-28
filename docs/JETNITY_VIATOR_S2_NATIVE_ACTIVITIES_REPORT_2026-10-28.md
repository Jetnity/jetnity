# Viator S2 native activities — REPORT

28 October 2026. Status: **partially finished**. The OpenAPI 3.0.2 contract correction is in the same R1–R4 session. Live Sandbox remains blocked. Exact-head CI for this commit is not claimed in this file.

## Umgesetzt

Destination resolution walks the COUNTRY ancestor and compares its name with Jetnity `landName`. CITY, TOWN, and ISLAND are selectable. Lissabon matches Lisbon through the existing GeoNames alternate names. A country record is not a city. A live check sends a supported currency, including CHF, EUR, and USD when that currency was requested. Weekdays come from each pricing record. Detail loading and quote cancellation are separate, and a new search clears the selected product. The browser harness renders the real Aktivitäten area.

## Dateien

`lib/providers/viator/activities/{anbinden,content,contracts,destination,kalender,live-check,request}.ts`, `components/trips/ViatorPruefung.tsx`, and the focused Viator tests. S2 STATUS, HANDOFF, SELF_REVIEW, and this report. The S2 task seed was not edited.

## Datenbank

None.

## Tests

`npx tsc -p tsconfig.json --noEmit` passed. ESLint on the new and edited Viator files passed with `--max-warnings 0`. The pre-existing set-state warning in `AktivitaetenBereich` was left as it was. Foundation, sandbox, and S2 unit tests passed. The browser harness passed against `AktivitaetenBereich`: real search body, schedule retry, date change during loading, CHF check body, stale 111 discarded, new search and Phuket day clear the product, widths 320, 390, 768, and 1440, root font 32px. Reachability and export checks were clean. Full `npm run lint`, production build, and exact-head CI are not claimed here. CI 40781976364 remains a recorded failure.

## Build

Not re-run for this contract correction. Typecheck passed.

## Security

No key, no provider call, no Vercel login, no database change. Routes stay no-store and noindex. Production and a missing key stay closed.

## Kosten

No new paid call.

## Dokumentation

This report and the S2 STATUS, HANDOFF, and SELF_REVIEW. The official partner technical page, fetched by the Technical Lead on 28 October 2026, is the field source. The verified email remains comment 6468170303.

## Offene Punkte

Protected sandbox key, a real destinations response, image license, checkout currency, hosted acceptance, and exact-head CI for this commit. DiscoverCars stays with its own owner.

## Risiken

Green fixture tests are not live Viator proof. A display currency in the check is not a checkout-currency confirmation. `lookupId` is kept and is not a country code.

## Empfehlung

Technical Lead reviews the pushed head. Do not Ready or merge it.
