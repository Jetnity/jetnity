# Jetnity – Active Work Status

Stand: 24. August 2026  
Status: **S1 und S2 liegen auf `main`; aktiver Provider-Slice ist S3 Mobility/Rental-Nachweis auf `feat/provider-mobility-rental-evidence-s3`**

## 1. Zuletzt vollständig abgeschlossener Block

**Admin Control Center Slice A**

- PR #44: **gemergt und geschlossen**
- Squash-Merge auf `main`: `1ec93cc9f6d70bd57ea054463e4ba8e3822a2267`
- ADR-0158 bleibt verbindlich

Davor vollständig abgeschlossen:

**Provider Readiness S2 – FlugNachweis**

- PR #51: **gemergt und geschlossen**
- Squash-Merge auf `main`: `52e665ac`
- ADR-0155, ADR-0156, ADR-0157 bleiben verbindlich
- Development-only Migrationen `20260824160000` und `20260824180000` sind **nicht** Production-approved
- Production endet weiterhin bei `20260824140000`

Davor vollständig abgeschlossen:

**Provider Readiness S1 – Shared Operational Contract**

- PR #47: **gemergt und geschlossen**
- Squash-Merge auf `main`: `01761eb9`
- ADR-0154 bleibt verbindlich

Davor vollständig abgeschlossen:

**Provider Readiness Audit**

- PR #45: **gemergt und geschlossen**
- Squash-Merge auf `main`: `f92e0c9e`

Davor vollständig abgeschlossen:

**Account Platform AP-2 – Auth-UX-Hygiene**

- PR #48: **gemergt und geschlossen**
- Squash-Merge auf `main`: `2827d1cbb674498f504ba1810c73c8dc5d43ca24`

**Account Platform AP-1 – Account-Shell + persönliche Übersicht**

- PR #43: **gemergt und geschlossen**
- Squash-Merge auf `main`: `084f7c87f36f9929f3e4a9deb9d3fedef6e96982`
- ADR-0152, ADR-0153 bleiben verbindlich

**Travel Timing & Seasonal Intelligence – provider-neutrale Foundation**

- PR #38: **gemergt und geschlossen**
- unabhängiger ChatGPT-Review R17: **PASS / Technical Closure**

## 2. Production-Status

Vercel Production und Supabase Production `qscbgcdmivbbnzrcyegn` bleiben unverändert durch S3.

- `20260824120000_flug_route_itinerary_surface_evidence`: angewendet
- `20260824140000_flug_route_itinerary_untrusted_surface`: angewendet
- S2 Development-Migrationen `20260824160000` und `20260824180000` **fehlen auf Production** und dürfen nicht eigenmächtig dorthin.

Keine neuen Secrets und keine neuen laufenden Providerkosten.

## 3. Aktive Workstreams

### Provider Readiness – S3 Mobility/Rental Nachweis

Verantwortlicher Cursor-Anzeigename: Provider-Readiness Senior Agent  
Implementierungsbranch: `feat/provider-mobility-rental-evidence-s3`  
Basis: `origin/main` @ `1ec93cc9`  
Auftrag: dieser Chat / `docs/PROVIDER_READINESS_IMPLEMENTATION_SLICES.md` PR-S3  
Status: `docs/PROVIDER_READINESS_S3_STATUS.md`  
Handoff: `docs/PROVIDER_READINESS_S3_HANDOFF.md`  
ADR: ADR-0161

Aktiver Slice:

**S3 – Mobility- und Rental-Nachweis auf Hotel-/S2-Trust-Grenze.** Async `nachweisen({ optionId, kontext })`. Testkatalog nur injiziert. Umgebung `null` → fail-closed. Mobility Auto-Search nur nach «Verbindungen prüfen». Keine Migration. Kein echter Provider.

Grenze: kein Mark Ready, kein Merge, keine Production-Migration, keine Provideraktivierung, kein S4–S8.

### Provider Readiness – abgeschlossene Slices auf `main`

- S1 Shared Ops Contract: gemergt, PR #47
- S2 FlugNachweis: gemergt, PR #51; Development-Guards nicht Production-approved

Danach folgen erst S4–S8, jeweils mit eigenem Auftrag.

## 4. Parallelitätsregel

S3 darf Account-/Admin-Dateien nicht mischen. Seriell/zentral bleiben insbesondere Auth, RLS, Guest→Account, Traveller, Route/Safety/Seasonal Truth, Billing und Provideraktivierung.

## 5. Homepage

Die neue Homepage-Produktseiten-Idee bleibt **pausiert**. Siehe `docs/HOMEPAGE_PRODUCT_PAGE_DIRECTION.md`.

## 6. Governance

- Kein künftiger PR wird Mark Ready oder gemergt ohne ausdrückliche aktuelle Product-Owner-Freigabe.
- Production-Migrationen bleiben separate Gates.
- Provider-/Secret-/Kosten-Aktivierungen bleiben separate Gates.
- S2 Development-Migrationen dürfen nicht eigenmächtig auf Production.

## 7. Exakter nächster Schritt

1. S3 Draft-PR #54 auf ADR-0161 umnummeriert. ADR-0159 bleibt Admin Slice B / PR #46.
2. Exact-Head-Gates auf dem Tip nach der Umnummerierung neu beweisen (lokal + GitHub Actions SUCCESS + Vercel READY, dieselbe SHA).
3. STOPP für unabhängigen Technical-Lead-Review.
4. Nicht Mark Ready, nicht mergen, nicht S4, Production nicht migrieren.
