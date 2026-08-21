# Cursor-Auftrag – Foundation A: Mobilität & Transfers

Stand: 21. August 2026

Branch: `feat/mobility-transfers-foundation`

Basis-Commit auf `main`: `211872c1aad0e002d81f5ea1fb2d7eef4490d4b7` (PR #29 – Trip Coverage & Booking Status)

Dieser Auftrag ist ein eigenständiger provider-unabhängiger Foundation-Block. **Phase 3.4 (erster echter Hotel-Suchadapter) bleibt extern blockiert/wartend**, bis ein echter Hotelprovider-Zugang vorliegt. Dieser Auftrag ist **nicht** Phase 3.4 und darf Phase 3.4 nicht vortäuschen.

## 0. Verbindlich zuerst lesen

Vor Architektur- oder Codeänderungen vollständig lesen und den aktuellen Repository-Stand prüfen:

1. `AGENTS.md`
2. `JETNITY_VISION.md`
3. `JETNITY_HANDOFF.md`
4. `ROADMAP.md`
5. `ARCHITECTURE.md`
6. `DECISIONS.md`
7. `DESIGN_SYSTEM.md`
8. `docs/PRODUCT_QUALITY_STANDARD.md`
9. `docs/CONTINUITY_STANDARD.md`
10. `docs/REISEN.md`
11. `docs/DATENBANK.md`
12. `docs/FLUEGE.md`
13. `docs/HOTELS.md`
14. `docs/ACTIVITIES.md`
15. alle relevanten `lib/trips/*`, `lib/flights/*`, `lib/hotels/*`, `lib/activities/*`, Trip-Workspace-Komponenten, Übernahme-/Commercial-Protection-Wege, Supabase-Migrationen und Tests.

`docs/CONTINUITY_STANDARD.md` ist Teil der Definition of Done. Der Auftrag ist nicht fertig, solange Handoff/Roadmap/Architektur/Entscheidungen/Fachdoku den tatsächlichen Stand nicht korrekt wiedergeben.

## 1. Produktziel

Jetnity soll Mobilität **nicht als vier neue isolierte Suchmaschinen** bauen. Bahn, Bus, Fähre und Transfers bilden im Produkt einen gemeinsamen Bereich **„Mobilität“** und hängen am selben Reisegraphen wie Flüge, Unterkunft, Aktivitäten, Tagesplan, Budget und Buchungsstatus.

Der Nutzer soll möglichst wenig selbst prüfen müssen. Jetnity soll langfristig verstehen können:

- wie er zwischen Reiseetappen kommt,
- welche Verbindung bereits geplant/ausgewählt/gebucht ist,
- wo eine Verbindung noch fehlt,
- ob bekannte Zeiten miteinander kollidieren oder ausreichend/unbestimmt sind,
- welche Auswirkungen eine Änderung auf die restliche Reise hat.

Dabei gilt weiterhin:

`Änderung erkennen → Auswirkungen auf Gesamtreise bestimmen → Lösung vorschlagen → Nutzer bestätigt`

Keine Live-Fakten erfinden. Keine Wegezeiten, Fahrpläne, Preise, Betreiber, Verfügbarkeiten, Haltestellen oder Anschlussgarantien behaupten, wenn dafür keine belastbare Quelle existiert.

## 2. Scope dieser Foundation

Provider-neutral vorbereiten für genau diese Mobilitätsarten:

- Bahn
- Bus
- Fähre
- Transfer (z. B. Shuttle/privater Transfer als allgemeiner Transferbaustein)

Nicht in diesem Auftrag:

- Mietwagen – eigener Folgeblock
- Kreuzfahrten – bewusst später
- Flugarchitektur neu bauen
- lokale ÖV-Komplettplattform mit Tram/Metro-Livefahrplänen
- Provider auswählen oder anbinden
- echte Preise/Verfügbarkeiten simulieren
- Production-Suche aktivieren

Die Architektur soll spätere Erweiterungen erlauben, aber **keine speculative enum explosion** bauen.

## 3. Bestehendes Reisedatenmodell respektieren

Wichtiger Ausgangspunkt: `trip_items.kind` enthält bereits `transfer`. Bahn, Bus, Fähre und Transfers sollen **nicht** durch vier neue Top-Level-`kind`-Werte fragmentiert werden. Prüfe zuerst, ob `kind='transfer'` als gemeinsamer persistenter Mobilitäts-Planpunkt weiterhin die sauberste Basis ist.

Mobilität benötigt jedoch strukturierte Fakten, die Jetnity später vergleichen/abfragen muss. Essenzielle Routing-/Mobilitätsfakten dürfen nicht einfach in `metadata` versteckt werden, wenn sie für Abdeckung, Konflikte, Darstellung oder spätere Providerprüfung gebraucht werden.

Vor Implementierung eine kurze Architekturentscheidung treffen und in `DECISIONS.md` dokumentieren:

- Welche Mobilitätsfelder sind wirklich dauerhaft strukturiert nötig?
- Gehören sie als wenige optionale Spalten auf `trip_items` oder in eine schmale 1:1-Mobilitätstabelle?
- Wie werden RLS, Ownership, Gastreise, Kontoübernahme, Revision/Idempotenz und natürliche Reiseänderung korrekt mitgeführt?

Keine unnötige Tabelle bauen, aber auch keine fachlich wichtigen Daten in JSONB verstecken, nur um eine Migration zu vermeiden.

## 4. Fachliches provider-neutrales Modell

Erstelle eine kleine, klare Mobilitätsdomäne unter z. B. `lib/mobility/` (Benennung nach bestehendem Projektstil prüfen).

Mindestens modellieren:

- Mobilitätsart: `rail | bus | ferry | transfer`
- Startpunkt und Zielpunkt mit ehrlicher Identität/Anzeige; vorhandene Jetnity-Place-Referenzen nutzen, wenn passend
- Abfahrts-/Ankunftsdatum und optional lokale Uhrzeit/Zeitzone
- Betreiber/Verbindungsnummer nur als optionale Provider-/Nutzerfakten, nie erfinden
- Preis/Währung nur als verifizierter Providerfakt oder ausdrücklich manuell erfasster Fakt
- Anzahl Umstiege/Stops nur wenn bekannt
- Flexibilitäts-/Stornoangaben nur wenn Quelle vorhanden
- Buchungsstatus aus derselben vertrauenswürdigen Logik wie PR #29
- Herkunft/Evidenz so modellieren, dass manuelle Eingabe und spätere Providerbestätigung unterscheidbar bleiben

Keine eigene zweite Wahrheit für Reise, Etappen, Tage oder Buchungsstatus erzeugen.

## 5. Buchungsstatus auf Mobilität erweitern

PR #29 erlaubt `booked` derzeit nur für `flight` und `stay`. Mobilitäts-Planpunkte müssen langfristig ebenfalls manuell als gebucht bestätigt werden können.

Wenn dafür eine Migration nötig ist:

- `trip_items.kind='transfer'` in die erlaubte kommerzielle Booking-Logik aufnehmen,
- Quelle in dieser Foundation weiterhin nur `user`, niemals Browser-Behauptung `provider`,
- vorhandene historische Transfer-Zeilen bleiben `unconfirmed`,
- gebuchte Transfers gegen natürliche Sprachänderung/Commercial-Protection entsprechend den bestehenden Flight/Stay-Regeln schützen,
- Konto-/Gast-/Übernahmepfade vollständig anpassen.

**Migration nur auf Supabase Development anwenden und dort verifizieren. Keine Production-Migration.** Production erfordert später separate ausdrückliche Nutzerfreigabe.

## 6. Mobilitäts-Abdeckung / Reisegraph

Baue eine deterministische, konservative Abdeckungslogik.

Ziel ist nicht, jede lokale Bewegung der Reise zu erraten. Die Foundation soll nur Aussagen machen, die aus dem vorhandenen Reisegraphen belastbar ableitbar sind.

Mindestens berücksichtigen:

- Etappenreihenfolge
- vorhandene Start-/Enddaten
- vorhandene Flug- und Transfer-Planpunkte
- bekannte Start-/Zielorte bzw. Place-Identitäten
- bekannte Abfahrts-/Ankunftszeiten

Wichtige Wahrheitsregel:

- Fehlende oder mehrdeutige Graphdaten → **„noch nicht vollständig bestimmbar“**, nicht fälschlich „offen“ oder „abgedeckt“.
- Ein vorhandener Planpunkt ist **ausgewählt/geplant**, nicht automatisch gebucht.
- Eine Verbindung darf nur als abgedeckt gelten, wenn Start/Ziel und relevante Zeit-/Datumsbeziehung deterministisch passen.
- Keine angenommene Wegezeit zwischen Flughafen, Bahnhof, Hotel oder Hafen.
- Kein erfundener Mindestumstieg. Wenn eine reine Zeitdifferenz belastbar berechenbar ist, darf sie als Fakt dargestellt werden; eine Bewertung „knapp/genug“ nur mit expliziter, dokumentierter Regel und klarer Semantik.

Prüfe, ob ein kleiner gemeinsamer `MovementEdge`/Verbindungsbedarf-Domainbegriff sinnvoll ist, um Flug und Transfer später gemeinsam zu verstehen. **Keine große Flight-Refaktorierung erzwingen.** Bestehende Flight-Funktionalität und Tests müssen unverändert funktionieren.

## 7. Provider-Naht – bis zum Schlüssel vorbereiten, aber nicht vortäuschen

Baue eine schmale provider-neutrale Suchnaht analog zu den bestehenden Foundations, z. B.:

- `MobilityProvider.suchen()`
- normalisierte Suchanfrage
- normalisierte Ergebnisse
- klare technische Fehlerklassen
- serverseitige Proof-/Nachweis-Naht für spätere kommerzielle Übernahme

Eine geschlossene Route wie `POST /api/mobility/search` ist sinnvoll, wenn sie der bestehenden Architektur entspricht.

Harte Regeln:

- ohne Provider **keine Fake-Ergebnisse**
- kein Providername als Architekturannahme
- keine Secrets/Env-Namen für einen noch nicht gewählten Provider erfinden
- Production immer fail closed / aus
- Search und Affiliate-/Redirect-Verantwortung getrennt halten
- Browser darf spätere kommerzielle Fakten nicht selbst setzen
- Kontoübernahme aus Providerergebnissen später nur über serverseitig verifizierte Kennungen/Fakten

Manuell erfasste Mobilität ist davon getrennt und muss sichtbar als Nutzerangabe behandelt werden.

## 8. Ranking vorbereiten

Falls die Foundation bereits ein normalisiertes Ranking vorsieht, muss es deterministisch und provisionsneutral sein.

Sinnvolle Kriterien, soweit echte Daten vorhanden:

- Passung zum Reisegraphen / Start-Ziel
- zeitliche Passung
- Gesamtdauer
- Anzahl Umstiege
- Preis
- Flexibilität
- Komfort nur als belastbarer Fakt
- Evidenz-/Datenqualität

Providername, Affiliate-Provision oder späterer Umsatz dürfen **nie** Rankingfaktoren sein.

Fehlende Fakten dürfen keinen erfundenen Score erhalten, der wie Wissen wirkt. Unknown bleibt unknown.

## 9. Trip Workspace / UX

Füge genau **einen** neuen Hauptbereich **„Mobilität“** in den Trip Workspace ein – nicht separate Tabs für Bahn, Bus, Fähre und Transfer.

Ziele:

- Übersicht zuerst: vorhandene Mobilitäts-/Transfer-Planpunkte und ehrlicher Status
- erkennbare offene/unbestimmte Verbindungsbedarfe, soweit deterministisch ableitbar
- bestehende Buchungsstatus-Sprache konsistent verwenden
- darunter Such-/Planungsbereich
- wenn kein Provider aktiv ist: hochwertige, ehrliche Unavailable-/Empty-State-Darstellung; keine Fake-Angebote
- manuell bekannte Verbindung hinzufügen/bearbeiten, wenn dies ohne unnötige Komplexität sauber in bestehende Reiseaktionen integrierbar ist
- Übersicht des Trip Workspace spiegelt Mobilitätsstatus kompakt zurück

### Mobile / Navigation

Der bestehende kompakte Workspace unter 1024 px darf nicht wieder unübersichtlich werden.

Die Hauptbereiche werden dann voraussichtlich:

`Übersicht · Flüge · Unterkunft · Aktivitäten · Mobilität`

Die Bereichsnavigation muss auf sehr schmalen Viewports professionell bedienbar bleiben. Keine Seitenbreiten-Überläufe, keine abgeschnittenen unzugänglichen Tabs, kein erneuter Tab-Stack-Bug. Wenn horizontales Scrollen nötig ist, nur die Navigationszeile scrollen lassen – nicht die Seite.

Desktop ab 1024 px sinnvoll in die bestehende breite Arbeitsansicht integrieren, ohne Mobile künstlich auf Desktop zu kopieren.

Design-System, Touch-Ziele, sichtbarer Fokus, `aria-current`, Tastaturbedienung, Loading/Empty/Error/Unavailable und stabile Layout-Höhen beachten.

## 10. Manuelle Mobilität – Trust Boundary

Ein Nutzer darf eine bereits bekannte Verbindung manuell eintragen können, wenn der bestehende Produktfluss dies sauber erlaubt. Diese Daten sind **Nutzerangaben**, keine verifizierten Providerfakten.

Serverseitig validieren:

- Ownership
- Trip-/Stage-/Day-Zugehörigkeit
- erlaubte Mobilitätsart
- Text-/Body-Limits
- Datums-/Zeitreihenfolge
- Preis/Währung nur konsistent
- URL nur nach bestehenden sicheren Regeln oder in dieser Foundation gar keine manuelle Booking-URL akzeptieren
- keine freie Providerbestätigung aus dem Browser

Natürlichsprachliche Modelle dürfen keine gebuchten Mobilitätsfakten, Provider, Preise oder Booking-URLs erfinden.

## 11. Security

Verbindlich:

- RLS/Auth bleiben Eigentumsgrenze
- kein Service-Role-Pfad im Browser
- keine Secrets im Client, Git, Logs oder Screenshots
- Request-Body-Caps vor großer Allokation
- keine offenen Audit-Routen in Production
- kommerzielle Felder/Booking-Status gegen untrusted model/browser input schützen
- keine SSRF-/Open-Redirect-Fläche durch unvalidierte URLs
- bestehende Commercial-Protection vollständig auf Mobilität prüfen
- Production Provider/Kill-Switches unverändert

## 12. Datenbank / Migrationen

Wenn eine Migration fachlich nötig ist:

1. neue reproduzierbare Migration im Repository
2. nur auf bestehender Supabase-Development-Branch anwenden
3. Schema, Constraints, RLS, Funktionen und bestehende Daten dort verifizieren
4. Typen aktualisieren
5. Migration/Historie in `docs/DATENBANK.md`, Handoff und Production-Playbook dokumentieren
6. **nicht auf Production anwenden**

Keine bestehende Production-Funktion versehentlich durch eine ältere Funktionsdefinition zurücksetzen. Vor `create or replace function` immer aktuellen Funktionsstand und spätere Migrationen berücksichtigen.

## 13. Tests

Mindestens Unit-/Domain-Tests für:

- alle vier Mobilitätsarten
- deterministische Start/Ziel-Zuordnung
- Datum/Zeit / über Mitternacht, soweit relevant
- unknown/unbestimmte Fälle
- keine falsche Abdeckung bei Mehrdeutigkeit
- Buchungsstatus transfer: unconfirmed → booked → korrigieren
- Gast/Konto/Übernahme
- Commercial-Protection / natürliche Reiseänderung
- Provider unavailable/fail-closed
- Validation / Body limits / URL-/Preisregeln soweit implementiert
- keine Provisions-/Providerabhängigkeit im Ranking

Bestehende Flight-, Hotel-, Activities-, Booking- und Trip-Workspace-Tests müssen grün bleiben.

## 14. Browser-/Real-Device-Audit

Trip-Workspace-Audit erweitern.

Mindestens WebKit + Chromium und relevante Viewports:

- 280
- 320
- 360
- 390
- 430
- 768
- 844×390 Landscape
- 1280 Desktop-Vergleich

Prüfen:

- Mobilität leer/unavailable
- Mobilität mit gespeicherten manuellen Planpunkten
- unconfirmed/booked
- unknown/unbestimmte Coverage
- lange Orts-/Stationsnamen
- Tabwechselketten mit **allen fünf** Hauptbereichen
- nur aktiver kompakter Bereich sichtbar
- computed `display`, Layoutbox, inert/Interaktivität, nicht nur DOM-Attribut
- Navigation horizontal bedienbar ohne Seitenoverflow
- Fokus/Tastatur/A11y
- keine Layout-Shifts oder Race-Leaks

Ein grüner Audit ersetzt einen angeforderten echten iPhone-Test nicht. Vor Mark Ready wird erneut ein realer iPhone-Preview-Test eingeplant.

## 15. CI / Definition of Done

Vor „fertig“ müssen grün sein:

- `npm test`
- Typecheck
- Lint
- Hygiene
- Production-Build
- GitHub CI
- Vercel Preview
- Trip-Workspace WebKit/Chromium Audit
- Activities Regression Audit
- ggf. weitere betroffene Regressionen

Keine Warnungen als „erledigt“ verschweigen.

## 16. Dokumentation

Mindestens prüfen/aktualisieren:

- `JETNITY_HANDOFF.md`
- `ROADMAP.md`
- `ARCHITECTURE.md`
- `DECISIONS.md` mit ADR(s)
- `DESIGN_SYSTEM.md`, wenn Workspace-/Navigation-Regeln ergänzt werden
- `docs/REISEN.md`
- `docs/DATENBANK.md`, falls Schema betroffen
- neue `docs/MOBILITY.md` bzw. projektkonforme Mobilitäts-Fachdoku
- `docs/PRODUCTION_ROLLOUT.md`
- diesen Auftrag mit Abschlussstatus

Dokumentieren:

- was umgesetzt ist
- was nur Foundation ist
- welche Provider-/Keys fehlen
- Production-Status/Kill-Switch
- Development-Migrationen
- Security/RLS
- Tests/Audits
- offene Risiken
- Kosten
- nächster Schritt

## 17. Kosten

Keine neuen laufenden Kosten in diesem Auftrag. Keine bezahlte API aktivieren. Bestehende Development-Infrastruktur nutzen. Falls unerwartet zusätzliche laufende Kosten notwendig wären: stoppen und zuerst Nutzerfreigabe einholen.

## 18. Harte Grenzen

- PR bleibt **Draft**
- **nicht mergen**
- keine Production-Migration
- keine Production-Provider-Aktivierung
- keine Secrets
- keine Fake-Daten/-Preise/-Fahrpläne/-Verfügbarkeiten
- keinen Hotel-/Duffel-/Activity-Provider nebenbei integrieren
- Phase 3.4 nicht als erledigt markieren
- Mietwagen nicht in diesen Block ziehen
- Kreuzfahrt nicht in diesen Block ziehen
- Startseite, `Meine Reisen` und Reise-Erstellung nicht redesignen
- keine breite Architekturumschreibung ohne nachgewiesenen Bedarf

## 19. Gewünschter Abschlussbericht im PR

Cursor soll im PR klar berichten:

1. Architektur / Datenmodell
2. Mobilitäts-Domäne und Reisegraph-Abdeckung
3. Buchungsstatus / manuelle Eingabe
4. Provider-/Nachweis-Naht
5. UI Mobile + Desktop
6. Security/RLS
7. Migrationen: Development vs Production
8. Tests / Audit-Kombinationen / Fehlerzahl
9. CI / Vercel Preview
10. Kosten
11. offene Risiken / externe Abhängigkeiten
12. nächster Schritt

Der nächste Schritt nach diesem Foundation-Block ist **nicht automatisch ein Provider**. Nach Review/Merge wird anhand Roadmap entschieden: Mietwagen Foundation, Travel Readiness/Dokumente Foundation oder ein inzwischen verfügbar gewordener echter Providerzugang.

---

## Abschlussstatus

Stand: 21. August 2026 · Draft-PR #30 · Branch `feat/mobility-transfers-foundation`

**Status:** Implementierung im Repository; Tests, Development-Migration, Audits, CI und Preview folgen in diesem Lauf und werden hier nachgezogen.

Umgesetzt im Code:

- `kind=transfer` plus optionale Spalten (ADR-0090)
- `lib/mobility/` Domäne, Abdeckung, Ranking, fail-closed Suche
- Buchungsstatus für Transfer, manuelle Nutzerangabe
- Workspace-Bereich Mobilität in der Fünfer-Navigation
- Migration `20260821120000_trip_items_mobility.sql` nur für Development

Nicht umgesetzt und bewusst offen:

- kein Provider
- keine Production-Migration
- keine Production-Aktivierung
- Phase 3.4 bleibt wartend
- Mietwagen und Kreuzfahrten bleiben Folgeblöcke
