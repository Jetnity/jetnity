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
