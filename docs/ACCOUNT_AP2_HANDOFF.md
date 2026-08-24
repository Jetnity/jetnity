# Jetnity Account Platform – AP-2 Handoff

Stand: 24. August 2026  
Status: **AP2-B1 behoben und gegated – Draft, kein Mark Ready, kein Merge, kein AP-3**

| Feld | Wert |
| --- | --- |
| Cursor-Anzeigename | **Account plattform audit vorbereitung** |
| Agent | https://cursor.com/agents/bc-01a030a0-d97f-782b-8bd0-acb906563518 |
| Workstream | Account Platform AP-2 |
| Branch | `feat/account-ap2` |
| Draft-PR | https://github.com/Jetnity/jetnity/pull/48 |
| Stack-Basis | `feat/account-ap1` @ `9cc9b0526683f161f500326a7b72c74abac9c296` |
| Auftrag | `docs/ACCOUNT_AP2_AUTH_UX_TASK.md` + `docs/ACCOUNT_AP2_B1_FIX_TASK.md` |
| Runtime-Head | `e9b2f834edc925b12e8b5a667f0e4382642eae8f` |
| Self-Review | `docs/ACCOUNT_AP2_SELF_REVIEW.md` |

## Was ein neuer Agent zuerst liest

1. `docs/ACCOUNT_AP2_B1_FIX_TASK.md`
2. `docs/ACCOUNT_AP2_AUTH_UX_TASK.md`
3. `docs/ACCOUNT_AP2_STATUS.md`
4. `docs/ACCOUNT_AP2_SELF_REVIEW.md`
5. `docs/ACTIVE_WORK_STATUS.md` auf diesem Branch
6. Draft-PR #48, Base `feat/account-ap1`

## Runtime vs. Docs-Head

- **Gegates Runtime-Head:** `e9b2f834edc925b12e8b5a667f0e4382642eae8f`
  - GitHub Actions: SUCCESS (`32714001669`)
  - Vercel Preview: success (`G9JnPhBkhejRetPcTMJm82AXeAZn`)
- Ein nachfolgender Docs-Commit ist **docs-only** und darf nicht als neues CI-/Preview-Gate ausgegeben werden.

## Umgesetzt

- OAuth-UI folgt nur `config.toml` `auth.external.*.enabled === true`.
- `next` nur unter `/account*` und `/reisen*`; sonst `/reisen`.
- Login/Register-Serverseiten nutzen `getUser()`.
- Register-Public-Copy leakt Kontoexistenz nicht und behauptet keinen unbewiesenen Mailversand.
- AP2-B1: Bestandskonto-neutralisiert und neuer Signup ohne Session teilen denselben geleerten Feldzustand, dieselbe Success-Copy und denselben Fokus auf `#register-erfolg`.
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

Unabhängiger Technical-Lead-Re-Review von PR #48 auf Runtime-Head `e9b2f834`.  
PR bleibt Draft. Kein Ready, kein Merge, kein Start von AP-3.
