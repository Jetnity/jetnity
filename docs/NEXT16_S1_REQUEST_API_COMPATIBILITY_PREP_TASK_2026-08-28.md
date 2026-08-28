# Jetnity – Next 16 Compatibility Prep S1: Async Request API / Auth-Cookie Compatibility

Stand: 28. August 2026  
Status: **VERSIONIERTER IMPLEMENTIERUNGSAUFTRAG / S1 / KEIN FRAMEWORK-BUMP**  
Workstream: Ops / Framework Compatibility  
Cursor-Agent: **`Cursor-Agent: Jetnity framework compatibility 1`**  
Preferred visible Cursor title: **`Jetnity framework compatibility 1`**  
Branch: `feat/next16-s1-request-api-compat-prep-2026-08-28`  
Baseline: `main @ 2fdf8a18ab99d22a3ba75df7bd8451908593714f`

> Live-Evidence gewinnt immer. Agent-Self-Review ist kein Technical-Lead-PASS. Der Autor darf niemals Ready setzen oder mergen. Jeder neue Head invalidiert frühere Exact-Head-Gates.

## 1. Warum dieser Slice jetzt kommt

PR #148 / Next.js Framework Security Upgrade Gate 0 ist integriert. PR #149 hat die ausdrückliche Product-Owner-Freigabe für das gestufte Upgrade-Programm integriert.

Technical-Lead-Live-Verifikation am 28. August 2026:

- `main = 2fdf8a18ab99d22a3ba75df7bd8451908593714f`;
- GitHub Actions `33208354715` ist SUCCESS auf exakt diesem `main`;
- Vercel Production `dpl_6FBEqSPthrixAsruftjYWw2rVZjY` ist READY, `target=production`, exact Git SHA `2fdf8a18ab99d22a3ba75df7bd8451908593714f`, `aliasError=null`;
- `main` Branch Protection bleibt `protected=false` und wird in diesem Slice nicht verändert;
- Next.js 16.x ist weiterhin Active LTS; die aktuelle unterstützte/security-gepatchte stabile 16.x-Referenz ist `16.3.3` (offizielle Support-/Security-Evidence vom 28.08.2026). Diese Live-Auflösung betrifft erst S2; **S1 bleibt vollständig auf `next@14.2.32`**.

Verbindliche Product-Owner-Evidence: `docs/NEXT16_PRODUCT_OWNER_APPROVAL_2026-08-28.md`.

## 2. Ziel

Jetnitys heute noch synchron verwendete Next Request APIs werden **auf der bestehenden Next-14-Runtime** so vorbereitet, dass der spätere Next-16-Major-Bump keinen unnötig großen Auth-/Request-API-Sprung mehr enthält.

S1 ändert **keine Framework-/Runtime-Dependency**. Es ändert nur die nötigen Anwendungssignaturen und Caller auf async-kompatible Request-API-Verwendung und bindet die heutige Produkt-/Security-Truth mit gezielten Regressionstests fest.

Die zentrale Maxime lautet:

> **Async-Kompatibilität vorbereiten, Verhalten nicht neu erfinden.**

## 3. Acceptance Criteria

### AC-1 – Supabase Server Factories werden async-kompatibel

In `lib/supabase/server.ts`:

1. `createServerComponentClient`, `createRouteHandlerClient` und `createServerActionClient` werden asynchron und verwenden `await cookies()`.
2. Cookie-Adapter-Typisierung muss auf der bestehenden Next-14-Linie sauber kompilieren und darf den späteren Promise-basierten Request-API-Vertrag nicht durch `any`, neue `@ts-ignore` oder unsichere Casts wegdrücken.
3. RSC bleibt read-only; Route Handler / Server Actions bleiben mutierbar.
4. `get`, `getAll`, `set`, `remove/delete` behalten ihre bestehende Semantik.
5. Keine Änderung an Supabase-URL/Anon-Key-Truth, keine Service-Role-Ausweitung, kein Wechsel von `auth.getUser()` auf ungeprüfte Session-Claims.
6. Der bestehende Alias `createServerClient` darf keine versteckte synchrone Hintertür erzeugen. Seine Caller müssen ebenfalls korrekt async werden oder der Alias muss innerhalb des bestehenden Contract sauber angepasst werden.

### AC-2 – Alle direkten Factory-Caller werden vollständig nachgezogen

Repository-weit alle direkten und alias-basierten Caller der drei Factories inventarisieren und korrekt `await`en.

Mindestens die Gate-0-Flächen berücksichtigen:

- Public/RSC: Login, Register, Planen, Reisen, Trip Workspace, Account;
- Admin-RSC und Admin-Guards;
- Server Actions in Trips, Places, Sign-out, Admin Login/Users sowie Flight/Hotel/Activity/Mobility/Rental-Car/Readiness/Reiseänderung-Pfaden;
- Route Handler unter Search, Flights und Admin APIs;
- Admin System Health / Provider Ops Runtime;
- sämtliche Imports des Kompatibilitätsaliases `createServerClient`.

Die Liste ist **keine Auslassungserlaubnis**. Der Agent muss die tatsächliche Repository-Suche als Source of Truth verwenden.

Keine Promise-Objekte dürfen versehentlich als Supabase-Clients weitergereicht werden. Kein fire-and-forget.

### AC-3 – Guest-Quota-Cookie bleibt exakt sicher und fail-closed

In `lib/modell/kontingent.ts`:

1. `gastkennung()` wird async und verwendet `await cookies()`.
2. Alle Caller werden entsprechend awaited.
3. `kontoId()` verwendet den nun asyncen `createServerActionClient()` korrekt.
4. Der bestehende `jetnity_gast`-Vertrag bleibt unverändert:
   - 32 Hexzeichen aus UUID,
   - `httpOnly: true`,
   - `sameSite: 'lax'`,
   - `secure` in Production,
   - `path: '/'`,
   - 30 Tage,
   - ungültige vorhandene Kennungen werden ersetzt.
5. Service-Role-Client bleibt cookie-los, nicht exportiert und nur für die bestehenden Kontingent-RPCs.
6. Fail-closed bleibt erhalten: Wenn Kontingent/Identity nicht sicher bestimmt werden kann, darf kein bezahlter Modellaufruf still freigegeben werden.

### AC-4 – `params` / `searchParams` werden auf Next-16-kompatible async-Semantik vorbereitet

Die im Gate 0 identifizierten Server-Component-/Metadata-Flächen müssen auf Next 14 bereits Promise-/Await-kompatibel werden.

Mindestens:

- `app/(public)/reisen/[tripId]/page.tsx` – `params.tripId`;
- `app/(public)/planen/page.tsx` – Page `searchParams` **und** `generateMetadata`;
- `app/(public)/login/page.tsx` – `searchParams.next`;
- `app/(public)/register/page.tsx` – `searchParams.next`;
- `app/(public)/admin/mfa/page.tsx` – `searchParams.next`;
- `app/(admin)/admin/users/page.tsx` – `q` / `page`;
- `app/unauthorized/page.tsx` – `grund`.

Repository-Suche gewinnt über diese Mindestliste. Dynamische Request-URL-Nutzung wie `new URL(req.url).searchParams` ist **nicht** Next Request API `searchParams` und darf nicht blind umgebaut werden.

### AC-5 – Produkt-Truth darf sich nicht verändern

Folgende Semantik ist ausdrücklich zu konservieren und mit Tests zu schützen:

1. Login/Register/Admin-MFA: `next` darf weder verloren gehen noch unsicher neu interpretiert werden; bestehende Redirect-Sanitization/Allowlist-Truth bleibt unverändert.
2. `/planen` Metadata/Robots: die bestehende D0-Indexierungsgrenze bleibt exakt erhalten. Insbesondere Key-Präsenz-Semantik (`Object.hasOwn` bzw. äquivalenter heutiger Vertrag) darf nicht in eine bloße Truthy-/Nonempty-Prüfung verwässert werden.
3. `/reisen/[tripId]`: Trip-ID-/Guest-vs-Account-/Workspace-Truth bleibt unverändert.
4. `/unauthorized`: `grund=lookup-failed` vs. forbidden Copy-/Status-Pfad bleibt unverändert.
5. Admin Users: Query/Pagination-Semantik bleibt unverändert.
6. Keine neue Auth-/Session-/AAL-/MFA-Produktlogik.

### AC-6 – Gezielt adversariale Regressionstests

Mindestens Tests/Evidence für:

- async Server-Factory-Nutzung und keine synchrone Factory-Verwendung mehr in den betroffenen Serverpfaden;
- Login `next`;
- Register `next`;
- Admin-MFA `next`;
- `/planen` Robots/Metadata für Basisroute und relevante Query-Key-Präsenzfälle;
- `[tripId]`-Parameterübergabe;
- `unauthorized`-Grund;
- Guest-Cookie-Vertrag / ungültige Kennung / Neuanlage soweit ohne echte externe Network-Abhängigkeit sinnvoll testbar;
- bestehende relevante Auth-/Trip-/Account-Tests weiterhin grün.

Tests dürfen keine externe Production-Mutation, keinen realen paid call und keine Fake-Hard-Truth benötigen.

### AC-7 – Dependency-/Framework-Freeze für S1

Nach dem Slice müssen die folgenden Runtime-/Tooling-Verträge gegenüber Baseline **unverändert** bleiben:

- `next = 14.2.32`;
- `react = 18.2.0`;
- `react-dom = 18.2.0`;
- `eslint = 8.57.1`;
- `eslint-config-next = 14.2.12`;
- `typescript`-Dependency-Range unverändert;
- `package-lock.json` darf keine unbeabsichtigte Dependency-Auflösung ändern.

Wenn eine notwendige S1-Korrektur wider Erwarten einen Dependency-Bump erzwingen würde: **STOPP und Technical Lead informieren; nicht eigenmächtig erweitern.**

### AC-8 – Vollständige Qualitätsgates

Vor Handoff mindestens ausführen und Ergebnisse exakt dokumentieren:

- `npm ci`
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run check:dead`
- `npm run check:exports`
- `npm run check:deps`
- `npm run check:api-schutz`
- `npm run check:schema-bezug`
- `npm run build`

Zusätzlich alle neuen/gezielten Tests separat benennen.

Vor Handoff `origin/main` neu fetchen und dokumentieren:

- Exact Head;
- Merge-Base;
- Ahead / Behind;
- vollständige geänderte Dateiliste;
- ob Baseline-Drift vorliegt.

GitHub Actions und Vercel Preview des finalen Exact Heads sind Platform-Evidence. Der Technical Lead verifiziert sie unabhängig vor PASS.

### AC-9 – Continuity ist Deliverable

Der Agent aktualisiert bzw. erstellt scope-treue Current-State-Evidence, mindestens:

- `docs/NEXT16_S1_REQUEST_API_COMPATIBILITY_PREP_STATUS_2026-08-28.md`;
- `docs/NEXT16_S1_REQUEST_API_COMPATIBILITY_PREP_HANDOFF_2026-08-28.md`;
- `docs/NEXT16_S1_REQUEST_API_COMPATIBILITY_PREP_SELF_REVIEW_2026-08-28.md`;
- kanonische `docs/ACTIVE_WORK_STATUS.md`, `JETNITY_START_HERE.md` und `JETNITY_HANDOFF.md` nur so weit nötig, um den aktuellen Slice self-expiring korrekt auffindbar zu machen.

Historische Evidence wird nicht umgeschrieben, um so zu tun, als sei sie damals anders gewesen.

Current-State muss am Handoff enthalten:

- live `main`/Baseline;
- Branch/PR/Exact Head;
- exakter logischer Agentenname + vorhandene Cursor-Session-Evidence;
- Scope / Non-Scope;
- fertige vs. unfertige Arbeit;
- Tests/Gates;
- P0/P1/P2/P3-Risiken;
- besondere Product-Owner-Gates;
- **exakt erster noch nicht abgeschlossener nächster Schritt = unabhängiger Technical-Lead Exact-Head-Review dieses PRs**.

## 4. Hard Non-Scope

In diesem S1 **verboten**:

- Next-/React-/React-DOM-/ESLint-/TypeScript-Dependency-Bump;
- `package.json`-/Lockfile-Modernisierung außerhalb unvermeidlicher null-diff Validation;
- `middleware.ts` → `proxy.ts`;
- `next lint` → ESLint CLI / Flat Config;
- mutierende Next-Codemods;
- Turbopack-/Webpack-/Cache-Architecture-Änderungen;
- AVIF-/Image-Config-Änderungen;
- `next.config.js`-Cleanup;
- Vercel-Projekt-/Environment-/Domain-Settings;
- Supabase-Migration, Schema, Daten, Auth-Config, RLS, GRANT/REVOKE, Function/Trigger/SECURITY DEFINER oder Production-Write;
- Service-Role-Ausweitung;
- neue globale Auth-/Session-/MFA-/AAL-Entscheidung;
- AP-7-S2 / Traveller Registry Persistenz / Identity-RLS;
- Provider-live, Provider-Secrets, paid provider calls;
- Payments/Geldbewegung;
- Public Launch, Indexing-Cutover, Domain-Cutover, App Store;
- Branch Protection;
- Issue #109 Country-Alias-Fix;
- Issue #110 Homepage Hero Natural Route Intent;
- UI-/Produkt-Redesign;
- historisches Draft-/Branch-Cleanup;
- irgendein S2-/Folgeslice.

## 5. Security / Privacy / Truth Boundaries

- Server-Identity-Entscheidungen bleiben auf verifizierter User-Truth (`auth.getUser()`), nicht ungeprüfter Cookie-/Metadata-Truth.
- Kein `user_metadata` für Autorisierung.
- Keine neue sensitive Traveller-/Passport-/MRZ-/Biometrie-Payload.
- `unknown` bleibt `unknown`; Persistenz oder Promise-Konversion erzeugt keine neue Hard Truth.
- Guest-Cookie ist Quota-Identifier, kein Konto und keine Auth-Identity.
- RSC-Schreibversuche bleiben no-op wie heute; mutierbare Cookie-Pfade bleiben nur dort mutierbar, wo sie es heute sind.
- Keine stillen Claims über Production-Evidence, die der Agent nicht selbst live geprüft hat; TL-verifizierte Evidence klar als solche kennzeichnen.

## 6. Risikoklassifikation vor Implementierung

### P0

- derzeit kein bekannter P0 aus diesem Slice.

### P1

- Auth-/Session-Regression durch Promise-/Cookie-Factory-Signaturänderung;
- Verlust oder falsches Schreiben von Supabase Session-Cookies in mutierbaren Serverpfaden;
- Guest-Quota-/`jetnity_gast`-Regression, die paid calls fail-open machen könnte;
- `/planen` Robots-/Metadata-Regression mit falscher Indexierung;
- Login/Register/Admin-MFA `next`-Regression bzw. Redirect-Sicherheitsregression;
- Trip-ID-/Guest-vs-Account-Regression im Workspace.

### P2

- unvollständig nachgezogene Factory-Caller / Promise-Ripple;
- bestehendes Governance-Risiko `main protected=false` (nicht Teil dieses Slices);
- Build-/SSR-Unterschiede trotz grüner Unit-Tests.

### P3

- Continuity-/Dokumentationsdrift;
- kosmetische Cursor-UI-Namensabweichung bei korrekt persistiertem logischem Namen.

Jeder neu entdeckte P0/P1 wird explizit dokumentiert und bei ungeklärter Gefahr zum STOPP.

## 7. Product-Owner-Gates

Für den **hier exakt definierten S1-Scope** ist keine neue Product-Owner-Freigabe erforderlich: PR #149 autorisiert die Compatibility-Prep ausdrücklich.

Die bestehenden Sondergates bleiben geschlossen, insbesondere Production-Migration/RLS/Identity, fundamentale Auth-/MFA-/AAL-Entscheidungen, sensible Dokumentdaten, AP-7-S2, Provider-live/Secrets/paid calls, Payments, >USD 100/Monat neue laufende Infrastruktur, Public Launch/Indexing/Domain/App Store und Branch Protection.

Wenn der notwendige Fix eines dieser Gates berührt: **nicht implementieren; STOPP für Technical Lead / Product Owner.**

## 8. Agenten- und Session-Regel

Exakter logischer Name:

`Cursor-Agent: Jetnity framework compatibility 1`

Das ist eine **frische Generation 1 für den neuen Compatibility-Implementierungsslice**, nicht Generation 2 des abgeschlossenen Gate-0-Audit-Agenten.

Wenn Cursor eine Rename-/Title-Fähigkeit anbietet, Preferred visible title: `Jetnity framework compatibility 1`. Wenn nicht, normal weiterarbeiten und den beobachteten Run-Titel/Link ehrlich dokumentieren. Keine erfundene UI-Umbenennung.

Unmittelbare Technical-Lead-Review-Fixes desselben PRs werden mit **derselben Session / demselben logischen Agenten** bearbeitet.

## 9. STOPP / Handoff

Der Agent darf:

- diesen S1 implementieren;
- scope-treue Tests ergänzen;
- Status/Handoff/Self-Review/Continuity aktualisieren;
- auf demselben Draft-PR pushen.

Der Agent darf **nicht**:

- den PR Ready setzen;
- mergen;
- S2 starten;
- Scope erweitern;
- einen Product-Owner-Sondergate umgehen.

Nach finalem Push:

1. `origin/main` neu verifizieren;
2. Exact Head + Merge-Base + Ahead/Behind dokumentieren;
3. vollständigen Diff adversarial self-reviewen;
4. alle Gates dokumentieren;
5. PR **Draft lassen**;
6. **STOPP für unabhängigen ChatGPT / Technical-Lead Exact-Head-Review**.

Self-review ist Evidence, niemals Integrationsfreigabe.
