# Jetnity – AP-6a Gate 0 lokale Test-Evidence

Stand: 29. August 2026  
Branch: `audit/ap6a-gate0-legal-foundation-2026-08-29`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/166  
Cursor-Agent: `Account plattform audit vorbereitung 16`  
Cursor-Session/Run-ID: `bc-216be067-b75a-4a2f-a186-8e38c67fb822`

Gegateter Authoring-Head vor diesem Stamp: `dce9ee8c`

| Lauf | Ergebnis |
| --- | --- |
| Focused Gate-0-Inventory | **9/9 pass** (`lib/legal/ap6a-gate0-legal-foundation-inventory.test.ts`) |
| `npm test` | **2564/2564 pass** |
| `npm run typecheck` | pass (`next typegen && tsc`) |
| `npm run lint` | **0 errors / 135 warnings**. Die Warnings sind die bestehende Next-16/React-Compiler-Linie. Neue Legal-Dateien ohne Errors. |
| Hygiene | `check:exports` 699 Dateien / 0 unbegründete Exporte; `check:dead` nur begründete CookieConsent-Ausnahme; `check:deps` sauber; `check:api-schutz` 12/12; `check:schema-bezug` pass |
| `npm run build` | Production-Build Next.js 16.3.3 Turbopack erfolgreich. Routenliste enthält **kein** `/privacy` und **kein** `/terms`. `check:setup` 1 Warning: keine `.env`/`.env.local` in dieser Cloud-Session. |
| `npm run auth:pruefen` | **nicht gelaufen**. Kein Auth-/DB-Slice; kein Secret in dieser Session. Nicht als gelaufen behauptet. |
| Browser / Real-Device | nicht gelaufen, nicht behauptet. Production-404 über `curl` auf dem Alias. |
| GitHub Actions / Vercel Preview | **Exact Head `18516a06`:** Actions Run [`33243096002`](https://github.com/Jetnity/jetnity/actions/runs/33243096002) SUCCESS (Typecheck/Lint/Build + Auth-Konfiguration). GitHub Preview-Deployment `6153897069` success; PR-Check Vercel SUCCESS `jFScFBDbxgkwCRv6h5GqpkDzzchb`. Unauthentifizierter Preview-HTML-Abruf ist SSO-302 (Deployment Protection) — **kein** unabhängiger 404-Beweis auf Preview. Der ältere Inspector `5N3xV4vG4gZy2hbqHPPm6C7R56J5` gehört zu Prior-Head `dce9ee8c` und ist invalidiert. |

Lokales `npm ci` war **nicht** nötig. Lockfile unverändert.

Merge-Base / `origin/main` zum Stamp: `765fc547c2d2ffd8460e05fec4234906103fe73c` (0 behind).

Exact-Head-Gates oben gelten für den Commit dieses Stamps. Kein weiterer Evidence-Stamp, außer dessen CI fehlschlägt.
