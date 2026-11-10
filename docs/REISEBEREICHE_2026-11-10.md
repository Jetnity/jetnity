# Reiseplanung und Konto, 10. November 2026

Der Product Owner hat die Gestaltung der Reisebereiche gemeinsam freigegeben. Die Integration erfolgt im separaten Branch feat/reiseplanung-konto-atlas. Drei disjunkte Arbeitsbereiche erhalten eigene Branches und jeweils einen Writer. Der Integrationsbranch übernimmt die geprüften Änderungen in der Reihenfolge Reiseplan, Reiseauswahl/Konto, Weltatlas. Freigabe und Integration liegen beim Lead.

- Reiseplan: Etappenansicht, Tagespunkte und Karte, zugehörige Komponenten und Tests. Bestehende Schreibrechte und Revisionen bei Änderungen beibehalten.
- Reiseauswahl/Konto: Sammlung, Suche, Profil und Kontoeinstieg. Bestehende Archiv- und Sicherheitsfunktionen weiterverwenden.
- Weltatlas: ausschließlich die Weltseite, Kartenansicht und zugehörigen Styles und Tests.
- Integration: Workspace-Navigation, Anzeige der Reisedetails und Flugübergabe über den offiziellen CJ-Link. Organisatorische Suchaktionen erzeugen keine Buchung.

Geprüft werden Desktop und Mobilansicht, Direktlinks, Zurück-Navigation, Zustände ohne Daten, Änderungen an einer Testreise und Partnerziele. Der Entwurf darf keine Beispielbuchungen oder persönlichen Daten als reale Ergebnisse ausgeben.

## Produktentscheidung

Die Übersicht führt offene Aufgaben in den jeweils passenden Reiter. Reisedetails und die bestätigten Einträge der einzelnen Reise gehören in die Übersicht. Der Kontoeinstieg führt zu den Funktionen für Profil, Reisende, Sicherheit und Datenschutz. Die Reisesammlung und die persönliche Weltkarte haben eigene Ziele in der Navigation. Die Atlaskarten verwenden lokale Natural-Earth-Daten.

Die Booking.com-Flugsuche übergibt einfache Flüge, Rückflüge und Gabelflüge über den von CJ ausgestellten Partnerlink. Nur eine ausdrückliche Suche öffnet die Partnerseite. Hotels und Flüge erfordern keine lokale Preisliste und keine zusätzliche Partner-API. Eine in Chrome geprüfte Gabelflugsuche erreichte mit CJ-Kennzeichnung beide gewählten Flughafenpaare und Flugtermine bei Booking.com. Der Test umfasst die Suchübergabe. Die spätere Provisionsabrechnung setzt eine qualifizierte Buchung voraus.
