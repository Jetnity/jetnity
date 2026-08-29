# Provider Adapter Core Foundation Task — 2026-08-29

Status: READY FOR IMPLEMENTATION BY CURSOR AGENT

Base main SHA: `69ef27b169780e41ba506a69acb15caafa645517`
Branch: `feat/provider-adapter-core-foundation-2026-08-29`

## Technical Lead intent

Build the shared, provider-neutral server transport core that future Jetnity provider adapters must use. This is infrastructure, not a Skyscanner-specific implementation and not a Commercial Truth activation.

The core must make provider integrations consistent, fail-closed, observable, secret-safe, bounded and testable offline. It must not allow test data, caller-supplied flags, or untrusted code paths to mint provider trust.

## Binding architecture rules

1. Provider-neutral core only. No Skyscanner/Expedia/GetYourGuide/12Go-specific concepts in generic core types.
2. Trust comes from code-path/module boundaries, never from caller data such as `trusted: true`, `live: true`, `sourceKind`, or similar forgeable fields.
3. No provider credential may be returned, logged, serialized into errors, persisted in generic diagnostics, or exposed to client bundles.
4. Tests remain fully offline using dependency-injected transports/clock/sleeper where needed.
5. No Supabase mutation, no Production runtime principal allocation, no provider activation, no real network calls, no paid calls, no runtime-gate change.
6. No Commercial-Provenance minting in this slice. The core may return transport evidence/results to a future trusted adapter layer, but it must not construct `persisted_snapshot`, `live_api`, or hard Commercial Truth.
7. Fail closed for malformed HTTP responses, invalid JSON, invalid status transitions, aborted requests, timeouts, exhausted retries, and rate limiting.
8. Retry policy must be bounded and explicit. Never retry indefinitely.
9. Do not automatically retry all 4xx responses. 429 may be handled according to policy; authentication/authorization/configuration failures must surface distinctly.
10. Observability must be structured and redacted. Never include request headers wholesale. Never include API keys/tokens/session secrets in event payloads.
11. Timeouts must use cancellation/AbortSignal semantics, not merely ignore late responses.
12. Generic code must support provider-specific rate-limit policies without encoding provider-specific numeric limits in the core.
13. Keep public/provider-neutral domain contracts separate from server-only implementation modules.
14. No dependency on client-controlled locale/market/currency validation beyond explicit adapter-layer validation.
15. Existing Skyscanner fixture foundation must keep its fixture-only trust semantics unchanged.

## Required implementation

### A. Generic provider transport domain

Create a provider-neutral server transport domain under a server-only path such as `lib/server/providers/core/` (choose the exact structure consistent with repo conventions).

Define strong types for at least:
- provider identifier
- operation identifier
- HTTP method
- request URL/path representation without leaking credentials
- sanitized request metadata
- transport response metadata
- transport error taxonomy
- timeout policy
- retry policy
- rate-limit outcome
- observability event shape

The error taxonomy should distinguish at minimum:
- invalid_request / invalid_configuration
- authentication / authorization provider failure
- rate_limited
- timeout
- aborted
- network_error
- provider_4xx
- provider_5xx
- malformed_response
- retry_exhausted

Do not throw raw fetch/HTTP errors across the boundary without normalization.

### B. Dependency-injected HTTP executor

Implement a generic executor that accepts an injected HTTP client/fetch-like dependency. Production transport can later use global `fetch`, while tests use deterministic fakes.

Requirements:
- explicit timeout with AbortController or equivalent cancellation
- bounded retries
- no infinite loops
- configurable retryable status set/predicate
- 429 handled explicitly
- 5xx retry behavior configurable
- non-retryable failures returned immediately
- safe body parsing with a configured maximum/strategy appropriate to current repo patterns
- invalid JSON handled as `malformed_response`
- never log or expose raw credential headers
- preserve minimal safe diagnostics: provider id, operation, attempt, status, elapsed time, correlation/request id if safe/available

### C. Backoff / retry

Implement deterministic/testable delay calculation. Support at least:
- max attempts
- base delay
- max delay
- optional jitter strategy abstraction or deterministic no-jitter default for tests
- optional honoring of safe `Retry-After` values for 429 where applicable

Do not sleep if the request is already aborted.
Do not permit caller values that create unbounded delays or attempts; validate/clamp/reject invalid configuration.

### D. Secret-safe header handling

Provide a small helper/boundary for constructing provider requests where credentials can be passed to the HTTP client but never appear in:
- error messages
- observability events
- returned result metadata
- test snapshots

Explicitly redact standard secret header names and allow provider adapters to register additional sensitive header names.

### E. Observability interface

Define an injected observer/logger interface rather than coupling core code to a concrete service.

Events should cover at least:
- request_started
- request_succeeded
- request_failed
- request_retry_scheduled
- request_rate_limited
- request_timeout

Events must be structured, stable and safe for future server logs/telemetry. No full request/response bodies by default.

### F. Unit tests

Add comprehensive unit tests covering at least:
- 200 success
- JSON parse success
- malformed JSON failure
- 400 immediate non-retry
- 401/403 classified auth/authz and non-retry
- 429 retry when policy allows
- 429 exhausted
- 500/502 retry behavior
- eventual success after retry
- network error retry + exhaustion
- timeout aborts request
- external abort stops retry loop
- retry delay bounded
- invalid retry configuration rejected
- no secret present in error/output/observer events
- observer gets correct event sequence
- response metadata never contains credential headers

Use deterministic fakes. No real internet access in tests.

## Skyscanner compatibility requirement

The generic core must be able to support the known Skyscanner Flights Live Prices workflow without embedding Skyscanner rules:
- server-side `x-api-key`
- HTTPS create call
- session-based poll calls
- provider-specific 429 limits
- partial results followed by poll lifecycle

The Create/Poll lifecycle itself remains adapter-level work and must NOT be generalized prematurely into every provider.

## Explicit non-scope

- real Skyscanner create/poll implementation
- any real provider API call
- API keys/secrets
- Vercel environment mutation
- Supabase changes
- Commercial-Provenance write/minting
- `live_api` trust creation
- `persisted_snapshot`
- TW-8/TW-9 opening
- UI changes
- provider activation
- paid plans/contracts

## Acceptance gates

Cursor Agent must run and report the repository's full applicable quality gates, including at least:
- typecheck
- lint
- relevant unit tests
- full test suite if feasible/required by repository standard
- production build
- existing guard/export/package checks

The Agent must self-review before handoff, but self-review is not Technical Lead approval.

Technical Lead will independently review the exact head SHA. Any change after TL review invalidates the prior PASS and requires full re-review/re-gating.

No merge without Technical Lead PASS.

## Handoff format required from Cursor Agent

Return:
1. exact branch and head SHA
2. concise architecture summary
3. complete changed-file list
4. test/CI commands and results
5. known residual risks/debt
6. explicit confirmation that no real provider call, credential, Supabase mutation, runtime activation or Commercial-Provenance mint was introduced
7. PR number if opened

## Next slice after successful merge

After this foundation is accepted, implement Skyscanner Flights server transport using this core: request mapping, `/create`, session token validation, `/poll`, bounded lifecycle, Skyscanner-specific rate-limit semantics, response validation and redacted observability. Only after that should a separate trusted normalization slice be considered for Commercial-Provenance candidate generation.