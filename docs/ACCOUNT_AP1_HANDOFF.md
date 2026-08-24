# Jetnity Account Platform – AP-1 Handoff

Stand: 24. August 2026  
Status: **AP-1 implementiert – Draft, kein Mark Ready, kein Merge**

| Feld | Wert |
| --- | --- |
| Cursor-Anzeigename | **Account plattform audit vorbereitung** |
| Agent | https://cursor.com/agents/bc-01a030a0-d97f-782b-8bd0-acb906563518 |
| Workstream | Account Platform AP-1 |
| Branch | `feat/account-ap1` |
| Draft-PR | https://github.com/Jetnity/jetnity/pull/43 |
| Auftrag | `docs/ACCOUNT_AP1_IMPLEMENTATION_TASK.md` |

## Umgesetzt

- Account-Shell: `app/account/layout.tsx` mit PublicNavbar, kompakter Konto-Nav, Footer, Skip-Link
- `/account` Übersicht aus `reisenLaden()`: Begrüssung, nächste/aktive Reise, Fortsetzen, Empty ≠ Error
- Navbar-Link **Konto** nur bei `sitzung === konto`
- `/account/settings` macht `/account/security` auffindbar
- Security-Seite an Jetnity-V2-Chrome angeglichen
- UI-Audit-Harness `/ui-audit/account`

## Nicht angefasst

Auth/MFA/AAL, RLS, Migrationen, Guest→Account, Traveller-Registry, Privacy/Billing, Route/Readiness/Safety/Seasonal, Homepage, Workspace-Karten.

## Nächster Schritt

Unabhängiger Lead-Review von PR #43. AP-2 erst nach Freigabe. Kein Ready, kein Merge.
