# ChatGPT / Technical Lead – Merge Autonomy Checkpoint

Stand: 26. August 2026  
Status: **HISTORICAL CHECKPOINT / Governance-Slice-Evidence. Nicht mehr der aktuelle operative Integrationsstand.**

> Superseded as current by `docs/CHATGPT_FINAL_CONTINUITY_HANDOFF_CHECKPOINT_2026-08-26.md`. Die Merge-Autonomie-Entscheidung selbst bleibt gültig über `docs/TECHNICAL_LEAD_MERGE_AUTONOMY_SUPERSESSION_2026-08-26.md`. Die unten genannte Baseline `5f9dc4b0` ist historische Evidence, nicht aktuelles `main`.

## 1. Ausgangspunkt

PR #72 – `docs: close post-D0-1 continuity` – wurde nach ausdrücklicher Product-Owner-Freigabe und Exact-Head-Recheck gemergt.

Merge-Commit:

`5f9dc4b0e87d8b2adbcaca6962a76463cad32304`

Dieser Stand ist die Baseline für den aktuellen docs-only Governance-Slice.

## 2. Neue Product-Owner-Entscheidung

Der Product Owner hat anschließend ausdrücklich entschieden:

- ChatGPT / Technical Lead darf selbst entscheiden, ob normale scope-treue PRs Ready gesetzt / gemergt werden;
- vor Ready/Merge darf niemals blind auf Cursor, Tests, CI oder Preview vertraut werden;
- der Technical Lead muss den tatsächlichen Change unabhängig hinterfragen und vollständig prüfen;
- wenn etwas nicht gut ist, wird zuerst korrigiert – direkt durch ChatGPT / Technical Lead oder durch einen gezielten Cursor-Korrekturauftrag;
- nach jeder Korrektur werden relevanter Exact Head, Tests/Gates, CI/Vercel und Review erneut geprüft;
- besondere Production-/Provider-/Kosten-/Payment-/Sensitive-Data-/Auth-/Launch-Gates bleiben ausdrücklich Product-Owner-pflichtig.

Kanonische neue Supersession:

`docs/TECHNICAL_LEAD_MERGE_AUTONOMY_SUPERSESSION_2026-08-26.md`

## 3. Praktische Merge-Regel

> **Autonom mergen ist erlaubt – blind mergen ist verboten.**

Ein Agentenabschluss oder grüne Automatisierung ist Evidence, keine Wahrheit. Der Technical Lead prüft vor Merge insbesondere Diff, fachlichen Contract, Testannahmen, Security/Privacy/Truth, Shared Contracts, Parallelität, Exact-Head-CI, Vercel und relevante Production-/Supabase-Grenzen.

## 4. Parallelitätsentscheidung

Nach Abschluss dieses Governance-Slices ist folgende konfliktarme Parallelität freigegeben:

- `Jetnity growth discoverability` → D0-2 Runtime: Canonical / Origin / robots-sitemap Consistency;
- `Trip workspace audit architecture` → TW-6 Dependency / Guest-One-Trip Contract Audit, audit-only;
- `Account plattform audit vorbereitung` → Traveller / Account Next-Phase Dependency Audit, audit-only;
- `Jetnity provider readiness audit` → S4–S8 Dependency / Provenance Gap Audit, audit-only;
- `Admin platform audit` → Admin D–K / Growth-Control Gap Audit, audit-only;
- `Jetnity quality security audit` → QS-2 independent Quality/Security/Resilience Audit, audit-only.

`Jetnity native app architecture` bleibt reserviert.

Harte Anti-Kollisionsregel:

- je Workstream eigener Branch / Draft-PR / Task / Status;
- Agenten ändern nicht parallel `docs/ACTIVE_WORK_STATUS.md`;
- Audit-only-Agenten ändern keine Runtime;
- Shared-Contract-Bedarf → dokumentieren und STOPP;
- kein Agent startet selbst den Folgeslice;
- zentrale Continuity und Merge-Reihenfolge bleiben Technical-Lead-gesteuert.

## 5. Ziel dieses Governance-Slices

Nur Dokumentation / Governance:

- neue Merge-Autonomie dauerhaft speichern;
- `JETNITY_START_HERE.md`, `JETNITY_HANDOFF.md`, `docs/ACTIVE_WORK_STATUS.md` und die Technical-Lead-Autonomie synchronisieren;
- konfliktarme Parallelitätsgrenzen festhalten.

Keine Runtime-, DB-, RLS-, Auth-, Traveller-, Route-, Provider-, Payment-, Tracking-, Secret-, paid-call- oder Kostenänderung.
