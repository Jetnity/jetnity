# PR #38 – Cursor-Fixes zum unabhängigen Review

Stand: 23. August 2026  
Status: **Erst-Review-Blocker 1–4, R2-Blocker 5–6, R3-Blocker 5-Residual/7, R4-Blocker 8–9, R5-Blocker 10–11, R6-Blocker 12, R7-Blocker 13, R8-Blocker 14–15, R9-Blocker 16–19, R10-Blocker 20–23 und R11-Blocker 24–26 geschlossen; R12-Re-Review offen**

Review R1/R2: `docs/PR38_CHATGPT_INDEPENDENT_REVIEW.md`  
Review R3: `docs/PR38_CHATGPT_R3_REVIEW.md`  
Review R4: `docs/PR38_CHATGPT_R4_REVIEW.md`  
Review R5: `docs/PR38_CHATGPT_R5_REVIEW.md`  
Review R6: `docs/PR38_CHATGPT_R6_REVIEW.md`  
Review R7: `docs/PR38_CHATGPT_R7_REVIEW.md`  
Review R8: `docs/PR38_CHATGPT_R8_REVIEW.md`  
Review R9: `docs/PR38_CHATGPT_R9_REVIEW.md`  
Runtime-Head R1-Fixes: `89290effba61602a71418ab3904b4dc42e76709d`  
Runtime-Head R2-Fixes: `aa6cafa2f4997c22081dff35fe950a18190e7886`  
Runtime-Head R3-Fixes: `4f9eb1e8c524494fa8ab300bdfe24ec372e9e109`  
Runtime-Head R4-Fixes: `f077d4d1e45366dd7dfa50bf2f98461d71b8279c`  
Runtime-Head R5-Fixes: `249d4b9b24fed89070adfbd0bcaaacaeb481ba46`  
Runtime-Head R6-Fixes: `e790a7d224473df2cf999fe7c058a81a5a8e8679`  
Runtime-Head R7-Fixes: `ece075e702c491454c553a9fc931b26308cab1a9`  
Runtime-Head R8-Fixes: `de83d0269e1910ef82a596dd6e7005001f1cb860`  
Runtime-Head R9-Fixes: `263c2f842d2287da652b27cc9660c28db68c6750`  
Runtime-Head R10-Fixes: `fdcc5c882b4fb8598b3eb0956b9bdeeb0ef94072`  
Runtime-Head R11-Fixes: `ba5bcd7634eb3a561c54eb1eb63908fe43fcd71b`

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

## 14. Multi-Leg-Länderrollen bleiben leg-bewusst

Foundation D projiziert `transitCountryCodes` und `destinationCountryCodes` nur innerhalb eines belegten Legs. Das letzte Segmentziel eines Legs ist kein Transit. Zielstaaten kommen aus belegten Leg-Endpunkten; das globale Origin-/Rückkehrland wird nicht allein durch ein Rück-Leg zum Reiseziel. Multi-City-Ziele bleiben Ziele. Echter Transit im selben Leg bleibt Transit.

Readiness liest dieselbe Route Truth. Guest/Account und Flight-Item-Reihenfolge ändern die Rollenmenge nicht.

## 15. Open-Jaw-Leg-Ursprünge und Leg-Identität

Spätere Leg-Ursprünge, die nicht das bewiesene Reise-Origin sind, gehören zu `destinationCountryCodes`. Open Jaw `CH→TH` + `SG→CH` trägt `TH` und `SG`. Seasonal, Readiness und Safety lesen dieselbe Menge.

Item-Chronologie ohne `startsOn` nutzt Segmentdaten. Fehlt jede beweisbare Chronologie, bleibt das Origin leer; lexikographische Airport-Pfade werden keine Country-Truth.

Fingerprint und `routeKompakt` serialisieren jedes Leg getrennt. `ZRH→BKK | SIN→ZRH` und `ZRH→BKK | HKG→ZRH` sind unterschiedliche Identitäten. Dieselbe Open-Jaw-Route als eine Itinerary oder als getrennte Items teilt die Identität.

## 16. Airport-Change- und Segment-Origins bleiben in der Route-Identität

`pfadAusSegmenten()` und `routeKompakt()` behalten den Origin eines späteren Segments, wenn er vom vorherigen Segmentziel abweicht. `ZRH→CDG` danach `ORY→BKK` erscheint als `… CDG ⇢ … ORY …` und enthält beide Codes im Fingerprint. Ein anderer Transfer-Abflug ändert Route-Change und Readiness. Ein Cross-Country-Gap trägt das zweite Origin-Land in Seasonal, Readiness und Safety. Kontinuierliche Legs bleiben eine Kette.

## 17. Connections sind eindeutig einem Leg und Segment zugeordnet

`RouteVerbindung` trägt `legIndex` und globale `fromSegmentIndex`/`toSegmentIndex` nach Flattening. `FlugRoute` sucht den Umstieg über `verbindungNachSegment()`, nicht über `umstiege[index]`. Hinflug direkt + Rückflug mit Transit zeigt den Umstieg nur am Rückflugsegment. `FlugKarte` und `FlugBestand` lesen dieselbe Ableitung.

## 18. Chronologie nur bei eindeutiger, widerspruchsfreier Evidenz

Item-Datum ohne Zeit degradiert keine Segmentzeit auf `00:00`. Item- und Segmentquellen werden getrennt verglichen: eine eindeutige Quelle darf ordnen; widersprüchliche Reihenfolgen bleiben fail-closed. Echte Ties ohne weitere Evidenz setzen `chronologieBewiesen=false`, leeren Origin und zeigen `Reihenfolge unbekannt` statt einer erfundenen Abfolge.

## 19. Readiness-Fingerprint ohne Prefix-Truncation

`readinessFingerprint()` hasht den vollständigen kanonischen Kontext als versionierten SHA-256-Digest. Prefix-Truncation entfällt. Persistierte ältere Versionen werden stale. Das Ergebnis bleibt im 800-Zeichen-DB-Limit. Keine Passnummern.

## 20. Intra-Itinerary-Leg-Chronologie

`itinerariesFuerWahrheit()` ordnet Legs einer Itinerary nur dann zeitlich um, wenn Starts am selben IATA oder über sichere Kalenderabstände vergleichbar sind. Dieselbe SoT gilt für Origin, Länderrollen, Fingerprint und Anzeige. Umgekehrt gespeicherte `BKK→ZRH` / `ZRH→BKK`-Legs mit Tagen Abstand erzeugen keinen TH-Origin. Ties oder fehlende Zeiten bleiben fail-closed und zeigen `Reihenfolge unbekannt`. Lexikalische Airport-Pfade reparieren keine Chronologie.

## 21. Surface-Grenze in der Route-ID

`pfadAusSegmenten()` serialisiert `surfaceChange` als `~` und kontinuierlichen Kontakt als `>`. `ROUTE_FACTS_VERSION` ist `route-v2`. `ZRH→CDG` danach `ORY→BKK` und `ZRH→CDG→ORY→BKK` sind unterschiedliche Identitäten. Fehlende IATA auf beiden Seiten ist unknown, nicht gleich.

## 22. Connection Airport-Change und Duration

`airportChange=true` nur bei zwei bekannten, verschiedenen IATA. Ein oder kein bekannter Code bleibt `null`. `durationMinutes` aus lokalen Segmentzeiten nur am selben bewiesenen Airport. Cross-Airport- oder Surface-Gaps erzeugen keine naive Uhrzeitdifferenz.

## 23. Credential-Bedeutung in Readiness v4

`documentFingerprintTeil()` enthält die aufgelöste Citizenship, nicht nur `citizenshipClientRef`. `readinessFingerprint()` hasht eine kanonische JSON-Struktur. Ref→Country-Tausch ändert die Identität; reine Array-Reihenfolge nicht. Opaque Refs mit `,` / `:` / `|` erzeugen keine strukturelle Kollision. Persistierte v2- und v3-Werte werden stale.

## 24. Lokale Flughafenuhren sind keine absolute Chronologie

`departureDate` / `departureTime` bleiben airport-lokal. Cross-Airport-Wanduhren beweisen keine Reihenfolge. Vergleichbar sind lokale Zeiten am selben IATA und Kalenderabstände ≥ 3 Tage. Eine eindeutige azyklische Airport-Kette darf die **deklarierte** Leg-Reihenfolge bestätigen, getrennte Flight-Items aber nicht zur Open-Jaw-Home-Arrival umdrehen. Date-Line `NRT→HNL` / `HNL→LAX` mit lokal `20:00` / `10:00` bleibt NRT-Ursprung. Same-Day-Roundtrips bleiben fail-closed. Der Chronologie-Beweis gilt vor einem eventuellen Lex-Sort; Lex-Order wird nicht nachträglich zur Business-Truth.

## 25. Segmentordnung innerhalb eines Legs

Eine eindeutige kontinuierliche Hamiltonian-Kette wird kanonisiert (`DOH→BKK`, `ZRH→DOH` → `ZRH>DOH>BKK`). 0 kontinuierliche Pfade mit bekannten IATA bleiben die erklärte Surface-Reihenfolge. Mehrere Pfade, Zyklen oder fehlende IATA bleiben fail-closed. Cross-Airport-Uhren rekonstruieren keine Segmente.

## 26. Globales Routenziel

Bei bewiesener Chronologie ist `origin` das erste Segment der ersten kanonischen Itinerary und `destination` das letzte Segment der letzten. Unbewiesene Reihenfolge leert beide. Country-Rollen, Fingerprint, Anzeige, Readiness, Safety und Seasonal lesen dieselbe `wahrheit` plus denselben Beweisstatus.

## 27. Nicht geändert

Kein Provider, keine Migration, keine Secrets, PR bleibt Draft.
