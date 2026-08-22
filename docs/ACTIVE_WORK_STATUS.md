# Jetnity – Active Work Status

Stand: 22. August 2026  
Arbeitsblock: **Foundation D – Route & Transit Intelligence**

## 1. Branch / PR / Status

- Branch: `feat/route-transit-intelligence`
- Draft PR: **#34 – Foundation D – Route & Transit Intelligence**
- letzter Head vor diesem Status-Checkpoint: `7b4c64d3fc2cdbc00759fd1c1e029d16ccbffab7`
- tatsächlichen aktuellen Head vor Arbeit immer erneut über GitHub verifizieren
- Status: **vor Implementierung / neuer Cursor-Agent soll übernehmen**
- Merge: **nicht freigegeben**

Wichtig: `main` wurde nach Erstellung des Foundation-D-Branches weiter dokumentarisch aktualisiert. Der neue Agent muss den Branch deshalb zuerst sauber mit dem aktuellen `main` synchronisieren und eventuelle Dokumentationsüberschneidungen auf die neuere Wahrheit auflösen. Nicht blind überschreiben.

## 2. Ziel

Strukturierte Route-/Transit-Wahrheit im gemeinsamen Reisegraphen aufbauen, sodass Jetnity belastbar verstehen kann:

- Origin
- Destination
- Flight-/Itinerary-Segmente
- Umstiege / Multi-Transit
- Transitländer
- relevante Routeänderungen

Diese Wahrheit soll von Flight UI, Foundation C Readiness, Mobilität/Connections und Reiseänderungslogik wiederverwendet werden.

Produktprinzip:

> **Eine Route, eine strukturierte Wahrheit.**

UX-Prinzip:

> **Der Nutzer sieht die Reise – nicht die Komplexität des Datenmodells dahinter.**

## 3. Bereits umgesetzt / vorbereitet

Vor Implementierungsbeginn bereits vorhanden:

- Foundation C ist auf `main` und Production abgeschlossen.
- Branch `feat/route-transit-intelligence` existiert.
- Draft PR #34 existiert.
- verbindlicher Implementierungsauftrag: `docs/CURSOR_ROUTE_TRANSIT_INTELLIGENCE_TASK.md`.
- websiteweiter UX-/Informationsarchitektur-Standard ist verbindlich: `docs/UX_INFORMATION_ARCHITECTURE_STANDARD.md`.
- Product-Owner-Merge-Gate ist verbindlich: kein Merge ohne ausdrückliche aktuelle Nutzerfreigabe.
- Progress-Persistence-Policy ist verbindlich: kein relevanter Fortschritt darf nur im Chat/Agenten-Kontext bleiben.
- Foundation-D-spezifischer Merge-Amendment liegt im Branch.

**Noch keine Foundation-D-Fachimplementierung als abgeschlossen betrachten.** Die bisherigen PR-Änderungen sind Auftrag/Governance/Handoff-Vorbereitung.

## 4. Noch offen / zu implementieren

Gemäß `docs/CURSOR_ROUTE_TRANSIT_INTELLIGENCE_TASK.md` insbesondere:

- bestehendes Flight-/Trip-/Mobility-/Readiness-Datenmodell analysieren;
- kanonische strukturierte Route Facts definieren, ohne Parallelwahrheit;
- belastbare Ableitung aus strukturierten Flight-/Itinerary-Daten;
- keine Länder aus freien Ortsnamen raten;
- Multi-Segment / Multi-Transit vollständig und deterministisch behandeln;
- Route Facts in Foundation C `routeFactsAusReise()` bzw. die vorgesehene Naht einspeisen;
- sinnvolle Verbindung zu Mobilität/Connections und Reiseänderungslogik;
- Route im Flugbereich verständlich, ruhig und mobile-first sichtbar machen;
- Änderungswirkung für Transit/Readiness nachvollziehbar machen;
- Guest-/Account-Parität und bestehende Source-of-Truth-Regeln respektieren;
- notwendige Tests, Browser-Audits, Build, CI und Vercel Preview durchführen;
- Architektur-/ADR-/Fach-/Handoff-/Roadmap-Dokumentation gemäß tatsächlichem Ergebnis aktualisieren.

## 5. Letzte relevanten Entscheidungen

### Websiteweite UX / psychologische Klarheit

Alle Besucherbereiche müssen logisch eindeutig, visuell priorisiert, ruhig und progressiv verständlich sein. Hohe technische Komplexität darf nicht als mentale Last beim Nutzer landen.

### Merge-Gate

Technisch fertig = review-bereit. **Kein Merge ohne ausdrückliche aktuelle Product-Owner-Freigabe.** Der Product Owner erhält vor Merge Gelegenheit für Änderungen.

### Progress Persistence

Jeder relevante Fortschritt, Blocker, Review-Fund, Test-/CI-/Preview-Stand und nächste Schritt muss versioniert werden. Diese Datei ist während Foundation D der kompakte Live-Handoff und muss bei wesentlichen Zustandsänderungen aktualisiert werden.

## 6. Tests / CI / Preview

Aktueller Foundation-D-Implementierungsstand:

- noch keine Fachimplementierung abgeschlossen;
- deshalb noch kein abschließender Foundation-D-Test-/Audit-Nachweis;
- frühere Foundation-C-Nachweise sind nicht als Foundation-D-Nachweis zu verwenden;
- nach Implementierungsmeilensteinen echte Ergebnisse hier eintragen.

## 7. Datenbank / RLS / Production

- keine Foundation-D-Production-Migration freigegeben;
- keine neue DB-Änderung für Foundation D bisher als abgeschlossen dokumentiert;
- bestehende Production-Grenzen aus Handoff/Task bleiben verbindlich;
- falls eine DB-Änderung unerwartet nötig wird: zuerst fachlich/architektonisch begründen und gemäß Task/Gates behandeln.

## 8. Kosten / Provider / Secrets

- kein echter Flight Provider aktivieren;
- kein Requirements-/Timatic-Provider aktivieren;
- keine neuen Secrets;
- keine neuen laufenden Kosten ohne geltende Freigabe;
- keine Fake-Routen, Transitländer, Zeiten oder regulatorischen Aussagen.

## 9. Bekannte Risiken / operative Hinweise

- Feature-Branch ist gegenüber dem inzwischen weiter dokumentierten `main` zu synchronisieren.
- Handoff/Roadmap können in Branch und `main` inhaltlich überlappen; neuere verifizierte Wahrheit erhalten, keine ältere Kopie zurückspielen.
- `routeFactsAusReise()` darf nicht durch Ortsnamen-Raten „schnell repariert“ werden.
- Foundation C nicht neu bauen.
- keine neue parallele Route Truth neben dem gemeinsamen Reisegraphen schaffen.

## 10. Offene Nutzerentscheidungen / Freigaben

Aktuell:

- **Merge von PR #34 nicht freigegeben.**
- Product Owner möchte vor Merge ausdrücklich die Möglichkeit haben, weitere Änderungen vorzuschlagen.
- Production-/Provider-/Kostenfreigaben sind getrennte Gates und ebenfalls nicht implizit erteilt.

## 11. Exakter nächster Schritt

Neuer Cursor-Agent:

1. aktuellen `main`- und PR-#34-Stand verifizieren;
2. `feat/route-transit-intelligence` sauber mit aktuellem `main` synchronisieren;
3. diese Datei und alle Pflichtquellen lesen;
4. `docs/CURSOR_ROUTE_TRANSIT_INTELLIGENCE_TASK.md` vollständig umsetzen;
5. nach jedem relevanten Meilenstein diese Datei aktualisieren;
6. PR Draft lassen und nicht mergen.

## 12. Pflichtlektüre für den übernehmenden Agenten

Mindestens:

- `JETNITY_PRODUCT_MANDATE.md`
- `JETNITY_VISION.md`
- `JETNITY_HANDOFF.md`
- `ROADMAP.md`
- `ARCHITECTURE.md`
- `DECISIONS.md`
- `DESIGN_SYSTEM.md`
- `AGENTS.md`
- `docs/PRODUCT_QUALITY_STANDARD.md`
- `docs/UX_INFORMATION_ARCHITECTURE_STANDARD.md`
- `docs/LOGIC_STANDARD.md`
- `docs/CONTINUITY_STANDARD.md`
- `docs/CHATGPT_CURSOR_WORKFLOW.md`
- `docs/PROJECT_PROGRESS_PERSISTENCE_POLICY.md`
- `docs/PRODUCT_OWNER_MERGE_APPROVAL_POLICY.md`
- `docs/TRAVEL_READINESS.md`
- `docs/CURSOR_ROUTE_TRANSIT_INTELLIGENCE_TASK.md`
- `docs/CURSOR_ROUTE_TRANSIT_MERGE_APPROVAL_AMENDMENT.md`
- relevante Flight-/Trip-/Mobility-/Readiness-Dateien und Tests.

Danach realen Git-/CI-/Preview-/Development-/Production-Stand prüfen, bevor Annahmen getroffen werden.
