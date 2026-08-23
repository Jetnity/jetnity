# PR #37 – ChatGPT Timezone Closure Review

Stand: 23. August 2026  
Status: **REQUEST CHANGES – ein letzter konkreter Safety-Truth-Blocker**

PR: #37 `Travel Safety & Disruption Intelligence – provider-neutrale Foundation`  
Branch: `feat/travel-safety-disruption-intelligence`  
Geprüfter PR-Head vor diesem Review-Dokument: `784c0a55af746dd0714891f9a08bfe74915b05d5`  
Runtime-Head der Stop-Criterion-Fixes: `8d78da9853387e63c41036f9d12ddfd1f070812b`  
Base/main: `91e644b279c802c5a5d7a88135ed8ab9c4229a34`  
Stand beim Review: **23 ahead / 0 behind**, Draft, offen, mergeable.

## Ergebnis des Stop-Criterion-Fix-Passes

Die drei Findings aus `docs/PR37_CHATGPT_STOP_CRITERION_RECHECK.md` sind im Kern geschlossen:

- teilweise malformed Providerantworten erzeugen nicht mehr `checked_clean` / generisches API-`ok`;
- Date-only wird als voller Kalendertag behandelt;
- wiederholte Airports werden als einzelne Routekontakte modelliert;
- Country-/City-/Place-Relevanz verliert spätere Routekontakte nicht mehr;
- die verlangten Regressionstests sind vorhanden.

Laut Cursor: `npm test` **1476/1476**, Typecheck/Lint/Hygiene grün, Build **38/38**, UI-Audit **886/886**; GitHub Actions und Vercel auf Runtime `8d78da98` grün. Production unverändert, kein Live-Safety-Provider.

Der letzte Closure-Check prüft gemäß Stop-Kriterium nur noch konkrete Truth-/Security-/SoT-/Rollout-Defekte. Dabei bleibt genau ein direkt code-derived Truth-Defekt.

---

## Merge-Blocker – Foundation-D-Ortszeiten werden in Safety fälschlich zu UTC-Instanten gemacht

### Betroffene Dateien

- `lib/safety/relevanz.ts`
- Foundation-D-Wahrheit: `lib/flights/zeit.ts`, `lib/flights/duffel/mapping.ts`, `lib/route/schema.ts`
- Tests: `lib/safety/engine.test.ts`

### Verbindliche bestehende Zeit-Semantik

Foundation D / Flight mapping speichert `departureTime` und `arrivalTime` ausdrücklich als **lokale Ortszeiten ohne Zeitzonen-Umrechnung**.

`lib/flights/zeit.ts` dokumentiert sogar ausdrücklich:

- ein Flug um `07:40` in Zürich bleibt `07:40`;
- `Z` anzuhängen würde genau die Verfälschung erzeugen, die vermieden werden soll;
- Ortszeiten sind nur ohne Zone gespeichert.

`lib/flights/duffel/mapping.ts` sagt ebenfalls: `Zeiten bleiben lokale Zeichenketten.`

### Aktueller Safety-Fehler

In `lib/safety/relevanz.ts` macht `kontaktZeit()` aktuell aus einer lokalen Route-Zeit:

```ts
`${date}T${time}:00.000Z`
```

Damit wird aus einer Foundation-D-Ortszeit ohne Offset plötzlich ein UTC-Instant.

Das ist nicht nur eine Darstellung. `zeitraeumeUeberschneiden()` vergleicht diesen erfundenen UTC-Instant gegen Safety-Event-Zeitstempel, die durch `isoZeitLesen()` echte `...Z`-Zeitstempel sind.

Dadurch kann Safety-Truth falsch werden.

### Konkreter reproduzierbarer Fall

DOH-Transit laut Route Truth:

- Ankunft `2026-09-12 18:00` **lokale Doha-Zeit**
- Abflug `2026-09-12 20:00` **lokale Doha-Zeit**

Doha ist UTC+3. Ein reales Event um `2026-09-12T16:00:00Z` entspricht 19:00 lokaler Doha-Zeit und liegt damit tatsächlich im Transitfenster.

Der aktuelle Safety-Code baut jedoch `18:00Z–20:00Z` und kann einen punktuellen Event-Fact um `16:00Z` als vor dem Routekontakt / `not_affected` behandeln.

Umgekehrt kann ein Event um `19:00Z` (22:00 Doha lokal, also nach dem Transit) im künstlichen `18:00Z–20:00Z`-Fenster liegen und fälschlich als betroffen gelten.

Das ist eine konkrete falsche Warnung bzw. falsche Entwarnung und erfüllt damit das Stop-Kriterium.

### Required fix

1. **Niemals `Z` oder einen anderen Offset an Foundation-D-`HH:mm` anhängen**, solange Route Truth keine belastbare Zeitzone/Offset trägt.
2. Safety muss die Präzision explizit modellieren:
   - Route `date + HH:mm` ohne Zone bleibt lokale Wanduhrzeit;
   - Safety-Event `...Z` ist ein UTC-Instant;
   - diese beiden Formen dürfen ohne zusätzliche Zeitzonenwahrheit nicht auf Minutenebene gegeneinander verglichen werden.
3. Für einen UTC-/offset-basierten Event-Zeitstempel gegen einen Routekontakt ohne Zone gilt fail-closed:
   - keine minutengenaue `not_affected`-Entscheidung erfinden;
   - bei räumlich passendem Routekontakt mindestens `insufficient_context`, sofern keine belastbare Zeitzonenauflösung existiert.
4. Date-only ↔ Date-only kann weiterhin kalendertagbasiert verglichen werden.
5. Die vorhandene Logik für **mehrere einzelne Routekontakte** und Country-/City-/Place-Unresolved-Fälle muss erhalten bleiben.
6. Optional zukünftige höhere Präzision erst dann, wenn Route Truth selbst eine belastbare IANA-Zone oder UTC-Offset pro Segmentpunkt trägt. Keine Provider-/Displaynamen-Heuristik.

### Pflicht-Regressionstests

Mindestens:

1. DOH lokal `18:00–20:00`, Event `2026-09-12T16:00:00Z` als punktueller Event (`validFrom == validUntil`) => **nicht `not_affected`**; ohne Zeitzonenwahrheit `insufficient_context`.
2. DOH lokal `18:00–20:00`, Event `2026-09-12T19:00:00Z` punktuell => darf **nicht** aufgrund des künstlichen `Z`-Fensters als sicher `affected` gelten; ohne Zone `insufficient_context`.
3. Date-only Event `2026-09-12` gegen DOH-Kontakt am 12.09. => weiterhin zeitlich relevant/overlap.
4. Klarer anderer Kalendertag ohne mögliche Routekontakt-Überlappung => bestehende konservative Semantik beibehalten; keine Regression der Wiederholungs-Airport-Tests.
5. Test muss ausdrücklich verhindern, dass `kontaktZeit()` oder ein Nachfolger aus einer lokalen Foundation-D-Zeit `...Z` erzeugt bzw. Minute-Level-Truth daraus ableitet.

### Dokumentation

ADR-0132 ist an diesem Punkt zu korrigieren. Die Formulierung

> `departureTime`/`arrivalTime` werden als Wanduhr-Instant mit Label `Z` gelesen, ohne erfundene Zeitzone

ist widersprüchlich zur Foundation-D-Source-of-Truth und muss ersetzt werden durch eine explizit zonenlose/fail-closed Semantik.

---

## Stop-Kriterium danach

Nach Schließen **dieses einen Blockers** kein weiterer Foundation-Pass für Stil, theoretische Mikro-Härtung oder Providerdetails, die erst mit einem realen Adapter verifizierbar sind.

Merge-blockierend bleibt danach nur noch ein neuer, konkret reproduzierbarer oder direkt code-derived Defekt mit relevantem Impact auf Safety-Truth, Security, Source-of-Truth oder Rollout. Wenn keiner vorliegt, ist PR #37 technisch Closure-PASS und kann dem Product Owner zur ausdrücklichen Merge-Freigabe empfohlen werden.

Bis dahin:

- PR bleibt Draft;
- kein Mark Ready;
- kein Merge;
- keine Production-Migration;
- kein Live-Safety-Provider.
