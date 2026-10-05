# Jetnity Account AP-1 – Status

Stand: 24. August 2026  
Status: **mit `main` `f92e0c9e` synchronisiert und gegated – Draft, kein Ready, kein Merge**

| Feld | Wert |
| --- | --- |
| Cursor-Anzeigename | **Account plattform audit vorbereitung** |
| Branch | `feat/account-ap1` |
| Draft-PR | https://github.com/Jetnity/jetnity/pull/43 |
| Auftrag | `docs/ACCOUNT_AP1_MAIN_SYNC_TASK.md` |
| **Runtime-Head** | `19f939698233cfd99b828f4c0aa14d64ca0f4ac5` |
| Sync-Basis | `origin/main` @ `f92e0c9e2e6ddbe73b1cc2c59d7ba5521a0115c5` |
| Vorheriger technischer Head | `9cc9b0526683f161f500326a7b72c74abac9c296` |

## Remote-Gates auf dem Runtime-Head

Genau `19f939698233cfd99b828f4c0aa14d64ca0f4ac5`:

- GitHub Actions CI: **SUCCESS** – https://github.com/Jetnity/jetnity/actions/runs/32721449423
- Vercel Preview: **success / completed** – https://vercel.com/jetnity-e1b93c82/jetnity-app/FgQGeCBXz8rcy9vk5vGTRKo6Mdsf
- Preview-URL: https://jetnity-niexqd3tj-jetnity-e1b93c82.vercel.app

PR #43 bleibt Draft. Kein Mark Ready. Kein Merge.

## Lokale Gates auf dem Runtime-Head

- AP-1-Account-Tests: grün
- `npm test`: 1752/1752 grün
- Typecheck, Lint, Hygiene, `auth:pruefen`: grün
- Production-Build: grün
- `audit:account`: 48/48 grün (`AUDIT_PORT=3464`)

## Sync-Ergebnis

- `main` `f92e0c9e` ist Ancestor des Runtime-Heads.
- Konflikte nur in `DECISIONS.md`, `JETNITY_HANDOFF.md`, `docs/ACTIVE_WORK_STATUS.md`.
- ADR-0152 und ADR-0153 bleiben. ADR-0154 / Provider Ops S1 aus `main` bleibt.
- Keine Seasonal-/Route-/Safety-/Provider-Wahrheit zurückgedreht.
- Account-Shell, Übersicht, Fortsetzen-CTA, Navigation und `/account/security` unverändert.

## Nicht angefasst

AP-2 (PR #48 bleibt `759601a8`, Draft), AP-3, DB/Migration/RLS, Production, Provider-/Secret-/Kosten-Aktivierung.

## Nächster Schritt

Unabhängiger Technical-Lead-Integrationsreview von Draft-PR #43 auf `19f93969`.
