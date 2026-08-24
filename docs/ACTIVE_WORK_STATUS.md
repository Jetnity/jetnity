# Jetnity – Active Work Status

Stand: 24. August 2026  
Status: **PR #38 und Account AP-1 auf `main`; Admin Slice A Main-Sync auf Draft PR #44; Provider Ops S1 Draft PR #47**

## 1. Zuletzt vollständig abgeschlossener Block

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

## 3. Aktive Workstreams

### Account Platform – AP-1

Verantwortlicher Cursor-Anzeigename: `Account plattform audit vorbereitung`  
Audit-Referenz: Draft-PR #39 / `audit/account-platform` – **AUDIT-PASS**  
Implementierungsbranch: `feat/account-ap1`  
Implementierungs-PR: **#43 – gemergt nach `main` `084f7c87`**  
Auftrag: `docs/ACCOUNT_AP1_MAIN_SYNC_TASK.md`  
Handoff: `docs/ACCOUNT_AP1_HANDOFF.md`  
Status: `docs/ACCOUNT_AP1_STATUS.md`  
Review: `docs/ACCOUNT_AP1_CHATGPT_REVIEW.md`

**AP-1 ist auf `main`.** Account-Shell + persönliche Übersicht; ADR-0152, ADR-0153.

Grenze bleibt: UI/IA und bestehende `reisenLaden()`-Truth. AP-2 braucht eine neue ausdrückliche Freigabe.

### Admin Platform – Slice A

Verantwortlicher Cursor-Anzeigename: `Admin platform audit`  
Audit-Referenz: Draft-PR #40 / `audit/admin-platform` – **AUDIT-PASS**  
Implementierungsbranch: `feat/admin-control-center-ia`  
Implementierungs-Draft-PR: **#44**  
Auftrag: `docs/ADMIN_SLICE_A_MAIN_SYNC_TASK.md`

Aktiver Slice:

**Admin Slice A Main-Sync mit `main` `084f7c87`.** Bisheriger Technical Closure / PASS gilt nur für den alten Exact Head `5632a3cac1301d2d649fcb1d2b9552d3763c8b9f` (CI `32683942810`, Preview `dpl_czE3XJXw3qx3sXMrh7LTgMV94zBL`). Das ersetzt das neue Integrationsgate nicht.

Admin-ADR auf diesem Branch: **ADR-0155** (nicht mehr ADR-0152; `main` hat ADR-0152 an Account AP-1 vergeben).

Grenze: Admin-UI/IA, ehrliche Zustände und vorhandene Security-Gates. Keine neue DB/Migration, keine Capability-/RLS-Neudefinition, kein System Health in diesem Slice, keine Provider-/Secret-/Kosten-Aktivierung.

PR #44 bleibt Draft. Slice B / PR #46 bleibt Draft und unangetastet.

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

Account AP-1, Admin Slice A und Provider Ops S1 dürfen parallel arbeiten, dürfen ihre Dateien aber nicht mischen.

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

- PR #43 ist gemergt. PR #44, PR #45, PR #46 und PR #47 bleiben Draft.
- Kein künftiger PR wird Mark Ready oder gemergt ohne ausdrückliche aktuelle Product-Owner-Freigabe.
- Production-Migrationen bleiben separate Gates.
- Provider-/Secret-/Kosten-Aktivierungen bleiben separate Gates.
- Fortschritt und Entscheidungen müssen im Repository dokumentiert werden.

## 7. Exakter nächster Schritt

1. `Admin platform audit` synchronisiert Slice A / PR #44 mit `main` `084f7c87` und belegt Exact-Head-Gates.
2. S1 auf PR #47 hat Technical Closure / PASS auf `b74096a9` und wartet auf Product-Owner-Entscheidung; kein Mark Ready / kein Merge / kein S2.
3. PR #46 / Slice B bleibt Draft und unangetastet.
4. AP-2, Admin Slice B und Provider S2 brauchen jeweils eine neue ausdrückliche Freigabe.
5. PR #44, #45, #46 und #47 bleiben Draft. Kein Ready, kein Merge ohne Product-Owner-Freigabe.
