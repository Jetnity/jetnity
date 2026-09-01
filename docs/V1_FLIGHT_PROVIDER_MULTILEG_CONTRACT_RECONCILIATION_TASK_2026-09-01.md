# Jetnity V1 – Flight Provider Multi-Leg Contract Reconciliation Task

Stand: 1. September 2026  
Status: **ACTIVE TASK / SINGLE_AGENT / PROVIDER-NEUTRAL / NO EXTERNAL OR PRODUCTION GATE OPENED**

Issue: #402  
Baseline: `main@7d826d6c26ad4f38894f18858081a179622af4de`  
Branch: `feat/v1-flight-provider-multileg-contract`

## 1. Why this slice exists

Jetnity already has canonical product flight-search truth in `lib/flights/domain.ts`:

- ordered `FlugSuchanfrage.legs[]`;
- 1–6 legs;
- one-way, return and multi-city represented by the same ordered structure;
- ranking-only `context` explicitly does not change the provider result set.

The established runtime `FlugProvider` seam accepts this canonical `FlugSuchanfrage`, and the existing Duffel adapter maps every ordered leg into provider slices.

The later offline Skyscanner foundation added `lib/providers/flights/domain.ts` with a second provider-neutral `FlightProviderSearchRequest`, but that request currently represents only `originIata + destinationIata + departureDate + optional returnDate`.

Current provider due diligence has now established that serious metasearch candidates such as KAYAK and Wego support multi-city. The roundtrip-only secondary request shape is therefore a real integration risk and must be reconciled before a later real-provider transport is selected.

This is not permission to create a new generic provider framework. It is a bounded reconciliation of an already-existing contract seam with canonical Jetnity flight truth.

## 2. Objective

Make the newer provider-neutral Flight request contract unable to diverge from Jetnity's canonical ordered multi-leg search semantics.

Preferred design direction:

1. represent provider-request route input as an ordered legs collection rather than origin/destination plus optional return date;
2. use canonical Jetnity route/passenger/cabin/currency truth as the source, not an independently invented roundtrip model;
3. provide the smallest explicit mapping seam from a validated/canonical `FlugSuchanfrage` into the external-provider request shape when that reduces drift;
4. exclude ranking-only `context` from provider transport input;
5. keep `market` / `locale` only where they are external-provider request context rather than trip truth;
6. preserve existing fixture-only Skyscanner trust boundaries and existing runtime Duffel behavior.

The Cursor agent must first inspect the actual call sites and may choose a smaller equivalent implementation if it proves the same invariants with less duplication. Do not create speculative abstractions.

## 3. Binding invariants

### Route truth

- Leg order is semantic route order and must be preserved exactly.
- 1 leg = one-way.
- 2 legs may represent return or a two-leg multi-city route; no `returnDate` semantic shortcut may become a second route truth.
- 3–6 legs must remain representable.
- Use the existing canonical 1–6 limit; do not define a divergent provider limit unless a future selected provider requires an adapter-local stricter limit.
- Do not infer route continuity or rewrite/reorder legs.

### Request truth

- `FlugSuchanfrage` remains Jetnity product truth.
- Ranking-only `context` must not leak into provider requests merely because it exists on product truth.
- `stopPreference` may only be carried/mapped if the existing provider-neutral contract genuinely needs it; do not add fields speculatively.
- Passenger, cabin and currency semantics must remain aligned with existing Jetnity truth.
- `market` and `locale` are request/external-market context, not traveller citizenship/residence truth.

### Provider neutrality

- No KAYAK-specific, Wego-specific, Skyscanner-specific or Duffel-specific request semantics in the shared contract.
- No default/preferred provider.
- No provider registry expansion.
- No speculative multi-provider fan-out/aggregation orchestration in this slice.

### Trust/commercial boundary

- Skyscanner fixture output remains `evidenceMode: 'fixture'` and structurally unable to mint `live_api` Commercial Truth.
- No trusted/live constructor.
- No Commercial Provenance writer or persistence change.
- No affiliate truth invention.
- No freshness/availability invention.

## 4. Hard non-scope

Do **not** perform any of the following:

- select KAYAK, Wego, Skyscanner, Duffel or another provider;
- submit/contact/register/apply with any provider;
- accept provider terms/DPA/contract;
- create/store an API key or secret;
- make network, sandbox, paid or live provider calls;
- apply Production S6 or allocate runtime/HMAC/budget;
- allocate Commercial Provenance Production writer or write rows;
- change Supabase/DB/RLS/Auth;
- implement TW-8/TW-9;
- implement Destination Essentials / PR #394;
- change public launch/indexing/payment/native-app behavior;
- build a second generic provider transport framework.

Product-Owner provider gates remain **UNAPPROVED**.

## 5. Expected implementation surface

Keep this as small as the evidence allows. Expected candidates are:

- `lib/providers/flights/domain.ts`;
- a small provider-neutral request mapper/helper only if needed to prevent semantic drift;
- focused unit tests for that contract/mapping;
- minimal architecture/decision/task/handoff documentation required by Jetnity continuity.

Do not modify existing Duffel runtime code unless a real compile/test dependency proves it necessary. Do not touch Skyscanner response normalization semantics unless required solely to keep existing tests/types valid.

## 6. Required deterministic tests

At minimum prove:

1. one-way maps as one ordered leg;
2. two ordered legs remain two explicit legs rather than being collapsed into an implicit return-date model;
3. three-or-more leg multi-city order is preserved exactly;
4. canonical maximum of six legs is representable through the validated/canonical path;
5. ranking-only `context` is absent from the provider request shape;
6. passenger/cabin/currency values are preserved correctly;
7. existing Skyscanner fixture/non-promotable tests remain green;
8. existing Duffel/core flight tests remain green.

If a new runtime validator is not needed because the source request is already canonically validated, do not add a redundant validator just to satisfy the test list. Test the actual boundary that owns validation.

## 7. Gates

Agent must run and record on the exact final head:

- focused new contract tests;
- relevant `lib/flights/*` tests;
- Skyscanner adapter tests;
- full test suite;
- typecheck;
- lint;
- production build;
- changed-file / non-scope review.

GitHub Actions, Vercel and final main-drift/review-thread checks belong to the independent Technical Lead after the agent stops.

## 8. Multi-Agent decision

**SINGLE_AGENT**.

Reason: one central shared Flight contract seam plus direct tests. Parallel implementation writers would collide on the same truth boundary and make semantic review harder.

## 9. Agent governance

Cursor agent:

- implement only this task;
- keep the PR Draft;
- do not mark Ready;
- do not merge;
- do not start a follow-up slice;
- self-review and run required local gates;
- persist an exact-head handoff;
- stop for independent ChatGPT Technical-Lead review.

Any Technical-Lead `CHANGES REQUIRED` must be fixed in the same logical Cursor session/generation before a fresh exact-head re-gate.

**RECONCILE, DO NOT DUPLICATE. PROVIDER-NEUTRAL. NO EXTERNAL ACTION. NO PRODUCTION GATE.**
