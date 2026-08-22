# Cursor Amendment – Foundation D: Traveller Context Intelligence Compatibility

Stand: 22. August 2026  
Status: **verbindlicher Nachtrag zu `docs/CURSOR_ROUTE_TRANSIT_INTELLIGENCE_TASK.md`**

## 1. Neue verbindliche Product-Owner-Entscheidung

Der Product Owner hat festgelegt:

> Traveller Context Intelligence muss bei **jeder relevanten Jetnity-Funktion** berücksichtigt werden. Eine Funktion darf nicht still annehmen, dass ein Reisender nur eine Staatsbürgerschaft, einen Pass oder eine einzige rechtlich nutzbare Option besitzt, wenn das Ergebnis dadurch anders ausfallen kann.

Globale Policy:

`docs/TRAVELLER_CONTEXT_INTELLIGENCE_POLICY.md`

Foundation-D-spezifische Readiness-Entscheidung:

`docs/MULTI_CITIZENSHIP_READINESS_AMENDMENT.md`

## 2. Konsequenz für Foundation D

Foundation D bleibt Route & Transit Intelligence und soll **nicht** in einen Traveller-/Credential-Schema-Umbau erweitert werden.

Verbindlich für den aktuellen Code:

- Route Facts sind traveller-neutral und aus strukturierten Flight-/Itinerary-Daten abgeleitet.
- Route-/Transit-Code darf keine singuläre Staatsbürgerschaft als Architekturannahme einbauen.
- Route Facts müssen später für mehrere Traveller und mehrere Credential-Profile wiederverwendbar sein.
- Foundation C / spätere Requirements-Auswertung muss dieselbe Route gegen unterschiedliche Credential-Optionen auswerten können.
- Keine neue Production-Migration im Scope von Foundation D.
- Keine Pass-/Dokumentnummern, Scans oder zusätzliche sensible Daten.

## 3. Review-Pflicht für PR #34

Im Human-/Architecture-Review von PR #34 ausdrücklich prüfen:

1. Ist die Route Truth vollständig unabhängig von einem einzelnen Traveller-/Passprofil?
2. Kann dieselbe Route später gegen mehrere Citizenship-/Credential-Profile ausgewertet werden, ohne Route-Duplikate oder Parallelwahrheit zu erzeugen?
3. Wird an keiner neuen Schnittstelle `nationality_country_code` als einzig mögliche dauerhafte Identitätswahrheit verhärtet?
4. Bleiben Routeänderungen geeignet, abhängige Multi-Credential-Readiness-Ergebnisse später gezielt stale/recheck zu setzen?
5. Bleibt die UX routezentriert und wird nicht mit Credential-Komplexität überladen?

## 4. Kein Scope-Creep

Die eigentliche 1:n-Erweiterung von Traveller → Citizenship(s) / Credential(s) wird in einem separaten Readiness-/Traveller-Context-Block umgesetzt und braucht eigenen Architektur-, Security-, DB-/RLS-, UX- und Product-Owner-Review.

PR #34 bleibt Draft und darf ohne ausdrückliche Product-Owner-Freigabe nicht gemergt werden.
