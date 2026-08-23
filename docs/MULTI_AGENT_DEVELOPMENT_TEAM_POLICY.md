# Jetnity – Multi-Agent Development Team Policy

Stand: 23. August 2026  
Status: **verbindliche Entwicklungsentscheidung für die Zeit nach Closure von PR #38**

## 1. Ziel

Jetnity wird nach technischem Closure/PASS von PR #38 kontrolliert von einem einzelnen Cursor-Implementierungsagenten auf ein **koordiniertes Multi-Agent-Entwicklungsteam** erweitert.

Das Ziel ist höhere Entwicklungsgeschwindigkeit **ohne Verlust von Architektur-, Truth-, Security-, Daten- oder Integrationsqualität**.

## 2. Rollenmodell

- **Product Owner:** entscheidet Produktprioritäten und finale Freigaben; insbesondere kein Mark Ready/Merge ohne ausdrückliche Freigabe.
- **ChatGPT / Technical Lead & Independent Reviewer:** hält Gesamtarchitektur, Abhängigkeiten, Workstreams, Integration, Handoffs und unabhängige adversarielle Reviews zusammen.
- **Lead/Integrator Cursor Agent:** bearbeitet oder integriert gemeinsame Kernverträge und koordinierte Cross-Domain-Änderungen.
- **Weitere Cursor Agents:** arbeiten parallel an klar abgegrenzten Workstreams mit eigenem Branch/PR und definierten Ownership-Grenzen.
- **GitHub Repository:** dauerhaftes Projektgedächtnis und Source of Truth für Teamstatus, Entscheidungen, Branches, PRs, Reviews und Handoffs.

## 3. Parallelisierungsregel

Parallelisierung erfolgt nur dort, wo die fachlichen und technischen Abhängigkeiten es erlauben.

### Gut parallelisierbar

- voneinander unabhängige Produktmodule;
- getrennte UI-/Feature-Bereiche mit stabilen Contracts;
- Test-/Adversarial-Review-Arbeit;
- Provider-Research/Readiness ohne Änderung gemeinsamer Runtime-Contracts;
- Dokumentations-/Architekturabgleich.

### Nicht unkoordiniert parallelisieren

Gemeinsame Source-of-Truth- und Kernbereiche dürfen nicht von mehreren Agenten gleichzeitig unabhängig umgebaut werden, insbesondere wenn sie dieselben Contracts verändern, z. B.:

- Route Truth;
- Traveller Context/Credentials;
- Readiness/Einreise;
- Safety/Seasonal bei gemeinsamem Route-/Zeitkontext;
- Auth/Ownership/RLS;
- zentrale Trip-Graph-/Persistenzverträge.

Solche Änderungen laufen sequenziell oder unter einem klaren Lead-/Integrator-Workstream.

## 4. Verbindliche Team-Infrastruktur vor dem ersten parallelen Entwicklungsblock

Bevor mehrere Implementierungsagenten gleichzeitig gestartet werden, müssen im Repository vorhanden und aktuell sein:

1. zentrale **Workstream-/Agent-Übersicht**;
2. **Ownership-Matrix** pro Bereich/Contract;
3. eigener **Branch und PR pro Implementierungsagent/Workstream**;
4. definierte **Allowed/Forbidden Touch Areas**;
5. dokumentierte **Abhängigkeiten und Blocker** zwischen Workstreams;
6. verbindliche **Integrationsreihenfolge**;
7. pro Workstream klare Acceptance-/Test-/Security-/Guest-Account-/Cross-Domain-Kriterien;
8. vollständiges **Handoff** mit aktuellem Head, PR, Status, offenen Risiken und nächstem Schritt;
9. **Self-Review** des jeweiligen Cursor-Agenten vor Fertigmeldung;
10. **unabhängiger ChatGPT-Review** vor technischer Closure/Integration;
11. nach Integration zusätzlicher **Cross-Workstream-/Cross-Domain-Review** für gemeinsam wirkende Funktionen.

## 5. Persistenz-/Chatwechsel-Regel

> **Keine wichtige Multi-Agent-Information darf nur in einem Chat oder einer Cursor-Session existieren.**

Dauerhaft im Repository festzuhalten sind mindestens:

- welcher Agent welchen Workstream besitzt;
- Branch/PR/aktueller Runtime-Head;
- Status: geplant / arbeitet / blockiert / Review / fertig / integriert;
- Abhängigkeiten und gemeinsame Contracts;
- offene Blocker und Review-Funde;
- Integrationsreihenfolge;
- relevante Architektur-/Produktentscheidungen;
- exakter nächster Schritt.

Ein neuer Chat muss das bestehende Entwicklungsteam anhand von `JETNITY_HANDOFF.md`, `docs/ACTIVE_WORK_STATUS.md` und der Multi-Agent-Übersicht vollständig rekonstruieren können, ohne dass der Product Owner den Projektzustand neu erklären muss.

## 6. Startzeitpunkt

**Nicht während des laufenden R10/R11-Härtungszyklus von PR #38.**

Verbindlicher Startpunkt:

1. Cursor schließt R10-Blocker 20–23;
2. Exact-Head-Gate;
3. unabhängiger R11-Review;
4. bei Stop-Kriterium: technisches Closure/PASS von PR #38;
5. **danach** Multi-Agent-Team-Infrastruktur aufbauen;
6. nächste Roadmap-Phase in geeignete parallele Workstreams zerlegen;
7. zunächst kontrolliert mit ungefähr **2–3 parallelen Cursor-Agenten** starten;
8. Teamgröße erst erhöhen, wenn Integration, Handoffs und Reviews stabil funktionieren.

## 7. Qualitätsprinzip

Mehr Agenten sind kein Selbstzweck. Geschwindigkeit darf niemals dadurch erkauft werden, dass mehrere Agenten widersprüchliche Wahrheiten oder parallele Schattenmodelle erzeugen.

Leitsatz:

> **Parallel entwickeln, zentral koordinieren, unabhängig prüfen, kontrolliert integrieren.**

Das Multi-Agent-Modell ändert keine bestehenden Governance-Gates: kein Mark Ready/Merge, keine Provider-/Kosten-/Secret-/Production-Freigabe ohne die jeweils erforderliche ausdrückliche Product-Owner-Entscheidung.

## 8. Team-Excellence-Contract

Das Entwicklungsteam wird nicht an der Anzahl abgeschlossener Tasks gemessen, sondern an der Qualität des gemeinsam integrierten Jetnity-Systems.

Verbindlich gilt:

- Jeder Agent arbeitet als proaktiver Senior-Entwickler und prüft angrenzende Auswirkungen, statt nur den wörtlichen Auftrag minimal zu erfüllen.
- Kein Agent darf eine lokale Optimierung als Erfolg behandeln, wenn dadurch Architektur, gemeinsame Truth, Security, Datenintegrität, UX oder eine abhängige Funktion schlechter wird.
- Eine Fertigmeldung eines Agenten ist niemals automatisch eine technische Freigabe. Vor Integration sind Self-Review, relevante Gates und unabhängiger Review erforderlich.
- Gemeinsame Contracts werden vor paralleler Nutzung eindeutig definiert; bei Konflikten hat die kanonische Source of Truth Vorrang vor Workstream-Einzelinteressen.
- Nach Integration werden reale Cross-Domain-Szenarien geprüft. Mehrere einzeln grüne Funktionen gelten erst dann als erfolgreich, wenn sie zusammen korrekt arbeiten.
- Unsicherheit, Widerspruch oder fehlende Evidenz werden sichtbar gemacht und nicht durch Annahmen kaschiert.
- Schlechte, widersprüchliche oder nur scheinbar fertige Arbeit wird nicht übernommen, nur um Geschwindigkeit zu gewinnen.
- Jeder relevante Fehlerfund, Architekturentscheid und Integrationsstatus wird so dokumentiert, dass ein neuer Chat oder Agent die Teamarbeit ohne Wissensverlust fortsetzen kann.
- Das Stop-Kriterium bleibt verbindlich: hohe Review-Tiefe ja, künstliche Perfektionsschleifen ohne neuen konkreten relevanten Defekt nein.

Zielzustand:

> **Ein hervorragend koordiniertes Entwicklerteam, das unabhängig denken kann, aber gemeinsam genau eine Jetnity-Architektur, eine kanonische Wahrheit und einen einheitlichen Qualitätsstandard liefert.**
