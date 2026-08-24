# Jetnity Account AP-2 – Status

Stand: 24. August 2026  
Status: **implementiert und lokal/remote gegated – Draft, kein Ready, kein Merge, kein AP-3**

| Feld | Wert |
| --- | --- |
| Cursor-Anzeigename | **Account plattform audit vorbereitung** |
| Branch | `feat/account-ap2` |
| Draft-PR | https://github.com/Jetnity/jetnity/pull/48 |
| Base | `feat/account-ap1` @ `9cc9b0526683f161f500326a7b72c74abac9c296` |
| Auftrag | `docs/ACCOUNT_AP2_AUTH_UX_TASK.md` |
| **Runtime-Head** | `7683503ea001b7212e15c0d00a3cfa1a106082ad` |
| Docs-only-Head | der nachfolgende Docs-Commit auf diesem Branch; **nicht** das CI-/Preview-Gate |

## Remote-Gates auf dem Runtime-Head

Genau `7683503ea001b7212e15c0d00a3cfa1a106082ad`:

- GitHub Actions CI: **SUCCESS** – https://github.com/Jetnity/jetnity/actions/runs/32711856720
- Vercel Preview: **success / completed** – https://vercel.com/jetnity-e1b93c82/jetnity-app/EHPAaQaJDSPSFdKD7c4eDSQZwaY8
- Preview-URL: https://jetnity-4sm1dl435-jetnity-e1b93c82.vercel.app

PR #48 bleibt Draft. Kein Mark Ready. Kein Merge.

## Lokale Gates auf dem Runtime-Head

Ausgeführt vor dem Docs-Commit:

- AP-2- und AP-1-Account-Tests: grün
- `npm test`: 1750/1750 grün
- `npm run typecheck`: grün
- `npm run lint`: keine Warnungen/Fehler
- `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`: grün
- `npm run auth:pruefen`: 55 erwartete Werte stimmen
- `npm run build`: Production-Build grün
- `npm run audit:account`: 48/48 grün (`AUDIT_PORT=3462`)

## Scope-Ergebnis

| Slice | Ergebnis |
| --- | --- |
| A OAuth nur bei Enablement | Schaltflächen nur bei `auth.external.{google,apple}.enabled === true`. Repository-`config.toml` bleibt aus. |
| B `next`-Allowlist | Zentral in `erlaubtesNaechstesZiel()`. Fail-closed auf `/reisen`. |
| C Login/Register-Gate | `getUser()` + `anmeldeSeiteZiel()`. Kein `getSession()` auf den Server-Seiten. |
| D Register-Enumeration | Neutrale Public-Copy, keine „bereits registriert“- und keine unbewiesene Versandbehauptung. |
| E Gast `/reisen` | Primär **Reise fortsetzen** nur bei `gastspeicher.aktiv`. Sonst kein Fortsetzen. |
| F Footer | `sitzungseintraege()` statt hartem Anmelden/Registrieren. |
| G MFA-Dialog | Name/Beschreibung, Fokus, Tab-Falle, Escape schliesst nicht, 44px-Ziele. Kein MFA-/AAL-Vertragswechsel. |

## Nicht enthalten

Keine DB/Migration/RLS, keine Consent-Persistenz, keine Traveller-Registry, keine Guest→Account-Vertragsänderung, keine Provider-Aktivierung, keine Legal-Texte, kein AP-3, kein Homepage-Redesign.

## Nächster Schritt

Unabhängiger ChatGPT/Technical-Lead-Review von Draft-PR #48. Kein AP-3.
