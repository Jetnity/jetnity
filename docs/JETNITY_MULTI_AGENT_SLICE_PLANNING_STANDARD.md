# Jetnity – Multi-Agent Slice Planning Standard

Stand: 1. September 2026  
Status: **Product-Owner-verbindlich / chatübergreifend / Ergänzung zum Technical Lead / Cursor Agent Operating Standard**

## 1. Zweck

Dieses Dokument macht die Multi-Agent-Prüfung zu einem verbindlichen Teil jeder zukünftigen Jetnity-Slice-Planung.

Der Product Owner muss nicht erneut daran erinnern.

Vor jedem neuen Slice entscheidet der Technical Lead nicht nur **was** gebaut werden soll, sondern auch **ob und wie der Slice sicher auf mehrere Agenten aufgeteilt werden kann**.

> **Parallelisieren, wenn es Geschwindigkeit oder Qualität erhöht. Nicht parallelisieren, wenn es Truth, Architektur, Security oder Integration gefährdet.**

Diese Regel ergänzt insbesondere `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`, Phase B – Scope und Agentenwahl.

## 2. Verbindlicher Multi-Agent-Suitability-Check

Nach der Live-Rekonstruktion und **vor Task-/Branch-/Agenten-Dispatch** prüft der Technical Lead für jeden Slice mindestens:

1. Welche Dateien, Module, Datenmodelle, Shared Contracts und APIs werden voraussichtlich berührt?
2. Gibt es DB-/Migration-/RLS-/Auth-/Security-/Provider-/Production- oder andere Product-Owner-Gates?
3. Lassen sich Teilaufgaben mit klarer, disjunkter Ownership trennen?
4. Können Ergebnisse unabhängig reviewed werden, bevor sie integriert werden?
5. Brauchen Teilaufgaben dieselben Shared Contracts oder müssen sie dieselben Dateien verändern?
6. Gibt es eine eindeutige Abhängigkeits- und Merge-Reihenfolge?
7. Besteht Risiko für doppelte Implementierung, divergierende Truth, widersprüchliche Typen oder parallele Migrationen?
8. Würde ein zusätzlicher Agent real Geschwindigkeit oder Qualität erhöhen oder nur Koordinationskosten erzeugen?

Das Ergebnis wird nicht nur gedanklich getroffen, sondern im versionierten Task / PR / Status oder Handoff dokumentiert.

## 3. Wann mehrere Agenten eingesetzt werden sollen

Mehrere Agenten sind der bevorzugte Modus, wenn alle folgenden Bedingungen ausreichend erfüllt sind:

- mindestens zwei fachlich sinnvolle Teilaufgaben sind unabhängig oder nur über stabile, bereits vorhandene Contracts gekoppelt;
- Ownership kann eindeutig pro Agent definiert werden;
- Agenten müssen nicht dieselben Dateien oder Migrationen gleichzeitig verändern;
- Shared Contracts sind vor dem Parallelstart stabil oder werden bewusst von einem einzigen Contract-Owner zuerst geliefert;
- jeder Agent besitzt klare Acceptance Criteria und Non-Scope;
- Integration kann in definierter Reihenfolge erfolgen;
- der Technical Lead kann jeden Head unabhängig exact-head reviewen;
- die Parallelisierung reduziert tatsächlich Durchlaufzeit oder erhöht Review-/Fachqualität.

Beispiele geeigneter Parallelität können sein:

- voneinander unabhängige Domain-Audits;
- Runtime-Implementierung und unabhängige Test-/Failure-Mode-Evidence in getrennten Ownership-Bereichen;
- getrennte Provider-/Domain-Recherchen ohne gemeinsame Secrets oder Live-Aktivierung;
- klar getrennte UI- und Backend-Teilaufgaben bei bereits fixiertem Contract;
- voneinander unabhängige Documentation-/QA-Arbeiten.

Diese Beispiele sind keine automatische Freigabe. Live-Evidence und konkrete Slice-Topologie entscheiden.

## 4. Wann bewusst nur ein Agent eingesetzt wird

Ein einzelner Agent ist verpflichtend oder deutlich vorzuziehen, wenn Parallelisierung ein relevantes Risiko erzeugt, insbesondere bei:

- demselben Shared Contract oder denselben zentralen Typen;
- derselben Migration / Tabelle / RLS-/Grant-/Function-Fläche;
- fundamentaler Auth-/Session-/MFA-/AAL-Logik;
- sensiblen Traveller-/Passport-/Document-Truth-Verträgen;
- einer kleinen eng gekoppelten Änderung mit hoher Überschneidung;
- unmittelbarer Review-Fix-Schleife desselben PRs;
- einer notwendigen seriellen Foundation, von der alle Folgearbeiten abhängen;
- unklarer Ownership oder unklarer Merge-Reihenfolge;
- hohem Risiko, dass zwei Agenten dieselbe Lösung unterschiedlich implementieren.

> **Mehr Agenten sind kein Qualitätsmerkmal an sich. Saubere Parallelität ist das Ziel.**

## 5. Ownership-Regeln bei Parallelität

Wenn mehrere Agenten eingesetzt werden, definiert der Technical Lead vor Dispatch verbindlich:

- exakten logischen Agentennamen und Generation;
- exakten Teil-Scope;
- erlaubte Dateien / Module / Datenflächen;
- ausdrücklich nicht erlaubte Ownership-Bereiche anderer Agenten;
- Shared-Contract-Owner;
- erwartete Abhängigkeiten;
- Merge-/Integrationsreihenfolge;
- Acceptance Criteria;
- Stop-Punkt für unabhängigen TL-Review.

Kein Agent darf still den Ownership-Bereich eines anderen Agenten übernehmen oder einen Shared Contract eigenmächtig verändern, wenn dieser nicht seinem Auftrag gehört.

Wenn während der Arbeit eine Kollision sichtbar wird, stoppt der betreffende Agent am Contract-/Ownership-Rand und eskaliert die benötigte Änderung an den Technical Lead.

## 6. Branch- und PR-Topologie

Standard bei echter Parallelität:

- jeder unabhängig reviewbare Teil-Slice besitzt einen eigenen Branch und normalerweise einen eigenen Draft-PR;
- alle Branches starten von einer live verifizierten Baseline oder einer ausdrücklich dokumentierten seriellen Foundation;
- Agent A darf nicht still auf ungemergten Agent-B-Code bauen, außer der Technical Lead hat eine explizite Abhängigkeitskette definiert;
- Shared-Contract-Foundation wird zuerst integriert oder als klarer Basis-Branch behandelt;
- jeder neue Head invalidiert die Exact-Head-Gates nur seines eigenen PRs, bis Integration die anderen Branches tatsächlich beeinflusst;
- nach Merge einer Dependency muss jeder abhängige Branch auf Drift / Merge-Base / Contract-Auswirkung neu bewertet werden.

## 7. Review und Merge bleiben zentral

Mehrere Agenten ändern die Jetnity-Governance nicht:

- Cursor-Agenten setzen niemals Ready;
- Cursor-Agenten mergen niemals;
- Agent-Self-Review ist kein Technical-Lead-PASS;
- jeder PR wird auf exaktem Head unabhängig reviewed;
- Shared-Contract-/Integrationseffekte werden zusätzlich cross-PR geprüft;
- Product-Owner-Gates bleiben vollständig bestehen;
- nur der Technical Lead entscheidet über Integrations- und Merge-Reihenfolge.

Die finale Produktwahrheit entsteht nicht durch Mehrheitsentscheidung mehrerer Agenten, sondern durch die unabhängige Technical-Lead-Integration gegen die kanonische Architektur und Live-Evidence.

## 8. Verbindliche Dokumentation im Task

Jeder neue material Slice-Task muss künftig einen Abschnitt enthalten, sinngemäß:

### Multi-Agent Suitability

- `Decision: SINGLE_AGENT | MULTI_AGENT`
- Begründung;
- identifizierte Parallelisierungsachsen;
- identifizierte Kollisions-/Shared-Contract-Risiken;
- bei `MULTI_AGENT`: Agenten, Ownership, Branch/PR-Topologie und Merge-Reihenfolge;
- bei `SINGLE_AGENT`: warum zusätzliche Agenten keinen sicheren Vorteil bringen.

Ohne diese Prüfung ist die Slice-Planung unvollständig.

## 9. Review-Fix-Regel bleibt bestehen

Bei `CHANGES REQUIRED` für einen konkreten PR wird grundsätzlich derselbe logische Agent / dieselbe exakte Session für den unmittelbaren Fix weiterverwendet.

Ein zweiter Agent wird nicht parallel in denselben Fix-PR geschickt, nur um schneller zu sein.

Ein zusätzlicher unabhängiger Audit-/Review-Agent kann nur dann eingesetzt werden, wenn er **keine kollidierenden Änderungen** vornimmt und der Technical Lead dies als zusätzliche Evidence sinnvoll findet.

## 10. Aktuelle Anwendung auf diese Governance-Änderung

Für die Einführung dieses Standards wurde der Multi-Agent-Suitability-Check selbst durchgeführt.

Entscheidung: **SINGLE_AGENT / Technical-Lead-owned docs-only change.**

Begründung:

- sehr kleiner Governance-Scope;
- wenige eng gekoppelte kanonische Dokumente;
- kein sinnvoll trennbarer Runtime-/Research-Workstream;
- mehrere Agenten würden hier nur widersprüchliche Formulierungen und Merge-Aufwand erzeugen.

Dies ist kein Präzedenzfall gegen Parallelität. Bei zukünftigen funktionalen Slices wird neu gegen den jeweiligen Live-Stand geprüft.

## 11. Leitregel

> **MULTI-AGENT CHECK ALWAYS. MULTI-AGENT EXECUTION WHEN SAFE AND USEFUL. SINGLE AGENT WHEN PARALLELISM WOULD CREATE RISK.**

**LIVE-EVIDENCE WINS. AUDIT FIRST. REUSE BEFORE ADD. INTEGRATE BEFORE DUPLICATE. FAIL CLOSED.**
