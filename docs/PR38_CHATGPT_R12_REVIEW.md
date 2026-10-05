# PR #38 – ChatGPT Independent Review R12

Stand: 24. August 2026  
Status: **REQUEST CHANGES – R11-Blocker 24–26 substanziell geschlossen; neuer R12-Blocker 27 offen**

PR: `#38 – Travel Timing & Seasonal Intelligence`  
Branch: `feat/travel-timing-seasonal-intelligence`  
Base/Main beim R12-Review: `cd220beb44d90ae376feeb8de9db8a3afb808d60`  
Geprüfter Runtime-Head: `ba5bcd7634eb3a561c54eb1eb63908fe43fcd71b`  
Docs-Lock vor R12: `f4f2fbd5bf89438ae0ccb6999eb0baa2c536e72f`  
PR-Zustand: **open, Draft, nicht gemergt**

## 1. R12-Urteil

Der unabhängige R12-Closure-Review wurde auf dem tatsächlichen Runtime-Head `ba5bcd76` durchgeführt. Screenshots dienten nur als Orientierung; GitHub-PR, Runtime-Code, CI-Head, Vercel-Deployment, Route-Truth und Provider-Scope wurden unabhängig geprüft.

R11-Blocker 24–26 sind in ihren geforderten Kernfällen substanziell geschlossen:

- Cross-Airport-Wanduhren werden nicht mehr pauschal als absolute Chronologie verwendet; same-IATA bzw. konservativ sichere Kalenderabstände bleiben vergleichbar.
- Eindeutig kontinuierliche Segmentketten innerhalb eines Legs werden kanonisiert; Date-Line-/Reverse-Transit-Regressionen sind vorhanden.
- `RouteFacts.destination` wird bei bewiesener Gesamtreihenfolge aus dem Ende der letzten kanonischen Itinerary gebildet.
- `airportContacts` wird nun aus derselben kanonischen `wahrheit` abgeleitet wie Segmente/Legs/Connections.

Exact-Head-Evidence ist unabhängig bestätigt:

- GitHub Actions Run `32665395877`: **SUCCESS** mit `head_sha=ba5bcd7634eb3a561c54eb1eb63908fe43fcd71b`.
- Vercel Deployment `dpl_7zWojxDr6ThXiAM2Yb9oNp3KoQ5n`: **READY**, `githubCommitSha=ba5bcd7634eb3a561c54eb1eb63908fe43fcd71b`.
- Main ist weiterhin `cd220beb44d90ae376feeb8de9db8a3afb808d60`.
- `seasonalProviderAus()` bleibt `null`; kein neuer Seasonal-Provider wurde aktiviert.

**Noch kein Closure/PASS.** R12 findet einen konkreten Restdefekt in der Segment-Order-Truth, der direkt aus der R11-Korrektur von Blocker 25 entsteht.

PR #38 bleibt Draft. Kein Mark Ready und kein Merge ohne ausdrückliche Product-Owner-Freigabe.

---

## 2. Merge-Blocker 27 – bekannte IATA-Codes werden fälschlich als Beweis für eine nicht rekonstruierbare Segmentreihenfolge behandelt

### Betroffene Stellen

- `lib/route/chronologie.ts`
- `lib/route/ableitung.ts`
- `lib/route/verbindung.ts`
- `lib/route/laender.ts`
- `lib/route/fingerprint.ts`
- `lib/route/anzeige.ts`
- `lib/route/r11-chronologie.test.ts`

### Konkretes Problem

Die neue Segment-Härtung rekonstruiert eine eindeutige kontinuierliche Kette korrekt. Wenn jedoch **kein** vollständiger kontinuierlicher Hamilton-Pfad existiert, fällt `segmenteOrdnungBewiesen()` aktuell auf folgende Logik zurück:

```ts
const pfade = kontinuierlichePfade(segmente)
if (pfade.length === 1) return true
if (pfade.length > 1) return false
return alleIataBekannt(segmente)
```

Damit bedeutet `pfade.length === 0` + „alle Airport-Codes sind bekannt“ automatisch `chronologieBewiesen=true`.

Bekannte IATA-Codes beweisen aber nur die Identität der Endpunkte. Sie beweisen **nicht** die Reihenfolge voneinander unabhängiger bzw. nicht kontinuierlich verbundener Segmente.

Das widerspricht direkt der R11-Anforderung für Blocker 25: mehrdeutige, zyklische oder nicht belastbar ordnungsfähige Segmente dürfen keine `chronologieBewiesen=true`-Business-Truth erzeugen.

### Reproduzierbarer Fall

Ein einzelnes Leg kann zwei oder mehrere strukturell valide Segmente mit vollständig bekannten IATA-Codes enthalten, ohne dass zwischen ihnen eine eindeutige kontinuierliche Kette rekonstruierbar ist. Beispiel:

- Segment A: `BKK → SIN`
- Segment B: `ZRH → DOH`

Beide Segmente haben bekannte IATA-Codes. Es existiert aber weder `SIN → ZRH`-Kontinuität noch `DOH → BKK`-Kontinuität. `kontinuierlichePfade()` liefert deshalb keinen vollständigen Pfad.

Aktuell wird die Ordnung dennoch als bewiesen behandelt, nur weil alle vier IATA-Codes bekannt sind. Bei einem Single-Leg-Itinerary reicht das aus, damit die Route als chronologisch bewiesen gilt. Die deklarierte Array-Reihenfolge kann dadurch zu Origin/Destination/Country-/Connection-Truth werden, obwohl sie semantisch nicht belegt ist.

Noch kritischer ist ein gemischter Surface-/Continuous-Fall: Eine echte Reise kann eine Surface-Grenze plus eine kontinuierliche Teilkette enthalten. Wenn der gespeicherte Array verdreht ist, gibt es keinen vollständigen kontinuierlichen Hamilton-Pfad; der aktuelle Fallback kanonisiert dann nichts, erklärt aber die verdrehte Array-Reihenfolge trotzdem als bewiesen und kann künstliche Airport-Change-Grenzen, falschen Origin/Destination und falsche Länderrollen erzeugen.

### Warum merge-blocking

- Der Defekt liegt in der gemeinsamen Foundation-D-Route-Truth und nicht nur in Seasonal-UI.
- `RouteFacts.origin`, `destination`, `segments`, `connections`, `transitCountryCodes`, `destinationCountryCodes`, `airportContacts` und Fingerprint bauen auf dieser kanonischen Reihenfolge auf.
- Readiness, Safety und Seasonal konsumieren diese Route Truth.
- Der Input kann aus Browser/Local Storage/Metadata stammen und darf daher nicht allein durch vorhandene IATA-Felder als semantisch geordnet gelten.
- Der aktuelle R11-Test „Surface-Change ohne IATA-Kette bleibt erklärte Reihenfolge“ deckt einen korrekt deklarierten Fall ab, aber nicht den entscheidenden Gegenfall „vollständig bekannte, jedoch nicht beweisbar geordnete Segmente“.

### Erforderliche Korrektur

`alleIataBekannt(segmente)` darf **nicht** als genereller Reihenfolgebeweis dienen.

Die Lösung muss Surface-/Airport-Change weiterhin unterstützen, aber die Boundary muss durch belastbare Evidence von bloß „zwei bekannte verschiedene Airports nebeneinander im Array“ unterschieden werden. Zulässig sind z. B.:

- eine explizite kanonische Surface-Boundary-/Sequence-Evidence im Domainmodell;
- sichere strukturelle/topologische Evidence;
- konservatives fail-closed, wenn eine Surface-Reihenfolge nicht belegbar ist;
- eine andere gleichwertige Lösung, solange sie keine Cross-Airport-Wanduhr wieder zur absoluten Zeit macht.

Bei unbewiesener Segmentreihenfolge:

- `chronologieBewiesen=false`;
- globaler `origin` / `destination` bleiben unknown;
- keine unbewiesene Array-Nachbarschaft darf als autoritative Connection-/Airport-Change-Truth erscheinen;
- Fingerprint muss deterministisch bleiben und darf dieselbe unknown Segmentmenge nicht allein wegen Array-Permutation als andere semantische Route behandeln.

### Pflicht-Regressionen Blocker 27

1. Zwei vollständig bekannte, aber unverbundene Segmente in einem Leg → `chronologieBewiesen=false`, kein erfundener globaler Origin/Destination.
2. Derselbe unbewiesene Segment-Satz in umgekehrter Array-Reihenfolge → kein anderer semantischer Truth-/Stale-Zustand allein wegen Array-Permutation.
3. Gemischter Fall mit einer echten Surface-Grenze plus kontinuierlicher Teilkette und verdrehtem Input → keine künstliche Route/Connection; entweder belastbar kanonisieren oder fail-closed.
4. Der korrekte echte `CDG ⇢ ORY`-Surface-Change bleibt unterstützt, aber nicht durch den pauschalen „alle IATA bekannt“-Fallback.
5. Eindeutig rekonstruierbare `ZRH→DOH→BKK`-Kette bleibt kanonisch und identisch zur korrekt gespeicherten Variante.
6. Zyklen und fehlende IATA bleiben fail-closed.
7. Connection-Indizes/UI folgen ausschließlich der kanonischen bzw. belegten Segmentreihenfolge.
8. Seasonal/Safety/Readiness sehen dieselbe korrigierte Route Truth.
9. Guest/Account-Parität.
10. R10/R11 Date-Line, Roundtrip, Open-Jaw, Multi-City und Credential-Regressionen bleiben grün.

---

## 3. Nicht erneut geöffnet

R12 eröffnet keine neuen Provider-, DB-, Secret- oder Kostenanforderungen:

- `seasonalProviderAus()` bleibt `null`.
- Keine Seasonal-Tabelle/Migration erforderlich.
- Keine neuen Secrets oder Service-Role-Pfade.
- Keine neuen laufenden Kosten.

R11-Blocker 24–26 werden nicht pauschal wiedereröffnet; Blocker 27 ist ein klar abgegrenzter Restfall der Segment-Order-Kanonisierung.

## 4. Nächster Schritt

Cursor soll **nur Blocker 27** kohärent schließen, gezielte Regressionen hinzufügen und danach den vollständigen Exact-Head-Gate erneut durchführen.

Danach folgt unabhängiger ChatGPT R13. Nach dem verbindlichen Stop-Kriterium gilt: Wenn R13 nach ausreichend tiefer Prüfung keinen neuen konkreten relevanten Truth-/Security-/Provider-/SoT-/Cross-Domain-/Release-Defekt findet, wird technisches Closure/PASS dokumentiert und die Review-Schleife beendet.

PR bleibt bis zur ausdrücklichen Product-Owner-Freigabe Draft. Kein Mark Ready. Kein Merge.
