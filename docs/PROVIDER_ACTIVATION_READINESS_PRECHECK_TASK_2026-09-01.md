# Jetnity – Provider Activation Readiness Precheck

Stand: 1. September 2026  
Status: **BINDING AUDIT TASK / NO PROVIDER ACTIVATION / NO SECRETS / NO PAID CALLS / NO PRODUCTION WRITES**

Issue: #351  
Branch: `audit/provider-activation-readiness-precheck-2026-09-01`  
Baseline: `main@ebd08ec07134f1ad4d3f6d68a694be4ff189fa5b`  
Logical Cursor agent: **`Jetnity provider activation readiness precheck 1`**  
Generation: **1**

## 1. Objective

Determine the safest, highest-value **first real provider path** for Jetnity and define the smallest bounded implementation slice that could later prove one real server-side provider-backed snapshot.

This task is an **audit/precheck only**. It must not activate a provider or cross Product-Owner gates.

## 2. First action – reconstruct live truth

Before recommending anything, reconstruct and document current truth from:

- live `main` and exact SHA;
- open PRs/issues and competing workstreams;
- `JETNITY_START_HERE.md`;
- `docs/ACTIVE_WORK_STATUS.md`;
- `docs/JETNITY_BINDING_BUILD_ORDER.md`;
- `docs/PROVIDER_READINESS_IMPLEMENTATION_SLICES.md` and current provider-readiness evidence;
- latest Entry Requirements continuity including E5-B3C;
- latest TW-8/TW-9 readiness evidence;
- relevant Account/Traveller/Multi-Citizenship dependencies;
- current CI and Vercel state;
- relevant Supabase Production state **read-only only**.

Live evidence wins over historical plans and old Draft PRs.

## 3. Existing architecture audit

Map what already exists and must be reused before proposing new abstractions, including as applicable:

- provider-neutral interfaces and factories;
- Flight/Hotel/Activity/Mobility/Rental domain boundaries;
- `FlugNachweis` and other server-side evidence contracts;
- Commercial Provenance S5-A/S5-B contracts;
- cost-guard hooks;
- provider operations failure/timeout/kill-switch contracts;
- observability hooks;
- licensing/cache/persist hooks;
- Trip Workspace Commercial Truth seams;
- Entry Requirements provider boundaries;
- server-only / client-trust boundaries.

Explicitly identify dead stubs, historical-only contracts, duplicates and missing integration seams.

## 4. Candidate comparison

Do **not** assume an existing code reference means a provider is selected.

Using current official/public vendor evidence where available, compare realistic candidates for Jetnity's first real provider path. The comparison may include multiple domains if necessary to decide the highest-leverage first path.

At minimum evaluate:

1. traveller value and product unlock;
2. fit with current Jetnity architecture and amount of reusable code;
3. ability to produce one server-side verified quote/availability snapshot;
4. provenance/freshness semantics and revalidation ability;
5. sandbox/test environment quality;
6. API maturity and operational reliability;
7. rate limits and failure behavior;
8. pricing / expected call or platform costs;
9. affiliate / commission / commercial model where publicly knowable;
10. storage, caching, attribution and licensing restrictions;
11. privacy, DPA, subprocessors and data-residency implications where publicly knowable;
12. secret management and Production activation requirements;
13. observability, kill-switch and cost-control requirements;
14. vendor lock-in risk and provider-neutral abstraction quality;
15. effect on TW-8/TW-9 unlock;
16. effect on Entry Requirements / Traveller truth;
17. Switzerland-first suitability and later international scalability.

Separate **verified fact**, **inference**, **unknown**, and **requires vendor confirmation**.

## 5. Recommendation

Produce a ranked recommendation with:

- preferred first provider path;
- runner-up(s);
- explicit reasons;
- architectural advantages/disadvantages;
- commercial/security/privacy concerns;
- disqualifiers;
- unknowns that must be answered before activation;
- whether the first path should be Flights, Hotels, Activities, Mobility/Rental or another already-planned provider domain.

Do not recommend a provider merely because Jetnity already contains adapter-shaped code for it.

## 6. Smallest safe next implementation slice

Define **one** smallest follow-up slice that can later be authorized to prove real provider-backed truth.

It must be bounded around a single real server-side snapshot and must specify:

- exact input and server-side identity/trust boundary;
- provider call boundary;
- normalized output contract;
- provenance/freshness fields;
- commercial persistence boundary;
- write-authority requirements;
- cost guard;
- timeout/retry/kill switch;
- observability without sensitive payloads;
- cache/license/persist policy;
- test strategy including tampering and stale/unavailable cases;
- exact Product-Owner gates that must be approved first;
- explicit non-scope.

Do not start that implementation slice in this task.

## 7. Hard non-scope

Absolutely no:

- provider signup/registration or contract acceptance;
- API key, token or secret creation/read;
- live or paid provider call;
- Production provider activation or flag change;
- Supabase Production mutation;
- migration/RLS/grant/role/function change;
- runtime/login principal allocation;
- real application writer/backfill;
- TW-8/TW-9 runtime implementation;
- real provider adapter implementation;
- public provider/live-product claim;
- fundamental Auth/MFA/AAL or Traveller-model change;
- sensitive passport/MRZ/scan/biometric/health storage;
- Ready or merge by Cursor;
- automatic follow-up slice.

## 8. Required deliverables

Create versioned documentation on this branch for at least:

- `PROVIDER_ACTIVATION_READINESS_PRECHECK_EVIDENCE_2026-09-01.md`;
- `PROVIDER_ACTIVATION_READINESS_PRECHECK_REUSE_MAP_2026-09-01.md`;
- `PROVIDER_ACTIVATION_READINESS_PRECHECK_CANDIDATE_MATRIX_2026-09-01.md`;
- `PROVIDER_ACTIVATION_READINESS_PRECHECK_GATE_MATRIX_2026-09-01.md`;
- `PROVIDER_ACTIVATION_READINESS_PRECHECK_RECOMMENDATION_2026-09-01.md`;
- `PROVIDER_ACTIVATION_READINESS_PRECHECK_NEXT_SLICE_2026-09-01.md`;
- `PROVIDER_ACTIVATION_READINESS_PRECHECK_STATUS_2026-09-01.md`;
- `PROVIDER_ACTIVATION_READINESS_PRECHECK_SELF_REVIEW_2026-09-01.md`;
- `PROVIDER_ACTIVATION_READINESS_PRECHECK_HANDOFF_2026-09-01.md`.

If a proposed fact cannot be verified, record it as unknown instead of filling the gap with assumption.

Cursor must **not** edit Technical-Lead-owned:

- `docs/ACTIVE_WORK_STATUS.md`;
- `JETNITY_START_HERE.md`.

## 9. Quality / self-review

Before stopping, adversarially test the recommendation:

- Are we mistaking persisted data for provider truth?
- Are we favoring a provider only because code already exists?
- Are we underestimating cost, licensing or DPA constraints?
- Would the suggested slice create client-trusted price/provenance?
- Would it silently unlock TW-8 without real Commercial Truth?
- Is there a smaller safe proof slice?
- Is any Product-Owner gate being crossed implicitly?
- Does the choice make Jetnity more distinctive and useful, not merely bigger?

## 10. Stop condition

Stop after committing the audit deliverables and updating the Draft PR.

No Ready. No merge. No provider activation. No follow-up implementation.

Final state must be ready for independent Technical-Lead exact-head review.
