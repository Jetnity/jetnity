# Technical Lead / Cursor Operating Standard – Agent Self-Review

Stand: 28. August 2026  
Status: **SELF-REVIEW ONLY / PO-CONTINUITY-CLARIFICATION / KEINE FREIGABE / KEIN PASS**  
Agent: `Cursor-Agent: Jetnity quality security audit 3`  
PR: https://github.com/Jetnity/jetnity/pull/142  
Gegen vorherigen Head: `0b0e3b548db6d34c5a59f47b3756222ea296c25e`

Ein Agenten-Self-Review ersetzt keinen unabhängigen Technical-Lead-Re-Review. Gates auf `0b0e3b54` gelten nicht für den neuen Head.

---

## 1. Scope-Treue

Nur die drei Continuity-Clarifications. Keine Runtime, kein Produkt-Folgeslice, kein Ready, kein Merge.

| Forderung | Ergebnis |
| --- | --- |
| Exakter zugewiesener Agentenname, keine erfundene Generation | ja |
| UI-Rename nur wenn programmierbar | nein exponiert; nicht behauptet |
| ChatGPT öffnet kein Chat-Fenster | Operating Standard §9 |
| Checkpoint vor Kontextverlust, dann Recovery-Prompt | Operating Standard §9 + Prompt-Datei |
| Universeller Prompt, prominent verlinkt | `docs/JETNITY_UNIVERSAL_NEW_CHAT_RECOVERY_PROMPT.md` in START_HERE und Operating Standard |

## 2. STOP

Unabhängiger Technical-Lead-Re-Review auf dem neuen Exact Head.
