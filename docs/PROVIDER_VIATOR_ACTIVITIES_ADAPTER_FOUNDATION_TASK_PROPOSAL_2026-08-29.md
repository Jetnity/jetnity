# Provider Viator Activities — Adapter Foundation Task Proposal

Stand: 29. August 2026  
Status: **PROPOSAL ONLY / NICHT AUTORISIERT / NICHT STARTEN**  
Cursor-Agent: `Jetnity provider viator audit 1`  
Voraussetzung: unabhängiger Technical-Lead-PASS von Draft-PR #189 **und** ein späterer versionierter Cursor-Task

> Diese Datei ist die vom Audit verlangte präzise Future-Implementation-Spec. Sie ist **kein** Startauftrag. Ein Folgeslice braucht einen eigenen `docs/CURSOR_…_TASK.md` bzw. eine vom Technical Lead neu versionierte Task.

---

## Objective

Kleinste offline Viator-Activities-Adapter-Foundation, analog zur akzeptierten Skyscanner-Flights-Foundation auf `main @ 69ef27b1`. Production-orientiert, strikt offline: kein API-Key, kein Secret, kein Netzwerk, kein Partnervertrag, kein paid call, kein S5-B-Runtime-Gate, kein TW-8.

---

## Binding architecture

1. Jetnity besitzt den provider-neutralen Vertrag (`ActivitySuchanfrage`, `ActivityOption`, `ActivityProvider`). Viator-Rohformen dürfen Workspace und `lib/commercial-provenance` nicht importieren.
2. Fixtures sind Test-Evidence. Sie dürfen weder `live_api` noch `persisted_snapshot` noch Affiliate `present` minten.
3. Kein Trusted-Live-Konstruktor und keine Commercial-Provenance-Mint-Funktion in der Foundation.
4. Fail-closed für fehlende `productCode`, widersprüchlichen Preis/Währung, nicht-https/`http` `productUrl`, erfundene Timeslots.
5. Keine erfundene Freshness, Verfügbarkeit, Attribution oder Conversion.
6. Fixture-`productUrl` darf strukturell geparst werden, ist aber keine Affiliate-Evidence.
7. Credentials bleiben später server-only.
8. `ActivityProvider.suchen()` erzeugt keine Deeplinks (ADR-0078). Attribution bleibt eine getrennte, in der Foundation unverdrahtete Naht.
9. Zielklasse dokumentieren: v2 Full-access Affiliate. Basic-Responses ohne Check bleiben parsebar. Merchant/Full+Booking-Felder nicht modellieren.
10. Traveller: keine Citizenship/Passport-Felder. Kein Default-`ADULT`-paxMix.

---

## Scope of that future slice

- Jetnity-owned `jetnity.viator.activities.normalized.v1`
- Offline-Fixture-Normalizer → `ActivityOption[]` plus `evidenceMode: 'fixture'`
- Mechanische Trennung von S5-A/S5-B-Truth-Feldern
- Tests: Fixture-Output exponiert keine `sourceKind` / `persistenz` / `freshUntil` / `availability` / Affiliate-present
- Tests: malformed amount, currency, identifiers, timeslots, URLs
- Docs: Status/Handoff/Self-Review des Foundation-Slice

Optional, nur wenn ohne Shared-Core-Änderung unmöglich: dünner provider-neutraler `activities`-Fixture-Result-Typ **neben** `ActivityProvider`, analog `FlightProviderFixtureSearchResult`. Das wäre ein eigener, begründeter Shared-Core-Minischnitt — **nicht** still in der Foundation verstecken und nicht in diesem Proposal autorisiert.

---

## Explicit non-scope

- Echte Viator-HTTP-Calls, Sandbox oder Production
- Trusted/live execution mode
- `/availability/check` Transport
- Mapping in eine S5-A-Provider-Quote
- API-Key/Secret-Handling
- `productUrl` in UI oder `trip_items.booking_url`
- Destination-Resolver gegen Live-Taxonomie
- Katalog-Ingestion `/products/modified-since`
- Booking/Hold/Cancel/Payment
- Production-Provider-Login
- `production_write_path_allocated=true`
- Writes nach `trip_item_commercial_provenance`
- TW-8 / TW-9
- Änderung von ADR-0078 ohne Product Owner
- GetYourGuide-Adapter

---

## Acceptance criteria (für den späteren Slice)

- Typecheck, lint, relevante Unit-Tests, Production-Build grün
- Fixture-Result strukturell nicht promotable ohne neuen Trusted-Server-Code
- Kein Trusted-Live-Konstruktor
- Kein Viator-Typ-Import in `lib/commercial-provenance/*`
- Kein `process.env`, kein Network-Client, kein Secret im Adapter
- Keine Production- oder Supabase-Mutation
- Draft bleiben; Ready/Merge nur Technical Lead nach Exact-Head-Review

---

## Suggested later slice after that foundation

Erst nach Foundation-Acceptance **und** PO-Gates: server-only Transport (`/products/search`, `/products/{product-code}`, Timeout/429, Secret-Injection, Response-Validation) hinter Sandbox. Nur dieser Transport darf jemals einen `live_api`-Kandidaten erzeugen. `/availability/check` und Attribution-UI bleiben extra Gates. Production-Persistenz und S5-B-Runtime bleiben getrennt.

---

## STOP

Nicht aus PR #189 starten. Warten auf unabhängigen TL-Review plus neuen versionierten Task.
