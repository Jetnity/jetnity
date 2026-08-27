# Jetnity – AP-4 Account Archive Lifecycle – Handoff

Stand: 27. August 2026  
Status: **AUTHOR IMPLEMENTATION HANDOFF / DRAFT / STOPP VOR READY/MERGE**  
Cursor-Agent: **`Account plattform audit vorbereitung 3`**

## Zuerst lesen

1. `docs/ACCOUNT_AP4_ARCHIVE_LIFECYCLE_TASK_2026-08-27.md`
2. `docs/ACCOUNT_AP4_ARCHIVE_LIFECYCLE_DECISION_2026-08-27.md`
3. `docs/ACCOUNT_AP4_ARCHIVE_LIFECYCLE_STATUS_2026-08-27.md`
4. ADR-0177 in `DECISIONS.md`
5. AP-3 bleibt date-only: `lib/account/reise-lage.ts`

## Was gebaut wurde

| Fläche | Datei |
| --- | --- |
| Domain | `lib/account/reise-archiv.ts` |
| Schreibweg | `lib/trips/archiv-aktionen.ts` |
| Liste | `components/trips/KontoReisenGruppen.tsx`, `KontoReiseEintrag.tsx`, `KontoReiseArchivAktion.tsx` |
| Listenablesung | `lib/trips/daten.ts` liest `metadata` nur für Restore-Provenienz |
| Übersicht | `lib/account/naechste-reise.ts` bleibt: archived ist kein Fortsetzen |

## Was bewusst nicht gebaut wurde

Keine Migration. Kein RLS/Auth/AAL. Kein AP-7. Kein P2-TA-06. Kein Guest-Archiv. Kein Delete-Redesign. Kein TW-8. Kein Workspace-Redesign. Keine Pagination.

## Abschlussregel

Draft-PR + Exact-Head Gates + Self-Review, danach STOPP. ChatGPT / Technical Lead führt den unabhängigen Finalreview durch. Kein Ready. Kein Merge durch den Autor-Agenten.
