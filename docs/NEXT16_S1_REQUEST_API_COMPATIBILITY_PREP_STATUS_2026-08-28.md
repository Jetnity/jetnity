# Jetnity – Next 16 Compatibility Prep S1 Status

Stand: 28. August 2026  
Status: **REVIEW-FIX / DRAFT / SELF-EXPIRING. STOP für unabhängigen Technical-Lead Exact-Head-Re-Review von PR #150 nach CHANGES REQUIRED `5457641262`. Kein Ready. Kein Merge. Kein S2.**  
Workstream: Ops / Framework Compatibility  
Cursor-Agent: **`Cursor-Agent: Jetnity framework compatibility 1`**  
Preferred visible Cursor title: **`Jetnity framework compatibility 1`**  
Draft-PR: https://github.com/Jetnity/jetnity/pull/150  
Branch: `feat/next16-s1-request-api-compat-prep-2026-08-28`  
Task: `docs/NEXT16_S1_REQUEST_API_COMPATIBILITY_PREP_TASK_2026-08-28.md`

> Live-Evidence gewinnt. Agent-Self-Review ist kein PASS. Der Autor darf niemals Ready setzen oder mergen. Jeder neue Head invalidiert frühere Exact-Head-Gates.

## 0. Naming evidence

| Feld | Wert |
| --- | --- |
| Zugewiesener logischer Name | `Cursor-Agent: Jetnity framework compatibility 1` |
| Preferred visible title | `Jetnity framework compatibility 1` |
| Observed Cursor run title | `Next 16 API compatibility` |
| Cloud-Run | https://cursor.com/agents/bc-29e60ee0-acc7-4a21-ad50-34cf078cdc37 |
| Rename-/Title-Fähigkeit | **keine** in den verfügbaren Cursor-Namespaces (`CreateGoal` / `GenerateImage` / `UpdateGoal` nur) |
| Regel | `docs/JETNITY_CURSOR_VISIBLE_AGENT_NAME_GATE.md` |
| Generation | **1 bleibt 1.** Keine Generation 2 wegen UI-Titel. |

Dieser Agent behauptet nicht, die sichtbare UI sei umbenannt.

## 1. Live-Rekonstruktion vor Handoff

| Feld | Wert |
| --- | --- |
| Repository | `Jetnity/jetnity` |
| `origin/main` Re-Fetch | `2fdf8a18ab99d22a3ba75df7bd8451908593714f` – Merge PR #149 |
| Merge-Base | `2fdf8a18ab99d22a3ba75df7bd8451908593714f` – **kein Baseline-Drift** |
| Ahead / Behind vor diesem Stamp | **5 / 0** (`c2ae8821`, `9833a4bf`, `822725a6`, `dd56e140`, `7cbb273b`) |
| Draft-PR | #150 OPEN / Draft |
| `main` Branch Protection | bekannt `protected=false`; dieser Slice ändert das nicht |
| Supabase | **nicht** mutiert; keine Migration, kein RLS-/Auth-Config-/Datenwrite |
| Vercel project settings | **nicht** mutiert |
| Framework-Dependencies | unverändert `next@14.2.32` / `react@18.2.0` / `react-dom@18.2.0` / `eslint@8.57.1` / `eslint-config-next@14.2.12` / `typescript@^5.0.0` |
| Lockfile | `package-lock.json` **unverändert** gegenüber Baseline |
| Browser / Real-Device | **nein** – keine beabsichtigte UI-/Produktänderung |

### 1.1 Auftragswahrheit / TL-verifizierte Baseline (nicht von diesem Agent live aus Vercel geholt)

| Fakt | Wert | Quelle |
| --- | --- | --- |
| PR #148 Gate 0 | MERGED | Task + `main @ 2fdf8a18` |
| PR #149 Product-Owner-Freigabe | MERGED | Task |
| aktuelle Production | Vercel `dpl_6FBEqSPthrixAsruftjYWw2rVZjY`, READY, exact `main @ 2fdf8a18` | **Task / Technical-Lead-Auftragswahrheit. Dieser Agent hat die Vercel-ID nicht selbst geholt.** |

### 1.2 Review-Fix-Kette

| Head | Rolle |
| --- | --- |
| `9833a4bf` | erste Implementierung; typecheck auf `await sb().from(...)` fehlgeschlagen |
| `822725a6` | `sb()` Await-Fix; **TL-Review-Head** für CHANGES REQUIRED `5457641262` |
| `dd56e140` | erster Continuity-Stamp; beschrieb noch den Union-PageProps-Stand und 2475 Tests |
| `7cbb273b` | Review-Fix: framework-facing Page/Metadata-Props sind `PageRequestParam<T> = Promise<T>` |

Exact Head ist der Commit dieses Continuity-Stamps. Live an PR #150 prüfen. Gates unten wurden auf `7cbb273b` erneut ausgeführt. Vorheriges CI `33209891508` und Preview am Head `822725a6` sind nach diesem Push ungültig.

## 2. Scope / Non-Scope

**Scope gehalten:** async Cookie-Factories + alle Caller; Guest-Quota-Cookie async; identifizierte `params` / Page-`searchParams` / `generateMetadata` auf den Next-16-Vertrag `Promise<T>` vorbereitet (Review-Fix nach `5457641262`); gezielte Regressionstests inkl. Union-Regression; Continuity.

**Hard Non-Scope gehalten:** kein Next/React/ESLint/TypeScript-Bump; kein `middleware.ts`→`proxy.ts`; kein ESLint-9/Flat-Config; kein Codemod; keine Vercel-Settings; keine Supabase-Mutation; kein Service-Role-Ausbau; kein AP-7-S2; kein Issue #109/#110; kein S2.

## 3. Fertige Arbeit

1. `createServerComponentClient`, `createRouteHandlerClient`, `createServerActionClient` sind `async` und verwenden `await cookies()`. Cookie-Store-Typ ist `Awaited<ReturnType<typeof cookies>>`. RSC bleibt read-only; Route Handler / Server Actions bleiben mutierbar. Alias `createServerClient` bleibt die async RSC-Factory.
2. Repository-weite Caller-Inventur; alle direkten Aufrufe werden awaited. Kein Default-Parameter mehr, der eine Factory-Promise als Client weiterreicht (`flughafenReferenzLesen`).
3. `gastkennung()` ist async; `kontoId()` awaited die Action-Factory. `jetnity_gast`-Vertrag, cookie-loser Service-Role-Client und Fail-closed bleiben erhalten. Vertragsprüfbarkeit liegt in `lib/modell/gast-cookie.ts`.
4. Request-API-Helfer `leseRequestParam` / `leseOptionalRequestParam` unwrappt intern weiter `T | Promise<T>`. Die **öffentlichen** Page-/`generateMetadata`-Signaturen sind der Next-16-Vertrag `PageRequestParam<T> = Promise<T>` (nicht `T | Promise<T>`). Angewendet auf Login, Register, Admin-MFA, `/planen` Page + `generateMetadata`, `[tripId]`, `/unauthorized`, Admin Users. Optionality (`?`) bleibt dort, wo die Route Abwesenheit erlaubt.
5. `new URL(req.url).searchParams` in Route Handlern unverändert.
6. Adversariale Tests: `lib/next/request-api.test.ts`, `lib/next/request-api-compat.test.ts`, `lib/modell/kontingent-gastkennung.test.ts`; bestehende Robots-/Login-Source-Tests nachgezogen, ohne Key-Präsenz zu verwässern.

## 4. Unfertige Arbeit

- Unabhängiger Technical-Lead Exact-Head-**Re-Review** von PR #150 nach CHANGES REQUIRED `5457641262`.
- GitHub Actions / Vercel Preview dieses Stamp-Heads sind Platform-Evidence; der Technical Lead verifiziert sie unabhängig. Vorherige Exact-Head-Gates sind ungültig.
- S2 (Framework-Bump) ist **nicht** gestartet.

## 5. Author-Gates dieses Runs

Lokal auf Review-Fix-Head `7cbb273b` erneut ausgeführt, unverändert durch den Docs-Stamp:

| Gate | Ergebnis |
| --- | --- |
| `npm ci` | PASS; Lockfile unverändert |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS – No ESLint warnings or errors |
| `npm test` | PASS – **2478** tests, 0 fail (vorher 2475; +3 Promise-Contract-Regressionen) |
| `npm run check:dead` | PASS |
| `npm run check:exports` | PASS |
| `npm run check:deps` | PASS |
| `npm run check:api-schutz` | PASS |
| `npm run check:schema-bezug` | PASS |
| `npm run build` | PASS – Next.js 14.2.32 Production-Build |

Gezielt separat: `lib/next/request-api.test.ts`, `lib/next/request-api-compat.test.ts`, `lib/modell/kontingent-gastkennung.test.ts`, `lib/seo/index-grenze.test.ts`, `lib/seo/oeffentliche-metadata.test.ts`, `lib/auth/anmelde-gatter.test.ts`, `lib/auth/naechstes-ziel.test.ts` – PASS.

## 6. Risiken

### P0

Kein neu entdeckter P0.

### P1

- Auth-/Cookie-Regression trotz grüner Tests, wenn Preview/SSR Cookie-Refresh anders verhält als Unit-Source-Scans.
- `/planen` Robots bleibt P1, bis Exact-Head Preview die Metadata-Grenze bestätigt.
- Der P1-Fund aus `5457641262` (öffentliche PageProps als `T | Promise<T>`) ist im Review-Fix `7cbb273b` geschlossen. Residual: erst S2 beweist die generierte Next-16-`PageProps`-Constraint; S1 bereitet den Vertrag vor, kompiliert aber weiter auf Next 14.

### P2

- `main protected=false` unverändert, Non-Scope.
- Bestehende `as any` in Admin-Users und bestehendes `@ts-ignore` für `cookies().delete` wurden nicht neu eingeführt, bleiben Residual.

### P3

- Sichtbarer Cursor-Titel `Next 16 API compatibility` weicht vom Preferred Title ab.

## 7. Product-Owner-Gates

Für diesen exakt definierten S1-Scope war keine neue PO-Freigabe nötig (PR #149). Alle Sondergates bleiben geschlossen.

## 8. Exakter nächster Schritt

**Unabhängiger ChatGPT / Technical-Lead Exact-Head-Re-Review von Draft-PR #150.**

Vorheriger Review-Head `822725a6` / Kommentar `5457641262` ist nach diesem Push ungültig. Kein Ready. Kein Merge. Kein S2. Kein Folgeslice.
