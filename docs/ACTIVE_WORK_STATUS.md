# Jetnity – Active Work Status

Stand: 25. August 2026  
Status: **aktueller operativer Stand. TW-1 ist auf `main` gemergt (`02b166e6`). TW-2 Runtime liegt in Draft-PR #58 und wartet auf unabhängigen Technical-Lead-Re-Review. Kein TW-3, kein TW-4.**

## 0. Git-Wahrheit

Verifiziert durch den Merge von PR #55 und anschließenden docs-only Kontinuitätsnachzug:

- letzter fachlicher/docs-only PR-Merge auf `main`: `08fd7748ace072544e189c94880562e050971811` – PR #55
- PR #55: **merged / closed**
- darunter auf `main`: Provider S3 `b7f027ec` (#54, ADR-0161), Account AP-3 `8326e72f` (#53, ADR-0160), Admin Slice C `78192ab7` (#49, ADR-0162), Admin Slice B `e3bad749` (#46, ADR-0159), Admin Slice A `1ec93cc9` (#44, ADR-0158)
- PR #55 war docs-only; keine Runtime-, DB-, RLS-, Auth-, Secret- oder Provideraktivierung durch den Merge

Historische Statusabschnitte oder Slice-Handoffs, die #55/#54/#53 noch als Draft oder ältere `main`-SHAs als aktuell beschreiben, sind **pre-merge Evidence**. Sie dürfen diesen zentralen Status nicht überschreiben.

Nicht gemergte Governance-Evidence: Draft-PR #52. Nicht als `main` ausgeben; PR #52 muss den aktuellen Stand spiegeln, bleibt aber separat Draft.

## 1. Zuletzt vollständig abgeschlossener Block

**Trip Workspace TW-1 – Shell & Geräteparität**

- PR #56: **gemergt und geschlossen**
- Merge auf `main`: `02b166e652f046d41f6e5b8d292e980369ca255e`
- Agent: `Trip workspace audit architecture`
- Branch: `feat/trip-workspace-tw1-shell-device-parity`
- Device-Parity-Shell, Übersicht auf allen Viewports, ein aktiver Bereich
- keine DB/RLS/Auth/Traveller/Provider/Secret-Änderung

Davor vollständig abgeschlossen:

**Trip Workspace Audit & Zielarchitektur – docs-only Vorbereitung**

- PR #55: **gemergt und geschlossen**
- Merge auf `main`: `08fd7748ace072544e189c94880562e050971811`
- Agent: `Trip workspace audit architecture`
- Branch: `audit/trip-workspace`
- Audit/Zielarchitektur technisch vorbereitet; IA-Annahme steht in ADR-0163
- **keine Runtime-Implementierung** durch #55

Davor vollständig abgeschlossen:

**Provider Readiness S3 – Mobility/Rental Nachweis**

- PR #54: **gemergt und geschlossen**
- Merge auf `main`: `b7f027ec448639fe3399512d401a7789b24e52a6`
- ADR-0161 bleibt verbindlich
- Historischer Current-Main Exact Head `2cb9a830` bleibt Evidence vor dem Merge
- Umgebung bleibt `null` → Übernahme fail-closed. Kein echter Provider. Keine Production-Migration.

Davor vollständig abgeschlossen:

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

Vercel Production und Supabase Production `qscbgcdmivbbnzrcyegn` bleiben unverändert durch PR #55.

- `20260824120000_flug_route_itinerary_surface_evidence`: angewendet
- `20260824140000_flug_route_itinerary_untrusted_surface`: angewendet
- S2 Development-Migrationen `20260824160000` und `20260824180000` **fehlen auf Production** und dürfen nicht eigenmächtig dorthin.

Keine neuen Secrets und keine neuen laufenden Providerkosten.

## 3. Workstreams

### Trip Workspace – TW-2 Runtime in Draft-PR #58

Verantwortlicher Cursor-Anzeigename: `Trip workspace audit architecture`  
PR #55: **merged / closed**, docs-only Audit  
PR #56: **merged / closed**, TW-1 Shell & Geräteparität  
PR #58: **Draft**, TW-2 Reiseübersicht  
Dokumente:

- `docs/ADR_0164_TRIP_WORKSPACE_TW2_OVERVIEW.md`
- `docs/TRIP_WORKSPACE_TW2_TASK.md`
- `docs/TRIP_WORKSPACE_TW2_STATUS.md`

- `docs/ADR_0163_TRIP_WORKSPACE_TARGET_IA.md`
- `docs/TRIP_WORKSPACE_TW1_TASK.md`
- `docs/TRIP_WORKSPACE_TW1_STATUS.md`
- `docs/TRIP_WORKSPACE_AUDIT.md`
- `docs/TRIP_WORKSPACE_TARGET_ARCHITECTURE.md`
- `docs/TRIP_WORKSPACE_DEPENDENCY_MATRIX.md`
- `docs/TRIP_WORKSPACE_IMPLEMENTATION_PLAN.md`
- `docs/TRIP_WORKSPACE_HANDOFF.md`

Die Ziel-IA ist als ADR-0163 angenommen. TW-1 ist auf `main`. TW-2 Runtime liegt in Draft-PR #58. Safety-/Seasonal-Stille und `Jetzt wichtig` bleiben TW-4. Kein TW-3 in diesen Slice.

### Admin Platform – abgeschlossene Slices auf `main`

- Slice A: gemergt, PR #44, ADR-0158
- Slice B: gemergt, PR #46, ADR-0159
- Slice C: gemergt, PR #49, ADR-0162
- Agent `Admin platform audit` **wartet**. Kein Slice D ohne neuen kontrollierten Auftrag.
- Billing-/Refund-P1 bleibt separater Pflichtblock vor Finance-/Payment-Live.

### Account Platform – abgeschlossene Slices auf `main`

- AP-1 / AP-2: gemergt
- AP-3: gemergt, PR #53, ADR-0160
- Agent `Account plattform audit vorbereitung` **wartet**. Kein AP-4 ohne neuen kontrollierten Auftrag / Shared-Gate.

### Provider Readiness – abgeschlossene Slices auf `main`

- S1 Shared Ops Contract: gemergt, PR #47
- S2 FlugNachweis: gemergt, PR #51; Development-Guards nicht Production-approved
- S3 Mobility/Rental Nachweis: gemergt, PR #54, ADR-0161
- Agent `Jetnity provider readiness audit` **wartet**. Kein S4 ohne neuen kontrollierten Auftrag.

## 4. Parallelitätsregel

Aktuell aktiv ist nur TW-2 durch `Trip workspace audit architecture`. Die übrigen Agenten warten:

- `Trip workspace audit architecture` – STOPP für Technical-Lead-Re-Review von #58
- `Admin platform audit`
- `Account plattform audit vorbereitung`
- `Jetnity provider readiness audit`

Kein Agent startet eigenmächtig TW-3, TW-4, Slice D, AP-4 oder S4.

Kontrollierte nächste Reihenfolge:

1. Unabhängiger Technical-Lead-Re-Review von TW-2 / Draft-PR #58.
2. Kein TW-3 und kein TW-4 in diesen Slice.
3. Besondere Product-Owner-Gates bleiben geschlossen.
4. Slice D, AP-4 und S4 nur nach eigenen Aufträgen.

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

- PR #43, #44, #45, #46, #47, #48, #49, #51, #53, #54, #55, #56 und #57 sind gemergt.
- PR #52 bleibt Draft und ungemergt.
- PR #58 bleibt Draft bis zum unabhängigen Technical-Lead-Re-Review.
- ADR-Allokation: Admin A = ADR-0158, Admin B = ADR-0159, Account AP-3 = ADR-0160, Provider S3 = ADR-0161, Admin C = ADR-0162.
- Trip-Workspace-Ziel-IA ist ADR-0163; TW-2-Overview-Vertrag ist ADR-0164. TW-1 ist auf `main`. TW-2 liegt in Draft-PR #58.
- Normale Slices folgen der Technical-Lead-Autonomie. Besondere Gates bleiben Product-Owner-pflichtig.
- Production-Migrationen bleiben separate Gates.
- Provider-/Secret-/Kosten-Aktivierungen bleiben separate Gates.
- S2 Development-Migrationen dürfen nicht eigenmächtig auf Production.
- Historische Handoffs/Checkpoints bleiben Evidence, müssen aber bei widersprüchlichen alten PR-/SHA-/Next-Step-Aussagen ausdrücklich als historisch behandelt werden.

## 7. Exakter nächster Schritt

1. PR #55 und PR #56 sind erledigt. TW-1 liegt auf `main`.
2. ADR-0164 steuert TW-2 als Presentation-Derivation ohne neuen `trips.status`.
3. **Nächster Technical-Lead-Schritt:** unabhängiger Re-Review von Draft-PR #58. Kein TW-3, kein TW-4, keine besonderen Product-Owner-Gates eigenmächtig öffnen.
4. `Admin platform audit`, `Account plattform audit vorbereitung` und `Jetnity provider readiness audit` warten bis zu eigenen neuen Aufträgen.

Der lokale Refund-Integritätsblocker bleibt ein späterer Billing-Auftrag.