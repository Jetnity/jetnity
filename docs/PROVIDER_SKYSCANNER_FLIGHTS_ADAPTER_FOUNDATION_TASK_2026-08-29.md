# Provider Skyscanner Flights — Adapter Foundation Task (2026-08-29)

## Status

IN PROGRESS — Technical Lead autonomous slice.

## Objective

Build the first provider-specific flight adapter foundation without connecting Jetnity to Skyscanner yet. The slice must be production-oriented but strictly offline: no API key, no secret, no network request, no provider contract activation, no paid call, no Production runtime-principal allocation and no opening of the S5-B persistence runtime gate.

## Binding architecture

1. Jetnity owns the provider-neutral contract. Skyscanner-specific payload shapes must not leak into Trip Workspace or generic Commercial Provenance code.
2. Fixtures are test evidence only. They must never be able to mint `persisted_snapshot` or provider hard truth.
3. A future authenticated live transport may produce a `live_api` commercial quote only after the adapter has validated the provider response and the execution context is explicitly trusted as `live_transport`.
4. The adapter must fail closed for missing identifiers, currency, price, timestamps, malformed deeplinks and unsupported execution modes.
5. The adapter must not invent freshness. Until real provider contract behavior is verified, `freshUntil` remains `null`.
6. Affiliate/deeplink data is evidence, not proof of booking or availability.
7. No client-controlled field may select a trusted execution mode.
8. Skyscanner credentials remain server-only when introduced later.

## Scope of this slice

- Provider-neutral flight adapter input/output types.
- Skyscanner Live Prices normalized response contract owned by Jetnity.
- Offline fixture execution mode.
- Explicit trust boundary between fixture and future live transport.
- Mapping of validated future live transport output into the existing S5-A provider-quote shape.
- Tests proving that fixture output cannot be promoted to commercial provider truth.
- Tests for malformed amounts, currency, identifiers, timestamps and deeplinks.
- Continuity note for the next slice.

## Explicit non-scope

- Real Skyscanner HTTP calls.
- API key or secret handling.
- Impact credentials or real affiliate attribution.
- Search-session/poll transport implementation.
- Production provider runtime login allocation.
- `production_write_path_allocated=true`.
- Writes to `trip_item_commercial_provenance`.
- TW-8 / TW-9 activation.

## Acceptance criteria

- Typecheck, lint, full unit test suite and production build pass.
- Fixture path is mechanically unable to return a trusted commercial quote.
- Live mapping requires an internal `live_transport` execution context and cannot be selected from untrusted payload data.
- No provider-specific type is imported by `lib/commercial-provenance/*`.
- No `process.env`, network client or secret is introduced in the adapter foundation.
- No Production or Supabase mutation.
