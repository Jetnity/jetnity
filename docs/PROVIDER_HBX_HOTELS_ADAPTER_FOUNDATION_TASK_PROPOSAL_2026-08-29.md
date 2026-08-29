# Provider HBX Hotels — Proposed Adapter Foundation Task

Stand: 29. August 2026  
Status: **PROPOSAL ONLY / NOT AUTHORIZED / DO NOT START FROM THIS AUDIT**  
Cursor-Agent: `Jetnity provider hbx audit 1`

> Dieser Text ist ein späterer Implementation-Vorschlag. Er ist **kein** Startauftrag. Kein Folgeslice aus Draft-PR #188.

---

## Objective

Build the first concrete HBX/Hotelbeds hotels adapter foundation without connecting Jetnity to HBX. Production-oriented, strictly offline. Mirror the accepted Skyscanner flights foundation pattern. HBX is the already selected first hotels adapter target; Booking.com Demand and Expedia Rapid stay later. No Booking/Voucher/Merchant pivot.

## Binding architecture

1. Jetnity owns the provider-neutral hotel/`accommodations` contract. HBX payload shapes must not leak into Trip Workspace, `lib/hotels` UI types, or `lib/commercial-provenance`.
2. Fixtures are test evidence only. They must never mint `live_api`, `provider_snapshot` or `persisted_snapshot`.
3. No trusted live constructor, no HTTP, no `process.env`, no signature factory in this slice.
4. Fail closed for missing hotel code, rateKey, currency, consumer price, coordinates and timestamps.
5. Do not invent freshness, availability, attribution, conversion, stars, address or breakfast. Unmapped board codes leave `fruehstueckEnthalten=null`.
6. `rateKey` is opaque. Do not parse it.
7. Pricing model is explicit server-side commercial evidence (`net` | `commissionable` | `unknown`), never inferred from response shape, locale or citizenship. `net` is not a consumer price. Until the model is known, display eligibility stays unknown; fixtures may exercise shapes without minting a consumer price.
8. `packaging=true` drops.
9. Credentials remain server-only when introduced later.

## Scope

- Jetnity-owned normalized HBX Availability fixture schema `jetnity.hbx.hotels.availability.normalized.v1`.
- Offline fixture → existing `HotelOption` / `HotelProviderTreffer`. No new shared accommodations core. No `lib/server/providers/core` edit.
- Tests: malformed amounts, currency, identifiers, coordinates, timestamps, packaging, schema mismatch, unknown pricing model (no display mint), unmapped board → `fruehstueckEnthalten=null`.
- Tests: fixture output exposes no `sourceKind`, `persistenz`, `freshUntil`, `availability` or `affiliate` truth fields.

## Explicit non-scope

- Signup, API key, secret, X-Signature, mTLS.
- Real HTTP to `api.test.hotelbeds.com`, `api-mtls.*` or any live host.
- Content API batch or catalog database.
- CheckRate, Booking, Voucher, Reconfirmation.
- Cache API, CDS.
- `sourceMarket` live behavior.
- Mapping into an S5-A quote.
- Production runtime-principal allocation.
- `production_write_path_allocated=true`.
- Writes to `trip_item_commercial_provenance`.
- TW-8 / TW-9.
- Booking.com or Expedia adapter.
- Edits to `lib/server/providers/core/*`, `lib/hotels/*` or `lib/commercial-provenance/*`. Keep types inside `lib/providers/hotelbeds/hotels/*` and map to existing `HotelOption` unless a typed hole is proven in a later separate slice.

## Acceptance

- Typecheck, lint, focused unit tests, production build.
- Fixture result structurally non-promotable without new trusted server code.
- No live constructor.
- No provider-specific type imported by `lib/commercial-provenance/*`.
- No network client or secret.

## Next slice after that acceptance

Only after a **new** versioned task: server-only TEST transport via ADR-0199 (signature factory, fail-closed mTLS, `retry5xx=false`, availability POST). That slice still must not mint `live_api`. Content-Batch/Boards-Katalog, CheckRate/Nachweis, Certification and Live remain later gates.

## Dependencies / decisions still required before authorization

1. Independent TL PASS of this audit (PR #188).
2. No Product-Owner re-choice of first hotels adapter. HBX remains the first concrete foundation/evaluation target. Confirm only: no Booking/Voucher/Merchant pivot; consumer Production activation stays a later Commercial/Product gate.
3. No new shared accommodations core. Foundation uses today’s `HotelProvider`/`HotelOption`. Future HTTP consumes integrated `lib/server/providers/core/*`.
4. Booking.com Demand and Expedia Rapid remain later adapters. Their access status stays honest; this slice does not create a new PO choice.
