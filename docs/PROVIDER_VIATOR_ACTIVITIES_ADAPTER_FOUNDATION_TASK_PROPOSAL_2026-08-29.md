# Provider Viator Activities — Adapter Foundation Task Proposal

Stand: 29. August 2026  
Status: **PROPOSAL ONLY / NICHT AUTORISIERT / NICHT STARTEN**  
Cursor-Agent: `Jetnity provider viator audit 1`  
Voraussetzung: unabhängiger Technical-Lead-PASS von Draft-PR #189 **und** ein späterer versionierter Cursor-Task

> Diese Datei ist die vom Audit verlangte präzise Future-Implementation-Spec. Sie ist **kein** Startauftrag. Ein Folgeslice braucht einen eigenen `docs/CURSOR_…_TASK.md` bzw. eine vom Technical Lead neu versionierte Task.

---

## Objective

Kleinste offline Viator-Activities-Adapter-Foundation, analog zur akzeptierten Skyscanner-Flights-Foundation auf `main @ 69ef27b1`. Production-orientiert, strikt offline: kein API-Key, kein Secret, kein Netzwerk, kein Partnervertrag, kein paid call, kein Runtime-Write-Path/Principal, kein trusted S5-B-Write, kein TW-8. S5-B Persistence Apply (`20260829140000`) ist bereits erfolgt und nicht Teil dieses Proposal. Viator bleibt das akzeptierte erste Activities-Target; GetYourGuide später — diese grobe Zielwahl nicht erneut öffnen.

---

## Binding architecture

1. Jetnity besitzt den provider-neutralen Vertrag (`ActivitySuchanfrage`, `ActivityOption`, `ActivityProvider`). Viator-Rohformen dürfen Workspace und `lib/commercial-provenance` nicht importieren.
2. Fixtures sind Test-Evidence. Sie dürfen weder `live_api` noch `persisted_snapshot` noch Affiliate `present` minten.
3. Kein Trusted-Live-Konstruktor und keine Commercial-Provenance-Mint-Funktion in der Foundation.
4. Fail-closed für fehlende `productCode`, widersprüchlichen Preis/Währung, nicht-https/`http` `productUrl`, erfundene Timeslots. Host-Allowlist und Attribution sind **nicht** Foundation-Scope; Fixture-URL beweist keine Attribution. `https:` allein reicht später nicht für Redirect.
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

Offline-Foundation braucht **keinen** Shared-Core-Edit und **keinen** HTTP-Client. ADR-0199 `lib/server/providers/core/*` bleibt unberührt. Ein späteres Domain-Typ-Loch, falls je bewiesen, ist ein eigener kleiner Slice — kein zweiter Transport-Kern und nicht in diesem Proposal autorisiert.

Erste Foundation = **search/preview only**. Keine zertifizierte PDP, kein Affiliate-Redirect, kein `live_api`.

---

## Explicit non-scope

- Echte Viator-HTTP-Calls, Sandbox oder Production
- Trusted/live execution mode
- `/availability/check` Transport
- Mapping Search/Detail in `live_api` oder S5-A-Provider-Quote
- Zweiten HTTP-Transport neben ADR-0199
- Zertifizierte PDP / Affiliate-Redirect aus der Search-Form
- API-Key/Secret-Handling
- `productUrl` in UI oder `trip_items.booking_url`
- Destination-Resolver gegen Live-Taxonomie
- Katalog-Ingestion `/products/modified-since`
- Booking/Hold/Cancel/Payment
- Production-Provider-Login
- `production_write_path_allocated=true`
- Writes nach `trip_item_commercial_provenance`
- S5-B Persistence erneut anwenden (bereits Production-angewendet)
- TW-8 / TW-9
- Erneutes PO-Wahl-Gate „darf Viator first sein?“; ADR-0078 bleibt Domain-Architektur
- GetYourGuide-Adapter (späterer Target, nicht dieser Slice)

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

Erst nach Foundation-Acceptance **und** PO-Gates: server-only Transport **über ADR-0199** `lib/server/providers/core/*` für `/products/search` und `/products/{product-code}` hinter Sandbox. Dieser Transport erzeugt **`content_preview`**, nicht `live_api`, nur weil er authenticated HTTP ist. Schedules bleiben `schedule_hint`.

Nur ein gültiger Full-access-`/availability/check` für user-selected date + gültiges paxMix ist Kandidat für Real-time Price/Availability Commercial Truth. Keine erfundene TTL; Redirect-Checkout kann abweichen. Basic kann Check nicht. Attribution-UI, Host-Allowlist, `rel="sponsored"`, `product_detail` und Full-access-Freigabe bleiben extra Gates. S5-B Persistence Apply ist bereits erfolgt; verbleibendes Commercial-Gate ist Runtime-Write-Path/Principal + echte Provider-Antwort + trusted Write. TW-8 bleibt geschlossen, solange keine echte Provider Commercial Provenance existiert.

---

## STOP

Nicht aus PR #189 starten. Warten auf unabhängigen TL-Review plus neuen versionierten Task.
