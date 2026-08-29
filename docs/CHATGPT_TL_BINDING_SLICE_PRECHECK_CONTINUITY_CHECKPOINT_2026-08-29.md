# ChatGPT Technical Lead – Binding Slice Precheck / Continuity Checkpoint

Stand: 29. August 2026  
Status: **CURRENT GOVERNANCE CHECKPOINT / PRODUCT-OWNER-VERBINDLICH / CHATÜBERGREIFEND**

## 1. Neue bindende Product-Owner-Regel

Ab diesem Checkpoint gilt für **jeden neuen Jetnity-Chat, jeden fortgesetzten Jetnity-Chat und den aktuellen ChatGPT Technical Lead**:

> **Vor jedem logisch neuen Slice zuerst den relevanten tatsächlichen Live-Stand vollständig genug rekonstruieren und verifizieren. Erst danach darf gebaut werden.**

Und:

> **Nach jeder materiellen Arbeit muss der Repository-Stand so dokumentiert sein, dass ein anderer Chat exakt weiß, was bereits gebaut und integriert ist, was nur Draft/Preview ist, was noch offen oder blockiert ist und was als exakt nächster Schritt folgt.**

Vollständiger bindender Vertrag:

`docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`

Diese Vorgabe ergänzt/verschärft `JETNITY_START_HERE.md`, den Technical-Lead-/Cursor-Operating-Standard und den Continuity-Standard. Widersprechende ältere Workflowaussagen sind insoweit superseded.

## 2. Verbindlicher Start jedes neuen Slices

Vor Start:

- live `main` und relevante Merges prüfen;
- offene PRs/Drafts/Branches/Issues und Parallelität prüfen;
- relevanten Task/Status/Handoff/ADR/Checkpoint lesen;
- frühere TL-Verdicts nur am exakten Head anerkennen;
- CI/Vercel und bei Bedarf Supabase/Production live prüfen;
- Binding Build Order und Product-Owner-Gates prüfen;
- bekannte Risiken/Blocker/Shared-Contract-Kollisionen prüfen;
- feststellen, ob der Slice bereits existiert oder teilweise gebaut wurde;
- Duplicate-/Shadow-Slice verhindern.

Kein neuer Slice nur aus Chat-Erinnerung oder Agenten-Self-Review.

## 3. Verbindlicher Continuity-Stand

Bei jedem materiellen Zwischen-/Endzustand müssen – soweit relevant – versioniert rekonstruierbar sein:

- `main` / Baseline;
- Branch / PR / Exact Head;
- exakter Cursor-Agentenname;
- Task / Scope / Non-Scope;
- gebaut vs. nicht gebaut;
- Preview/Draft vs. `main` vs. Production;
- letztes unabhängiges TL-Verdict + geprüfter Head;
- offene CHANGES REQUIRED / Blocker / Risiken;
- Exact-Head-CI/Vercel;
- relevante Supabase-/Production-/Provider-/Commercial-Evidence;
- Product-Owner-Gates;
- exakt erster noch nicht abgeschlossener nächster Schritt.

Continuity ist Teil der Definition of Done.

## 4. Parallel-Workstream-Regel

Provider-/Fachagenten dokumentieren ihren eigenen Workstream, übernehmen aber nicht konkurrierend globale Current-State-Dateien. Global Current State bleibt Technical-Lead-gesteuert. Dadurch werden last-writer-wins-Fehler und veraltete Handoffs verhindert.

## 5. Aktueller technischer Zustand bei Erstellung dieses Checkpoints

Dieser Checkpoint ist eine Governance-Ergänzung. Er behauptet **keinen** neuen produktiven Feature-/Provider-/Production-Stand.

Vor der nächsten produktiven Slice-Entscheidung muss gemäß dieser neuen Regel der dann aktuelle Live-Stand erneut geprüft werden. Insbesondere dürfen offene Provider-Core-/HBX-/Viator-/12Go-Workstreams nicht aus diesem Checkpoint heraus als unverändert oder abgeschlossen angenommen werden.

## 6. Übergabe an jeden neuen Chat

Ein neuer Chat muss diese Regel nicht vom Product Owner erneut erklärt bekommen.

Wenn der neue Chat feststellt, dass die operative Dokumentation nicht ausreicht, darf er nicht einfach einen neuen Slice starten. Er muss zuerst die fehlende Live-Rekonstruktion/Continuity korrigieren.

**Exakter erster Schritt für einen neuen Chat:** `JETNITY_START_HERE.md` lesen, Technical-Lead-Operating-Standard lesen, diesen Governance-Checkpoint und den Binding Slice Precheck/Continuity Gate anwenden, danach Live-Evidence rekonstruieren und erst dann einen neuen Slice bestimmen.