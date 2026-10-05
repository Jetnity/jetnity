# Jetnity – Binding Slice Precheck and Continuity Gate

Stand: 29. August 2026  
Status: **PRODUCT-OWNER-VERBINDLICH / CHATÜBERGREIFEND / FÜR ALLE CHATGPT-TECHNICAL-LEADS UND CODING-AGENTS**

Diese Regel ist eine ausdrückliche Product-Owner-Vorgabe und gilt ab sofort für jeden aktuellen und zukünftigen Jetnity-Chat sowie für alle durch den Technical Lead gesteuerten Coding-/Cursor-Agenten.

Sie ergänzt und verschärft insbesondere:

- `JETNITY_START_HERE.md`
- `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
- `docs/CONTINUITY_STANDARD.md`
- `docs/PROJECT_PROGRESS_PERSISTENCE_POLICY.md`
- `docs/JETNITY_AGENT_WORKSTREAM_GOVERNANCE.md`

Widersprechende ältere Aussagen sind insoweit superseded.

---

## 1. No Slice Before Reconstruction – verbindliches Start-Gate

**Vor jedem neuen Slice muss zuerst der relevante tatsächliche Live-Stand vollständig genug rekonstruiert und verifiziert werden.**

Das gilt:

- bei jedem neuen Chat;
- nach Chatwechsel oder Kontextverlust;
- im selben laufenden Chat vor jedem logisch neuen Slice;
- vor dem Start eines neuen Cursor-/Coding-Agenten;
- nach einem Merge, bevor ein Folgeslice gestartet wird;
- nach einem längeren Parallel-Workstream, wenn sich `main`, Shared Contracts, Production oder Gates verändert haben könnten.

Ein neuer Slice darf **nicht** allein auf Chat-Erinnerung, einem alten Handoff, einem Agenten-Self-Review oder einem früheren Checkpoint gestartet werden.

Mindestens relevant prüfen und gegeneinander abgleichen:

1. aktuellen `main`-SHA und letzte relevante Merges;
2. offene PRs, Drafts, Issues und relevante Remote-Branches;
3. Ahead/Behind/Merge-Base und parallele Workstreams;
4. aktuellen Slice-/Task-/Status-/Handoff-/ADR-Stand;
5. letzte unabhängige Technical-Lead-Verdicts und deren exakten Head-SHA;
6. GitHub Actions / Exact-Head-CI;
7. Vercel Preview/Production, sofern relevant;
8. Supabase / Migration History / RLS / Functions / Grants / Production-Evidence, sofern relevant;
9. Provider-/Commercial-Truth-/Credential-/Contract-/Cost-Gates, sofern relevant;
10. aktuelle Product-Owner-Gates und Binding Build Order;
11. bekannte P0/P1/P2/P3-Risiken und technische Schulden, die den neuen Slice beeinflussen;
12. mögliche Shared-Contract-, Current-State- oder Parallelitätskollisionen.

**Live-Evidence gewinnt immer.** Wenn Dokumentation und Live-Evidence widersprechen, wird nicht geraten: der Widerspruch wird geklärt und die Repository-Dokumentation anschließend korrigiert.

### Harte Regel

> **Kein neuer Slice, bevor der Technical Lead belastbar sagen kann, was bereits gebaut und integriert ist, was nur Draft/Preview ist, was noch offen oder blockiert ist, welche Gates gelten und warum genau dieser nächste Slice jetzt zulässig ist.**

Wenn diese Rekonstruktion einen bereits existierenden oder teilweise gebauten Slice findet, darf kein Duplicate-Slice gestartet werden. Zuerst wird der bestehende Workstream klassifiziert und korrekt fortgeführt, reviewed, geschlossen oder bewusst ersetzt.

---

## 2. No Handoff Without Continuity – verbindliches Abschluss-/Zwischen-Gate

**Kein materieller Jetnity-Fortschritt darf ausschließlich in einem Chat, einer Cursor-Session oder einem nicht versionierten Gedankenstand existieren.**

Nach jeder materiellen Entwicklungs-, Review-, Korrektur-, Merge-, Production- oder Architekturphase muss der Repository-Stand so dokumentiert sein, dass ein anderer Chat oder Technical Lead ohne Rückfrage an den Product Owner exakt übernehmen kann.

Der persistierte Current State muss – soweit für den Workstream relevant – mindestens enthalten:

- was bereits gebaut wurde;
- was tatsächlich in `main` ist;
- was nur auf Branch/Draft/Preview existiert;
- Branch, PR und exakten Head-SHA;
- exakten Cursor-/Agenten-Namen und logische Generation;
- Task, Scope und Non-Scope;
- relevante Shared Contracts / ADRs / Truth-Grenzen;
- letztes unabhängiges Technical-Lead-Verdict und exakten geprüften Head;
- offene `CHANGES REQUIRED`, Blocker und Risiken;
- Exact-Head-CI-/Vercel-Evidence;
- relevante Supabase-/Production-Evidence;
- Provider-/Commercial-/Credential-/Cost-Status;
- besondere Product-Owner-Gates;
- was bewusst nicht gebaut wurde;
- was noch offen ist;
- den **exakt ersten noch nicht erledigten nächsten Schritt**;
- ob ein neuer Slice überhaupt zulässig ist oder zuerst Re-Review/Re-Gating/Post-Merge-Verifikation nötig ist.

### Harte Regel

> **Ein anderer Chat muss aus Repository + Live-Evidence rekonstruieren können: „Was ist fertig? Was ist nicht fertig? Was ist wahr? Was ist nur historische Evidence? Wo genau geht es als Nächstes weiter?“**

Der Product Owner darf nicht gezwungen sein, frühere Entscheidungen, bereits erledigte Arbeit, Agentennamen, offene Findings oder den nächsten Schritt erneut zu erklären.

---

## 3. Definition of Done wird erweitert

Für Jetnity ist ein Slice künftig nur dann sauber abgeschlossen, wenn **beides** erfüllt ist:

1. technische/fachliche Acceptance Criteria und erforderliche Gates sind erfüllt;
2. Continuity-/Handoff-Evidence ist aktuell, korrekt und ausreichend für einen vollständigen Chat-/Agenten-Wechsel.

Fehlt Punkt 2, ist der Slice organisatorisch **nicht vollständig abgeschlossen**, auch wenn Code und Tests grün sind.

Nach jedem Merge gilt zusätzlich:

- neuen `main` live verifizieren;
- Post-Merge-CI prüfen;
- relevante Production-/Supabase-/Vercel-Wahrheit prüfen;
- Current-State-Dokumentation auf den tatsächlichen Post-Merge-Zustand nachziehen;
- **erst danach** den nächsten Slice auswählen oder starten.

---

## 4. Global Current-State Ownership

Bei parallelen Workstreams dürfen Fach-/Provider-/Audit-Agenten ihre eigenen Task-/Status-/Handoff-/Self-Review-/Contract-Dateien pflegen.

Sie dürfen jedoch nicht konkurrierend globale Current-State-Wahrheit übernehmen oder gegenseitig überschreiben.

Insbesondere bleiben folgende Flächen Technical-Lead-gesteuert:

- `JETNITY_START_HERE.md`
- `JETNITY_HANDOFF.md`
- `docs/ACTIVE_WORK_STATUS.md`
- globale Build Order / Programmreihenfolge
- zentrale Shared-Contract-/Truth-/Security-ADRs
- chatübergreifende Current-State-Checkpoints

Parallele Agenten dürfen dort nur arbeiten, wenn der Task dies ausdrücklich verlangt und der Technical Lead die Kollisionsfreiheit vorher verifiziert hat.

Ziel: keine „last writer wins“-Continuity und keine veraltete globale Wahrheit durch provider-/slice-spezifische Branches.

---

## 5. Pflicht für neue Chats

Jeder neue Jetnity-ChatGPT-Chat übernimmt automatisch dieselbe Technical-Lead-Pflicht:

1. zuerst `JETNITY_START_HERE.md` und die dortige Pflichtlektüre lesen;
2. diesen Binding Slice Precheck and Continuity Gate als verbindliche Product-Owner-Regel behandeln;
3. vor dem ersten neuen Slice Live-Rekonstruktion durchführen;
4. bereits existierende Arbeit und offene Reviews zuerst klassifizieren;
5. keinen Duplicate-/Shadow-Slice starten;
6. nach jeder materiellen Arbeit Repository-Continuity aktualisieren;
7. vor Chatwechsel/Context-Limit einen belastbaren versionierten Checkpoint sicherstellen.

„Ich wusste es aus dem vorherigen Chat“ ist keine ausreichende Evidence.

„Der Agent sagt, es sei fertig“ ist keine ausreichende Evidence.

„CI ist grün“ ist keine ausreichende Evidence für Architektur-, Truth-, Security- oder Continuity-PASS.

---

## 6. Pflicht für den aktuellen Technical Lead

Diese Regel gilt ausdrücklich auch für den derzeitigen ChatGPT Technical Lead.

Vor jedem weiteren logisch neuen Jetnity-Slice wird zuerst geprüft, ob sich seit dem letzten Stand relevante Live-Wahrheit, `main`, offene PRs, Shared Contracts, Gates oder Risiken verändert haben.

Der Technical Lead arbeitet autonom innerhalb der bestehenden Governance weiter, aber **Autonomie ersetzt niemals Rekonstruktion, unabhängigen Review oder Continuity**.

---

## 7. Durchsetzung

Ein Verstoß gegen eines dieser beiden Gates ist ein Prozessfehler:

- **PRECHECK MISSING** → neuer Slice darf nicht starten;
- **CONTINUITY INCOMPLETE** → Slice darf nicht als vollständig abgeschlossen/übergeben behandelt werden;
- **CURRENT-STATE COLLISION** → konkurrierende globale Dokumentänderungen müssen vor Merge bereinigt werden;
- **DUPLICATE WORKSTREAM** → neuer Slice stoppen und bestehenden Workstream zuerst klassifizieren.

Diese Gates sind genauso verbindlich wie Exact-Head-Review, Product-Owner-Gates und Merge-Governance.

---

## 8. Product-Owner-Wortlaut / Intent

Verbindlicher Intent vom 29. August 2026:

- Jeder neue Chat und der aktuelle Technical Lead müssen **vor jedem neuen Slice zuerst alles Wichtige überprüfen**, bevor gebaut wird.
- Es muss **alles korrekt dokumentiert** sein, damit jeder andere Chat genau weiß, **was bereits gebaut wurde, wo weitergemacht werden muss und was noch offen ist**.
- Diese Pflicht gilt **für alle Chats und den aktuellen Technical Lead dauerhaft**.

Diese Datei ist die versionierte Repository-Verankerung dieser Vorgabe.