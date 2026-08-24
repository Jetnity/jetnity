# PR #38 – ChatGPT Independent Re-Review R6

Stand: 23. August 2026  
Status: **REQUEST CHANGES – R5-Blocker 11 geschlossen, R5-Blocker 10 hat einen konkreten Restpfad; Merge-Blocker 12 offen**

PR: `#38 – Travel Timing & Seasonal Intelligence`  
Branch: `feat/travel-timing-seasonal-intelligence`  
Main bei R6: `cd220beb44d90ae376feeb8de9db8a3afb808d60`  
R5-Runtime-Head: `249d4b9b24fed89070adfbd0bcaaacaeb481ba46`  
R5-Docs-Lock: `286d91b10d4299d01e4346bb9f7dbbe748281d69`  
Sync zu R6-Beginn: **29 ahead, 0 behind** `main`  
PR-Zustand: **open, mergeable, Draft, nicht gemergt**

## 1. R6-Urteil

Der unabhängige R6-Re-Review wurde nach `docs/INDEPENDENT_REVIEW_DEPTH_STANDARD.md` und dem im R5-Review definierten Stop-Kriterium durchgeführt.

Bestätigt:

- R5-Blocker 11 ist geschlossen: `active_warning`, `acute` und `acute_event` bleiben auch zusammen mit `temporarily_unavailable` als `rejected_acute` / `acuteRejected=true` erhalten und werden nicht als Seasonal-Hinweis materialisiert.
- Der neue Provider-Port aus Blocker 10 enthält Stage-Targets mit stabiler ID, Country/Place/Geo und `arrivalDate`/`departureDate`.
- Der Provider-Port enthält Route-/Airport-Kontakte und bleibt ohne Citizenship-/Document-/LLM-Felder.
- Runtime `249d4b9b` hat GitHub Actions Run `32648396768` **SUCCESS** und Vercel Deployment `dpl_GPSjX8wWkst6hWTCqSk2TVkE9EZW` **READY**.
- Docs-Lock `286d91b1` hat GitHub Actions Run `32649108342` **SUCCESS** und Vercel Deployment `dpl_5NAH3iYZSskTWUFhy2YtW9bExVgc` **READY**.
- Diff `249d4b9b → 286d91b1` ist dokumentations-only.

Es gibt trotzdem noch **kein Closure/PASS**, weil die neu eingeführte Routekontakt-Projektion an einer realen Source-of-Truth-Grenze getrennte Airport-Besuche wieder zu einem kontinuierlichen Fenster verbinden kann.

---

## 2. Merge-Blocker 12 – getrennte Airport-Besuche werden über abgeflachte Segmentgrenzen zu einem falschen Dauer-Kontakt verbunden

### Betroffene Dateien / Naht

- `lib/seasonal/route-kontakte.ts`
- `lib/seasonal/relevanz.ts`
- `lib/seasonal/kontext.ts` / Provider-Request
- Foundation-D-Ableitung `lib/route/ableitung.ts` / `lib/route/itinerary.ts` als kanonische Quelle der Segmenttopologie
- Regressionen für Provider-Request und Seasonal-Relevanz

### Direkt code-abgeleiteter Repro

Foundation D baut `RouteFacts.segments`, indem alle Segmente aller Flight-Itineraries hintereinander abgeflacht werden. Auch `FlugRouteItinerary.legs` werden durch `segmenteAusItinerary()` zu einer flachen Segmentliste gemacht.

Die neue Seasonal-Funktion `airportKontakte(route, code)` entscheidet anschließend allein anhand der Nachbarschaft in dieser flachen Liste:

- Segment `i` kommt am Airport `code` an;
- Segment `i+1` startet am selben Airport `code`;
- daraus wird immer ein einzelner Kontakt `arrival(i) → departure(i+1)`.

Sie prüft dabei **nicht**, ob beide Segmente wirklich derselben Connection / demselben Leg / demselben Flight-Item angehören.

Konkreter realer Tripgraph:

1. Flight-Item A: `ZRH → BKK`, Ankunft BKK `2026-09-13 06:20`.
2. Aufenthalt in Bangkok mehrere Tage.
3. Separates Flight-Item B: `BKK → ZRH`, Abflug BKK `2026-09-20 23:00`.

Nach Foundation-D-Flattening stehen diese beiden Segmente direkt nebeneinander. `airportKontakte(..., 'BKK')` erzeugt deshalb fälschlich:

`2026-09-13T06:20 → 2026-09-20T23:00`

statt zwei getrennten Airport-Kontakten:

- `2026-09-13T06:20 → 2026-09-13T06:20`
- `2026-09-20T23:00 → 2026-09-20T23:00`

### Konkreter falscher Effekt

Ein source-backed Seasonal-Fact mit Scope `airport:BKK` und absolutem Fenster nur am `2026-09-15` wird durch die lokale Seasonal-Relevanz fälschlich als `applies` behandelt, obwohl der Reisende am 15.09. keinen belegten BKK-Airport-Kontakt besitzt.

Dasselbe falsche Dauerfenster wird über `providerRouteKontakte()` an einen späteren echten Provider gesendet. Damit kann der Provider bereits beim Abruf Daten für Tage anfordern/liefern, an denen Jetnity gar keinen belegten Airport-Kontakt hat.

Das ist kein theoretischer Perfektionspunkt, sondern ein direkt code-abgeleiteter falscher Truth-/Provider-Zeitkontakt.

### Warum die vorhandene R5-Regression ihn nicht erkennt

Der neue Test `Route-/Airport-Kontakte behalten einzelne Zeiten und werden nicht zu Min/Max verschmolzen` prüft beim Roundtrip den Airport `ZRH`:

- Outbound-Abflug ZRH
- Return-Ankunft ZRH

Diese beiden Endpunkte werden vom aktuellen Algorithmus ohnehin nicht miteinander gepaart.

Der kritische Fall ist der **Ziel-Airport zwischen Ankunft und späterem Rückflug** (`BKK`): genau dort sieht die flache Liste `destination(BKK)` direkt gefolgt von `origin(BKK)` und erzeugt das falsche Mehrtagesfenster.

### Verbindliche Korrektur

Airport-Kontakte dürfen nur dann zu einem Intervall verbunden werden, wenn die Verbindung durch kanonische Route-Topologie belegt ist. Bloße Nachbarschaft in `RouteFacts.segments` reicht nicht.

Zulässige Lösungsmöglichkeiten sind implementierungsfrei, müssen aber die Truth-Grenze halten, z. B.:

- Foundation D stellt eine kanonische, leg-/itinerary-bewusste Routekontakt-Projektion bereit; oder
- RouteFacts erhält genügend Source-Boundary-Information, damit Seasonal echte Connections von getrennten Besuchen unterscheiden kann; oder
- falls die Source-Boundary nicht belegbar ist, fail-closed statt zwei getrennte Besuche zu einem Dauerfenster zu erfinden.

Nicht zulässig:

- heuristische Max-Layover-Zeit als neue Wahrheit erfinden;
- allein aus der flachen Segmentreihenfolge auf kontinuierliche Airport-Präsenz schließen;
- zwei getrennte Flight-Items oder zwei fachlich getrennte Legs über den Zielaufenthalt hinweg verschmelzen.

Wenn Foundation-D-Code geändert wird, müssen dessen Route-/Safety-Regressionen mitlaufen, weil Safety dieselbe kanonische Routewahrheit konsumiert.

### Pflicht-Regressionen

Mindestens:

1. Zwei **separate Flight-Items** `ZRH→BKK` am 13.09. und `BKK→ZRH` am 20.09. ergeben für BKK zwei getrennte Kontakte, keinen Kontakt 13.–20.09.
2. Dasselbe als fachlich getrennte Legs innerhalb einer Route-Itinerary darf nicht über die Leg-Grenze verschmolzen werden.
3. Ein echter Transit innerhalb desselben belegten Legs, z. B. DOH Ankunft 17:40 / Abflug 19:10, bleibt ein zusammenhängender Layover-Kontakt.
4. Seasonal Airport-Fact `BKK` nur am 15.09. ist im obigen Roundtrip **nicht `applies`** (bei vollständig belegten separaten Kontakten `not_applies`; wenn die Source-Boundary bewusst nicht beweisbar bleibt, höchstens fail-closed `insufficient_context`).
5. Airport-Fact am tatsächlichen Ankunfts- bzw. Abflugtag trifft weiterhin korrekt.
6. Provider-Request enthält dieselben getrennten Kontakte wie die lokale Relevanz – keine divergierende zweite Wahrheit.
7. Graph-/Item-Reihenfolge ändert die kanonische Kontaktmenge nicht.
8. Bestehende DOH-Repeated-Contact-, Timezone- und R4-Widerspruchsregressionen bleiben grün.

---

## 3. R6 bestätigt ausdrücklich als geschlossen

- Erst-Review-Blocker 1–4
- R2 Missing-Class / Tripgraph-Integrität
- R3 rejected-acute / Reverse-Date
- R4 Top-Level-Hülle / Day→Stage-Impact
- R5 Blocker 11 Acute + unavailable
- R5 Blocker 10 Stage-Targets und grundsätzliche Provider-Request-Erweiterung; offen bleibt nur der oben beschriebene Routekontakt-Restpfad
- keine Seasonal-DB-Migration
- kein Live-Provider
- keine Secrets / neuen laufenden Kosten

## 4. R6 Stop-Kriterium / nächster Schritt

Cursor soll **nur Merge-Blocker 12** schließen und die beschriebenen Regressionen ergänzen. Kein zusätzlicher Produktumbau.

Danach vollständiges Exact-Head-Gate auf dem neuen Runtime-Head und unabhängiger R7-Closure-Check. Nach R7 gilt das Stop-Kriterium strikt: Wenn kein neuer konkret reproduzierbarer oder direkt code-abgeleiteter Defekt mit relevantem Einfluss auf Truth, Provider-Port, Security, Source-of-Truth, Release oder zentrale Foundation-Funktionalität verbleibt, soll der technische Closure/PASS erfolgen – keine theoretische Perfektionsschleife.

PR #38 bleibt **Draft**. Kein Mark Ready, kein Merge ohne ausdrückliche aktuelle Product-Owner-Freigabe.
