# Jetnity – AP-5-S3 lokale Test-Evidence

Stand: 29. August 2026  
Branch: `feat/ap5-s3-account-security-logout-scopes-2026-08-29`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/156

| Lauf | Ergebnis |
| --- | --- |
| Focused S3-Unit | **15/15 pass** (`lib/auth/account-logout-scopes.test.ts`) |
| S3 Vertrag/A11y | **5/5 pass** (`lib/auth/ap5-s3-logout-scopes.test.ts`) |
| Gate-0-Inventory | **8/8 pass** |
| S1/S2-Regression | pass (`ap5-s1-security-ui`, `ap5-s2-password-aenderung`, `account-password-aenderung`) |
| `npm test` | **2511/2511 pass** |
| `npm run typecheck` | pass (`next typegen && tsc`) |
| `npm run lint` | **0 errors / 133 warnings**; S3-Dateien selbst 0 findings. Die Warnings sind die bestehende Next-16/React-Compiler-Linie. |
| Hygiene | `check:exports` 689 Dateien / 0 unbegründete Exporte; `check:dead` nur begründete CookieConsent-Ausnahme; `check:deps` sauber; `check:api-schutz` 12/12; `check:schema-bezug` pass |
| `npm run auth:pruefen` | **55/55**, 242 Schlüssel, Passwortregel = config.toml |
| `npm run build` | Production-Build Next.js 16.3.3 Turbopack erfolgreich; `/account/security` dynamisch |
| Browser / Real-Device | nicht gelaufen, nicht behauptet – `/account/security` ist auth-gated; kein Testkonto in dieser Session |
| GitHub Actions / Vercel Preview | live am Exact Head prüfen; dieser File erfindet keine IDs |

Lokales `npm ci` war nötig, weil das Cloud-Snapshot-`node_modules` noch Next 14.2.32 / ESLint 8.57.1 enthielt. Lockfile wurde nicht verändert.

Dieser Stamp erzeugt einen neueren Head. Kein zweiter Evidence-Stamp, außer dessen lokale Gates oder CI fehlschlagen.
