# Viator S2 native activities — REPORT

28 October 2026. Status: **partially finished**. The Aktivitäten seam is in the branch. Real Sandbox and hosted acceptance stay **BLOCKED**. Ready was not set. Nothing was merged.

## Umgesetzt

Explicit activity search can use the Viator provider when the sandbox guard is open. Cards can show a validated image, source label, and price basis. Selecting a Viator card loads detail and a schedule hint, then asks for a date, option, and age-band mix before a live check. The external link is the original validated product URL. Manual planning and GetYourGuide stay in place. A context change drops the Viator selection.

## Dateien

`lib/providers/viator/activities/anbinden.ts`, route helper, S2 and browser tests, `components/trips/AktivitaetenBereich.tsx`, `AktivitaetKarte.tsx`, `ViatorPruefung.tsx`, `app/api/activities/search/route.ts`, `app/api/activities/viator/{detail,schedule,check}/route.ts`, narrow `lib/activities` domain, schema, client view, and factory. S2 task seed and these docs. Main was merged, including Trip Workspace files as they arrived. Those UX files were not hand-edited.

## Datenbank

None.

## Tests

S2 unit tests passed, including missing key, Production, unmapped place, EUR-versus-CHF, and traveller-total rejection. Browser harness passed. Text enlargement was `documentElement.style.fontSize = 32px`, not browser zoom.

## Build

`tsc -p tsconfig.json --noEmit` passed before the docs. ESLint on the new Viator and activity files passed with `--max-warnings 0`. Full lint, build, and exact-head CI run after push and are not claimed yet.

## Security

No key, no provider call, no Vercel login, no database change. Routes are no-store and noindex. Product URLs are revalidated before a link. Account adoption still stores `booking_url: null`.

## Kosten

No new paid call.

## Dokumentation

This report and the S2 PLAN, STATUS, HANDOFF, and SELF_REVIEW. Official pages named in the task were the contract. The verified email remains comment 6468170303.

## Offene Punkte

Protected sandbox key, real `/destinations` bindings, image license, checkout currency, and DiscoverCars under its own owner.

## Risiken

A later key without destination bindings still returns no offers. That is fail-closed, and it can look like a product outage. Green tests are not live Viator proof.

## Empfehlung

Technical Lead reviews the pushed head. Do not Ready or merge it.
