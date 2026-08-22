# Jetnity – Product Owner Merge Approval Policy

Stand: 22. August 2026  
Status: **dauerhaft verbindlich für ChatGPT, Cursor und alle anderen Coding Agents**

## 1. Harte Grundregel

**Kein Pull Request wird ohne ausdrückliche Freigabe des Product Owners / Nutzers gemergt.**

Ein grüner Build, vollständige Tests, erfolgreiche CI, ein READY Preview, ein positives Human-/Architecture-Review oder die Aussage eines Agents, dass eine Phase „fertig“ sei, sind **keine Merge-Freigabe**.

Nur eine eindeutige aktuelle Nutzerentscheidung wie beispielsweise **„freigegeben“, „du kannst mergen“ oder „merge jetzt“** erlaubt den Merge des konkret besprochenen PRs.

Schweigen, frühere allgemeine Entwicklungsfreigaben, Budgetfreigaben, ein früheres „du kannst selbstständig arbeiten“ oder technische Mergeability dürfen niemals als Merge-Freigabe interpretiert werden.

## 2. Verbindlicher Ablauf vor jedem Merge

Für größere Jetnity-Arbeiten gilt standardmäßig:

1. Cursor / Coding Agent implementiert den dokumentierten Auftrag im Feature-Branch.
2. Der PR bleibt während der Implementierung und technischen Prüfung **Draft**.
3. Cursor liefert vollständige Tests, Audits, CI-/Preview-Nachweise, offene Risiken und Abschlussbericht.
4. ChatGPT prüft den tatsächlichen Branch-/PR-/CI-/Preview-/DB-/Production-Stand unabhängig.
5. ChatGPT erklärt dem Product Owner verständlich, was der Besucher neu bekommt, wo es auf der Website sichtbar ist, welche Grenzen noch bestehen und welche Risiken/offenen Punkte verbleiben.
6. **Der Product Owner erhält ausdrücklich Gelegenheit, Änderungen oder Ergänzungen zu verlangen.**
7. Erst nach einer eindeutigen Freigabe des Product Owners darf der konkret freigegebene PR auf Ready gesetzt bzw. gemergt werden, soweit dies für den Workflow nötig ist.
8. Nach dem Merge werden Production-Schritte nur ausgeführt, wenn sie ebenfalls durch die jeweils geltenden Production-/Kostenregeln freigegeben sind.

## 3. Nutzeränderungen vor Abschluss

Wenn der Product Owner vor dem Merge Änderungen wünscht:

- nicht mergen;
- Entscheidung versioniert im aktuellen Branch als Task-Amendment, ADR oder relevante Fachdokumentation sichern;
- bestehenden validen Code weiterverwenden und gezielt anpassen;
- Tests/CI/Preview nach der Änderung erneut ausführen;
- erneut durch ChatGPT prüfen;
- anschließend wieder auf ausdrückliche Merge-Freigabe warten.

Eine Phase darf deshalb technisch „review-ready“ sein, ist aber aus Produktsicht **noch nicht abgeschlossen**, solange der Product Owner den Merge nicht ausdrücklich freigegeben hat.

## 4. Kein implizites Auto-Merge

Verboten sind insbesondere:

- Auto-Merge aufgrund grüner CI;
- Merge direkt nach einem Cursor-Abschlussbericht;
- Merge direkt nach einem positiven ChatGPT-Review;
- Merge, weil der PR `mergeable=true` ist;
- Merge, weil keine offenen technischen Blocker gefunden wurden;
- Merge aufgrund einer Freigabe für einen anderen PR oder eine frühere Phase.

Die Freigabe ist **PR-/Arbeitsblock-spezifisch**.

## 5. Trennung Merge / Production / Kosten

Eine Merge-Freigabe bedeutet nicht automatisch:

- Production-Migration freigegeben;
- Provider-Aktivierung freigegeben;
- neue Secrets freigegeben;
- kostenpflichtiger Vertrag freigegeben;
- neue laufende Kosten freigegeben.

Diese Schritte folgen ihren eigenen dokumentierten Freigabegrenzen.

## 6. Pflicht für neue Chats und Agents

Neue ChatGPT-Chats und neue Cursor/Coding Agents müssen diese Policy vor Merge-/Abschlussentscheidungen kennen und anwenden.

Sie ergänzt verbindlich:

- `docs/CHATGPT_CURSOR_WORKFLOW.md`
- `docs/CONTINUITY_STANDARD.md`
- `AGENTS.md`
- aktuelle `docs/CURSOR_..._TASK.md`
- `JETNITY_HANDOFF.md`

Bei Widerspruch mit älteren Aufgaben oder Dokumenten hat diese neuere ausdrückliche Product-Owner-Regel Vorrang, sofern keine noch neuere ausdrückliche Nutzerentscheidung sie ersetzt.

## 7. Merksatz

> **Technisch fertig bedeutet review-bereit. Gemergt wird erst nach ausdrücklicher Freigabe des Product Owners.**
