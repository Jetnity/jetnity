# PR #38 – Cursor-Fixes zum unabhängigen Review

Stand: 23. August 2026  
Status: **Erst-Review-Blocker 1–4, R2-Blocker 5–6 und R3-Blocker 5-Residual/7 geschlossen; R4-Re-Review offen**

Review R1/R2: `docs/PR38_CHATGPT_INDEPENDENT_REVIEW.md`  
Review R3: `docs/PR38_CHATGPT_R3_REVIEW.md`  
Runtime-Head R1-Fixes: `89290effba61602a71418ab3904b4dc42e76709d`  
Runtime-Head R2-Fixes: `aa6cafa2f4997c22081dff35fe950a18190e7886`  
Runtime-Head R3-Fixes: `4f9eb1e8c524494fa8ab300bdfe24ec372e9e109`

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

## 5. Explizite evidenceClass

Fehlende, leere, `null` oder falsch typisierte `evidenceClass` wird nicht mehr zu `seasonal_pattern` erfunden. Nur explizite erlaubte Klassen oder ausdrücklich abgewiesene Acute-Klassen (`active_warning` / `acute` / `acute_event`) werden akzeptiert.

## 6. API-Tripgraph

`seasonalAnfrageSchema` verlangt eindeutige Stage-/Day-/Item-IDs und gültige Referenzen. `tripAusSeasonalAnfrage()` repariert unbekannte `stageId` nicht mehr und droppt keine dangling `dayId`-Items.

## 7. Rejected Acute bleibt rejected-domain

`active_warning` / `acute` / `acute_event` erzeugen intern und API-sichtbar `evidenceClass: 'rejected_acute'` mit `acuteRejected=true`. `leerEvaluation()` erfindet dafür kein `seasonal_pattern` mehr.

Acute-only ist fail-closed `unknown` / `complete=false` / API-`unknown`, kein sauberes `checked_empty`. Ein gültiger Seasonal-Fact bleibt sichtbar; das zusätzliche Acute-Fact bleibt ausdrücklich rejected-domain und erscheint nicht als Seasonal-Hinweis.

## 8. Rückwärts laufende Trip-/Stage-Daten

`seasonalAnfrageSchema` verlangt bei vorhandenen Grenzen `startDate <= endDate` und Stage-`arrivalDate <= departureDate`. Keine stille Vertauschung.

`zeitraeumeUeberschneiden()` / `kontaktImTravelWindow()` stufen ein unerwartet umgekehrtes Intervall zu `insufficient` herab, niemals zu `before`/`after`. `zeitAufRefsAnwenden()` macht daraus kein falsches `not_applies`; eine tatsächlich überlappende Stage bleibt entscheidbar.

## 9. Nicht geändert

Kein Provider, keine Migration, keine Secrets, PR bleibt Draft.
