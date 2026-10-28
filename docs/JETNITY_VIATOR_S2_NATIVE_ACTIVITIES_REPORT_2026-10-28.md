# Viator S2 native activities — REPORT

28 October 2026. Status: **partially finished**. The OpenAPI 3.0.2 contract correction is in the same R1–R4 session. Live Sandbox remains blocked. Exact-head CI for this commit is not claimed in this file.

## Umgesetzt

Destination resolution walks the COUNTRY ancestor and compares its name with Jetnity `landName`. It does not invent an ISO country code. Product options shown to visitors use the required title. A live check sends `productCode`, `travelDate`, `paxMix`, and a supported `currency`. `productOptionCode` and `startTime` are omitted unless the visitor selected a real option or a real time. A standard product is checked without an invented code. Several start times require a choice. A missing season end date is the 384-day horizon, and a schedule hint is still not availability.

## Dateien

`lib/providers/viator/activities/{anbinden,content,contracts,destination,kalender,live-check,request}.ts`, `components/trips/ViatorPruefung.tsx`, and the focused Viator tests. S2 STATUS, HANDOFF, SELF_REVIEW, and this report. The S2 task seed was not edited.

## Datenbank

None.

## Tests

`npx tsc -p tsconfig.json --noEmit` passed. ESLint on the touched Viator files passed with `--max-warnings 0`. Foundation, sandbox, and S2 unit tests passed with the server-only test register. The browser harness passed: search, explicit Morgentour selection, CHF check body, stale 111 discarded, widths 320, 390, 768, and 1440, root font 32px. `scripts/erreichbarkeit.mjs` and `scripts/exporte.mjs` reported no orphans. Full `npm run lint`, production build, and exact-head CI are not claimed here.

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
