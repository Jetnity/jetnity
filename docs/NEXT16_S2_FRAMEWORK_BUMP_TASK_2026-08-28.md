# Jetnity – Next.js 16 S2 Framework Bump Task

Stand: 28. August 2026  
Status: **AUTHORIZED / IMPLEMENTATION TASK / DRAFT-PR ONLY**  
Baseline: `main @ d7f02f77c0796b0ec04675191742049a222cfab9`  
Cursor-Agent: **`Jetnity framework compatibility 2`**

## 1. Zweck

S1 aus PR #150 ist integriert und hat Jetnitys Request-API-/Cookie-/PageProps-Flächen auf die asynchrone Next-16-Semantik vorbereitet, ohne die Runtime anzuheben.

Dieser S2-Slice führt jetzt den **tatsächlichen Framework-Bump** aus – kontrolliert, reproduzierbar und ohne Produkt-, Datenbank-, Auth- oder Provider-Scope auszuweiten.

Die dauerhafte Product-Owner-Freigabe liegt in `docs/NEXT16_PRODUCT_OWNER_APPROVAL_2026-08-28.md` vor und autorisiert ausdrücklich den gestuften Next-16-Bump samt kompatibler React-/TypeScript-/ESLint-Linie, Lint-CLI-Migration und erforderlicher `middleware`→`proxy`-Migration.

## 2. Live-Baseline bei Task-Cut

Vor Agentenstart verifiziert:

- `main = d7f02f77c0796b0ec04675191742049a222cfab9`
- PR #150 / S1 ist gemergt; Post-Merge GitHub Actions `33211372214` = SUCCESS.
- Vercel Production `dpl_2auCtkwfir4bU8mhohaWPyBi3oqu` = READY, `target=production`, exact Git SHA `d7f02f77c0796b0ec04675191742049a222cfab9`.
- `main` Branch Protection bleibt `protected=false`; **nicht verändern**.
- Repository-Runtime vor S2:
  - `next = 14.2.32`
  - `react = 18.2.0`
  - `react-dom = 18.2.0`
  - `eslint = 8.57.1`
  - `eslint-config-next = 14.2.12`
  - `typescript = ^5.0.0`
  - Node-Vertrag = `22.x`
- Live-resolved Framework-Ziel am 28.08.2026: **Next.js `16.3.3` Active LTS**, aktuell unterstützter Security-Patch. Keine Canary-/Beta-/Preview-Version.
- Aktuelle stabile React-19.2-Linie ist verfügbar. Der Agent muss unmittelbar vor Installation die konkrete stabile React-/React-DOM-/Types-/ESLint-/TypeScript-Auflösung erneut mit Registry-/Peer-Evidence prüfen und die exakten aufgelösten Versionen dokumentieren.

**Live-Evidence gewinnt.** Falls `main` vor materieller Arbeit driftet, zuerst refetchen, Merge-Base/Ahead/Behind dokumentieren und bei konfliktträchtigem Drift STOPP statt blind rebasen.

## 3. Zielzustand

Am finalen S2-Head muss Jetnity:

1. auf **Next.js 16.3.3** laufen;
2. eine kompatible stabile **React 19.2.x / React DOM 19.2.x**-Linie verwenden;
3. kompatible `@types/react` / `@types/react-dom` besitzen;
4. einen Next-16-kompatiblen TypeScript-Vertrag besitzen (kein Downgrade; keine Preview-Version);
5. `eslint-config-next` auf die **16.3.3**-Linie anheben und eine dazu kompatible stabile ESLint-Linie verwenden;
6. `next lint` vollständig durch die **ESLint CLI** ersetzen;
7. Legacy `.eslintrc` sauber auf die für Next 16 vorgesehene **Flat Config** (`eslint.config.mjs`) migrieren, ohne Lint-Regeln still abzuschwächen;
8. `middleware.ts` kontrolliert zu **`proxy.ts`** migrieren und die Exportfunktion zu `proxy` umbenennen;
9. sämtliche bestehende Auth-/Cookie-/Fail-Closed-Semantik des bisherigen Middleware-Pfads bewahren;
10. auf Next 16 erfolgreich typechecken, linten, testen und einen Production-Build erzeugen;
11. einen Vercel Preview auf dem exakten finalen Head erfolgreich erzeugen;
12. Status/Handoff/Self-Review/Continuity so persistieren, dass ein neuer Technical Lead den exakten Stand ohne Chat-Memory rekonstruieren kann.

## 4. Verbindlicher Scope

### A. Dependency-/Lockfile-Bump

Aktualisiere nur die für S2 notwendige Framework-/Tooling-Linie und deren Lockfile-Auflösung:

- `next` → exakt `16.3.3`;
- `react` / `react-dom` → aktuelle stabile kompatible 19.2.x-Linie;
- `@types/react` / `@types/react-dom` → dazu kompatible stabile Versionen;
- `eslint-config-next` → exakt `16.3.3`;
- `eslint` → aktuelle stabile mit `eslint-config-next@16.3.3` und Jetnitys Node-22-Vertrag kompatible Linie;
- `typescript` → aktuelle stabile Next-16-kompatible Linie nur soweit nötig/sinnvoll; niemals Preview/RC/Canary und niemals unter Next-16-Mindestanforderung;
- weitere **direkt notwendige** Dev-Dependencies für die Flat-Config-Migration nur, wenn durch offizielle Next-/ESLint-Kompatibilität erforderlich.

Keine pauschalen Package-Upgrades. Keine unrelated dependency refreshes.

Vor Commit: `npm ls` / Peer-Dependency-Situation prüfen. Keine `--force`- oder `--legacy-peer-deps`-Installation als dauerhafte Lösung.

### B. ESLint / CI-Vertrag

- `package.json` Script `lint` darf nicht mehr `next lint` verwenden; Ziel ist ESLint CLI, grundsätzlich `eslint .`.
- Migriere `.eslintrc.json` auf `eslint.config.mjs` mit Next Core Web Vitals und TypeScript-Regeln nach offiziellem Next-16-Flat-Config-Vertrag.
- Default-Ignores für `.next/**`, `out/**`, `build/**`, `next-env.d.ts` müssen erhalten/korrekt sein.
- Keine Regel darf nur deshalb global deaktiviert werden, damit der Upgrade-Slice grün wird. Falls React 19 / Next 16 echte neue Findings zeigt, behebe scope-treu den Code oder dokumentiere einen begründeten Blocker.
- GitHub CI soll weiterhin über `npm run lint` laufen; keine separate CI-Semantik erfinden.

### C. `middleware.ts` → `proxy.ts`

Die bestehende Netzwerk-/Auth-Grenze ist sicherheitskritisch. Migriere mechanisch und verhaltensgleich:

- Datei `middleware.ts` → `proxy.ts`;
- Export `middleware(req)` → `proxy(req)`;
- keine neue `runtime`-Konfiguration erzwingen; Next-16-Proxy läuft auf Node.js;
- bestehende Scope-Reihenfolge erhalten:
  - `/api/admin` → anonyme Requests JSON 401 + `WWW-Authenticate: Bearer`;
  - `/admin/*` außer `/admin/login` → Login-Redirect;
  - `/account/*` → Login-Redirect;
- `/admin/mfa` muss weiterhin angemeldet geschützt, aber nicht durch einen neuen Proxy-AAL2-Entscheider verfälscht werden;
- `next`-Redirectziel exakt aus `pathname + search` erhalten;
- fehlende Supabase-ENV bleibt **fail-closed**;
- Auth-Lookup bleibt `supabase.auth.getUser()`, nicht `getSession()`;
- Lookup-Fehler bleibt fail-closed (`503 lookup-failed` für API bzw. Redirect für UI);
- Supabase Request-/Response-Cookie-Weitergabe erhalten;
- **kein Matcher hinzufügen**, solange keine zwingende technische Notwendigkeit belegt ist; die bestehende Early-Return-Scope-Strategie soll erhalten bleiben;
- keine Rollen-/RLS-/AAL-Logik in den Proxy verschieben.

Kommentare/Bezeichner dürfen an `proxy`/Node angepasst werden, aber nicht die Produkt-/Security-Wahrheit ändern.

### D. Next-16-Konfigurationskompatibilität

Prüfe `next.config.js` gegen Next 16 und behebe nur konkrete Framework-Kompatibilität:

- `experimental.typedRoutes` ist in Next 16 stabil → auf den gültigen Top-Level-Vertrag migrieren, falls Build/Docs dies verlangen;
- `experimental.optimizePackageImports` nur ändern, wenn Next 16 dies konkret verlangt;
- vorhandene Image-Remote-Patterns und `minimumCacheTTL` nicht als Cleanup-Slice verändern;
- keine Cache-Components/PPR-Aktivierung;
- keine React-Compiler-Aktivierung;
- keine SEO-/Image-/Domain-Hygiene aus PR #88 nebenbei lösen.

Next 16 verwendet Turbopack standardmäßig. **Nicht still mit `--webpack` opt-outen**, nur um einen Fehler zu umgehen. Bei einem reproduzierbaren Jetnity-spezifischen Turbopack-Blocker zuerst Ursache isolieren und scope-treu beheben. Wenn dafür ein größerer Architektur-/Produkt-Slice nötig wäre: STOPP und Blocker dokumentieren.

### E. React-19-/Next-16-Codekompatibilität

Nach dem Bump:

- alle TypeScript-/Build-/Runtime-Kompatibilitätsfehler vollständig prüfen;
- mechanische React-19-/Next-16-Anpassungen sind erlaubt, wenn sie **notwendig** sind und Verhalten erhalten;
- insbesondere vorhandene `useFormState`-/Server-Action-Flächen und andere React-19-sensitive APIs prüfen;
- S1-Verträge für Promise-förmige `params` / Page-`searchParams` / Metadata / `cookies()` dürfen nicht zurückgebaut werden;
- zusätzliche vom Next-16-Build entdeckte synchrone Request-API-Nutzung scope-treu korrigieren;
- `new URL(req.url).searchParams` ist **keine** Next Request API und darf nicht pauschal verändert werden;
- keine UI-Neugestaltung, keine Produktlogikänderung.

### F. Next-16 Breaking-Change Audit auf dem tatsächlichen Repo

Vor Handoff explizit prüfen und im Status festhalten:

- Async Request APIs / `params` / `searchParams` / `cookies` / `headers` / `draftMode`;
- `generateSitemaps` async `id`, falls vorhanden;
- Parallel Routes benötigen `default.*`, falls Jetnity solche Slots besitzt;
- `revalidateTag`-Signatur, falls verwendet;
- `next/legacy/image` / `images.domains`, falls verwendet;
- neue Image-Qualities-/Defaults nur dann ändern, wenn Jetnity konkret betroffen ist;
- deprecated/removed Next Config Optionen;
- `next lint` vollständig entfernt;
- Proxy-Datei korrekt erkannt;
- Turbopack Production Build.

Keine abstrakte Checkliste als PASS verkaufen: Repository-Suche + Build sind die Evidence.

## 5. Produkt-/Truth-/Security-Verträge, die unverändert bleiben müssen

S2 ist ein Framework-Slice, **kein Produkt-Slice**. Insbesondere unverändert:

- Login/Register/Admin-MFA `next`-Sanitization und nur interne sichere Ziele;
- `/planen` Robots-/Key-Presence-Semantik aus S1;
- Trip Guest-vs-Account Ownership/Workspace-Wahrheit;
- Unauthorized-Reason einschließlich Lookup-Failure;
- Admin Users `q`/`page`-Verhalten;
- Auth-Identität serverseitig über belastbares `getUser()`;
- Guest-Quota `jetnity_gast` und fail-closed paid-call quota;
- Service-Role bleibt cookie-less und darf nicht ausgeweitet/exportiert werden;
- Multi-Citizenship/Multi-Document-/Traveller-Domainverträge bleiben unangetastet.

## 6. Hard Non-Scope

Dieser PR darf **nicht**:

- Supabase Migrationen, Schema, Daten, Auth-Konfiguration, RLS, Ownership, GRANT/REVOKE, SECURITY DEFINER oder Production-Daten verändern;
- AP-7-S2 oder sonstige Account-Traveller-Persistenz starten;
- Auth-/Session-/MFA-/AAL-Produktarchitektur neu definieren;
- Pass-/MRZ-/Biometrie-/sensible Dokumentdaten einführen;
- Provider live schalten, Secrets hinzufügen, paid provider calls ausführen;
- Payments/Geldbewegung verändern;
- Vercel Projektsettings, Domains, Env Vars oder Runtime-Settings mutieren;
- Branch Protection verändern;
- Public Launch/Indexing/Domain Cutover/App Store starten;
- PR #88 Cleanup-Funde, Issues #109/#110 oder sonstige Hygiene nebenbei lösen;
- Cache Components/PPR, React Compiler oder andere neue Next-16-Features aktivieren;
- Design/UI/IA refactoren;
- einen S3/Folgeslice automatisch starten.

Wenn ein echter Next-16-Blocker nur durch eine dieser Grenzen lösbar wäre: **STOPP und dokumentieren.**

## 7. Acceptance Criteria

Finaler Agent-Head ist erst handoff-fähig, wenn alle zutreffenden Punkte erfüllt sind:

### Dependency-/Tooling
- [ ] `next@16.3.3` exakt installiert und lockfile-konsistent.
- [ ] React/React DOM stabile kompatible 19.2.x-Linie dokumentiert.
- [ ] `eslint-config-next@16.3.3` exakt.
- [ ] ESLint Flat Config aktiv; `.eslintrc.json` entfernt, sofern vollständig ersetzt.
- [ ] `npm run lint` nutzt ESLint CLI und ist grün.
- [ ] keine Peer-Dependency-Fehler/Force-Install-Hacks.

### Runtime/Framework
- [ ] `proxy.ts` wird von Next 16 erkannt; `middleware.ts` ist nicht mehr die aktive Konvention.
- [ ] Auth-/Cookie-/Fail-Closed-Verhalten bleibt semantisch gleich.
- [ ] Next Config hat keine S2-relevanten invalid/deprecated contract errors.
- [ ] Next-16 Production Build läuft mit dem Default-Bundler, sofern kein dokumentierter harter Blocker existiert.
- [ ] S1 Promise-/Async-Verträge bleiben erhalten.

### Regression/Gates
- [ ] `npm ci`
- [ ] `npm run check:setup:ci`
- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm test` – komplette Suite
- [ ] `npm run check:api-schutz`
- [ ] `npm run check:schema-bezug`
- [ ] `npm run check:dead`
- [ ] `npm run check:exports`
- [ ] `npm run check:deps`
- [ ] `npm run build`
- [ ] gezielte neue Regressionstests für Proxy-/Next16-/Lint-Vertrag, soweit sinnvoll
- [ ] Vercel Preview auf **exaktem finalen Head** = READY
- [ ] offene GitHub Review Threads = geprüft
- [ ] Vercel Toolbar Threads = geprüft

Ein grüner Build allein reicht nicht.

## 8. Erforderliche Deliverables

Der Agent erstellt/aktualisiert mindestens:

- Implementierung + `package.json` / `package-lock.json`;
- `eslint.config.mjs` und Entfernen des ersetzten Legacy-Configs;
- `proxy.ts`;
- notwendige eng begrenzte Next-16-/React-19-Kompatibilitätsfixes;
- gezielte Regressionstests;
- `docs/NEXT16_S2_FRAMEWORK_BUMP_STATUS_2026-08-28.md`;
- `docs/NEXT16_S2_FRAMEWORK_BUMP_HANDOFF_2026-08-28.md`;
- `docs/NEXT16_S2_FRAMEWORK_BUMP_SELF_REVIEW_2026-08-28.md`;
- ADR in `DECISIONS.md` für den tatsächlichen Next-16-Runtime-Wechsel;
- minimale self-expiring Updates der kanonischen Continuity-Surfaces (`JETNITY_START_HERE.md`, `JETNITY_HANDOFF.md`, `docs/ACTIVE_WORK_STATUS.md`) nur soweit nötig, damit S2 korrekt rekonstruierbar ist.

Status/Handoff müssen enthalten:

- exact baseline / merge-base / final head / ahead-behind;
- vollständige Changed-File-Liste;
- exakte installierte Versionen und warum;
- Build-/Test-/CI-/Vercel-Evidence;
- konkrete React-19-/Next-16-Kompatibilitätsfixes;
- Proxy-Sicherheitsnachweis;
- verbleibende P0/P1/P2/P3-Risiken;
- explizite Bestätigung, dass kein Supabase/Auth/RLS/Provider/Payment/Vercel-setting/Branch-Protection-Scope verändert wurde.

## 9. Agenten- und Review-Regeln

Exakter logischer Agentenname:

`Cursor-Agent: Jetnity framework compatibility 2`

Preferred visible Cursor/session title:

`Jetnity framework compatibility 2`

Wenn Cursor eine unterstützte Rename-/Title-Funktion exponiert, darf sie verwendet werden. Falls nicht, beobachteten Titel/Session-ID ehrlich dokumentieren; keine UI-Umbenennung erfinden.

Der Agent:

- arbeitet nur auf dem S2-Branch / Draft-PR;
- macht am Ende einen adversarial Self-Review;
- refetcht `origin/main` unmittelbar vor Handoff;
- dokumentiert Drift und neue Merge-Base-Evidence;
- **markiert PR niemals Ready**;
- **merged niemals**;
- **startet keinen Folgeslice**.

Agent Self-Review ist **kein Technical-Lead PASS**.

## 10. STOPP-Punkt

Nach finalem Push, vollständigem Self-Review und Evidence-Stamp:

**STOPP für unabhängigen ChatGPT / Technical-Lead Exact-Head-Review.**

Jeder neue Push invalidiert vorherige Exact-Head-Gates. Unmittelbare Review-Fixes bleiben im selben Agenten / derselben Session `Jetnity framework compatibility 2`; danach vollständiger Re-Review und neue CI-/Vercel-Evidence.
