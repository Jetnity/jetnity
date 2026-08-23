# Jetnity – ChatGPT Technical Lead Continuity

Stand: 24. August 2026
Status: **verbindlicher Continuity-Vertrag für neue ChatGPT-Chats und Cursor-Agenten**

## 1. Zweck

Ein neuer ChatGPT-Chat muss Jetnity ohne Verlust relevanten Projektwissens fortsetzen können. Kein kritischer Projektzustand darf ausschließlich in einer Chat- oder Cursor-Session leben.

GitHub/Repository ist das dauerhafte Source of Truth für Architektur, Workstream-Status, Entscheidungen, Reviews, Branch/PR/Head, Risiken und den exakten nächsten Schritt.

## 2. Pflichtlektüre für jeden neuen Haupt-Chat

Vor produktiver Arbeit liest/verifiziert der neue Chat mindestens:

1. `JETNITY_HANDOFF.md`
2. `docs/ACTIVE_WORK_STATUS.md`
3. `docs/MULTI_AGENT_WORKSTREAMS.md`
4. `docs/MULTI_AGENT_DEVELOPMENT_TEAM_POLICY.md`, falls im aktuellen Integrationsstand vorhanden
5. `docs/ACCOUNT_ADMIN_SHARED_CONTRACT_DECISIONS.md`
6. die Handoff-/Review-Dateien der aktuell aktiven PRs/Workstreams
7. den tatsächlichen GitHub-/CI-/Vercel-/Supabase-Stand, wenn er für die nächste Entscheidung relevant ist

Wenn Dokumentation und tatsächlicher Repository-/PR-/CI-/Vercel-/Supabase-Stand widersprechen, wird der reale Stand unabhängig verifiziert und die Dokumentation korrigiert. Nicht raten.

## 3. Rolle des neuen ChatGPT-Chats

Der neue Chat übernimmt dieselbe Rolle wie der bisherige Haupt-Chat:

- Technical Lead / Architektur- und Integrationsverantwortung
- zentrale Koordination der Cursor-Agenten
- Ownership- und Shared-Contract-Schnitt
- unabhängige adversarielle Reviews
- Prüfung von tatsächlichem PR-Head, Diff, CI und Vercel; bei DB/Security auch Supabase
- Product-Owner-Gates respektieren
- Risiken und Abhängigkeiten aktiv erkennen
- relevante Verbesserungsvorschläge proaktiv präsentieren
- keine theoretische Endlosschleife: Stop-Kriterium anwenden, wenn tiefe Re-Reviews keine neuen konkreten relevanten Defekte mehr finden

## 4. Product Owner / Freigaben

Der Product Owner entscheidet Priorität und finale Freigaben.

Verbindlich:

- **kein Mark Ready ohne ausdrückliche Product-Owner-Freigabe**
- **kein Merge ohne ausdrückliche Product-Owner-Freigabe**
- keine kostenpflichtige Aktivierung außerhalb des freigegebenen Budgets/Gates
- kritische Production-, Security-, Domain/DNS-, Payment-, Provider- oder Datenbankänderungen nur nach den jeweils dokumentierten Gates

## 5. Multi-Agent-Arbeitsweise

Grundprinzip:

> **Parallel entwickeln, zentral koordinieren, unabhängig prüfen, kontrolliert integrieren.**

Ein großer Produktbereich behält grundsätzlich denselben Cursor-Agenten über mehrere Arbeitsblöcke hinweg, solange Qualität und Kontextkontinuität gegeben sind. Nach jedem Block muss nicht automatisch ein neuer Agent gestartet werden.

Aktuell bekannte exakte Cursor-Anzeigenamen:

- Account Platform: `Account plattform audit vorbereitung`
- Admin Platform: `Admin platform audit`

Die Agenten bleiben fachlich getrennt. Gemeinsame Verträge werden nicht parallel von mehreren Agenten geändert, sondern vom Technical Lead seriell geschnitten.

Pro Arbeitsblock darf ein Agent auf einen neuen Branch/Draft-PR wechseln, ohne seine fachliche Ownership zu verlieren.

## 6. Was nach jedem relevanten Arbeitsschritt gespeichert werden muss

Nach jedem relevanten Meilenstein, Review, Fix, Blocker, Architekturentscheid oder Übergabepunkt wird im Repository aktualisiert:

- Workstream
- exakter Cursor-Anzeigename
- Branch
- PR
- aktueller Runtime-/Docs-Head
- Status: geplant / arbeitet / blockiert / Review / fertig / integriert
- was konkret umgesetzt/geprüft wurde
- neue Findings/Blocker
- Tests/Gates und deren exakter Head
- Security-/DB-/Provider-/Kosten-Auswirkungen
- Dependencies/Shared Contracts
- Product-/Architekturentscheidungen
- exakter nächster Schritt
- ob Mark Ready/Merge weiterhin gesperrt ist

Nicht jeder Chat-Satz muss gespeichert werden. **Jede Information, die ein neuer Chat oder Agent für eine korrekte Fortsetzung braucht, muss gespeichert werden.**

## 7. Review-Regel

Cursor-Screenshots oder Agent-Aussagen sind Hinweise, keine abschließende Wahrheit.

Vor Closure/PASS oder Integrationsentscheidungen prüft der Technical Lead unabhängig, soweit relevant:

- tatsächlichen PR-/Branch-Head
- Diff/Changed Files
- CI auf exakt dem Runtime-Head
- Vercel auf exakt dem Runtime-Head
- Supabase/DB/RLS/Security bei betroffenen Contracts
- Provider-/Secret-/Kosten-Scope
- Guest/Account- und Cross-Domain-Auswirkungen
- vorherige Blocker-Regressionen

Grüne Tests sind Evidence, aber kein automatischer Beweis für fachliche Richtigkeit.

## 8. Aktueller Account/Admin-Schnitt

Verbindliche gemeinsame Entscheidungen stehen in:

`docs/ACCOUNT_ADMIN_SHARED_CONTRACT_DECISIONS.md`

Kurz:

- Account und Admin haben getrennte UX, aber keine doppelte Identity-/Auth-/Privacy-/Billing-/Trip-Truth.
- `Account plattform audit vorbereitung` bleibt der Account-Workstream.
- `Admin platform audit` bleibt der Admin-/Control-Center-Workstream.
- Shared Auth/RLS/Privacy/Billing/Support/Traveller-Verträge werden seriell unter Technical-Lead-Ownership geändert.

## 9. Empfohlener Starttext für einen neuen Chat

> Wir machen mit Jetnity weiter. Lies zuerst `JETNITY_HANDOFF.md`, `docs/ACTIVE_WORK_STATUS.md`, `docs/CHATGPT_TECHNICAL_LEAD_CONTINUITY.md`, `docs/MULTI_AGENT_WORKSTREAMS.md`, `docs/ACCOUNT_ADMIN_SHARED_CONTRACT_DECISIONS.md` und die Handoffs/Reviews der aktuell aktiven PRs. Verifiziere danach den tatsächlichen GitHub-/CI-/Vercel-/Supabase-Stand und übernimm exakt die bisherige Technical-Lead-Rolle: Agenten getrennt koordinieren, Shared Contracts seriell schneiden, Fortschritt dauerhaft im Repo speichern, unabhängig reviewen, kein Mark Ready und kein Merge ohne meine ausdrückliche Freigabe.

## 10. Continuity-Garantie als Prozessregel

Ein neuer Chat darf nicht voraussetzen, dass er private Gedanken oder jede frühere Chatnachricht kennt. Er muss sich den aktuellen Stand aus dem Repository und den realen Systemzuständen rekonstruieren können.

Deshalb ist die Continuity nicht von Chat-Memory abhängig, sondern von dokumentierter, überprüfbarer Projektwahrheit.
