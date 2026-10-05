# Jetnity – AP-5-S4 lokale Test-Evidence

Stand: 29. August 2026  
Branch: `feat/ap5-s4-account-security-mfa-step-up-2026-08-29`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/159  
Cursor-Agent: `Account plattform audit vorbereitung 14`  
Cursor-Session/Run-ID: `bc-d8fd980a-b4e5-43e1-8a38-a1480fd65132`

| Lauf | Ergebnis |
| --- | --- |
| Focused S4-Unit | **27/27 pass** (`lib/auth/account-mfa-step-up.test.ts`) |
| S4 Vertrag/A11y | **5/5 pass** (`lib/auth/ap5-s4-mfa-step-up.test.ts`) |
| `npm test` | **2543/2543 pass** |
| `npm run typecheck` | pass (`next typegen && tsc`) |
| `npm run lint` | **0 errors / 133 warnings**; S4-Dateien selbst keine neuen Errors. Die Warnings sind die bestehende Next-16/React-Compiler-Linie, inkl. vorbestehendem `setBrowserWebAuthn`-Hinweis in `SecurityMFA.tsx`. |
| Hygiene | `check:exports` 693 Dateien / 0 unbegründete Exporte; `check:dead` nur begründete CookieConsent-Ausnahme; `check:deps` sauber; `check:api-schutz` 12/12; `check:schema-bezug` pass |
| `npm run auth:pruefen` | **55/55**, 242 Schlüssel, Passwortregel = config.toml |
| `npm run build` | Production-Build Next.js 16.3.3 Turbopack erfolgreich; `/account/security` dynamisch. `check:setup` 1 Warning: keine `.env`/`.env.local` in dieser Cloud-Session. |
| Browser / Real-Device | nicht gelaufen, nicht behauptet – `/account/security` ist auth-gated; kein Testkonto in dieser Session |
| GitHub Actions / Vercel Preview | Exact Head `c503dbf28ee4ad47f96646b402e701e1d2d9cfc4`: Actions Run [`33224797456`](https://github.com/Jetnity/jetnity/actions/runs/33224797456) SUCCESS; Vercel Inspector [`3sMqKGDKPXmNn7nE8UfGcf1Jpmou`](https://vercel.com/jetnity-e1b93c82/jetnity-app/3sMqKGDKPXmNn7nE8UfGcf1Jpmou) READY; GitHub Preview-Deployment `6150849393` success. Preview-Alias `https://jetnity-app-git-feat-ap5-s4-account-sec-434482-jetnity-e1b93c82.vercel.app` |

Lokales `npm ci` war **nicht** nötig. Das Cloud-`node_modules` war bereits Next 16.3.3 / ESLint 9.39.5. Lockfile wurde nicht verändert.

Review-Fix schließt P1 Session/AAL-Reconcile und P2 Challenge-Faktor-Auswahl.

Exact-Head-Gates oben gelten für `c503dbf28ee4ad47f96646b402e701e1d2d9cfc4`. Dieser Stamp erzeugt einen neueren Head. Kein weiterer Evidence-Stamp, außer dessen CI fehlschlägt.
