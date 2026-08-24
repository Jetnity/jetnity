# Jetnity – Active Work Status

Stand: 24. August 2026  
Status: **PR #38 und Account AP-1 auf `main`; aktive Draft-Workstreams: Account AP-2 (PR #48), Admin Slice A und Provider Ops S1**

## 1. Zuletzt vollständig abgeschlossener Block

**Account Platform AP-1 – Account-Shell + persönliche Übersicht**

- PR #43: **gemergt und geschlossen**
- Squash-Merge auf `main`: `084f7c87f36f9929f3e4a9deb9d3fedef6e96982`
- gemergt: 24. August 2026, 11:37 UTC
- ADR-0152, ADR-0153 bleiben verbindlich

Davor vollständig abgeschlossen:

**Travel Timing & Seasonal Intelligence – provider-neutrale Foundation**

- PR #38: **gemergt und geschlossen**
- unabhängiger ChatGPT-Review R17: **PASS / Technical Closure**
- final geprüfter Runtime-Head: `5782401943b41ddd1eea1337c93cb37163210362`
- finaler PR-Head vor Merge: `1a61d21fe853c77faa1109ae0828e39f3629098a`
- Squash-Merge auf `main`: `ee988bbe46a8dd63d4001c42825fc0159453f811`
- Production-Integration: `docs/PR38_PRODUCTION_INTEGRATION.md`
- R17-Review: `docs/PR38_CHATGPT_R17_REVIEW.md`

Der PR-#38-Review-Loop ist beendet. Kein neuer Review-Rundlauf ohne konkrete neue Runtime-Änderung oder neuen belegbaren Defekt.

## 2. Production-Status

Vercel:

- Production Deployment nach PR-#38-Integration: **READY**

Supabase Production `qscbgcdmivbbnzrcyegn`:

- Status: **ACTIVE_HEALTHY**
- `20260824120000_flug_route_itinerary_surface_evidence`: angewendet
- `20260824140000_flug_route_itinerary_untrusted_surface`: angewendet
- Migration-History ist auf die Repository-Versionen ausgerichtet.
- `public.flug_route_itinerary_metadata(text,jsonb)` ist SECURITY INVOKER.
- `anon`: kein EXECUTE.
- `authenticated`: EXECUTE.
- manipuliertes Client-`surfaceFromAirportCode` wird live auf Production verworfen.

Keine Seasonal-Tabelle, kein Live-Seasonal-Provider, keine neuen Secrets und keine neuen laufenden Providerkosten.

Account AP-1 liegt auf `main`. Eine separate Account-Production-Migration war nicht Teil von AP-1 und ist nicht behauptet.

## 3. Aktive Workstreams

### Account Platform – AP-2

Verantwortlicher Cursor-Anzeigename: `Account plattform audit vorbereitung`  
Audit-Referenz: Draft-PR #39 / `audit/account-platform` – **AUDIT-PASS**  
Implementierungsbranch: `feat/account-ap2`  
Implementierungs-Draft-PR: **#48** (Base: `main`)  
Auftrag: `docs/ACCOUNT_AP2_MAIN_SYNC_TASK.md`  
Handoff: `docs/ACCOUNT_AP2_HANDOFF.md`  
Status: `docs/ACCOUNT_AP2_STATUS.md`

Aktiver Slice:

**AP-2 – Auth-UX-Hygiene; auf aktuellen `main` `084f7c87` rebase und retargetet.**

Gegates Runtime-Head: `de5ffd8a91576a2281b6d5eda75338504a43b7a7`  
GitHub Actions CI **SUCCESS** (`32727253862`) und Vercel Preview **success** (`AAYbSDBt4p636mxY1aWuPgq9gUSS`) auf genau diesem Head.

AP2-B1 bleibt geschlossen. Keine Scope-Erweiterung in diesem Sync.

Grenze: bestehender AP-2-Auth-UX-Scope. Keine DB/Migration/RLS, keine Traveller-/Guest→Account-Vertragsänderung, keine Provider-Aktivierung, kein AP-3.

### Admin Platform – Slice A

Verantwortlicher Cursor-Anzeigename: `Admin platform audit`  
Audit-Referenz: Draft-PR #40 / `audit/admin-platform` – **AUDIT-PASS**  
Implementierungsbranch: `feat/admin-control-center-ia`  
Implementierungs-Draft-PR: **#44**  
Auftrag: `docs/ADMIN_SLICE_A_IMPLEMENTATION_TASK.md`

Aktiver Slice:

**Admin Slice A – ehrliche professionelle Control-Center-IA / bestehende Legacy-Scheinzustände entfernen.**

Grenze: Admin-UI/IA, ehrliche Zustände und vorhandene Security-Gates. Keine neue DB/Migration, keine Capability-/RLS-Neudefinition, kein System Health in diesem Slice, keine Provider-/Secret-/Kosten-Aktivierung.

Danach als eigener Slice: read-only System Health für Vercel, Supabase, GitHub, App und später Infomaniak.

### Provider Readiness – S1 Shared Operational Contract

Verantwortlicher Cursor-Anzeigename: `Jetnity provider readiness audit`  
Audit-Referenz: Draft-PR #45 / `audit/provider-readiness` – bleibt Audit-Draft  
Implementierungsbranch: `feat/provider-ops-s1`  
Implementierungs-Draft-PR: **#47**  
Auftrag: `docs/PROVIDER_OPS_S1_TASK.md`  
Status: `docs/PROVIDER_OPS_S1_STATUS.md`

Aktiver Slice:

**S1 – gemeinsamer technischer Operationsvertrag.** Technical Closure / PASS auf Exact Head `b74096a9`. Draft-PR #47 wartet auf Product-Owner-Entscheidung.

Grenze: keine Fachwahrheit, kein `UniversalProvider`, kein `FlugNachweis`, keine persistente Kostenschranke, keine Provideraktivierung, keine Secrets, keine DB-/Production-Migration. S2 nur mit neuem Auftrag.

## 4. Parallelitätsregel

Account AP-2, Admin Slice A und Provider Ops S1 dürfen parallel arbeiten, dürfen ihre Dateien aber nicht mischen.

Seriell/zentral bleiben insbesondere:

- Auth / Identity / Sessions / MFA / AAL
- `profiles`, Rollen, Capabilities
- RLS / Ownership / Service Role
- Guest→Account / Trip Graph
- Traveller / Credentials / Readiness
- Route / Safety / Seasonal Truth
- Privacy Export / Delete
- Billing / Payment / Refund / Bexio
- Admin Audit Trail
- Provider Activation / Secrets / Kosten

Nach jedem Implementierungsslice: Self-Review + technische Gates + unabhängiger ChatGPT/Technical-Lead-Review, bevor der jeweilige nächste Slice beginnt.

## 5. Homepage

Die neue Homepage-Produktseiten-Idee ist dauerhaft in `docs/HOMEPAGE_PRODUCT_PAGE_DIRECTION.md` gespeichert und bleibt derzeit **pausiert**.

Wenn sie gestartet wird:

- eigener konfliktarmer visueller Workstream;
- zuerst separate visuelle Preview;
- bestehende starke Texte selektiv behalten;
- moderne Tech-Produktseite mit großen Bildern, viel Weißraum, hochwertiger Typografie und Animationen;
- keine neue Funktionslogik;
- Header-/Footer-Funktionalität nicht verändern;
- bestehende Homepage erst nach ausdrücklicher Product-Owner-Freigabe ersetzen.

## 6. Governance

- PR #48, PR #44, PR #45 und PR #47 bleiben Draft.
- PR #43 ist gemergt; das ist keine Freigabe für AP-2-Ready oder AP-2-Merge.
- Kein künftiger PR wird Mark Ready oder gemergt ohne ausdrückliche aktuelle Product-Owner-Freigabe.
- Production-Migrationen bleiben separate Gates.
- Provider-/Secret-/Kosten-Aktivierungen bleiben separate Gates.
- Fortschritt und Entscheidungen müssen im Repository dokumentiert werden.

## 7. Exakter nächster Schritt

1. Unabhängiger Technical-Lead-Integrationsreview von Draft-PR #48 auf Runtime-Head `de5ffd8a91576a2281b6d5eda75338504a43b7a7`.
2. `Admin platform audit` arbeitet weiter ausschließlich Slice A auf PR #44.
3. S1 auf PR #47 hat Technical Closure / PASS auf `b74096a9` und wartet auf Product-Owner-Entscheidung; kein Mark Ready / kein Merge / kein S2.
4. ChatGPT/Technical Lead prüft jeden Slice unabhängig.
5. AP-3, Admin Slice B und Provider S2 brauchen jeweils eine neue ausdrückliche Freigabe.
6. PR #48, #44, #45 und #47 bleiben Draft. Kein Ready, kein Merge ohne Product-Owner-Freigabe.
