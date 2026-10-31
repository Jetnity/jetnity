# Viator S2 native activities — REPORT

31 October 2026, Europe/Zurich. Status: **partially finished**. The consumed Sandbox witness and the verified OFF rollback stand. This commit is an offline diagnostic correction, not a hosted Sandbox pass. Exact-head CI for this commit is not claimed in this file.

## Umgesetzt

R4 maps the five fixed destinations body messages to a closed `bodyReason` and logs only that enum. The consumed one-shot on `f644dbd3` remains `transport_body` / `malformed_response` / status 200, with the body subtype unknown. Rollback to flags false was already verified. Search and detail do not receive the field. The 1 MiB body cap and JSON parsing stay as they were.

S2 R3 accepts official underscore product codes on all five paths and stops untitled options from being treated as a standard product. The preview/development guard, logging isolation, and the earlier identity, reader, and UI fixes stay in place. `origin/main` `b7ebc399` was merged; route and White/Mint work was not rewritten.

Destination resolution walks the COUNTRY ancestor and compares its name with Jetnity `landName`. CITY, TOWN, and ISLAND are selectable. Alternate names are only those on the confirmed place record passed into the resolver. Lissabon matches Lisbon when that record lists both names. A country identity is not a city. A live check sends a supported currency, including CHF, EUR, and USD when that currency was requested. Weekdays come from each pricing record. Detail loading and quote cancellation are separate, and a new search clears the selected product.

## Dateien

`lib/providers/viator/activities/sandbox.ts`, `anbinden.ts`, `sandbox.test.ts`, and `s2.test.ts`. The four S2 continuity docs. The R4 task amendment was not edited. Shared transport, UI, CSS, workflows, route, White/Mint, Auth, database, environment, and packages were not edited by this correction.

## Datenbank

None.

## Tests

`lib/providers/viator/activities/s2.test.ts` and `sandbox.test.ts`: 21 tests, 0 failures. Injected streams covered announced and streamed oversize, a throwing stream, abort, empty and whitespace bodies, non-JSON media type, invalid JSON, status 99 as `unknown`, catalog schema with `bodyReason` null, a valid catalog with no diagnostic event, and forged enum values dropped at the logger. Each failure was one destinations call. Guest status stayed `error` and the guest message stayed `Die Viator-Ziele konnten nicht gelesen werden.` `npx tsc -p tsconfig.json --noEmit` passed. `npx eslint . --quiet` passed. Export check reported 0 unused exports. The earlier local stylesheet witness remains the R3.1 result on `f644dbd3` and was not re-run.

## Build

`npm run build` passed on Next.js 16.4.1. Setup check passed before the compile.

## Security

No key was read. No provider call was made. No Vercel login. No database change. The log carries the enum only. Raw parser sentences, bodies, headers, the key, and trip canaries are not copied. Production and a missing key stay closed.

## Kosten

No new paid call.

## Dokumentation

This report and the S2 STATUS, HANDOFF, and SELF_REVIEW. `docs/ACTIVE_WORK_STATUS.md` was not edited.

## Offene Punkte

The live body subtype, image license, checkout currency, hosted acceptance, VoiceOver, full browser zoom, and exact-head CI for this commit. The one-shot budget is spent. CI 41198906310 covers `f644dbd3` only. DiscoverCars stays with its own owner.

## Risiken

Green fixture tests are not live Viator proof. A display currency in the check is not a checkout-currency confirmation. `lookupId` is kept and is not a country code. `kanonischeOrteLesen` can search by name; the route discards a row whose id does not match. A native select shows one selected day; a very long title can be shortened by the browser control while the day summary still wraps the full title.

## Empfehlung

Technical Lead reviews the pushed R4 head. Do not Ready, merge, or call Viator again from this diagnostic.
