# Jetnity – Next.js Framework Security Upgrade Gate 0 Status

Stand: 28. August 2026  
Status: **REVIEW-FIX FÜR 5457148091 / AUDIT + ARCHITECTURE ONLY / SELF-EXPIRING / DRAFT**  
Workstream: Ops / Framework security  
Logical Cursor-Agent: **`Cursor-Agent: Jetnity framework security audit 1`**  
Draft-PR: https://github.com/Jetnity/jetnity/pull/148  
Branch: `audit/framework-security-upgrade-gate0-2026-08-28`  
Task: `docs/NEXT_FRAMEWORK_SECURITY_UPGRADE_GATE0_TASK_2026-08-28.md`

> Live-Evidence gewinnt. Dieses Self-Review ist kein PASS. Kein Ready. Kein Merge. Kein Framework-/Runtime-Dependency-Upgrade. Kein AP-7-S2. Kein Provider-/TW-Runtime.

## 0. Naming evidence

| Feld | Wert |
| --- | --- |
| Zugewiesener logischer Name | `Cursor-Agent: Jetnity framework security audit 1` |
| Preferred visible title | `Jetnity framework security audit 1` |
| Observed Cursor run title | `Jetnity framework security audit` |
| Cloud-Run | https://cursor.com/agents/bc-1ec3726f-b33b-45d1-aad2-b1bce3c895b9 |
| Rename-/Title-Fähigkeit | **keine** in den verfügbaren Cursor-Namespaces |
| Regel | `docs/JETNITY_CURSOR_VISIBLE_AGENT_NAME_GATE.md` (sichtbar exakt = Best Effort, kein Arbeitsblocker) |
| Generation | **1 bleibt 1.** Keine Generation 2 wegen UI-Titel. |

Dieser Agent behauptet nicht, die sichtbare UI sei umbenannt.

## 1. Live-Rekonstruktion

| Feld | Wert |
| --- | --- |
| Repository | `Jetnity/jetnity` |
| Task-Baseline / live `origin/main` | `56aff7ff89f7113554c45891e024f9c06f6b0d15` – Merge PR #147 |
| Branch | `audit/framework-security-upgrade-gate0-2026-08-28` |
| Merge-Base gegen `origin/main` | `56aff7ff89f7113554c45891e024f9c06f6b0d15` |
| Ahead / Behind vor diesem Stamp | **1 / 0** (nur Task-Commit `8567dcdb`) |
| Draft-PR | #148 OPEN / Draft / MERGEABLE |
| `main` Branch Protection | live `protected=false`; dieser Slice ändert das nicht |
| Supabase in diesem Run | **nicht** abgefragt, **nicht** mutiert |
| Vercel project settings | **nicht** mutiert |
| Browser / Real-Device | **nein** – Docs-only |
| Mutating codemod | **nicht** ausgeführt |

### 1.1 Post-Merge-Evidence von PR #147

| Fakt | Wert | Quelle |
| --- | --- | --- |
| PR #147 | **MERGED** 2026-08-28T19:34:02Z | dieser Run (`gh pr view 147`) |
| Merge-Commit / live `main` | `56aff7ff89f7113554c45891e024f9c06f6b0d15` | dieser Run (`git fetch origin/main`) |
| Post-Merge GitHub Actions | Run `33204438255` SUCCESS auf exakt `56aff7ff` | dieser Run |
| GitHub Production deployment | `6147375507` success auf exakt `56aff7ff` | dieser Run – **nur GitHub-Evidence, kein Ersatz für die Vercel-ID** |
| Vercel Production | `dpl_3UZX5HrgwUyyr887ZSKBXMzPKMKM`, target `production`, **READY**, exact `main @ 56aff7ff89f7113554c45891e024f9c06f6b0d15`, `aliasError=null`. Build-Log: `Skipping build cache since Node.js version changed from "24.x" to "22.x"` | **Technical-Lead-verifiziert in Review `5457148091`. Dieser Agent hat diese Vercel-ID nicht selbst geholt.** |
| Node-Vertrag | `engines.node` = `22.x`; `@types/node@22.20.1`; CI `22.x` | Repository + PR #147 |

Die vom Auftrag genannte Vercel-Production-Security-Warnung für `next@14.2.32` bleibt **Auftragswahrheit**. Dieser Agent hat die Warnungszeichenkette nicht aus Vercel-Build-Logs extrahiert. Platform-Schutz ist kein unterstützter Framework-Vertrag.

### 1.2 Exact Head dieses Stamps

| Feld | Wert |
| --- | --- |
| Reviewed Head (invalidiert) | `c4bfc2bb8f0f149bf18fd3dad1032953040dec9d` – CHANGES REQUIRED `5457148091` |
| Review-Head | der Commit dieses Review-Fix-Stamps; live an PR #148 prüfen |
| Merge-Base | `56aff7ff` |

Jeder neue Push invalidiert Prior-Gates.

## 2. Task / Scope / Non-Scope

**Scope:** Read-only Compatibility- und Architekturanalyse. Vergleich mindestens `next@15.5.24` (Maintenance LTS) vs `next@16.3.3` (Active LTS). Empfehlung plus gestufte Implementierungsplanung. Kein Runtime-Wechsel.

**Non-Scope (hart):** keine Änderung an `next`, React, React DOM, eslint, eslint-config-next oder anderen Runtime-Dependencies; kein mutierender Codemod; keine Application-/Middleware-/Action-/UI-Änderung; keine Vercel-Projektmutation; keine Supabase-/Auth-/RLS-/Schema-/Daten-/Secret-Mutation; keine Branch Protection; kein AP-7-S2; kein Provider-/TW-Runtime; kein Ready; kein Merge.

Kein Codemod wurde ausgeführt, auch kein Dry-Run: die Dry-Run-Semantik des offiziellen Wrappers war in dieser Umgebung nicht unabhängig als non-mutating bewiesen. Call-Sites stammen aus Repository-Suche.

## 3. Observed current framework / runtime

Aus `package.json` / Lockfile auf Baseline `56aff7ff`, unverändert in diesem Slice:

| Package / Vertrag | Ist |
| --- | --- |
| `next` | **14.2.32** (pin) |
| `react` / `react-dom` | **18.2.0** (pin) |
| `@types/react` / `@types/react-dom` | `^19.1.11` / `^19.1.7` – **bereits React-19-Typen bei React-18-Runtime** |
| `eslint` | **8.57.1** |
| `eslint-config-next` | **14.2.12** – hinter `next@14.2.32` |
| lint script | `next lint` |
| ESLint config | `.eslintrc.json` extends `next/core-web-vitals` |
| TypeScript (deklariert) | `^5.0.0` in `package.json` – **unter** Next-16-Minimum `>=5.1.0` |
| TypeScript (resolved) | **5.9.2** in `package-lock.json` `node_modules/typescript` – erfüllt 5.1+ zur Laufzeit, der **deklarierte** Vertrag tut es nicht |
| Node | **22.x** (ADR-0188, PR #147 integriert) |
| `@supabase/ssr` | `^0.6.1` |
| `@supabase/supabase-js` | `^2.50.2` |
| Playwright | `playwright@^1.55.0` für UI-Audits; **nicht** `@playwright/test` in CI |
| Router | **nur App Router**; kein `pages/` |
| Edge runtime | **kein** `runtime = 'edge'`; Root-Layout `runtime = 'nodejs'` |
| Custom webpack | **nein** |
| `proxy.ts` | **nein** |
| `vercel.json` | `{ "version": 2 }` |

Letztes courtesy-14.2-Release auf npm: **14.2.35**. August-2026-Security-Patches existieren **nur** als `15.5.24` und `16.3.3`.

## 4. Official support and security

Live gelesen am 28. August 2026:

| Quelle | Befund |
| --- | --- |
| https://nextjs.org/support-policy | **16.x Active LTS** (Release 21 Oct 2025). **15.x Maintenance LTS** (Release 21 Oct 2024). **14.x unsupported.** Maintenance LTS dauert zwei Jahre ab Erstrelease → 15.x EOL **21 Oct 2026**. |
| https://nextjs.org/blog/august-2026-security-release | Patches: `16.3.3` und `15.5.24`. |
| GHSA-2xp9-vwfh-vxw4 | Unauthenticated RCE in Image Optimization bei AVIF (`libheif` / `sharp`). Gepatchte Releases **deaktivieren AVIF-Optimierung**. |
| CVE-2026-75604 / GHSA-p293-qw3h-jr36 | Unauthenticated RCE auf **Windows-Filesystem**, Pages+App ohne Cache Components. Affected: `>=13.4 <15.5.24` und `>=16.0 <16.3.3`. Linux/macOS nicht betroffen. **Kein 14.x-Patch.** |
| https://vercel.com/changelog/nextjs-august-2026-security-release | Vercel-hosted Apps sind für diese zwei Issues **plattformgeschützt**. Self-hosted muss patchen. Das ersetzt **nicht** eine unterstützte Linie. |

**14.2.x-Stopgap:** `14.2.35` ist das letzte 14.2-Release (Dezember 2025, u. a. React-DoS-Backports). Es bleibt offiziell unsupported und enthält die August-2026-Fixes **nicht**. Ein temporärer Pin auf 14.2.35 wäre kein Security-Ziel.

Jetnity ist Vercel-hosted und Production läuft auf Linux. Windows-RCE ist für Production/CI (`ubuntu-latest`) nicht der direkte Exploit-Pfad. AVIF ist relevant: `next.config.js` setzt `images.formats: ['image/avif', 'image/webp']`.

## 5. Jetnity-specific compatibility findings

### 5.1 Async Request APIs – höchste Jetnity-Dichte

Next 15 macht `cookies()`, `headers()`, `draftMode()`, page/layout `params` und `searchParams` async; ein Sync-Shim warnt nur. Next 16 **entfernt** den Shim. Sync-Zugriff kann dann `undefined` liefern oder werfen.

**`cookies()` – sync, zentral, auth-kritisch**

| Datei | Nutzung |
| --- | --- |
| `lib/supabase/server.ts` | `cookies()` sync in `createServerComponentClient`, `createRouteHandlerClient`, `createServerActionClient`. Adapter `get/getAll/set/remove` erwarten ein Store-Objekt, kein Promise. |
| `lib/modell/kontingent.ts` | `gastkennung()` ruft `cookies()` sync und **schreibt** `jetnity_gast` via `speicher.set(...)`. |

Diese drei Factories sind **synchron**. Ein `await cookies()` erzwingt eine Signaturänderung `function` → `async function` und rippled durch alle Caller. `await` eines Non-Promises ist auf Next 14 gültig; Slice-1-Prep ist deshalb ohne Next-Bump möglich.

Bekannte Caller der Factories (nicht vollständig jeder Transit, aber die direkte Fläche):

- RSC/Pages: `app/(public)/login/page.tsx`, `register/page.tsx`, `planen/page.tsx`, `reisen/page.tsx`, `reisen/[tripId]/page.tsx`, `app/account/page.tsx`, Admin-Home-Karten, `app/(admin)/admin/users/page.tsx`
- Actions: `lib/trips/aktionen.ts`, `anlegen.ts`, `lib/places/aktionen.ts`, `app/auth/sign-out.ts`, `app/(public)/admin/login/actions.ts`, `app/(admin)/admin/users/actions.ts`, Domain-Aktionen in flights/hotels/activities/mobility/rental-cars/readiness/reiseaenderung
- Route Handlers: `app/api/search/{places,airports}`, `app/api/flights/search`, `app/api/admin/{security,payments}/*`
- Guards: `lib/auth/admin-guard.ts`
- Admin boards: `lib/admin/system-health/runtime.ts`, `lib/admin/provider-ops-board/runtime.ts`

`check-jetnity-setup.ts` erzwingt, dass `createServerComponentClient` nur aus `@/lib/supabase/server` kommt. Die zentrale Factory bleibt der richtige Schnitt.

**`params` – eine dynamische Page**

- `app/(public)/reisen/[tripId]/page.tsx` – `params: { tripId: string }`, sync gelesen. Trip Workspace / Gast-vs-Konto-Unterscheidung hängt an `params.tripId`.

Keine dynamischen Route-Handler-`params` gefunden. Keine Parallel-Routes / `@`-Slots.

**`searchParams` – sechs Pages, eine Metadata-Funktion**

| Datei | Risiko |
| --- | --- |
| `app/(public)/planen/page.tsx` | Page **und** sync `generateMetadata({ searchParams })` steuern D0-Indexgrenze (`planenRobots`). Falsch gelesene Params können indexieren oder Prefill verlieren. |
| `app/(public)/login/page.tsx` | `searchParams.next` steuert Post-Login-Redirect. |
| `app/(public)/register/page.tsx` | gleich. |
| `app/(public)/admin/mfa/page.tsx` | `searchParams.next` für Admin-Step-up. |
| `app/(admin)/admin/users/page.tsx` | `q` / `page` Pagination. |
| `app/unauthorized/page.tsx` | **sync** Server Component; `grund=lookup-failed` vs forbidden. Next 16 ohne Await zeigt den falschen Copy-Pfad. |

Route-Handler lesen `new URL(req.url).searchParams` – **nicht** betroffen.

`headers()` / `draftMode()` im App-Code: **keine** Treffer.

### 5.2 Middleware / possible Next 16 `proxy`

`middleware.ts` ist der Auth-Rand für `/account`, `/admin` (ohne `/admin/login`) und `/api/admin`. Sie nutzt `@supabase/ssr` `createServerClient` mit `getAll`/`setAll` auf `NextRequest`/`NextResponse`, `auth.getUser()`, fail-closed bei fehlender ENV. **Kein `config.matcher`** – bewusst, wegen historischem micromatch/picomatch Stack-Overflow.

Offizielle Next-16-Docs (28. Aug 2026): `middleware.ts` → `proxy.ts`, Export `middleware` → `proxy`. `proxy` läuft auf **Node.js**, nicht Edge. `middleware.ts` bleibt für Edge deprecated. Config-Flags `skipMiddleware*` → `skipProxy*`. Jetnity hat keine solchen Flags.

Inoffizielle Guides behaupten zusätzlich Pflicht-`matcher` und neue `ProxyRequest`-Typen. Das ist **nicht** die offizielle Upgrade-Seite. Implementierung muss gegen die Docs der **dann installierten** 16.x-Version prüfen. Ein erzwungenes `matcher` würde Jetnitys dokumentierte Anti-Overflow-Entscheidung berühren.

Risiko: Session-Cookie-Refresh in `setAll` muss auf dem Response-Objekt bleiben. Das ist der höchste Auth-Regressionspunkt von 16.

### 5.3 `next lint` / ESLint

| Heute | Next 15.5.24 | Next 16.3.3 |
| --- | --- | --- |
| Script `lint`: `next lint` | noch nutzbar; Migration vorbereiten | **`next lint` entfernt.** `next build` lintet nicht mehr. |
| `eslint@8.57.1` | peer erlaubt 7/8/9 | `eslint-config-next@16.3.3` verlangt **eslint >= 9** |
| `.eslintrc.json` | weiter möglich | Flat Config ist Default-Pfad; Legacy bleibt Residual |

CI (`.github/workflows/ci.yml`) ruft `npm run lint` auf. Ohne Script-Migration wird Slice-2-CI rot, unabhängig vom Application-Code.

Codemod (nur später, nicht in Gate 0): `npx @next/codemod@canary next-lint-to-eslint-cli .`

### 5.4 `next.config.js`

```js
reactStrictMode: true
experimental: { optimizePackageImports: ['lucide-react'], typedRoutes: true }
images.formats: ['image/avif', 'image/webp']
images.minimumCacheTTL: 60 * 60 * 24  // 24h, bereits über Next-16-Default 4h
images.remotePatterns: Azure DALL-E, Supabase public storage, jetnity.ai avatars
compiler.removeConsole in production (error/warn excluded)
```

Kein custom `webpack`. Kein `experimental.ppr`. Kein `images.domains`. Kein `next/legacy/image`. Ein `next/image`-Import: `app/(public)/page.tsx`.

Bei 15/16: `experimental.typedRoutes` typischerweise nach top-level `typedRoutes` heben. `optimizePackageImports` prüfen, ob es experimental bleibt. AVIF-Format-Flag nach dem Security-Patch: Optimierung ist in 15.5.24/16.3.3 abgeschaltet; Dateien können as-is ausgeliefert werden.

### 5.5 Caching / Server Actions / Route Handlers

- **Kein** `revalidateTag`. Überall `revalidatePath` – Next-16-Signaturänderung von `revalidateTag` trifft Jetnity nicht.
- Eine `unstable_noStore` in `app/(admin)/admin/users/page.tsx`.
- Sehr viele `export const dynamic = 'force-dynamic'` auf Auth-, Account-, Admin-, Search- und Trip-Flächen. Der Next-15-Default „fetch/GET uncached“ ändert diese Flächen wenig.
- `app/sitemap.ts`: `revalidate = 3600`.
- `maxDuration = 300` auf `/planen` und `/reisen/[tripId]`.
- Server Actions in `lib/{trips,places,flights,hotels,activities,mobility,rental-cars,readiness,reisevorschlag,reiseaenderung}` plus Auth/Admin-Actions. Kein Cache-Tag-Vertrag.
- Kein `next/dynamic` / `ssr: false`.
- Kein AMP, kein `NextRequest.geo/ip`.

### 5.6 React 18 → 19 / 19.2

Offizielle Next-15-Docs: App Router Minimum React 19. `useFormState` ist in React 19 deprecated zugunsten `useActionState`. Next 16 App Router nutzt React 19.2-Features.

npm-Peers von `next@15.5.24` und `next@16.3.3` erlauben noch `react@^18.2.0 || ^19.0.0`. Das ist kein Freibrief, App Router auf React 18 zu lassen.

Jetnity-Hooks:

| API | Dateien | 19-Wirkung |
| --- | --- | --- |
| `useFormState` | `app/(public)/admin/login/page.tsx` (Passwort + Magic Link) | nach `useActionState` |
| `useFormStatus` | dieselbe Datei; `components/layout/PublicNavbar.tsx`; `components/layout/FooterSitzung.tsx` | bleibt gültig; 19 liefert Extra-Keys |

Dritt-Peers (npm, dieser Run) akzeptieren React 19: `lucide-react@0.525.0`, `recharts@3.1.2`, `sonner@2.0.5`, `@radix-ui/react-dropdown-menu@2.1.16`. `@supabase/ssr@0.6.1` hat keinen React-Peer.

`@types/react@^19` bei Runtime 18 ist schon heute eine Typ-/Runtime-Divergenz. Ein React-19-Bump **aligniert** das, statt eine neue Divergenz zu öffnen.

Aktuellstes 19.2 auf npm in diesem Audit-Run: **19.2.8**. Das ist eine Audit-Referenz, kein Ewigkeits-Pin. Implementierung live-resolved die dann aktuelle kompatible 19.2.x-Patchlinie.

### 5.7 TypeScript 5.1+ contract

Offizielle Next-16-Upgrade-Docs verlangen **TypeScript >= 5.1.0**.

| Ebene | Ist (dieses Repo, unverändert) |
| --- | --- |
| Deklariert `package.json` | `typescript: ^5.0.0` – erlaubt theoretisch 5.0.x, **unter** dem Next-16-Minimum |
| Resolved Lockfile | `typescript@5.9.2` – erfüllt 5.1+ faktisch |

Slice 2 muss den **deklarierten** Vertrag auf eine unterstützte Range/Version >= 5.1.0 angleichen und das Lockfile regenerieren. Gate 0 ändert weder `package.json` noch das Lockfile. Die resolved 5.9.2 ist Audit-Ist, kein vorgeschriebener Patch-Pin.

### 5.8 Tests / CI / Vercel

CI bleibt der bestehende Job: `npm ci` → setup → typecheck → lint → `npm test` → api-schutz → schema-bezug → dead/exports/deps → `next build`. Node 22.x. Auth-Config-Job unverändert.

`npm test` ist `node --import tsx --test "lib/**/*.test.ts"` – unabhängig von Next-Test-Runner. Playwright-Audits (`scripts/*-ui-audit.mjs`) sind nicht Teil von CI.

Vercel: keine Project-Setting-Änderung nötig für den Upgrade selbst. Node 22.x ist bereits der Vertrag. Preview muss Auth-Cookies, Admin-Gate, `/planen`-robots und Trip-Workspace nach dem Upgrade beweisen.

### 5.9 Traveller Context

Nicht relevant. Dieses Gate 0 sammelt oder ändert keine Citizenship-/Dokument-/Route-Fakten.

## 6. Mechanical vs manual / high-risk

### Codemod-safe / mechanical

- `await cookies()` / `await params` / `await searchParams` / async `generateMetadata` (Codemod `next-async-request-api`, später).
- `useFormState` → `useActionState`.
- `next lint` → ESLint CLI (`next-lint-to-eslint-cli`).
- `middleware.ts` → `proxy.ts` + Export-Rename (offizieller 16-Upgrade-Codemod).
- `experimental.typedRoutes` → top-level, falls die Zielversion das verlangt.
- Dependency-Alignment (live-resolved, nie unter Audit-Minimum): `next` 16.x, passendes `eslint-config-next`, `eslint@9`, React 19.2.x, TypeScript-Deklaration >= 5.1.0.

### Manual / high-risk (nicht dem Codemod überlassen)

1. **Sync-Factories in `lib/supabase/server.ts` async machen** und alle Caller nachziehen. Codemod ändert oft nur den `cookies()`-Aufruf, nicht die öffentliche Sync-Signatur.
2. **`gastkennung()`** muss async werden; alle Kontingent-Caller prüfen.
3. **`app/unauthorized/page.tsx`** ist sync – entweder `async` + await oder `React.use()`.
4. **`generateMetadata` auf `/planen`** – D0-Truth; nach dem Await dieselben Key-Präsenz-Regeln (`Object.hasOwn`), nicht „nicht-leerer Wert“.
5. **Middleware/Proxy + Supabase `setAll`** – Session-Refresh, Redirect-Cookies, fail-closed ENV, kein matcher erzwingen ohne Beweis.
6. **ESLint 8 → 9 + Flat Config** – CI-Blocker für 16, unabhängig vom App-Code.
7. **AVIF** – Security-Patch ändert Optimierungsverhalten; visuell/perf prüfen, nicht still als gleich annehmen.
8. **Admin-Login** (`useFormState` zweimal) – MFA/AAL-Pfad nicht regressiv ändern.
9. **TypeScript-Deklaration `^5.0.0`** auf eine Next-16-taugliche Range >= 5.1.0 heben (Lockfile regenerieren). Kein stilles Verlassen auf die zufällig resolved 5.9.2.

## 7. Risk matrix – audited 15.5.24 vs audited 16.3.3 reference

Die 16-Spalte ist die **auditierte August-2026-Referenz** der Active-LTS-Linie, kein Ewigkeits-Pin.

| Dimension | `15.5.24` Maintenance LTS (Audit-Referenz) | `16.3.3` Active LTS (Audit-Minimum / Referenz) |
| --- | --- | --- |
| August-2026-Patch | ja | ja |
| Offizieller Support | Maintenance; EOL **21 Oct 2026** (~54 Tage ab diesem Audit) | Active LTS |
| Zweite Major bald nötig | **ja**, vor/bei EOL | nein |
| React | 19 für App Router | 19.2 im App Router |
| Async Request APIs | Breaking + Sync-Shim | Breaking, Shim weg |
| Request-Interception | weiter `middleware.ts` | `proxy.ts`, Node-Runtime |
| Lint | `next lint` noch da; eslint 8 möglich | `next lint` weg; eslint >= 9 |
| Bundler | Webpack default | Turbopack default; kein custom webpack bei Jetnity |
| Fetch/GET-Cache-Default | uncached | gleich; Cache Components optional, nicht empfohlen jetzt |
| Jetnity-Auth-Risiko | hoch (Cookie-Factories) | hoch (Cookies **plus** Proxy) |
| `revalidateTag` | unverändert; Jetnity nutzt es nicht | neue Signatur; Jetnity unberührt |
| Regression erster PR | kleiner | größer |
| Langfristige Maintainability | schlecht als Ziel | gut als Ziel |
| Vercel | unterstützt | unterstützt |

## 8. Recommendation

**Langfristiges Ziel: Next.js 16.x Active LTS auf der zum Implementierungszeitpunkt aktuellen unterstützten und security-gepatchten 16.x-Release.**

`16.3.3` ist das **auditierte aktuelle Minimum / die August-2026-Sicherheitsreferenz**, kein ewiger Architektur-Pin. Ist die Implementation verzögert oder existiert eine neuere unterstützte Security-Release auf 16.x, muss live neu aufgelöst werden. **Nie unter `16.3.3` fallen.**

Begleitpakete ebenso live-resolved innerhalb der kompatiblen unterstützten Linie: React 19.2.x, passendes `eslint-config-next` zur gewählten 16.x, ESLint 9, TypeScript-Deklaration >= 5.1.0.

Nicht weil 16.3.3 „das Neueste“ ist, sondern weil:

1. 14.x ist unsupported. `14.2.35` heilt die August-2026-Advisories nicht.
2. 15.x ist in ~54 Tagen selbst EOL. Production auf 15.5.24 zu landen erzwingt sofort eine zweite Major.
3. Jetnitys Architektur passt zu 16.x: nur App Router, kein Pages Router, kein custom webpack, kein Edge-Segment, kein `revalidateTag`, bereits `force-dynamic` auf den Auth-/Trip-Flächen, Node 22 schon Vertrag.
4. Die wirklich teure Jetnity-Arbeit (Cookie-Factories, `/planen`-Metadata, Middleware-Cookies) fällt bei 15 **und** 16 an. Der Shim von 15 spart wenig, wenn 16 in Wochen folgen muss.
5. Vercel-Plattformschutz für die zwei August-Issues ist **kein** Ersatz für eine unterstützte Linie und zukünftige Advisories.

**15.5.24 ist kein Production-Ziel.** Es bleibt nur eine optionale, kurzlebige Preview-Isolationsstufe, wenn Slice 2 zu groß wird. Sie darf nicht auf Production stehen bleiben.

**Kein 14.2.35-Security-Ziel.** Höchstens Notfall-Same-Major, ausdrücklich als weiterhin unsupported dokumentiert.

## 9. Staged implementation – nur nach Product-Owner-Freigabe

Kein Slice startet aus diesem Gate 0.

### Slice 1 – Request-API-Prep auf Next 14 (kein Dependency-Bump)

- `createServerComponentClient` / `createRouteHandlerClient` / `createServerActionClient` async; `await cookies()`.
- Alle direkten Caller und `gastkennung()` nachziehen.
- `params` / `searchParams` / `generateMetadata` awaiten (auf 14 unkritisch).
- `unauthorized` auf async oder `use()`.
- Tests für Cookie-Factories, Login-`next`, `/planen`-robots, `[tripId]`.
- Weiter `next@14.2.32`. Kein React-Bump in diesem Slice, ausser der Product Owner koppelt Slice 1+2.

### Slice 2 – Ziel Next 16.x Active LTS (live-resolved, nie unter `16.3.3`)

- Live-resolved Pins zum Implementierungszeitpunkt: aktuelle unterstützte/security-gepatchte `next@16.x` (>= `16.3.3`), dazu passende `eslint-config-next`, `eslint@9`, React/`react-dom` 19.2.x, TypeScript-Deklaration >= 5.1.0 (heute deklariert `^5.0.0`, resolved `5.9.2`) inkl. Lockfile-Regeneration.
- `lint`-Script von `next lint` auf ESLint CLI; Flat Config prüfen.
- `middleware.ts` → `proxy.ts`, Export `proxy`; Cookie-`setAll` und fail-closed Semantik byte-genau erhalten; matcher nur nach Beweis.
- `useFormState` → `useActionState` auf Admin-Login.
- `typedRoutes` / `optimizePackageImports` an die Docs der dann installierten 16.x anpassen.
- AVIF-Verhalten und Homepage-`next/image` auf Preview prüfen.
- Volle CI + Preview-Auth: Login, Register, Admin-Login/MFA, Account, Gast-Cookie, Trip Workspace, `/planen` robots.
- Keine Vercel-Settings, keine Supabase-Mutation, keine Branch Protection.

### Optionales Slice 1.5 – `15.5.24` Preview-only

Nur wenn Slice 2 in der Preview zu grob ist. Nicht mergen als Production-Ziel. Danach unverzüglich Slice 2 auf live-resolved 16.x (>= `16.3.3`), vor 21 Oct 2026.

### Explizit nicht in diesen Slices

AP-7-S2, Provider-Runtime, TW-8/TW-9, Auth-Architektur, RLS, Production-Migration, Secrets, Paid Calls.

## 10. Rollback / test strategy

- Production bleibt auf `next@14.2.32` / React 18.2.0, bis ein **separater**, gegateter Upgrade-PR merget.
- Jeder Implementierungs-PR: Preview zuerst. Rollback = Git-Revert des Upgrade-PR.
- Nicht „zurück“ auf 14.2.35 als Strategie.
- Pflichtgates vor Ready/Merge eines Upgrade-PR (Technical Lead, nicht dieser Agent): `npm ci`, typecheck, lint, `npm test`, hygiene (`check:dead|exports|deps|api-schutz|schema-bezug`), `next build`, Exact-Head Actions + Vercel Preview.
- Zusätzlich Preview-Flows: Login/`next`, Admin-Login + MFA-Gate, Account-Middleware, Gast-Kontingent-Cookie, `/reisen/[tripId]` Gast vs Konto, `/planen` Basis vs `?idee` noindex, Sign-out.
- Real-Device nur wenn der Implementierungs-Task es verlangt. Gate 0 verlangt es nicht.

## 11. Secrets / config / production migration

| Thema | In Gate 0 | In empfohlenem Upgrade |
| --- | --- | --- |
| Secrets | nein | nein |
| Vercel project settings | nein | nicht nötig; Node 22 schon Vertrag |
| Supabase / Auth / RLS / Schema / Daten | nein | nein |
| Production-Migration | nein | nein |
| Branch Protection | unverändert `protected=false` | unverändert |
| Neue laufende Kosten | nein | nein (kein neuer Paid Provider; Turbopack/AVIF-Änderung ist kein Opex) |

## 12. Exact Product-Owner decision required

Vor **jedem** Framework-/Runtime-Dependency-Upgrade (AGENTS.md §5, Haupt-Tech-Stack-Version; Operating Standard: besondere Gates für fundamentale Stack-Änderungen):

Der Product Owner muss **ausdrücklich** eine der folgenden Optionen wählen:

1. **Empfohlen:** Separat versioniertes Implementierungsprogramm mit Ziel **Next 16.x Active LTS** (zum Implementierungszeitpunkt live-resolved, security-gepatcht, **nie unter dem auditierten Minimum `16.3.3`**), plus kompatible React-19.2.x- / ESLint-9- / TypeScript->=5.1-Linie. Gestuft Slice 1 (Prep auf 14) dann Slice 2. 15.5.24 ist kein Production-Ziel.
2. **Abweichung A:** Ein-Hop 14 → live-resolved 16.x (>= `16.3.3`) ohne Slice-1-Prep. Höheres Erst-PR-Risiko.
3. **Abweichung B:** Kurzlebige 15.5.24-Preview-Isolation, danach live-resolved 16.x (>= `16.3.3`) vor 21 Oct 2026. Nicht als Production-Ziel.
4. **Ablehnen / später:** Auf 14.2.32 bleiben und das Unsupported-Risiko bewusst tragen. Vercel-Plattformschutz für die zwei August-Issues bleibt dann die einzige unmittelbare Mitigation, nicht der Framework-Vertrag.

Diese Entscheidung gibt **nicht** frei: Production-Migration, Provider-live/Secrets/paid calls, Payments, Public Launch, Branch Protection, AP-7-S2, TW-8/TW-9.

Ein Technical-Lead-PASS auf diesem Gate-0-PR ist **keine** Upgrade-Freigabe.

## 13. Residual risks

- 14.x bleibt Production-Runtime bis zu einem späteren, gegateten Upgrade-PR.
- Zukünftige Advisories nach August 2026 werden auf 14.x nicht gepatcht.
- Vercel-Plattformschutz deckt nur die genannten August-2026-Issues und nur hosted Runtime.
- Cookie-Factory-Signatur und Proxy-Cookie-Refresh bleiben die zwei teuersten Regressionsflächen.
- Inoffizielle „matcher Pflicht“-Behauptung für `proxy` ist unverifiziert.
- ESLint 9 / Flat Config kann Regeln anders feuern als `next lint` + eslint 8.
- Turbopack-Default kann Build-Unterschiede zeigen trotz fehlendem custom webpack.
- `@types/react@19` vs `react@18` bleibt bis zum React-Bump.
- Deklariertes `typescript: ^5.0.0` bleibt bis Slice 2 unter dem Next-16-Minimum, obwohl Lockfile 5.9.2 resolved.
- `main` `protected=false` unverändert.
- Agent-Self-Review ist kein PASS. Review-Fix `5457148091` invalidiert Head `c4bfc2bb`.

## 14. Exact next step

Unabhängiger ChatGPT / Technical-Lead Exact-Head-Re-Review von Draft-PR #148 nach `5457148091`. Kein Ready. Kein Merge durch den Autor. Kein Implementierungsslice. Nach einem späteren Merge dieses PRs: Gate 0 ist integrierte Evidence; nächster Schritt = Product-Owner-Entscheidung aus Abschnitt 12 nach Live-Verifikation. Keine erfundene Merge-SHA. Kein Continuity-PR nur um den Merge zu sagen.
