# Viator S2 native activities — REPORT

29 October 2026, Europe/Zurich. Status: **partially finished**. Live Sandbox remains blocked. Exact-head CI for this commit is not claimed in this file.

## Umgesetzt

S2 R3 accepts official underscore product codes on all five paths and stops untitled options from being treated as a standard product. The hosted catalog failure is still unclassified. The preview/development guard, logging isolation, and the earlier identity, reader, and UI fixes stay in place. `origin/main` was merged; route and White/Mint work was not rewritten.

Destination resolution walks the COUNTRY ancestor and compares its name with Jetnity `landName`. CITY, TOWN, and ISLAND are selectable. Alternate names are only those on the confirmed place record passed into the resolver. Lissabon matches Lisbon when that record lists both names. A country identity is not a city. A live check sends a supported currency, including CHF, EUR, and USD when that currency was requested. Weekdays come from each pricing record. Detail loading and quote cancellation are separate, and a new search clears the selected product.

## Dateien

`lib/providers/viator/activities/produktcode.ts` and the five former copies in content, request, affiliate, live-check, and schedule. `anbinden.ts`, `ViatorPruefung.tsx`, `s2.test.ts`, `foundation.test.ts`, `browser.test.ts`, and the four S2 continuity docs. The R3 task amendment was not edited. Shared transport, route, White/Mint, Auth, database, environment, workflows, and packages were not edited by this correction.

## Datenbank

None.

## Tests

`npx tsc -p tsconfig.json --noEmit` passed. `npx eslint . --quiet` passed. `npm run build` passed. Search 6, foundation suites, sandbox 5, and seam 14 passed, including underscore codes and untitled-option refusal. The rendered panel test passed: no “keine Zusatzoption”, no availability button, original Viator link kept, zero check requests. Root-font enlargement was not re-measured; this was not a layout pass and is not browser zoom. CI 40903974616 is the historical SUCCESS on `814920d0` and does not cover this commit.

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
