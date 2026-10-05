# PR #37 – ChatGPT Stop-Criterion Recheck

Stand: 23. August 2026  
Status: **REQUEST CHANGES – drei konkrete Safety-Truth-Blocker bleiben**

PR: #37 `Travel Safety & Disruption Intelligence – provider-neutrale Foundation`  
Branch: `feat/travel-safety-disruption-intelligence`  
Geprüfter PR-/Docs-Head vor diesem Review: `57f34ecf835490b83a946a9d77df30623ebbfed5`  
Geprüfter Runtime-Head: `b20b3999dbb624009e06447acc3f0bad4d4be8fb`  
Base/main: `91e644b279c802c5a5d7a88135ed8ab9c4229a34`  
Stand beim Review: **20 ahead / 0 behind**, Draft, offen, mergeable.  
Remote auf `57f34ecf`: GitHub Actions Run `32630679940` **SUCCESS**, Vercel **SUCCESS**.

## Ergebnis des Final-Closure-Fix-Passes

Die vier Blocker aus `docs/PR37_CHATGPT_FINAL_CLOSURE_REVIEW.md` wurden im Kern professionell adressiert:

- checked-clean / unknown / unavailable sind getrennt;
- Timeout/Throw/Stale/Conflict erzeugen keine Clean-Copy;
- Stage- und Route-Bezüge werden zeitlich feiner ausgewertet;
- feinere Geo-Scopes berücksichtigen Route-Land-Berührung;
- Decision-Signatur, Scope-Identität, Event-/Context-Fingerprint und Kalenderdatumsprüfung wurden erweitert;
- Runtime-Input für mehrere decision-relevante Felder ist strikter fail-closed.

Laut Cursor/Acceptance sind auf dem Runtime-Stand `b20b3999` lokal `npm test` **1459/1459**, UI-Audit **886/886**, Production-Build **38/38**, Typecheck/Lint/Hygiene grün. Kein echter Provider, keine Safety-Migration, Production unverändert.

Gemäß dem im Final Closure Review festgelegten Stop-Kriterium darf dieser Recheck **keine theoretischen Mikro-Härtungen** eröffnen. Die folgenden drei Punkte sind jedoch direkt aus dem aktuellen Runtime-Code reproduzierbar und können Safety-Relevanz falsch als `not_affected`/`checked_clean` oder fälschlich als `affected` darstellen. Sie erfüllen deshalb das Stop-Kriterium.

---

## Blocker 1 – Teilweise malformed Providerantwort kann weiterhin als `checked_clean` enden

### Betroffene Dateien

- `lib/safety/engine.ts`
- `lib/safety/status.ts`

### Ursache

`safetyAusFacts()` zählt zwar ungültige Provider-Zeilen (`ungueltig`), behandelt sie aber nur dann als unknown, wenn **keine** gültigen akuten Facts übrig bleiben:

- `valide = ...`
- `ungueltig = providerFacts.length - valide.length`
- sobald `facts.length > 0`, werden ungültige Zeilen still verworfen und die verbleibenden Facts normal ausgewertet.

Damit kann eine Providerantwort aus

1. einem gültigen, aktuellen, vertrauenswürdigen Fact, der für die konkrete Reise `not_affected` ist, **plus**
2. einer malformed Zeile, deren fachliche Bedeutung unbekannt bleibt,

zu einer Evaluationsliste führen, die nur den gültigen `not_affected`-Fact enthält.

`checkStateAus()` sieht dann weder Warning noch unavailable/unknown und kann `checked_clean` liefern. Die UI darf dadurch „Keine aktuelle Safety-Warnung …“ sagen, obwohl ein Teil der Providerantwort gar nicht belastbar ausgewertet werden konnte.

Das ist eine konkrete falsche Entwarnungswirkung.

### Required fix

Providerantworten müssen ihre **Vollständigkeits-/Validierungswahrheit** behalten:

- mindestens eine malformed/verworfene akute Provider-Zeile => der Gesamtcheck darf nicht `checked_clean` werden;
- gültige Warnungen dürfen weiterhin sichtbar bleiben, aber die Response muss zusätzlich ausdrücken, dass der Check teilweise unvollständig/unknown ist;
- keine ungültige Zeile darf still verschwinden und dadurch eine Clean-Copy ermöglichen;
- vollständig gültige leere Antwort `[]` bleibt checked-clean;
- vollständig gültige nur-not-affected Antwort darf checked-clean bleiben.

Die konkrete interne Modellierung kann klein bleiben (z. B. zusätzlicher unknown marker / completeness flag), aber API/UI müssen fail-closed bleiben.

### Pflicht-Regressionstests

1. gültiger current `not_affected` Fact + malformed Row => **nicht** checked-clean, keine Clean-Copy.
2. gültiger current affected Warning + malformed Row => Warning bleibt sichtbar **und** Partial/Unknown bleibt erkennbar; kein semantisch vollständiges generisches `ok`.
3. zwei gültige not-affected Facts, 0 malformed => checked-clean.
4. `evaluate() => []` => checked-clean.
5. nur malformed => weiterhin unknown.

---

## Blocker 2 – Date-only vs. DateTime-Semantik kann auf demselben Kalendertag fälschlich `not_affected` liefern

### Betroffene Dateien

- `lib/safety/relevanz.ts`
- `lib/safety/scope.ts`
- `lib/safety/evidence.ts`
- Foundation-D Route-Segmentzeiten aus `lib/route/domain.ts`

### Ursache A – Date-only wird als Mitternachts-Instant behandelt

`zeitMs('2026-09-12')` wird zu `2026-09-12T00:00:00Z`.

`zeitraeumeUeberschneiden()` verwendet diesen Wert sowohl als Start als auch als Ende, wenn ein Ref nur einen Kalendertag hat.

Konkreter Fall:

- Stage / Transit ist am `2026-09-12` belegt;
- Safety-Event beginnt `2026-09-12T10:00:00Z`;
- Ref-Zeitfenster wird als `2026-09-12 00:00 → 00:00` behandelt;
- `eventStart > tripEnd` => `after` => `not_affected`.

Ein Date-only-Fakt beweist aber **nicht**, dass der Traveller um 10:00 bereits weg war. Bei fehlender Uhrzeit darf Jetnity keine solche Präzision erfinden. Je nach verfügbarem Wissen muss derselbe Tag als Overlap oder mindestens `insufficient_context` behandelt werden – niemals als belegtes `not_affected` nur wegen Mitternachtsnormalisierung.

### Ursache B – vorhandene Route-Segment-Uhrzeiten werden für Relevanz nicht verwendet

Foundation D besitzt auf `RouteSegment`:

- `departureDate` + `departureTime`
- `arrivalDate` + `arrivalTime`

`airportZeitfenster()` in `lib/safety/relevanz.ts` sammelt jedoch ausschließlich `departureDate` / `arrivalDate` und ignoriert die vorhandenen Uhrzeiten.

Damit kann selbst bei **bekannter** Transitzeit ein Event am selben Tag fälschlich als nach dem Transitfenster gelten, weil das Airport-Fenster auf Mitternacht kollabiert.

Beispiel:

- Transit DOH am 12.09., belegte Zeit 18:00–20:00;
- Event ab 12.09. 10:00Z;
- aktuelle Date-only-Auswertung kann `after/not_affected` erzeugen, obwohl der Transit eindeutig später am selben Tag liegt und betroffen wäre.

Das widerspricht dem bereits verbindlichen Final-Closure-Ziel „Stage-/Route-Segmentzeiten verwenden“.

### Required fix

Temporalität braucht eine explizite Semantik für **Präzision**:

- bekannte Route-Date+Time => echten UTC-/normalisierten Zeitpunkt bzw. belastbares Segmentfenster verwenden;
- Date-only => nicht als punktgenaue Mitternacht behandeln;
- bei Date-only auf demselben Tag konservativ Overlap bzw. `insufficient_context`, aber keine falsche Nicht-Betroffenheit;
- Event-Date-only ebenfalls als Kalendertag/Gültigkeitstag behandeln, nicht als 00:00-Instant, sofern der Contract kein Instant sagt;
- bestehende Route-Zeiten müssen in der tatsächlichen Relevanzlogik verwendet werden, nicht nur im Fingerprint.

Keine Zeitzone erfinden. Wenn Foundation D nur lokale Uhrzeit ohne belastbare Zone besitzt, muss die Semantik dies konservativ abbilden statt Scheingenauigkeit zu erzeugen.

### Pflicht-Regressionstests

1. Stage `2026-09-12`, Event `2026-09-12T10:00:00Z` => niemals `not_affected` allein wegen Date-only/Mitternacht.
2. Route-Transit 12.09. 18:00–20:00, Event ab 12.09. 10:00 => affected/konservativ passend, nicht `not_affected`.
3. Route-Transit 12.09. 18:00–20:00, Event eindeutig nach belegtem Transitfenster => not_affected.
4. Date-only Event am selben Stage-Tag => Overlap.
5. Event am Folgetag nach belegtem Stage-/Transit-Tag => weiterhin not_affected, sofern die Zeitwahrheit vollständig genug ist.

---

## Blocker 3 – Routekontakte werden räumlich/zeitlich zusammengezogen oder verworfen; dadurch sind false positive und false negative möglich

### Betroffene Datei

- `lib/safety/relevanz.ts`

Dieser Blocker hat zwei direkt verbundene Fälle: Routekontakte sind aktuell nicht als einzelne zeitliche Kontakte modelliert.

### 3A – Wiederholter Airport wird zu einem künstlichen Dauerfenster

`airportZeitfenster()` sammelt alle Daten eines Airport-Codes und gibt nur

- frühestes Datum = `start`
- spätestes Datum = `end`

zurück.

Konkreter Fall:

- DOH outbound am 12.09.
- DOH return am 20.09.
- Event nur am 15.09.

Aktuell entsteht für DOH künstlich `12.09.–20.09.` und das Event kann als `affected` erscheinen, obwohl der Traveller am 15.09. gar nicht in DOH ist.

Das ist eine direkt reproduzierbare falsche Warnung und erzeugt Alarm-Fatigue.

### 3B – Country-Scope verliert Routekontakt, sobald eine Stage im selben Land existiert

Im Country-Pfad werden zunächst alle Stages im Land in `refs` gelegt. Ein Route-Ref wird aber nur ergänzt, wenn:

`routeImLand && etappen.length === 0`

Damit kann ein belegter Route-/Transitkontakt im selben Land vollständig aus der zeitlichen Prüfung verschwinden, sobald **irgendeine** Stage im Land existiert.

Konkreter Fall:

- Stage Dubai / AE: 01.–03.09.
- später Transit Abu Dhabi / AE: 10.09.
- Country-Level Safety-Event AE: 10.09.

Räumlich ist AE eindeutig betroffen. Aktuell enthält `affectedRefs` aber nur die Dubai-Stage. Die Stage liegt zeitlich ausserhalb; `zeitAufRefsAnwenden()` kann deshalb `not_affected` liefern, obwohl der konkrete Transit am 10.09. betroffen ist.

Das ist eine konkrete falsche Entwarnung.

### 3C – Feinere Scope-Unsicherheit kann nach einem exakten Stage-Match verloren gehen

Bei `city` / `place` wird bei exaktem Stage-Match sofort `affected` mit ausschließlich Stage-Refs zurückgegeben. Wenn diese Stage später durch die zeitliche Filterung herausfällt, werden weitere Routekontakte desselben Landes nicht mehr als unresolved candidate berücksichtigt.

Beispiel:

- Stage Delhi / IN am 01.09. (kanonischer Place-Match);
- Route berührt IN erneut am 10.09., Safety kennt für den Routepunkt aber keine kanonische City-/Place-Membership;
- City Delhi Event am 10.09.

Die Delhi-Stage ist zeitlich vorbei. Ohne belastbare feinere Route-Membership ist der Routekontakt für Delhi **nicht ausgeschlossen**. Das korrekte Ergebnis ist mindestens `insufficient_context`, nicht `not_affected`.

### Required fix

Routekontakt muss als **Menge realer Kontakte/Windows** behandelt werden, nicht als ein Airport-Code mit einem Min/Max-Dauerfenster.

Mindestens:

- pro Airport/Routepunkt alle konkreten Segmentkontakte / Zeitfenster ableiten;
- Event ist route-affected, wenn mindestens ein belastbarer Kontakt räumlich und zeitlich überlappt;
- wenn alle bekannten Kontakte belegbar ausserhalb liegen => not_affected;
- wenn kein bekannter Kontakt überlappt, aber mindestens ein relevanter Kontakt zeitlich/räumlich nicht präzise genug ist => insufficient_context;
- Country-Scope muss Stage **und** alle relevanten Routekontakte im Land berücksichtigen, unabhängig davon, ob Stages existieren;
- finer-than-country Scope muss unresolved Routekontakt als Unknown-Kandidat behalten, auch wenn zusätzlich ein exakter Stage-Match existiert und später zeitlich herausfällt;
- keine City-/Region-Membership aus Namen raten.

### Pflicht-Regressionstests

1. DOH 12.09. + DOH 20.09., Event nur 15.09. => not_affected (nicht künstlich 12.–20.09. affected).
2. Gleiches mit Event 12.09. => affected outbound contact.
3. Gleiches mit Event 20.09. => affected return contact.
4. Stage Dubai AE 01.–03.09. + Transit Abu Dhabi AE 10.09. + AE Country Event 10.09. => affected Route/Transit, nicht not_affected.
5. Country Event nur 02.09. => Stage affected; später Transit darf die Stage-Zuordnung nicht verfälschen.
6. Exakter City/Place-Stage-Match ausserhalb Eventzeit + weiterer Routekontakt im selben Land mit unbekannter finer membership => insufficient_context, nicht not_affected.
7. Mehrere Routekontakte in anderer Reihenfolge => identisches Ergebnis.

---

## Abschluss / Stop-Kriterium

Die bisherigen Closure-Fixes sind substanziell richtig. Dieser Recheck eröffnet **keine neue breite Safety-Runde**.

Cursor soll ausschließlich die drei oben beschriebenen konkreten Truth-Gruppen beheben und die Pflicht-Regressionstests ergänzen.

Danach gilt weiterhin:

- **kein weiterer Foundation-Pass wegen Stil, hypothetischer Providerdetails oder Mikro-Härtung**;
- merge-blocking ist nur noch ein direkt reproduzierbarer oder direkt code-derived Defekt mit relevanter Auswirkung auf Safety-Truth, falsche Warnung/Entwarnung, Security, Source-of-Truth oder Rollout;
- PR bleibt Draft;
- kein Mark Ready;
- kein Merge;
- keine Production-Migration;
- kein echter Safety-Provider.

Wenn diese drei Gruppen auf dem finalen Runtime-Head geschlossen und die vollständigen Gates grün sind, soll der nächste ChatGPT-Check ausdrücklich auf **Closure/Pass** zielen, nicht erneut die Foundation ausweiten.
