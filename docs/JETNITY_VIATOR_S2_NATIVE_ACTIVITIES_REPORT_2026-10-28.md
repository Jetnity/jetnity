# Viator S2 native activities — REPORT

31 October 2026, Europe/Zurich. Status: **partially finished**. The second consumed Sandbox witness was `size_limit`, and the OFF rollback is verified. This commit raises only the destinations read to the existing 2,097,152-byte maximum. It is not proof the live catalog fits, and it is not a hosted Sandbox pass. Exact-head CI for this commit is not claimed in this file.

## Umgesetzt

R5 selects a destinations-only executor with private `maxBodyBytes` 2,097,152. Search, detail, schedule, and check keep the 1,048,576 default on the same client. The consumed call on `3902827c` remains `transport_body` / `malformed_response` / `size_limit`. OFF `dpl_98f8RDHYJgeWg6zWPoqVLpxFe2eD` is that rollback. The logger and `anbinden.ts` are unchanged.

R4 maps the five fixed destinations body messages to a closed `bodyReason` and logs only that enum. The earlier one-shot on `f644dbd3` did not carry a body subtype. Search and detail do not receive the field.

S2 R3 accepts official underscore product codes on all five paths and stops untitled options from being treated as a standard product. The preview/development guard, logging isolation, and the earlier identity, reader, and UI fixes stay in place. `origin/main` `b7ebc399` was merged; route and White/Mint work was not rewritten.

Destination resolution walks the COUNTRY ancestor and compares its name with Jetnity `landName`. CITY, TOWN, and ISLAND are selectable. Alternate names are only those on the confirmed place record passed into the resolver. Lissabon matches Lisbon when that record lists both names. A country identity is not a city. A live check sends a supported currency, including CHF, EUR, and USD when that currency was requested. Weekdays come from each pricing record. Detail loading and quote cancellation are separate, and a new search clears the selected product.

## Dateien

`lib/providers/viator/activities/sandbox.ts`, `sandbox.test.ts`, and `s2.test.ts`. The four S2 continuity docs. The R5 task amendment was not edited. `anbinden.ts`, shared transport, UI, CSS, workflows, route, White/Mint, Auth, database, environment, and packages were not edited by this correction.

## Datenbank

None.

## Tests

`lib/providers/viator/activities/s2.test.ts` and `sandbox.test.ts`: 23 tests, 0 failures. A valid catalog of 1,048,577 bytes and an exact 2,097,152-byte catalog were read. At 2,097,153 bytes, announced length, a missing length, and a falsely small length each cancelled once and stayed `size_limit`. Search, detail, schedule, and check still reject 1,048,577 after that large destinations read. A canonical Portugal country does not select the Portugal city and does not call products/search. The earlier canary, guest message, throwing sink, and guard cases still pass. `npx tsc -p tsconfig.json --noEmit` passed. `npx eslint . --quiet` passed. Export check reported 0 unused exports.

## Build

`npm run build` passed on Next.js 16.4.1. Setup check passed before the compile.

## Security

No key was read. No provider call was made. No Vercel login. No database change. The log carries the enum only. Raw parser sentences, bodies, headers, the key, and trip canaries are not copied. Production and a missing key stay closed.

## Kosten

No new paid call.

## Dokumentation

This report and the S2 STATUS, HANDOFF, and SELF_REVIEW. `docs/ACTIVE_WORK_STATUS.md` was not edited.

## Offene Punkte

Whether the live catalog fits in 2,097,152 bytes, image license, checkout currency, hosted acceptance, VoiceOver, full browser zoom, and exact-head CI for this commit. Both one-shot budgets are spent. CI 41203662843 covers `3902827c` only. DiscoverCars stays with its own owner.

## Risiken

Green fixture tests are not live Viator proof. A display currency in the check is not a checkout-currency confirmation. `lookupId` is kept and is not a country code. `kanonischeOrteLesen` can search by name; the route discards a row whose id does not match. A native select shows one selected day; a very long title can be shortened by the browser control while the day summary still wraps the full title.

## Empfehlung

Technical Lead reviews the pushed R5 head. Do not Ready, merge, or call Viator again from this budget change.
