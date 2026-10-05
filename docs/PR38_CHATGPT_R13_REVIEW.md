# PR #38 – ChatGPT Independent Review R13

Stand: 24. August 2026  
Status: **REQUEST CHANGES – R12-Blocker 27 substanziell geschlossen; neuer R13-Blocker 28 offen**

PR: `#38 – Travel Timing & Seasonal Intelligence`  
Branch: `feat/travel-timing-seasonal-intelligence`  
Base/Main: `cd220beb44d90ae376feeb8de9db8a3afb808d60`  
Geprüfter Runtime-Head: `1c14e80477b7bea083d722238165c97720442c1d`  
Docs-Lock vor R13: `3fb075dd55938d3037e1f16b05a504c0306df589`  
PR-Zustand: **open, Draft, nicht gemergt**

## 1. R13-Urteil

R13 wurde unabhängig auf dem tatsächlichen Runtime-Head `1c14e804` durchgeführt. Exact-Head-Evidence wurde unabhängig bestätigt:

- GitHub Actions Run `32669937883`: **SUCCESS** auf exakt `1c14e80477b7bea083d722238165c97720442c1d`.
- Vercel Deployment `dpl_3Y7pjngVLWmJvzbTg5VLkkunbunc`: **READY**, `githubCommitSha=1c14e80477b7bea083d722238165c97720442c1d`.
- Der nachfolgende Docs-Lock `3fb075dd` hat ebenfalls erfolgreiche CI; er ist kein zweites Runtime-Gate.

R12-Blocker 27 ist für unverbundene Segmentmengen und fehlende/mehrdeutige Topologie substanziell verbessert: bekannte IATA-Codes allein beweisen keine Reihenfolge mehr, unbewiesene Connections/Transit-Rollen werden unterdrückt, und der Fingerprint einzelner unbewiesener Segmentmengen ist permutationstabil.

**Noch kein Closure/PASS.** R13 findet einen neuen konkreten Truth-Defekt in der Surface-Kanten-Heuristik.

PR #38 bleibt Draft. Kein Mark Ready und kein Merge ohne ausdrückliche Product-Owner-Freigabe.

---

## 2. Merge-Blocker 28 – gleiches Land wird fälschlich als Beweis für eine Surface-Verbindung verwendet

### Betroffene Stellen

- `lib/route/chronologie.ts`
- `lib/route/domain.ts`
- `lib/route/ableitung.ts`
- `lib/route/verbindung.ts`
- `lib/route/fingerprint.ts`
- `lib/route/laender.ts`
- `lib/route/anzeige.ts`
- `lib/route/r12-chronologie.test.ts`

### Konkretes Problem

Die R12-Lösung versucht echte Airport-/Surface-Wechsel wie `CDG ⇢ ORY` auch bei verdreht gespeichertem Input rekonstruierbar zu halten. Dafür definiert `oberflaechenKante()` derzeit eine Kante allein dann, wenn:

1. beide IATA-Codes bekannt und verschieden sind, und
2. `destination.countryCode === next.origin.countryCode`.

Damit wird **"gleiches Land" als semantischer Beweis für einen Ground-/Surface-Transfer verwendet**.

Der Route-Domain-Vertrag enthält aber keine explizite Surface-Evidence. `RouteSegment` besitzt nur Origin, Destination und lokale Zeiten; es gibt kein Feld wie `surfaceChangeToNext`, `connectionType`, bestätigte Ground-Boundary oder vergleichbare autoritative Sequence-Evidence.

Country-Gleichheit beweist keine reale Verbindung zwischen zwei Flughäfen. Das ist besonders in großen Ländern konkret falsch.

### Reproduzierbarer Fall

Ein einzelnes Leg enthält zwei strukturell valide Segmente:

- Segment A: `LAX → JFK` (US → US)
- Segment B: `SFO → NRT` (US → JP)

Zwischen `JFK` und `SFO` gibt es keinerlei gespeicherte Transfer-Evidence. Die Segmente könnten unabhängig, falsch gruppiert oder in einem anderen Zusammenhang gespeichert sein.

Aktuelle R12-Logik:

- kein kontinuierlicher Pfad, weil `JFK !== SFO`;
- `oberflaechenKante(A, B) = true`, weil JFK und SFO beide `US` sind;
- die gemischte Hamilton-Kette kann dadurch eindeutig `[A, B]` werden;
- `segmenteOrdnungBewiesen()` wird `true`;
- Jetnity kann daraus autoritativ `LAX` als Origin, `NRT` als Destination und `JFK ⇢ SFO` als Airport-/Surface-Wechsel ableiten.

Damit wird eine nicht gespeicherte Reisebewegung über Tausende Kilometer erfunden.

Dasselbe Prinzip kann auch in kleineren Ländern falsche Grenzen erzeugen. `same country` ist höchstens ein Plausibilitätsmerkmal, kein Truth-Beweis.

### Warum merge-blocking

- Der Defekt liegt in Foundation-D-Route-Truth und propagiert in Readiness, Safety und Seasonal.
- `chronologieBewiesen=true` ist eine harte Business-Truth; sie darf nicht aus einer heuristischen Länder-Gleichheit entstehen.
- `connections`, Origin/Destination, Länderrollen, Anzeige und Fingerprint können dadurch eine erfundene Surface-Verbindung als kanonische Route darstellen.
- Die Domain-Dokumentation erklärt Ortsnamen/Titel/Notizen ausdrücklich als nicht vertrauenswürdig; analog darf ein grober Country-Code keine fehlende Sequence-/Surface-Evidence ersetzen.
- R12 sollte Blocker 27 gerade dadurch schließen, dass fehlende Reihenfolge **fail-closed** bleibt. Die same-country-Heuristik öffnet diese Grenze erneut.

### Erforderliche Korrektur

`destination.countryCode === next.origin.countryCode` darf **nicht allein** eine Surface-Kante beweisen.

Zulässige Lösungen sind beispielsweise:

- explizite provider-neutrale Surface-/Connection-Boundary-Evidence im Itinerary-Domainmodell; oder
- eine andere bereits vorhandene autoritative strukturelle Sequence-Evidence; oder
- konservatives Fail-Closed, wenn eine Surface-Grenze nicht belegt ist.

Wichtig:

- kein Live-Provider, keine DB-Migration und keine neue laufende Kosten sind dafür erforderlich;
- falls ein optionales Domain-Feld eingeführt wird, muss es rückwärtskompatibel sein und Schema/Serialisierung/Fingerprint/UI/Tests konsistent abdecken;
- `CDG ⇢ ORY` soll weiterhin unterstützt werden, **wenn** die Surface-Grenze tatsächlich belegt ist;
- bei nur vermuteter same-country-Lücke bleibt `chronologieBewiesen=false`.

### Pflicht-Regressionen Blocker 28

1. `LAX→JFK` + `SFO→NRT` ohne explizite Surface-Evidence → fail-closed; kein erfundener `JFK⇢SFO`-Transfer.
2. Umgekehrte Array-Reihenfolge desselben Falls → gleicher unknown/permutationstabiler Truth-Zustand.
3. Ein weiterer same-country-Gap-Fall ohne Evidence → fail-closed, unabhängig von der Distanz.
4. Echter `CDG⇢ORY`-Fall mit belastbarer Surface-Evidence → weiterhin bewiesen und korrekt angezeigt.
5. Verdrehter `CDG⇢ORY`-Input darf nur dann kanonisiert werden, wenn dieselbe Evidence die Reihenfolge tatsächlich trägt; sonst fail-closed.
6. Eindeutige kontinuierliche `ZRH→DOH→BKK`-Kette bleibt unverändert bewiesen.
7. Zyklen, fehlende IATA und unverbundene Cross-Country-Sets bleiben fail-closed.
8. Connections/Indices/UI entstehen nur aus belegter Segmentreihenfolge.
9. Fingerprint bleibt deterministisch und unterscheidet explizit belegte Surface-Route von unknown Segmentmenge.
10. Seasonal/Safety/Readiness und Guest/Account konsumieren dieselbe korrigierte Route Truth.
11. R10–R12 Date-Line, Roundtrip, Open-Jaw, Multi-City, Credentials und Blocker-27-Regressionen bleiben grün.

---

## 3. Nicht erneut geöffnet

R13 eröffnet keine neuen Provider-, DB-, Secret- oder Kostenanforderungen:

- `seasonalProviderAus()` bleibt `null`.
- Keine Seasonal-Tabelle/Migration erforderlich.
- Keine neuen Secrets oder Service-Role-Pfade.
- Keine neuen laufenden Kosten.

R12-Blocker 27 wird nicht pauschal wiedereröffnet. Blocker 28 ist ein klar abgegrenzter Restfehler der Surface-Kanten-Evidence.

## 4. Nächster Schritt

Cursor soll **nur Blocker 28** kohärent schließen, Regressionen ergänzen und danach den vollständigen Exact-Head-Gate erneut durchführen.

Danach folgt unabhängiger ChatGPT R14. Nach dem verbindlichen Stop-Kriterium gilt: Wenn R14 nach ausreichend tiefer Prüfung keinen neuen konkreten relevanten Truth-/Security-/Provider-/SoT-/Cross-Domain-/Release-Defekt findet, wird technisches Closure/PASS dokumentiert und die Review-Schleife beendet.

PR bleibt Draft. Kein Mark Ready. Kein Merge.