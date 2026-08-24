# Jetnity Account AP-2 – Status

Stand: 24. August 2026  
Status: **AP2-B1 behoben und gegated – Draft, kein Ready, kein Merge, kein AP-3**

| Feld | Wert |
| --- | --- |
| Cursor-Anzeigename | **Account plattform audit vorbereitung** |
| Branch | `feat/account-ap2` |
| Draft-PR | https://github.com/Jetnity/jetnity/pull/48 |
| Base | `feat/account-ap1` @ `9cc9b0526683f161f500326a7b72c74abac9c296` |
| Auftrag | `docs/ACCOUNT_AP2_AUTH_UX_TASK.md` + `docs/ACCOUNT_AP2_B1_FIX_TASK.md` |
| **Runtime-Head** | `e9b2f834edc925b12e8b5a667f0e4382642eae8f` |
| Docs-only-Head | der nachfolgende Docs-Commit auf diesem Branch; **nicht** das CI-/Preview-Gate |

## Remote-Gates auf dem Runtime-Head

Genau `e9b2f834edc925b12e8b5a667f0e4382642eae8f`:

- GitHub Actions CI: **SUCCESS** – https://github.com/Jetnity/jetnity/actions/runs/32714001669
- Vercel Preview: **success / completed** – https://vercel.com/jetnity-e1b93c82/jetnity-app/G9JnPhBkhejRetPcTMJm82AXeAZn
- Preview-URL: https://jetnity-q9e4xkd8q-jetnity-e1b93c82.vercel.app

PR #48 bleibt Draft. Kein Mark Ready. Kein Merge.

## Lokale Gates auf dem Runtime-Head

Ausgeführt vor dem Docs-Commit:

- AP-2-Regressionen inklusive AP2-B1-Outcome-Tests: grün
- `npm test`: 1754/1754 grün
- `npm run typecheck`: grün
- `npm run lint`: keine Warnungen/Fehler
- `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`: grün
- `npm run auth:pruefen`: 55 erwartete Werte stimmen
- `npm run build`: Production-Build grün
- `npm run audit:account`: 48/48 grün (`AUDIT_PORT=3463`)

## Scope-Ergebnis

| Slice | Ergebnis |
| --- | --- |
| A OAuth nur bei Enablement | Schaltflächen nur bei `auth.external.{google,apple}.enabled === true`. Repository-`config.toml` bleibt aus. |
| B `next`-Allowlist | Zentral in `erlaubtesNaechstesZiel()`. Fail-closed auf `/reisen`. |
| C Login/Register-Gate | `getUser()` + `anmeldeSeiteZiel()`. Kein `getSession()` auf den Server-Seiten. |
| D Register-Enumeration | Neutrale Public-Copy **und** identischer öffentlicher Post-Submit-Zustand (AP2-B1). |
| E Gast `/reisen` | Primär **Reise fortsetzen** nur bei `gastspeicher.aktiv`. Sonst kein Fortsetzen. |
| F Footer | `sitzungseintraege()` statt hartem Anmelden/Registrieren. |
| G MFA-Dialog | Name/Beschreibung, Fokus, Tab-Falle, Escape schliesst nicht, 44px-Ziele. Kein MFA-/AAL-Vertragswechsel. |

## Nicht enthalten

Keine DB/Migration/RLS, keine Consent-Persistenz, keine Traveller-Registry, keine Guest→Account-Vertragsänderung, keine Provider-Aktivierung, keine Legal-Texte, kein AP-3, kein Homepage-Redesign.

## Nächster Schritt

Unabhängiger Technical-Lead-Re-Review von Draft-PR #48 auf `e9b2f834`. Kein AP-3.
