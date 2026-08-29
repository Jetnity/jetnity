# Jetnity – AP-5-S4 lokale Test-Evidence

Stand: 29. August 2026  
Branch: `feat/ap5-s4-account-security-mfa-step-up-2026-08-29`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/159  
Cursor-Agent: `Account plattform audit vorbereitung 14`  
Cursor-Session/Run-ID: `bc-d8fd980a-b4e5-43e1-8a38-a1480fd65132`

| Lauf | Ergebnis |
| --- | --- |
| Focused S4-Unit | **22/22 pass** (`lib/auth/account-mfa-step-up.test.ts`) |
| S4 Vertrag/A11y | **5/5 pass** (`lib/auth/ap5-s4-mfa-step-up.test.ts`) |
| Focused inkl. Gate-0/S1/S3/Fehler-Regression | **49/49 pass** |
| `npm test` | **2538/2538 pass** |
| `npm run typecheck` | pass (`next typegen && tsc`) |
| `npm run lint` | **0 errors / 133 warnings**; S4-Dateien selbst keine neuen Errors. Die Warnings sind die bestehende Next-16/React-Compiler-Linie, inkl. vorbestehendem `setBrowserWebAuthn`-Hinweis in `SecurityMFA.tsx`. |
| Hygiene | `check:exports` 693 Dateien / 0 unbegründete Exporte; `check:dead` nur begründete CookieConsent-Ausnahme; `check:deps` sauber; `check:api-schutz` 12/12; `check:schema-bezug` pass |
| `npm run auth:pruefen` | **55/55**, 242 Schlüssel, Passwortregel = config.toml |
| `npm run build` | Production-Build Next.js 16.3.3 Turbopack erfolgreich; `/account/security` dynamisch. `check:setup` 1 Warning: keine `.env`/`.env.local` in dieser Cloud-Session. |
| Browser / Real-Device | nicht gelaufen, nicht behauptet – `/account/security` ist auth-gated; kein Testkonto in dieser Session |
| GitHub Actions / Vercel Preview | Exact Head `97a8f7b9`: Actions Run `33223840410` SUCCESS; Vercel Inspector `8R8iDdugyWM5HjL3Z1C81gtZFCBB` SUCCESS; GitHub Preview-Deployment `6150698033` success. Frühere Heads `3499f165` / `6e8c99bc` sind supersediert (`check:exports` auf `aalStufeLesen`; danach unexportiert). |

Lokales `npm ci` war **nicht** nötig. Das Cloud-`node_modules` war bereits Next 16.3.3 / ESLint 9.39.5. Lockfile wurde nicht verändert.

Exact-Head-Gates oben gelten für `97a8f7b9`. Dieser Stamp erzeugt einen neueren Head. Kein weiterer Evidence-Stamp, außer dessen CI fehlschlägt.
