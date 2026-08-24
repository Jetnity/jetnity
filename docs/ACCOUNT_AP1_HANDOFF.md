# Jetnity Account Platform – AP-1 Handoff

Stand: 24. August 2026  
Status: **AP-1 Review-Fixes umgesetzt – Draft, kein Mark Ready, kein Merge**

| Feld | Wert |
| --- | --- |
| Cursor-Anzeigename | **Account plattform audit vorbereitung** |
| Agent | https://cursor.com/agents/bc-01a030a0-d97f-782b-8bd0-acb906563518 |
| Workstream | Account Platform AP-1 |
| Branch | `feat/account-ap1` |
| Draft-PR | https://github.com/Jetnity/jetnity/pull/43 |
| Auftrag | `docs/ACCOUNT_AP1_IMPLEMENTATION_TASK.md` |
| Review | `docs/ACCOUNT_AP1_CHATGPT_REVIEW.md` |
| Entscheidungen | ADR-0152, ADR-0153 |

## Review-Fixes

- aktiv/kommend nur gegen Geräte-Kalendertag; Server klassifiziert diese Lagen nicht
- 503-Text behauptet keinen Speicherstand
- Datumsgrenztests um UTC/lokalen Tageswechsel

## Nicht angefasst

Auth/MFA/AAL, RLS, Migrationen, Guest→Account, Traveller-Registry, Privacy/Billing, Route/Readiness/Safety/Seasonal, Homepage, Workspace-Karten, AP-2.

## Nächster Schritt

Unabhängiger Re-Review von PR #43 auf dem Exact Head mit GitHub Actions CI **und** Vercel Preview. Kein Ready, kein Merge.
