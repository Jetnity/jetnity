# Technical Lead / Cursor Operating Standard – Agent Self-Review

Stand: 28. August 2026  
Status: **SELF-REVIEW ONLY / KEINE FREIGABE / KEIN PASS**  
Agent: `Cursor-Agent: Jetnity quality security audit 3`  
PR: https://github.com/Jetnity/jetnity/pull/142

Ein Agenten-Self-Review ersetzt keinen unabhängigen Technical-Lead-Review.

---

## 1. Geforderter Minimalumfang

| Forderung | Ergebnis |
| --- | --- |
| Operating Standard früh in `JETNITY_START_HERE.md` | ja – Pflichtlektüre-Item 2 und New-Chat-Regel 2 |
| Nur Technical Lead darf Ready/Merge; Cursor niemals | ja – Start Here Regel 6 + Abschnitt 3; Autonomie-Policy; Workstream §6.2 |
| Autonomie- und/oder Workstream-Datei mit explizitem Vorrang | ja – beide, minimal |
| Session-Rotation unverändert, sofern kein Widerspruch | ja – Datei restored auf `origin/main` |
| Historischen `CHATGPT_CURSOR_WORKFLOW.md` nicht kosmetisch umschreiben | ja – Datei restored auf `origin/main` |
| Keine allgemeine Governance-Umschreibung | ja – Extra-Dateien restored |

## 2. Diff-Selbstprüfung

Current-Truth-Änderungen beschränkt auf:

- `JETNITY_START_HERE.md`
- `docs/JETNITY_TECHNICAL_LEAD_AUTONOMY_POLICY.md`
- `docs/JETNITY_AGENT_WORKSTREAM_GOVERNANCE.md`
- `docs/ACTIVE_WORK_STATUS.md` (nur aktueller Arbeitsblock)
- diese Status-/Self-Review-Dateien
- bereits vorhandene Operating-Standard- und Task-Dateien

Keine Runtime-, Schema-, Supabase-, Auth- oder Branch-Protection-Datei.

## 3. STOP

Unabhängiger Technical-Lead-Review auf dem neuen Exact Head. Kein Ready. Kein Merge. Kein Folgeslice.
