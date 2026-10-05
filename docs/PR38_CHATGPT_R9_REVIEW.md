# PR #38 – ChatGPT Independent Review R9

Stand: 23. August 2026  
Status: **REQUEST CHANGES – R8-Blocker 14/15 geschlossen, R9-Blocker 16–19 offen**

PR: `#38 – Travel Timing & Seasonal Intelligence`  
Branch: `feat/travel-timing-seasonal-intelligence`  
Base/Main beim R9-Lock: `cd220beb44d90ae376feeb8de9db8a3afb808d60`  
Geprüfter Runtime-Head R9: `de83d0269e1910ef82a596dd6e7005001f1cb860`  
Docs-Lock vor R9: `0c0ba91ae2f231d564e96da1933487ce7b9f1652`  
Sync beim R9-Lock: **0 behind** `main`  
PR-Zustand: **open, mergeable, Draft, nicht gemergt**

## 1. R9-Urteil

Der unabhängige R9-Closure-Review wurde nach `docs/INDEPENDENT_REVIEW_DEPTH_STANDARD.md` auf dem tatsächlichen Runtime-Head `de83d026` durchgeführt.

R8-Blocker 14 und 15 sind substanziell geschlossen:

- Open-Jaw `CH→TH` + `SG→CH` trägt `TH` und `SG` in der Country-Truth;
- Seasonal Country Scope und Provider-Request sehen SG;
- Readiness und Safety sehen dieselbe Country-Menge;
- fehlende Item-Daten können auf belegte Segmentdaten zurückfallen;
- Leg-Grenzen und Leg-Ursprünge werden für normale Open-Jaw-/Multi-Leg-Fälle im Route-Fingerprint erhalten;
- `ZRH→BKK | SIN→ZRH` und `ZRH→BKK | HKG→ZRH` sind unterschiedliche Identitäten;
- dieselbe normal chronologisierte Open-Jaw-Route als eine Itinerary oder getrennte Flight-Items teilt die Identität;
- `routeKompakt` bewahrt normale Leg-Grenzen.

**Trotzdem noch kein PASS.** Der R9-Widerlegungsdurchgang zeigt vier konkrete Restdefekte. Drei liegen direkt in den gerade gehärteten Route-/Chronologie-Projektionen; der vierte ist eine Cross-Domain-Stale-Kollision zwischen der längeren leg-aware Route-Identität und Readiness/Traveller Context.

PR #38 bleibt Draft. Kein Mark Ready und kein Merge ohne ausdrückliche Product-Owner-Freigabe.

---

## 2. Merge-Blocker 16 – Airport-Change-/Segment-Origin verschwindet weiterhin aus Route-Identität und Kompaktanzeige

### Betroffene Stellen

- `lib/route/pfad.ts`
- `lib/route/fingerprint.ts`
- `lib/route/anzeige.ts`
- `lib/route/laender.ts`
- `lib/route/vergleich.ts`
- vorhandene Fixture `itineraryAirportChange()` in `lib/route/fixtures.ts`
- indirekt Readiness-Stale und Cross-Domain-Parität

### Reproduzierbarer bereits unterstützter Fall

Die bestehende Test-Fixture modelliert ausdrücklich einen Flughafenwechsel innerhalb **eines Legs**:

`ZRH → CDG` und danach `ORY → BKK`.

`verbindungenAusSegmenten()` erkennt korrekt, dass `CDG !== ORY`, und setzt `airportChange = true`. Das ist also kein erfundener R9-Sonderfall, sondern ein bereits unterstützter Route-Zustand.

### Aktuelles Problem

`pfadAusSegmenten()` nimmt nur den Origin des **ersten** Segments auf und danach nur noch die Destinations:

- Segment 1: `ZRH → CDG`
- Segment 2: `ORY → BKK`

wird als Pfad sinngemäß zu:

`ZRH → CDG → BKK`

Der belegte zweite Segment-Origin `ORY` verschwindet.

`routeKompakt()` benutzt dieselbe Verlustannahme: Die Kompaktanzeige kann `ZRH → CDG → BKK` zeigen und gleichzeitig darunter „Flughafenwechsel erforderlich“. Damit behauptet die Route optisch, der zweite Flug starte in CDG, obwohl die strukturierten Facts ORY beweisen.

Noch kritischer: `routeFingerprintAus()` benutzt ebenfalls `pfadAusSegmenten()`. Eine Änderung nur des zweiten Segment-Origins, z. B. `ORY → LCY` oder ein anderer Abflughafen, kann deshalb **denselben Route-Fingerprint** behalten.

`routeAenderungZwischen()` verlässt sich auf diesen Fingerprint plus Transit-Country-Diff. Bleibt der vorherige Segment-Destination-Airport gleich, kann eine reale Airport-Change-Routenänderung damit als `geaendert = false` enden.

Seasonal/Safety sehen die Segment-Origins an anderen Stellen bereits über `route.segments`/Airport-Codes bzw. Route-Zeit-Fingerprints. Readiness und Route-Change benutzen dagegen die verlustbehaftete Route-ID. Das ist eine echte Cross-Domain-Inkonsistenz.

### Cross-Country-Rand

Das Route-Schema erlaubt strukturell auch einen nächsten Segment-Origin, dessen Airport/Country nicht dem vorherigen Segment-Destination entspricht. Wird so ein Gap akzeptiert, darf dessen Land nicht aus der Country-Truth verschwinden. Entweder:

- die Topologie wird als eigener belegter Surface-/Airport-Change-Kontakt erhalten, oder
- ein fachlich unzulässiger Gap wird fail-closed abgelehnt.

Nicht zulässig ist: Airport im Segment vorhanden, aber aus Fingerprint/Anzeige/Country-Kontext still verschwunden.

### Warum merge-blocking

- Die bestehende Foundation modelliert Airport Changes bereits ausdrücklich.
- Die Kompaktanzeige kann eine falsche Abflugroute behaupten.
- Zwei verschiedene strukturierte Routen können dieselbe kanonische Route-ID erhalten.
- Route-Change/Readiness können eine Änderung verpassen, während Seasonal/Safety sie an anderen Projektionen sehen.
- Das verletzt „eine Reise, eine Wahrheit“ direkt.

### Pflicht-Regressionen Blocker 16

Mindestens:

1. bestehendes `itineraryAirportChange()` → `routeKompakt` enthält **CDG und ORY** und macht die Surface-/Airport-Change-Grenze verständlich;
2. dessen Route-Fingerprint enthält/identifiziert ORY;
3. ORY gegen einen anderen zweiten Segment-Origin tauschen → Fingerprint ändert sich;
4. `routeAenderungZwischen()` erkennt diese Änderung;
5. kontinuierliches Leg `ZRH→DOH→BKK` bleibt eine normale Kette ohne künstliche Trennstelle;
6. Airport Change im selben Land behält Transit-Country-Semantik korrekt;
7. ein akzeptierter Cross-Country-Gap lässt das zweite Origin-Land nicht aus Seasonal/Readiness/Safety verschwinden – alternativ wird der unzulässige Gap fail-closed verworfen;
8. Guest-/Account-Parität und kanonisierte Airport-Referenzen bleiben erhalten;
9. Input-Reihenfolge darf keine zweite Identität für dieselbe belegte Topologie erzeugen.

---

## 3. Merge-Blocker 17 – Multi-Leg-Connections haben keine eindeutige Leg-Zuordnung; UI hängt Umstiege an das falsche Segment

### Betroffene Stellen

- `lib/route/domain.ts` (`RouteVerbindung`)
- `lib/route/verbindung.ts`
- `lib/route/ableitung.ts`
- `components/trips/FlugRoute.tsx`
- Suche und Bestand (`FlugKarte`, `FlugBestand`) als reale Consumer

### Reproduzierbarer normaler Fall

Roundtrip in **einer** Flight-Itinerary:

- Hinflug direkt: `ZRH → BKK`
- Rückflug mit Transit: `BKK → SIN → ZRH`

`routeFactsAusItineraries()` flacht die Segmente zu:

1. `ZRH→BKK`
2. `BKK→SIN`
3. `SIN→ZRH`

Die Connections werden aber **pro Leg** erzeugt und danach flach zusammengefügt. Das direkte Hin-Leg liefert keine Connection; das Rück-Leg liefert eine Connection mit lokalem `fromSegmentIndex = 0`.

`FlugRoute.tsx` rendert anschließend die flache Segmentliste und benutzt schlicht `umstiege[index]`. Dadurch liegt `umstiege[0]` beim **ersten Hinflug-Segment** und kann dort den Rückflug-Transit anzeigen.

Bei zwei Legs mit je einem Transit wird die zweite Connection entsprechend an ein Segment des ersten Legs verschoben.

### Architekturproblem

`RouteVerbindung.fromSegmentIndex` / `toSegmentIndex` sind aktuell nur innerhalb ihres Legs eindeutig, `RouteVerbindung` trägt aber keinen `legIndex` oder anderen Leg-Key. Nach dem `flatMap` ist die Identität daher mehrdeutig.

R8 hat `RouteFacts.legs` eingeführt. Die UI darf diese neue Topologie nicht sofort wieder über eine parallele flache Connection-Liste verlieren.

### Endwirkung

- falscher Umstiegsort kann unter dem falschen Flugsegment erscheinen;
- „Flughafenwechsel“ kann dem falschen Leg zugeordnet werden;
- Suchkarte und gespeicherter Flugbestand benutzen dieselbe Komponente und können daher beide betroffen sein;
- UI-Audit 1014/1014 prüft Layout/Runtime, aber diese semantische Zuordnung nicht.

### Warum merge-blocking

Das ist sichtbare falsche Reiseinformation in einem normalen Roundtrip-/Multi-Leg-Fall. Die Route-Facts selbst kennen die Leg-Grenzen, die Anzeige verwirft sie bei den Connection-Details wieder.

### Erforderliche Korrektur

Connection-Identität muss leg-aware sein. Zulässige Lösungen sind z. B.:

- `legIndex` plus leg-lokale Segmentindizes in `RouteVerbindung`, oder
- globale Segmentindizes nach kanonischer Flattening-Reihenfolge, oder
- Connections bleiben direkt unter dem jeweiligen `RouteFacts.legs`-Eintrag und die UI rendert legweise.

Wichtig ist die fachliche Eindeutigkeit, nicht die konkrete Form.

### Pflicht-Regressionen Blocker 17

Mindestens:

1. Hinflug direkt, Rückflug ein Transit → Umstieg nur am korrekten Rückflug-Segment;
2. Hinflug ein Transit, Rückflug direkt → Umstieg nur am korrekten Hinflug-Segment;
3. beide Legs je ein Transit → beide Umstiege am richtigen Leg/Segment;
4. Airport Change nur im zweiten Leg → „Flughafenwechsel“ am richtigen Segment;
5. drei Multi-City-Legs mit gemischten Direct/Transit-Verbindungen;
6. Kompaktanzeige, Detailanzeige und `umstiege`-Gesamtzahl bleiben konsistent;
7. `FlugKarte` und `FlugBestand` erhalten dieselbe korrekte Zuordnung;
8. UI-Audit/semantischer Komponententest deckt diesen Fall ab.

---

## 4. Merge-Blocker 18 – Chronologie gilt bei gleich groben Zeitwerten fälschlich als „bewiesen“

### Betroffene Stellen

- `lib/route/chronologie.ts`
- `lib/route/ableitung.ts`
- `lib/route/laender.ts`
- `lib/route/fingerprint.ts`
- `lib/route/anzeige.ts`

### Aktuelles Problem

`itineraryStartBelegt()` bevorzugt ein vorhandenes `TripItem.startsOn`. Fehlt `startsAt`, wird daraus pauschal `YYYY-MM-DDT00:00`.

`routeChronologieBewiesen()` prüft anschließend bei mehreren Itineraries nur, ob **für jeden Eintrag irgendein solcher Startwert vorhanden ist**. Es prüft nicht, ob daraus eine strikte, belegte Reihenfolge entsteht.

Damit ist folgender gültige Zustand problematisch:

- zwei getrennte Flights am selben Tag;
- beide Items haben `startsOn = 2026-09-12`, aber `startsAt = null`;
- die strukturierten Segmentdaten enthalten z. B. 09:00 und 18:00 und beweisen die Reihenfolge.

Beide Item-Werte werden dennoch zu `2026-09-12T00:00`. Im Sort-Tie fällt `itinerariesSortieren()` auf `pfadAusItinerary().localeCompare()` zurück. Gleichzeitig meldet `routeChronologieBewiesen()` **true**.

Damit kann ausgerechnet der lexikographische Airport-Pfad wieder zum globalen Reise-Origin werden – genau das, was R8 für fehlende Chronologie verhindern sollte.

Bei `ZRH→BKK` und später am selben Tag `BKK→ZRH` sortiert der Pfad `BKK...` vor `ZRH...`; der Return kann dadurch fälschlich primär werden, obwohl die Segmentzeiten die richtige Chronologie beweisen.

### Zweiter Rand: echte Gleichheit / Widerspruch

Auch wenn zwei belegte Startwerte exakt gleich sind und keine weitere Evidenz eine Reihenfolge beweist, ist Chronologie nicht automatisch „bewiesen“. Ebenso darf ein klarer Widerspruch zwischen Item-Zeit und strukturierter Segmentzeit nicht still als sichere Reihenfolge behandelt werden.

### User-visible Rand

Wenn Chronologie wirklich unbewiesen ist, setzt `routeFactsAusItineraries()` Origin/Destination zwar fail-closed leer. `legs` werden aber weiterhin in der deterministischen Sortierreihenfolge aufgebaut und `routeKompakt()` kann diese lexikographische Reihenfolge als scheinbar echte Reiseabfolge anzeigen. Deterministische Serialisierung darf nicht mit fachlich belegter Reihenfolge verwechselt werden.

### Warum merge-blocking

- falscher Origin verändert Country-Truth, Readiness, Safety und Seasonal;
- der Fix verletzt seine eigene Invariante „ohne beweisbare Chronologie keine Country-Truth aus lexikographischen Pfaden“ in einem normalen Same-Day-/date-only-Fall;
- `startsAt` ist im kanonischen Trip-Modell ausdrücklich nullable;
- strukturierte Segmentzeiten können reichere Evidenz liefern und werden aktuell durch den groberen Item-Tag überstimmt.

### Erforderliche Korrektur

Chronologie muss präzisions- und konfliktbewusst sein:

- Item-Datum + Item-Zeit darf verwendet werden, wenn vollständig und konsistent;
- Item-Datum ohne Zeit darf eine vorhandene Segmentzeit nicht auf 00:00 degradieren;
- gleiche/coarse Kandidaten müssen mit strukturierter Segment-Chronologie weiter disambiguiert werden;
- eine Reihenfolge gilt nur dann als „bewiesen“, wenn Evidenz tatsächlich eine eindeutige Reihenfolge trägt;
- bei echtem Tie oder widersprüchlicher Evidenz fail-closed: kein lexikographischer Pfad als Origin-Truth;
- deterministische Sortierung für Hash/Serialisierung darf von „fachlich geordnete Route“ getrennt werden;
- eine UI darf bei unbewiesener Chronologie keine erfundene Reihenfolge präsentieren.

### Pflicht-Regressionen Blocker 18

Mindestens:

1. zwei Flights am selben Tag, Item-Zeiten null, Segmentzeiten 09:00/18:00 → Segmentzeiten bestimmen korrekt;
2. Input-Array umkehren → Origin/Rollen/Fingerprint bleiben gleich;
3. ein Item date-only, das andere mit Zeit, Segmentdaten vollständig → keine künstliche 00:00-Priorität;
4. identische Item-Starts, aber unterschiedliche Segmentstarts → Segment-Evidenz disambiguiert;
5. echte identische/unklare Starts ohne weitere Evidenz → `routeChronologieBewiesen = false` bzw. fachlich gleichwertig, Origin bleibt unknown;
6. widersprüchliche Item-/Segmentchronologie → fail-closed oder explizit dokumentierte sichere Prioritätsregel, nicht stiller lexikographischer Origin;
7. unbewiesene Chronologie → Kompaktanzeige behauptet keine konkrete Reihenfolge;
8. normale Roundtrip/Open-Jaw/Multi-City-Fälle aus R8 bleiben grün.

---

## 5. Merge-Blocker 19 – Readiness-Fingerprint schneidet kanonische Route-/Traveller-Wahrheit nach 800 Zeichen ab

### Betroffene Stellen

- `lib/readiness/fingerprint.ts`
- `lib/readiness/domain.ts`
- `lib/readiness/ableitung.ts`
- `lib/readiness/status.ts`
- `lib/readiness/traveller-kontext.ts`
- DB-Constraint `trip_readiness_items_fingerprint_laenge`
- neue längere leg-aware Route-Fingerprints aus R8

### Aktuelles Problem

`readinessFingerprint()` baut einen kanonischen Klartext-Fingerprint und beendet ihn mit:

`return teile.join('|').slice(0, READINESS_GRENZEN.fingerprint)`

`READINESS_GRENZEN.fingerprint` ist `800`, passend zum DB-Constraint.

Das ist keine sichere Längenbegrenzung für einen Fingerprint, sondern **Prefix-Truncation**. Zwei verschiedene vollständige Kontexte mit identischen ersten 800 Zeichen werden dadurch absichtlich identisch.

### Warum R8 das Risiko vergrößert

Der neue Route-Fingerprint ist richtigerweise leg-aware und enthält mehr belegte Endpunkte. `FlugRouteItinerary` erlaubt bis zu 6 Legs mit bis zu 8 Segmenten pro Itinerary; eine Reise erlaubt viele Flight-Items. Bereits zwei komplexe Multi-Leg-Itineraries können den Route-Teil so weit verlängern, dass spätere Felder im 800-Zeichen-Fingerprint abgeschnitten werden.

Noch kritischer: Bei Entry/Visa/Document Checks stehen die Traveller-Felder **nach** dem Route-Feld:

- Traveller-Ref
- Citizenship-Menge
- Document-Fingerprints
- Residence

Ein langer Route-Fingerprint kann diese Felder vollständig aus dem gespeicherten 800-Zeichen-Präfix verdrängen.

### Multi-Document-Fall

Ein Traveller darf bis zu 12 Dokumente und 8 Staatsbürgerschaften haben. `documentFingerprintTeil()` enthält Dokumenttyp, Ausstellerland, Ablaufdatum und `citizenshipClientRef` (bis 64 Zeichen). Auch ohne extreme Route kann ein großer, aber erlaubter Traveller-Kontext die Rohdarstellung über 800 Zeichen bringen.

Damit kann z. B. eine Änderung eines später serialisierten Passes oder der Residence **denselben abgeschnittenen Fingerprint** behalten.

### Endwirkung

`readiness/status.ts` entscheidet Current/Stale ausschließlich über exakte Fingerprint-Gleichheit. Bei einer Truncation-Kollision bleibt ein alter `done`-Status deshalb `current`, obwohl sich eine relevante Route, Staatsbürgerschaft oder ein Dokument geändert hat.

Das widerspricht dem verbindlichen Fingerprint-Grundsatz aus dem Review-Standard: Jede relevante Fact-Änderung muss alten Nachweis ungültig machen.

### Warum merge-blocking

- deterministische, reproduzierbare Kollision – kein theoretisches Hash-Risiko;
- betrifft genau Route + Traveller + Readiness Cross-Domain;
- kann Änderungen an späteren Legs, Pässen oder Citizenship-Zuordnung unsichtbar machen;
- aktuelle DB-Grenze ist kompatibel mit einem kurzen Digest, daher braucht die Lösung nicht zwingend eine DB-Migration.

### Erforderliche Korrektur

Kein Abschneiden des kanonischen Rohkontexts.

Der vollständige normalisierte Kontext muss zuerst vollständig in die Identität eingehen und anschließend auf eine begrenzte, kollisionsresistente Darstellung gebracht werden, z. B. durch einen versionierten Digest/Hash oder eine fachlich gleichwertige Lösung.

Wichtig:

- komplette Route, Traveller-, Citizenship-, Document- und Residence-Facts müssen vor der Längenbegrenzung einfließen;
- Reihenfolge-invariante Mengen bleiben kanonisch sortiert;
- `READINESS_FINGERPRINT_VERSION` muss bei inkompatibler Semantik bewusst erhöht werden, damit alte persistierte Werte sicher stale werden;
- Ergebnis bleibt innerhalb des DB-Limits;
- keine Passnummern/Scans/MRZ in Fingerprints aufnehmen.

### Pflicht-Regressionen Blocker 19

Mindestens:

1. zwei erlaubte lange Route-Kontexte, deren Unterschied erst nach Zeichen 800 liegt → unterschiedliche Readiness-Fingerprints;
2. langer Route-Kontext + Citizenship-Änderung → Fingerprint ändert sich;
3. langer Route-Kontext + Änderung eines spät sortierten Dokuments → Fingerprint ändert sich;
4. Residence-Änderung bleibt auch bei maximalem Traveller-Kontext sichtbar;
5. 8 Citizenships + 12 Documents bleiben deterministisch und reihenfolgeinvariant;
6. Fingerprint-Länge bleibt innerhalb DB-Limit;
7. bestehende kurze v2-Testfälle werden mit bewusstem Versions-/Migrationseffekt angepasst;
8. persistierter alter Status wird nach einer relevanten neuen Semantik nicht fälschlich `current`;
9. Guest-/Account-Parität bleibt erhalten.

---

## 6. Was R9 ausdrücklich bestätigt / nicht erneut öffnet

- R8-Blocker 14 ist für normale Open-Jaw-/spätere-Leg-Origin-Fälle geschlossen.
- R8-Blocker 15 ist für **Leg-Grenzen** und normale Leg-Ursprünge geschlossen; Blocker 16 betrifft die darunterliegende Segment-/Airport-Change-Grenze.
- R7-Blocker 13 bleibt für Roundtrip/Multi-City/Transit-Country-Rollen geschlossen.
- R6 Airport-Contact-Trennung bleibt geschlossen.
- R5 Provider-Zeitkontakt/Acute-Reject bleibt geschlossen.
- frühere Seasonal Truth-/Calendar-/Provider-/API-Fixes werden durch R9 nicht wieder geöffnet.
- `seasonalProviderAus()` bleibt absichtlich `null`.
- keine Seasonal-DB-Tabelle, keine neue Seasonal-Migration, keine Secrets, keine neuen laufenden Kosten.

---

## 7. Exact-Head Evidence für den geprüften Runtime-Head

Unabhängig verifiziert für `de83d0269e1910ef82a596dd6e7005001f1cb860`:

- PR #38: open, mergeable, Draft, nicht gemergt;
- Base/Main: `cd220beb44d90ae376feeb8de9db8a3afb808d60`, Branch 0 behind;
- GitHub Actions Run `32654092944`: **SUCCESS** auf exakt `de83d026...`;
- Vercel Deployment `dpl_F9g6B69cw1B12Q2YRK2oyoC9okTE`: **READY** auf exakt `de83d026...`;
- Cursor-Gate-Lock dokumentiert `npm test 1593/1593`, Typecheck/Lint/Hygiene grün, Production-Build Exit 0, UI-Audit `1014/1014`, DB-Gates grün;
- nachfolgender Docs-Lock `0c0ba91a...` ist genau ein Dokumentations-Commit ohne Runtime-Dateien;
- GitHub Actions Run `32654883182`: **SUCCESS** auf dem Docs-Lock;
- Vercel Deployment `dpl_9gvqqM2Uqnw5qvQzaZ1nsVBmxVGi`: **READY** auf dem Docs-Lock.

Grüne Gates ersetzen die vier R9-Befunde nicht.

---

## 8. R9 Stop-Kriterium / nächster Schritt

Cursor soll **Blocker 16–19 gemeinsam als Route-Topologie-/Chronologie-/Readiness-Stale-Härtung** schließen und die oben geforderten Regressionen ergänzen.

Priorität:

1. keine strukturierte Route-Topologie unterhalb der Leg-Grenze verlieren;
2. Connection-Ownership über Legs eindeutig machen;
3. Chronologie nur dann als bewiesen behandeln, wenn die Evidenz wirklich eine eindeutige Reihenfolge trägt;
4. keine Prefix-Truncation für Stale-/Readiness-Fingerprints.

Danach:

- vollständige Tests, Typecheck, Lint/Hygiene, Production-Build, UI-Audit;
- Security/DB-Gates unverändert grün;
- GitHub Actions und Vercel auf **exaktem neuem Runtime-Head**;
- genau ein Docs-Lock danach, kein zweites Runtime-Gate;
- unabhängiger ChatGPT-Re-Review **R10**.

**PASS erst, wenn R10 nach erneutem adversariellem Durchgang keinen weiteren konkreten merge-blocking Defekt findet.**

PR bleibt Draft. Kein Mark Ready. Kein Merge ohne ausdrückliche Product-Owner-Freigabe.
