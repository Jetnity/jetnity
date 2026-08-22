# Jetnity – UX & Informationsarchitektur Standard

Stand: 22. August 2026  
Status: **verbindlicher websiteweiter Produktstandard**

Dieser Standard gilt für alle nutzerseitigen Jetnity-Oberflächen und ist bei neuen Produktphasen, Reviews und größeren UI-Änderungen verbindlich. Er ergänzt `JETNITY_PRODUCT_MANDATE.md`, `docs/PRODUCT_QUALITY_STANDARD.md` und `DESIGN_SYSTEM.md`.

## 1. Ziel

Jetnity soll trotz hoher fachlicher Komplexität ruhig, verständlich und leicht bedienbar wirken.

Der Nutzer soll auf jeder relevanten Ansicht innerhalb weniger Sekunden verstehen:

1. **Wo bin ich?**
2. **Was ist hier wichtig?**
3. **Was ist der aktuelle Zustand?**
4. **Was ist der nächste sinnvolle Schritt?**
5. **Was passiert, wenn ich etwas ändere?**

Leitsatz:

> **Komplexität gehört ins System, nicht in den Kopf des Nutzers.**

Dieser Standard ist kein Auftrag, Oberflächen leer oder funktionsarm zu machen. Jetnity darf leistungsfähig sein, muss diese Leistung aber durch klare Hierarchie, progressive Offenlegung und konsistente Interaktionslogik beherrschbar machen.

## 2. Psychologische Grundprinzipien

### 2.1 Kognitive Last minimieren

- Pro Ansicht gibt es eine klar erkennbare Hauptaufgabe oder Hauptentscheidung.
- Gleich wichtige Inhalte werden gruppiert; unwichtige Details konkurrieren nicht mit Kernentscheidungen.
- Lange Informationsmengen werden strukturiert, zusammengefasst oder progressiv geöffnet.
- Der Nutzer soll Informationen nicht zwischen entfernten Seiten im Kopf behalten müssen.
- Wiederholte Eingaben werden vermieden, wenn Jetnity die Information bereits zuverlässig kennt.

### 2.2 Progressive Disclosure

- Zuerst wird gezeigt, was für die aktuelle Entscheidung nötig ist.
- Details bleiben auffindbar, aber drängen sich nicht vor.
- Komplexe Bereiche dürfen aufklappbare Details, sekundäre Ebenen oder kontextuelle Aktionen nutzen.
- Eine Funktion darf nicht deshalb versteckt werden, weil sie komplex ist; sie muss sinnvoll eingeordnet werden.

### 2.3 Visuelle und semantische Hierarchie

Jede Ansicht muss klar zwischen folgenden Ebenen unterscheiden:

1. Kontext / Orientierung
2. wichtigster Status oder wichtigstes Ergebnis
3. primäre Aktion
4. sekundäre Optionen
5. Details / Erklärung / Evidenz

Nicht mehrere Primäraktionen gegeneinander antreten lassen. Der `citrus`-Akzent markiert höchstens eine zentrale Sache pro Ansicht gemäß `DESIGN_SYSTEM.md`.

### 2.4 Status statt Unsicherheit

Jetnity soll Zustände verständlich benennen. Beispiele:

- geplant
- ausgewählt
- gebucht
- erledigt
- offen
- erneut prüfen
- nicht verfügbar
- unvollständig
- unbekannt

Ein fehlender Wert darf nicht wie ein technischer Defekt aussehen. `unknown`, `unavailable`, `loading` und `error` müssen fachlich unterscheidbar bleiben.

### 2.5 Erwartbarkeit und Konsistenz

- Gleiche Aktionen sehen und verhalten sich websiteweit gleich.
- Gleiche Statusbegriffe bedeuten websiteweit dasselbe.
- Zurück-, Speichern-, Entfernen-, Ändern- und Bestätigen-Logik darf nicht je Modul neu erfunden werden.
- Mobile und Desktop benutzen dieselbe Produktlogik; Desktop darf mehr Fläche zeigen, aber keine andere Denkweise verlangen.

### 2.6 Vertrauen und Wahrheitsgefühl

- Jetnity zeigt keine Scheingenauigkeit.
- Fakten, Empfehlungen und Nutzerstatus werden klar getrennt.
- Offizielle oder kommerzielle Aussagen müssen aus belastbarer Evidence stammen.
- Änderungen mit Auswirkungen auf eine Reise werden sichtbar erklärt.
- Keine Dark Patterns, künstliche Dringlichkeit oder versteckte wirtschaftliche Beeinflussung.

## 3. Entscheidungsarchitektur

Jetnity soll den Nutzer nicht nur Informationen lesen lassen, sondern Entscheidungen vereinfachen.

Für wichtige Entscheidungen gilt:

- wichtigstes Ergebnis zuerst
- relevante Trade-offs sichtbar
- begrenzte, sinnvolle Auswahl statt Optionsüberlastung
- verständliche Empfehlung, wenn genügend Evidence vorliegt
- Unsicherheit offen kennzeichnen
- Auswirkungen einer Änderung zeigen, bevor sie übernommen wird

Verbindliches Änderungsprinzip:

> **Änderung erkennen → Auswirkungen auf die Gesamtreise bestimmen → optimierte Anpassung vorschlagen → Vorher/Nachher zeigen → erst nach ausdrücklicher Nutzerfreigabe übernehmen.**

## 4. Websiteweite Informationsarchitektur

Die Gesamtwebsite muss wie **ein Produkt** wirken, nicht wie lose Module.

### Öffentliche Start-/Discovery-Seiten

- sofort verständliches Nutzenversprechen
- Suche bzw. Reiseerstellung als klarer Einstieg
- Inspiration und zusätzliche Inhalte dürfen die Hauptaktion nicht verdrängen

### Suche & Vergleich

- Suchkontext bleibt sichtbar
- Filter nur mit echtem Entscheidungsnutzen
- Ergebnisse erklären wichtige Unterschiede
- Nutzer sollen nach einem Klick nicht vergessen, warum ein Ergebnis relevant war

### Trip Workspace / Reiseübersicht

- Reise als zentrale Wahrheit
- wichtigster Gesamtstatus zuerst
- klare Bereiche für Flüge, Unterkunft, Aktivitäten, Mobilität und Reisevorbereitung
- keine unnötigen Haupt-Tabs
- bereichsübergreifende Auswirkungen sollen in der Übersicht zusammenlaufen

### Flüge

- Route und wichtigste Flugentscheidung zuerst
- Segmente und Transit verständlich, nicht als rohe Providerdaten
- Umstieg, Dauer, Flughafenwechsel und relevante Risiken sichtbar priorisieren

### Unterkunft

- Lage, Zeitraum, Preis-/Buchungsstatus und Reise-Fit klar priorisieren
- Detailinformationen nachgelagert

### Aktivitäten

- Reisetag, Zeit, Ort und Plan-Fit verständlich darstellen
- keine überladenen Katalogansichten ohne Kontext zur Reise

### Mobilität & Mietwagen

- Verbindung von A nach B verständlich machen
- Zeitpunkt, Dauer, Abhol-/Rückgabe- oder Transferkontext klar zeigen
- Mobilität ist Teil der Reise, kein isoliertes Suchprodukt

### Einreise & Reisevorbereitung

- offizielle Anforderungen und persönlicher Erledigungsstand strikt trennen
- fehlende Angaben gezielt statt als großes Formular abfragen
- wichtige Handlungen und Fristen priorisieren
- keine regulatorische Behauptung ohne Evidence

### Konto / persönliche Bereiche

- Einstellungen nach Nutzerabsicht gruppieren
- seltene oder sensible Optionen nicht mit alltäglichen Aufgaben vermischen
- Sicherheits- und Datenschutzwirkung klar erklären

### Admin

Der Admin darf informationsdichter sein, folgt aber denselben Prinzipien: klare Priorität, verständliche Zustände, konsistente Aktionen und keine unnötige Dashboard-Komplexität.

## 5. Psychologisch gute Seitenstruktur

Eine typische Jetnity-Ansicht soll bevorzugt dieser Reihenfolge folgen:

1. **Orientierung:** Titel, Kontext, Reise/Datum/Ort
2. **Kernaussage:** aktueller Status, Ergebnis oder wichtigste Empfehlung
3. **Primäraktion:** der wahrscheinlich nächste sinnvolle Schritt
4. **Arbeitsinhalt:** relevante Karten/Liste/Plan
5. **Details:** Evidenz, sekundäre Optionen, technische oder tiefere Informationen

Nicht jede Seite muss exakt gleich aussehen. Die mentale Reihenfolge soll aber stabil bleiben.

## 6. Mobile-first und Aufmerksamkeit

- wichtigste Information ohne unnötiges Scrollen früh sichtbar
- Touch-Ziele mindestens nach bestehendem Design-System
- horizontales Scrollen nur bewusst für klar erkennbare, zusammengehörige Reihen
- keine versteckten Kernaktionen hinter Hover
- keine zu dichten Tabellen für normale Besucher
- Sticky-/Floating-Elemente nur wenn sie den nächsten Schritt wirklich erleichtern
- Modals und Bottom Sheets nur für fokussierte Aufgaben, nicht als Ersatz für Informationsarchitektur

## 7. Text und Microcopy

- kurze, konkrete Sprache
- Nutzerwirkung statt interner Technik erklären
- Fachbegriffe nur wenn nötig; dann verständlich einordnen
- Fehlermeldungen sagen, was passiert ist und was als Nächstes möglich ist
- keine Marketingfloskeln in funktionalen Zuständen
- keine widersprüchlichen Begriffe für denselben Zustand

## 8. Loading, Empty, Error und Unknown

Jeder wichtige Bereich benötigt bewusst gestaltete Zustände.

### Loading
Zeigt, dass Jetnity arbeitet und was geladen wird.

### Empty
Erklärt, warum noch nichts vorhanden ist und welche sinnvolle Aktion möglich ist.

### Error
Erklärt, was nicht funktioniert hat und ob Wiederholen/Ändern möglich ist.

### Unknown / Insufficient Context
Wird nicht als Fehler dargestellt. Jetnity erklärt, welche Information fehlt oder warum keine belastbare Aussage möglich ist.

### Provider unavailable
Keine Fake-Ergebnisse. Nutzer sieht ehrlich, dass eine externe Prüfung oder Suche derzeit nicht verfügbar ist.

## 9. Cross-Domain-Wirkung

Wenn eine Änderung mehrere Bereiche betrifft, darf Jetnity sie nicht isoliert behandeln.

Beispiele:

- Flugänderung beeinflusst Transit-Requirements, Mobilität und Tagesplan.
- Hotelwechsel beeinflusst Lage, Transferzeit und Tagesplanung.
- Reisedatum beeinflusst Flug, Unterkunft, Aktivitäten und Readiness.

Das UI muss relevante Auswirkungen dort sichtbar machen, wo der Nutzer sie versteht, ohne dieselbe Warnung fünfmal redundant zu zeigen.

## 10. Review-Pflicht für größere Phasen

Vor `Ready for Review` muss bei jeder größeren nutzerseitigen Phase geprüft werden:

- Orientierung in unter wenigen Sekunden verständlich
- klare visuelle Priorität
- eine eindeutige Primäraktion pro Kontext
- progressive Disclosure statt Informationsüberlastung
- Mobile und Desktop
- Loading / Empty / Error / Unknown / Unavailable
- Accessibility
- konsistente Begriffe und Zustände
- Cross-Domain-Auswirkungen
- keine Dark Patterns
- reale Datenwahrheit

Für wesentliche Trip-Workspace-Änderungen sind bestehende UI-Audits zu erweitern, wenn neue Zustände oder Kombinationen hinzukommen.

## 11. Arbeitsregel

Jeder größere Cursor-Auftrag muss diesen Standard als Pflichtlektüre nennen, sofern Nutzeroberfläche oder Informationsarchitektur betroffen sind.

ChatGPT prüft bei Human-/Architecture-Review ausdrücklich nicht nur Codequalität, sondern auch psychologische Verständlichkeit, Informationshierarchie und bereichsübergreifende Konsistenz.

Ein technisch grüner PR ist **nicht fertig**, wenn der Nutzer unnötig denken, suchen oder Informationen zusammensetzen muss.
