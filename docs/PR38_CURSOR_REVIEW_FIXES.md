# PR #38 – Cursor-Fixes zum unabhängigen Review

Stand: 23. August 2026  
Status: **Erst-Review-Blocker 1–4, R2-Blocker 5–6, R3-Blocker 5-Residual/7, R4-Blocker 8–9, R5-Blocker 10–11 und R6-Blocker 12 geschlossen; R7-Re-Review offen**

Review R1/R2: `docs/PR38_CHATGPT_INDEPENDENT_REVIEW.md`  
Review R3: `docs/PR38_CHATGPT_R3_REVIEW.md`  
Review R4: `docs/PR38_CHATGPT_R4_REVIEW.md`  
Review R6: `docs/PR38_CHATGPT_R6_REVIEW.md`  
Runtime-Head R1-Fixes: `89290effba61602a71418ab3904b4dc42e76709d`  
Runtime-Head R2-Fixes: `aa6cafa2f4997c22081dff35fe950a18190e7886`  
Runtime-Head R3-Fixes: `4f9eb1e8c524494fa8ab300bdfe24ec372e9e109`  
Runtime-Head R4-Fixes: `f077d4d1e45366dd7dfa50bf2f98461d71b8279c`  
Runtime-Head R5-Fixes: `249d4b9b24fed89070adfbd0bcaaacaeb481ba46`

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

## 9. Konkrete Stage-/Route-Zeit schlägt grobe Top-Level-Hülle

`zeitAufRefsAnwenden()` bricht bei Top-Level `before`/`after` nicht mehr ab, wenn bereits konkrete `affectedRefs` feststehen. Deren eigenen Kontakte entscheiden. Fehlen belastbare Ref-Kontakte bei feststehender räumlicher Betroffenheit, bleibt `insufficient_context`. Nur ohne konkrete Refs bleibt die grobe Hülle der Fallback.

## 10. Day→Stage-Item-Impact

`effektiveItemStageId()` verwendet zuerst eine gültige direkte `item.stageId`. Fehlt sie, gilt `item.dayId → day.stageId`. Widersprüchliche Doppelbeziehungen werden nicht still entschieden.

## 11. Provider-Request trägt konkrete Stage-/Route-Zeitkontakte

`SeasonalProviderAnfrage` enthält neben der groben Top-Level-Hülle und den flachen Country-/Airport-/Place-Mengen jetzt kanonische:

- `stages[]` mit stabiler ID, Country/Place/Geo und `arrivalDate`/`departureDate`
- `routeContacts[]` mit Airport, Land und getrennten Start-/Endkontakten

`providerAnfrageAusKontext()` sortiert beides deterministisch. Wiederholte Places/Airports bleiben getrennte Kontakte und werden nicht zu Min/Max verschmolzen. Labels, Citizenship, Dokumente und LLM-Felder gehören nicht in den Port.

## 12. Acute plus temporarily_unavailable bleibt rejected-domain

`seasonalFactNormalisieren()` prüft abgewiesene Acute-/Safety-Klassen vor `availability`. `active_warning` / `acute` / `acute_event` bleiben `rejected_acute` mit `acuteRejected=true`, auch wenn `availability='temporarily_unavailable'` gesetzt ist. Die kombinierte Zeile darf `sourceTemporarilyUnavailable` zusätzlich tragen, aber niemals `seasonal_pattern` werden.

Die Engine behandelt Acute vor dem generischen Seasonal-unavailable-Pfad. Acute-only + unavailable bleibt fail-closed ohne `checked_empty` / API-`ok`. Ein gültiger Seasonal-Fact darf sichtbar bleiben; der Gesamtstatus wird durch die abgewiesene/fehlende Truth nicht clean/favorable.

## 13. Getrennte Airport-Besuche bleiben getrennte Kontakte

Foundation D projiziert `RouteFacts.airportContacts` nur innerhalb eines belegten Legs. Getrennte Flight-Items und getrennte Legs werden nicht über den Zielaufenthalt zu einem Dauerfenster verbunden. Ein echter Transit im selben Leg bleibt ein Layover-Kontakt.

Seasonal-Relevanz und Provider-Request lesen dieselbe Projektion. Safety nutzt dieselbe Kontaktliste. Verbindungen (`connections`) entstehen ebenfalls nur noch innerhalb eines Legs.

## 14. Nicht geändert

Kein Provider, keine Migration, keine Secrets, PR bleibt Draft.
