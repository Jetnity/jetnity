# Jetnity – Next 16 Compatibility Prep S1 Status

Stand: 28. August 2026  
Status: **IMPLEMENTIERT / DRAFT / SELF-EXPIRING. STOP für unabhängigen Technical-Lead Exact-Head-Review von PR #150. Kein Ready. Kein Merge. Kein S2.**  
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
| Ahead / Behind vor diesem Stamp | **3 / 0** (`c2ae8821`, `9833a4bf`, `822725a6`) |
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

### 1.2 Exact Head

Exact Head ist der Commit dieses Continuity-Stamps. Live an PR #150 prüfen. Implementation-Heads `9833a4bf` und `822725a6` werden durch den Stamp-Commit nachgeschoben.

## 2. Scope / Non-Scope

**Scope gehalten:** async Cookie-Factories + alle Caller; Guest-Quota-Cookie async; identifizierte `params` / Page-`searchParams` / `generateMetadata` Promise-kompatibel auf Next 14; gezielte Regressionstests; Continuity.

**Hard Non-Scope gehalten:** kein Next/React/ESLint/TypeScript-Bump; kein `middleware.ts`→`proxy.ts`; kein ESLint-9/Flat-Config; kein Codemod; keine Vercel-Settings; keine Supabase-Mutation; kein Service-Role-Ausbau; kein AP-7-S2; kein Issue #109/#110; kein S2.

## 3. Fertige Arbeit

1. `createServerComponentClient`, `createRouteHandlerClient`, `createServerActionClient` sind `async` und verwenden `await cookies()`. Cookie-Store-Typ ist `Awaited<ReturnType<typeof cookies>>`. RSC bleibt read-only; Route Handler / Server Actions bleiben mutierbar. Alias `createServerClient` bleibt die async RSC-Factory.
2. Repository-weite Caller-Inventur; alle direkten Aufrufe werden awaited. Kein Default-Parameter mehr, der eine Factory-Promise als Client weiterreicht (`flughafenReferenzLesen`).
3. `gastkennung()` ist async; `kontoId()` awaited die Action-Factory. `jetnity_gast`-Vertrag, cookie-loser Service-Role-Client und Fail-closed bleiben erhalten. Vertragsprüfbarkeit liegt in `lib/modell/gast-cookie.ts`.
4. Request-API-Helfer `leseRequestParam` / `leseOptionalRequestParam` unwrappt Sync und Promise. Angewendet auf Login, Register, Admin-MFA, `/planen` Page + `generateMetadata`, `[tripId]`, `/unauthorized`, Admin Users.
5. `new URL(req.url).searchParams` in Route Handlern unverändert.
6. Adversariale Tests: `lib/next/request-api.test.ts`, `lib/next/request-api-compat.test.ts`, `lib/modell/kontingent-gastkennung.test.ts`; bestehende Robots-/Login-Source-Tests nachgezogen, ohne Key-Präsenz zu verwässern.

## 4. Unfertige Arbeit

- Unabhängiger Technical-Lead Exact-Head-Review von PR #150.
- GitHub Actions / Vercel Preview dieses Stamp-Heads sind Platform-Evidence; der Technical Lead verifiziert sie unabhängig.
- S2 (Framework-Bump) ist **nicht** gestartet.

## 5. Author-Gates dieses Runs

Lokal auf Implementation-Head `822725a6` ausgeführt, unverändert durch den Docs-Stamp:

| Gate | Ergebnis |
| --- | --- |
| `npm ci` | PASS; Lockfile unverändert |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS – No ESLint warnings or errors |
| `npm test` | PASS – **2475** tests, 0 fail |
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

### P2

- `main protected=false` unverändert, Non-Scope.
- Bestehende `as any` in Admin-Users und bestehendes `@ts-ignore` für `cookies().delete` wurden nicht neu eingeführt, bleiben Residual.

### P3

- Sichtbarer Cursor-Titel `Next 16 API compatibility` weicht vom Preferred Title ab.

## 7. Product-Owner-Gates

Für diesen exakt definierten S1-Scope war keine neue PO-Freigabe nötig (PR #149). Alle Sondergates bleiben geschlossen.

## 8. Exakter nächster Schritt

**Unabhängiger ChatGPT / Technical-Lead Exact-Head-Review von Draft-PR #150.**

Kein Ready. Kein Merge. Kein S2. Kein Folgeslice.
