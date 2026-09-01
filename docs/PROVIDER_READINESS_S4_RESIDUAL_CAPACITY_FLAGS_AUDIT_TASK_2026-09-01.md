# Provider Readiness S4 – Residual Capacity / Activation-Flag Audit Task

Stand: 1. September 2026  
Status: **BINDING CURSOR AUDIT TASK / DOCS-ONLY / NO RUNTIME WRITES**  
Parent: Issue #365  
Baseline: `main@17ee633ea89567761297c8f07c023953ec98bbf2`

## 1. Objective

Independently determine whether two historical S4 residuals still require implementation after S4-R1 and before S6:

1. Readiness request capacity: `READINESS_GRENZEN.maxAnfrageBytes = 8192` versus the legitimate bounded multi-traveller / multi-citizenship / multi-document request contract.
2. Activation flags for Requirements / Safety / Seasonal while all current factories remain hard `null`.

This audit must distinguish **current V1 blocker**, **activation-time contract**, **already sufficient**, and **unknown / needs later provider contract**.

## 2. Multi-Agent ownership

This is **Agent B / docs-only auditor** of the parent MULTI_AGENT workstream.

Allowed changes:

- this task file;
- new versioned audit/evidence/recommendation/self-review/handoff docs owned by Agent B.

Forbidden changes:

- any `app/**` runtime file;
- any `lib/**` runtime/test file;
- any provider factory;
- any Safety/Readiness/Seasonal schema or domain constant;
- any `lib/provider-ops/*` shared contract;
- any Supabase migration/type/RLS/function;
- `docs/ACTIVE_WORK_STATUS.md`;
- `JETNITY_START_HERE.md`;
- Agent A task/status/handoff files.

If evidence suggests runtime change is needed, specify the smallest follow-up; do not implement it.

## 3. Required audit A – Readiness body-cap

Reconstruct the actual current request contract, not an imagined payload.

At minimum inspect:

- `READINESS_GRENZEN.maxAnfrageBytes`;
- `TRAVELLER_CONTEXT_GRENZEN`;
- `readinessAnforderungAnfrageSchema`;
- strict traveller/citizenship/document serialization used by real callers/tests;
- HTTP pre-allocation cap path;
- current UI/server call sites, if any;
- S4-R1 tests and historical S4 requirement.

Produce evidence for representative legitimate payload sizes, including:

- 1 traveller / simple credential set;
- family/group representative cases;
- multiple citizenships and multiple documents;
- a bounded near-upper-shape case consistent with the schema.

Do not claim the schema maximum is a product-recommended user count. The question is whether the HTTP cap contradicts the accepted contract or safely bounds it.

Classify:

- cap sufficient;
- cap too small for currently valid intended payloads;
- cap too large / privacy-risk;
- or request architecture should later move to server-owned trip/traveller truth instead of simply increasing bytes.

Prefer architectural reduction of untrusted payload where appropriate; do not recommend a larger cap by reflex.

## 4. Required audit B – Activation flags

Inspect current Requirements/Safety/Seasonal factories, request-state wrappers and S1 kill-switch conventions.

Determine whether missing flags are a **current** S4 blocker while factories are hard-null, or an **activation-time** requirement that must become mandatory before any factory can become non-null.

Required truth:

- a hard-null factory is already fail-closed;
- a flag that can never activate anything today may not improve current safety;
- but future adapter activation must not occur without an explicit operational kill switch if the architecture requires one.

Recommend the smallest contract location that prevents a future non-null factory from silently bypassing the flag requirement. Do not implement it.

## 5. Cross-check against Phase-1 strategy

Use:

- `docs/JETNITY_V1_BINDING_BUILD_ORDER_2026-09-01.md`;
- `docs/PROVIDER_READINESS_IMPLEMENTATION_SLICES.md` as historical evidence only;
- `docs/PROVIDER_ACTIVATION_READINESS_PRECHECK_NEXT_SLICE_2026-09-01.md`;
- S4-R1 status/handoff;
- current live code.

State whether S4 can close after Agent A S4-R2, or whether one additional bounded S4 implementation is required before S6.

## 6. Deliverables

Create:

- `docs/PROVIDER_READINESS_S4_RESIDUAL_CAPACITY_FLAGS_AUDIT_2026-09-01.md`
- `docs/PROVIDER_READINESS_S4_RESIDUAL_CAPACITY_FLAGS_RECOMMENDATION_2026-09-01.md`
- `docs/PROVIDER_READINESS_S4_RESIDUAL_CAPACITY_FLAGS_SELF_REVIEW_2026-09-01.md`
- `docs/PROVIDER_READINESS_S4_RESIDUAL_CAPACITY_FLAGS_HANDOFF_2026-09-01.md`

Every conclusion must identify evidence, inference, unknown, and deferred provider-contract facts separately.

## 7. Hard non-scope

No runtime/test implementation. No cap change. No flags. No provider adapter. No S6. No Production DB mutation. No secrets/keys/paid calls. No external provider activation. No TW-8/TW-9. No sensitive-data storage changes.

## 8. Stop rule

Do not Ready. Do not merge. Do not start a follow-up.

STOP after docs and self-review for independent Technical-Lead exact-head review.
