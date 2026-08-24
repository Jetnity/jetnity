# Jetnity – Active Work Status

Stand: 24. August 2026  
Status: **PR #38, Account AP-1/AP-2, Provider S1/S2, Admin Slice A–C auf `main` `78192ab`; Account AP-3 Draft PR #53 Runtime PASS, docs-only Follow-up; PR #54 und PR #55 bleiben Draft; Admin wartet, kein Slice D**

## 1. Zuletzt vollständig abgeschlossener Block

**Admin Control Center Slice C – read-only Provider- und Kostenboard**

- PR #49: **gemergt und geschlossen**
- Merge auf `main`: `78192ab775165d08bb357140c2d04b865b8cc049`
- Entscheidung: ADR-0162

Davor vollständig abgeschlossen:

**Account Platform AP-2 – Auth-UX-Hygiene**

- PR #48: **gemergt und geschlossen**
- Squash-Merge auf `main`: `2827d1cbb674498f504ba1810c73c8dc5d43ca24`
- gemergt: 24. August 2026, 13:02 UTC

Davor vollständig abgeschlossen:

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

Account AP-1 und AP-2 liegen auf `main`. Eine separate Account-Production-Migration war nicht Teil dieser Slices und ist nicht behauptet.

S2-B1/B2-Migrationen `20260824160000` und `20260824180000` liegen nur auf Supabase Development. **Production unverändert.**

## 3. Aktive Workstreams

### Admin Platform – Slice A

Verantwortlicher Cursor-Anzeigename: `Admin platform audit`  
Implementierungs-PR: **#44 – gemergt nach `main` `1ec93cc9`**  
Entscheidung: ADR-0158

**Slice A ist auf `main`.** Ehrliche Steuerzentralen-IA. System Health war bewusst nicht Teil von Slice A.

### Admin Platform – Slice B

Verantwortlicher Cursor-Anzeigename: `Admin platform audit`  
Implementierungs-PR: **#46 – gemergt nach `main` `e3bad749`**  
Entscheidung: ADR-0159

**Slice B ist auf `main`.** Read-only System Health ohne Fake-Green. Parent `App / Deployment` bleibt `unknown`. Parent `Supabase` bleibt `not_configured`.

### Admin Platform – Slice C

Verantwortlicher Cursor-Anzeigename: `Admin platform audit`  
Implementierungs-PR: **#49 – gemergt nach `main` `78192ab`**  
Entscheidung: ADR-0162

**Slice C ist auf `main`.** Read-only Provider- und Kostenboard. Konsumiert den gemergten S1-Vertrag (`lib/provider-ops`), ohne ihn zu kopieren oder zu verändern.

Agent `Admin platform audit` **wartet**. Kein Slice D ohne neuen kontrollierten Auftrag.

### Account Platform – AP-3

Verantwortlicher Cursor-Anzeigename: `Account plattform audit vorbereitung`  
Implementierungsbranch: `feat/account-ap3`  
Implementierungs-Draft-PR: **#53** (Base: `main` `78192ab`)  
Auftrag: `docs/ACCOUNT_AP3_TASK.md`  
Status: `docs/ACCOUNT_AP3_STATUS.md`

Aktiver Slice:

**AP-3 ist auf aktuellen `main` `78192ab` synchronisiert.** Ableitende Gruppen Aktiv / Kommend / Vergangen / Ohne Datum. Der 200er-Hinweis bleibt fail-closed. Runtime-Scope unverändert. Entscheidung: ADR-0160. Exact Head `c5e4a51f` lokal und remote gegatet. STOPP für unabhängigen Technical-Lead-Re-Review. Kein AP-4.

### Provider Readiness – S1 Shared Operational Contract

Verantwortlicher Cursor-Anzeigename: `Jetnity provider readiness audit`  
Implementierungs-PR: **#47 – gemergt nach `main` `01761eb9`**  
Auftrag: `docs/PROVIDER_OPS_S1_TASK.md`  
Status: `docs/PROVIDER_OPS_S1_STATUS.md`

**S1 ist auf `main`.** Gemeinsamer technischer Operationsvertrag. Keine Provideraktivierung.

### Provider Readiness – S2 FlugNachweis

Implementierungsbranch: `feat/provider-flight-evidence-s2`  
Implementierungs-PR: **#51 – gemergt nach `main` `52e665ac`**  
Auftrag: `docs/PROVIDER_READINESS_S2_FLUGNACHWEIS_TASK.md`  
Status: `docs/PROVIDER_READINESS_S2_STATUS.md`

Aktiver Slice:

**S2 ist auf `main` (`52e665ac`).** `FlugNachweis` plus S2-B1-RPC- und S2-B2-Tabellengrenze. Development-Migrationen `20260824160000` und `20260824180000` liegen nur auf Development. **Production unverändert.**

Grenze: kein Live-Duffel, keine Provideraktivierung, keine Secrets, keine Production-Migration, kein S3–S6, kein Offer-Booking. `booking_url` bleibt `null`. Route Truth bleibt Foundation D.

### Provider Readiness – S3 / PR #54

Verantwortlicher Cursor-Anzeigename: `Jetnity provider readiness audit`  
Implementierungs-Draft-PR: **#54**  
Entscheidung vorgesehen: ADR-0161

**PR #54 bleibt Draft.** Wartet auf finalen Sync / Re-Review nach Account-Integration von PR #53. Keine Provideraktivierung, keine Secrets, keine Production-Migration.

### Trip Workspace Audit – PR #55

Verantwortlicher Cursor-Anzeigename: `Trip workspace audit architecture`  
Implementierungs-Draft-PR: **#55** (docs-only)

**PR #55 bleibt Draft / docs-only.** Wartet auf finale Reconciliation nach Provider-Integration von PR #54. Startet keinen TW-1-Umbau und keine Runtime-Änderung.

## 4. Parallelitätsregel

Kontrollierte Reihenfolge der offenen Drafts:

1. Account #53 Integration
2. Provider #54 finaler Sync / Re-Review / Integration
3. Trip-Workspace-Audit #55 finale Docs-Reconciliation / Integration
4. danach neue kontrollierte Admin-/TW-Aufträge

Admin Slice C darf parallel nicht in Shared-Contract-Dateien der Provider-Workstreams schreiben. Slice A+B+C, Account AP-1/AP-2 und Provider S1/S2 auf `main` bleiben erhalten. Agent `Admin platform audit` wartet; kein Slice D. TW-1 startet nicht direkt nach AP-3.

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

- PR #43, PR #44, PR #45, PR #46, PR #47, PR #48, PR #49 und PR #51 sind gemergt. PR #53, PR #54 und PR #55 bleiben Draft.
- Kein künftiger PR wird Mark Ready oder gemergt ohne ausdrückliche aktuelle Product-Owner-Freigabe.
- Production-Migrationen bleiben separate Gates.
- Provider-/Secret-/Kosten-Aktivierungen bleiben separate Gates.
- Fortschritt und Entscheidungen müssen im Repository dokumentiert werden.

## 7. Exakter nächster Schritt

1. Account AP-3 / Draft PR #53: Runtime PASS auf `c5e4a51f`. Dieser Stand ist docs-only. Nächster Gate: Technical-Lead Docs-Re-Check. Kein AP-4. Kein Mark Ready. Kein Merge.
2. Nach Account-Integration: PR #54 finaler Sync / Re-Review. Danach PR #55 finale Docs-Reconciliation. Danach erst neue kontrollierte Admin-/TW-Aufträge. Kein Slice D. Kein TW-1 ohne neuen Auftrag.
3. ADR-Allokation: 0158=Slice A, 0159=Slice B, 0160=AP-3, 0161=S3, 0162=Admin Slice C.
4. Der lokale Refund-Integritätsblocker bleibt ein späterer Billing-Auftrag (`docs/ADMIN_BILLING_LOCAL_REFUND_INTEGRITY_TASK.md`), nicht AP-3.
