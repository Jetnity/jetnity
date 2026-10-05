# Jetnity – Multi-Agent Operating System

Stand: 17. September 2026  
Erweitert: 18. September 2026 – Full-Potential Lanes, Evidence-Bus-Vertrag, Routine-Matrix, Operating-Mode-HOLD  
Status: **PRODUCT-OWNER-VERBINDLICH / GOVERNANCE / ONE-WRITER-MANY-READERS / EVIDENCE-FIRST / LEAST-PRIVILEGE**

## 1. Zweck

Jetnity nutzt mehrere spezialisierte Modelle und Agenten bewusst als **orchestriertes Engineering-System**. Ziel ist nicht, möglichst viele Bots gleichzeitig arbeiten zu lassen, sondern unabhängige Perspektiven mit klarer Autorität, reproduzierbarer Evidence und kontrollierter Übergabe zu kombinieren.

> **Viele Leser, aber nur ein Schreiber pro Branch/Slice.**

> **Cursor baut. Spezialisten prüfen parallel read-only. Grok challengt adversarial. Der ChatGPT / Technical Lead konsolidiert, entscheidet, integriert und mergt. Der Product Owner entscheidet besondere Produkt-/Business-/Production-Gates.**

> **Binding correction, 18. September 2026:** `Jetnity Guardian / Grok` meint die **separate Jetnity-Guardian-App des Product Owners**, niemals einen Cursor-Agenten oder das Cursor-Modell Grok 4.6 High Fast. `@cursor` ist kein Guardian-Trigger.
>
> **Binding correction, 18. September 2026 — activation:** Solange die zehn permanenten Grok-Rollen noch nicht extern eingerichtet sind, gilt für die vorhandene einzelne Guardian-App der One-off-Weg: der Technical Lead liefert bei Bedarf einen ready-to-paste Prompt; der Product Owner startet diesen One-off. Nach einmaliger Product-Owner-Autorisierung der später erforderlichen zehn Rollen und ihrer freigegebenen read-only Routinen braucht ein gewöhnlicher wiederkehrender Lauf **keinen neuen Product-Owner-Prompt**. Besondere Product-Owner-Gates bleiben Product-Owner-kontrolliert. Daily/weekly Automatisierung bleibt no-noise und erzeugt keine Work-/Merge-/Production-Autorität.
>
> **Binding correction, 18. September 2026 — enforcement plane:** Der In-Repo-HOLD-Guard ist fail-closed gegen gewöhnliche unautorisierte Produkt-/Runtime-PRs unter der reviewed Implementation. Er ist nicht tamper-proof gegen einen autorisierten Writer der Enforcement-Fläche. Externe GitHub-Hard-Enforcement für `main` ist ein pflichtiger HOLD-Exit-Punkt und wird von Cursor/Guardian/Grok nicht aktiviert. Ein zweiter logischer Bot auf demselben Account ist keine unabhängige Approval-Grenze. Die Closure-Checkliste `docs/JETNITY_FULL_POTENTIAL_AI_OPERATING_SYSTEM_1_HOLD_EXIT_CHECKLIST_2026-09-18.md` ist die Evidence-Quelle; CI allein beweist die externen Voraussetzungen nicht.

Dieses Dokument ist für alle zukünftigen Technical-Lead-Chats, Cursor-Agenten, Guardian-/Grok-Läufe und weitere Jetnity-Spezialisten verbindlich, sobald es kanonisch in `main` integriert ist.

## 2. Teamstruktur

### 2.1 Product Owner

Verantwortet insbesondere:

- strategische Produkt-/Business-Richtung;
- besondere Product-Owner-Gates;
- Production-/Provider-/Payment-/Vertrags-/Kostenentscheidungen, soweit kanonisch als PO-Gate definiert;
- Prioritätskonflikte zwischen Produktzielen.

Der Product Owner muss nicht für jeden normalen technisch geprüften Merge erneut zustimmen, wenn der Technical Lead ihn als sinnvoll und verantwortbar einstuft. Bestehende besondere Gates bleiben davon unberührt.

Während `.jetnity/operating-mode.json` = `AI_OS_BUILD_HOLD` startet der Technical Lead keine normale Produktarbeit. PR #487 bleibt geparkt. Der Product Owner wird nur an den reservierten Special Gates gefragt.

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

Capability-conditional Cursor-Subagents oder Cloud-Agents dürfen nur verwendet werden, wenn das Cursor-Produkt sie tatsächlich exponiert. Sie bleiben dem Branch-Owner untergeordnet und bilden keine zweite Autoritätskette.

Default:
- Lese-/Research-/Test-Analyse-Subagents sind innerhalb des Parent-Scopes erlaubt;
- ein zweiter Writer ist nur auf einem ausdrücklich getrennten Branch mit disjunkter Datei-/Contract-Ownership und vom Technical Lead definierter Integrationsreihenfolge erlaubt;
- kein Subagent/Child erhält Ready-, Merge- oder Follow-up-Autorität.

Nicht behaupten, eine Cursor-Fähigkeit existiere, wenn sie in der laufenden Session nicht verfügbar ist.

### 2.4 Grok Guardian / Red Team

Grok arbeitet als unabhängige Gegeninstanz gemäß `docs/JETNITY_GROK_BOT_OPERATING_STANDARD.md`.

**Identität:** Der Guardian ist die separate Jetnity-Guardian-App. Er ist kein Cursor-Agent und keine Cursor-Session. Solange die zehn Rollen noch nicht extern eingerichtet sind, erzeugt der Technical Lead bei Bedarf den vollständigen One-off-Guardian-Prompt; der Product Owner startet diesen One-off. Nach einmaliger Product-Owner-Autorisierung der freigegebenen read-only Routinen braucht ein gewöhnlicher wiederkehrender Lauf keinen neuen Product-Owner-Prompt.

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

## 2a. Full-potential reviewer lanes

Der Technical Lead routed Arbeit nach Risiko/Domäne. Nicht jede Lane wird für jeden Slice gestartet.

Jede Lane darf nur Capabilities nutzen, die in der laufenden Session wirklich verfügbar sind. Guardian/Grok bedeutet die separate Product-Owner-Guardian-App, niemals Cursor Grok 4.6 High Fast. Ein Cursor-Spezialist darf eine Lane nur dann füllen, wenn der Technical Lead das ausdrücklich so scoped und die Session die nötige Fähigkeit hat.

These engineering/review lanes stay separate from the ten permanent Grok Intelligence & Assurance roles in `docs/JETNITY_GROK_BOT_OPERATING_STANDARD.md` §13a. They are not required to map 1:1 onto those bots.

| Lane | Trigger | Writer? | Evidence sources | Output contract | Collision | Escalation | Who may fill |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Builder / implementation writer | Versionierter Task + Draft-PR + `@cursor` | **Writer**, genau einer pro Branch | Repo, lokale Tests/CI, Task, Live-GitHub | Code/Docs + Status/Handoff/Self-Review; STOP für TL | Kein zweiter Writer; Subagents nur subordinate | TL bei Scope-Kollision oder Special Gate | Cursor parent only |
| Codebase Explorer | Locate contracts, owners, call sites before or during a slice | Read-only | Repo search, docs, git history | Map + uncertainty; no silent rewrite | Darf nicht schreiben | TL / assigned writer | Cursor read-only subagent if exposed; otherwise parent |
| Architecture & Truth challenger | Shared-contract, Truth-class, Traveller/Route or new architecture | Read-only | Diff, canonical docs, Live SHA/head | Evidence-Bus finding: FACT/INFERENCE/RISK; no rewrite | Darf Writer-Dateien nicht ändern | TL konsolidiert | Guardian/Grok **or** Cursor read-only specialist |
| Security & Privacy review | Auth/RLS/secrets/PII/document/health/model-tool scope | Read-only | Code, policies, logs only if already permitted; no mutation | P0–P3 security/privacy findings + missing evidence | Keine Fixes, keine Secrets | Sofort TL; PO wenn Special Gate | Permanent Grok Red Team preferred; Cursor specialist if Guardian unavailable and documented as Cursor evidence, never labelled Guardian |
| DB / RLS specialist | Schema, migration, grant, RLS, ownership, definer risk | Read-only unless the tasked writer owns that migration slice | Schema/types/migrations; live DB only if already permitted read-only | Boundary/finding; no silent apply | Keine Production-Writes | TL; PO for Production apply | Cursor specialist or later Grok read-only; never Production-admin |
| QA / Regression hunter | Material handoff, CHANGES REQUIRED rehead, accepted-contract risk | Read-only | Tests, diffs vs accepted contracts, CI | Repro + expected/actual + severity | Keine parallelen Fixes | TL Fix-Paket | Guardian/Grok **or** Cursor specialist |
| UX / Accessibility | UX/IA, journey, focus, touch, screenreader, form risk | Read-only | UI/docs, existing audits, browser evidence if available | UX/a11y findings; no invented device tests | Kein autonomer Product-Slice | TL | Guardian/Grok **or** Cursor specialist |
| Performance | Render/request/bundle/N+1/layout-shift risk | Read-only | Code, existing audits, traces if already present | Perf findings; no paid load tests | Keine Runtime-Writes | TL | Guardian/Grok **or** Cursor specialist |
| Cost / Quota | Model/provider/quota/budget/retry/new cost risk | Read-only | Code, kill-switch/quota docs; **no paid calls** | Cost/quota risk; gate if > budget or live activation | Keine paid calls, keine Secrets | TL; PO for cost/provider/live gates | Permanent Grok FinOps preferred or Cursor specialist |
| Release / Continuity | Before PASS/merge, after merge, stale-doc suspicion | Read-only | Exact SHA, CI, Vercel if connected, threads, status/handoff | Exact-head completeness; docs-vs-live contradictions | Keine Ready/Merge | TL owns PASS | Permanent Grok Guardian preferred |
| Documentation / Continuity | Status/handoff/checkpoint drift, missing Evidence-Bus fields | Read-only unless tasked as the slice writer | Repo docs vs live GitHub | Continuity finding or tasked doc fix | Reviewer does not overwrite unless tasked | TL | Cursor writer if tasked; otherwise read-only reviewer |

Gemeinsame Lane-Regeln:
- Output landet im GitHub Evidence Bus, nicht nur in einer Agent-UI.
- Findings sind Input. Nur der Technical Lead setzt das Integrationsverdict.
- Fehlende Evidence bleibt `unknown` / `not checked`.
- Keine Lane erhält Production-, Provider-, Payment- oder Secret-Autorität.

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

Agent-UI-State allein ist niemals Continuity.

### 4.1 Evidence-Bus-Pflichtvertrag

Jeder materiale Agent-/Reviewer-Handoff enthält mindestens:

- exact `main` / base SHA;
- exact branch / head SHA;
- agent logical name + generation;
- available session ID;
- model/capability if known, otherwise `unknown`;
- files / ownership scope;
- verdict or findings with severity;
- evidence actually checked;
- evidence **not** checked;
- CI / Vercel / DB / Production bindings where applicable, otherwise explicitly not checked;
- blocker / gate;
- exact next responsible actor;
- explicit STOP point.

Ein Handoff ohne diese Felder ist unvollständig und darf nicht als Gate-Evidence gelten.

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

## 10. Guardian-Findings → Technical Lead → Cursor

Jetnity Guardian darf seine Findings direkt im PR/Issue posten, soweit die separate Guardian-App dies unterstützt. Er wird jedoch **nicht über Cursor gestartet**.

Der Guardian darf **nicht** selbstständig Cursor-Änderungen starten oder eine zweite Steuerungskette bilden.

Verbindlicher Ablauf:

1. Technical Lead liefert dem Product Owner bei Bedarf einen vollständigen One-off-Guardian-Prompt, solange die zehn-Rollen-Einrichtung noch fehlt.
2. Product Owner startet diesen One-off in der separaten Jetnity-Guardian-App, oder hat die wiederkehrenden read-only Routinen einmalig autorisiert.
3. Guardian postet Evidence/Findings. Gewöhnliche autorisierte Routinen brauchen danach keinen neuen Product-Owner-Start.
4. Technical Lead verifiziert und konsolidiert.
5. Technical Lead gibt Cursor ein einziges verbindliches Fix-Paket.
6. Cursor implementiert.

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

### 11.1 Verbindliche Routine-/Trigger-Matrix

Routinen sind wiederverwendbare Abläufe, keine Chat-Gewohnheiten. Skills/Tools dürfen nur genannt werden, wenn sie in der laufenden Session tatsächlich verbunden sind.

| Routine | Trigger | Owner | Allowed action | STOP |
| --- | --- | --- | --- | --- |
| Startup / live reconstruction | New chat, new agent, after pause | TL, then any agent for itself | Read START_HERE, operating mode, canonical standards, live GitHub/Vercel; Supabase only if scope needs it | Do not dispatch before reconstruction |
| Operating-mode / HOLD check | Before any new dispatch | TL + mechanical `check:operating-mode` | Read `.jetnity/operating-mode.json`; refuse blocked work | HOLD blocks normal product slices |
| Special Product-Owner gate detection | Scope touches reserved gates | TL | Name the exact gate; ask PO before the gated action | No silent crossing |
| Slice precheck + multi-agent suitability | After live reconstruction, before task | TL | File/contract/gate/parallelism check; persist SINGLE_AGENT or MULTI_AGENT | No dispatch without this record |
| Task / branch / Draft-PR / dispatch | Slice selected and allowed by mode | TL writes task; one Cursor writer | Versioned task, one branch, Draft PR, `@cursor` with exact name | Writer: no Ready/merge/follow-up |
| Same-session CHANGES REQUIRED | TL finding on a head | Same logical writer | Head-bound findings; only those fixes | New head invalidates old gates |
| Exact-head review | Material handoff or new head | TL; optional lanes | Independent read of full diff + exact-head CI/Vercel/threads | PASS is TL-only |
| Main-drift / rebase / regate | Behind>0 or base moved | TL decides; same writer if rebase/fix | Reassess merge-base; new exact-head gates | Old CI/Preview is historical |
| High-risk Guardian trigger | Auth/RLS/Truth/DB/cost/release risk | TL prepares one-off prompt while ten-role setup is absent; after one-time PO authorization, approved read-only routines run without a new PO prompt | Read-only challenge report in Evidence Bus | Not a TL PASS; `@cursor` ≠ Guardian |
| Post-merge verification | After TL merge | TL | Exact `main` CI/Production/docs; then next slice only if mode allows | Preview PASS ≠ Production evidence |
| Continuity stale-doc audit | After merge, HOLD, or contradiction | Release/Continuity lane or TL | Report docs-vs-live; TL or tasked writer corrects | Reviewer does not overwrite docs unless tasked |

Während `AI_OS_BUILD_HOLD` dürfen Startup, HOLD-Check, Gate-Detection, Governance-Dispatch und Continuity-Audit laufen. Product-Dispatch-Routinen sind blockiert.

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
