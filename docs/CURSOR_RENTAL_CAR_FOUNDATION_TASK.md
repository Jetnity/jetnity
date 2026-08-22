# Cursor-Auftrag – Foundation B: Mietwagen

Stand: 21. August 2026  
Branch: `feat/rental-car-foundation`  
Basis: `main` @ `463360e64dae068e3d8eb9f3012890b94df4a75a`  
Status: Draft-PR #31 umgesetzt; Development-Migration verifiziert; Real-Device-iPhone-Test **bestanden** (`docs/PR31_REAL_DEVICE_ACCEPTANCE.md`); Production-Migration bleibt offen

## 0. Arbeitsmodus

Du bist der Hauptentwickler für diesen Block. Arbeite selbstständig bis zum vollständigen Draft-PR-Abschluss, aber halte die unten genannten Produkt-, Logic-, Security-, Production- und Kostengrenzen strikt ein.

Vor Implementierung zuerst Repository, Datenmodell, bestehende Tests und aktuelle Dokumentation lesen. Keine Architekturentscheidung aus Erinnerung oder nur aus bestehendem Code ableiten.

**Nicht mergen. Keine Production-Migration. Keine Production-Aktivierung. Keine neuen kostenpflichtigen Provider oder Secrets.**

---

## 1. Pflichtlektüre vor jeder Änderung

Vollständig lesen:

- `AGENTS.md`
- `JETNITY_VISION.md`
- `JETNITY_HANDOFF.md`
- `ROADMAP.md`
- `ARCHITECTURE.md`
- `DECISIONS.md`
- `DESIGN_SYSTEM.md`
- `docs/PRODUCT_QUALITY_STANDARD.md`
- `docs/CONTINUITY_STANDARD.md`
- `docs/LOGIC_STANDARD.md`
- `docs/REISEN.md`
- `docs/DATENBANK.md`
- `docs/FLUEGE.md`
- `docs/HOTELS.md`
- `docs/ACTIVITIES.md`
- `docs/MOBILITY.md`
- `docs/PRODUCTION_ROLLOUT.md`

Zusätzlich den relevanten Code prüfen:

- `lib/trips/**`
- `lib/mobility/**`
- Flight-/Hotel-/Activity-Domänen und Provider-Seams als Referenzmuster
- Trip-Workspace-Komponenten und kompakte Bereichsnavigation
- Guest-/Account-Persistenz und Gastreise-Übernahme
- Booking-Status und Commercial Protection
- natürliche Sprachänderung / `reise_aendern`
- `reise_anlegen`
- Supabase-Migrationen ab dem Reiseschema, insbesondere `20260821100000` und `20260821120000`
- DB-/RLS-/Security-Checks
- Trip-Workspace- und Activities-Browser-Audits

Vor Coding einen kurzen Umsetzungsplan im Agentenlauf erstellen: Ziel, Datenmodell, betroffene Module, Risiken, Security, Migration, Tests, UX, Kosten.

---

## 2. Produktziel

Jetnity soll Mietwagen als **Teil derselben Reise** verstehen, nicht als isolierte Autovermietungs-Suchmaschine.

Foundation B baut den provider-unabhängigen fachlichen Unterbau für Mietwagen so weit, dass später ein echter Anbieter angeschlossen werden kann, ohne Trip Workspace, Reisegraph, Booking-Logik oder Persistenz neu zu erfinden.

Ein Mietwagen ist fachlich anders als ein einzelner Transfer:

- er besitzt einen Abholzeitpunkt und Rückgabezeitpunkt,
- kann mehrere Reisetage überspannen,
- kann an unterschiedlichen Orten abgeholt und zurückgegeben werden,
- kann für mehrere geplante Bewegungen relevant sein,
- ist aber **nicht automatisch der Beweis**, dass eine konkrete Reiseverbindung tatsächlich mit diesem Auto gefahren wird.

Das System muss diese Unterschiede logisch korrekt abbilden.

Verbindlicher Produktgrundsatz:

> **Einfach für den Nutzer. Streng logisch im Inneren. Eine Reise, eine Wahrheit.**

---

## 3. UX-Entscheidung – kein sechster Haupt-Tab

**Keinen neuen Top-Level-Workspace-Tab „Mietwagen“ hinzufügen.**

Mietwagen gehört in den bestehenden Hauptbereich **„Mobilität“**. Die fünf Hauptbereiche bleiben:

`Übersicht · Flüge · Unterkunft · Aktivitäten · Mobilität`

Innerhalb von „Mobilität“ darf eine klare Unterstruktur entstehen, z. B.:

- Verbindungen / Bahn · Bus · Fähre · Transfer
- Mietwagen

Die genaue visuelle Unterteilung darf im Rahmen des bestehenden Designsystems umgesetzt werden, aber ohne neue Hauptnavigation und ohne eine überladene Dashboard-Wirkung.

Die Übersicht soll den Mietwagenstatus später knapp spiegeln, sofern eine echte Aussage möglich ist.

Keine Redesign-Side-Quest für Startseite, `Meine Reisen` oder Reise-Erstellung.

---

## 4. Out of Scope

In diesem Block ausdrücklich **nicht** bauen:

- echten Mietwagenprovider
- echte Live-Verfügbarkeit
- echte Preise ohne Providerfakt
- Affiliate-/Booking-Deeplinks
- Zahlungen
- Versicherungsverkauf
- Führerschein-/Pass-Tresor
- Kreditkartendaten
- komplexes Schadens-/Kautionssystem
- lokales Verkehrs-/Routing-System
- Kreuzfahrten
- Hotelprovider
- Activity-Provider
- vollständige Gesamt-Abdeckung D, außer den minimal notwendigen Integrationspunkten
- Multi-Provider-Abstraktion auf Vorrat

Keine Fake-Angebote, Fake-Fahrzeugklassen, Fake-Preise, Fake-Verfügbarkeiten oder erfundene Mietbedingungen.

---

## 5. Verbindlicher Logic Standard

`docs/LOGIC_STANDARD.md` ist für diesen Block besonders wichtig.

Mindestens folgende Wahrheitsregeln gelten:

1. **Ausgewählt/eingetragen != gebucht.**
2. **Provider verfügbar != Fahrzeug verfügbar.**
3. **Preis vorhanden != Gesamtpreis**, außer die Quelle definiert ihn eindeutig als Gesamtpreis.
4. **Mietwagenzeitraum überlappt einen Reisetag != die Strecke ist mit Mietwagen abgedeckt.**
5. **Gleicher Ort / gleiches Datum != bewiesene Verbindung.**
6. Unbekannte Abhol-/Rückgabezeit, Kaution, Kilometer, Tankregelung, Storno, Fahrzeugklasse oder Getriebe bleiben unbekannt.
7. Nie „unbegrenzte Kilometer“, „kostenlose Stornierung“, „Automatik“, „Vollkasko“, „keine Kaution“ o. Ä. ableiten, wenn es nicht als belastbarer Fakt vorliegt.
8. Ein manueller Nutzerwert bleibt Nutzerfakt und darf nicht wie Providerbestätigung dargestellt werden.
9. Mehrdeutige Ortszuordnung darf nicht geraten werden.
10. Ein vorhandener Mietwagen darf eine `Bewegungskante` nicht automatisch als `covered` markieren, nur weil Zeitraum und Städte plausibel aussehen.
11. Wenn eine fachliche Aussage nicht deterministisch bewiesen werden kann: `unknown` / verständlicher deutscher Unbestimmt-Text statt falscher Sicherheit.
12. Jeder in Review gefundene Logikfehler erhält nach Möglichkeit einen Regressionstest.

Für neue Statuswerte muss es eine dokumentierte, eindeutige Semantik geben. Keine zwei unterschiedlichen Wahrheiten für denselben Zustand in Übersicht, Mobilitätsbereich, Persistenz und API.

---

## 6. Datenmodell – zuerst prüfen, dann ADR

Das bestehende `trip_items`-Modell und alle Constraints vollständig prüfen.

Ein Mietwagen ist **kein** `transfer` und darf nicht künstlich als Transfer gespeichert werden.

Erste fachliche Präferenz:

- `trip_items` bleibt der gemeinsame persistente Reisebaustein,
- ein neuer klarer `kind` für Mietwagen ist zulässig und wahrscheinlich sinnvoll,
- wenige strukturierte optionale Felder statt generischem `metadata`-JSON,
- keine neue breite Tabelle, wenn sie keinen echten Vorteil gegenüber dem bestehenden Ownership-/RLS-/Guest-Transfer-Modell liefert.

Aber: Vor Umsetzung eine ADR-Entscheidung treffen und dokumentieren, ob

A. `trip_items.kind = rental_car` plus wenige optionale Felder, oder
B. eine schmale separate 1:1-Struktur fachlich wirklich sauberer ist.

**Keine dritte Architektur ohne guten dokumentierten Grund.**

Die Entscheidung muss berücksichtigen:

- RLS / Ownership
- Konto vs Gast
- Gastreise-Übernahme
- `reise_anlegen`
- `reise_aendern`
- Booking-Status
- Commercial Protection
- Revision / Idempotenz
- Tages- vs Etappenbezug
- mehrtägige Mietdauer
- spätere Provider-Nachweise
- minimale Migration
- spätere Gesamt-Abdeckung

### 6.1 Minimal benötigte strukturierte Fakten

Nur Felder einführen, die für reale Logik oder spätere Providerintegration nötig sind. Mindestens fachlich abbildbar:

- Abholort – stabile ID falls vorhanden + Anzeigename
- Rückgabeort – stabile ID falls vorhanden + Anzeigename
- Abholdatum/-zeit
- Rückgabedatum/-zeit
- One-way vs gleicher Rückgabeort muss aus Fakten ableitbar sein, kein redundanter Wahrheitswert wenn vermeidbar
- optionaler Vermieter-/Supplier-Name als **Nutzerfakt**, falls manuell eingetragen
- Fahrzeuganforderung/-klasse nur wenn Nutzer sie ausdrücklich kennt oder später Provider sie liefert
- Getriebe nur wenn bekannt
- Preis/Währung nur als manueller Nutzerfakt oder später verifizierter Providerfakt
- Evidenz/Herkunft klar unterscheiden

Bestehende `starts_on`, `starts_at`, `ends_on`, `ends_at`, Preis- und Booking-Felder wiederverwenden, wenn semantisch sauber.

Kein exaktes Fahrer-Alter dauerhaft speichern, wenn es nicht für eine persistente Kernfunktion nötig ist. Für spätere Providerrequests kann Alter/Residenz request-only sein; Datenminimierung beachten.

Keine Führerschein-, Pass-, Zahlungs- oder Kreditkartendaten in dieser Foundation.

---

## 7. Booking Status

PR #29 / Foundation A haben den gemeinsamen Booking-Status etabliert.

Mietwagen soll dieselbe Wahrheit benutzen:

- `unconfirmed` = geplant/ausgewählt/manuell erfasst, aber nicht als gebucht bestätigt
- `booked` = Nutzer hat ausdrücklich bestätigt, dass die Buchung existiert

In dieser Foundation bleibt die Buchungsquelle ausschließlich `user`.

Kein Browser darf sich als Providerbestätigung ausgeben.

Falls das DB-Constraint `trip_items_booking_nur_kommerziell` erweitert werden muss, nur über versionierte Migration und nur auf Development anwenden.

Bestehende Daten dürfen nicht still umklassifiziert werden.

Natürliche Sprache darf `booked`, Preis, Provider, externe Referenz, Booking-URL oder geschützte Mietwagenfakten nicht still erfinden/überschreiben.

---

## 8. Manuelle Mietwagenerfassung

Ohne echten Provider muss Jetnity ehrliche manuelle Planung ermöglichen, sofern sie sauber in die bestehende UX passt.

Beispiel:

- Abholung: Zürich Flughafen
- 12.09.2026, 09:00
- Rückgabe: Lugano Zentrum
- 16.09.2026, 18:00
- Fahrzeug: Kompakt – nur wenn Nutzer das weiß
- Vermieter: optionaler Nutzerfakt
- Status: geplant oder vom Nutzer als gebucht bestätigt

Serverseitig validieren:

- Ownership / Trip-Kontext
- Body-Limit
- Strings / Längen
- Datums- und Zeitformat
- `end >= start`
- Preis/Währung
- erlaubte Fahrzeug-/Getriebewerte nur wenn eine kleine fachlich echte Liste verwendet wird
- keine Booking-URL
- kein behaupteter Provider-Nachweis
- kein externer Provider-Token

Manuelle Daten in der UI ausdrücklich als Nutzerangabe erkennbar halten, ohne unnötig technisch zu wirken.

---

## 9. Reisegraph / Zusammenhang mit Mobilität

Foundation B muss Mietwagen mit demselben Reisegraphen verbinden, aber konservativ.

### 9.1 Was Jetnity sicher sagen darf

Beispiele, wenn Fakten vorhanden sind:

- „Mietwagen vom 12.–16. September geplant“
- „Abholung Zürich Flughafen, Rückgabe Lugano“
- „Als gebucht markiert“
- „Mietwagen deckt zeitlich 4 Reisetage ab“ – nur wenn Datumslogik eindeutig ist und diese Formulierung nicht mit Transportabdeckung verwechselt wird

### 9.2 Was Jetnity nicht automatisch sagen darf

Nicht ohne expliziten belastbaren Zusammenhang:

- „Zürich → Luzern ist durch Mietwagen abgedeckt“
- „Du fährst mit dem Auto zum Hotel“
- „Der Mietwagen löst alle Transfers“
- „Die Abholung passt sicher zu deinem Flug“
- „30 Minuten reichen zwischen Landung und Abholung“

Ein Mietwagen kann als **verfügbarer Reisebaustein im Zeitraum** bekannt sein, ohne dass eine konkrete Bewegungskante bewiesen ist.

Wenn ein minimaler expliziter Link zwischen Mietwagen und Bewegungskante notwendig wird, muss dieser als eigene klare Wahrheit modelliert werden; nicht aus Datumsüberlappung oder Freitext herleiten. Keine große MovementEdge-Refactor-Side-Quest ohne Notwendigkeit.

Foundation A darf nicht beschädigt werden. Alle bestehenden Mobility-Regressionstests müssen grün bleiben.

---

## 10. Provider-neutrale Mietwagen-Domäne

Unter z. B. `lib/rental-cars/` oder einem ebenso klaren Namen eine kleine provider-neutrale Domäne schaffen.

Mindestens:

- normalisierte Suchanfrage
- normalisierte Option
- Preis-/Währungsfakten
- Abhol-/Rückgabe-Kontext
- Fahrzeugfakten nur wenn vorhanden
- Mietbedingungen nur wenn vorhanden
- Evidenz
- technische Providerfehler
- Client-Sicht
- Nachweis-Seam

Schmale Schnittstelle, z. B.:

`RentalCarProvider.suchen()`

oder gleichwertig.

Keine Providerklasse ohne echten Anbieter. Factory darf heute `null` liefern.

Such- und Affiliate-/Redirect-Verantwortung getrennt halten.

---

## 11. Geschlossene Search-Route

Wenn konsistent mit den bestehenden Foundations, `POST /api/rental-cars/search` oder eine gleichwertige klar benannte Route einführen.

Anforderungen:

- Production hart aus
- Preview/Development nur hinter Kill Switch
- ohne Provider ehrlicher `unavailable`-Zustand
- nur `application/json`
- harter UTF-8-Body-Cap vor großer Allokation
- Zod / Runtime-Validierung
- keine Proxy-Route für beliebige Provider-URLs
- Rate Limit
- `429` mit `Retry-After`
- keine Secrets im Client
- keine Rohproviderantwort im Browser
- keine internen Scores im Client
- keine Fake-Ergebnisse

Der Kill Switch benennt keinen Anbieter, z. B. `JETNITY_RENTAL_CAR_AKTIV`.

Production bleibt selbst bei gesetztem Provider-Secret fail closed, bis später ausdrücklich aktiviert.

---

## 12. Server-Nachweis / Trust Boundary

Eine spätere kommerzielle Provideroption darf im Konto nicht gespeichert werden, nur weil der Browser deren Preis/Fahrzeug/URL mitsendet.

Jetzt bereits eine schmale `RentalCarNachweis`-Naht vorbereiten:

- Browser sendet nur Identifikatoren
- Server lädt/prüft später die echten Providerfakten
- Nachweis muss mindestens an Trip, Abhol-/Rückgabeort, Zeitraum und relevante Suchparameter gebunden sein
- heute ohne echten Provider: `null` / fail closed

Manuelle Nutzerdaten sind ein separater Pfad und werden als `user`-Evidenz behandelt.

---

## 13. Ranking – nur wenn in Foundation sinnvoll

Falls Ranking implementiert wird, deterministisch und provisionsneutral.

Mögliche Faktoren nur wenn als Fakt vorhanden:

- Trip-Fit / Abhol- und Rückgabeort
- Zeitraum
- Gesamtpreis
- Fahrzeuganforderungen
- Getriebe
- Kilometerregel
- Tankregel
- Storno
- Kaution
- Anbieter-/Supplier-Qualität nur bei belastbarer Quelle

**Providername, Affiliate-Provision, Jetnity-Umsatz oder Kommission niemals Rankingfaktor.**

Unbekannte Fakten dürfen weder als positiv noch negativ erfunden werden.

Keine pseudo-präzisen Scores in der UI.

---

## 14. Trip-Workspace UX

Im bestehenden Hauptbereich **Mobilität**:

1. vorhandene Mobilitäts-/Transferlogik nicht verschlechtern
2. Mietwagenstatus/-bestand klar, kompakt und logisch ergänzen
3. gespeicherter Mietwagen bzw. Status **vor** einer späteren Suche
4. Suche/Planung darunter
5. ohne Provider ehrlicher Unavailable-State
6. manuelle Erfassung möglich, falls sauber

In der **Übersicht** nur eine knappe Mietwagenzeile, wenn sie einen echten Mehrwert liefert, z. B.:

- „Mietwagen · 12.–16. Sep · geplant“
- „Mietwagen · gebucht“
- „Kein Mietwagen geplant“ nur wenn diese Aussage fachlich sinnvoll ist; nicht so darstellen, als sei ein Mietwagen zwingend erforderlich.

Keinen Nutzer zu Mietwagen drängen. Nicht jede Reise braucht ein Auto.

Mobile UX:

- keine neue Hauptnavigation
- kein Page-Overflow
- keine Tab-Stack-Regression
- Touchziele >= 44 px
- Focus/Keyboard/ARIA sauber
- stabile Loading/Empty/Error-States
- lange Orts-/Supplier-Namen testen

Desktop >=1024 px integriert in bestehende breite Arbeitsansicht.

---

## 15. Guest / Account / Persistenz

Gast- und Konto-Weg müssen dieselbe fachliche Form verwenden.

Prüfen und testen:

- manuelle Mietwagenerfassung als Gast
- Speicherung im lokalen Gastmodell
- Übernahme bei Login/Registrierung
- serverseitige Validierung bei Kontoübernahme
- keine Providerbestätigung aus LocalStorage
- Booking-Status nur `user`
- keine fremde Ownership
- kein Verlust strukturierter Felder
- keine stillen Umdeutungen

`reise_anlegen(jsonb)` muss – falls nötig – die neuen Felder sicher übernehmen.

`reise_aendern(jsonb)` darf geschützte Mietwagen-/Booking-/Commercial-Felder nicht still löschen oder überschreiben.

---

## 16. Security / Privacy

Für alle neuen Wege prüfen:

- RLS / Ownership
- Auth
- kein Service Role im Browser
- Secrets server-only
- Body-Caps
- Rate Limits
- SSRF
- Open Redirect
- unsafe Booking URLs
- Provider spoofing
- kommerzielle Feldmanipulation
- Log-Leaks
- personenbezogene Daten minimieren

Keine Speicherung von:

- Führerscheinnummer
- Passnummer
- Kreditkarte
- CVV
- Zahlungsdaten
- unnötigem Geburtsdatum

Keine Security- oder Audit-Route in Production offen lassen.

---

## 17. Datenbank / Migration

Wenn eine Migration nötig ist:

1. versionierte Repository-Migration erstellen
2. **nur auf vorhandene Supabase-Development-Branch anwenden**
3. Schema prüfen
4. Constraints prüfen
5. RLS prüfen
6. Funktionen prüfen
7. Altbestand prüfen
8. DB-Typen aktualisieren
9. `db:rechte`, `db:rls`, `db:sicherheit`, `db:typen --pruefen` und relevante Checks ausführen
10. Dokumentation aktualisieren

**Keine Production-Migration.** Dafür ist später eine separate ausdrückliche Nutzerfreigabe erforderlich.

Nie `reise_anlegen` oder `reise_aendern` durch eine veraltete Funktionsdefinition ersetzen. Vor `create or replace` die aktuelle Definition gegen den letzten Migrationsstand prüfen.

Bestehende Production-Migration `20260821120000_trip_items_mobility` ist bereits auf Production; nicht erneut anwenden oder umbenennen.

---

## 18. Tests – fachliche Mindestfälle

Umfassende Unit-/Integrationstests für teure Logikfehler.

Mindestens:

### Daten / Zeit

- gleicher Abhol-/Rückgabeort
- One-way
- Pickup vor Dropoff
- Pickup = Dropoff-Zeitpunkt nur falls fachlich erlaubt; sonst Validation
- Dropoff vor Pickup abweisen
- über Mitternacht
- mehrtägig
- unbekannte Uhrzeit
- nur Datum
- lange Reise
- Grenzen der erlaubten Dauer, falls eingeführt

### Wahrheit / Status

- manual planned bleibt unconfirmed
- explicit user booking -> booked/user
- booking correction -> unconfirmed
- kein Providerclaim aus Browser
- unbekannte Bedingungen bleiben unbekannt
- Mietwagen überlappt Bewegungskante -> **nicht automatisch covered**
- gleicher Ort/Tag -> kein erfundener Zusammenhang
- Mehrdeutigkeit -> unknown

### Guest / Account

- Gast speichern
- Gast übernehmen
- Account persistieren
- Ownership
- geschützte Felder
- Natural-Language-Änderung beschädigt gebuchten Mietwagen nicht

### Provider / API

- Provider fehlt -> unavailable
- Production -> fail closed
- Kill Switch aus
- Invalid JSON
- falscher Content-Type
- Body zu groß
- Rate Limit
- Timeout/technischer Fehler, soweit Seam testbar
- Client-Sicht leakt keine internen Daten

### Ranking, falls vorhanden

- deterministisch
- gleiche Inputs -> gleiche Reihenfolge
- Providername/Provision ohne Einfluss
- fehlende Fakten nicht künstlich bestrafen/belohnen

Alle bestehenden Trip-, Mobility-, Booking-, Activities-, Hotel- und Flight-Regressionen müssen grün bleiben.

---

## 19. Browser-/Mobile-Audit

Bestehenden Trip-Workspace-Audit erweitern, nicht durch oberflächliche Attributchecks ersetzen.

Mindestens WebKit + Chromium:

- 280
- 320
- 360
- 390
- 430
- 768
- 844×390 Landscape
- 1280 Desktop

Zustände:

- kein Mietwagen
- manueller Mietwagen geplant
- manueller Mietwagen gebucht
- One-way
- gleicher Rückgabeort
- unbekannte Uhrzeit
- lange Ortsnamen
- langer Supplier-Name
- Provider unavailable
- Validation Error

Interaktionen:

- alle fünf Hauptbereiche mehrfach wechseln
- Mobilität öffnen/schließen/erneut öffnen
- Verbindungen und Mietwagen-Unterbereich bedienen
- nur aktiver Hauptbereich sichtbar
- `computedStyle` / Layoutbox / `inert` prüfen
- Navigation darf horizontal scrollen, Seite nicht
- kein Tab-Stack
- keine Fokusfalle
- keine überdeckten Touchziele

Echter iPhone-Test bleibt vor Ready for Review erforderlich.

---

## 20. Performance / Produktqualität

Keine unnötigen Requests beim Tabwechsel.

Keine großen Libraries nur für kleine Form-/Datumslogik.

Keine Layoutsprünge durch Provider-unavailable oder leere Zustände.

Loading-, Empty-, Error- und Unknown-States müssen semantisch verschieden sein.

Empfehlungen oder Statusformulierungen müssen für normale Nutzer verständlich sein; interne Architekturbegriffe nicht in die Oberfläche tragen.

---

## 21. Dokumentation / Kontinuität

Vor Abschluss mindestens prüfen/aktualisieren:

- `JETNITY_HANDOFF.md`
- `ROADMAP.md`
- `ARCHITECTURE.md`
- `DECISIONS.md`
- `DESIGN_SYSTEM.md` falls echte neue UI-Regel
- `docs/REISEN.md`
- `docs/DATENBANK.md` bei Schemaänderung
- `docs/MOBILITY.md` für Integration in Mobilität
- neue `docs/RENTAL_CARS.md` oder gleichwertige Fachdoku
- `docs/PRODUCTION_ROLLOUT.md`
- `docs/LOGIC_STANDARD.md` nur wenn ein wirklich allgemeines neues Logikprinzip entsteht
- diese Task-Datei mit Abschlussstatus

Handoff muss nach Umsetzung klar trennen:

- was auf `main`/Production ist
- was nur im Draft-PR ist
- Development-Migration vs Production
- Providerzugänge / Blocker
- Kill Switches
- nächster Schritt

Foundation A ist seit PR #30 auf `main` und Production. Nicht als offen oder Development-only zurückdokumentieren.

---

## 22. CI / Definition of Done

Vor Abschluss müssen grün sein:

- `npm test`
- TypeScript
- Lint
- Production-Build
- Hygiene-Checks
- DB-/RLS-/Security-Checks bei Migration
- relevante Auth-Checks
- Trip-Workspace-Audit WebKit + Chromium
- Mobility-Regression
- Activities-Regression
- neue Rental-Car-Audits
- GitHub CI
- Vercel Preview

Ein Tool, das sich wegen fehlendem Secret selbst überspringt, zählt nicht als ausgeführt; ehrlich dokumentieren.

Real-Device-iPhone-Test bleibt offen, bis der Nutzer ihn bestätigt.

---

## 23. Kosten

Keine neuen laufenden Kosten in diesem Block.

Keinen kostenpflichtigen Provider aktivieren oder Account/Plan erzeugen.

Keine neue Infrastruktur mit laufenden Kosten.

Wenn unerwartete Kosten nötig erscheinen: stoppen, Betrag/Nutzen/Alternative dokumentieren und vor Umsetzung Nutzerfreigabe einholen.

---

## 24. Harte Grenzen

- PR als Draft erstellen
- **nicht mergen**
- keine Production-Migration
- keine Production-Provider-Aktivierung
- keine neuen Secrets
- keine Fake-Daten
- kein echter Provider-Side-Quest
- kein sechster Top-Level-Workspace-Tab
- Foundation A nicht refactoren, wenn nicht zwingend nötig
- Phase 3.4 nicht als erledigt markieren
- Travel Readiness nicht vorziehen
- Kreuzfahrten nicht bauen
- Startseite / Meine Reisen / Reise-Erstellung nicht breit redesignen
- Logic Standard nicht zugunsten schneller UI-Vollständigkeit lockern

---

## 25. Abschlussbericht

Am Ende des Agentenlaufs genau und vollständig berichten:

**Status** – fertig / teilweise / blockiert

**Architektur** – gewähltes Datenmodell und warum

**Logik** – Wahrheit, Zeitraum, Reisegraph und warum keine falsche Coverage entsteht

**Umgesetzt** – konkrete Funktionen

**Datenbank** – Migration, Development-Verifikation, RLS, Constraints, Funktionen, Production unverändert

**Booking / Manual** – Nutzerfakt vs Providerfakt

**Provider-Seam** – Route, Factory, Nachweis, Kill Switch

**UX** – Integration in Mobilität und Übersicht

**Security / Privacy** – Trust Boundaries und Datenminimierung

**Tests** – Zahlen/Ergebnisse

**Browser-Audits** – Engines, Viewports, Kombinationen, Ergebnis

**CI / Preview** – Links/Status

**Kosten** – neue laufende Kosten oder keine

**Offene Risiken / Abhängigkeiten**

**Real-Device** – ausdrücklich offen, bis Nutzer bestätigt

**Nächster Schritt** – klare Empfehlung

PR Draft lassen und nicht mergen.