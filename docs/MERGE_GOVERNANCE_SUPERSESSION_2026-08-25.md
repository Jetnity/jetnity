# Jetnity – Merge-Governance-Supersession

Stand: 25. August 2026  
Status: **HISTORICAL / SUPERSEDED für normale Ready-/Merge-Entscheidungen durch `docs/TECHNICAL_LEAD_MERGE_AUTONOMY_SUPERSESSION_2026-08-26.md`. Die besonderen Production-/Kosten-/Provider-/Sensitive-Data-Gates bleiben. Nicht löschen.**

> Diese Datei ist Evidence der Product-Owner-Entscheidung vom 25. August 2026. Am 26. August 2026 wurde die Merge-Autonomie wieder erweitert und zugleich durch strenge unabhängige Pflichtprüfung begrenzt.

## 1. Verbindliche Entscheidung

Für Jetnity gilt ab sofort und dauerhaft wieder eindeutig:

> **Kein Pull Request wird ohne ausdrückliche aktuelle Freigabe des Product Owners / Nutzers gemergt.**

Technische Fertigstellung, ein unabhängiger Technical-Lead-PASS, grüne Tests, erfolgreiche Exact-Head-CI, ein READY-Vercel-Preview, `mergeable=true`, fehlende Review-Threads oder eine frühere allgemeine Autonomie-/Budgetfreigabe sind **keine Merge-Freigabe**.

Der Product Owner muss vor dem Merge des konkret besprochenen PRs ausdrücklich Gelegenheit erhalten, Änderungen oder Ergänzungen zu verlangen.

Eine gültige Merge-Freigabe muss aktuell und eindeutig sein, zum Beispiel:

- `freigegeben`;
- `du kannst mergen`;
- `merge jetzt`;
- eine inhaltlich gleich eindeutige aktuelle Aussage zum konkret besprochenen PR.

Schweigen, ein allgemeines `ok`, ein technischer Abschlussbericht oder eine Freigabe eines anderen PRs reichen nicht.

## 2. Ready-Grenze

Pull Requests bleiben während Implementierung, Self-Review und unabhängigem Technical-Lead-Review grundsätzlich Draft.

Ein PR darf als technisch **review-bereit** bezeichnet werden, ohne dass dies eine Produktfreigabe bedeutet.

Das formale GitHub-`Ready for review` und der Merge erfolgen erst nach der ausdrücklichen Product-Owner-Freigabe, sofern der Product Owner nicht im konkreten Fall ausdrücklich etwas anderes bestimmt.

## 3. Technical-Lead-Autonomie bleibt groß – aber endet vor Ready/Merge

ChatGPT / Technical Lead darf weiterhin ohne zusätzliche Freigabe innerhalb des bestehenden Produktplans:

- Repository-, PR-, CI-, Vercel- und relevante Supabase-Stände live prüfen;
- Branches und Draft-PRs anlegen;
- Aufgaben, Status, ADRs, Reviews, Handoffs und Checkpoints versionieren;
- Cursor-Agenten in freigegebenen Workstreams mit klaren Scope-/Non-Scope-Grenzen steuern;
- Implementierungen, Refactorings, Bugfixes, Security-Härtungen, UX-/Architekturverbesserungen und Tests innerhalb bestehender Verträge durchführen lassen;
- Development-only Arbeit ausführen, sofern keine Production-/Shared-/Kosten-Gates verletzt werden;
- unabhängige Technical-Lead-Reviews durchführen;
- technische PASS-/CHANGES-REQUIRED-Entscheidungen treffen;
- einen technisch fertigen PR dem Product Owner mit Nutzerwirkung, Risiken, offenen Punkten und Evidence zur Freigabe vorlegen;
- nach einer gültigen Merge-Freigabe den konkret freigegebenen PR technisch Ready setzen und mergen, sofern die Exact-Head-/Integrationsbedingungen weiterhin erfüllt sind.

Die Autonomie soll weiterhin Geschwindigkeit und professionelle Steuerung ermöglichen. Sie darf aber nicht die Product-Owner-Entscheidung über den finalen Merge ersetzen.

## 4. Vorrang / Supersession

Diese Entscheidung bestätigt und verstärkt:

- `docs/PRODUCT_OWNER_MERGE_APPROVAL_POLICY.md`;
- `docs/CHATGPT_CURSOR_WORKFLOW.md`.

Sie **superseded ausschließlich hinsichtlich Ready-/Merge-Autonomie** alle neueren oder älteren Formulierungen, die ChatGPT / Technical Lead erlauben, einen normalen PR ohne aktuelle Product-Owner-Freigabe selbst Ready zu setzen oder nach `main` zu mergen.

Insbesondere sind entsprechende Merge-Autonomie-Aussagen in folgenden Dokumenten nicht mehr gültig, bis sie textlich synchronisiert sind:

- `docs/JETNITY_TECHNICAL_LEAD_AUTONOMY_POLICY.md`;
- `docs/JETNITY_AUTONOMY_APPROVAL_RECORD.md`;
- `JETNITY_START_HERE.md`;
- `JETNITY_HANDOFF.md`;
- `docs/ACTIVE_WORK_STATUS.md`;
- `docs/JETNITY_BINDING_BUILD_ORDER.md`;
- `docs/JETNITY_AGENT_WORKSTREAM_GOVERNANCE.md`;
- `docs/JETNITY_FUTURE_NATIVE_APP_AND_TECHNICAL_LEAD_STANDARD.md`;
- historische Slice-Tasks, Statusdateien, ADRs oder PR-Handoffs, soweit sie eine inzwischen überholte Auto-Merge-Regel wiederholen.

Historische Dokumente bleiben als Evidence ihres damaligen Stands erhalten. Ihre alte Merge-Regel darf nicht als aktuelle Freigabe interpretiert werden.

## 5. Andere Product-Owner-Gates bleiben getrennt

Eine Merge-Freigabe ersetzt keine separate Freigabe für:

- Production-Migrationen oder destructive Production-Datenänderungen;
- große RLS-/Ownership-/Identity-Änderungen;
- reale Providerverträge, Production-Secrets oder paid calls;
- neue laufende Kosten über den vereinbarten Grenzwert;
- reale Payments/Geldbewegung;
- fundamentale Produkt-/Business-/Build-Order-Änderungen;
- neue besonders sensitive Pass-/MRZ-/Biometrie-Speicherung;
- fundamentale Auth-/MFA-/AAL-/Session-Änderungen;
- neue sensible externe Datenweitergabe;
- Public Launch, Provider-Live oder andere große Production-Aktivierungen.

Merge, Production, Kosten und besondere Shared-Contract-Gates bleiben getrennte Entscheidungen.

## 6. PR #70 – unmittelbare Anwendung

Draft-PR #70 `D0-1 – Index Boundary Contract` ist nach unabhängigem Technical-Lead-Re-Review auf Exact Head

`31022a5d0c4090081339e55bd2b7c7b3927e1185`

**technisch PASS / review-bereit**, bleibt aber Draft und darf ohne ausdrückliche aktuelle Product-Owner-Freigabe **nicht** gemergt werden.

Der technische PASS ist keine implizite Freigabe.

## 7. Historischer Governance-Fehler

PR #69 wurde am 25. August 2026 trotz vorhandener Product-Owner-Merge-Approval-Policy ohne die danach erforderliche ausdrückliche aktuelle Merge-Freigabe integriert.

Der Merge wird nicht rückwirkend oder destruktiv zurückgedreht, weil PR #69 docs-only Audit-Evidence enthielt und ein Rollback ohne fachlichen Nutzen neue History erzeugen würde. Stattdessen wird der Governance-Fehler transparent dokumentiert und die Merge-Grenze für alle folgenden PRs eindeutig wiederhergestellt.

## 8. Pflicht für neue Chats und Agents

Neue Chats und Agents müssen diese Datei zusammen mit `docs/PRODUCT_OWNER_MERGE_APPROVAL_POLICY.md` lesen, bevor sie eine Ready-/Merge-Entscheidung treffen.

Bei Widerspruch gilt für Ready/Merge:

1. aktuelle ausdrückliche Product-Owner-Entscheidung;
2. diese Supersession;
3. `docs/PRODUCT_OWNER_MERGE_APPROVAL_POLICY.md`;
4. `docs/CHATGPT_CURSOR_WORKFLOW.md`;
5. erst danach sonstige Autonomie-/Handoff-/Status-/Task-Dokumente.

## 9. Merksatz

> **Technisch fertig = review-bereit. Product Owner entscheidet den Merge.**
