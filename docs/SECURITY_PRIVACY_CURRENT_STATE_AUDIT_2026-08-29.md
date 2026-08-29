# Jetnity – Security & Privacy Residual Current-State Inventory — 2026-08-29

Stand: 29. August 2026  
Cursor-Agent: **`Jetnity security privacy audit 1`**  
Cloud-Run: https://cursor.com/agents/bc-5c28e91c-c2f7-4686-935a-c8ad70e9dc52  
Observed UI-Titel: `Sicherheits- datenschutz-ist-audit` (keine programmierbare Rename-Fähigkeit; UI nicht als umbenannt behauptet)  
Task: `docs/SECURITY_PRIVACY_CURRENT_STATE_AUDIT_TASK_2026-08-29.md`  
Authoring-Branch: `audit/security-privacy-current-state-2026-08-29`  
Draft-PR: [#191](https://github.com/Jetnity/jetnity/pull/191) — **CLOSED 2026-08-29T16:25:46Z als DUPLICATE / NON-CANONICAL**  
Baseline `origin/main` (live erneut gelesen vor diesem Stamp): `69ef27b169780e41ba506a69acb15caafa645517`  
Arbeitsmodus: **RESIDUAL INVENTORY / EVIDENCE ONLY.** Keine Runtime. Keine Secrets. Keine Supabase-/Vercel-/Production-Mutation.

> **Klassifikation:** Dieses Dokument ist **kein** kanonischer neuer Security-Programmstand und **kein** Ersatz für QS-2, AP-5 Gate 0 / S1–S5, Admin-AAL2, Guest→Account-Handelsfeldschutz, Framework-Security Gate 0 oder AP-6a Gate 0.  
> Der Technical Lead hat PR #191 nach Launch als Duplikat bereits gemergter Security-Arbeit geschlossen und angewiesen, diesen Branch nicht als kanonische Current-State-Evidence zu verwenden.  
> Der Inhalt ist eine **residual-only Re-Verifikation gegen aktuelles `main`**, damit bereits geschlossene Befunde nicht erneut als offen geführt und die wirklich noch offenen Residuals nicht verloren gehen.

---

## 1. Live-Rekonstruktion

Verifiziert in diesem Lauf, 29. August 2026.

| Prüfung | Live-Stand |
| --- | --- |
| `origin/main` nach `git fetch origin main` | `69ef27b169780e41ba506a69acb15caafa645517` — *Integrate Skyscanner Flights offline adapter foundation* |
| Task-Baseline | **identisch** — STOP-Verschiebung nicht ausgelöst |
| Lokaler Branch-Head vor diesem Stamp | `24a8c8938b2123eee5e0ed121d3aec533fc05e96` — nur Task-Commit |
| Merge-Base | `69ef27b1` |
| Ahead / Behind vor diesem Stamp | **1 / 0** |
| PR #191 | **CLOSED** / Draft-Flag bleibt historisch `true`; Close-Reason: duplicate / non-canonical; **nicht wieder öffnen** |
| `main` Branch Protection | live `protected=false` (`gh api repos/Jetnity/jetnity/branches/main`); Rulesets `[]`; Protection-API 403 |
| Parallel offene Drafts (nicht angefasst) | #190 12Go, #189 Viator, #188 HBX, #187 Adapter-Core, plus historische #88/#52/#50/#40/#39/#28 |
| Provider S5-B Draft-PR #182 | live **CLOSED** / nicht gemergt (`mergedAt=null`) — ältere ACTIVE_WORK_STATUS-Zeilen, die #182 als aktuellen Block führen, sind **stale** |
| Task-Head CI | Actions Run `33262670448` **SUCCESS** (Typecheck/Lint/Build + Auth-Konfiguration) |
| Task-Head Vercel | StatusContext **SUCCESS**, Deployment `GNRvnAkEFKh44rp88Y1QRRGY8Ybv` |
| Production-Alias Legal | `https://jetnity-app.vercel.app/privacy` **404**; `/terms` **404**; `/register` **200** |
| Production-Alias Auth-Rand | `/account` → **307** `/login?next=%2Faccount`; `/admin` → **307** `/admin/login?next=%2Fadmin`; `/api/admin/security/list` → **401** JSON `unauthenticated` |
| Production-Alias HSTS | `strict-transport-security: max-age=63072000; includeSubDomains; preload` auf geprüften Flächen |
| `auth:pruefen` / `auth:fluesse` / `db:rls` / `db:sicherheit` in diesem Lauf | **nicht** ausgeführt (würden Secrets bzw. Dev-DB brauchen; nicht als gelaufen behauptet) |

Keine Secret-Werte, keine User-Daten, keine Provider-Tokens in diesem Dokument.

---

## 2. Ergebnis in einem Satz

Gegen aktuelles `main @ 69ef27b1` gibt es **kein neues P0** und **kein neues P1**. Der einzige weiterhin belegte Trust-P1 ist der bekannte Residual **D0-P1-03** (Registrierung verlangt `/privacy` und `/terms`, beide live 404). Bereits gemergte Security-Slices (QS-2, Admin-AAL2, Guest→Account-Strip, AP-5 S1–S5, AP-6a Gate-0-Vertrag) bleiben **geschlossen bzw. als Vertrag integriert**, nicht erneut als offene Defekte.

---

## 3. Methode und Traveller-Kontext

Gelesen vor der Prüfung: Task, `JETNITY_START_HERE.md`, Operating Standard, Engineering Excellence, Binding Build Order, Continuity, Progress Persistence, AUTH.md, AP-6a-Status, Account-Plan, Search/Privacy-Checkpoint, Traveller-Context-Policy, Product Quality.

Verifiziert gegen aktuellen Code, Migrationen, Inventory-Tests und read-only öffentliche Production-Responses. Historische PASS-Berichte wurden **nicht** als Beweis übernommen; geschlossene Befunde wurden am Code erneut geprüft.

**Traveller-Context:** Dieses Residual-Inventory ändert keine Runtime. Passport-/Dokument-Speicherung bleibt datensparsam (Typ, Ausstellerland, Ablauf — keine Nummer/MRZ/Scan). Keine neue Credential-Erhebung. Route Truth bleibt unberührt.

---

## 4. Geschlossene historische Security-Befunde (erneut geprüft, nicht neu öffnen)

| ID | Früherer Befund | Current class | Evidence 2026-08-29 |
| --- | --- | --- | --- |
| P1-QS2-01 | Admin-Login ohne AAL2 | **CLOSED** | `applyAdminAal()` verlangt `currentLevel === 'aal2'` (`lib/auth/admin-aal.ts`); `requireAdminPage` / `requireAdminApi`; Production-Alignment-Migration `20260827170000_admin_aal2_data_plane_alignment.sql`. Live Production-Katalog in diesem Lauf **UNKNOWN** (kein Supabase-Read). Account-Plan und spätere Checkpoints führen Apply als ausgeführt; `docs/AUTH.md` §3 ist an dieser Stelle **stale** (Stand 17.08., „Production nicht“). |
| P1-QS2-02 | Guest→Account persistiert Stay/Activity-Handelsfelder | **CLOSED** | `nutzlastOhneUnbewieseneHandelsfelder()` (`lib/trips/handelsfelder-nutzlast.ts`) + `reiseAusNutzlastAnlegen` + DB-Nulling in `20260829140000_trip_item_commercial_provenance.sql`. Tests: `lib/trips/uebernahme.test.ts`. |
| P1-QS1-01 | Coverage-Route verdoppelt | **CLOSED** (nicht erneut reproduziert; nicht Security-Scope) | Historisch über TW-5-Linie geschlossen; nicht re-litigiert. |
| getSession als Server-Auth | Server-Auth über Cookie-Session | **CLOSED** | Proxy und Admin-Guard nutzen `getUser()` (`proxy.ts`, `lib/auth/admin-guard.ts`). |
| Proxy fail-open ohne ENV | Geschützte Flächen offen ohne Supabase-ENV | **CLOSED** | `proxy.ts` 74–80 fail-closed 503/deny. |
| Service-Role im Produktpfad | Cookie-gebundener Admin-Client | **CLOSED im App-Pfad** | Kein exportierter Service-Role-Client in `lib/supabase/server.ts`. Service Role nur `lib/modell/kontingent.ts` für Quota-RPCs. |
| OAuth-Buttons trotz Disable | UI zeigt Google/Apple | **CLOSED als Enablement** | `supabase/config.toml` `auth.external.google/apple.enabled = false`; `sichtbareOauthAnbieter()`; Test `lib/auth/oauth-anbieter.test.ts`. |
| Admin-API ohne zentrales Gate | Offene Admin-Routen | **CLOSED** | `npm run check:api-schutz` in diesem Lauf: **12/12** `requireAdminApi()`. Live `/api/admin/security/list` → 401. |
| Open Redirect nach Login | `next=` auf fremden Host | **CLOSED für Consumer/Admin-Ziele** | `erlaubtesNaechstesZiel()` / `erlaubtesAdminZiel()`; Tests `lib/auth/naechstes-ziel.test.ts`. |
| AP-5-S2 Passwort | Keine In-Account-Änderung | **INTEGRIERT** | `reauthenticate()` → Nonce → `updateUser({ password, nonce })`. |
| AP-5-S3 Logout-Scopes | Scopes unnutzbar | **INTEGRIERT** | `local` / `others` / `global` in `/account/security`. Navbar bleibt unscoped `global`. |
| AP-5-S4 MFA Unenroll | Unenroll ohne Step-up | **INTEGRIERT** | `lib/auth/account-mfa-step-up.ts`. |
| AP-5-S5 Session View | Unehrliche Geräteliste | **INTEGRIERT** | Andere Sitzungen ausdrücklich `unsupported`. |
| AP-6a Gate 0 | Legal-Lücke unkontraktiert | **INTEGRIERT als Vertrag, nicht als Runtime** | Inventory-Test 9/9 in diesem Lauf. Keine Legal-Pages. |
| Skyscanner-Foundation | Neuer Live-Provider? | **Kein Live-Pfad** | `skyscannerFixtureNormalisieren()` ist offline/fixture; `javascript:`-Deeplinks werden verworfen; Production-Flugsuche bleibt fail-closed (`lib/flights/zustand.ts`). |

---

## 5. Residual-Findings

### P1 — D0-P1-03 (bekannt, erneut belegt) — Legal-404 an der Registrierungs-Trust-Boundary

| Feld | Inhalt |
| --- | --- |
| Severity | **P1** (kein neues P1; Residual von D0 / AP-6a) |
| Klasse | confirmed defect |
| Surface | `components/auth/RegisterForm.tsx`; fehlende `app/(public)/privacy/page.tsx` und `app/(public)/terms/page.tsx` |
| Owner | `Account plattform audit vorbereitung` nach Product-Owner-/Legal-Content-Gate |
| Shared / PO-Gate | Legal-Texte dürfen nicht erfunden werden. Runtime erst nach AP-6a-Content-Vertrag. |

**Evidence**

- Register-Checkbox + Links `/terms` und `/privacy`; Submit `disabled={loading \|\| !accept}` (`RegisterForm.tsx` 353–368).
- Production-Alias 29.08.2026: `/register` HTTP **200**, enthält `/privacy`, `/terms`, `DSGVO`, `CH-DSG`; `/privacy` und `/terms` HTTP **404**.
- Repository: keine App-Pages. Inventory-Test `lib/legal/ap6a-gate0-legal-foundation-inventory.test.ts` **9/9 PASS**, darunter „Pflichtrouten haben keine App-Page“.
- Zusätzliche Copy: „Datenschutz: DSGVO & CH-DSG konform.“ auf Register **und** Login, ohne belegte Legal-Seite (Inventory-Test Zeile 94–103).

**Failure condition**

Ein Nutzer muss Nutzungsbedingungen und Datenschutzerklärung akzeptieren, die Jetnity öffentlich nicht ausliefert. Die Konformitätszeile ist unbelegt. Das ist eine Trust-/Privacy-Grenze, kein Auth-Bypass.

**Minimaler Closure-Scope**

AP-6a-Runtime **nach** Product-Owner-/Legal-Input laut `docs/AP6A_GATE0_LEGAL_CONTENT_INPUT_CONTRACT_2026-08-29.md` und Runtime-Vertrag. Keine Rechtstexte in einem Security-Slice erfinden. Die unbelegte Konformitätszeile gehört in denselben Legal-Slice, nicht in einen parallelen Copy-Fix.

**Nicht** in diesem Slice schließen.

---

### P2-SP-01 — Browser-Defense-in-Depth-Header fehlen in Repo und auf geprüften Production-Flächen

| Feld | Inhalt |
| --- | --- |
| Severity | **P2** |
| Klasse | confirmed config residual |
| Surface | `next.config.js` (kein `headers()`), `vercel.json` (`{ "version": 2 }`), live Production-Antworten |
| Owner | Technical Lead / kleiner Ops-Slice; kein Provider, keine Auth-Architektur |

**Evidence**

Live `GET https://jetnity-app.vercel.app/login` (200): HSTS vorhanden; **kein** `Content-Security-Policy`, **kein** `X-Frame-Options`, **kein** `X-Content-Type-Options`, **kein** `Referrer-Policy`, **kein** `Permissions-Policy`.

Live `/admin/login` (200, prerender HIT): dieselben Lücken **plus** `access-control-allow-origin: *` und `cache-control: public`.

`/login` selbst ist `cache-control: private, no-store` und **ohne** `ACAO *`.

**Failure condition**

Login- und Admin-Login-UI können in einem fremden Frame eingebettet werden (UI-Redressing). `ACAO *` ohne Credentials liest keine Session-Cookies; das ist **kein** Cross-Origin-Account-Diebstahl. Deshalb nicht P1.

**UNKNOWN:** Ob ein Vercel-Projekt-WAF zusätzliche Header setzt, die `curl` nicht zeigt. CSP/XFO fehlen in der HTTP-Antwort nachweislich.

**Minimaler Closure-Scope**

Explizite Header in `next.config.js` oder Vercel-Projekt: mindestens `frame-ancestors 'none'` / `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, restriktives Referrer-Policy. `ACAO *` auf HTML-Prerender prüfen und entfernen, sofern nicht bewusst für ein öffentliches Asset. Kein CSP-Monster-PR.

---

### P2-SP-02 — `main` Branch Protection ist live aus

| Feld | Inhalt |
| --- | --- |
| Severity | **P2** (Governance; historische Klassifikation beibehalten) |
| Klasse | confirmed governance residual |
| Surface | GitHub `Jetnity/jetnity` Branch `main` |
| Owner | Product Owner — Branch Protection ist ausdrücklich PO-Gate |

**Evidence**

`gh api repos/Jetnity/jetnity/branches/main` → `protected: false`. Rulesets leer. Wiederholt in Continuity-Dateien dokumentiert.

**Failure condition**

Ein Push auf `main` umgeht Draft-PR, unabhängigen Technical-Lead-Review und CI-as-gate. Das ist ein Organisations-/Integrationsrisiko, kein App-Exploit.

Nicht in diesem Audit ändern.

---

### P2-SP-03 — Consumer-Login-MFA ist UI-abbrechbar; Account-Proxy prüft kein AAL

| Feld | Inhalt |
| --- | --- |
| Severity | **P2** (dokumentierte Produktwahl; AP-5-P3 wäre globales Consumer-AAL2 und bleibt PO-Gate) |
| Klasse | confirmed residual / product choice |
| Surface | `components/auth/LoginForm.tsx` `onClose={() => setMfaOpen(false)}`; `proxy.ts` prüft nur `getUser()` |

**Evidence**

Nach `signInWithPassword` öffnet die UI TOTP, wenn `nextLevel === 'aal2'`. Schließen des Dialogs beendet die Passwort-Session nicht. `/account/*` ist hinter Identität, nicht hinter AAL2.

Admin-Flächen sind davon **nicht** betroffen (`applyAdminAal`).

**Failure condition**

Wer Faktor 1 eines Kontos mit eingerichtetem TOTP stiehlt, erreicht Consumer-Account-Flächen ohne Faktor 2, sofern GoTrue die AAL1-Session nicht selbst beendet. `mfa_allow_low_aal` ist im Repo als `false` erwartet (`OHNE_TOML_SCHLUESSEL`); **ob Production das heute erzwingt, ist UNKNOWN** (`auth:pruefen` nicht gegen Production).

Kein P1: kein unauthentisierter Zugriff; Admin bleibt AAL2.

---

### P2-SP-04 — OAuth-Consent- und OAuth-MFA-Lücken sind Enablement-Residuals

| Feld | Inhalt |
| --- | --- |
| Severity | **P2 heute** / **P1-falls-aktiviert ohne Fix** |
| Klasse | likely risk, currently gated off |
| Surface | `RegisterForm.tsx` `handleOAuth` prüft `accept` nicht; `CallbackClient.tsx` hat keinen `getAAL`-Step-up |

**Evidence**

Inventory-Test: OAuth-Start auf `/register` enthält `accept` nicht. `config.toml` hält Google/Apple `enabled = false`. Sichtbare Buttons fail-closed.

**Failure condition**

Wenn ein späterer Slice OAuth einschaltet, ohne Consent-Gate und Callback-MFA nachzuziehen: Konto ohne dieselbe Legal-Checkbox; TOTP-Nutzer umgehen den Password-Login-Dialog.

Kein aktuelles P1, weil Enablement aus ist.

---

### P2-SP-05 — Consumer-Datenexport und Kontolöschung fehlen

| Feld | Inhalt |
| --- | --- |
| Severity | **P2** |
| Klasse | confirmed product/privacy gap |
| Surface | keine `app/account/export/page.tsx`, keine `app/account/delete/page.tsx`; Account-Plan §5.2 `missing` |
| Owner | AP-6b nach Legal-Foundation; nicht aus diesem Audit starten |

Trip-Löschen und trip-scoped Traveller-Löschen existieren (`reiseLoeschen`, `party_loeschen`). Das ersetzt keine Konto-/Auth-User-Löschung.

---

### P2-SP-06 — Registrierungs-Consent wird nicht persistiert; CookieConsent ist Orphan

| Feld | Inhalt |
| --- | --- |
| Severity | **P2** |
| Klasse | confirmed gap / documentation debt |
| Surface | `RegisterForm` `signUp` ohne Consent-Metadaten; keine Consent-Migration; `components/layout/CookieConsent.tsx` ungemountet, V1-Text „Views/Likes“, Link auf 404 |

Bekannt aus AP-6a. Kein Exploit. Schließt nicht D0-P1-03.

---

### P2-SP-07 — Provider-Rate-Limits sind prozesslokal; Public-Search ohne Limit

| Feld | Inhalt |
| --- | --- |
| Severity | **P2** im aktuellen Production-Zustand (Flugsuche fail-closed) |
| Klasse | confirmed abuse/cost residual |
| Surface | `lib/provider-ops/cost-guard.ts`; `app/api/search/places/route.ts`; `app/api/search/airports/route.ts` |

**Failure condition**

Sobald bezahlte Provider-Suche auf Preview/Production aktiv ist, reicht In-Memory-Limit nicht über mehrere Vercel-Instanzen. Public Places/Airports sind anonym lesbar und unbegrenzt — Last auf Referenzdaten, kein User-PII.

Vor Provider-Live gehört persistentes Limit in S6 / PROVIDER-ACTIVATION-GATE. Nicht P1, solange Production-Flugsuche hart aus ist (`lib/flights/zustand.ts`).

---

## 6. Positive Kontrollen (kurz)

- Identity-Proxy fail-closed, `getUser()`, Admin-API 401 live.
- Admin AAL2 im App-Guard; Break-glass schreibt nicht (`adminWriteErlaubt`).
- Guest→Account Commercial-Strip client + server + SQL.
- Traveller-Schema ohne Nummer/MRZ/Scan; API-Parser rejectet sensible Keys.
- Keine `NEXT_PUBLIC_` Provider-Secrets.
- Open-Redirect-Allowlists getestet.
- Provider-POST: JSON, Bounded Body, Zod.
- Skyscanner-Foundation bleibt Fixture; HTTPS-Deeplink-only.
- HSTS live auf Production-Alias.

---

## 7. UNKNOWN / Evidence-Lücken

| Gap | Warum UNKNOWN |
| --- | --- |
| Live Production RLS/Grant-Katalog vs Migrations-Head | Kein Supabase-Production-Read in diesem Audit |
| Live Production Auth-Config vs `config.toml` | `auth:pruefen` prüft den Development-Branch; Production-Parent in AUTH.md ist vom 17.08.2026 |
| `mfa_allow_low_aal` auf laufendem Production-Auth | Nur Repo-Erwartung + historische Parent-Spalte |
| Cookie `Secure` / `HttpOnly` / `SameSite` der Supabase-Session | Delegiert an `@supabase/ssr`; nicht in Jetnity gesetzt |
| Dev-DB-Drift (`trip_item_commercial_provenance`) | In diesem Lauf nicht gegen eine Dev-DB geprüft |
| Preview-SSO / Real-Device MFA | Nicht ausgeführt |
| Ob `jetnity.com` dieselben Legal-404 liefert | Canonical-Domain-Cutover nicht verbunden; nur `jetnity-app.vercel.app` geprüft |
| CVE-Stand der Lockfile-Pins | Kein Advisory-Scan |
| S5-B Production-Apply | PR #182 CLOSED unmerged; Persistenz nicht als Production behauptet |

---

## 8. Priorisierter Remediation-Backlog (sichere Slice-Grenzen)

Kein Slice startet aus diesem Dokument automatisch. Kein Ready. Kein Merge.

| Prio | ID | Arbeit | Dateien / Vertrag | Evidence-für-Done | Darf parallel? | Gate |
| --- | --- | --- | --- | --- | --- | --- |
| P1 | D0-P1-03 | Legal-Runtime `/privacy` `/terms` + entfernen/ersetzen der unbelegten DSGVO-Zeile | AP-6a Runtime-Vertrag, `RegisterForm.tsx`, `LoginForm.tsx` | Pages 200; Register-Links treffen Texte; Inventory-Test umkehren; **keine erfundenen Texte** | Nein — wartet auf PO/Legal-Content | PO/Legal |
| P2 | P2-SP-01 | Security-Header + Admin-Login nicht `ACAO *` | `next.config.js` und/oder Vercel-Headers | `curl -I` zeigt XFO/CSP-frame-ancestors, nosniff; Admin-Login ohne `ACAO *` | Ja, konfliktarm zu Legal | Normaler TL-Ops-Slice |
| P2 | P2-SP-02 | Branch Protection auf `main` | GitHub Settings, nicht Repo-Code | `protected=true` + Required checks + keine Direct Pushes | Ja, organisatorisch | **PO-Gate** |
| P2 | P2-SP-05 / P2-SP-06 | AP-6b Export/Löschung + Consent-Persistenz | neue Account-Routen, ggf. Migration/RLS | eigener Task; Least Privilege; keine zweite PII-Wahrheit | Nach Legal-Runtime | PO/Legal + Shared Privacy |
| P2 | P2-SP-07 | Persistente Rate-Limits vor paid search | Provider-Ops / S6 | Multi-Instance-Beweis; Production bleibt fail-closed bis Activation | Ja als Vorbereitung; **Activation** extra | Provider-Activation PO |
| P2 | P2-SP-04 | OAuth-Consent + Callback-MFA **vor** Enablement | `RegisterForm`, `CallbackClient`, TOML | Inventory-Tests auf `accept` + `getAAL`; Provider bleiben aus bis PASS | Muss vor OAuth-on | PO Enablement |
| P2 | P2-SP-03 | Consumer-AAL2 nur wenn gewollt | Proxy/Account-Guard | Nicht still einführen | Nein | **PO-Gate AP-5-P3** |
| P3 | AUTH.md Drift | Production-AAL2-Satz an Live-Checkpoints angleichen | `docs/AUTH.md` | Docs-only; kein Auth-Push | Ja | Docs |

**Nicht** in diesen Backlog mischen: Provider-Aktivierung, Commercial-Provenance-Mint, Payments, Public Launch, Skyscanner-Live-Transport, AP-7-Persistenz, TW-8.

---

## 9. Tests / Checks in diesem Lauf

| Check | Ergebnis |
| --- | --- |
| `lib/legal/ap6a-gate0-legal-foundation-inventory.test.ts` | **9/9 PASS** |
| `npm run check:api-schutz` | **PASS** (12 Admin-Routen) |
| `lib/auth/oauth-anbieter.test.ts` + `naechstes-ziel.test.ts` + `proxy-security-contract.test.ts` | **19/19 PASS** |
| Production-Build / volles `npm test` | **nicht** als Abschluss dieses Docs-Stamps behauptet; Task-Head CI `33262670448` SUCCESS gilt nur für den Task-Commit |
| `auth:pruefen` / `db:sicherheit` / `db:rls` | **nicht gelaufen** |

Keine produktiven Codeänderungen. `next-env.d.ts` lokale Dev-Drift wurde verworfen.

---

## 10. STOP

Nach Self-Review und Continuity-Stamp: **STOP** für unabhängigen ChatGPT Technical-Lead-Review.

- Kein Ready.
- Kein Merge.
- PR #191 nicht wieder öffnen.
- Kein Follow-up-Implementierungs-Slice.
- Diesen Branch nicht als kanonische Security-Current-Truth nach `JETNITY_START_HERE.md` / `JETNITY_HANDOFF.md` heben.
