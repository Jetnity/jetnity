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

### Abnahmepunkt 1 – Startseite / erster Bildschirm des Foundation-D-Preview

- Gerät/Kontext: iPhone, mobiler Preview-Aufruf
- Seite: öffentliche Jetnity-Startseite
- Screenshot vorhanden im Product-Owner-Review-Chat
- Product Owner hat angekündigt, dass hier das **erste funktionale Problem** beginnt.
- Konkrete Anforderung: **noch offen – wird im nächsten Product-Owner-Schritt präzisiert.**

## Noch nicht tun

- keine Interpretation des Problems als bestätigte Anforderung, bevor der Product Owner es konkret beschreibt
- keine eigenmächtige Implementierung aus diesem Sammeldokument
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
