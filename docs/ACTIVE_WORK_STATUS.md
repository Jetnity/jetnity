# Jetnity – Active Work Status

Stand: 24. August 2026  
Status: **PR #38 vollständig integriert; Account AP-1 aktiv auf Draft PR #43; Admin Slice A Technical Closure / PASS auf Draft PR #44; Admin Slice B Implementierung auf Draft PR #46**

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
Implementierungs-Draft-PR: **#43**  
Auftrag: `docs/ACCOUNT_AP1_IMPLEMENTATION_TASK.md`

Aktiver Slice:

**AP-1 – Account-Shell + persönliche Übersicht / „Meine Reisen“ als Account-Hub.**

Grenze: UI/IA und bestehende `reisenLaden()`-Truth. Keine neue Auth-/Trip-/Traveller-/Billing-/Route-Truth, keine DB-Migration, keine Homepage-Änderung.

### Admin Platform – Slice A

Verantwortlicher Cursor-Anzeigename: `Admin platform audit`  
Audit-Referenz: Draft-PR #40 / `audit/admin-platform` – **AUDIT-PASS**  
Implementierungsbranch: `feat/admin-control-center-ia`  
Implementierungs-Draft-PR: **#44**  
Auftrag: `docs/ADMIN_SLICE_A_IMPLEMENTATION_TASK.md`

Aktiver Slice:

**Admin Slice A – ehrliche professionelle Control-Center-IA / bestehende Legacy-Scheinzustände entfernen.**

Unabhängiger Technical-Lead Final Recheck: **PASS / TECHNICAL CLOSURE** auf Exact Head `5632a3cac1301d2d649fcb1d2b9552d3763c8b9f`.  
CI `32683942810` SUCCESS. Vercel Preview READY `dpl_czE3XJXw3qx3sXMrh7LTgMV94zBL`. Nachweise: `docs/ADMIN_PLATFORM_SLICE_A_TECHNICAL_CLOSURE.md`.

Grenze: Admin-UI/IA, ehrliche Zustände und vorhandene Security-Gates. Keine neue DB/Migration, keine Capability-/RLS-Neudefinition, kein System Health in diesem Slice, keine Provider-/Secret-/Kosten-Aktivierung.

Technical Closure ist keine Mark-Ready-/Merge-Freigabe. Slice B läuft separat auf Draft PR #46.

### Admin Platform – Slice B

Verantwortlicher Cursor-Anzeigename: `Admin platform audit`  
Implementierungsbranch: `feat/admin-system-health`  
Implementierungs-Draft-PR: **#46** (gestapelt auf PR #44)  
Auftrag: `docs/ADMIN_SLICE_B_SYSTEM_HEALTH_TASK.md`

Aktiver Slice:

**Admin Slice B – read-only System Health ohne Fake-Green.**

Grenze: vorhandene read-only Evidence, ehrliche `unknown`/`not_configured`-Zustände, bestehende Admin-Gates. Keine neue DB/Migration, keine Capability-/RLS-Neudefinition, keine neuen Secrets/Tokens/Verträge/Kosten, keine Writes.

## 4. Parallelitätsregel

Account AP-1 und Admin Slice B dürfen parallel arbeiten. Slice A bleibt abgeschlossene Stack-Basis.

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

- PR #43, PR #44 und PR #46 bleiben Draft.
- Kein künftiger PR wird Mark Ready oder gemergt ohne ausdrückliche aktuelle Product-Owner-Freigabe.
- Production-Migrationen bleiben separate Gates.
- Provider-/Secret-/Kosten-Aktivierungen bleiben separate Gates.
- Fortschritt und Entscheidungen müssen im Repository dokumentiert werden.

## 7. Exakter nächster Schritt

1. `Account plattform audit vorbereitung` implementiert ausschließlich AP-1 auf PR #43.
2. Admin Slice A bleibt Technical Closure / PASS auf Draft PR #44. Keine Slice-B-Mischung in #44.
3. Admin Slice B ist auf Draft PR #46 implementiert. Lokale Gates sind grün auf `285022e2`. Exact-Head CI/Preview und unabhängiger Technical-Lead-Review stehen aus.
4. PR #43, PR #44 und PR #46 bleiben Draft, bis der Product Owner jeweils ausdrücklich freigibt.
5. Kein Mark Ready, kein Merge, kein Admin Slice C ohne ausdrückliche aktuelle Freigabe.
