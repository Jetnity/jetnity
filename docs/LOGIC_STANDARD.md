# Jetnity – verbindlicher Logik- und Konsistenzstandard

Stand: 21. August 2026
Status: verbindlich

Dieser Standard gilt für ChatGPT als Produkt-/Architektursteuerung sowie für Cursor und alle anderen Coding Agents.

Jetnity soll sich für den Nutzer einfach anfühlen, obwohl intern viele Reisebereiche zusammenarbeiten. Diese Einfachheit ist nur glaubwürdig, wenn die fachliche Logik korrekt, konsistent und nachvollziehbar ist.

**Logik, Datenwahrheit und bereichsübergreifende Konsistenz gehören ab sofort zu den höchsten Entwicklungsprioritäten von Jetnity – auf derselben Ebene wie Security, Datenintegrität und Produktqualität.**

Ein Feature ist nicht fertig, nur weil es visuell funktioniert oder Tests grün sind. Es muss auch fachlich richtig sein und mit dem restlichen Reisesystem logisch zusammenarbeiten.

---

## 1. Oberste Regel: Wahrheit vor Bequemlichkeit

Jetnity darf keine Tatsache behaupten, die nicht aus vertrauenswürdigen Daten oder einer ausdrücklich als Nutzerangabe gekennzeichneten Eingabe folgt.

Verbindlich:

- unbekannt bleibt unbekannt
- unbestimmt bleibt unbestimmt
- ausgewählt bedeutet nicht gebucht
- geplant bedeutet nicht bestätigt
- ein gleiches Datum beweist keine gleiche Route
- ein Freitexttitel ist keine vertrauenswürdige strukturierte Route
- ein fehlender Provider darf nicht durch Fake-Ergebnisse kaschiert werden
- ein Fehler darf nicht als leere Ergebnisliste dargestellt werden
- ein fehlender Wert darf nicht mit einem plausibel klingenden Standard erfunden werden

Wenn Jetnity eine Aussage nicht sicher beweisen kann, muss die Oberfläche einen ehrlichen Zustand wie `offen`, `unbekannt`, `nicht vollständig bestimmbar` oder `nicht verfügbar` verwenden.

**Kein bekannter fachlicher Wahrheitsfehler darf gemergt werden.**

---

## 2. Ein Reisegraph, keine konkurrierenden Wahrheiten

Der gemeinsame Reisegraph ist die fachliche Grundlage.

Flüge, Unterkunft, Aktivitäten, Mobilität, Mietwagen, Tagesplan, Budget, Buchungsstatus, Reisebereitschaft und spätere Live-Informationen dürfen keine voneinander unabhängigen Parallelwahrheiten aufbauen.

Für dieselbe fachliche Information soll es genau eine maßgebliche Source of Truth geben.

Beispiele:

- ein aktiver Reisetag darf nicht in mehreren Komponenten unabhängig verwaltet werden
- Buchungsstatus darf nicht in UI, Provideradapter und Datenbank unterschiedlich interpretiert werden
- Hotelnächte müssen aus denselben Reisedaten berechnet werden wie die Übersicht
- Mobilitätsabdeckung darf nicht andere Routenkriterien verwenden als der zugrunde liegende Reisegraph
- Änderungen an Reisedaten müssen alle davon abhängigen Zusammenfassungen konsistent beeinflussen

Duplizierte Business-Logik ist ein Risiko und soll zentralisiert werden.

---

## 3. Logischer Aufbau vor Feature-Menge

Neue Bereiche werden so aufgebaut, dass ihre Verantwortung eindeutig ist:

1. **Domain** – fachliche Begriffe, Zustände und Regeln
2. **Trust Boundary / Validierung** – was darf als Fakt gelten?
3. **Persistenz** – welche Fakten werden dauerhaft gespeichert?
4. **Provider-Naht** – externe Daten werden normalisiert, nicht direkt zur Produktlogik
5. **Orchestrierung** – verbindet vorhandene Fakten und Regeln
6. **UI** – zeigt den fachlichen Zustand; erfindet ihn nicht

UI-Komponenten dürfen keine zentrale Reise- oder Buchungslogik heimlich selbst berechnen, wenn diese Logik zentral geteilt werden muss.

Providerdaten dürfen nicht direkt die Produktwahrheit bestimmen. Sie müssen validiert, normalisiert und in das Jetnity-Domainmodell überführt werden.

---

## 4. Explizite Zustände statt impliziter Annahmen

Fachlich wichtige Zustände brauchen klare, überprüfbare Semantik.

Beispiele:

- `unconfirmed` → nicht als Buchung bestätigt
- `booked` → ausdrücklich durch Nutzer oder vertrauenswürdige Providerbestätigung bestätigt
- `open` → eine benötigte, deterministisch bekannte Lücke ist offen
- `unknown` → die Fakten reichen nicht für eine sichere Aussage
- `unavailable` → Funktion oder Provider ist nicht verfügbar
- `error` → Verarbeitung ist fehlgeschlagen

Diese Zustände dürfen nicht nur optische Labels sein. Sie müssen aus einer eindeutigen Logik entstehen und in Datenmodell, Domain, API und UI dieselbe Bedeutung haben.

State-Transitions müssen explizit und getestet sein. Stille Zustandswechsel sind nicht zulässig.

---

## 5. Bereichsübergreifende Auswirkungen prüfen

Jede neue Kernfunktion und jede relevante Änderung muss prüfen, welche anderen Reisebereiche davon abhängen.

Mindestens prüfen, wenn relevant:

- Trip Workspace / Übersicht
- Reisetage und Etappen
- Flugabdeckung
- Unterkunfts-/Nächteabdeckung
- Aktivitäten und Zeitkonflikte
- Mobilitätskanten
- Mietwagen
- Budget / Währung
- Buchungsstatus
- Reisebereitschaft / Dokumente
- spätere Live-Änderungen

Beispiel: Eine Datumsänderung ist nicht nur ein Kalenderupdate. Sie kann Hotelnächte, Rückflug, Transfers, Aktivitäten und Budget beeinflussen.

Verbindliches Prinzip:

> **Änderung → betroffene Fakten bestimmen → Auswirkungen ableiten → Widersprüche erkennen → erst dann neuen Zustand anzeigen oder Änderung vorschlagen.**

---

## 6. Zeit-, Datums-, Routen- und Geldlogik besonders streng behandeln

Diese Bereiche erzeugen besonders teure Fehler und benötigen explizite Regeln und Tests.

### Datum und Zeit

- lokale Zeit, Datum und Zeitzone nicht vermischen
- fehlende Zeitzone nicht erraten
- Intervalle und Übernachtungen eindeutig definieren
- Grenzen wie Check-in/Check-out, Tageswechsel und mehrtägige Fahrten testen

### Routen

- Start und Ziel strukturiert vergleichen
- IDs bevorzugen, wenn vertrauenswürdig vorhanden
- Namen nur nach definierter Normalisierung vergleichen
- Freitext nie still als strukturierte Route behandeln
- gleiche Daten oder ähnliche Namen sind kein Routennachweis
- eine Flugroute entsteht nur aus einer validierten Itinerary, nie aus Titel, Notiz oder Ortsname
- Country-, Transit- und Connection-Fakten ohne Evidence bleiben `unknown`/`null`
- für dieselbe Route gibt es genau eine Truth (`lib/route`); Readiness, Flüge und Reiseänderung lesen sie, statt sie neu zu raten

### Geld

- Betrag und Währung zusammen behandeln
- keine Summen über verschiedene Währungen ohne explizite Umrechnung
- fehlender Preis bleibt fehlend
- Ranking darf keinen nicht vorhandenen Preis erfinden

---

## 7. Fail closed bei Unsicherheit

Wenn ein sicherer Zustand nicht bestimmt werden kann, darf Jetnity nicht den bequemsten positiven Zustand wählen.

Beispiele:

- keine Providerbestätigung → nicht `booked`
- kein Routennachweis → nicht `covered`
- keine Verfügbarkeit → nicht `available`
- kein verifizierter Preis → keinen Preis anzeigen
- fehlende Graphdaten → nicht automatisch `open`, wenn die Lücke selbst nicht sicher bestimmbar ist
- historische `archived`-Reise ohne gültige Restore-Provenienz → kein erfundenes `draft`/`planned`/`booked`

Bei Security und kommerziellen Fakten gilt dies besonders streng.

---

## 8. Tests müssen Regeln beweisen, nicht nur Code ausführen

Für zentrale Logik sind Tests gegen fachliche Invarianten verpflichtend.

Mindestens:

- Happy Path
- fehlende Daten
- falsche Route / gleiches Datum
- Mehrdeutigkeit
- mehrere Kandidaten
- Grenzwerte
- Zustandswechsel
- historische Daten
- Gast → Konto, falls relevant
- Provider fehlt
- Fehler vs. leer
- Cross-Module-Regressionen

Bei einem gefundenen Logikfehler muss ein Regressionstest ergänzt werden, sofern technisch sinnvoll. Der Test soll die **fachliche Regel** absichern, nicht nur die konkrete Implementierung kopieren.

Ein grüner Testlauf beweist nicht automatisch fachliche Korrektheit. Review muss zusätzlich die zugrunde liegenden Annahmen prüfen.

---

## 9. Keine bekannte Inkonsistenz als „später optimieren“ verschieben

Optische Verbesserungen können bewusst später erfolgen.

Bekannte fachliche Inkonsistenzen, falsche Statusaussagen, Datenwahrheitsprobleme oder widersprüchliche Business-Regeln dürfen dagegen nicht als reine spätere Optimierung behandelt werden.

Wenn ein solcher Fehler bekannt ist:

1. als Blocker dokumentieren
2. Ursache verstehen
3. zentral korrigieren
4. Regression absichern
5. betroffene Bereiche erneut prüfen

Erst danach Ready/Merge.

---

## 10. Review-Fragen für jede größere Aufgabe

Vor Abschluss muss der Agent mindestens beantworten:

1. Welche fachlichen Fakten verwendet die Funktion?
2. Woher stammen diese Fakten und welche davon sind vertrauenswürdig?
3. Welche Fakten können fehlen oder mehrdeutig sein?
4. Was zeigt Jetnity dann an?
5. Gibt es eine zweite Stelle, die dieselbe Logik anders berechnet?
6. Welche anderen Reisebereiche hängen von diesem Zustand ab?
7. Können Änderungen widersprüchliche Zustände erzeugen?
8. Sind Zustandsübergänge explizit?
9. Gibt es Tests für falsche, fehlende und mehrdeutige Daten?
10. Behauptet die UI jemals mehr, als die Domain sicher weiß?

Wenn diese Fragen nicht sauber beantwortet sind, ist die Aufgabe nicht Done.

---

## 11. Definition of Done für Logik

Eine größere Jetnity-Funktion ist logisch erst Done, wenn:

- fachliche Invarianten dokumentiert sind
- Source of Truth klar ist
- Trust Boundary klar ist
- unbekannte / offene / bestätigte Zustände klar getrennt sind
- bereichsübergreifende Auswirkungen geprüft sind
- keine bekannte widersprüchliche Parallel-Logik existiert
- relevante Grenz- und Negativfälle getestet sind
- gefundene Wahrheitsfehler regressionsgesichert sind
- Dokumentation den tatsächlichen Stand beschreibt
- keine bekannte Logikinkonsistenz offen bleibt, die zu falschen Nutzerentscheidungen führen kann

---

## 12. Ziel

Jetnity soll nicht nur viele Reisefunktionen besitzen. Es soll **verlässlich denken**.

Der Nutzer soll darauf vertrauen können, dass Flüge, Unterkunft, Aktivitäten, Mobilität, Buchungen und spätere Reisebereiche logisch zusammenpassen und Jetnity bei Unsicherheit nicht rät.

> **Einfach für den Nutzer. Streng logisch im Inneren. Eine Reise, eine Wahrheit.**
