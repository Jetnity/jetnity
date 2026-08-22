# Jetnity – Product Owner Acceptance Notes for PR #34

Stand: 22. August 2026  
Status: **laufende Product-Owner-Abnahme / Änderungen werden gesammelt / noch kein verbindlicher Implementierungsauftrag**

## Zweck

Diese Datei sammelt während der schrittweisen visuellen und funktionalen Product-Owner-Abnahme von Foundation D alle Änderungsanforderungen, Beobachtungen und Produktentscheidungen des Product Owners.

Wichtig:

- Kein relevanter Änderungswunsch darf nur im Chat bleiben.
- Während der Abnahme werden Anforderungen zunächst **gesammelt und präzisiert**.
- Am Ende der Abnahme werden alle bestätigten Punkte in einen **verbindlichen Product-Owner-Amendment-/Cursor-Auftrag** überführt.
- Erst danach werden die bestätigten Änderungen umgesetzt, getestet und erneut abgenommen.
- PR #34 bleibt bis zur ausdrücklichen Merge-Freigabe Draft und ungemergt.
- Technische Review-Freigabe ersetzt nicht die Product-Owner-Abnahme.

## Verbindliche nächste Priorität nach Foundation D

Nach Foundation D ist **Traveller Context / Multi-Citizenship / Multi-Document** die verbindliche nächste interne Priorität. Ein echter Travel-Requirements-Provider folgt erst auf einer belastbaren Traveller-Context-Grundlage.

## Abnahmeprotokoll

### Abnahmepunkt 1 – Startseite und Planungsflow müssen mehrere Reiseziele unterstützen

**Product-Owner-Entscheidung: bestätigt.**

Aktueller Fehler:

- Die öffentliche Startseite modelliert derzeit nur genau eine `OrtAuswahl`.
- Der anschließende Planungsflow fragt ebenfalls nur genau ein Ziel ab.
- Das widerspricht echten Reisen mit mehreren Zielen, obwohl der Reisegraph bereits korrekt mehrere `trip_stages` unterstützt.

Verbindliche fachliche Richtung für den späteren Amendment:

- Die Startseite bleibt für eine einfache Einzielreise genauso leicht wie heute.
- Nach Auswahl des ersten Ziels erscheint progressiv eine Aktion wie `+ Weiteres Ziel hinzufügen`.
- Es entsteht eine geordnete, dynamische Liste von Reisezielen/Etappen; keine starren Felder `Ziel 1/2/3`.
- Alle ausgewählten Ziele werden verlustfrei in den nächsten Planungsbildschirm übernommen; keine erneute Eingabe derselben Facts.
- Im Planungsflow können Ziele ergänzt, entfernt, ersetzt und in ihrer Reihenfolge geändert werden.
- Derselbe Ort darf mehrfach als eigene Etappe vorkommen, z. B. `Tokyo → Kyoto → Osaka → Tokyo`.
- Nutzergewählte Ziele/Etappen bleiben strikt getrennt von Route-/Transit-Facts aus Foundation D. Beispiel: `Bangkok → Chiang Mai → Phuket` sind Reiseetappen; `ZRH → DOH → BKK` enthält Doha als Transit, nicht als Nutzerziel.
- Eine spätere Routenoptimierung darf nur vorgeschlagen werden; keine automatische Umordnung ohne ausdrückliche Nutzerbestätigung.
- Bestehender Reisegraph mit `trip_stages` wird wiederverwendet und nicht durch ein zweites Multi-Destination-Modell ersetzt.

### Abnahmepunkt 1b – Menü → „Meine Reisen“ bleibt zentraler Reise-Hub

**Product-Owner-Beobachtung: Darstellung und Zwischenweg gefallen und sollen grundsätzlich erhalten bleiben.**

Die Seite ist fachlich sinnvoll:

- Menüpunkt `Meine Reisen` führt auf einen zentralen Ort für angefangene und gespeicherte Reisen.
- Ohne Konto bleibt der aktive Gastentwurf lokal im Browser.
- Mit Konto können mehrere Reisen dauerhaft gespeichert und wieder geöffnet werden.
- Die bestehende Seite soll nicht wegen der Mehrziel-Erweiterung durch einen anderen Navigationsflow ersetzt werden.

Professionelle Funktionsprüfung / Empfehlung für den späteren Amendment:

1. **Gast mit bereits aktivem Entwurf:** Jetnity erlaubt ohne Konto bewusst nur eine aktive Gastreise. Der globale CTA `Neue Reise` darf deshalb nicht so wirken, als könne ein zweiter Gastentwurf parallel entstehen. In diesem Zustand bevorzugt `Reise fortsetzen` bzw. ein klarer, nicht-datenverlierender Weg; niemals still überschreiben. Falls der Nutzer wirklich neu beginnen will, muss Jetnity die bestehende Reise sichtbar behandeln (z. B. Konto für mehrere Reisen oder ausdrücklich bestätigtes Verwerfen/Löschen – endgültige UX noch mit Product Owner abzustimmen).
2. **Mehrziel-Reisen in der Reisenliste:** Reisekarten sollen eine Mehrzielreise als solche verständlich erkennen lassen. Die Karte darf nicht implizit nur das erste Ziel repräsentieren. Bevorzugt eine kompakte geordnete Routenzusammenfassung wie `Bangkok → Chiang Mai → Phuket` bzw. bei vielen Etappen eine psychologisch ruhige Kurzform; genaue Darstellung in der späteren UX-Abnahme festlegen.

Diese beiden Punkte verändern nicht die grundsätzliche Gestaltung der Seite, sondern sorgen dafür, dass ihre Funktion mit Gastregel und Multi-Destination-Graph konsistent bleibt.

### Abnahmepunkt 1c – Gast muss die Ein-Reise-Grenze verstehen

**Problem erkannt; konkrete UX-Formulierung noch mit Product Owner abzustimmen.**

Aktuell sagt die Seite sinngemäß nur, dass „ein Reiseentwurf“ ohne Konto privat im Browser bleibt. Daraus ist nicht zuverlässig erkennbar, dass ohne Konto **maximal eine aktive Gastreise** möglich ist.

Empfohlene Produkt-/UX-Richtung:

- Die Einschränkung muss ausdrücklich und verständlich kommuniziert werden; nicht erst durch einen Fehler beim zweiten Versuch.
- Auf der Startseite darf `Kein Konto nötig` als niedrige Einstiegshürde bestehen bleiben; die Ein-Reise-Grenze soll dort nicht aggressiv als negative Hauptbotschaft dominieren.
- Spätestens beim Erstellen bzw. auf `Meine Reisen` soll eine klare, ruhige Erklärung stehen, z. B.: `Ohne Konto kannst du eine Reise privat auf diesem Gerät speichern. Für mehrere Reisen brauchst du ein kostenloses Konto.`
- Solange noch keine Gastreise existiert, bleibt `Reise erstellen` korrekt.
- Sobald eine aktive Gastreise existiert, soll der primäre CTA bevorzugt `Reise fortsetzen` lauten statt irreführend `Neue Reise`.
- Wenn der Gast trotzdem eine weitere Reise beginnen möchte, soll Jetnity keine technische Fehlermeldung zeigen und niemals still überschreiben. Stattdessen soll ein verständlicher Entscheidungsdialog angeboten werden, z. B.:
  - `Reise fortsetzen`
  - `Kostenloses Konto erstellen` / `Anmelden`, um mehrere Reisen zu speichern
  - optional als klar nachrangige Aktion: bestehende Gastreise ausdrücklich löschen/ersetzen, nur nach Bestätigung
- Es muss deutlich sein, dass eine **Mehrzielreise weiterhin eine einzige Reise** ist. Mehrere Ziele/Etappen innerhalb derselben Reise zählen nicht als mehrere Gastreisen.

Hauptentwickler-Empfehlung: Die Ein-Reise-Gastregel zunächst beibehalten, aber transparent und zum richtigen Zeitpunkt erklären. Sie reduziert Datenverlust-/Synchronisationskomplexität und schafft einen verständlichen Übergang zum Konto. Falls der Product Owner mehrere parallele Gastreisen ohne Konto wünscht, ist das technisch möglich, wäre aber eine eigene Produkt-/Persistenzentscheidung und sollte nicht beiläufig in PR #34 eingeführt werden.

### Abnahmepunkt 2 – Reise anlegen: keine vorprägenden Auswahlchips; Wünsche als editierbarer Freitext

**Product-Owner-Entscheidung: bestätigt.**

Aktuelles Problem:

- Der Planer zeigt `Reisetempo` mit `Ruhig / Ausgewogen / Intensiv` und setzt intern bereits standardmäßig `pace = balanced`, obwohl der Besucher diese Präferenz nicht zwingend bewusst gewählt hat.
- Zusätzlich werden strukturierte Interessen wie `Kultur`, `Natur`, `Kulinarik`, `Strand`, `Abenteuer`, `Wellness` als dauerhafte Reise-Facts gespeichert.
- Diese frühen strukturierten Signale können die intelligente Planung unnötig vorprägen und dazu führen, dass Jetnity Möglichkeiten zu früh einschränkt.
- Auf Mobile entsteht außerdem kognitive Last durch viele Auswahlmöglichkeiten in einem Schritt, obwohl der Nutzer primär erst eine Reise anlegen möchte.
- Das vorhandene Freitextfeld `Was ist dir bei dieser Reise besonders wichtig?` ist fachlich geeigneter, wird aber nach Erstellung nicht als einfach sichtbarer, direkt editierbarer Kernwunsch angeboten.

Verbindliche fachliche Richtung für den späteren Amendment:

1. **Initialen Planungsflow vereinfachen.**
   - `Reisetempo`-Auswahl aus dem Reise-anlegen-Flow entfernen.
   - Interessen-Chips aus dem Reise-anlegen-Flow entfernen.
   - Keine implizite sichtbare oder unsichtbare Benutzerpräferenz aus einem Default wie `balanced` ableiten.
   - Der Nutzer soll beim Start nur die wirklich nötigen Reise-Facts plus optionale eigene Wünsche angeben.

2. **Freitext als primärer Wunsch-/Prioritäten-Kontext.**
   - Ein einziges optionales Feld für eigene Wünsche/Prioritäten bleibt, z. B. `Was ist dir bei dieser Reise wichtig?`.
   - Der Nutzer formuliert selbst, was tatsächlich relevant ist, statt aus vorgegebenen Kategorien wählen zu müssen.
   - Der Text darf Jetnity intelligent beeinflussen, ist aber kein unveränderlicher Filter und keine globale Persönlichkeit des Reisenden.
   - Jetnity darf aus diesem Text intern temporäre Bedeutungen ableiten, diese aber nicht ungefragt als dauerhafte strukturierte Nutzer-Wahrheit verhärten.

3. **Hard Facts vs. Soft Preferences strikt trennen.**
   - Harte Reise-Facts wie Ziele, Route, konkrete Daten, Reisende und ausdrücklich gesetzte Budgetgrenzen bleiben deterministische Facts.
   - Freitext-Wünsche sind standardmäßig **weicher Planungskontext**, außer der Nutzer formuliert eindeutig eine Muss-Bedingung oder bestätigt eine harte Einschränkung.
   - Ein Wunsch wie `gern Strand` darf andere sinnvolle Möglichkeiten nicht dauerhaft ausschließen.
   - Ein klarer Satz wie `Ich möchte auf keinen Fall einen Mietwagen` kann als stärkere Vorgabe behandelt werden, muss aber bei späterer Änderung sofort neu bewertet werden.

4. **Später jederzeit sichtbar bearbeitbar.**
   - Im Trip Workspace / Dashboard braucht es einen klaren, einfachen Bereich wie `Wünsche & Prioritäten` statt eines starren `Reiseprofil`-Eindrucks.
   - Der gespeicherte Freitext muss dort direkt sichtbar und einfach bearbeitbar sein.
   - Änderungen müssen sowohl für Gast- als auch Kontoreisen funktionieren.
   - Nach einer Änderung dürfen alte darauf basierende Vorschläge nicht still als unverändert gültig behandelt werden; betroffene intelligente Empfehlungen müssen den aktuellen Wunschkontext verwenden.

5. **Bestehende Felder `pace` / `interests` nicht unkontrolliert weiter als Wahrheit verwenden.**
   - Der spätere Implementierungs-Amendment muss prüfen, ob diese bestehenden Schemafelder deprecatet, nullable/neutral modelliert oder nur noch als Legacy-Kompatibilität behalten werden.
   - Ein technischer Default `balanced` darf künftig nicht als vom Nutzer bestätigte Präferenz in intelligente Entscheidungen einfließen.
   - Keine unnötige Production-Migration ohne Architektur-/Datenbestandsprüfung; bestehende Reisen dürfen nicht still semantisch umgedeutet werden.

6. **Progressive Intelligence statt Fragebogen.**
   - Jetnity soll fehlende Präferenzen später nur dann gezielt nachfragen, wenn sie für eine konkrete Entscheidung wirklich wichtig sind.
   - Beispiel: Erst wenn zwei gleich gute Reisevarianten deutlich vom gewünschten Tempo abhängen, kann Jetnity gezielt fragen, ob der Nutzer lieber entspannter oder dichter plant.
   - Dadurch bleibt der Einstieg einfach und die Intelligenz offen statt früh eingeschränkt.

Hauptentwickler-Empfehlung: Diese Änderung ist fachlich sinnvoll. Jetnitys Stärke soll darin liegen, aus wenigen belastbaren Facts und frei formulierten Wünschen breite Möglichkeiten zu analysieren und erst bei echter Entscheidungsrelevanz weitere Fragen zu stellen. Vorgegebene Interessen-/Tempo-Kategorien dürfen nicht unbemerkt zur langfristigen Optimierungsfunktion werden.

### Abnahmepunkt 3 – Trip Workspace / Reise-Dashboard ist die primäre Produktoberfläche

**Product-Owner-Entscheidung: verbindlich.**

Kontext:

- Nach dem Anlegen einer Reise befindet sich der Nutzer im zentralen Trip Workspace / Reise-Dashboard.
- Auf dem aktuellen Screenshot ist der Bereich `Flüge` aktiv; darüber liegen Reise-Zusammenfassung und die Hauptbereiche `Übersicht`, `Flüge`, `Unterkunft`, `Aktivitäten` sowie weitere Workspace-Bereiche.
- Diese Seite ist der Ort, an dem die Reise laufend geplant, ergänzt, bewertet, geändert und später begleitet wird.

Verbindliche Qualitätsanforderung:

- Der Trip Workspace ist die **wichtigste Produktfläche von Jetnity** und muss entsprechend als höchste UX-/Logic-/Intelligence-Priorität behandelt werden.
- Jetnity muss hier nicht nur Daten anzeigen, sondern intelligent erkennen, **was für die konkrete Reise jetzt wichtig ist**, was fehlt, was unsicher ist, was bereits gut gelöst ist und was als Nächstes sinnvoll wäre.
- Die Informationsarchitektur muss psychologisch ruhig, logisch eindeutig und mobile-first sein. Der Besucher darf trotz hoher funktionaler Tiefe nie das Gefühl bekommen, vor einem komplizierten Verwaltungssystem zu stehen.
- Alles Relevante muss auffindbar sein, aber nicht alles gleichzeitig gleich laut erscheinen. Priorität vor Vollständigkeitsrauschen.
- Harte Reise-Wahrheit, Buchungs-/Planungsstatus, weiche Wünsche, Empfehlungen, Warnungen und offene Entscheidungen müssen visuell und semantisch klar getrennt sein.
- Jetnity soll über alle Bereiche hinweg eine gemeinsame Reise-Wahrheit verwenden; keine widersprüchlichen Einzelwelten pro Tab.
- Änderungen in einem Bereich müssen ihre Auswirkungen auf andere relevante Bereiche erkennen können. Beispiel: eine neue Flugroute kann Transit-/Readiness-, Mobilitäts-, Zeit- oder Unterkunftsfolgen haben.
- Intelligente Vorschläge müssen begründet und reversibel sein: Jetnity darf optimieren und proaktiv empfehlen, aber größere Reiseänderungen erst nach ausdrücklicher Nutzerfreigabe übernehmen.
- Mobile Nutzung auf dem iPhone ist first-class. Horizontale Tabs, Karten, Statusblöcke, Aktionen und Warnungen müssen ohne Sucharbeit und unnötiges Scroll-/Orientierungschaos verständlich bleiben.

Hauptentwickler-Prüfprinzip für die weitere Abnahme:

Wir prüfen den Workspace ab jetzt Bereich für Bereich nicht nur auf Optik, sondern jeweils auf:

1. **Informationshierarchie:** Sieht der Nutzer zuerst das, was jetzt wichtig ist?
2. **Logik:** Stimmen Status, Route, Daten, Reisende und Abhängigkeiten über alle Bereiche überein?
3. **Intelligenz:** Erkennt Jetnity fehlende Informationen, Risiken, bessere Optionen und sinnvolle nächste Schritte selbst?
4. **Nutzerkontrolle:** Kann der Nutzer verstehen, ändern, verwerfen oder bestätigen, ohne dass Jetnity still Entscheidungen übernimmt?
5. **Progressive Disclosure:** Werden Details erst dann gezeigt/erfragt, wenn sie relevant sind?
6. **Cross-Domain-Auswirkungen:** Werden Folgen zwischen Flügen, Unterkunft, Aktivitäten, Mobilität, Readiness und weiteren Bereichen berücksichtigt?
7. **Mobile Psychologie:** Bleibt der Workspace trotz Tiefe ruhig, übersichtlich und schnell erfassbar?

Dieser Punkt ist keine einzelne UI-Korrektur, sondern eine verbindliche Qualitätslatte für **alle folgenden Product-Owner-Funde im Trip Workspace**.

## Noch nicht tun

- keine eigenmächtige Implementierung aus diesem Sammeldokument
- offene Detail-UX nicht ohne Product-Owner-Abstimmung festlegen
- kein Merge
- kein Mark Ready
- keine Production-Migration

## Abschluss der Abnahme

Wenn der Product Owner den Rundgang als vollständig erklärt, muss ChatGPT/Hauptentwickler:

1. alle Punkte auf Vollständigkeit und Widersprüche prüfen,
2. fachliche Auswirkungen über alle betroffenen Bereiche bestimmen,
3. eigene professionelle Empfehlungen ergänzen, sofern relevant,
4. einen verbindlichen Implementierungs-Amendment für Cursor erstellen,
5. die bestätigten Anforderungen in `ACTIVE_WORK_STATUS`, Handoff/Roadmap/ADRs/Fachdokumenten dort verankern, wo sie dauerhaft hingehören,
6. erst danach Umsetzung starten lassen,
7. anschließend erneut Code-, Security-, Logic-, UX- und Product-Owner-Abnahme durchführen.
