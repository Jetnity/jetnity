# Jetnity – Active Work Status

Stand: 24. August 2026  
Status: **Account AP-3 liegt auf `main` `8326e72f`; aktiver Provider-Slice ist S3 Mobility/Rental-Nachweis auf Current-Main Exact Head `2cb9a830`; Draft-PR #54; STOPP für Technical-Lead Docs-Re-Check**

## 1. Zuletzt vollständig abgeschlossener Block

**Account Platform AP-3 – Meine Reisen Lebenslage**

- PR #53: **gemergt und geschlossen**
- Merge auf `main`: `8326e72f9557a8b9b200e680b0be24aefa0bdfa8`
- ADR-0160 bleibt verbindlich
- Aktiv / Kommend / Vergangen / Ohne Datum nur abgeleitet. Kein Lifecycle-Write. 200er-Hinweis fail-closed.

Davor vollständig abgeschlossen:

**Admin Control Center Slice C – read-only Provider- und Kostenboard**

- PR #49: **gemergt und geschlossen**
- Merge auf `main`: `78192ab775165d08bb357140c2d04b865b8cc049`
- ADR-0162 bleibt verbindlich

Davor vollständig abgeschlossen:

**Admin Control Center Slice B**

- PR #46: **gemergt und geschlossen**
- Squash-Merge auf `main`: `e3bad749c8e03512001e7bccd5e08467f10a7134`
- ADR-0159 bleibt verbindlich
- Read-only System Health ohne Fake-Green. Parent `App / Deployment` bleibt `unknown`. Parent `Supabase` bleibt `not_configured`.

Davor vollständig abgeschlossen:

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

Verantwortlicher Cursor-Anzeigename: `Jetnity provider readiness audit`  
Implementierungsbranch: `feat/provider-mobility-rental-evidence-s3`  
Basis: `origin/main` @ `8326e72f`  
Auftrag: `docs/PROVIDER_READINESS_IMPLEMENTATION_SLICES.md` PR-S3  
Status: `docs/PROVIDER_READINESS_S3_STATUS.md`  
Handoff: `docs/PROVIDER_READINESS_S3_HANDOFF.md`  
ADR: ADR-0161

Aktiver Slice:

**S3 – Mobility- und Rental-Nachweis auf Hotel-/S2-Trust-Grenze.** Async `nachweisen({ optionId, kontext })`. Testkatalog nur injiziert. Umgebung `null` → fail-closed. Mobility Auto-Search nur nach «Verbindungen prüfen». Keine Migration. Kein echter Provider. Current-Main Exact Head `2cb9a830` ist lokal und remote gegatet. Runtime/Security/Truth PASS. Dieser Stand ist ein docs-only Follow-up.

Grenze: kein Mark Ready, kein Merge, keine Production-Migration, keine Provideraktivierung, kein S4–S8.

### Admin Platform – abgeschlossene Slices auf `main`

- Slice A: gemergt, PR #44, ADR-0158
- Slice B: gemergt, PR #46, ADR-0159. Status: `docs/ADMIN_PLATFORM_SLICE_B_STATUS.md`
- Slice C: gemergt, PR #49, ADR-0162. Status: `docs/ADMIN_PLATFORM_SLICE_C_STATUS.md`. Agent `Admin platform audit` wartet. Kein Slice D ohne neuen Auftrag.

### Account Platform – abgeschlossene Slices auf `main`

- AP-1 / AP-2: gemergt
- AP-3: gemergt, PR #53, ADR-0160. Status: `docs/ACCOUNT_AP3_STATUS.md`. Agent `Account plattform audit vorbereitung` wartet. Kein AP-4 ohne neuen Auftrag.

### Provider Readiness – abgeschlossene Slices auf `main`

- S1 Shared Ops Contract: gemergt, PR #47
- S2 FlugNachweis: gemergt, PR #51; Development-Guards nicht Production-approved

Danach folgen erst S4–S8, jeweils mit eigenem Auftrag.

### Trip Workspace Audit – PR #55

Verantwortlicher Cursor-Anzeigename: `Trip workspace audit architecture`  
Implementierungs-Draft-PR: **#55** (docs-only)

**PR #55 bleibt Draft / docs-only.** Folgt nach #54-Integration als finale docs-only Reconciliation. Startet keinen TW-1-Umbau und keine Runtime-Änderung. Agent `Trip workspace audit architecture` wartet bis dahin.

## 4. Parallelitätsregel

S3 darf Account-/Admin-Dateien nicht mischen. Admin A–C und Account AP-1–AP-3 auf `main` bleiben erhalten.

Kontrollierte Reihenfolge der offenen Drafts:

1. Provider #54 Docs-Re-Check / danach Product-Owner-Ready-Gate / Integration
2. Trip-Workspace-Audit #55 finale Docs-Reconciliation / Integration
3. danach neue kontrollierte Admin-/TW-Aufträge

`Admin platform audit` wartet. `Account plattform audit vorbereitung` wartet. Kein Slice D. Kein TW-1 ohne neuen Auftrag.

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

Die neue Homepage-Produktseiten-Idee bleibt **pausiert**. Siehe `docs/HOMEPAGE_PRODUCT_PAGE_DIRECTION.md`.

## 6. Governance

- PR #43, #44, #45, #46, #47, #48, #49, #51 und #53 sind gemergt. Draft-PR #54 und #55 bleiben Draft.
- ADR-Allokation: Admin A = ADR-0158, Admin B = ADR-0159, Account AP-3 = ADR-0160, Provider S3 = ADR-0161, Admin C = ADR-0162.
- Kein künftiger PR wird Mark Ready oder gemergt ohne ausdrückliche aktuelle Product-Owner-Freigabe.
- Production-Migrationen bleiben separate Gates.
- Provider-/Secret-/Kosten-Aktivierungen bleiben separate Gates.
- S2 Development-Migrationen dürfen nicht eigenmächtig auf Production.

## 7. Exakter nächster Schritt

1. STOPP für unabhängigen Technical-Lead Docs-Re-Check von Draft-PR #54. Current-Main Exact Head `2cb9a830` ist gegatet.
2. Nicht Mark Ready, nicht mergen, nicht S4, Production nicht migrieren.
3. Nach #54-Integration: Trip-Workspace-Audit #55 finale Docs-Reconciliation.
4. Danach erst neue kontrollierte Admin-/TW-Aufträge. `Admin platform audit` wartet. `Account plattform audit vorbereitung` wartet. Kein Slice D. Kein TW-1. Der lokale Refund-Integritätsblocker bleibt ein späterer Billing-Auftrag.
