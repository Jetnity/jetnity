# Jetnity – Technical Lead Live Reconstruction Correction

Stand: 28. August 2026  
Typ: **CONTINUITY / LIVE-EVIDENCE CORRECTION**

## 1. Korrektur

Im Live-Rekonstruktionsbericht nach dem Chat-Übergang wurde fälschlich gesagt, es existierten aktuell keine Supabase Preview-/Development-Branches.

Diese Aussage ist **korrigiert**.

Live `Supabase.list_branches` für das Production-Projekt `qscbgcdmivbbnzrcyegn` bestätigt am 28. August 2026:

| Name | Project Ref | Default | Status |
| --- | --- | --- | --- |
| `main` | `qscbgcdmivbbnzrcyegn` | ja | `ACTIVE_HEALTHY` |
| `develop` | `yfvbxvijcorffwxbxahl` | nein | `ACTIVE_HEALTHY` |

Der non-default Branch `develop` existiert weiterhin und ist gesund.

## 2. Was sich dadurch nicht ändert

Die übrige Live-Rekonstruktion bleibt unverändert:

- Live-`main` bei erneuter Prüfung: `43aef6431aeea619ea896d456e16579b1034b9dd`;
- PR #115 bleibt letzter Merge auf `main`;
- Post-Merge GitHub Actions und Vercel Production bleiben auf diesem SHA;
- Production-Migrationswahrheit zu Gate A, Gate B und Admin AAL2 bleibt unverändert;
- kein Re-Apply von bereits angewendeten Production-Migrationen;
- keine automatische Provider-/TW-8-/AP-5-/AP-7-/Search-/Homepage-Folgearbeit.

## 3. Governance für `develop`

Aus der Existenz des Branches folgt **keine** automatische Berechtigung zu:

- Reset;
- Rebase;
- Merge in Production;
- Delete;
- Migration-Replay;
- Datenkopie;
- Provider-/Secret-Aktivierung.

Solche Aktionen werden nur nach konkretem Workstream-Auftrag und den geltenden Product-Owner-/Production-Gates ausgeführt.

## 4. Nächster vorbereiteter Slice

P2-TA-03 ist als Audit-/Architecture-/Continuity-Slice vorbereitet:

- Issue #116;
- Task: `docs/P2_TA03_ACCOUNT_PLATFORM_PLAN_RECONCILIATION_TASK_2026-08-28.md`;
- neuer reservierter Cursor-Agent: `Account plattform audit vorbereitung 5`;
- keine AP-5-Runtime-Freigabe.

Diese Datei korrigiert nur die fehlerhafte Supabase-Branch-Aussage. Historische Evidence wird nicht gelöscht oder umgeschrieben.
