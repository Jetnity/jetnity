# Jetnity – Project Sanitation Closure Handoff

Stand: 28. August 2026  
Cursor-Agent: `Jetnity quality security audit 3`  
Issue: [#134](https://github.com/Jetnity/jetnity/issues/134)  
Draft-PR: [#135](https://github.com/Jetnity/jetnity/pull/135)  
Status: **REVIEW-FIX / DRAFT / KEIN READY / KEIN MERGE / KEIN CLEANUP / KEIN PR-CLOSE / KEIN BRANCH-DELETE**  
ADR: **ADR-0184**

> **Live-Evidence gewinnt immer.** Dieser Handoff ist Übergabe-Evidence, kein Ersatz für Live-Rekonstruktion.

## 1. Was übergeben wird

Ein non-destructive Closure-/Retention-Plan für historische PRs und Remote-Branches.  
PR-Close und Branch-Delete sind getrennte Achsen.

Zuerst lesen:

1. `docs/PROJECT_SANITATION_CLOSURE_TASK_2026-08-28.md`
2. `docs/PROJECT_SANITATION_LIVE_INVENTORY_STATUS_2026-08-28.md`
3. `docs/PROJECT_SANITATION_HISTORICAL_PR_CLOSURE_MATRIX_2026-08-28.md`
4. `docs/PROJECT_SANITATION_REMOTE_BRANCH_DISPOSITION_MATRIX_2026-08-28.md`
5. `docs/PROJECT_SANITATION_CLOSURE_SELF_REVIEW_2026-08-28.md`
6. ADR-0184 in `DECISIONS.md` – Sanitation. ADR-0183 bleibt AP-5-S1.

Historische 26.08.-Inventur: Branch `audit/project-sanitation-inventory-2026-08-26` / Draft-PR #88. Nicht nach `docs/history/` kopiert.

## 2. Live-Stand dieses Review-Fix

| Feld | Wert |
| --- | --- |
| `origin/main` | `51b0c926dbb535c6791b69f1b4b1ee7503f0ebe2` |
| Merge-Base | `51b0c926` / 0 behind |
| Offene PRs | 7: #135, #88, #52, #50, #40, #39, #28 |
| Remote-Heads | 136 |
| PR #133 / Issue #132 / Agent 9 | MERGED / CLOSED / completed |
| ADR-0183 | AP-5-S1 integriert |
| Sanitation-ADR | ADR-0184 |
| Review | `5050411074` CHANGES REQUIRED auf `4c2e99a5` |
| Exact Head | `bcf1cb5c1833e6ca565c3cf281b3c900b852e5ef` |
| Ahead / Behind | **5 / 0** gegen `51b0c926` |
| GitHub Actions | Run `33165746670` **SUCCESS** auf exakt diesem SHA |
| Vercel Preview | Deployment `6140045492` / Inspector `2LnmDvHF6XKHintf2u6caa6hQy49` **READY** auf exakt diesem SHA |
| Review-Threads | 1 historische Review auf dem alten Head; 0 neue Inline-Threads |
| Draft-PR | [#135](https://github.com/Jetnity/jetnity/pull/135) |

Authoring-Start dieses Slices war `eaa03ad7` mit offenem #133. Das ist historische Start-Evidence.

## 3. PR-Dispositionen

| PR | PR-Disposition | Branch-Disposition |
| --- | --- | --- |
| #135 | OPEN | ACTIVE |
| #133 | MERGED | DELETE-SAFE |
| #88 | CLOSE-SAFE | HISTORICAL-EVIDENCE |
| #52 | CLOSE-SAFE | HISTORICAL-EVIDENCE |
| #50 | CLOSE-SAFE | DELETE-SAFE |
| #40 | CLOSE-SAFE | HISTORICAL-EVIDENCE |
| #39 | CLOSE-SAFE | HISTORICAL-EVIDENCE |
| #28 | KEEP-FUTURE | FUTURE |

Eine Regel für #88: PR darf später geschlossen werden; der Branch bleibt HISTORICAL-EVIDENCE, bis die zwei Unique Files archiviert sind. Branch-Delete bleibt blockiert, bis Preservation bewiesen ist.

Keine weiteren alten Drafts.

## 4. Branch-Urteile

| Klasse | Anzahl live |
| --- | --- |
| ACTIVE | 2 |
| DELETE-SAFE | 127 (114 leftover + 13 stale/dup) |
| HISTORICAL-EVIDENCE | 5 |
| FUTURE | 1 |
| NEEDS-REVIEW | 1 |

Nicht löschen ohne Sicherung: Branches von #39/#40/#52/#88/#28, `chore/account-admin-team-prep`, `docs/post-pr98-continuity-2026-08-27`, Archive-Tags, integrierte S1-Dateien auf `main`.

## 5. Was der Technical Lead tun darf – nach unabhängigem Re-Review

- diesen Draft-PR Ready setzen und mergen, wenn Exact-Head-Gates passen
- danach eine **PR-Close-Liste** (#50, dann #88/#52/#40/#39)
- separat eine **Branch-Delete-Liste**, erst wenn Unique Content gesichert oder leftover-safe ist
- #28 nicht beiläufig schliessen

Nicht aus diesem Handoff ableiten:

- Merge alter historischer PRs
- Close/Delete in diesem Slice
- Cloud-/Supabase-/Vercel-Delete
- Runtime-Cleanup von CookieConsent, `prague.jpg`, `.temp` oder `next.config.js`
- AP-5-S2–S5, C2, AP-6, AP-7, Provider, TW, Search, Homepage, Native

## 6. Product-Owner-Gates bleiben

- `jetnity-bets` Decommission
- History-Rewrite
- Production-/Schema-/Secret-Änderungen
- sichtbarer Cookie-/Privacy-Text
- Domain-/Vercel-Projektänderung

## 7. STOPP

Kein Ready. Kein Merge durch den Autor. Kein Cleanup. Kein PR-Close. Kein Branch-Delete. Kein Folgeslice.

Generation 3 dieses Workstreams ist mit diesem Slice verbraucht und wird nicht für eine neue logische Arbeitseinheit wiederverwendet.
