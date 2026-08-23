# PR #38 – Cursor-Fixes zum unabhängigen Review

Stand: 23. August 2026  
Status: **vier Review-Blocker geschlossen; Re-Review offen**

Review: `docs/PR38_CHATGPT_INDEPENDENT_REVIEW.md`  
Runtime-Head der Fixes: `89290effba61602a71418ab3904b4dc42e76709d`

## 1. Gemischte Unsicherheit

`lib/seasonal/status.ts` aggregiert jetzt alle entscheidungsrelevanten Lücken. Ein gültiger `favorable_context` oder Timing-Hinweis überstimmt `stale`, Konflikt, `insufficient_context` oder `partial_invalid` nicht mehr zu `complete=true` / API-`ok`.

Gültige Nachteile bleiben sichtbar. Die Copy für reines `information` lautet bei Lücken nicht mehr „ohne belastbaren Nachteil“.

## 2. Absolute Travel Windows

`travelWindowLesen` nutzt `istKalenderdatum` / `isoZeitLesen`. Unmögliche Daten wie `2026-02-30Z` oder `2026-04-31Z` werden nicht über `Date.parse` nach März/Mai verschoben.

## 3. Fingerprints

`kanonZahl` serialisiert validierte Zahlen ohne `toFixed(4)`. Context- und `point_radius`-Identität ändern sich, wenn die Relevanzgrenze kippt.

## 4. Provider-Normalisierung

- vorhandenes `sourceUrl` mit Nicht-String → Fact ungültig
- `availability: 'temporarily_unavailable'` → explizite Source-unavailable-Evaluation
- anderer Availability-Wert oder falscher Typ → Fact ungültig
- `route.airportCodes` mit ungültigem Kind → Scope `insufficient`, keine stille Kürzung auf gültige Codes

## 5. Nicht geändert

Kein Provider, keine Migration, keine Secrets, PR bleibt Draft.
