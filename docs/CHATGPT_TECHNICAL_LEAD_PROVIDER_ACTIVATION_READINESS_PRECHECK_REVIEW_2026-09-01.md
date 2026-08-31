# ChatGPT Technical Lead – Provider Activation Readiness Precheck Review

Stand: 1. September 2026  
Status: **INDEPENDENT TECHNICAL-LEAD PASS / AUDIT ONLY / NO PROVIDER ACTIVATION**

Issue: #351  
Draft-PR: #354  
Branch: `audit/provider-activation-readiness-precheck-2026-09-01`  
Logical Cursor agent: **`Jetnity provider activation readiness precheck 1`**  
Generation: **1**  
Cursor session: `bc-d1b4e6bb-c952-4242-ba57-384783bc23ea`

## 1. Review scope

Independent review of the Provider Activation Readiness Precheck against:

- `main@ebd08ec07134f1ad4d3f6d68a694be4ff189fa5b`;
- the Product-Owner binding build order;
- Provider Readiness implementation slices;
- Commercial Provenance S5-A/S5-B truth boundaries;
- TW-8/TW-9 readiness;
- current CI/Vercel evidence;
- fresh read-only Supabase Production evidence;
- the agent deliverables and adversarial self-review.

Live Evidence wins.

## 2. Review history

Initial agent delivery:

`43bb98762ed00bc0293e5b4df5566a4e25c3d865`

Verdict: **CHANGES REQUIRED**.

Blocking findings:

1. Duffel sandbox/test prices were proposed as S5-A `live_api` / real Commercial Truth even though sandbox prices are not real/live market prices.
2. The Product-Owner binding order `S4–S8, then real providers` was weakened by positioning a provider proof as the immediate next implementation.
3. Process-local/Vercel memory was proposed as a cross-request search-session/Nachweis store.
4. Viator Basic was incorrectly treated as having no real-time availability at all instead of distinguishing real-time schedule retrieval from booking-grade `/availability/check` verification.

Same logical agent / same Cursor session performed the review-fix.

Review-fix head:

`997fca395cef8fe44a4198a1b313e28364d83723`

Verdict on that exact head: **PASS**.

## 3. Findings closed

### Sandbox truth class

Closed. Duffel test/sandbox evidence is now explicitly mechanics-only and must not mint S5-A `live_api`, must not satisfy the real Commercial Truth snapshot gate, and must not unlock TW-8.

### Binding build order

Closed. `docs/JETNITY_BINDING_BUILD_ORDER.md` remains Product-Owner binding: Provider Readiness S4–S8 before real providers. No sequencing exception is inferred.

The Provider Readiness slice graph still places **S6 Persistent Cost Guard** on the serial path after S5. Residual S4 remains separately open and must also be closed before any real-provider phase. S7 follows S6; S8 remains required before real-provider activation.

### Cross-request server state

Closed. Process-local/Vercel memory is no longer treated as a reliable cross-request Nachweis store. A zero-persistence proof must perform search → select/revalidate → verify/mint in one server-side invocation. Any later cross-request store requires a durable server-side design and its own gated architecture slice.

### Viator Basic

Closed. Basic access is correctly differentiated: real-time product schedule retrieval is available, while booking-grade `/availability/check` verification is not. This correction does not make Activities the preferred first Commercial Truth domain.

## 4. Independent exact-head gates on `997fca...`

- CI #1555 / Run `33448121389`: **SUCCESS**;
- Auth configuration: SUCCESS;
- Typecheck: SUCCESS;
- Lint: SUCCESS;
- Tests: SUCCESS;
- Admin API protection: SUCCESS;
- schema references: SUCCESS;
- dead/unreachable code: SUCCESS;
- unused exports: SUCCESS;
- unused packages: SUCCESS;
- Production build: SUCCESS;
- Vercel Preview `dpl_FBvQiu1DnfhQWhp3Tv1u7T9CAigc`: **READY** on exact `997fca...`;
- GitHub inline review threads: **0**;
- Vercel unresolved toolbar threads: **0**;
- `main` remained `ebd08ec07134f1ad4d3f6d68a694be4ff189fa5b` during review.

Fresh read-only Supabase Production verification on project `qscbgcdmivbbnzrcyegn`:

- `public.trip_item_commercial_provenance` exists;
- commercial provenance rows = **0**;
- `production_write_path_allocated = false`;
- `public.trip_item_flight_event_provenance` remains absent/unapplied.

No Production mutation was performed.

## 5. Final audit conclusion

### Immediate programme truth

No provider should be activated now.

Under the current Provider Readiness serial path, **S6 Persistent Cost Guard** is the next implementation candidate after S5. This review does not start S6. Residual S4, S7 and S8 remain mandatory before any real-provider phase.

### First later real Commercial Truth path

Preferred domain: **Flights**.

The eventual live vendor remains undecided. Duffel live versus Skyscanner or another qualified real-price source must be decided only after partner access, commercial terms, licensing/cache rules, DPA/privacy, cost and secret gates are resolved.

Duffel test mode may be useful later as an integration harness, but it is not real Commercial Truth and cannot be promoted to `live_api`.

### TW-8 / TW-9

Remain **BLOCKED**. This audit does not unlock them.

## 6. Risk state

### P0
None open inside the completed audit scope.

### P1
None open inside the completed audit scope after review-fix.

### P2
None open inside the completed audit scope after review-fix.

Known programme work intentionally remains open outside the audit verdict:

- residual Provider Readiness S4;
- S6 Persistent Cost Guard;
- S7 Observability / Health Hooks;
- S8 License/Cache Hooks;
- real provider selection/onboarding;
- real server-side Commercial Truth snapshot;
- Production commercial writer allocation;
- TW-8/TW-9.

## 7. Product-Owner gates remain closed

This PASS does not authorize:

- provider signup or contract acceptance;
- DPA acceptance;
- API key/token/secret creation or storage;
- paid/live provider calls;
- Production provider activation;
- Production database/schema/RLS/grant/role/function mutations;
- runtime/login writer principal allocation;
- application writer/backfill;
- TW-8/TW-9 runtime;
- public provider-live claims;
- sensitive Traveller/document storage changes;
- spend outside approved limits.

## 8. Stop rule

No automatic follow-up implementation slice.

After this review is persisted, the resulting docs-only head must receive fresh exact-head CI/Vercel/thread/main gates before merge.

After merge, a future work cycle must reconstruct live state again before opening S6 or any other slice.
