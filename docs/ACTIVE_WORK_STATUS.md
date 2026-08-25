# Jetnity – Active Work Status

Stand: 25. August 2026  
Status: **TW-1 bis TW-4 und post-TW-3 Continuity liegen auf `main`. Aktiver Slice: TW-5 – Item- und Gap-Details, Draft-PR #66. P1-QS1-01 ist auf Presentation-Ebene behoben und auf Runtime-Head `8183782f` gegatet; STOPP für erneuten unabhängigen Technical-Lead-Review. Kein Ready, kein Merge, kein TW-6.**

## 0. Verifizierte Baseline

Aktueller verifizierter `main` beim Öffnen von TW-5:

`bee9f653d7d83dfbafbf9b9c1da6385433071a4a`

Dieser Commit ist der Merge von PR #65 `docs: repair post-TW3 canonical continuity`.

Integriert:

- PR #56 – TW-1 Shell & Geräteparität
- PR #58 – TW-2 Reiseübersicht
- PR #59 – Marketing & Growth Standards
- PR #60 – TW-4 Aufmerksamkeit / Jetzt wichtig; Merge `c935dd9fbb6f3365ed515c1f8fa3b781f20cfb9f`
- PR #64 – TW-3 Timeline / Etappe / Tag; Merge `16a4c77a53cff9e8638a68f5dd8c77122bf13b48`
- PR #65 – post-TW-3 Continuity; Merge `bee9f653d7d83dfbafbf9b9c1da6385433071a4a`

TW-3 finaler PR-Head:

`f55db2b0682981f293390b44e704b513476703bf`

TW-3 Independent Technical-Lead Result: **PASS / Technical Integration Closure**.

PR #65 Exact Head:

`bc6fedcb0591d79f06dbc0f8aad0415e5e1a2c40`

PR #65 Technical-Lead Result: **PASS / Continuity Closure**; Exact-Head CI SUCCESS, Vercel READY, 0 behind `main`, keine Runtime-/DB-/Shared-Contract-Änderung.

PR #52 bleibt historischer docs-only Continuity-Draft und ist kein Runtime-Träger.

## 1. Aktiver Workstream – Trip Workspace TW-5

Verantwortlicher Cursor-Anzeigename:

`Trip workspace audit architecture`

Slice:

**TW-5 – Item- und Gap-Details**

Branch:

`feat/trip-workspace-tw5-item-gap-details`

Draft-PR:

**#66 – `Trip Workspace TW-5 – Item- und Gap-Details`**

Verbindliche Control Docs:

- `docs/ADR_0167_TRIP_WORKSPACE_TW5_ITEM_GAP_DETAILS.md`
- `docs/TRIP_WORKSPACE_TW5_TASK.md`
- `docs/TRIP_WORKSPACE_TW5_STATUS.md`

Aktueller Zustand:

- Runtime auf `feat/trip-workspace-tw5-item-gap-details` implementiert;
- P1-QS1-01 (doppelte ungeplante Flug-Itinerary in `bereichStatus`) ist auf Presentation-Ebene behoben; Route-Engine unverändert;
- Evidence-Head `8183782fc08c486949212b0e78b9f4ce938aa0dd`;
- Branch mit aktuellem `main` `d039e7bf` (QS-1 docs-only PR #67) synchron, **0 behind / 14 ahead** zum Runtime-Head;
- Draft-PR #66 bleibt Draft / MERGEABLE;
- Exact-Head-Gates, UI-Audit 1018/1018, GitHub Actions und Vercel auf `8183782f` grün;
- **STOPP** für erneuten unabhängigen Technical-Lead-Review.

### TW-5 fachlicher Kern

Die Übergangs-Domain-Navigation ist in der TW-5-Runtime entfernt. Coverage-/Attention-/Timeline-Einstiege öffnen workspace-lokale Gap-/Item-Details.

TW-5 führt eine kleine workspace-lokale Detail-/Intent-Schicht:

- Gap-Details aus vorhandener Coverage/Attention;
- Item-Details aus vorhandenen Timeline-/`ohneTag`-Items;
- bestehende `FlugBestand`-/`UnterkunftBestand`- und Search-Flächen wiederverwenden;
- Commercial-Suchen nur explizit on-demand/lazy mounten;
- Domain-Flächen nicht als konkurrierende Haupt-IA führen;
- keine neue fachliche Wahrheit persistieren.

Nicht erlaubt:

- Live-Provider/Provideraktivierung;
- Fake-Preise/Fake-Verfügbarkeit/Fake-Provider-Health;
- manuelle Flüge als nachgewiesene Angebote darstellen;
- stilles `ZRH` oder andere erfundene Herkunfts-/Airport-Defaults;
- DB/Migration/RLS/Auth/Traveller-/Route-Neumodellierung;
- Citizenship-only Credential Option;
- neuer `trips.status`;
- Guardian/Simulator/Value;
- Homepage-/Marketing-/Growth-/Native-Runtime;
- TW-6+ Scope-Creep.

## 2. Erreichter Integrationscheckpoint

Der kanonische Checkpoint ist erreicht:

**TW-4 ✅ → TW-3 ✅ → Technical-Lead-Integrationscheckpoint**

Breitere konfliktarme Parallelisierung ist grundsätzlich prüfbar, wird aber aktuell **nicht automatisch geöffnet**. TW-5 bleibt der primäre Runtime-Workstream, bis der Technical Lead bewusst weitere konfliktarme Arbeit freigibt.

## 3. Wartende Workstreams

### Account Platform

Agent: `Account plattform audit vorbereitung`

- AP-1 bis AP-3 sind auf `main`.
- AP-4 bis AP-12 warten gemäß verbindlicher Build Order.
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

Reserviert als unabhängige QA/Security/Resilience/Release-Prüfinstanz. Gezielte Aktivierung an einem stabilen Cross-Domain-/Multi-Agent-Checkpoint möglich; nicht als allgemeiner Feature-Entwickler.

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

Ein möglicher späterer **Citizenship-only Credential-Option**-Contract aus TW-4 bleibt außerhalb von TW-5 und ist kein aktueller Blocker.

## 6. Production / Supabase

Supabase Production:

`qscbgcdmivbbnzrcyegn` – live beim Continuity-Check `ACTIVE_HEALTHY`.

Production enthält bis einschließlich:

- `20260824120000_flug_route_itinerary_surface_evidence`
- `20260824140000_flug_route_itinerary_untrusted_surface`

Development enthält zusätzlich:

- `20260824160000_reise_anlegen_flug_handelsfelder_ohne_nachweis`
- `20260824180000_trip_items_flug_handelsfelder_guard`

Diese beiden Development-Migrationen sind **nicht Production-approved** und gehören nicht zu TW-5.

TW-5 plant keine DB-/Migration-/RLS-/Auth-/Traveller-/Provider-/Secret-Änderung.

## 7. Kosten und besondere Product-Owner-Gates

Aktuell kein TW-5-Kostengate und kein besonderes Product-Owner-Gate offen.

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
- einzelne ältere Detaildokumente können historische/pre-merge Statusformulierungen enthalten; Start Here, Active Work, Handoff und Live-Systeme bestimmen die operative Wahrheit.

## 9. Exakter nächster Schritt

ChatGPT / Technical Lead führt den erneuten unabhängigen Review von Draft-PR #66 auf Exact Head `8183782f` plus docs-only Persist. P1-QS1-01-Closure steht in `docs/TRIP_WORKSPACE_TW5_STATUS.md`.

**Kein Ready. Kein Merge. Kein TW-6**, bis der Technical Lead ausdrücklich PASS gibt.