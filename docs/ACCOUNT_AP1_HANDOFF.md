# Jetnity Account Platform – AP-1 Handoff

Stand: 24. August 2026  
Status: **mit `main` synchronisiert und gegated – Draft, kein Mark Ready, kein Merge**

| Feld | Wert |
| --- | --- |
| Cursor-Anzeigename | **Account plattform audit vorbereitung** |
| Agent | https://cursor.com/agents/bc-01a030a0-d97f-782b-8bd0-acb906563518 |
| Workstream | Account Platform AP-1 |
| Branch | `feat/account-ap1` |
| Draft-PR | https://github.com/Jetnity/jetnity/pull/43 |
| Auftrag | `docs/ACCOUNT_AP1_MAIN_SYNC_TASK.md` |
| Review | `docs/ACCOUNT_AP1_CHATGPT_REVIEW.md` |
| Status | `docs/ACCOUNT_AP1_STATUS.md` |
| Self-Review | `docs/ACCOUNT_AP1_SELF_REVIEW.md` |
| Entscheidungen | ADR-0152, ADR-0153 |
| Runtime-Head | `19f939698233cfd99b828f4c0aa14d64ca0f4ac5` |
| Sync-Basis | `main` @ `f92e0c9e2e6ddbe73b1cc2c59d7ba5521a0115c5` |

## Sync

- Merge-Commit `19f93969` holt Provider Readiness #45 und Provider Ops S1 #47 auf den AP-1-Branch.
- GitHub Actions SUCCESS (`32721449423`) und Vercel Preview success (`FgQGeCBXz8rcy9vk5vGTRKo6Mdsf`) auf genau diesem Head.
- Ein nachfolgender Docs-Commit ist docs-only und kein neues Runtime-Gate.

## Produktstand AP-1 (unverändert)

- Account-Shell, persönliche Übersicht, Fortsetzen-CTA
- Konto-Link nur bei `sitzung === konto`
- `/account/security` unter Einstellungen
- Geräte-Kalendertag für aktiv/kommend; 503 ohne Persistenzbehauptung

## Nicht angefasst

Auth/MFA/AAL, RLS, Migrationen, Guest→Account, Traveller-Registry, Privacy/Billing, Homepage, AP-2, AP-3, Production, Provider-Aktivierung.

## Nächster Schritt

Unabhängiger Technical-Lead-Integrationsreview von PR #43 auf `19f93969`.  
PR bleibt Draft. Kein Ready, kein Merge. AP-2 nicht in diesem Schritt retargeten.
