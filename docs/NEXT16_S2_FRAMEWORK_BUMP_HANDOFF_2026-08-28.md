# Jetnity – Next 16 S2 Framework Bump Handoff

Stand: 28. August 2026  
Status: **DRAFT / STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW**  
Logical Cursor-Agent: **`Cursor-Agent: Jetnity framework compatibility 2`**  
Draft-PR: https://github.com/Jetnity/jetnity/pull/151  
Branch: `feat/next16-s2-framework-bump-2026-08-28`

Dieser Handoff übergibt Slice 2: den tatsächlichen Next-16.3.3-Framework-Bump. Er startet **kein** S3. Agent-Self-Review ist kein PASS. Jeder neue Head invalidiert Prior-Gates. Unmittelbare Review-Fixes bleiben dieselbe Session.

---

## 1. Was dieser Agent getan hat

1. Registry/Peers vor Install erneut geprüft. `next` und `eslint-config-next` exakt auf `16.3.3`, React/React-DOM auf `19.2.8`, Types 19.2, ESLint `9.39.5`, TypeScript `5.9.3`. Kein Force-/legacy-peer-deps-Hack.
2. `next lint` durch `eslint .` ersetzt und `.eslintrc.json` auf die offizielle Next-16-Flat-Config migriert, ohne Regeln global auf `off` zu setzen.
3. `middleware.ts` zu `proxy.ts` umbenannt, Export `proxy`, fail-closed Auth-/Cookie-Semantik erhalten, kein Matcher.
4. Nur notwendige Next-16-/React-19-Kompatibilität: `typedRoutes` top-level, `useActionState`, typed `cookies().delete`, `data-scroll-behavior`, reine Error-Support-ID, `next typegen` vor `tsc`.
5. Breaking-Change-Audit gegen das echte Repo und den Turbopack-Production-Build. `new URL(req.url).searchParams` nicht pauschal umgeschrieben.
6. Gezielte Proxy-/Framework-Vertrags-Tests. Vollständiges lokales Gate-Set ausgeführt.
7. Status / Self-Review / ADR-0191 / kanonische Continuity self-expiring aktualisiert.

Kein Ready. Kein Merge. Kein S3.

---

## 2. Naming

| Feld | Wert |
| --- | --- |
| Logischer Name | `Cursor-Agent: Jetnity framework compatibility 2` |
| Preferred visible title | `Jetnity framework compatibility 2` |
| Observed run title | `Jetnity framework bump` |
| Evidence | https://cursor.com/agents/bc-ddde1a19-b2c8-420d-916a-db4e31a3aca3 |
| Rename-Fähigkeit | keine |
| Generation | 2. Unmittelbare Review-Fixes bleiben dieselbe Session. |

---

## 3. Git / Live-Evidence

| Fakt | Wert |
| --- | --- |
| Task-Baseline / `origin/main` Re-Fetch | `d7f02f77c0796b0ec04675191742049a222cfab9` |
| Merge-Base | exakt dieselbe SHA – **kein Drift** |
| Ahead / Behind vor Stamp | **8 / 0** Implementierung inkl. Typegen-Fix; Stamp-Commit kommt hinzu |
| Exact / Stamp-Head | Commit dieses Handoffs; live an PR #151 prüfen |
| Draft-PR | #151 OPEN / Draft |
| Branch Protection | unverändert; letzte bekannte Evidence `protected=false` |
| Production-Baseline laut Auftrag | Vercel `dpl_2auCtkwfir4bU8mhohaWPyBi3oqu` READY auf `main @ d7f02f77` – **TL-Auftragswahrheit, nicht von diesem Agent geholt** |
| GitHub Actions / Vercel Preview dieses Heads | Platform-Evidence nach Push; TL verifiziert unabhängig |

### Geänderte Dateien gegen `origin/main` vor diesem Stamp

Runtime / Tooling / Tests:

- `package.json`, `package-lock.json`
- `tsconfig.json`, `next-env.d.ts`
- `eslint.config.mjs`; `.eslintrc.json` entfernt
- `next.config.js`
- `middleware.ts` → `proxy.ts`
- `app/layout.tsx`, `app/(public)/error.tsx`, `app/(public)/admin/login/page.tsx`
- `lib/supabase/server.ts`
- `lib/auth/proxy-security-contract.test.ts`, `lib/auth/admin-aal-wiring.test.ts`
- `lib/next/framework-bump-contract.test.ts`, `lib/next/request-api-compat.test.ts`
- `scripts/erreichbarkeit.mjs`
- `docs/NEXT16_S2_FRAMEWORK_BUMP_TASK_2026-08-28.md`

Nach diesem Stamp zusätzlich Status/Handoff/Self-Review/ADR/Continuity. Vollständige Liste live am PR prüfen.

---

## 4. Ist-Zustand in einem Satz

Jetnity läuft auf diesem Draft-Branch auf **Next.js 16.3.3 (Turbopack)** mit React 19.2.8, ESLint CLI/Flat Config und `proxy.ts`. Production/`main` bleibt bis zum unabhängigen Technical-Lead-Ready/Merge auf der integrierten S1-Baseline `next@14.2.32`.

---

## 5. Was der Technical Lead zuerst prüfen sollte

1. `next@16.3.3` / `eslint-config-next@16.3.3` exakt; keine Force-Installs.
2. `proxy.ts` exportiert `proxy`; `middleware.ts` fehlt; kein matcher; `getUser()`; fail-closed ENV/Lookup; `/admin/mfa` nicht aus dem Admin-Scope ausgenommen.
3. Cookie getAll/setAll und `x-middleware-cache: no-cache` erhalten.
4. `typedRoutes` top-level; keine Cache Components / PPR / React Compiler; kein `--webpack`.
5. S1 Promise-PageProps und `await cookies()` nicht zurückgebaut.
6. `new URL(req.url).searchParams` nicht pauschal umgeschrieben.
7. ESLint-Regeln nicht global `off`; nur begründete Severity/`config.js`-Ausnahme.
8. `typecheck` läuft `next typegen && tsc`, weil CI typecheck vor build ausführt.
9. Production-Build ist Next 16.3.3 Turbopack, nicht Webpack-Opt-out.
10. Keine Supabase-/Vercel-Setting-/Branch-Protection-Mutation.
11. PR bleibt Draft.

---

## 6. Exakter nächster Schritt

**Unabhängiger ChatGPT / Technical-Lead Exact-Head-Review von Draft-PR #151.**

Kein Ready. Kein Merge. Kein S3. Bei CHANGES REQUIRED bleibt **dieselbe Session / derselbe logische Agent**.
