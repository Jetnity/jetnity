# Viator S3 production preparation — REPORT

31 October 2026, Europe/Zurich. Status: **source preparation complete / runtime activation blocked**.

## Umgesetzt

A separate Production binding stays source-off. Injected tests prove the production host, the required preflight, and fail-closed guard results. Sandbox host selection is unchanged. Activity shutdown covers search and the direct Viator routes, including a warm destinations cache. Search cards show an unambiguous catalog destination and the original product URL without putting that URL into adoption.

## Dateien

`lib/providers/viator/activities/produktion.ts`, `sandbox.ts`, `request.ts`, `contracts.ts`, `anbinden.ts`, `s3.test.ts`, `s2.test.ts`, `browser.test.ts`. `lib/activities/factory.ts`, `provider.ts`, `suche.ts`, `client-sicht.ts`, `client-anfrage.ts`, `suchlebenszyklus.ts`. `components/trips/AktivitaetKarte.tsx`, `AktivitaetenBereich.tsx`. These five S3 notes. The S3 task file was not edited. Shared transport, provider-ops, database, Auth, env, workflows, and TripWorkspace were not edited.

## Datenbank

None. Root's catalog read is recorded as evidence: migration `20260901020000` and the S6-A reservation objects are absent in Production and Dev. This change did not query or write the database.

## Tests

`s3.test.ts`: 8 passed. The injected mutable environment and the process binding are both covered. A guard that withdraws activation during its await sends no HTTP on either body budget. `s2.test.ts` and `sandbox.test.ts` passed after the option URL assertion was pointed at the option rather than the whole provider result. Client-answer and lifecycle tests passed. Browser harness: 5 passed, including the referral card at 320, 390, 768, and 1440 with zero detail requests before the visitor opens the offer. `npx tsc -p tsconfig.json --noEmit` passed. `npx eslint . --quiet` passed. Export check reported 0 unused exports.

## Build

`npm run build` passed on Next.js 16.4.1. Setup check passed before the compile.

## Security

No key was read. No provider call was made. The Production credential name is unread. Guard failures do not copy the thrown error into the guest result. Routes stay no-store and noindex. Production and a missing activity flag stay closed.

## Kosten

No new paid call and no new infrastructure.

## Dokumentation

This report and the S3 PLAN, STATUS, HANDOFF, and SELF_REVIEW. `docs/ACTIVE_WORK_STATUS.md` was not edited.

## Offene Punkte

Production credential binding, a real reservation runtime, content and image rights, a live returned-link check, positive-city evidence, hosted acceptance, and exact-head CI for this commit. Country inspiration stays open. #1023 is not complete.

## Risiken

An injected guard is not a global quota. A display URL is not commission proof and not a content license. The 2,097,152-byte destinations budget is unchanged and is still not proof the live catalog always fits.

## Empfehlung

Technical Lead reviews the pushed head. Do not Ready, merge, or activate the source gate.
