# Jetnity – Visible Cursor Agent Name Discipline

Stand: 28. August 2026  
Status: **Product-Owner-verbindliche Continuity-/Agentenregel; sichtbar exakter Name ist Best Effort und niemals Arbeitsblocker**

## Zweck

Der logisch vom Technical Lead vergebene Cursor-Agentenname muss in Task, Status, Handoff, Self-Review und PR-Kommunikation eindeutig und konsistent bleiben. Der tatsächlich sichtbare Cursor-Agent-/Session-Name **soll** möglichst exakt diesem Namen entsprechen, darf die fachliche Arbeit aber nicht blockieren.

Diese Fassung superseded die frühere strengere Regel desselben Tages, nach der ein nicht umbenennbarer sichtbarer Cursor-Titel vor materieller Arbeit zum STOPP führte. Die ausdrückliche Product-Owner-Entscheidung vom 28. August 2026 lautet: Benennung weiter sorgfältig versuchen, aber bei technisch nicht möglicher exakter UI-Benennung normal weiterarbeiten.

## Verbindliche Regel

1. Vor jedem neuen Cursor-Agentenstart vergibt der Technical Lead einen **exakten logischen Anzeigenamen**.
2. Dieser exakte Name wird klar und dominant im Cursor-Startauftrag genannt.
3. Wenn der Cursor-Startpfad oder die Session eine unterstützte Rename-/Title-Fähigkeit anbietet, soll der Agent sie verwenden und den sichtbaren Namen möglichst exakt setzen.
4. Fehlt eine unterstützte Rename-/Title-Fähigkeit oder erzeugt Cursor trotz korrektem Auftrag einen anderen sichtbaren Titel, ist das **kein Arbeits-, Review- oder Merge-Blocker**.
5. Der Agent arbeitet in diesem Fall unter derselben logischen Generation weiter; es wird wegen eines reinen UI-Titel-Unterschieds keine künstliche neue Generation erzeugt.
6. Task, Status, Handoff, Self-Review und PR-Kommunikation verwenden weiterhin den vom Technical Lead vergebenen exakten logischen Namen, damit die Repository-Continuity eindeutig bleibt.
7. Bei unmittelbaren Review-Fixes desselben Slices bleibt derselbe logische Agentenname erhalten.
8. Cursor-Agenten und Technical Lead dürfen niemals behaupten, der sichtbare UI-Titel sei erfolgreich umbenannt worden, wenn dafür keine Evidence vorliegt.
9. Sichtbare Namensabweichungen dürfen dokumentiert werden, benötigen aber allein keine `CHANGES REQUIRED`, keinen Neustart und keinen STOPP.

## Evidence

Wenn ohne Zusatzaufwand verfügbar, darf der tatsächliche sichtbare Titel aus folgenden Quellen dokumentiert werden:

- Cursor-App-/Session-Evidence,
- Cursor-Agent-Link/Run-Evidence mit Titel,
- andere direkt verfügbare Cursor-UI-Evidence.

Repository-/PR-Evidence bleibt die kanonische Quelle für **logischen Agentennamen, Generation, Slice und Session-Zuordnung**. Eine sichtbare Cursor-Titel-Abweichung ändert diese Zuordnung nicht.

## Continuity

Neue Chats und Agents sollen weiterhin versuchen, den sichtbaren Cursor-Namen passend zu setzen. Wenn Cursor das nicht unterstützt oder anders benennt, wird ohne unnötige Unterbrechung weitergearbeitet. Qualität, Scope, Security, Truth, unabhängiger Review und Exact-Head-Gates haben Vorrang vor kosmetischer Session-Benennung.
