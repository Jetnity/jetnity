# Jetnity – Multi-Agent Operating System

Stand: 17. September 2026  
Status: **PRODUCT-OWNER-VERBINDLICH / GOVERNANCE / ONE-WRITER-MANY-READERS / EVIDENCE-FIRST / LEAST-PRIVILEGE**

## 1. Zweck

Jetnity nutzt mehrere spezialisierte Modelle und Agenten bewusst als **orchestriertes Engineering-System**. Ziel ist nicht, möglichst viele Bots gleichzeitig arbeiten zu lassen, sondern unabhängige Perspektiven mit klarer Autorität, reproduzierbarer Evidence und kontrollierter Übergabe zu kombinieren.

> **Viele Leser, aber nur ein Schreiber pro Branch/Slice.**

> **Cursor baut. Spezialisten prüfen parallel read-only. Grok challengt adversarial. Der ChatGPT / Technical Lead konsolidiert, entscheidet, integriert und mergt. Der Product Owner entscheidet besondere Produkt-/Business-/Production-Gates.**

Dieses Dokument ist für alle zukünftigen Technical-Lead-Chats, Cursor-Agenten, Guardian-/Grok-Läufe und weitere Jetnity-Spezialisten verbindlich, sobald es kanonisch in `main` integriert ist.

## 2. Teamstruktur

### 2.1 Product Owner

Verantwortet insbesondere:

- strategische Produkt-/Business-Richtung;
- besondere Product-Owner-Gates;
- Production-/Provider-/Payment-/Vertrags-/Kostenentscheidungen, soweit kanonisch als PO-Gate definiert;
- Prioritätskonflikte zwischen Produktzielen.

Der Product Owner muss nicht für jeden normalen technisch geprüften Merge erneut zustimmen, wenn der Technical Lead ihn als sinnvoll und verantwortbar einstuft. Bestehende besondere Gates bleiben davon unberührt.

### 2.2 ChatGPT / Technical Lead / Orchestrator

Der Technical Lead besitzt die Engineering-Entscheidungsgewalt über:

- Architektur und Product Engineering;
- Truth-, Security-, Privacy-, Auth-, RLS-, Provider- und Commercial-Grenzen;
- Agentenwahl und Agentenaufträge;
- Scope und Slice-Grenzen;
- Konsolidierung von Findings;
- Review-Verdicts (`PASS`, `CHANGES REQUIRED`, `BLOCKED`, `NO-GO`);
- Ready/Merge/Integration;
- Post-Merge-Verifikation und Continuity.

Er darf Spezialisten parallel einsetzen, aber niemals mehrere unabhängige Writer denselben Branch verändern lassen.

### 2.3 Cursor Builder Agents

Cursor ist der primäre Implementierungs-Writer.

Verbindlich:

- genau **ein Writer pro Branch/Slice**;
- branch-/PR-bound;
- Task, Scope, Modell/Generation und Session werden persistiert;
- kein autonomes Ready;
- kein autonomes Merge;
- kein autonomer Follow-up-Slice;
- CHANGES REQUIRED geht bevorzugt an dieselbe logische Session;
- jeder neue Head invalidiert ältere Exact-Head-Gates;
- vor Handoff vollständige Tests/Evidence/Docs.

### 2.4 Grok Guardian / Red Team

Grok arbeitet als unabhängige Gegeninstanz gemäß `docs/JETNITY_GROK_BOT_OPERATING_STANDARD.md`.

Kernaufgaben:

- adversarial QA;
- Architecture Challenger;
- Product Challenger;
- Release Guardian;
- Regression Hunter;
- Continuity Auditor;
- Security & Privacy Red Team;
- Performance / Accessibility / UX Watch;
- Cost Guardian;
- Product Opportunity Radar;
- Whole-Jetnity Audits nach relevanten Meilensteinen.

Grok darf Findings direkt in GitHub PRs/Issues schreiben, soweit seine GitHub-Rechte dies zulassen. Diese Findings sind Evidence und Challenge-Input, **keine** Engineering-Entscheidung.

### 2.5 Security / Privacy Specialist

Bei risikorelevantem Scope kann ein zusätzlicher unabhängiger Spezialist gezielt prüfen:

- Auth / Sessions / MFA / AAL;
- RLS / Grants / Ownership / Definer / Service Role;
- IDOR-/Account-Isolation-Pfade;
- Secrets / Environment / Logs / Telemetry;
- Prompt Injection / Tool Boundaries / untrusted model output;
- Pass-/Dokument-/MRZ-/Biometrie-/Gesundheitsdaten;
- Datenminimierung und fail-closed Verhalten.

Standardmodus: read-only.

### 2.6 UX / Accessibility / Performance Auditor

Prüft gezielt:

- Mobile/Desktop-Kohärenz;
- Touch, Keyboard, Screenreader, Fokus, Dialoge, Forms;
- Lade-, Empty-, Error- und Recovery-States;
- Rendering, Requests, N+1, doppelte Fetches;
- Bundle-/Client-Last;
- Layout Shifts und regressionsanfällige Responsive-Pfade.

Standardmodus: read-only.

### 2.7 Product / Market Scout

Prüft unabhängig:

- relevante Wettbewerber und Produktmuster;
- Marktchancen und Produktlücken;
- Monetarisierung, Retention und Trust;
- neue Travel-Technologien;
- sinnvolle Vereinfachungen und Differenzierungsoptionen.

Öffentliche Markt-/Produkt-Evidence ist zulässig. Kein autonomer Product-Slice.

### 2.8 Truth / Research Specialist

Prüft externe Wahrheitsebenen wie:

- Einreise / Visa / Transit;
- Safety / Seasonal;
- Provider-/Commercial-Evidence;
- sonstige externe Reiseinformationen.

Er liefert Evidence; er darf ungeprüfte externe Aussagen niemals als Jetnity-Produktwahrheit etablieren.

### 2.9 Cost / Observability Guardian

Prüft:

- Modell-/API-Kosten;
- Supabase / Vercel / Storage / Bandwidth;
- Provider-Kosten;
- Rate Limits / Quotas / Retry-Verhalten;
- doppelte oder unnötige Calls;
- fehlende Reservierung / Kill-Switch / Budget-Controls;
- Kostenwachstum relativ zum Nutzerwert.

Keine paid calls aus eigener Autorität.

### 2.10 Release / Continuity Auditor

Prüft insbesondere:

- Exact SHA;
- `main` / Head / Merge-Base / ahead / behind;
- CI / Actions;
- Vercel-/Deployment-Evidence;
- offene Review-/Feedback-Threads;
- Docs-vs-Live-Widersprüche;
- Handoff-/Task-/Status-Kohärenz;
- Regressionen;
- Post-Merge-Verification.

## 3. Standard-Workflow

Für material relevante Slices gilt grundsätzlich:

1. Technical Lead rekonstruiert Live-Truth und definiert kleinsten verantwortbaren Slice.
2. Genau ein Cursor-Builder erhält Schreibverantwortung für Branch/PR.
3. Nach materiellem Handoff können mehrere unabhängige Spezialisten parallel **read-only** prüfen.
4. Grok versucht zusätzlich bewusst, Annahmen und Implementierung zu widerlegen.
5. Findings landen standardisiert im gemeinsamen Evidence-Bus, bevorzugt GitHub PR/Issue.
6. Technical Lead dedupliziert, prüft Widersprüche und verwirft falsche Findings.
7. Technical Lead erzeugt **ein einziges konsolidiertes Fix-Paket**.
8. Derselbe zuständige Writer implementiert das Fix-Paket.
9. Neuer Head => alle früheren Exact-Head-Gates sind historisch.
10. Gezielte Re-Reviews laufen auf dem neuen exakten Head.
11. Technical Lead gibt finalen PASS oder fordert weitere Änderungen.
12. Merge nur durch den Technical Lead bzw. in der kanonisch erlaubten Autoritätskette.
13. Post-Merge-Verifikation auf exaktem `main`.

## 4. GitHub als gemeinsamer Evidence-Bus

GitHub ist der bevorzugte persistente Übergabekanal zwischen Technical Lead, Cursor, Grok und Spezialisten.

Geeignete Surfaces:

- PR Conversation Comments;
- Inline Review Threads;
- Review Submissions;
- Issues für längerlebige Cross-Slice-Risiken/Opportunities;
- versionierte Docs/ADR/Status/Handoff-Evidence.

Vorteile:

- nicht an einen Chat gebunden;
- für zukünftige Chats rekonstruierbar;
- exact-head-fähig;
- Cursor und Technical Lead sehen dieselbe Evidence;
- widersprüchliche Findings bleiben nachvollziehbar;
- keine stillen Agentenentscheidungen.

Externe Bots dürfen Ergebnisse nicht nur in eigener UI behalten, wenn sie für einen Merge-/Release-/Security-Verdict relevant sind.

## 5. Standardformat für Bot-/Specialist-Findings

Jedes material Finding soll mindestens enthalten:

- **Exact SHA**;
- **Severity:** `P0`, `P1`, `P2` oder `P3`;
- **Bereich:** z. B. Security, Truth, Product, UX, Performance, Cost, Continuity;
- **konkrete Evidence**;
- **Reproduktion / Prüfweg**;
- **erwartetes Verhalten**;
- **tatsächliches Verhalten**;
- **Risiko / Impact**;
- **vorgeschlagene Lösung oder Richtung**;
- **Confidence**;
- bei Out-of-Scope: Kennzeichnung `OUT-OF-SCOPE RISK` oder `OUT-OF-SCOPE OPPORTUNITY`.

Ein Finding ohne prüfbare Evidence ist Hinweis, kein verbindlicher Defekt.

## 6. Severity-Konvention

- **P0** — unmittelbarer schwerer Security-/Privacy-/Datenverlust-/Production-Incident oder vergleichbar kritisches Risiko; Merge/Release stoppt.
- **P1** — materialer Wahrheits-, Security-, Architektur-, Datenintegritäts- oder Produktvertragsbruch; vor PASS zu beheben oder explizit gated zu entscheiden.
- **P2** — relevante Qualitäts-/UX-/Performance-/Maintainability-Regression ohne P1-Impact; normalerweise vor Merge beheben, sofern nicht bewusst deferred.
- **P3** — Verbesserung/Polish/geringes Risiko; darf dokumentiert deferred werden.

Der Technical Lead bestimmt die finale Severity nach eigener Prüfung.

## 7. Modell-Diversität

Jetnity soll bei kritischen Reviews bewusst unabhängige Modellfamilien nutzen, wenn praktisch möglich.

Beispiel:

- Cursor/Claude implementiert;
- Grok challengt;
- GPT-5.6 Sol / Technical Lead prüft und entscheidet;
- bei besonders kritischen Security-/Truth-/DB-Slices kann ein weiterer unabhängiger Reviewer denselben Scope separat untersuchen.

Ziel ist nicht Abstimmung per Mehrheitsvotum, sondern die Reduktion gemeinsamer blinder Flecken.

Widersprechende Modellevidenz wird vom Technical Lead aufgelöst; kein Modell erhält allein durch Anzahl oder Confidence Entscheidungsautorität.

## 8. One-Writer-Regel

Harte Regel:

> **Kein paralleles Multi-Writer-Arbeiten auf demselben Branch/Slice.**

Mehrere Reviewer dürfen denselben Code parallel lesen und angreifen. Nur der zuständige Builder schreibt.

Ausnahmen brauchen eine explizite, versionierte Technical-Lead-Entscheidung mit getrennten Branches und klarer Integrationsstrategie.

## 9. Least Privilege

Jeder Spezialist erhält nur die minimal nötigen Fähigkeiten.

Typischer Guardian-/Reviewer-Scope:

- Repository / Code / Commits / Branches: read-only;
- Actions / Status / Deployments: read-only;
- Issues / PRs: read-only oder nur Comments/Reviews write, wenn benötigt;
- Vercel / Supabase: read-only, nur wenn verbunden und erforderlich;
- keine Secrets;
- keine Branch-/Code-Writes;
- keine Merge-/Production-Rechte;
- keine paid calls;
- keine Provider-/Payment-Aktivierung.

## 10. Direkte Grok→Cursor-Übergabe

Grok darf seine Findings direkt im PR posten, sodass Cursor und Technical Lead sie sehen.

Grok darf **nicht** selbstständig Cursor-Änderungen starten oder eine zweite Steuerungskette bilden.

Verbindlicher Ablauf:

1. Grok postet Evidence/Findings.
2. Technical Lead verifiziert und konsolidiert.
3. Technical Lead gibt Cursor ein einziges verbindliches Fix-Paket.
4. Cursor implementiert.

Dies verhindert doppelte Arbeit, widersprüchliche Änderungen und sich gegenseitig übersteuernde Agenten.

## 11. Automatisierung und Trigger

Automatisierung darf schrittweise eingeführt werden, solange Autorität und Least Privilege erhalten bleiben.

Sinnvolle zukünftige Trigger:

- materialer Cursor-Handoff;
- neuer PR-Head nach CHANGES REQUIRED;
- Security-/Truth-/DB-/Auth-relevanter Diff;
- Ready-/Merge-Kandidat;
- Main-Drift;
- fehlgeschlagene CI/Vercel-Gates;
- Post-Merge-Checkpoint;
- größere Produkt-/Architektur-Meilensteine.

Automatisierte Reviewer dürfen Findings erzeugen, aber keine selbstständige Umsetzung, Merge- oder Production-Aktion starten.

## 12. Whole-Jetnity Audits

Nach größeren Meilensteinen soll der Technical Lead einen repo-weiten Multi-Agent-Audit erwägen.

Mindestens prüfbare Dimensionen:

- Architektur;
- Product Gaps;
- Security / Privacy;
- Truth Architecture;
- Provider / Commercial;
- Performance / Accessibility / UX;
- Cost Exposure;
- Technical Debt / Duplication;
- Release / Continuity;
- Opportunity Radar.

Ergebnis: Findings/Empfehlungen, keine automatische Folgeimplementierung.

## 13. Harte Verbote für Reviewer/Guardians

Ohne separat versionierte Autorisierung dürfen Reviewer/Guardians niemals:

- Code/Branches schreiben;
- Ready setzen;
- mergen;
- Production deployen;
- Production-Supabase mutieren;
- Secrets erzeugen/ändern/offenlegen;
- paid calls starten;
- Provider/Payments aktivieren;
- Verträge/Terms/DPA akzeptieren;
- Public Launch/Domain/Indexing/Store-Live auslösen;
- autonome Follow-up-Slices starten.

## 14. Continuity für zukünftige Chats

Zukünftige Technical-Lead-Chats sollen diese Multi-Agent-Governance automatisch übernehmen und nicht auf eine erneute Erklärung des Product Owners warten.

Beim Startup gilt nach Integration in `main`:

1. `JETNITY_START_HERE.md`;
2. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`;
3. `docs/JETNITY_MULTI_AGENT_OPERATING_SYSTEM.md`;
4. `docs/JETNITY_GROK_BOT_OPERATING_STANDARD.md`;
5. aktueller Handoff / `ACTIVE_WORK_STATUS` / Live-Evidence.

Chat-Erinnerung ist nicht Source of Truth. Repository-Evidence gewinnt.

## 15. Binding Product-Owner Direction

Product Owner hat am 17. September 2026 verbindlich festgelegt:

- Jetnity soll das Potenzial eines professionellen Multi-Agent-Teams maximal nutzen;
- Grok soll für die im Guardian-Standard genannten erweiterten Aufgaben eingesetzt werden;
- zusätzliche spezialisierte Reviewer dürfen genutzt werden;
- zukünftige Chats sollen diese Arbeitsweise automatisch kennen;
- der Technical Lead darf normale sauber geprüfte PRs ohne erneute Einzel-Merge-Freigabe integrieren, wenn dies sinnvoll und verantwortbar ist;
- besondere Product-/Business-/Production-Gates bleiben bestehen.

Diese Richtung ist dauerhaft, bis der Product Owner sie ausdrücklich ändert.
