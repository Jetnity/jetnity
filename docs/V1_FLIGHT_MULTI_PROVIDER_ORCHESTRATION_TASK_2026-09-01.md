# Jetnity – V1 Flight Multi-Provider Orchestration Task

Stand: 1. September 2026  
Status: **TECHNICAL-LEAD TASK / RUNTIME SLICE / SINGLE_AGENT / PROVIDER SELECTION DEFERRED**  
Issue: #412  
Baseline: `main@7654d7e7f07d39e55fc907690137e833070637ea`

## 1. Product-Owner directive

The Product Owner explicitly decided that Jetnity shall continue building the Flight layer provider-neutrally now and decide the eventual real provider later. The architecture must support multiple providers.

This authorization is **internal runtime architecture only**. It does not approve any external provider application, contact, signup, Terms/DPA acceptance, secret, paid/live call, Production S6, Commercial Provenance writer or Production activation.

## 2. Live baseline to verify before coding

Before any implementation, re-fetch and verify:

- `origin/main` is still the task baseline or explicitly stop and report drift;
- Issue #412 is the active slice;
- PR #394 Destination Essentials remains deferred and must not be touched;
- external provider PO gate #395 remains open/unapproved for A-KAYAK/A-WEGO/A-SKYSCANNER/B/C/D/E;
- no second Cursor writer is active on this Flight seam.

Read at minimum:

1. `JETNITY_START_HERE.md`
2. `docs/ACTIVE_WORK_STATUS.md`
3. `docs/JETNITY_V1_BINDING_BUILD_ORDER_2026-09-01.md`
4. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
5. `docs/JETNITY_MULTI_AGENT_SLICE_PLANNING_STANDARD.md`
6. `docs/CHATGPT_TECHNICAL_LEAD_V1_FLIGHT_PROVIDER_MULTILEG_CONTRACT_CLOSED_2026-09-01.md`
7. `docs/V1_FLIGHT_PROVIDER_MULTILEG_CONTRACT_CR1_HANDOFF_2026-09-01.md`
8. `docs/FLIGHT_KAYAK_WEGO_ACCESS_ATTRIBUTION_DUE_DILIGENCE_2026-09-01.md`
9. this task.

## 3. Current evidenced architecture

Existing strengths that must be reused:

- `lib/flights/provider.ts` already defines provider-neutral `FlugProvider`.
- `FlugProvider.suchen(anfrage: FlugSuchanfrage)` already accepts canonical ordered 1–6-leg search truth.
- `FlugOption` already carries `provider` and `externalRef`.
- ranking in `lib/flights/ranking.ts` is deterministic and provider/provision neutral.
- client serialization strips internal score/provider raw metadata/secrets.
- `ProviderOps` observability already supports `providerId`.
- current Duffel adapter is Development/Test only and already uses provider-scoped option IDs.

Current gap:

- `lib/flights/suche.ts::SuchePorts` has exactly `provider: FlugProvider | null`.
- `fluegeSuchen()` calls exactly one provider.
- `app/api/flights/search/route.ts` constructs exactly `duffelProviderAus()`.

## 4. Architecture decision for this slice

Do **not** implement a fake composite `FlugProvider` that merges all providers into one `FlugProviderTreffer`.

Reason: every real provider response has its own `retrievedAt`, timezone/instant evidence and failure/partial state. Collapsing those into one fabricated shared timestamp/evidence object would violate Jetnity Commercial/Provider Truth.

Required flow:

`validated Jetnity Flight search`
→ `0..N independent FlugProvider calls`
→ `provider-specific result/failure/evidence remains attributable`
→ `extract only normalized FlugOption[] for cross-provider ranking`
→ `one global Jetnity ranking`
→ `global result cap`
→ `client-safe response`

The browser must still receive no `retrievedAt`, timezone/instant evidence or raw provider metadata.

## 5. Acceptance criteria

### Search lifecycle

1. Validate the Jetnity search once.
2. Apply Jetnity user rate-limit once per search, not once per provider.
3. Accept zero, one or multiple providers.
4. Invoke configured providers concurrently unless a clear deterministic/security reason requires otherwise.
5. Pass the same validated canonical `FlugSuchanfrage` to every provider.

### Provider identity and truth

6. Keep every provider's `FlugProviderTreffer` truth separate while executing.
7. Never invent a common `retrievedAt` for multiple providers.
8. Keep `FlugOption.provider` and `externalRef` explicit.
9. Never infer a default/primary provider from array order.
10. Do not silently rewrite a provider's identity.
11. Do not blindly cross-provider-deduplicate equivalent-looking itineraries. Same itinerary may differ by fare, baggage, refundability, seller or commercial conditions.
12. If option-ID collision or provider-identity mismatch can corrupt ranking/labels, fail closed or drop only the invalid provider result deterministically; do not silently reassign provider provenance.

### Ranking / result cap

13. Combine only normalized `FlugOption[]` from acceptable provider results.
14. Run existing Jetnity ranking globally across combined options.
15. Provider identity, affiliate commission or provider priority must not affect the score.
16. Cap the final ranked list **after** global ranking to `FLUG_SUCHE_GRENZEN.angebote`.
17. Preserve deterministic tie-breaking and labels.

### Failure semantics

18. Zero configured providers → controlled `unavailable`, as today.
19. One provider → externally observable behaviour remains backward-compatible.
20. Multiple providers, all successful and options present → `ok` unless any successful provider internally reports `partial`.
21. At least one usable success + another provider failure or partial → `partial`, usable options still returned.
22. All successful, no options → `empty`.
23. All providers fail → deterministic controlled status/message. If one provider only, preserve today's exact provider error semantics. For multiple different failure classes, do not falsely claim a specific provider-wide cause; use a neutral controlled aggregate error semantics.
24. A provider exception must not discard good options from another provider.

### Observability

25. Provider invocation observability must be emitted per provider with that provider's `providerId` and outcome.
26. No route, passenger, price, email, IP or provider payload is logged in ProviderOps events.
27. Global pre-provider outcomes such as invalid request/rate-limit/no configured provider may use `providerId: null`.
28. Observability failure remains best-effort and must never alter search output.

### Client / coverage truth

29. Browser response must continue to contain no `retrievedAt`, timezone/instant evidence or raw provider metadata.
30. Update `FLUG_ABDECKUNGSHINWEIS` so it is truthful for one or multiple active sources and does not claim complete market coverage.
31. Do not expose provider secrets, raw responses or vendor SDK structures.

### Wiring

32. Route/factory wiring must no longer structurally assume exactly one provider.
33. Add the smallest provider collection/registry factory needed so adding another adapter later does not require rewriting the route/search orchestrator.
34. Current Duffel test adapter may remain the only actually constructible provider in this repository today.
35. Do not add placeholder KAYAK/Wego/Skyscanner providers.

## 6. Required deterministic tests

At minimum:

- zero providers → unavailable;
- one provider success → unchanged successful semantics;
- one provider timeout/invalid → unchanged controlled semantics;
- two providers success → options from both preserved and jointly ranked;
- two providers success → global final cap is `FLUG_SUCHE_GRENZEN.angebote`;
- one success + one timeout/error → partial + good options retained;
- one provider returns `partial` + another success → aggregate partial;
- all providers successful/empty → empty;
- all providers fail same class → deterministic controlled class;
- all providers fail different classes → neutral aggregate controlled error;
- provider provenance (`provider`, `externalRef`) survives;
- no default provider from array order;
- no cross-provider itinerary collapse;
- collision/mismatch behaviour is fail-closed/deterministic;
- per-provider ProviderOps events use correct providerId;
- invalid/rate-limit/no-provider telemetry has providerId null where appropriate;
- browser no-leak regression for `retrievedAt`, timezone/instant evidence and secrets;
- route/factory test proves 0..N provider collection wiring without a new live provider.

Run relevant focused Flight tests, then full repository gates required by operating standard: typecheck, lint, full tests, hygiene/security/schema checks and Production build.

## 7. Scope

Expected files may include:

- `lib/flights/suche.ts`
- `lib/flights/suche.test.ts`
- `lib/flights/provider.ts` only if a minimal shared type is necessary
- a small provider collection/registry factory under `lib/flights/`
- tests for that factory/collection
- `app/api/flights/search/route.ts`
- `lib/flights/domain.ts` for coverage copy only if necessary
- focused docs / ADR / handoff / self-review / active-status updates.

Reuse existing domain, ranking, schema, rate-limit and ProviderOps contracts. Do not create a third Flight provider abstraction.

## 8. Non-scope / hard holds

Absolutely no:

- KAYAK implementation;
- Wego implementation;
- Skyscanner live transport implementation;
- Duffel Production promotion;
- provider selection or priority hardcoding;
- provider application/contact/signup;
- Terms/DPA acceptance;
- provider credentials/secrets;
- Sandbox/live/paid external calls;
- Production S6/HMAC/>0 budget;
- Commercial Provenance runtime writer/persistence;
- Search→Click persistence/framework;
- vendor-specific cache/TTL/attribution policy;
- Supabase/DB/RLS/Auth mutation;
- TW-8/TW-9;
- Destination Essentials #394;
- public launch/indexing;
- follow-up slice.

## 9. Multi-Agent decision

**SINGLE_AGENT.**

Reason: provider contract, orchestration, route wiring, ranking/result-cap semantics and tests are a single shared Flight runtime seam. Multiple writers create collision and semantic-drift risk.

## 10. Deliverables

- production-grade implementation;
- deterministic tests;
- exact-head CI/Vercel evidence;
- docs/status/handoff/self-review sufficient for future reconstruction;
- explicit list of changed files and any residual risks;
- no claim that a real provider is selected or live.

## 11. STOP

After implementation and all local gates:

**STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW.**

Do not mark Ready.  
Do not merge.  
Do not start a follow-up slice.  
Do not contact or apply to any provider.
