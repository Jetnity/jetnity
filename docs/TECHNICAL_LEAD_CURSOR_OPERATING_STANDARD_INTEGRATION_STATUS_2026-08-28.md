# Technical Lead / Cursor Operating Standard – Integration Status

Stand: 28. August 2026  
Status: **DOCS-ONLY / PO-CONTINUITY-AMENDMENT / DRAFT / STOP FOR INDEPENDENT TECHNICAL-LEAD RE-REVIEW**  
Agent: `Cursor-Agent: Jetnity quality security audit 3`  
Vorheriger Head: `d3544a98aba87f86827c00911be093babd0d551f`  
Authority: `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/142

Kein Ready. Kein Merge. Kein Folgeslice. Self-Review ist keine Freigabe. Gates auf `d3544a98` und älteren Heads sind stale.

---

## 0. Live-Rekonstruktion / Current-State

| Fakt | Wert |
| --- | --- |
| `origin/main` / Baseline | `3b119ae34843b40d043ed921070c60e35dd1517a` |
| Aktiver Branch / PR | `docs/technical-lead-cursor-operating-standard-2026-08-28` / Draft-PR #142 |
| Vorheriger Head vor diesem Amendment | `d3544a98aba87f86827c00911be093babd0d551f` |
| Cursor-Agent | `Cursor-Agent: Jetnity quality security audit 3` – keine andere Generation |
| Cursor-Rename-Fähigkeit in dieser Session | nicht exponiert; UI-Anzeigename nicht als geändert behauptet |
| Letztes unabhängiges Review | CHANGES REQUIRED `5454244491` auf `0bce940c`; jene drei Fixes sind umgesetzt |
| Offene CHANGES REQUIRED / Residuals | dieses Amendment noch nicht unabhängig PASS; `main` Branch Protection `protected=false` |
| Besondere PO-Gates | S5-B Runtime, TW-8, AP-5-S3 geschlossen; Ready/Merge nur Technical Lead |
| Runtime / Schema / Supabase / Auth / Provider / Branch Protection | unverändert |
| Fertig vs. unfertig | Governance-Integration + Review-Fix + Namens-/Recovery-Clarification persistiert; dieses Current-State-Amendment frisch; kein PASS, kein Ready, kein Merge |
| Exakt erster nächster Schritt | unabhängiger Technical-Lead-Re-Review auf dem neuen Exact Head |

---

## 1. Product-Owner-Continuity-Amendment

Verbindliche Regel, persistiert in Operating Standard §9 / Leitregeln und `docs/JETNITY_UNIVERSAL_NEW_CHAT_RECOVERY_PROMPT.md`; START_HERE-Pointer für unmissverständliche Current Truth:

> **No relevant Jetnity progress may exist only in chat memory. At every material point the repository must make it possible to know exactly where the project currently stands.**

Current-State-Evidence muss einem neuen Technical Lead ohne Nachfrage beim Product Owner genügen: `main`/Baseline; Branch/PR/Exact Head; exakter Cursor-Agentenname/Generation; Task/Scope/Non-Scope; letztes unabhängiges Review-Verdict plus Head; CHANGES REQUIRED/Blocker/Risiken; Exact-Head-CI/Vercel und relevante Supabase-/Production-Evidence; besondere Gates geschlossen/offen; fertig vs. unfertig; exakt erster noch nicht abgeschlossener nächster Schritt.

Das gilt mitten in Implementierung, Agentenlauf, Review, Re-Gating, unmittelbar vor und nach Merge. Continuity ist Definition of Done. Live-Evidence gewinnt; der Repository-Status muss danach korrigiert werden.

---

## 2. STOP

Unabhängiger Technical-Lead-Re-Review auf dem neuen Exact Head. Kein Ready. Kein Merge. Kein Folgeslice.
