# Jetnity – AP-4 Account Archive Lifecycle – Handoff

Stand: 27. August 2026  
Status: **INTEGRIERT AUF `main` / PR #108 / MERGE `70cac163` / KEIN FOLGESLICE AUTOMATISCH**  
Cursor-Agent: **`Account plattform audit vorbereitung 3`**  
PR: https://github.com/Jetnity/jetnity/pull/108 — **MERGED**

## Zuerst lesen

1. `docs/ACCOUNT_AP4_ARCHIVE_LIFECYCLE_TASK_2026-08-27.md`
2. `docs/ACCOUNT_AP4_ARCHIVE_LIFECYCLE_DECISION_2026-08-27.md`
3. `docs/ACCOUNT_AP4_ARCHIVE_LIFECYCLE_STATUS_2026-08-27.md`
4. `docs/ACCOUNT_AP4_SELF_REVIEW_2026-08-27.md`
5. ADR-0177 in `DECISIONS.md`
6. AP-3 bleibt date-only: `lib/account/reise-lage.ts`

## Was gebaut wurde

| Fläche | Datei |
| --- | --- |
| Domain | `lib/account/reise-archiv.ts` |
| Schreibweg | `lib/trips/archiv-aktionen.ts` |
| Liste | `components/trips/KontoReisenGruppen.tsx`, `KontoReiseEintrag.tsx`, `KontoReiseArchivAktion.tsx` |
| Listenablesung | `lib/trips/daten.ts` liest `metadata` nur für Restore-Provenienz |
| Übersicht | `lib/account/naechste-reise.ts` bleibt: archived ist kein Fortsetzen |

## Review-Fixes auf dem vorherigen Head `e34d5829`

Technical Lead: CHANGES REQUIRED. Umgesetzt, ohne Scope-Erweiterung:

- Restore behält Geschwister unter `account_archive`.
- Write-Guard ist Status plus gelesenes `updated_at`, kein status-only akzeptiertes Risiko.
- Keine AP-4-eigene `trips.metadata`-Größengrenze.

## Gegatete Evidence

Merge auf `main` `70cac163a79c3cd4098a72a0df241eb75c47738f`:

- Technical-Lead PASS auf Exact Head `88146dd5`
- Actions `33110989276` SUCCESS; Vercel `3PTcb1RcStZT12RXiHffXghKa6tf` READY
- Post-Merge Actions `33111852882` SUCCESS
- Post-Merge Vercel `8bvcVH5kCvSFhauw6QooL4xPvuwW` / Deployment `6130217634` completed

Review-Fix-Head `d9e35bb66ed51e7861107872c6c96b1edb989106`:

- Actions `33110692991` SUCCESS
- Vercel Preview `2EtoM6gGvaEpJwWhFRGj25S8X42F` / Deployment `6130005583` READY
- Preview https://jetnity-d5woaiy7n-jetnity-e1b93c82.vercel.app
- Review-Threads 0
- Damaliges Live-`main` (historisch): `4f630ff4`

Vorheriger Runtime-Head vor Review-Fixes `f19b5711e05282617d7c35262ebbfaeef4253e0d`:

- Actions `33108697812` SUCCESS
- Vercel Preview `BiQYRdySrHjnea8MmTbxqSomsCMQ` / Deployment `6129645873` READY
- Review-Threads 0

Vorheriger PASS vor dem Action-State-Follow-up: `954b0c75` / Actions `33108364497` / Vercel `C6s9zyHZV9owevNEXH1Rie2t96rH`.

## Was bewusst nicht gebaut wurde

Keine Migration. Kein RLS/Auth/AAL. Kein AP-7. Kein P2-TA-06. Kein Guest-Archiv. Kein Delete-Redesign. Kein TW-8. Kein Workspace-Redesign. Keine Pagination.

## Abschlussregel

AP-4 ist auf `main`. Technical-Lead PASS und Merge sind erfolgt. Ältere „Draft / STOPP vor Ready/Merge“-Sätze sind Pre-Merge-Evidence. Kein automatischer Folgeslice.
