# Jetnity – AP-4 Account Archive Lifecycle – Handoff

Stand: 27. August 2026  
Status: **ASSIGNMENT HANDOFF / VOR AUTOR-AGENT-START**

## Nächster Actor

Neuer Cursor-Agent: **`Account plattform audit vorbereitung 3`**.

Nicht Agent 2 weiterverwenden. Grund: PR #107 / Reconciliation ist abgeschlossen; AP-4 ist gemäß `docs/JETNITY_AGENT_SESSION_ROTATION_STANDARD.md` eine neue logische Arbeitseinheit.

## Auftrag

Verbindlich: `docs/ACCOUNT_AP4_ARCHIVE_LIFECYCLE_TASK_2026-08-27.md`.

Der Agent startet von aktuellem `origin/main`, rekonstruiert Live-Evidence und implementiert ausschließlich AP-4. Keine Migration, kein RLS/Auth/AAL, kein AP-7, kein P2-TA-06, kein Provider/Admin/Growth/Homepage/TW-8.

## Abschlussregel

Draft-PR + Exact-Head Gates + Self-Review, danach STOPP. Kein Ready/Merge durch den Autor-Agenten. ChatGPT / Technical Lead führt den unabhängigen Finalreview durch.
