# Jetnity – Active Work Status

Stand: 24. August 2026  
Status: **PR #38 vollständig integriert; Account und Admin als nächste aktive Workstreams technisch freigegeben**

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

- Production Deployment `dpl_5wwLu6tbPLhPJgFMLC1PHx3wzcVS`
- Status: **READY**
- Git SHA: `ee988bbe46a8dd63d4001c42825fc0159453f811`

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

## 3. Aktive nächste Workstreams

### Account Platform – PR #39

Cursor-Anzeigename: `Account plattform audit vorbereitung`  
Branch: `audit/account-platform`  
Audit: **AUDIT-PASS**

Nächster konfliktarmer Implementierungsslice:

**AP-1 – Account-Shell + persönliche Übersicht / „Meine Reisen“ als Account-Hub.**

Der Agent darf keine zweite Auth-/Trip-/Traveller-/Billing-/Route-Truth bauen. Shared Contracts bleiben Technical-Lead-koordiniert.

### Admin Platform – PR #40

Cursor-Anzeigename: `Admin platform audit`  
Branch: `audit/admin-platform`  
Audit: **AUDIT-PASS**

Nächster konfliktarmer Implementierungsslice:

**Admin Slice A – ehrliche professionelle Control-Center-IA / bestehende Legacy-Scheinzustände entfernen.**

Danach als eigener Slice: read-only System Health für Vercel, Supabase, GitHub, App und später Infomaniak.

## 4. Parallelitätsregel

Account AP-1 und Admin Slice A dürfen jetzt parallel arbeiten.

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

- Kein künftiger PR wird Mark Ready oder gemergt ohne ausdrückliche aktuelle Product-Owner-Freigabe.
- Production-Migrationen bleiben separate Gates.
- Provider-/Secret-/Kosten-Aktivierungen bleiben separate Gates.
- Fortschritt und Entscheidungen müssen im Repository dokumentiert werden.

## 7. Exakter nächster Schritt

Die ersten konfliktarmen Implementierungsslices für **Account AP-1** und **Admin Slice A** können vorbereitet und gestartet werden. Nach jedem Slice folgt ein unabhängiger Review, bevor der jeweilige nächste Slice beginnt.