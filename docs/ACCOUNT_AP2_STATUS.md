# Jetnity Account AP-2 – Status

Stand: 24. August 2026  
Status: **PASS / TECHNICAL CLOSURE – Draft, kein Ready, kein Merge, kein AP-3**

| Feld | Wert |
| --- | --- |
| Cursor-Anzeigename | **Account plattform audit vorbereitung** |
| Branch | `feat/account-ap2` |
| Draft-PR | https://github.com/Jetnity/jetnity/pull/48 |
| Base | `feat/account-ap1` @ `9cc9b0526683f161f500326a7b72c74abac9c296` |
| Auftrag | `docs/ACCOUNT_AP2_AUTH_UX_TASK.md` + `docs/ACCOUNT_AP2_B1_FIX_TASK.md` |
| **Runtime-Head** | `e9b2f834edc925b12e8b5a667f0e4382642eae8f` |
| Technical Closure | `docs/ACCOUNT_AP2_TECHNICAL_CLOSURE.md` |

## Technical-Lead-Verdict

AP2-B1 ist im unabhängigen Re-Review geschlossen. Bestandskonto-neutralisiert und neuer Signup ohne Session erzeugen denselben öffentlichen Post-Submit-Zustand. Kein neuer konkreter Truth-/Security-/Auth-/DB-/RLS-Defekt im freigegebenen AP-2-Scope gefunden.

## Remote-Gates auf dem Runtime-Head

Genau `e9b2f834edc925b12e8b5a667f0e4382642eae8f`:

- GitHub Actions CI: **SUCCESS** – Run `32714001669`
- Vercel Preview: **success / completed** – Deployment `G9JnPhBkhejRetPcTMJm82AXeAZn`

PR #48 bleibt Draft. Kein Mark Ready. Kein Merge.

## Lokale Gates des Implementierungsagents

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
| D Register-Enumeration | Neutrale Public-Copy **und** identischer öffentlicher Post-Submit-Zustand; AP2-B1 geschlossen. |
| E Gast `/reisen` | Primär **Reise fortsetzen** nur bei `gastspeicher.aktiv`. |
| F Footer | `sitzungseintraege()` statt hartem Anmelden/Registrieren. |
| G MFA-Dialog | Name/Beschreibung, Fokus, Tab-Falle, Escape schliesst nicht, 44px-Ziele. Kein MFA-/AAL-Vertragswechsel. |

## Nicht enthalten

Keine DB/Migration/RLS, keine Consent-Persistenz, keine Traveller-Registry, keine Guest→Account-Vertragsänderung, keine Provider-Aktivierung, keine Legal-Texte, kein AP-3, kein Homepage-Redesign.

## Nächster Schritt

Product-Owner-Entscheidung zur Integrationsreihenfolge. AP-1 / PR #43 ist weiterhin Draft und ungemergt; AP-2 bleibt deshalb ebenfalls Draft. Kein AP-3 ohne neuen Auftrag.
