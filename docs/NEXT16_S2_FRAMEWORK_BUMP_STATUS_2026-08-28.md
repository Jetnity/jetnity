# Jetnity – Next 16 S2 Framework Bump Status

Stand: 28. August 2026  
Status: **REVIEW-FIX / DRAFT / SELF-EXPIRING. STOP für unabhängigen Technical-Lead Exact-Head-Re-Review von PR #151 nach CHANGES REQUIRED `5055372760`. Kein Ready. Kein Merge. Kein S3.**  
Workstream: Ops / Framework Compatibility  
Cursor-Agent: **`Cursor-Agent: Jetnity framework compatibility 2`**  
Preferred visible Cursor title: **`Jetnity framework compatibility 2`**  
Draft-PR: https://github.com/Jetnity/jetnity/pull/151  
Branch: `feat/next16-s2-framework-bump-2026-08-28`  
Task: `docs/NEXT16_S2_FRAMEWORK_BUMP_TASK_2026-08-28.md`

> Live-Evidence gewinnt. Agent-Self-Review ist kein PASS. Der Autor darf niemals Ready setzen oder mergen. Jeder neue Head invalidiert frühere Exact-Head-Gates.

## 0. Naming evidence

| Feld | Wert |
| --- | --- |
| Zugewiesener logischer Name | `Cursor-Agent: Jetnity framework compatibility 2` |
| Preferred visible title | `Jetnity framework compatibility 2` |
| Observed Cursor run title | `Jetnity framework bump` |
| Cloud-Run | https://cursor.com/agents/bc-ddde1a19-b2c8-420d-916a-db4e31a3aca3 |
| Rename-/Title-Fähigkeit | **keine** in den verfügbaren Cursor-Namespaces (`CreateGoal` / `GenerateImage` / `UpdateGoal` nur) |
| Regel | `docs/JETNITY_CURSOR_VISIBLE_AGENT_NAME_GATE.md` |
| Generation | **2 bleibt 2.** Unmittelbare Review-Fixes bleiben dieselbe Session. |

Dieser Agent behauptet nicht, die sichtbare UI sei umbenannt. Ein UI-Titel-Mismatch ist kein Blocker.

## 1. Live-Rekonstruktion vor Handoff

| Feld | Wert |
| --- | --- |
| Repository | `Jetnity/jetnity` |
| `origin/main` Re-Fetch | `d7f02f77c0796b0ec04675191742049a222cfab9` – Merge PR #150 |
| Merge-Base | `d7f02f77c0796b0ec04675191742049a222cfab9` – **kein Baseline-Drift** |
| Ahead / Behind vor diesem Stamp | **10 / 0** inkl. Review-Fix `5e98a38e`; Exact Head ist der Commit dieses Stamps |
| Draft-PR | #151 OPEN / Draft |
| `main` Branch Protection | bekannt `protected=false`; dieser Slice ändert das nicht |
| Supabase | **nicht** mutiert; keine Migration, kein RLS-/Auth-Config-/Datenwrite |
| Vercel project settings | **nicht** mutiert |
| Framework-Dependencies | `next@16.3.3` / `react@19.2.8` / `react-dom@19.2.8` / `eslint@9.39.5` / `eslint-config-next@16.3.3` / `typescript@5.9.3` |
| Lockfile | `package-lock.json` auf die S2-Linie angehoben, ohne `--force` / `--legacy-peer-deps` |
| Browser / Real-Device | **nein** – keine beabsichtigte UI-/Produktänderung |

### 1.1 Auftragswahrheit / TL-verifizierte Baseline (nicht von diesem Agent live aus Vercel geholt)

| Fakt | Wert | Quelle |
| --- | --- | --- |
| PR #148 Gate 0 | MERGED | Task + `main @ d7f02f77` |
| PR #149 Product-Owner-Freigabe | MERGED; autorisiert S2 | `docs/NEXT16_PRODUCT_OWNER_APPROVAL_2026-08-28.md` |
| PR #150 / S1 | MERGED | Task |
| Post-Merge GitHub Actions | `33211372214` SUCCESS auf exact baseline | Task / TL-Auftragswahrheit |
| aktuelle Production | Vercel `dpl_2auCtkwfir4bU8mhohaWPyBi3oqu`, READY, exact `main @ d7f02f77` | **Task / Technical-Lead-Auftragswahrheit. Dieser Agent hat die Vercel-ID nicht selbst geholt.** |

### 1.2 Implementierungskette

| Head | Rolle |
| --- | --- |
| `bd0e95dd` | S2 Task-Docs auf Baseline |
| `ff1758b0` | Dependency-Bump Next 16.3.3 + React 19.2.8 + ESLint 9.39.5 + TS 5.9.3 |
| `a530f335` | Flat Config + `next lint` entfernt |
| `80ad4b26` | `middleware.ts` → `proxy.ts` |
| `30629393` | notwendige Next-16-/React-19-Kompatibilitätsfixes |
| `dd30ac44` | Proxy-/Framework-Vertrags-Tests |
| `d1cc78d2` | Proxy-Assertions auf ausführbare Muster statt Kommentartext |
| `0bb271bf` | `next typegen` vor `tsc`; Next-16-`next-env.d.ts` / `tsconfig.json` |
| `b73af1c2` | erster Continuity-Stamp; **TL-Review-Head** für CHANGES REQUIRED `5055372760` |
| `5e98a38e` | Review-Fix: öffentliche Fehler-ID ohne `#unbekannt`; `useId()`-Fallback |
| Stamp-Head | Continuity dieses Commits; live an PR #151 prüfen |

Exact Head ist der Commit dieses Continuity-Stamps. Live an PR #151 prüfen. Gates unten wurden auf Review-Fix `5e98a38e` erneut ausgeführt. Vorheriges CI `33213588571` und Preview `8VaZHuL6ATtC2VRZfBwGpYVqzNyB` am Head `b73af1c2` sind nach diesem Push ungültig.

## 2. Scope / Non-Scope

**Scope gehalten:** tatsächlicher Framework-Bump auf Next 16.3.3; kompatible React-19.2-/Types-/ESLint-/TypeScript-Linie; ESLint CLI + Flat Config; `proxy.ts`; notwendige Next-16-Config- und React-19-Kompatibilität; gezielte Regressionstests; Continuity/ADR.

**Hard Non-Scope gehalten:** keine Supabase-/Auth-/RLS-/Schema-Mutation; kein AP-7-S2; keine Passport-/MRZ-/Biometrie-Arbeit; keine Provider-live-/Secret-/Paid-Calls; keine Payments; keine Vercel-Projekt-/Env-/Domain-Mutation; keine Branch Protection; kein Public Launch; kein PR-#88-/Issue-#109/#110-Cleanup; keine Cache-Components-/PPR-/React-Compiler-Aktivierung; kein Produkt-/UI-Redesign; kein S3.

## 3. Exakte installierte Versionen und warum

Live unmittelbar vor Installation gegen Registry/Peers geprüft. Keine Canary/Prerelease. Kein `--force` / `--legacy-peer-deps`.

| Paket | Version | Begründung |
| --- | --- | --- |
| `next` | **16.3.3** | Active LTS / aktueller Security-Patch; Task-Ziel exakt |
| `eslint-config-next` | **16.3.3** | exakt zur Next-Linie |
| `react` / `react-dom` | **19.2.8** | aktuelle stabile 19.2.x-Linie, peer-kompatibel mit Next 16.3.3 |
| `@types/react` | **19.2.18** | aktuelle 19.2-Types |
| `@types/react-dom` | **19.2.5** | aktuelle 19.2-Types |
| `eslint` | **9.39.5** | kompatibel mit `eslint-config-next@16.3.3`. ESLint 10.x bricht `eslint-plugin-react` (`getFilename is not a function`). npm markiert 9.39.5 deprecated; S2 bleibt bewusst auf der 9.x-Linie |
| `typescript` | **5.9.3** | stabile Next-16-kompatible Linie (Minimum 5.1.0). Kein Sprung auf TypeScript 7 |

`npm ls` auf dem Autor-Head: direkte Pakete wie oben, keine Peer-Fehler. Optionale Plattform-Bindings bleiben optional.

## 4. Fertige Arbeit

1. Framework-Linie auf Next 16.3.3 + React 19.2.8 + Types 19.2 + ESLint 9.39.5 + `eslint-config-next@16.3.3` + TypeScript 5.9.3 angehoben. Lockfile reproduzierbar ohne Force-Hacks.
2. `lint` ist `eslint .`. Legacy `.eslintrc.json` entfernt. Offizielle Next-16-Flat-Config (`core-web-vitals` + `typescript` + Default-Ignores). Neue Compiler-/`no-explicit-any`-Regeln bleiben sichtbar; Severity `warn` statt global `off` (siehe Abschnitt 6).
3. `middleware.ts` → `proxy.ts`, Export `proxy`. Semantik erhalten:
   - Scopes: `/api/admin` JSON 401 + `WWW-Authenticate: Bearer`; `/admin/*` außer `/admin/login` → `/admin/login`; `/account/*` → `/login`
   - `/admin/mfa` bleibt login-geschützt und **nicht** aus dem Admin-Scope ausgenommen
   - `next` = `pathname + search`
   - fail-closed fehlende ENV / Lookup-Fehler
   - `getUser()`, nicht `getSession()`
   - Cookie getAll/setAll
   - **kein matcher**, keine `runtime`-Config, keine AAL-/Rollenlogik
   - Header `x-middleware-cache: no-cache` bleibt
4. `typedRoutes: true` auf Top-Level. `experimental.optimizePackageImports: ['lucide-react']` unverändert. Keine Cache Components, kein PPR, kein React Compiler. Default-Turbopack, kein `--webpack`.
5. Notwendige Kompatibilitätsfixes:
   - Admin-Login: `useFormState` → `useActionState` aus `react`; `useFormStatus` bleibt in `react-dom`
   - `app/layout.tsx`: `data-scroll-behavior="smooth"` für den Next-14-SPA-Scroll-Override
   - `app/(public)/error.tsx`: Digest zuerst; ohne Digest `useId()`-Fallback über `oeffentlicheFehlerId` (Review-Fix `5055372760`). Keine unreinen Zeit-/Zufallswerte, kein `#unbekannt`
   - `lib/supabase/server.ts`: `store.delete(name)` ohne `@ts-ignore`
   - `typecheck`: `next typegen && tsc`, weil Next 16 `next-env.d.ts` auf generierte Route-Types zeigt und CI typecheck vor build läuft
   - `tsconfig.json`: `jsx: "react-jsx"` und `.next/dev/types/**/*.ts` (Next-16-Schreibvorgang)
6. S1 Promise-/Async-Request-API-Verträge bleiben. `new URL(req.url).searchParams` nicht pauschal umgeschrieben.
7. Gezielte Tests: `lib/auth/proxy-security-contract.test.ts`, `lib/next/framework-bump-contract.test.ts`, `lib/next/oeffentliche-fehler-id.test.ts`; Admin-AAL-Wiring und Request-API-Compat lesen `proxy.ts`.

## 5. Breaking-Change-Audit (Repo + Build, keine abstrakte Checkliste)

| Thema | Befund |
| --- | --- |
| Async Request APIs / `params` / `searchParams` / `cookies` / `headers` / `draftMode` | S1-Verträge erhalten; keine Rückbauten |
| `new URL(req.url).searchParams` | nicht umgeschrieben |
| `generateSitemaps` | nicht vorhanden |
| `revalidateTag` | nicht vorhanden |
| `next/legacy/image` / `images.domains` | nicht vorhanden; `remotePatterns` + explizites `minimumCacheTTL` unverändert |
| Parallel-Route `default.*` | keine Parallel-Route-Slots |
| `next lint` | entfernt; `eslint .` |
| Proxy | Next-16-Build zeigt `ƒ Proxy (Middleware)` |
| Turbopack Production Build | **PASS** nach `rm -rf .next`. Erster Lauf scheiterte an stale Next-14-`.next` (`PageNotFoundError: /_not-found`), nicht an einem Turbopack-Code-Blocker |
| Cache Components / PPR / React Compiler | nicht aktiviert |

## 6. ESLint-Severity-Entscheidung

Offizielle Next-16-Flat-Config plus `eslint-plugin-react-hooks` v7 plus typescript-eslint recommended erzeugte **69 Errors**. Ein Error-Level würde eine produktweite Umschreibung erzwingen (Hard Non-Scope).

| Regel | S2-Entscheidung | Warum |
| --- | --- | --- |
| `react-hooks/set-state-in-effect` | **warn**, nicht `off` | React Compiler ist Hard Non-Scope |
| `react-hooks/purity` | **warn**, nicht `off` | gleiche Compiler-Orientierung |
| `@typescript-eslint/no-explicit-any` | **warn**, nicht `off` | S1 bewahrt bewusst `as any` auf Admin-Users |
| `@typescript-eslint/no-require-imports` | **off nur** für `*.config.js` / `next.config.js` / `tailwind.config.js` / `postcss.config.js` | bestehende CJS-Configs, kein globales Off |

Lint-Ergebnis: **0 errors, 133 warnings**.

## 7. Author-Gates dieses Runs

Lokal auf Review-Fix `5e98a38e` erneut ausgeführt:

| Gate | Ergebnis |
| --- | --- |
| `npm ci` | PASS; eslint 9.39.5 deprecation warn, kein Peer-Fehler |
| `npm run check:setup:ci` | PASS (1 Warn: keine `.env` in dieser Umgebung) |
| `npm run typecheck` | PASS nach `next typegen` |
| `npm run lint` | PASS – 0 errors / 133 warnings |
| `npm test` | PASS – **2491** tests, 0 fail (vorher 2486; + Fehler-ID-Regressionen) |
| `npm run check:dead` | PASS |
| `npm run check:exports` | PASS |
| `npm run check:deps` | PASS |
| `npm run check:api-schutz` | PASS – 12 admin routes |
| `npm run check:schema-bezug` | PASS |
| `npm run build` | PASS – **Next.js 16.3.3 (Turbopack)**; 22 static pages; Proxy erkannt |

Gezielt separat: `lib/next/oeffentliche-fehler-id.test.ts`, `lib/next/framework-bump-contract.test.ts` – PASS.

GitHub Actions / Vercel Preview **dieses Stamp-Heads** sind Platform-Evidence nach dem Push. Der Technical Lead verifiziert sie unabhängig. Frühere Preview-Kommentare auf älteren Heads gelten nicht für diesen Stamp.

## 8. Unfertige Arbeit

- Unabhängiger Technical-Lead Exact-Head-**Re-Review** von Draft-PR #151 nach CHANGES REQUIRED `5055372760`.
- GitHub Actions / Vercel Preview dieses Stamp-Heads müssen am exakten Head bestätigt werden.
- S3 / Folgeslice ist **nicht** gestartet und nicht vorgeschlagen als automatischer nächster Schritt.

## 9. Risiken

### P0

Kein neu entdeckter P0.

### P1

- Auth-/Cookie-/Proxy-Regression in echter Preview/SSR, trotz Source-Contract-Tests. Der Proxy ist die teuerste Fläche.
- `/planen` Robots und Promise-PageProps bleiben P1, bis Exact-Head Preview die S1-Verträge auf Next 16 bestätigt.
- Stale `.next` aus Next 14 bricht den ersten Build; CI muss clean starten. Lokal nach `rm -rf .next` grün.
- Der P1-Fund aus `5055372760` (konstante `#unbekannt`-Fehler-ID) ist im Review-Fix `5e98a38e` geschlossen. Residual: Preview muss die sichtbare `Fehler-ID` unabhängig bestätigen.

### P2

- `main protected=false` unverändert, Non-Scope.
- ESLint 9.39.5 ist npm-deprecated; ESLint 10 ist mit `eslint-config-next@16.3.3` / `eslint-plugin-react` nicht peer-sauber. Residual, kein Force-Upgrade.
- 133 Lint-Warnings (Hooks-Compiler + `any`) bleiben sichtbar und sind kein stilles Off.
- Admin Users behält historisches `as any`.

### P3

- Sichtbarer Cursor-Titel `Jetnity framework bump` weicht vom Preferred Title `Jetnity framework compatibility 2` ab.

## 10. Product-Owner-Gates

Für diesen exakt definierten S2-Scope war keine neue PO-Freigabe nötig (PR #149 autorisiert S2 ausdrücklich). Alle Sondergates bleiben geschlossen. S3 startet nicht aus diesem Slice.

## 11. Explizite Non-Mutation

Dieser Slice hat **nicht** verändert: Supabase Migration/Schema/Daten/Auth-Config/RLS/Ownership/GRANT/REVOKE/SECURITY DEFINER; Auth/Session/MFA/AAL-Produktarchitektur; AP-7-S2; Passport/MRZ/Biometrie; Provider-live/Secrets/paid calls; Payments; Vercel Projekt/Env/Domain/Runtime-Settings; Branch Protection.

## 12. Exakter nächster Schritt

**Unabhängiger ChatGPT / Technical-Lead Exact-Head-Re-Review von Draft-PR #151.**

Vorheriger Review-Head `b73af1c2` / Kommentar `5055372760` ist nach diesem Push ungültig. Kein Ready. Kein Merge. Kein S3. Unmittelbare Review-Fixes bleiben in derselben Session `Jetnity framework compatibility 2`.
