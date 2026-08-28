# Jetnity – Product-Owner Freigabenachweis Technical-Lead-Autonomie

Stand: 25. August 2026; Banner 28. August 2026  
Status: **HISTORICAL / SUPERSEDED für Ready-/Merge. Der Body bleibt Evidence des 25.-August-Stands und wird nicht kosmetisch umgeschrieben.**

> Current Truth: `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`.  
> Nur ChatGPT / Technical Lead darf Ready setzen oder mergen. Cursor-Agenten tun das niemals.  
> Die 25.-August-Aussage „Ready-/Merge-Autonomie ist nicht mehr gültig“ und die per-PR-Product-Owner-Merge-Pflicht sind durch die späteren Entscheidungen vom 26. und 28. August 2026 superseded. Besondere Product-Owner-Gates bleiben.

## 1. Historischer Freigabestand

Der Product Owner hatte am 25. August 2026 eine weitgehende Technical-Lead-Autonomie freigegeben. Dazu gehörte in dieser Datei ursprünglich auch die Aussage, normale scope-treue Entwicklungs-PRs nach Technical Closure ohne erneute Product-Owner-Freigabe Ready zu setzen und selbst nach `main` zu mergen.

Diese Ready-/Merge-Erweiterung ist durch eine **spätere ausdrückliche Product-Owner-Entscheidung** wieder eingeschränkt worden.

Die aktuelle verbindliche Regel steht in:

- `docs/MERGE_GOVERNANCE_SUPERSESSION_2026-08-25.md`;
- `docs/PRODUCT_OWNER_MERGE_APPROVAL_POLICY.md`;
- `docs/CHATGPT_CURSOR_WORKFLOW.md`;
- der entsprechend korrigierten `docs/JETNITY_TECHNICAL_LEAD_AUTONOMY_POLICY.md`.

## 2. Was weiterhin freigegeben bleibt

ChatGPT / Technical Lead darf weiterhin weitgehend selbstständig:

- Branches und Draft-PRs anlegen;
- Aufgaben, Status, Reviews, ADRs, Handoffs und Checkpoints versionieren;
- Cursor-Agenten innerhalb klarer Workstream-/Scope-Grenzen steuern;
- Tests, Refactorings, Bugfixes, Security-Härtungen und normale Engineering-Arbeit innerhalb des angenommenen Produktplans durchführen lassen;
- Development-only Migrationen/Arbeit innerhalb der dokumentierten Grenzen steuern;
- Exact-Head-Gates, CI/Vercel und unabhängige Reviews durchführen;
- technische `PASS`-/`CHANGES REQUIRED`-/`review-bereit`-Entscheidungen treffen;
- den nächsten bereits verbindlich geplanten Slice vorbereiten, solange kein ungeprüfter Runtime-Start oder besonderes Gate dadurch ausgelöst wird.

## 3. Was nicht mehr autonom freigegeben ist

Ohne ausdrückliche aktuelle Product-Owner-Freigabe für den konkret besprochenen PR darf ChatGPT / Technical Lead nicht:

- den PR formal `Ready for review` setzen, sofern der Product Owner im konkreten Fall nichts anderes bestimmt;
- den PR nach `main` mergen.

Technischer PASS, grüne CI, Vercel READY, `mergeable=true`, fehlende Review-Threads oder eine frühere allgemeine Autonomie sind keine Merge-Freigabe.

## 4. Besondere Gates bleiben zusätzlich bestehen

Unverändert Product-Owner-pflichtig bleiben insbesondere Production-Datenbank/destructive Daten, echte Provider/Secrets/Verträge/paid calls, Kosten über USD 100/Monat, große Produkt-/Geschäftsmodell-/Build-Order-Änderungen, besonders sensible Identitätsdaten, fundamentale Auth-/Session-Grenzen sowie öffentliche/produktive Aktivierungen.

Eine Merge-Freigabe ersetzt keine dieser separaten Freigaben.

## 5. Historische Einordnung

Diese Datei bleibt erhalten, damit der frühere Autonomie-Entscheid nachvollziehbar bleibt. **Die frühere Passage zur autonomen Ready-/Merge-Freigabe darf ab diesem Stand nicht mehr als aktuelle Product-Owner-Erlaubnis verwendet werden.**

Merksatz:

> **Autonomie bis zur technischen Review-Reife; Ready/Merge nur nach aktueller Product-Owner-Freigabe.**
