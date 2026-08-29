# Provider HBX Hotels — Proposed Adapter Foundation Task

Stand: 29. August 2026  
Status: **PROPOSAL ONLY / NOT AUTHORIZED / DO NOT START FROM THIS AUDIT**  
Cursor-Agent: `Jetnity provider hbx audit 1`

> Dieser Text ist ein späterer Implementation-Vorschlag. Er ist **kein** Startauftrag. Kein Folgeslice aus Draft-PR #188.

---

## Objective

Build the first HBX/Hotelbeds accommodations adapter foundation without connecting Jetnity to HBX. Production-oriented, strictly offline. Mirror the accepted Skyscanner flights foundation pattern.

## Binding architecture

1. Jetnity owns the provider-neutral hotel/`accommodations` contract. HBX payload shapes must not leak into Trip Workspace, `lib/hotels` UI types, or `lib/commercial-provenance`.
2. Fixtures are test evidence only. They must never mint `live_api`, `provider_snapshot` or `persisted_snapshot`.
3. No trusted live constructor, no HTTP, no `process.env`, no signature factory in this slice.
4. Fail closed for missing hotel code, rateKey, currency, consumer price, coordinates and timestamps.
5. Do not invent freshness, availability, attribution, conversion, stars, address or breakfast.
6. `rateKey` is opaque. Do not parse it.
7. `net` is not a consumer price. Without `sellingRate`, drop the offer.
8. `packaging=true` drops.
9. Credentials remain server-only when introduced later.

## Scope

- Jetnity-owned normalized HBX Availability fixture schema `jetnity.hbx.hotels.availability.normalized.v1`.
- Offline fixture → `HotelOption` or shared accommodations offer, then existing `HotelProviderTreffer`.
- Tests: malformed amounts, currency, identifiers, coordinates, timestamps, packaging, missing sellingRate, schema mismatch.
- Tests: fixture output exposes no `sourceKind`, `persistenz`, `freshUntil`, `availability` or `affiliate` truth fields.

## Explicit non-scope

- Signup, API key, secret, X-Signature, mTLS.
- Real HTTP to `api.test.hotelbeds.com` or any live host.
- Content API batch or catalog database.
- CheckRate, Booking, Voucher, Reconfirmation.
- Cache API, CDS.
- `sourceMarket` live behavior.
- Mapping into an S5-A quote.
- Production runtime-principal allocation.
- `production_write_path_allocated=true`.
- Writes to `trip_item_commercial_provenance`.
- TW-8 / TW-9.
- Booking.com adapter.
- Shared-core edits beyond a new `lib/providers/hotelbeds/hotels/*` or equivalent isolated folder, and only if the shared accommodations core is already accepted. If the core is not accepted, keep types inside the HBX folder and map directly to existing `HotelOption` without changing `lib/hotels/domain.ts` unless a typed hole is proven.

## Acceptance

- Typecheck, lint, focused unit tests, production build.
- Fixture result structurally non-promotable without new trusted server code.
- No live constructor.
- No provider-specific type imported by `lib/commercial-provenance/*`.
- No network client or secret.

## Next slice after that acceptance

Only after a **new** versioned task: server-only TEST transport (signature factory, availability POST, timeout/error mapping). That slice still must not mint `live_api`. Content-Batch, CheckRate/Nachweis, Certification and Live remain later gates.

## Dependencies / decisions still required before authorization

1. Independent TL PASS of this audit (PR #188).
2. Product Owner confirms HBX remains backup Search — not a booking-product pivot.
3. Explicit choice: shared accommodations core first, or HBX foundation against today’s `HotelProvider`.
4. Booking.com access status remains honest; this slice does not replace that attempt.
