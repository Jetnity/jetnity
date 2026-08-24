# Jetnity Account Platform – AP-2 Handoff

Stand: 24. August 2026  
Status: **AP-2 implementiert und gegated – Draft, kein Mark Ready, kein Merge, kein AP-3**

| Feld | Wert |
| --- | --- |
| Cursor-Anzeigename | **Account plattform audit vorbereitung** |
| Agent | https://cursor.com/agents/bc-01a030a0-d97f-782b-8bd0-acb906563518 |
| Workstream | Account Platform AP-2 |
| Branch | `feat/account-ap2` |
| Draft-PR | https://github.com/Jetnity/jetnity/pull/48 |
| Stack-Basis | `feat/account-ap1` @ `9cc9b0526683f161f500326a7b72c74abac9c296` |
| Auftrag | `docs/ACCOUNT_AP2_AUTH_UX_TASK.md` |
| Runtime-Head | `7683503ea001b7212e15c0d00a3cfa1a106082ad` |
| Self-Review | `docs/ACCOUNT_AP2_SELF_REVIEW.md` |

## Was ein neuer Agent zuerst liest

1. `docs/ACCOUNT_AP2_AUTH_UX_TASK.md`
2. `docs/ACCOUNT_AP2_STATUS.md`
3. `docs/ACCOUNT_AP2_SELF_REVIEW.md`
4. `docs/ACTIVE_WORK_STATUS.md` auf diesem Branch
5. Draft-PR #48, Base `feat/account-ap1`

## Runtime vs. Docs-Head

- **Gegates Runtime-Head:** `7683503ea001b7212e15c0d00a3cfa1a106082ad`
  - GitHub Actions: SUCCESS (`32711856720`)
  - Vercel Preview: success (`EHPAaQaJDSPSFdKD7c4eDSQZwaY8`)
- Ein nachfolgender Docs-Commit ist **docs-only** und darf nicht als neues CI-/Preview-Gate ausgegeben werden.

## Umgesetzt

- OAuth-UI folgt nur `config.toml` `auth.external.*.enabled === true`.
- `next` nur unter `/account*` und `/reisen*`; sonst `/reisen`.
- Login/Register-Serverseiten nutzen `getUser()`.
- Register-Public-Copy leakt Kontoexistenz nicht und behauptet keinen unbewiesenen Mailversand.
- Gast mit aktivem Local-Draft sieht **Reise fortsetzen** als primären CTA.
- Footer nutzt `sitzungseintraege()`.
- MFA-TOTP-Dialog ist benannt, fokussierbar und per Tastatur bedienbar; Escape schliesst den Sicherheitsflow nicht.

## Nicht angefasst

DB/Migration/RLS, Consent-Write, Traveller-Registry, Guest→Account-Persistenz, Payment, Provider-Aktivierung, OAuth-Secrets, Production-Redirect-Push, Admin, Homepage, Route/Readiness/Safety/Seasonal, AP-3, neue AGB-/Datenschutztexte.

## Offene, ehrliche Restpunkte

- Gastübernahme bleibt auf `/reisen`. Ein erlaubtes `next=/account` verschiebt die Übernahme, bis `/reisen` besucht wird. Das ist der bestehende Übernahmeort, kein neuer Vertrag.
- Footer zeigt für Gäste nur **Anmelden** (`sitzungseintraege('gast')`), nicht mehr hartes Registrieren.
- MFA-Dialog hat keinen separaten Browser-/Screenreader-Lauf. Geprüft: Quellvertrag + Account-UI-Audit der Shell.
- OAuth-Anbieter bleiben in `config.toml` aus. Es wurde kein Provider aktiviert.

## Nächster Schritt

Unabhängiger Technical-Lead-Review von PR #48 auf dem Runtime-Head.  
PR bleibt Draft. Kein Ready, kein Merge, kein Start von AP-3.
