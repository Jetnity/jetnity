# Viator S2 native activities — REPORT

29 October 2026, Europe/Zurich. Status: **partially finished**. Live Sandbox remains blocked. Exact-head CI for this commit is not claimed in this file.

## Umgesetzt

The three corrections from the review of `ce0a5bcda6c227ef831a7b4534841b744af27e06` are in this head. The unused `bestaetigt` binding is removed. "Verfügbarkeit prüfen" stays inside its button in the padded `main` at 320px and root font 32px. Multi-week trips use one labelled day select instead of a full day list. The earlier identity and reader guards stay in place.

Destination resolution walks the COUNTRY ancestor and compares its name with Jetnity `landName`. CITY, TOWN, and ISLAND are selectable. Alternate names are only those on the confirmed place record passed into the resolver. Lissabon matches Lisbon when that record lists both names. A country identity is not a city. A live check sends a supported currency, including CHF, EUR, and USD when that currency was requested. Weekdays come from each pricing record. Detail loading and quote cancellation are separate, and a new search clears the selected product.

## Dateien

`components/ui/scroll-row.tsx` is deleted because it had no importer after the day select replaced the old list. `lib/activities/suche.ts`, `components/trips/AktivitaetenBereich.tsx`, `components/trips/ViatorPruefung.tsx`, `scripts/viator-s2-native-integration/browser-harness.tsx`, `lib/providers/viator/activities/browser.test.ts`, and the S2 STATUS, HANDOFF, SELF_REVIEW, and this report. The S2 task seed was not edited. Workspace, navigation, places, schema, and auth files were not edited. The reachability script was not edited.

## Datenbank

None.

## Tests

On `7a255a12`, CI 40800257522 failed only at `check:dead` for `components/ui/scroll-row.tsx` after 7651 passing tests. After deleting that file, `check:dead` reported 0 orphans, `check:exports` reported 0 unused exports, and `check:deps` reported 0 unused packages. `npx tsc -p tsconfig.json --noEmit` passed. `npx eslint . --quiet` passed. `npm run build` passed. Search orchestration: 6 passed. Viator seam: 9 passed. Foundation and sandbox: 17 passed. Browser harness: 3 passed on Linux, including ArrowDown. That ArrowDown pass is not macOS headless acceptance: comment 6485453294 showed ArrowDown does not move a plain native select there, while typeahead does. The test and the select were left unchanged. Measured availability text at 320px / root 32px: x66–254 inside button x58–262, with main padding-left 32px. Measured 22-day group: 90px and search y 511 at 390px; 90px and y 419 at 1440px; 154px and y 1199 at 320px / root 32px.

## Build

`npm run build` passed on Next.js 16.4.1.

## Security

No key, no provider call, no Vercel login, no database change. Routes stay no-store and noindex. Production and a missing key stay closed.

## Kosten

No new paid call.

## Dokumentation

This report and the S2 STATUS, HANDOFF, and SELF_REVIEW. `docs/ACTIVE_WORK_STATUS.md` was not edited.

## Offene Punkte

Protected sandbox key, a real destinations response, image license, checkout currency, hosted acceptance, VoiceOver, full browser zoom, and exact-head CI for the deletion commit. CI 40800257522 is the `check:dead` failure on `7a255a12`. DiscoverCars stays with its own owner. Shared docs that still name ScrollRow were not rewritten.

## Risiken

Green fixture tests are not live Viator proof. A display currency in the check is not a checkout-currency confirmation. `lookupId` is kept and is not a country code. `kanonischeOrteLesen` can search by name; the route discards a row whose id does not match. A native select shows one selected day; a very long title can be shortened by the browser control while the day summary still wraps the full title.

## Empfehlung

Technical Lead reviews the pushed head. Do not Ready or merge it.
