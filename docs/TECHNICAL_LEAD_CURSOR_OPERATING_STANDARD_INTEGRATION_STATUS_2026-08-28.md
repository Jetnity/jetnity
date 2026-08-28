# Technical Lead / Cursor Operating Standard – Integration Status

Stand: 28. August 2026  
Status: **DOCS-ONLY / DRAFT / STOP FOR INDEPENDENT TECHNICAL-LEAD REVIEW**  
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
| `origin/main` nach Re-Fetch vor Edit | `3b119ae34843b40d043ed921070c60e35dd1517a` |
| Merge-Base | `3b119ae3` = `origin/main` |
| Ahead / Behind vor Integration | 2 ahead / 0 behind — nur Operating Standard + Task |
| Integration-Head dieses Stamps | `778149808515bd48fd80e823a14491cddbd11e7c` |
| Draft-PR | #142 OPEN, Draft |
| Runtime / Schema / Supabase / Auth / Provider / Branch Protection | unverändert |

Historische Merge-/Workflow-Dokumente bleiben Evidence ihres Zeitpunkts.

---

## 1. Umgesetzt

- `JETNITY_START_HERE.md` nennt den Operating Standard als frühe Pflichtlektüre, noch bevor ein neuer Technical Lead ändert, reviewed oder merget.
- Exclusive Ready-/Merge-Autorität ist in den aktuellen Governance-Dateien explizit: nur ChatGPT / Technical Lead; Cursor-Agenten niemals.
- Autonomes Merge normaler PRs bleibt an unabhängigen Exact-Head-Review und volle Technical-Lead-Überzeugung gebunden.
- Besondere Product-Owner-Gates bleiben erhalten.
- Session-Rotation bleibt: gleicher Slice/PR/unmittelbarer Review-Fix = dieselbe Session; neuer logischer Slice = frische nummerierte Generation.
- Der Workflow versionierter Task → Draft-PR → `@cursor` → unabhängiger Review → head-gebundene CHANGES REQUIRED → neuer Head + Re-Gating → PASS → Technical-Lead-only Merge → Post-Merge-Verifikation ist in den Current-Truth-Dateien benannt.
- Historische Dateien erhielten Supersession-Verweise; ihre Bodies wurden nicht kosmetisch umgeschrieben.
- ADR-0185 dokumentiert die Product-Owner-Entscheidung.

---

## 2. Non-Scope – gehalten

Keine Runtime, keine Migration, keine Supabase-Mutation, kein RLS/GRANT/REVOKE/SECURITY DEFINER, kein Auth/Session/MFA/AAL, keine Provider-Aktivierung/Secrets/paid calls, kein TW-8, keine Branch-Protection-Änderung, kein Cleanup, kein Ready, kein Merge, kein Folgeslice.

---

## 3. Exakter nächster Schritt

Unabhängiger Technical-Lead-Review auf dem neuen Exact Head von Draft-PR #142. Gates auf älteren Heads gelten nicht für den neuen Head.
