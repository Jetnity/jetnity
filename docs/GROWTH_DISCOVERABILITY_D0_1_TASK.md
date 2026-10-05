# Jetnity – D0-1 Index Boundary Contract – Task

Stand: 25. August 2026  
Status: **VERBINDLICHER IMPLEMENTIERUNGSAUFTRAG / NOCH NICHT AUSGEFÜHRT**  
Agent: `Jetnity growth discoverability`  
Branch: `fix/d0-1-index-boundary-contract`

## 1. Baseline

Start ausschließlich von:

`main @ 2bb6b8072fa04e8f6db2d989b84ada7b64745fd9`

Dieser Main enthält den gemergten D0/G0 Foundation Audit aus PR #69. Dessen Findings sind Evidence, nicht automatisch behoben.

Pflichtlektüre vor Änderungen:

1. `JETNITY_START_HERE.md`
2. `JETNITY_HANDOFF.md`
3. `docs/ACTIVE_WORK_STATUS.md`
4. `docs/JETNITY_BINDING_BUILD_ORDER.md`
5. `docs/JETNITY_TECHNICAL_LEAD_AUTONOMY_POLICY.md`
6. `docs/JETNITY_AI_SEARCH_DISCOVERABILITY_STANDARD.md`
7. `docs/JETNITY_MARKETING_GROWTH_STANDARD.md`
8. `docs/GROWTH_DISCOVERABILITY_D0_G0_AUDIT.md`
9. `docs/GROWTH_DISCOVERABILITY_D0_G0_STATUS.md`
10. diesen Task und `docs/GROWTH_DISCOVERABILITY_D0_1_STATUS.md`
11. relevante Metadata-/Routing-/Privacy-/Auth-/Admin-ADRs und Tests.

Danach live verifizieren: aktueller Main, Branch, Draft-PR, Ahead/Behind/Merge-Base, offene parallele PRs, Actions, Vercel, Review-Threads und die tatsächlich betroffenen Dateien/Routes.

## 2. Ziel

Schließe den **Index-Boundary-Teil** der bestätigten Findings D0-P1-01, D0-P1-02 und D0-P2-03 mit einem kleinen, testbaren Runtime-Slice.

Jetnity muss private/persönliche bzw. sensitive Produktflächen unabhängig von `robots.txt` mit expliziten HTML-Metadata-Signalen gegen Indexierung schützen. `robots.txt`, Sitemap und HTML-Metadata dürfen nicht still widersprüchliche öffentliche Freigaben für diese Flächen erzeugen.

Dieser Slice ist **Security-/Privacy-Härtung innerhalb bereits angenommener Standards**, keine neue Produkt- oder Privacy-Policy.

## 3. Verbindlicher Scope

### A. Reise-Surfaces

- `/reisen` → explizit `noindex, nofollow`.
- `/reisen/[tripId]` → explizit `noindex, nofollow`.
- `/reisen` aus der öffentlichen Sitemap entfernen.
- Im Allow-Index-Modus von `robots.ts` müssen `/reisen` und Unterpfade ausdrücklich ausgeschlossen sein.
- Gast- und Account-Produktlogik darf sich nicht ändern.
- Keine private Reise darf durch diesen Slice öffentlich gemacht werden.

### B. `/planen` mit Search Params

- Die bewusst öffentliche Basisseite `/planen` darf **nicht still in D1 umgebaut** werden.
- Sobald nutzer-/intentbezogene Search Params vorhanden sind (`idee`, `ziel`, `zielId` oder andere von der Route akzeptierte Parameter), muss die konkrete Response `noindex` sein.
- Der sichtbare Planungsflow und die Übernahme der Werte in die UI dürfen erhalten bleiben; nur die Indexierbarkeit der parametrisierten Variante wird geschlossen.
- Keine Query-Inhalte in Canonicals, Sitemap, JSON-LD oder neue öffentliche Produktseiten aufnehmen.

### C. Sensitive Hilfs-/Admin-Surfaces

- `/admin/login` → explizit `noindex, nofollow`.
- `/unauthorized` → explizit `noindex, nofollow`.
- Das `(admin)`-Layout muss eine App-Router-kompatible `noindex`-Metadata-Grenze besitzen.
- Falls `app/(admin)/admin/head.tsx` tatsächlich tot/irreführend ist, darf er scope-sicher entfernt oder eindeutig superseded werden, aber ohne Admin-IA/Auth-Logik zu ändern.

### D. robots / sitemap Konsistenz für diesen Boundary-Scope

- Im Allow-Index-Modus mindestens private/sensitive D0-1-Pfade passend disallowen: `/reisen`, `/reisen/`, `/auth/`, `/unauthorized`; bestehende `/admin/`, `/account/`, `/login`, `/register`, `/api/` Regeln erhalten bzw. nicht schwächen.
- Den globalen `*.vercel.app`/localhost Kill-Switch nicht entfernen.
- `NEXT_PUBLIC_ALLOW_INDEXING`-Kill-Switch nicht lockern.
- Kein Custom-Domain-Indexing aktivieren.
- Sitemap enthält nach D0-1 keine private Reiseübersicht.

### E. Tests / Regression

Mindestens automatisiert beweisen:

1. `/reisen` und `/reisen/[tripId]` sind `noindex`.
2. `/reisen` fehlt in der Sitemap.
3. Allow-Index-robots schließt `/reisen`/Unterpfade und die festgelegten sensitive D0-1-Pfade aus.
4. `/planen` ohne relevante Search Params behält den bisherigen D0-1-Entscheidungsstand; `/planen` mit mindestens `idee` wird `noindex`.
5. `/admin/login`, `/unauthorized` und Admin-Layout sind `noindex`.
6. localhost/`*.vercel.app` bleibt deny-all.
7. keine bestehende Auth-/Guest→Account-/Trip-Logik regressiert.

Bevorzugt testbare pure Helper/Contracts statt fragile String-Snapshots, sofern dies ohne Scope-Aufblähung möglich ist.

## 4. Expliziter Nicht-Scope

Nicht in D0-1:

- **D0-P1-03 Legal-Seiten** `/privacy` und `/terms`; dafür dürfen keine rechtlichen Texte erfunden werden. Das bleibt separater Product-Owner/Legal-Slice.
- Canonical-/Origin-Contract (`APP_URL` vs `SITE_URL`) – D0-2.
- hreflang / Locale-Routing – D1 bzw. vorbereitender D0-2-Contract.
- JSON-LD Foundation – D0-4.
- Event-/Attribution-/UTM-Contract – G0-1.
- Consent Purpose Contract – G0-2.
- Homepage-Copy oder öffentliche Produktclaims.
- Tracking, Analytics, Ads, CRM, Pixels, Fingerprinting.
- Custom Domains oder Public Launch.
- DB/Migration/RLS/Auth/MFA/Session/Guest→Account/Traveller/Route/Provider/Payments.
- neue Secrets, paid calls oder laufende Kosten.
- TW-6 oder andere Trip-Workspace-Featurearbeit.

## 5. Shared-Contract-Grenzen

D0-1 darf bestehende Privacy-/Auth-/Guest→Account-/Trip-/Admin-Verträge **nur härten**, nicht neu definieren.

Wenn für die Umsetzung ein neuer oder wesentlich geänderter Shared Contract nötig erscheint: dokumentieren und STOPP; nicht still erweitern.

## 6. Definition of Done

D0-1 ist erst reviewbereit, wenn:

- alle Scope-ACs implementiert sind;
- gezielte D0-1-Tests grün sind;
- `npm test` vollständig grün ist;
- `npm run typecheck` grün ist;
- `npm run lint` grün ist;
- `npm run check:setup:ci` grün/erklärte bekannte Warnung ist;
- relevante Hygiene-/Security-Gates grün sind;
- `npm run build` grün ist;
- Exact-Head GitHub Actions SUCCESS;
- Exact-Head Vercel Preview READY;
- Ahead/Behind/Merge-Base gegen dann aktuellen Main dokumentiert ist;
- offene Review-Threads 0 bzw. sauber dokumentiert sind;
- keine unerlaubte Runtime-/DB-/Auth-/Provider-/Legal-/Growth-Erweiterung erfolgt ist;
- `docs/GROWTH_DISCOVERABILITY_D0_1_STATUS.md` mit Root Cause, Änderungen, Tests, Evidence und verbleibenden Findings aktualisiert ist;
- `docs/ACTIVE_WORK_STATUS.md` auf diesem Branch den realen Workstream-Stand widerspiegelt.

Danach **STOPP für unabhängigen ChatGPT-/Technical-Lead-Review**.

Kein Ready. Kein Merge. Kein D0-2/G0-1/D1/G1+ aus diesem Auftrag.