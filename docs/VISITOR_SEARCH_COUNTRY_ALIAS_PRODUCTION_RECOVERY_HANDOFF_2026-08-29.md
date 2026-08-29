# Jetnity – Visitor Search Country Alias Production Recovery – Handoff

Stand: 29. August 2026  
Logical Cursor-Agent: **`Visitor search correctness 1`**  
Cursor-Run: `bc-020d3296-0cd7-4e36-8373-47578af701ce`  
Draft-PR: #173  
Baseline: `main @ 2241e349f8b3b400963cf1de11e5a8617bdc8e44`  
TL-Fund: `5057757711`

## Für den nächsten Agenten / Reviewer

Dieser Recovery-Slice ist **implementiert** und bleibt Draft. Nächster Schritt: **unabhängiger Technical-Lead Exact-Head-Re-Review** des neuen Heads.

Nicht starten: Issue #110, AP-6 Runtime, AP-7, Provider, Places-Import, UI-Redesign.

## Root Cause in einem Satz

Kurze Exact-Länder-Aliase gingen verloren, weil der Nachzug Substring-`ilike` mit Limit 12 holte, bevor Ranking die Exact-Tokens sehen konnte.

## Was gebaut wurde

- `lib/places/suche.ts`: `ORT_LAND_UNIVERSUM = 500`; Nachzug für jedes gültige `ziel`, nicht nur wenn noch kein Land in der Namensmenge steht.
- `lib/places/suche-lauf.ts`: Länder-Lesen ohne Substring-Filter, Limit = Universum.
- `app/api/search/places/route.ts`: leerer Filter überspringt `.or()` und liest `typ = country`.
- Präsentation (Alias-Label, Shared-Alias-Disambiguierung, Typ/ARIA) unverändert.
- Neutraler Retrieval-Test: 2-Zeichen-Alias `ZX` hinter 15 Substring-Lärmländern.

## Stop

Kein Ready. Kein Merge. Self-Review ist kein PASS.
