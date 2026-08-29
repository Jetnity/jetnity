# Provider Skyscanner Flights — Adapter Foundation Task (2026-08-29)

## Status

IMPLEMENTED — PR #185. Exact-head acceptance remains binding; see the PR conversation and CI for the final reviewed SHA.

## Objective

Build the first provider-specific flight adapter foundation without connecting Jetnity to Skyscanner yet. The slice must be production-oriented but strictly offline: no API key, no secret, no network request, no provider contract activation, no paid call, no Production runtime-principal allocation and no opening of the S5-B persistence runtime gate.

## Binding architecture

1. Jetnity owns the provider-neutral contract. Skyscanner-specific payload shapes must not leak into Trip Workspace or generic Commercial Provenance code.
2. Fixtures are test evidence only. They must never be able to mint `live_api`, `persisted_snapshot` or provider hard truth.
3. This foundation deliberately contains **no trusted live execution mode and no Commercial-Provenance mint function**. That capability is introduced only together with the real server-side transport and authenticated provider response path.
4. The adapter must fail closed for missing identifiers, currency, price, timestamps and malformed deeplinks.
5. The adapter must not invent freshness, availability, attribution or conversion evidence.
6. Fixture deeplinks may be normalized for UI/contract testing, but are not affiliate evidence.
7. Skyscanner credentials remain server-only when introduced later.

## Scope of this slice

- Provider-neutral flight search/offer types.
- Jetnity-owned Skyscanner normalized Live Prices response contract.
- Offline fixture normalization only.
- Mechanical separation from S5-A/S5-B truth fields.
- Tests proving fixture output exposes no `sourceKind`, `persistenz`, `freshUntil`, `availability` or `affiliate` truth fields.
- Tests for malformed amounts, currency, identifiers, timestamps, IATA codes and deeplinks.

## Explicit non-scope

- Real Skyscanner HTTP calls.
- Trusted/live adapter execution mode.
- Mapping into an S5-A provider quote.
- API key or secret handling.
- Impact credentials or real affiliate attribution.
- Search-session/poll transport implementation.
- Production provider runtime login allocation.
- `production_write_path_allocated=true`.
- Writes to `trip_item_commercial_provenance`.
- TW-8 / TW-9 activation.

## Acceptance criteria

- Typecheck, lint, full unit test suite and production build pass.
- Fixture result is structurally non-promotable without adding new trusted server code.
- No trusted/live constructor exists in this slice.
- No provider-specific type is imported by `lib/commercial-provenance/*`.
- No `process.env`, network client or secret is introduced in the adapter foundation.
- No Production or Supabase mutation.

## Next slice after acceptance

Implement the real server-only Skyscanner transport boundary (create-session/poll lifecycle, timeout/retry/rate-limit behavior, secret injection and provider-response validation) behind a separate gate. Only that future server transport may create a `live_api` Commercial-Provenance candidate for S5-A validation. Production persistence and S5-B runtime-gate opening remain separate later gates.
