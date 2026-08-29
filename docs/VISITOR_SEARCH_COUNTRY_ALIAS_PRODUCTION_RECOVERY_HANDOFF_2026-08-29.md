# Jetnity – Visitor Search Country Alias Production Recovery – Handoff

Stand: 29. August 2026  
Logical Cursor-Agent: **`Visitor search correctness 1`**  
Cursor-Run: `bc-7713da02-0c28-4ee9-b09e-1f114dcc0d3a`  
Draft-PR: #173  
Baseline: `main @ 2241e349f8b3b400963cf1de11e5a8617bdc8e44`

## Für den nächsten Agenten / Reviewer

Dieser Recovery-Slice ist **implementiert** und bleibt Draft. Der nächste zulässige Schritt ist ein **unabhängiger Technical-Lead Exact-Head-Re-Review**. Derselbe logische Agent darf nur unmittelbare Review-Fixes auf diesem PR bearbeiten.

Nicht starten: Issue #110, AP-6 Runtime, AP-7, Provider/Payments, Places-Import, UI-Redesign.

## Root Cause in einem Satz

Production-Ranking verlor, weil Import-Keywords den Städtenamen verdoppeln; Tests konstruierten Städte ohne diese Keywords und prüften nicht den Route-Lauf.

## Was gebaut wurde

- `lib/places/suche.ts`: exaktes Länder-Alias für `ziel` steht ordinal vor allen anderen Treffern.
- `lib/places/suche-lauf.ts` + `app/api/search/places/route.ts`: Retrieval, Abbildung und Ranking sind derselbe Lauf.
- `lib/places/abbildung.ts`: Keyword-Normalisierung aus der PostgREST-Zeile.
- Tests: Production-Zeilenform und Route-Lauf für Peru / China / Schweiz / generisches Alias.

## Was bewusst nicht gebaut wurde

- keine Peru/China/Schweiz-Ausnahmetabelle
- kein Geocoder / paid dependency
- keine Bestands- oder Anzeigenamen-Mutation
- keine Abreise-/IATA-Semantikänderung

## Stop

Kein Ready. Kein Merge. Self-Review ist kein PASS. Nach Merge muss Production Peru + China + Schweiz explizit rauchen.
