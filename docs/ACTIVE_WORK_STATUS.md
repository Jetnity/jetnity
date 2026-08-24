# Jetnity – Active Work Status

Stand: 24. August 2026  
Status: **PR #38 vollständig integriert; Admin Slice A implementiert auf Draft PR #44; Account AP-1 bleibt paralleler Workstream**

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

### Admin Platform – Slice A auf Draft PR #44

Cursor-Anzeigename: `Admin platform audit`  
Audit-Referenz: PR #40 / `audit/admin-platform` (**AUDIT-PASS**)  
Implementierungsbranch: `feat/admin-control-center-ia`  
Draft-PR: #44  
Auftrag: `docs/ADMIN_SLICE_A_IMPLEMENTATION_TASK.md`  
Status: **Slice A implementiert, Draft, wartet auf unabhängigen Review**

Lokal: 1715/1715 Tests, Typecheck, Lint, Hygiene, Production-Build grün.  
Vercel Preview: **READY** (`86c69a55` / `GjhxXGcJq67UCNy9rutpuRL9M8vQ`; Head `47753c48` Deployment completed `8jX9oDUT2zCNFXR1HvecwqS6FZxF`).  
GitHub Actions Workflow `CI` ist auf diesem Branch zuletzt für Task-Commit `9aed6a88` grün; ein neuer `CI`-Lauf auf dem Implementierungs-Head ist nicht belegt.

Slice A macht das vorhandene gehärtete Backoffice zur ehrlichen Steuerzentrale (IA/UI). Keine neue Datenwahrheit, keine neue Autorität.

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

Admin Slice A auf Draft PR #44 ist implementiert und wartet auf unabhängigen ChatGPT/Technical-Lead-Review. Account AP-1 darf parallel weiterlaufen, ohne Auth/RLS/Billing/Traveller anzufassen. Slice B (System Health) startet erst nach Review von Slice A. Kein Mark Ready und kein Merge ohne ausdrückliche Product-Owner-Freigabe.