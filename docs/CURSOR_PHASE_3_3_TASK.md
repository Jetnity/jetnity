# Cursor-Auftrag – Phase 3.3: Activities Foundation

Stand: 20. August 2026

## Rolle und Ausgangspunkt

Du bist der Hauptentwickler von Jetnity. Arbeite ausschließlich auf Branch `phase-3-3-activities-foundation` und am zugehörigen Draft-PR. Lies vor Änderungen vollständig:

- `AGENTS.md`
- `JETNITY_HANDOFF.md`
- `JETNITY_VISION.md`
- `ARCHITECTURE.md`
- `ROADMAP.md`
- `DECISIONS.md`
- `DESIGN_SYSTEM.md`
- `docs/PRODUCT_QUALITY_STANDARD.md`
- `docs/REISEN.md`
- `docs/HOTELS.md`
- `docs/FLUEGE.md`
- relevante Reise-/Änderungs-/Schutzlogik und Tests

Phase 3.2/3.2c Hotel Foundation ist bereits nach `main` gemergt. Die Hotelarchitektur ist ein Qualitätsreferenzpunkt, aber Aktivitäten sollen keine Kopie davon werden: ihre fachlichen Anforderungen sind zeit-, tages- und ortsgebunden.

## Harte Grenzen

- PR bleibt Draft, bis ChatGPT/Product-Review ausdrücklich Ready freigibt.
- Nicht nach `main` mergen.
- Keine Production-Änderung.
- Keine Production-Migration.
- Kein echter Aktivitäten-Provider in diesem Auftrag.
- Keine Provider-Registrierung, kein Secret, kein API-Key.
- Keine neuen laufenden Kosten oder externen Dienste.
- Keine Fake-Aktivitäten, erfundenen Preise, Bewertungen, Verfügbarkeiten, Öffnungszeiten, Wegezeiten oder Booking-/Affiliate-URLs in der UI.
- Production-Aktivitätensuche bleibt hart aus.
- Search-Provider und Affiliate-/Booking-Verantwortung getrennt halten.
- Provision, Affiliate-Höhe oder Providername dürfen das fachliche Ranking nicht beeinflussen.
- Bestehenden Flight-/Hotel-/Trip-Schutz nicht regressieren.
- Ursache beheben, nicht Tests oder Symptome passend machen.

## Produktziel

Jetnity soll Aktivitäten nicht als beliebige Ticketliste behandeln. Eine Aktivität ist dann gut, wenn sie zur **konkreten Reise und zum konkreten Reisetag** passt.

Zielbild:

`Reisegraph → Etappe/Tag → belastbarer Tageskontext → ActivityProvider → normalisierte Optionen → Jetnity-Kontext → deterministisches Ranking → verständliche Empfehlung → Nutzerentscheidung → vertrauenswürdige Trip-Übernahme`

Die Foundation muss später echte Anbieter wie GetYourGuide oder andere geeignete Quellen aufnehmen können, ohne UI, Ranking oder Reisegraph neu zu bauen. In Phase 3.3 wird noch kein Anbieter ausgewählt oder angebunden.

## 1. Provider-unabhängige Activity-Domain

Lege eine klar getrennte Domain unter `lib/activities/` an. Mindestens modellieren:

- kanonische Suchanfrage
- Ziel/Etappe und optional konkreter Reisetag
- lokale Datum-/Zeitfenster ohne falsche Zeitzonenannahmen
- Reisende/Teilnehmer, soweit das aktuelle Reiseschema die Information trägt
- Interessen aus dem Reisegraphen
- Budget-/Währungskontext, soweit belastbar
- normalisierte Aktivitätsoption
- Provider-ID und externe Referenz als kommerzielle Fakten
- Titel/Beschreibung nur soweit vom Provider geliefert
- Ort/Koordinate nullable, nichts erfinden
- Start-/Ende bzw. Dauer nullable, wenn Quelle es nicht liefert
- Preis/Währung nullable bzw. strikt als Provider-Fakt
- Bewertung/Anzahl Bewertungen nullable
- Stornierbarkeit nullable
- Kategorie/Tags nur normalisiert, wenn Quelle sie trägt
- Verfügbarkeits-/Timeslot-Fakten getrennt von statischem Content

Keine Provider-Rohobjekte in UI- oder Trip-Typen durchsickern lassen.

## 2. Schmales Provider-Interface

Definiere ein `ActivityProvider`-Interface analog zum Architekturprinzip der Flüge/Hotels, aber fachlich passend.

Es soll nur die Suche bzw. Discovery verantworten. Booking/Affiliate/Redirect bleibt separat.

Keine Next-, Supabase- oder Provider-SDK-Abhängigkeit in der Domain-Schnittstelle.

Providerfehler mindestens typisieren: Timeout, unavailable, invalid response, generic error.

## 3. Tageskontext statt isolierter Liste

Baue eine provider-unabhängige Kontextschicht, die aus dem bestehenden Reisegraphen belastbare Eingaben ableitet.

Berücksichtige nur Daten, die Jetnity wirklich besitzt:

- Etappe / `placeId` / Koordinaten
- konkreter Reisetag und Datum, falls vorhanden
- bereits eingeplante Punkte dieses Tages
- Start-/Endzeiten vorhandener Punkte, soweit vorhanden
- Reiseinteressen
- Reisetempo
- Budgetkontext

Wichtig:

- Keine Öffnungszeiten erfinden.
- Keine Wegezeiten erfinden.
- Keine Annahme machen, dass zwei Aktivitäten örtlich nahe sind, nur weil sie in derselben Stadt liegen.
- Ohne belastbare Routingdaten keine „5 Minuten entfernt“-Aussagen.
- Ohne konkrete Tageszeiten keine künstliche minutengenaue Lücke behaupten.
- Wenn der Reisegraph für einen Tag zu wenig Daten liefert, ehrlich degradieren statt eine Präzision zu simulieren.

## 4. Deterministisches, provisionsneutrales Ranking

Implementiere eine nachvollziehbare Rangfolge für Activity-Kandidaten. Die Gewichte müssen als benannte Konstanten sichtbar und getestet sein.

Sinnvolle Dimensionen, sofern Daten vorhanden:

- Passung zu Reiseinteressen
- zeitliche Passung zum Reisetag / Konfliktfreiheit
- Preis bzw. Budget-Fit
- Qualität/Bewertung
- Evidenz durch Bewertungsanzahl
- Flexibilität/Stornierung
- Dauer-Fit zum Reisetempo und vorhandenen Tagespunkten
- Orts-/Lage-Fit nur mit belastbaren Daten; ohne Routing keine erfundene Nähe

Fehlende Daten dürfen nicht automatisch als schlecht gelten und auch nicht mit erfundenen Neutralwerten echte Signale verdünnen. Orientiere dich an der nach Phase 3.2 korrigierten Hotel-Logik: unbekannt bleibt unbekannt; vorhandene Evidenz wird nicht durch fiktive 0,5-Signale überdeckt.

Providername und Provision sind ausdrücklich keine Rankingdimension.

Ergebnisse sollen wenige klare Labels unterstützen, z. B.:

- Jetnity-Empfehlung
- Best Value
- beste Bewertung
- flexibel
- kurze Aktivität / gut integrierbar, nur wenn Daten das tragen

Keine Label-Inflation. Ein Label braucht eine nachvollziehbare fachliche Regel.

## 5. Konflikt- und Zeitlogik

Aktivitäten sind stärker zeitgebunden als Hotels. Implementiere deshalb eine kleine, reine Konfliktlogik:

- vorhandene `trip_items` mit Datum/Zeit berücksichtigen
- eindeutig überlappende Aktivität ablehnen oder im Ranking klar bestrafen
- bei fehlenden Zeiten nicht so tun, als sei Konfliktfreiheit bewiesen
- lokale `HH:MM`-Semantik des bestehenden Reisegraphs respektieren
- keine Zeitzone aus Ortskoordinaten raten
- Tagesgrenzen und mehrtägige Optionen sauber behandeln oder zunächst explizit nicht unterstützen

Die Foundation muss klar dokumentieren, welche Fälle sie heute sicher beurteilen kann und welche nicht.

## 6. Geschlossene Search-API

Erstelle einen geschlossenen Jetnity-Endpunkt, z. B. `POST /api/activities/search`.

Anforderungen analog zum gehärteten Hotel-Endpunkt:

- nur klar definierte Jetnity-Anfrage, kein offener Provider-Proxy
- Runtime-Schema / untrusted input validieren
- `application/json`
- begrenzte Request-Größe **vor** vollständiger Allokation, nicht erst nach `req.text()`
- sinnvolle 400/413/415/429-Semantik
- `Retry-After` bei Rate-Limit
- `cache-control: no-store`
- serverseitiger Timeout
- keine Rohdaten, internen Scores, Secrets, Stacktraces oder Env-Werte an Client
- Preview-Rate-Limit darf zunächst In-Memory sein, muss aber explizit als nicht Production-tauglich dokumentiert werden
- Production muss selbst bei falsch gesetzten Aktivierungsvariablen fail closed bleiben

Ohne Provider liefert die API einen verständlichen `unavailable`-Zustand. Keine Fake-Treffer.

## 7. Serverseitige Vertrauensgrenze für Übernahme

Baue von Anfang an die gleiche Sicherheitsklasse wie bei Hotels:

Der Browser darf bei einer Konto-Reise keine kommerziellen Activity-Fakten frei persistieren.

- Browser liefert höchstens Kennungen/Selection Input.
- Preis, Währung, Provider, External-Ref, Termin/Timeslot und ggf. Booking-Fakten müssen später serverseitig aus einer vertrauenswürdigen Quelle bestätigt werden.
- Definiere eine provider-unabhängige `ActivityNachweis`-/Selection-Naht.
- Solange kein echter Nachweis existiert, kommerzielle Konto-Übernahme **fail closed**.
- Der Nachweis muss an den erwarteten Kontext gebunden sein: Ziel/Etappe, Datum, Teilnehmer, Währung und – falls die Option einen Timeslot trägt – den bestätigten Timeslot.
- Search-Provider und späterer Affiliate-/Redirect-Partner müssen nicht identisch sein.
- Kein neues Secret-Signaturverfahren erfinden.

Tests mit Fake-Nachweis erlauben; kein Produktions-Fake.

## 8. Reisegraph-Integration

Das bestehende Schema unterstützt `trip_items.kind = activity` bereits. Nutze es, statt vorschnell eine neue Migration zu bauen.

Bei bestätigter Übernahme in Tests/Architektur:

- `trip_id`, `stage_id`, `day_id` serverseitig prüfen
- Tag muss zur Reise und fachlich zur Etappe passen, soweit das Schema es belegt
- Datum/Zeit aus vertrauenswürdiger Auswahl und Reisegraph konsistent halten
- kommerzielle Momentaufnahme in vorhandene Felder schreiben
- `booking_url` bleibt `null`, solange kein echter Redirect-/Bookingpfad existiert
- keine Browser-Option als kommerzielle Wahrheit speichern

Prüfe außerdem den gemeinsamen Schutz gegen natürliche Sprach-/Modelländerungen. Ein kommerziell bestätigter Activity-Punkt darf nicht still umterminiert, verschoben, inhaltlich verändert oder gelöscht werden. Bestehender Flug-/Hotel-Schutz muss erhalten bleiben; wenn möglich gemeinsamen Schutz verallgemeinern statt Activity-Sonderweg daneben bauen.

## 9. Nutzeroberfläche im Reise-Arbeitsbereich

Integriere einen kleinen Activity-Bereich in den bestehenden Trip Workspace, nicht als isolierte Demo-Seite.

Qualitätsanforderungen aus `docs/PRODUCT_QUALITY_STANDARD.md` sind **Abnahmekriterien**, keine Nice-to-haves:

- mobile-first
- bestehendes Jetnity-Designsystem
- klare Navigation und Informationshierarchie
- schneller wahrgenommener Ablauf
- Skeleton/Loading nur dort, wo sinnvoll
- verständliche Empty/Unavailable/Error/Timeout/Rate-Limit-Zustände
- Screenreader-/Keyboard-/Focus-Verhalten
- keine Layout-Shifts oder unnötigen Animationen
- echte Daten klar von Jetnity-Empfehlung/Interpretation trennen
- Empfehlungen in Alltagssprache erklären, keine internen Scores anzeigen

Ohne Provider zeigt die Oberfläche keine Fake-Karten. Sie darf erklären, dass passende Aktivitäten vorbereitet werden, und nur belegbare Reise-/Tageskontexte zeigen.

## 10. Gastmodus

Gastdaten liegen in LocalStorage und sind nicht serverseitig verifiziert. Dokumentiere diese Grenze klar.

- keine Gastdaten als „verifiziert“ darstellen
- keine künstliche Sicherheit vortäuschen
- Struktur kompatibel mit späterer Gast→Konto-Übernahme halten

## 11. Tests und Qualitätsnachweis

Mindestens gezielt testen:

- Domain-/Schema-Grenzen
- Providerfehler
- deterministisches Ranking und stabile Tie-Breaker
- Provision/Providername beeinflusst Ranking nicht
- fehlende Daten werden nicht erfunden
- eindeutige Zeitüberschneidungen werden erkannt
- unbekannte Zeitlage wird nicht fälschlich als konfliktfrei behauptet
- falsche Reise/Etappe/Tag-Konstellation wird abgewiesen
- Browser kann keinen erfundenen kommerziellen Activity-Punkt ins Konto schreiben
- vertrauenswürdiger Fake-Nachweis funktioniert in Tests
- Nachweis-Kontext mismatch/abgelaufen/geändert/unbekannt wird abgewiesen
- API Content-Type, Stream-Cap, Rate-Limit, Retry-After, no-store
- Production hard off
- Client-Sicht enthält keine internen Scores/Rohdaten/Secrets
- bestehende Flight-/Hotel-/Reiseänderungstests bleiben grün

Danach vollständig ausführen:

- `npm test`
- Typecheck
- Lint
- alle bestehenden Hygiene-Checks
- Production-Build
- GitHub CI
- Vercel Preview

Kein echter Providercall in Tests/CI.

## 12. Performance und Produktqualität

Nicht nur funktional grün sein. Audit die neue Oberfläche explizit gegen den Produktqualitätsstandard:

- unnötige Client-JS vermeiden
- keine große Provider-/Rankinglogik in Browser-Bundles
- parallele/abbrechbare Requests, wo sinnvoll
- keine Request-Schleifen bei Re-Renders
- stabile Memoization/Dependencies
- keine horizontale Überbreite auf 280/320/360/390/430 px
- Touch-Ziele und Eingabefelder mobil korrekt
- keine irreführenden Ladezustände

Wenn bestehende Responsive-/Browser-Audits für neue Zustände erweitert werden müssen, erweitere sie gezielt.

## 13. Dokumentation

Erstelle `docs/ACTIVITIES.md` und aktualisiere nur, was der Code tatsächlich belegt:

- `ARCHITECTURE.md`
- `ROADMAP.md`
- `DECISIONS.md` nur bei echter neuer Architekturentscheidung
- `JETNITY_HANDOFF.md`
- `docs/REISEN.md` bei relevanter Trip-Integration
- PR-Beschreibung, sofern Agent dies darf

Dokumentiere als bewusst offen:

- erster echter Activity-Provider
- Providerzugang/Key
- echte Preview-Verifikation
- Affiliate-/Redirect-Pfad
- reale Routing-/POI-/Öffnungszeitdaten, soweit künftig benötigt
- globales/gespeichertes Rate-Limit vor Production
- Production-Aktivierung nur nach separater Freigabe

## Abschlussbericht

Am Ende kurz, prüfbar und ohne Marketingformulierungen berichten:

1. Architektur und neue Dateien
2. Ranking-/Konfliktlogik
3. Vertrauensgrenze und Missbrauchsschutz
4. UI-/Mobile-/Accessibility-/Performance-Nachweis
5. Tests/Typecheck/Lint/Hygiene/Build
6. GitHub-CI und Vercel-Preview
7. Commits/Dateien
8. verbleibende Risiken/offene Providerpunkte
9. ausdrücklich bestätigen: kein Provider, kein Secret, keine Production-Änderung, kein Merge
