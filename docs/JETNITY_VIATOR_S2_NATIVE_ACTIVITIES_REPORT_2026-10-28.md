# Viator S2 native activities — REPORT

29 October 2026, Europe/Zurich. Status: **partially finished**. Live Sandbox remains blocked. Exact-head CI for this commit is not claimed in this file.

## Umgesetzt

The three corrections from the review of `ce0a5bcda6c227ef831a7b4534841b744af27e06` remain. S2-PREACTIVATION-R1 closes the sandbox client unless `VERCEL_ENV` is exactly `preview` or `development`. The earlier identity and reader guards stay in place.

Destination resolution walks the COUNTRY ancestor and compares its name with Jetnity `landName`. CITY, TOWN, and ISLAND are selectable. Alternate names are only those on the confirmed place record passed into the resolver. Lissabon matches Lisbon when that record lists both names. A country identity is not a city. A live check sends a supported currency, including CHF, EUR, and USD when that currency was requested. Weekdays come from each pricing record. Detail loading and quote cancellation are separate, and a new search clears the selected product.

## Dateien

`lib/providers/viator/activities/zugang.ts`, `sandbox.test.ts`, and `s2.test.ts`. The S2 STATUS, HANDOFF, SELF_REVIEW, and this report. The S2 task seed was not edited. Auth, database, environment configuration, shared provider-ops, UI, workflows, and packages were not edited.

## Datenbank

None.

## Tests

`npx tsc -p tsconfig.json --noEmit` passed. ESLint on the three touched Viator files passed with `--max-warnings 0`. `npm run build` passed. Search orchestration: 6 passed. Viator seam: 10 passed, including zero injected HTTP calls for missing, empty, `staging`, exact `production`, `production ` with a trailing space, and malformed preview/development values, through the provider, detail, schedule, and live-check entry points. Sandbox client: 5 passed, including one sandbox-host search each for exact `preview` and `development`. Foundation tests in the same run passed. The browser harness was not re-run for this guard change. Its earlier Linux ArrowDown pass remains the comment-6485453294 limit: macOS headless Chrome does not move a plain native select on ArrowDown. CI 40860128741 is the historical SUCCESS on `b7299e69` and does not cover this commit.

## Build

`npm run build` passed on Next.js 16.4.1.

## Security

No key, no provider call, no Vercel login, no database change. Routes stay no-store and noindex. Production and a missing key stay closed.

## Kosten

No new paid call.

## Dokumentation

This report and the S2 STATUS, HANDOFF, and SELF_REVIEW. `docs/ACTIVE_WORK_STATUS.md` was not edited.

## Offene Punkte

Protected sandbox key, a real destinations response, image license, checkout currency, hosted acceptance, VoiceOver, full browser zoom, and exact-head CI for the pre-activation commit. CI 40860128741 is the cleanup SUCCESS on `b7299e69`. DiscoverCars stays with its own owner.

## Risiken

Green fixture tests are not live Viator proof. A display currency in the check is not a checkout-currency confirmation. `lookupId` is kept and is not a country code. `kanonischeOrteLesen` can search by name; the route discards a row whose id does not match. A native select shows one selected day; a very long title can be shortened by the browser control while the day summary still wraps the full title.

## Empfehlung

Technical Lead reviews the pushed head. Do not Ready or merge it.
