# Reiseplanung und Konto, 10. November 2026

Der Product Owner hat die Gestaltung der Reisebereiche gemeinsam freigegeben. Die Integration erfolgt im separaten Branch feat/reiseplanung-konto-atlas. Drei disjunkte Arbeitsbereiche erhalten eigene Branches und jeweils einen Writer. Der Integrationsbranch übernimmt die geprüften Änderungen in der Reihenfolge Reiseplan, Reiseauswahl/Konto, Weltatlas. Freigabe und Integration liegen beim Lead.

- Reiseplan: Etappenansicht, Tagespunkte und Karte, zugehörige Komponenten und Tests. Bestehende Schreibrechte und Revisionen bei Änderungen beibehalten.
- Reiseauswahl/Konto: Sammlung, Suche, Profil und Kontoeinstieg. Bestehende Archiv- und Sicherheitsfunktionen weiterverwenden.
- Weltatlas: ausschließlich die Weltseite, Kartenansicht und zugehörigen Styles und Tests.
- Integration: Workspace-Navigation, Anzeige der Reisedetails und Flugübergabe über den offiziellen CJ-Link. Organisatorische Suchaktionen erzeugen keine Buchung.

Geprüft werden Desktop und Mobilansicht, Direktlinks, Zurück-Navigation, Zustände ohne Daten, Änderungen an einer Testreise und Partnerziele. Der Entwurf darf keine Beispielbuchungen oder persönlichen Daten als reale Ergebnisse ausgeben.
