# PR #38 – ChatGPT Independent Review R8

Stand: 23. August 2026  
Status: **REQUEST CHANGES – R7-Blocker 13 geschlossen, R8-Blocker 14 und 15 offen**

PR: `#38 – Travel Timing & Seasonal Intelligence`  
Branch: `feat/travel-timing-seasonal-intelligence`  
Base/Main beim R8-Lock: `cd220beb44d90ae376feeb8de9db8a3afb808d60`  
Geprüfter Runtime-Head R8: `ece075e702c491454c553a9fc931b26308cab1a9`  
Docs-Lock vor R8: `c13cd3f8f208900a230d0173bfe563fd97109a0c`  
Sync beim R8-Lock: **0 behind** `main`  
PR-Zustand: **open, mergeable, Draft, nicht gemergt**

## 1. R8-Urteil

Der unabhängige R8-Closure-Review wurde nach `docs/INDEPENDENT_REVIEW_DEPTH_STANDARD.md` auf dem tatsächlichen Runtime-Head `ece075e7` durchgeführt.

R7-Blocker 13 ist substanziell geschlossen:

- Transit wird pro belegtem Leg ermittelt;
- das Ziel eines Hin-Legs wird nicht durch ein späteres Rück-Leg zu Transit;
- Roundtrip als eine Itinerary und als getrennte Flight-Items liefert dieselben Country-Rollen;
- Multi-City `CH→TH→SG→CH` behält `TH` und `SG` als Ziele;
- echter Transit innerhalb eines Legs bleibt Transit;
- Readiness liest dieselbe Route-Truth;
- Item-Reihenfolge mit belegter Chronologie ändert die Rollenmenge nicht.

**Trotzdem noch kein PASS.** Der verpflichtende adversarielle Cross-Domain-/SoT-Durchgang zeigt zwei konkrete Restdefekte derselben Route-Topologieklasse. Beide sind reproduzierbar und beeinflussen Seasonal, Readiness, Safety bzw. kanonische Route-Identität.

PR #38 bleibt Draft. Kein Mark Ready und kein Merge ohne ausdrückliche Freigabe des Product Owners.

---

## 2. Merge-Blocker 14 – Open-Jaw-/diskontinuierliche Leg-Ursprünge verschwinden aus Country-Truth

### Betroffene Stellen

- `lib/route/laender.ts`
- `lib/route/ableitung.ts`
- `lib/seasonal/kontext.ts`
- `lib/seasonal/relevanz.ts`
- `lib/readiness/kontext.ts`
- `lib/safety/kontext.ts`
- Regressionen in Route/Seasonal/Readiness/Safety

### Reproduzierbarer gültiger Fall

Eine Open-Jaw-Reise besteht aus zwei belegten Legs:

1. `ZRH (CH) → BKK (TH)`
2. später `SIN (SG) → ZRH (CH)`

Die Route beweist strukturiert, dass der Reisende sich in Singapur befindet: Er startet dort den Rückflug. Dafür ist weder Freitext noch eine Vermutung nötig.

### Aktuelles Problem

`ziellaenderAus()` nimmt aktuell nur das **letzte Segmentziel jedes Legs** als Zielstaat und schließt das globale Ursprungsland aus.

Für das Beispiel entstehen daher:

- Leg 1 Ende = `TH` → Ziel
- Leg 2 Ende = `CH` → als globales Origin ausgeschlossen
- Leg-2-Ursprung `SG` → wird überhaupt nicht als belegter Besuchs-/Zielkontext berücksichtigt

Ergebnis: `destinationCountryCodes = ['TH']`; `SG` fehlt.

Diese Lücke propagiert in mehrere Domänen:

#### Seasonal

`seasonalReisekontext().countryCodes` wird aus Stages plus `route.origin`, `route.destination`, Transit- und Destination-Country-Codes aufgebaut. Ohne SG-Stage fehlt `SG` deshalb im Provider-Request.

Noch kritischer: `routeBeruehrtLand()` prüft für Country-Scope ebenfalls nur `route.origin`, `route.destination`, Transit- und Destination-Country-Codes. Ein source-backed Country-Seasonal-Fact für `SG` kann daher bei obiger Open-Jaw-Route fälschlich `not_applies` werden, obwohl ein strukturiertes Flugsegment in Singapur startet.

#### Readiness

`readinessReisekontext()` ergänzt Destination Countries aus `route.destinationCountryCodes`. SG fehlt, solange keine Stage den Fehler zufällig kompensiert. Dadurch können Entry-/Visa-/Document-Checks für ein durch die Route belegtes Land fehlen.

#### Safety

`safetyReisekontext().countryCodes` verwendet dieselben Country-Rollen. Ein landesweiter Safety-/Advisory-Provider kann SG deshalb ebenfalls aus der Anfrage verlieren, obwohl die Route einen belegten Aufenthalt dort beweist.

### Warum merge-blocking

- Es ist ein normaler, realer Reisegraph (Open Jaw), kein künstlicher malformed Input.
- Die Wahrheit stammt aus strukturierten Route-Facts.
- Die Lücke erzeugt direkte False Negatives bei Seasonal Country Scope.
- Sie kann Readiness-/Visa- und Safety-Country-Kontext auslassen.
- Sie verletzt den verbindlichen Jetnity-Grundsatz, dass fachlich abhängige Funktionen dieselbe kanonische Wahrheit konsistent verwenden.

### Erforderliche Korrektur

Country-Rollen müssen die belegte **Leg-Topologie vollständig** berücksichtigen:

- globale Reise-Origin darf nicht allein dadurch zum Reiseziel werden, dass ein Rückflug dort endet;
- echter Transit bleibt ausschließlich ein Zwischenpunkt innerhalb desselben belegten Legs;
- **Origins späterer Legs**, die nicht das globale Reise-Origin sind, sind als belegte Besuchs-/Ziel-Länder zu berücksichtigen, wenn die Route dort startet;
- Open-Jaw-/Surface-Segmente zwischen zwei Legs dürfen nicht dazu führen, dass ein Land aus Seasonal/Readiness/Safety verschwindet;
- Rollen müssen für dieselbe Route unabhängig davon identisch sein, ob Legs in einer Itinerary oder in mehreren Flight-Items gespeichert sind;
- keine Rolle aus Titel, Note oder Ortslabel ableiten.

### Chronologie-Rand derselben Fehlerklasse

`itinerariesAusReise()` sortiert Itineraries derzeit primär über nullable `TripItem.startsOn/startsAt`. `fruehesteZuerst()` fällt bei fehlender Item-Chronologie auf eine deterministische Pfadsortierung zurück.

Da `TripItem.startsOn` laut kanonischem Trip-Typ nullable ist, kann ein gültiger Zustand entstehen, in dem das Outbound-Item kein Item-Datum trägt, die strukturierte Route aber Segmentdaten besitzt. Dann darf ein späteres Return-Item nicht zum „globalen Origin“ werden, nur weil seine Item-Daten vollständiger sind.

Erforderlich:

- wenn Item-Chronologie fehlt, aber strukturierte Segment-Chronologie vorhanden ist, diese für die Route-Reihenfolge/Origin-Bestimmung verwenden;
- wenn die Chronologie wirklich nicht beweisbar ist, fail-closed/conservativ bleiben – niemals lexikographische Airport-Pfade zu fachlicher Country-Truth machen.

### Pflicht-Regressionen Blocker 14

Mindestens:

1. Open Jaw in einer Itinerary: `CH→TH` + `SG→CH` → Ziele enthalten `TH` und `SG`, Transit leer;
2. derselbe Open Jaw als zwei Flight-Items → identische Country-Rollen;
3. Seasonal Country Scope `SG` → `applies` bzw. fachlich gleichwertig, nicht `not_applies`;
4. Seasonal Provider Request enthält `SG` in `countryCodes`;
5. Readiness Destination Context enthält `SG`;
6. Safety Country Context enthält `SG`;
7. Multi-City `CH→TH→SG→CH` bleibt korrekt;
8. echter Transit innerhalb eines Legs bleibt Transit und wird nicht pauschal Destination;
9. Input-Item-Reihenfolge ändert Rollen bei belegter Chronologie nicht;
10. Outbound-`TripItem.startsOn=null`, Segment-Abflugdatum vorhanden, Return-Item datiert → globales Origin/Zielrollen bleiben korrekt;
11. beide Item-Daten fehlen, Segmentdaten sind eindeutig → strukturierte Chronologie bestimmt die Reihenfolge;
12. wirklich unklare Chronologie → keine erfundene Rollenentscheidung aus lexikographischem Pfad;
13. Guest-/Account-Parität für dieselbe kanonische Route.

---

## 3. Merge-Blocker 15 – Leg-Ursprünge und Leg-Grenzen fehlen in Route-Identität und Darstellung

### Betroffene Stellen

- `lib/route/itinerary.ts`
- `lib/route/fingerprint.ts`
- `lib/route/ableitung.ts`
- `lib/route/anzeige.ts`
- indirekt Readiness-Stale / Route-Fingerprint
- Regressionen für Open Jaw / Multi-Leg / Guest-Account

### Problem

`segmenteAusItinerary()` flacht alle Legs zu einer Segmentliste ab.

`pfadAusSegmenten()` kodiert danach:

- nur den Origin des **ersten** Segments;
- danach nur noch jedes Segment-Destination.

Diese Darstellung ist nur dann verlustfrei, wenn sämtliche Segmente eine durchgehend zusammenhängende Kette bilden. Zwischen getrennten Legs ist diese Annahme falsch.

### Reproduzierbarer Fingerprint-Kollisionsfall

Itinerary A:

- Leg 1: `ZRH→BKK`
- Leg 2: `SIN→ZRH`

Itinerary B:

- Leg 1: `ZRH→BKK`
- Leg 2: `HKG→ZRH`

Bei der aktuellen flachen Pfadbildung können beide sinngemäß zu

`ZRH→BKK→ZRH`

werden, weil der Origin des zweiten Legs (`SIN` bzw. `HKG`) nicht im Pfad landet.

Damit kann `routeFingerprintAus()` für zwei fachlich verschiedene Routen dieselbe Identität erzeugen.

### Endwirkung

#### Readiness-Stale

Readiness verwendet `routeFingerprint` als Teil seiner Context-Fingerprints. Gleichzeitig fehlt im aktuellen Open-Jaw-Fall auch das spätere Leg-Origin-Land aus `destinationCountries`.

Damit kann eine Änderung `SIN→HKG` im Return-Leg für Entry-/Visa-/Travel-Document-Checks **keinen Fingerprint-Wechsel** erzeugen, obwohl sich ein durch die Route belegtes Land geändert hat.

Ein bereits als `done` gespeicherter Readiness-Check kann dadurch scheinbar aktuell bleiben, obwohl die Reise jetzt ein anderes Land berührt.

#### Anzeige

`routeKompakt()` baut ebenfalls aus der flachen Segmentliste. Ein Open-Jaw `ZRH→BKK` / `SIN→ZRH` darf nicht als scheinbar zusammenhängende Route `ZRH→BKK→ZRH` dargestellt werden, weil dabei Singapur vollständig verschwindet.

### Warum merge-blocking

- kanonische Route-Identität kollidiert für unterschiedliche belegte Routen;
- Readiness-Stale kann dadurch eine relevante Reiseänderung verpassen;
- die UI kann eine falsche Route anzeigen;
- dieselbe Leg-Grenze ist bereits für Airport Contacts und Country Roles fachlich relevant und darf nicht nur in einzelnen Projektionen erhalten bleiben.

### Erforderliche Korrektur

Die kanonische Route-Identität muss Leg-Grenzen und jeden Leg-Origin erhalten.

Akzeptabel ist z. B. eine leg-aware Serialisierung wie:

`ZRH>BKK | SIN>ZRH`

Die konkrete Implementierung ist frei, solange:

- jedes Leg separat identifizierbar bleibt;
- jeder Leg-Origin und jedes Leg-Destination enthalten ist;
- echte Connections innerhalb eines Legs weiterhin als zusammenhängende Kette behandelt werden;
- dieselbe kanonische Route bei Guest/Account und anderer Item-Array-Reihenfolge denselben Fingerprint erhält;
- eine fachliche Änderung eines späteren Leg-Origins einen neuen Fingerprint erzeugt;
- die menschliche Darstellung keine falsche Kontinuität über eine Open-Jaw-/Surface-Grenze behauptet.

### Pflicht-Regressionen Blocker 15

Mindestens:

1. `ZRH→BKK | SIN→ZRH` und `ZRH→BKK | HKG→ZRH` → unterschiedliche Route-Fingerprints;
2. derselbe Open-Jaw als eine Itinerary und als fachlich äquivalente getrennte Items → semantisch gleichwertige Route-Identität bzw. nach dokumentiertem Vertrag konsistente Stale-Wirkung;
3. Input-Array-Reihenfolge ändert die kanonische Identität nicht;
4. Guest-/Account-Parität bleibt erhalten;
5. Readiness-Context-Fingerprint ändert sich bei `SIN→HKG`, selbst wenn Top-Level-Tripdatum und Item-ID unverändert bleiben;
6. `routeKompakt`/Route-Anzeige bewahrt den Origin des zweiten Legs und die Leg-Grenze; keine falsche `ZRH→BKK→ZRH`-Kontinuität;
7. normaler Roundtrip `ZRH→BKK | BKK→ZRH` bleibt korrekt lesbar;
8. echter Transit `ZRH→DOH→BKK` innerhalb **eines** Legs bleibt eine zusammenhängende Route;
9. Multi-City mit drei Legs bewahrt alle Leg-Endpunkte;
10. bestehende Airport-Contact-, Country-Role-, Safety-, Seasonal- und Readiness-Regressionen bleiben grün.

---

## 4. Was R8 ausdrücklich bestätigt / nicht erneut öffnet

- R7-Blocker 13 ist geschlossen für die dort geprüften Roundtrip-/Multi-City-/Transitfälle.
- R6-Blocker 12 bleibt geschlossen: Airport Contacts werden nicht wieder über getrennte Legs/Items verschmolzen.
- R5-Blocker 10/11 bleiben geschlossen: Provider-Port hat konkrete Zeitkontakte; Acute + unavailable bleibt rejected-domain.
- frühere Truth-/Calendar-/Fingerprint-/Provider-Normalisierungs-/API-Graph-Fixes bleiben im geprüften Patch unverändert.
- `seasonalProviderAus()` bleibt absichtlich `null`.
- keine Seasonal-DB-Tabelle, keine Migration, keine Secrets, keine neue Kostenaktivierung.
- In-process Rate-Limit, Account-`tripId`-Serverload und persistiertes `Trotzdem so planen` bleiben dokumentierte spätere Nähte und werden nicht künstlich in diesen Fix gezogen.

---

## 5. Exact-Head Evidence für den geprüften Runtime-Head

Unabhängig verifiziert für `ece075e702c491454c553a9fc931b26308cab1a9`:

- GitHub Actions Run `32652022144`: **SUCCESS**;
- Vercel Deployment `dpl_ErhdduWunftgMmRRUxqBGCJPtRnV`: **READY** auf exakt diesem SHA;
- Cursor-Gate-Lock dokumentiert `npm test 1580/1580`, Typecheck/Lint/Hygiene grün, Production-Build Exit 0, UI-Audit `1014/1014`, DB-Gates grün;
- Branch beim R8-Lock **0 behind main**;
- PR bleibt Draft und nicht gemergt.

Der nachfolgende Docs-Lock `c13cd3f8` ist ebenfalls CI/Vercel-grün, ersetzt aber das Runtime-Gate nicht.

---

## 6. R8 Stop-Kriterium / nächster Schritt

Cursor soll **ausschließlich Blocker 14 und 15 als gemeinsame Leg-Topologie-Härtung** schließen und die oben geforderten Regressionen ergänzen.

Wichtig: keine neue Heuristik, die aus unbewiesenen Labels/Titeln/Notizen oder willkürlicher Airport-Reihenfolge Reise-Truth erzeugt. Leg-Grenzen und Country-Rollen müssen aus strukturierten Itinerary-Facts kommen.

Danach:

1. vollständiges Exact-Head-Gate auf dem neuen Runtime-Head;
2. unabhängiger ChatGPT-R9-Closure-Review;
3. Stop-Kriterium streng anwenden: nur noch konkrete reproduzierbare bzw. direkt code-abgeleitete Defekte mit relevantem Truth-/Provider-/Security-/SoT-/Cross-Domain-/Release-Einfluss dürfen blockieren.

Wenn R9 danach keinen solchen Defekt mehr findet, ist technisches Closure/PASS erreicht.

PR bleibt bis dahin **Draft**. Kein Mark Ready, kein Merge ohne ausdrückliche Freigabe des Product Owners.