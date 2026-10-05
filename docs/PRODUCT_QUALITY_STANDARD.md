# Jetnity – Produktqualitätsstandard

Stand: 22. August 2026
Status: verbindlicher Qualitätsrahmen für neue Produktphasen und Reviews

## Grundsatz

Professionelle Architektur und professionelle Nutzererfahrung sind für Jetnity gleich wichtig. Eine technisch saubere Funktion ist nicht fertig, wenn sie langsam, unverständlich, schwer bedienbar oder nur auf Desktop gut nutzbar ist. Umgekehrt darf eine schöne Oberfläche keine unsaubere, unsichere oder kurzlebige Architektur verdecken.

Jede größere Jetnity-Phase muss deshalb beide Ebenen erfüllen: belastbare Architektur im Hintergrund und eine einfache, hochwertige Nutzererfahrung im Vordergrund.

## Verbindliche Qualitätsdimensionen

### 1. Design

- ruhige, hochwertige, konsistente Markenwirkung gemäß `DESIGN_SYSTEM.md`
- keine generische Template-Ästhetik und keine unnötige visuelle Komplexität
- klare visuelle Hierarchie, gute Lesbarkeit und sinnvoller Weißraum
- neue Oberflächen müssen zum bestehenden Jetnity-System passen statt eigene Stilwelten einzuführen

### 2. Mobile-UX

- mobile-first entwickeln und prüfen
- zentrale Abläufe müssen auf kleinen iPhone-/Android-Breiten vollständig bedienbar sein
- keine versteckten Inhalte, abgeschnittenen Bedienelemente oder horizontalen Layoutfehler
- ausreichend große Touch-Ziele und sinnvolle Einhand-Bedienung
- Desktop darf zusätzliche Fläche nutzen, aber keine andere Produktlogik voraussetzen

### 3. Geschwindigkeit und wahrgenommene Performance

- unnötige Client-JavaScript-, Netzwerk- und Render-Kosten vermeiden
- teure Datenpfade serverseitig begrenzen, cachen oder gezielt laden, sofern fachlich zulässig
- keine blockierenden Providerketten ohne Timeout/Fallback
- langsame Zustände müssen früh sichtbar werden; kein scheinbar eingefrorenes UI
- Performance wird als Produktmerkmal behandelt, nicht als späterer Cleanup

### 4. Navigation und Informationsarchitektur

- Nutzer müssen jederzeit verstehen, wo sie sind, was der nächste sinnvolle Schritt ist und wie sie zurückkommen
- keine redundanten Navigationswege oder konkurrierenden Hauptaktionen
- Reiseplanung, Suche, Vergleich und Übernahme müssen als zusammenhängender Ablauf wirken
- tiefe Funktionen sollen auffindbar bleiben, ohne die Hauptoberfläche zu überladen

### 5. Sucherlebnis

- Suche muss tolerant, schnell und eindeutig sein
- Auswahl und freie Texteingabe dürfen nicht still verwechselt werden
- Mehrdeutigkeit wird sichtbar aufgelöst statt geraten
- Ergebnisse werden nach Jetnity-Logik erklärt und nicht nur als unkommentierte Listen gezeigt
- Filter und Sortierung müssen einen klaren Nutzen haben; keine Optionen auf Vorrat

### 6. Lade-, Leer-, Fehler- und Offline-/Unavailable-Zustände

Jede relevante datenabhängige Oberfläche benötigt bewusst gestaltete Zustände für:

- Loading
- Empty
- Unavailable
- Timeout
- Rate-Limit
- fachliche Validierungsfehler
- technische Fehler

Diese Zustände dürfen nicht wie kaputte Seiten wirken. Sie sollen dem Nutzer erklären, was gerade möglich ist und was als Nächstes sinnvoll ist. Keine Fake-Daten verwenden, um leere Zustände zu kaschieren.

### 7. Verständliche Empfehlungen

- Jetnity erklärt Empfehlungen mit den wichtigsten Trade-offs
- Preis allein ist nicht automatisch die beste Wahl
- Lage, Zeit, Komfort, Flexibilität, Folgekosten und Reise-Fit werden einbezogen, soweit echte Evidenz vorhanden ist
- unbekannte Fakten werden nicht erfunden
- interne Scores müssen nicht ungefiltert gezeigt werden; die Begründung muss für Menschen verständlich sein
- Affiliate- oder Vermittlungsprovisionen dürfen die fachliche Empfehlung nicht manipulieren

### 8. Barrierefreiheit

- semantische HTML-Struktur und sinnvolle ARIA-Verwendung
- vollständige Tastaturbedienbarkeit für interaktive Kernabläufe
- sichtbare Fokuszustände
- ausreichende Kontraste gemäß Design-System
- Fehlermeldungen müssen programmatisch zugeordnet und verständlich formuliert sein
- Statusänderungen, Ladezustände und dynamische Ergebnisse müssen für Assistenztechnologien nachvollziehbar sein
- Touch-Ziele und mobile Accessibility gehören zum selben Qualitätsstandard

### 9. Echte und vertrauenswürdige Reisedaten

- keine erfundenen Preise, Verfügbarkeiten, Wegezeiten, Bewertungen, Provider, Booking-URLs oder Einreisevorgaben
- kommerzielle Daten stammen aus vertrauenswürdigen serverseitigen Quellen
- Modellantworten bleiben untrusted input
- bei fehlender Evidenz lieber `unavailable`, `null` oder eine ehrliche Einschränkung als Scheingenauigkeit
- Quelle, Aktualität und Abdeckung müssen dort sichtbar oder dokumentiert sein, wo sie für die Entscheidung relevant sind

### 10. Kein Bestandsschutz für frühere Funktionen

Eine bereits gebaute, gemergte oder früher erfolgreich getestete Funktion ist **nicht automatisch dauerhaft akzeptiert**.

Verbindlich:

- Jede bestehende Funktion muss bei relevanten späteren Produkt-, Architektur- oder Workspace-Reviews gegen den **heute gültigen Jetnity-Standard** neu bewertet werden können.
- Wenn eine ältere Lösung heutigen Anforderungen an UX, Logik, Datenwahrheit, Security, Architektur, Performance oder Produktverständlichkeit nicht mehr genügt, darf und soll sie refaktoriert, vereinfacht, ersetzt oder – bei fehlendem echtem Produktnutzen – nach Product-Owner-Freigabe entfernt werden.
- Historische Implementierungsentscheidungen dürfen keine bessere heutige Lösung blockieren.
- Alte Defaults, Felder, Navigationsmuster oder isolierte Modulannahmen dürfen nicht aus Kompatibilitätsbequemlichkeit als fachliche Wahrheit fortgeschrieben werden.
- Migration und Rückwärtskompatibilität müssen professionell geplant werden; Verbesserung rechtfertigt keinen Datenverlust oder stillen Bedeutungswechsel.

Leitsatz:

> **Vergangene Implementierung ist Ausgangslage, nicht Qualitätsgrenze.**

### 11. Interoperabilität ist Teil der Funktion

Eine Jetnity-Funktion gilt nicht als hochprofessionell, wenn sie nur isoliert korrekt arbeitet.

Verbindlich:

- Jede relevante Kernfunktion muss mit allen fachlich betroffenen Reisebereichen korrekt zusammenspielen.
- Gemeinsame Facts müssen aus derselben kanonischen Source of Truth stammen; keine widersprüchlichen Parallelmodelle.
- Änderungen müssen alle relevanten Folgeeffekte auslösen oder sichtbar als `stale`, `recheck`, `unknown` oder andere fachlich richtige Zustände markieren.
- Ein Bereich darf nicht mit veralteten Annahmen weiterarbeiten, wenn ein anderer Bereich einen dafür relevanten Fakt geändert hat.
- Cross-Domain-Auswirkungen müssen getestet werden, nicht nur dokumentiert.
- Guest/Account, Multi-Destination, mehrere Reisende, Traveller Context, Route/Transit, Buchungsstatus und spätere Providerdaten müssen an ihren Schnittstellen konsistent bleiben.
- Eine Funktion, die andere Kernbereiche fehlerhaft beeinflusst oder von ihnen fehlerhaft beeinflusst wird, ist **nicht fertig**, auch wenn ihre eigenen Unit-Tests grün sind.

Leitsatz:

> **Jetnity besteht nicht aus fertigen Einzelteilen. Fertig ist nur, was im Gesamtsystem richtig funktioniert.**

## Definition of Done für größere Produktphasen

Eine größere Phase ist erst review-bereit, wenn mindestens geprüft wurde:

1. Architektur- und Security-Grenzen. Privilegiierter Admin-Datenzugriff verlangt aktuelle Rolle/Fähigkeit **und** aktuelles AAL2; eine vorbereitete Alignment-Migration ist kein Production-Apply.
2. Mobile- und Desktop-Verhalten
3. Loading/Empty/Error/Unavailable-Zustände
4. Such-/Navigationsfluss und Verständlichkeit
5. Accessibility der Kerninteraktionen
6. Performance-Risiken und Provider-Timeouts
7. Datenherkunft und Vermeidung erfundener Fakten
8. Tests, Typecheck, Lint, Hygiene-Checks und Build
9. Vercel Preview auf realistischen Bildschirmgrößen
10. Dokumentation der offenen Risiken und noch fehlenden echten Datenquellen
11. relevante bestehende Funktionen gegen den aktuellen Standard erneut bewertet
12. betroffene Cross-Domain- und End-to-End-Schnittstellen nachweislich geprüft

## Arbeitsregel für Cursor und Reviews

Cursor setzt große Implementierungsaufträge um. Jeder größere Cursor-Auftrag muss diese Qualitätsdimensionen berücksichtigen, soweit sie für die Phase relevant sind. Ein grüner Build allein reicht nicht als Qualitätsnachweis.

ChatGPT steuert Produkt, Architektur, Security, Kosten und Review und prüft vor Merge insbesondere, ob die technische Umsetzung und die Nutzererfahrung gemeinsam den Jetnity-Standard erfüllen.

Bei größeren Integrations- oder Workspace-Reviews müssen ChatGPT und Coding Agents ausdrücklich auch bestehende Funktionen hinterfragen und Cross-Domain-Fehler suchen. Sie dürfen nicht annehmen, dass früher gemergter Code außerhalb des Review-Scope liegt, wenn er das aktuelle Gesamtsystem relevant beeinflusst.

Bestehende Detailregeln in `DESIGN_SYSTEM.md`, `AGENTS.md`, `ARCHITECTURE.md`, `JETNITY_VISION.md` und den jeweiligen Fachdokumentationen bleiben zusätzlich verbindlich.
