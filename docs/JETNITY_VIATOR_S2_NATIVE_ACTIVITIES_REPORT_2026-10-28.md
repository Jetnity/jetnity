# Viator S2 native activities — REPORT

29 October 2026, Europe/Zurich. Status: **partially finished**. Live Sandbox remains blocked. Exact-head CI for this commit is not claimed in this file.

## Umgesetzt

S2-SANDBOX-FAILURE-DIAGNOSTICS-R1 adds one server-only destinations diagnostic. A throwing log sink does not change the guest error. The hosted catalog failure is still unclassified. The preview/development guard and the earlier identity, reader, and UI fixes stay in place.

Destination resolution walks the COUNTRY ancestor and compares its name with Jetnity `landName`. CITY, TOWN, and ISLAND are selectable. Alternate names are only those on the confirmed place record passed into the resolver. Lissabon matches Lisbon when that record lists both names. A country identity is not a city. A live check sends a supported currency, including CHF, EUR, and USD when that currency was requested. Weekdays come from each pricing record. Detail loading and quote cancellation are separate, and a new search clears the selected product.

## Dateien

`lib/providers/viator/activities/anbinden.ts` and `s2.test.ts`. The S2 STATUS, HANDOFF, SELF_REVIEW, and this report. `sandbox.ts` was not changed. The S2 task seed was not edited. Shared transport, UI, Auth, database, environment, workflows, and packages were not edited.

## Datenbank

None.

## Tests

`npx tsc -p tsconfig.json --noEmit` passed. `npx eslint . --quiet` passed. `npm run build` passed. Viator seam: 12 passed, including the redacted destinations cases and a synthetic 401 whose `console.error` throws. That guest status stayed `error`, the message stayed `Die Viator-Ziele konnten nicht gelesen werden.`, one destinations request was made, and `console.error` was restored. Search orchestration: 6 passed. Sandbox client: 5 passed. CI 40891646901 is the historical SUCCESS on `c470c140` and does not cover this commit. The browser harness was not re-run.

## Build

`npm run build` passed on Next.js 16.4.1.

## Security

No key, no provider call, no Vercel login, no database change. Routes stay no-store and noindex. Production and a missing key stay closed.

## Kosten

No new paid call.

## Dokumentation

This report and the S2 STATUS, HANDOFF, and SELF_REVIEW. `docs/ACTIVE_WORK_STATUS.md` was not edited.

## Offene Punkte

Protected sandbox key, a later permitted one-shot destinations retest, image license, checkout currency, hosted acceptance, VoiceOver, full browser zoom, and exact-head CI for the diagnostic commit. CI 40866433319 attempt 2 is the SUCCESS on `a70e1bfb`. DiscoverCars stays with its own owner.

## Risiken

Green fixture tests are not live Viator proof. A display currency in the check is not a checkout-currency confirmation. `lookupId` is kept and is not a country code. `kanonischeOrteLesen` can search by name; the route discards a row whose id does not match. A native select shows one selected day; a very long title can be shortened by the browser control while the day summary still wraps the full title.

## Empfehlung

Technical Lead reviews the pushed head. Do not Ready or merge it.
