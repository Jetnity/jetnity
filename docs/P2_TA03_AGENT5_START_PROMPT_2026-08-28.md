# Cursor Start Prompt – P2-TA-03

Nimm einen **neuen Agenten** und nenne ihn exakt:

`Account plattform audit vorbereitung 5`

Repository:

`Jetnity/jetnity`

Arbeitsauftrag:

P2-TA-03 – Canonical Account Platform Implementation Plan Reconciliation.

Lies zuerst vollständig:

1. `JETNITY_START_HERE.md`
2. `docs/P2_TA03_ACCOUNT_PLATFORM_PLAN_RECONCILIATION_TASK_2026-08-28.md`
3. `docs/CHATGPT_TL_LIVE_RECONSTRUCTION_CORRECTION_2026-08-28.md`
4. `docs/P2_TA03_AGENT_ROTATION_RECORD_2026-08-28.md`
5. die im Task definierte Pflichtlektüre

Danach live neu prüfen:

- aktuelles `origin/main`;
- aktuellen Head des übergebenen Arbeitsbranches;
- offene PRs und Parallelität;
- relevante Account-/Traveller-/Admin-/Security-/Privacy-/Growth-Evidence;
- historischen PR #39 nur als Historical Evidence.

Verbindliche Scope-Grenze:

**Audit / Architecture / Continuity only. Keine AP-5 Runtime.**

Nicht bauen oder verändern:

- AP-5 Runtime;
- AP-7 Account-Traveller Registry;
- Auth/MFA/AAL-Grundlogik;
- Identity-Architektur;
- RLS/Ownership;
- DB-/Production-Migrationen;
- sensitive Dokumentpersistenz, Passnummern, Scans, MRZ, Biometrie;
- Provider S5-B oder echte Provider;
- TW-8/TW-9;
- Issue #109/#110 Runtime;
- Public Indexing / Domain Cutover;
- Supabase Branches.

Die historische `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md` aus PR #39 darf nicht kopiert oder als aktuelle Wahrheit übernommen werden. Reconcile sie gegen den aktuellen Stand: AP-1–AP-4 sind integriert; P2-TA-06 ist abgeschlossen; aktuelle Auth/AAL2-/Traveller-/Privacy-/Admin-/Growth-Grenzen gewinnen.

Traveller Truth bleibt zwingend:

> Ein Reisender → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.

Kein Default-Pass. Issuer ≠ Citizenship. `documents[0]` / `evaluations[0]` sind keine Product Truth.

Supabase-Live-Korrektur:

- Production/default `main`: `qscbgcdmivbbnzrcyegn`, ACTIVE_HEALTHY
- non-default `develop`: `yfvbxvijcorffwxbxahl`, ACTIVE_HEALTHY

Keine Branch-Mutation.

Erwartetes Ergebnis und Gates stehen vollständig in:

`docs/P2_TA03_ACCOUNT_PLATFORM_PLAN_RECONCILIATION_TASK_2026-08-28.md`

Arbeite scope-treu, aktualisiere dauerhafte Repository-Evidence, führe Self-Review durch und STOPPE danach mit:

- Exact Head;
- vollständiger Dateiliste;
- Zusammenfassung der Reconciliation;
- AP-5–AP-12-Gate-Matrix;
- Tests/Evidence;
- offenen Risiken;
- Parallelitätsprüfung.

Nicht Ready markieren. Nicht mergen. ChatGPT / Technical Lead führt den unabhängigen Finalreview durch.
