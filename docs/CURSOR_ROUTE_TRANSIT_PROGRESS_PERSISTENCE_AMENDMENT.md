# Foundation D – verbindlicher Progress-Persistence-Nachtrag

Stand: 22. August 2026  
Status: **verbindlicher Nachtrag zum Foundation-D-Auftrag**

Dieser Nachtrag ergänzt `docs/CURSOR_ROUTE_TRANSIT_INTELLIGENCE_TASK.md` und ist gemeinsam mit `docs/PROJECT_PROGRESS_PERSISTENCE_POLICY.md` bindend.

## Harte Regel

Während Foundation D darf kein relevanter Fortschritt nur im Cursor-Agenten, Chat oder lokalen Arbeitskontext verbleiben.

`docs/ACTIVE_WORK_STATUS.md` im Branch ist der kompakte Live-Handoff und muss nach jedem relevanten Meilenstein aktualisiert werden.

Mindestens aktualisieren bei:

- neuer Product-Owner-Entscheidung;
- größerem Implementierungsmeilenstein;
- geändertem Datenmodell / Architektur / Truth-Flow;
- neuem Blocker oder Risiko;
- relevantem Test-/CI-/Preview-Stand;
- Review-Fund oder Review-Fix;
- Pause / Agentenwechsel / Abschlussbericht;
- bevor der Product Owner über Änderungen oder Merge entscheidet.

Die Datei muss aktuell zeigen:

- Branch / PR / verifizierten Arbeitsstand;
- umgesetzt;
- noch offen;
- Tests / CI / Preview;
- DB / RLS / Production-Grenze;
- Kosten / Provider / Secrets;
- Risiken / Review-Funde;
- offene Nutzerfreigaben;
- exakten nächsten Schritt.

## Übergabe

Ein neuer Agent muss zuerst den aktuellen `main`, PR #34, `docs/ACTIVE_WORK_STATUS.md`, den Haupttask, diesen Nachtrag, die Merge-Policy und die Progress-Persistence-Policy lesen, bevor er implementiert.

## Merge

Diese Regel verändert das Product-Owner-Merge-Gate nicht:

> **Kein Merge ohne ausdrückliche aktuelle Nutzerfreigabe.**

Ein technischer Abschlussbericht markiert Foundation D nur als review-bereit.
