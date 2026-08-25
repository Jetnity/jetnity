# Jetnity – Active Work Status

Stand: 25. August 2026  
Status: **TW-1, TW-2, TW-4 und TW-3 sind auf `main` integriert. Der TW-4→TW-3-Integrationscheckpoint ist erreicht. Nächster primärer Workspace-Slice: TW-5 – Item- und Gap-Details.**

## 0. Verifizierte Runtime-Baseline

Letzter verifizierter Runtime-Merge auf `main` vor diesem docs-only Continuity-Update:

`16a4c77a53cff9e8638a68f5dd8c77122bf13b48`

Integriert:

- PR #56 – TW-1 Shell & Geräteparität: merged
- PR #58 – TW-2 Reiseübersicht: merged
- PR #59 – Marketing & Growth Standards: merged
- PR #60 – TW-4 Aufmerksamkeit / Jetzt wichtig: merged; Merge-Commit `c935dd9fbb6f3365ed515c1f8fa3b781f20cfb9f`
- PR #64 – TW-3 Timeline / Etappe / Tag: merged; Merge-Commit `16a4c77a53cff9e8638a68f5dd8c77122bf13b48`

TW-3 finaler PR-Head:

`f55db2b0682981f293390b44e704b513476703bf`

Independent Technical-Lead Result: **PASS / Technical Integration Closure**.

Exact-Head Evidence:

- gezielte TW-3-Tests: 10/10
- `npm test`: 1953/1953
- Production Build: grün
- `npm run audit:trip-workspace`: 1018/1018, 0 Fehler
- GitHub Actions CI `32861784215`: SUCCESS
- Vercel Exact-Head Preview: READY
- Vercel Production auf Merge-Commit `16a4c77...`: READY
- offene PR-#64-Review-Threads: 0

PR #52 bleibt historischer docs-only Continuity-Draft und ist kein Runtime-Träger.

## 1. Aktiver/nächster Workstream – Trip Workspace TW-5

Verantwortlicher Cursor-Anzeigename:

`Trip workspace audit architecture`

Nächster Slice:

**TW-5 – Item- und Gap-Details**

Vorbereiteter Branch:

`feat/trip-workspace-tw5-item-gap-details`

Live-Stand beim Continuity-Check:

- Branch existiert;
- Branch-Head = Runtime-Baseline `16a4c77...`;
- noch kein TW-5-Runtime-Commit;
- noch kein TW-5-PR;
- Cursor-Agent für TW-5 noch nicht neu angestoßen.

Vor Runtime-Start werden versioniert:

- TW-5 ADR/Entscheidungsrahmen;
- TW-5 Task;
- TW-5 Status;
- Scope und Non-Scope;
- Shared-Contract-Grenzen;
- Acceptance Criteria;
- Tests/Gates;
- Draft-PR;
- STOPP-Punkt für unabhängigen Technical-Lead-Review.

### TW-5 fachlicher Kern

TW-5 hängt vorhandene Flight-/Unterkunft-/Aktivitäten-/Mobilitätsflächen als **Details einer Reise-, Coverage- oder Attention-Lücke** ein, statt wieder eine modulzentrierte Haupt-IA aufzubauen.

Erlaubt:

- bestehende `FlugBestand`, `HotelBereich`, `AktivitaetenBereich`, `MobilitaetBereich` wiederverwenden;
- vorhandene Lazy-Search-Mounts erhalten;
- Details kontextbezogen aus der Reise-/Gap-Oberfläche öffnen.

Nicht erlaubt:

- Live-Provider oder Provideraktivierung;
- Fake-Preise/Fake-Verfügbarkeit;
- Live-Mobility-/Rental-Adapter vortäuschen;
- manuelle Flüge als nachgewiesene Angebote darstellen;
- stilles `ZRH` oder andere erfundene Herkunftsdefaults;
- DB/Migration/RLS/Auth/Traveller-/Route-Neumodellierung;
- neuer `trips.status`;
- Guardian/Simulator;
- Homepage-/Marketing-Runtime;
- TW-6+ Scope-Creep.

## 2. Erreichter Integrationscheckpoint

Der kanonisch gewünschte Checkpoint ist erreicht:

**TW-4 ✅ → TW-3 ✅ → Technical-Lead-Integrationscheckpoint**

Damit darf der Technical Lead breitere konfliktarme Parallelisierung prüfen. Sie wird nicht automatisch geöffnet.

Vor Parallelisierung muss geprüft werden:

- keine Shared-Contract-Kollision;
- geringe File-/Surface-Überschneidung;
- getrennte Branches/Draft-PRs;
- klare Merge-Reihenfolge;
- jeder Agent eigener Task/Status/Gates/STOPP.

## 3. Wartende Workstreams

### Account Platform

Agent: `Account plattform audit vorbereitung`

- AP-1 bis AP-3 sind auf `main`.
- AP-4 bis AP-12 warten gemäß verbindlicher Build Order auf den vorgesehenen Traveller-/Account-Block.
- Multi-Citizenship/Multi-Document bleibt Pflicht; kein impliziter Default-Pass.

### Provider Readiness

Agent: `Jetnity provider readiness audit`

- S1 bis S3 sind auf `main`.
- S4 bis S8 warten gemäß Build Order.
- echte Provider, Secrets, Verträge und paid calls bleiben besondere Product-Owner-Gates.

### Admin Control Center

Agent: `Admin platform audit`

- A bis C sind auf `main`.
- D bis K plus fehlende Growth-/Marketing-Control-Slices warten gemäß Build Order.
- Billing-/Refund-P1 bleibt vor Finance-/Payment-Live zwingend.

## 4. Reservierte Workstreams

### `Jetnity growth discoverability`

Reserviert; noch nicht starten, bis Public-/Workspace-Truth und die vorgesehenen D0/G0-/Activation-Bedingungen ausreichend stabil sind.

### `Jetnity quality security audit`

Reserviert als unabhängige QA/Security/Resilience/Release-Prüfinstanz. Der erreichte Integrationscheckpoint erlaubt einen gezielten späteren Audit, wenn mehrere Runtime-Workstreams parallel geöffnet werden oder ein relevanter Cross-Domain-Checkpoint ansteht.

### `Jetnity native app architecture`

Reserviert für die spätere Native-Phase. Keine breite Native-Runtime vor Audit/Target Architecture und den Aktivierungsbedingungen des Native-Standards.

## 5. Shared Contracts

Technical-Lead-kontrolliert bleiben insbesondere:

- Auth / Identity / Sessions / MFA / AAL
- RLS / Ownership / Guest→Account
- Traveller / Multi-Citizenship / Multi-Document
- Route / Transit
- Privacy / Consent
- Billing / Payment
- Admin Audit / Capabilities
- Provider Activation
- Attribution / Revenue / Claims Truth
- Guardian / Simulator / Value Impact

Ein möglicher späterer **Citizenship-only Credential-Option**-Contract ist aus TW-4 als Shared-Contract-Bedarf dokumentiert. Er ist **kein aktueller TW-5-Blocker** und darf in TW-5 nicht still erfunden werden.

## 6. Production / Supabase

Supabase Production:

`qscbgcdmivbbnzrcyegn`

Live verifiziert: ACTIVE_HEALTHY.

Production enthält bis einschließlich:

- `20260824120000_flug_route_itinerary_surface_evidence`
- `20260824140000_flug_route_itinerary_untrusted_surface`

Supabase Development enthält zusätzlich:

- `20260824160000_reise_anlegen_flug_handelsfelder_ohne_nachweis`
- `20260824180000_trip_items_flug_handelsfelder_guard`

Diese beiden Development-Migrationen sind **nicht Production-approved**. Keine eigenmächtige Production-Anwendung.

TW-3 selbst brachte keine DB-/Migration-/RLS-/Auth-/Traveller-/Provider-/Secret-Änderung.

## 7. Kosten und besondere Product-Owner-Gates

Aktuell kein neues TW-5-Kostengate.

Product-Owner-Freigabe bleibt zwingend insbesondere für:

- Production-Migration/destructive Production-Daten;
- große Production-RLS-/Ownership-/Identity-Änderungen;
- echte Providerverträge, Production-Secrets, paid calls;
- neue laufende Infrastruktur-/Providerkosten über USD 100/Monat;
- reale Payments/Geldbewegung;
- fundamentale Produkt-/Business-Model-/Build-Order-Abweichung;
- neue Speicherung besonders sensitiver Pass-/MRZ-/Biometrie-Daten;
- fundamentale Auth/MFA/AAL/Session-Änderungen;
- neue sensible externe Datenweitergabe;
- Public Launch / große Production-Aktivierung / Provider live.

Normale scope-treue PRs dürfen nach vollständigen Exact-Head-Gates und unabhängigem Technical-Lead-PASS gemäß `docs/JETNITY_TECHNICAL_LEAD_AUTONOMY_POLICY.md` selbst Ready gesetzt und gemergt werden.

## 8. Offene Governance-Risiken

- `main` Branch Protection ist live weiterhin **nicht aktiviert**.
- Historische offene PRs wie #52, #50, #40, #39 oder #28 sind nicht automatisch aktive Runtime-Slices.
- Ältere Slice-Statusdateien können pre-merge Evidence enthalten und dürfen diesen aktuellen operativen Stand nicht überschreiben.

## 9. Exakter nächster Schritt

1. Post-TW-3-Continuity auf den echten Live-Stand korrigieren.
2. TW-5-ADR/Task/Status auf `feat/trip-workspace-tw5-item-gap-details` versionieren.
3. TW-5 Draft-PR eröffnen.
4. Erst danach `Trip workspace audit architecture` in Cursor mit dem versionierten Auftrag anstoßen.
5. Agent implementiert + adversarial Self-Review + Exact-Head-Evidence.
6. STOPP für unabhängigen ChatGPT/Technical-Lead-Review.

Bis Schritt 4 muss der Product Owner in Cursor nichts manuell starten.
