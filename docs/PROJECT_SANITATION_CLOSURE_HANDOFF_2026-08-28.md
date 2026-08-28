# Jetnity – Project Sanitation Closure Handoff

Stand: 28. August 2026  
Cursor-Agent: `Jetnity quality security audit 3`  
Issue: [#134](https://github.com/Jetnity/jetnity/issues/134)  
Draft-PR: [#135](https://github.com/Jetnity/jetnity/pull/135)  
Status: **AUTHOR COMPLETE / DRAFT / KEIN READY / KEIN MERGE / KEIN CLEANUP**

> **Live-Evidence gewinnt immer.** Dieser Handoff ist Übergabe-Evidence, kein Ersatz für Live-Rekonstruktion.

## 1. Was übergeben wird

Ein non-destructive Closure-/Retention-Plan für historische PRs und Remote-Branches.

Zuerst lesen:

1. `docs/PROJECT_SANITATION_CLOSURE_TASK_2026-08-28.md`
2. `docs/PROJECT_SANITATION_LIVE_INVENTORY_STATUS_2026-08-28.md`
3. `docs/PROJECT_SANITATION_HISTORICAL_PR_CLOSURE_MATRIX_2026-08-28.md`
4. `docs/PROJECT_SANITATION_REMOTE_BRANCH_DISPOSITION_MATRIX_2026-08-28.md`
5. `docs/PROJECT_SANITATION_CLOSURE_SELF_REVIEW_2026-08-28.md`
6. ADR-0183 in `DECISIONS.md`

Historische 26.08.-Inventur: offenes Draft-PR #88. Nicht nach `docs/history/` kopiert.

## 2. Live-Start dieses Agenten

| Feld | Wert |
| --- | --- |
| `origin/main` | `eaa03ad71509d281990e0d34ca359e0750eb9591` |
| Offene PRs bei Start | 7 |
| Remote-Heads bei Start | 135 |
| Parallel | PR #133 / Issue #132 – nicht angefasst |
| Draft-PR | [#135](https://github.com/Jetnity/jetnity/pull/135) |
| Exact Head | `30893fa0974db186537c34467c9b0eae1a7e1b61` |
| GitHub Actions | Run `33164083125` **SUCCESS** auf exakt diesem SHA |
| Vercel Preview | Deployment `6139730729` **READY** auf exakt diesem SHA |
| Review-Threads | 0 |

## 3. Closure-Urteile

| PR | Klasse |
| --- | --- |
| #133 | ACTIVE – Parallelagent 9 |
| #88 | KEEP-HISTORICAL-OPEN |
| #52 | KEEP-HISTORICAL-OPEN |
| #50 | CLOSE-SAFE |
| #40 | KEEP-HISTORICAL-OPEN |
| #39 | KEEP-HISTORICAL-OPEN |
| #28 | KEEP-FUTURE |

Keine weiteren alten Drafts.

## 4. Branch-Urteile

| Klasse | Anzahl bei Inventur |
| --- | --- |
| ACTIVE | 2 |
| MERGED-HEAD-LEFTOVER | 112 |
| HISTORICAL-EVIDENCE | 6 |
| STALE / SUPERSEDED | 13 |
| FUTURE-WORK | 1 |
| UNKNOWN / NEEDS REVIEW | 1 |

Nicht löschen ohne Sicherung: #39/#40/#52/#28, `chore/account-admin-team-prep`, `docs/post-pr98-continuity-2026-08-27`, Archive-Tags, aktiver AP-5-S1-Branch.

## 5. Was der Technical Lead tun darf – nach unabhängigem Review

- diesen Draft-PR Ready setzen und mergen, wenn Exact-Head-Gates passen
- danach PR #50 schliessen; PR #88 nur nach bewusster Archivierung der Unique Files
- später Mengen A/B/C der Branch-Matrix löschen

Nicht aus diesem Handoff ableiten:

- Merge alter historischer PRs
- Cloud-/Supabase-/Vercel-Delete
- Runtime-Cleanup von CookieConsent, `prague.jpg`, `.temp` oder `next.config.js`
- AP-5-S1, C2, AP-6, AP-7, Provider, TW, Search, Homepage, Native

## 6. Product-Owner-Gates bleiben

- `jetnity-bets` Decommission
- History-Rewrite
- Production-/Schema-/Secret-Änderungen
- sichtbarer Cookie-/Privacy-Text
- Domain-/Vercel-Projektänderung

## 7. STOPP

Kein Ready. Kein Merge durch den Autor. Kein Cleanup. Kein Folgeslice.

Generation 3 dieses Workstreams ist mit diesem Slice verbraucht und wird nicht für eine neue logische Arbeitseinheit wiederverwendet.
