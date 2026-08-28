# Jetnity – Next 16 S2 Framework Bump Self-Review

Stand: 28. August 2026  
Autor-Agent: **`Cursor-Agent: Jetnity framework compatibility 2`**  
Typ: adversarial Self-Review, **kein** unabhängiger Technical-Lead-PASS

## 1. Auftrag gegen Diff

Auftrag: `docs/NEXT16_S2_FRAMEWORK_BUMP_TASK_2026-08-28.md` auf Draft-PR #151 / Branch `feat/next16-s2-framework-bump-2026-08-28`.

Geprüft gegen den tatsächlichen Diff zu `origin/main @ d7f02f77`:

- `next` / `eslint-config-next` exakt 16.3.3
- React 19.2.8 + Types 19.2
- ESLint 9.39.5 + Flat Config; `.eslintrc.json` entfernt
- `lint` = `eslint .`
- `middleware.ts` → `proxy.ts`
- Next-16-Config ohne Cache Components/PPR/Compiler
- notwendige React-19-/Next-16-Fixes
- gezielte Tests
- keine `supabase/migrations`
- keine Vercel-Projektmutation

## 2. Adversarial Fragen

| Frage | Ergebnis |
| --- | --- |
| Ist `next` exakt 16.3.3 und lockfile-konsistent? | Ja. `package.json` pinnt `16.3.3`; `npm ls` löst `next@16.3.3` auf. |
| Wurde `--force` oder `--legacy-peer-deps` dauerhaft verwendet? | Nein. |
| Ist ESLint 10 die „aktuelle stabile Linie“, und wurde sie trotzdem gemieden? | Ja bewusst. ESLint 10 bricht `eslint-plugin-react` unter `eslint-config-next@16.3.3`. 9.39.5 ist die kompatible Linie; npm-deprecation ist Residual. |
| Wurde `next lint` entfernt? | Ja. `lint` ist `eslint .`. |
| Wurden Lint-Regeln global abgeschaltet, nur damit S2 grün wird? | Nein. Compiler-Hooks und `no-explicit-any` sind `warn`. `no-require-imports` ist nur für CJS-Configs `off`. |
| Existiert `middleware.ts` noch als aktive Konvention? | Nein. Rename auf `proxy.ts`, Export `proxy`. |
| Wurde ein matcher oder `runtime` hinzugefügt? | Nein. Tests prüfen ausführbare Muster, nicht Kommentartext. |
| Sitzt AAL2 oder `requireAdminApi` im Proxy? | Nein. Keine Imports von `admin-guard` / `admin-access` / `admin-aal`. `/admin/mfa` bleibt im Admin-Login-Scope. |
| Bleibt Identität `getUser()`? | Ja. Kein `auth.getSession()`. |
| Bleiben fail-closed ENV und Lookup-Fehler? | Ja. API 503 `unconfigured` / `lookup-failed`; UI-Redirect über denselben Scope-`deny`. |
| Bleibt `next` = pathname + search? | Ja. |
| Wurde Cache Components, PPR oder React Compiler aktiviert? | Nein. Contract-Test prüft die Abwesenheit. |
| Wurde `--webpack` still hinzugefügt? | Nein. Clean-`.next` Turbopack-Build ist grün. Der erste Build-Fehler war stale Next-14-`.next`. |
| Wurden S1 Promise-/Async-Verträge zurückgebaut? | Nein. Factories bleiben `async` + `await cookies()`. PageProps bleiben `Promise<T>`. |
| Wurden normale `URLSearchParams` pauschal umgeschrieben? | Nein. |
| Wurde `useFormState` belassen? | Nein. Admin-Login nutzt `useActionState` aus `react`. |
| Wurde eine unreine Error-ID (`Date.now`/`Math.random`) belassen? | Nein. Digest zuerst; ohne Digest `useId()` über `oeffentlicheFehlerId`. |
| Ist der Fallback eine gemeinsame Konstante wie `#unbekannt`? | Nein nach Review-Fix `5e98a38e`. Tests scheitern, wenn `error.tsx` `#unbekannt` oder unreine Zeit-/Zufallsaufrufe zurückbekommt. |
| Wurde Service-Role ausgeweitet? | Nein. |
| Wurde Supabase/Auth/RLS/Schema mutiert? | Nein. |
| Wurde Ready/Merge ausgeführt oder als PASS empfohlen? | Nein. STOPP für unabhängigen TL-Review. |
| Wurde S3 gestartet? | Nein. |
| Wurde Generation 3 wegen UI-Titel erfunden? | Nein. Generation 2 bleibt 2. |

## 3. Bewusst belassene Residuals

- 133 ESLint-Warnings (Hooks-Compiler + `any`) bleiben sichtbar.
- ESLint 9.39.5 ist npm-deprecated; kein Sprung auf 10 in S2.
- Admin Users behält historisches `as any`.
- Sichtbarer Cursor-Titel weicht ab; logischer Name ist korrekt persistiert.
- `main protected=false` unverändert.

## 4. Risiken, die bleiben

- P1 Auth-/Cookie-/Proxy- und `/planen`-Metadata-Regression in echter Preview/SSR.
- P1 stale `.next` aus Next 14 kann einen Local-Rebuild täuschen; CI muss clean starten.
- P2 `main protected=false`.
- Unit-Source-Scans ersetzen keine unabhängige Preview-Verifikation.

## 5. Urteil des Autors

S2 ist scope-treu implementiert. Der P1-Fund aus CHANGES REQUIRED `5055372760` ist lokal behoben: die öffentliche `Fehler-ID` bleibt Digest-first und ohne Digest instanzstabil über `useId()`, nicht konstant `#unbekannt`.

**Unabhängiger Technical-Lead Exact-Head-Re-Review: ausstehend. Dieses Self-Review ersetzt ihn nicht und ist kein PASS.**
