# Technical Lead / Cursor Operating Standard – Integration Status

Stand: 28. August 2026  
Status: **DOCS-ONLY / MINIMAL / DRAFT / STOP FOR INDEPENDENT TECHNICAL-LEAD REVIEW**  
Agent: `Cursor-Agent: Jetnity quality security audit 3`  
Auftrag: `docs/TECHNICAL_LEAD_CURSOR_OPERATING_STANDARD_INTEGRATION_TASK_2026-08-28.md`  
Authority: `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`  
Branch: `docs/technical-lead-cursor-operating-standard-2026-08-28`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/142

Kein Ready. Kein Merge. Kein Folgeslice. Self-Review ist keine Freigabe.

---

## 0. Live-Rekonstruktion

| Fakt | Wert |
| --- | --- |
| Task-Baseline | `main @ 3b119ae34843b40d043ed921070c60e35dd1517a` |
| `origin/main` nach Re-Fetch | `3b119ae34843b40d043ed921070c60e35dd1517a` |
| Merge-Base | `3b119ae3` = `origin/main` |
| Runtime / Schema / Supabase / Auth / Provider / Branch Protection | unverändert |

Die breitere Erst-Integration wurde auf den Technical-Lead-Minimalauftrag zurückgenommen. Historische Dateien bleiben byte-identisch zu `origin/main`, außer den unten genannten Current-Truth-Dateien.

---

## 1. Minimal umgesetzt

- `JETNITY_START_HERE.md`: Operating Standard ist Pflichtlektüre-Item 2; exclusive Ready/Merge ist in den New-Chat-Regeln und in Abschnitt 3 benannt.
- `docs/JETNITY_TECHNICAL_LEAD_AUTONOMY_POLICY.md`: Operating Standard hat Vorrang; nur Technical Lead darf Ready/Merge.
- `docs/JETNITY_AGENT_WORKSTREAM_GOVERNANCE.md`: New-Chat-Punkt 8 und §6.2 entfernen die Mehrdeutigkeit, ein Agent dürfe nach Review Ready/Merge.
- `docs/JETNITY_AGENT_SESSION_ROTATION_STANDARD.md`: unverändert. Gleicher Slice/PR/Fix = dieselbe Session; neuer Slice = frische Generation.
- `docs/CHATGPT_CURSOR_WORKFLOW.md`: unverändert. Neuere Precedence reicht.

---

## 2. Non-Scope – gehalten

Keine Runtime, keine Migration, keine Supabase-Mutation, kein Auth/RLS/AAL, kein Provider, kein TW-8, keine Branch-Protection-Änderung, kein Cleanup, kein Ready, kein Merge, kein Folgeslice.

---

## 3. Exakter nächster Schritt

Unabhängiger Technical-Lead-Review auf dem neuen Exact Head von Draft-PR #142.
