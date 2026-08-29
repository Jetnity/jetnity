# Jetnity – Visitor Search Country Alias Ranking – Handoff

Stand: 29. August 2026  
Logical Cursor-Agent: **`Visitor search correctness 1`**  
Cursor-Run: `bc-7713da02-0c28-4ee9-b09e-1f114dcc0d3a`  
Draft-PR: #168  
Baseline: `main @ 6083ee63a5da62870ab7ac4f5f91f69230718e44`

## Für den nächsten Agenten / Reviewer

Dieser Slice ist **implementiert** und bleibt Draft. Der nächste zulässige Schritt ist ein **unabhängiger Technical-Lead Exact-Head-Review**. Derselbe logische Agent darf nur unmittelbare Review-Fixes auf diesem PR bearbeiten.

Nicht starten: Issue #110, AP-6 Runtime, AP-7, Provider/Payments, Places-Import, UI-Redesign.

## Was gebaut wurde

- `lib/places/suche.ts`: exaktes Länder-Alias für `ziel` = exakte Namensstärke; `landAliasNachzugNoetig`.
- `app/api/search/places/route.ts`: gezielter `typ=country`-Nachzug über Name+Keywords, Limit 12.
- Tests in `lib/places/suche.test.ts` gegen Production-ähnliche Langnamen (`Republic of Peru`, `People’s Republic of China`, `Switzerland` / `Schweiz`) plus generisches Drittland.
- Vertrag: ADR-0196, `docs/ORTE.md`.

## Was bewusst nicht gebaut wurde

- keine Peru/China/Schweiz-Ausnahmetabelle
- kein Geocoder / paid dependency
- keine Bestands- oder Anzeigenamen-Mutation
- keine Abreise-/IATA-Semantikänderung
- keine Search-UI-Änderung

## Exact-Head Evidence auf `e3a9f011`

- Lokal: 2573/2573 Tests, Typecheck, Lint 0/135, Hygiene, Production-Build
- Actions `33245325521` SUCCESS
- Vercel Preview `4xKBDbRdT1PbT5g7Lxtxh1qkj2Ba` SUCCESS
- Review-Threads: 0
- Dieser Stamp erzeugt einen neueren Head; live neu gaten

## Residual

Mobile-Safari-Evidence aus Issue #109 wurde in dieser Umgebung nicht wiederholt. Preview ist SSO-geschützt.

## Stop

Kein Ready. Kein Merge. Self-Review ist kein PASS.
