# Jetnity Account Platform – AP-2 Handoff

Stand: 24. August 2026  
Status: **PR #48 auf `main` gemergt – kein AP-3, keine Production-Migration, keine Provider-Aktivierung**

| Feld | Wert |
| --- | --- |
| Cursor-Anzeigename | **Account plattform audit vorbereitung** |
| Agent | https://cursor.com/agents/bc-01a030a0-d97f-782b-8bd0-acb906563518 |
| Workstream | Account Platform AP-2 |
| Branch | `feat/account-ap2` |
| PR | https://github.com/Jetnity/jetnity/pull/48 – **MERGED** |
| Squash-Merge | `2827d1cbb674498f504ba1810c73c8dc5d43ca24` |
| Runtime-Head | `de5ffd8a91576a2281b6d5eda75338504a43b7a7` |
| Technical Closure | `docs/ACCOUNT_AP2_TECHNICAL_CLOSURE.md` |

## Was ein neuer Agent zuerst liest

1. `docs/ACCOUNT_AP2_STATUS.md`
2. `docs/ACCOUNT_AP2_TECHNICAL_CLOSURE.md`
3. `docs/ACTIVE_WORK_STATUS.md`
4. `JETNITY_HANDOFF.md`

## Merge-Nachweis

- Gemergt von `Jetnity` am 24. August 2026, 13:02:36 UTC.
- Squash-Merge: `2827d1cbb674498f504ba1810c73c8dc5d43ca24` – `feat(account): harden auth UX and session navigation (#48)`.
- Gemergter PR-Head: `b820f8ce`. Runtime-Head `de5ffd8a` liegt in diesem Squash.
- Der Implementierungsagent hat nicht gemergt.

## Produktstand AP-2 auf `main`

AP2-B1 geschlossen. OAuth nur bei belegtem Enablement. `next` fail-closed `/reisen`. Login/Register über `getUser()`. Gast `/reisen` Fortsetzen nur bei `gastspeicher.aktiv`. Footer aus `sitzungseintraege()`. MFA-Dialog a11y-gehärtet ohne MFA-/AAL-Vertragswechsel.

## Nicht angefasst / nicht freigegeben

DB/Migration/RLS, Traveller-Registry, Guest→Account-Vertragsänderung, Provider-Aktivierung, Secrets, Production-Migration, AP-3.

## Nächster Schritt

Kein AP-3 ohne neuen ausdrücklichen Auftrag. Keine Production-Migration. Keine Provider-/Secret-/Kosten-Aktivierung.
