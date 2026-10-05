# Provider Readiness S6 – Persistent Cost Guard Live Precheck

Stand: 1. September 2026  
Status: **TECHNICAL-LEAD PRECHECK / READ-ONLY PRODUCTION EVIDENCE / NO S6 IMPLEMENTATION / NO DB MUTATION / PO GATE IDENTIFIED**

## 1. Canonical baseline

Current canonical main at precheck start:

`3d018499da3aae61667079a7ee689d4c5e8ed1bc`

Commit:

`Close Provider Readiness S4 continuity (#373)`

S4 is closed and post-merge verified:

- Main CI #1589 / Run `33459494959`: **SUCCESS** on exact canonical main;
- Vercel Production `dpl_CTNS8PjSVihthBUvnkNhH3VVgfcn`: **READY** on exact canonical main;
- Issue #365: **CLOSED / COMPLETED**.

No open S6 issue/PR matching the current work was found at reconstruction time.

## 2. Binding S6 contract

`docs/PROVIDER_READINESS_IMPLEMENTATION_SLICES.md` defines S6 as:

> **Global wirksames Budget vor jedem bezahlten Provider.**

Required characteristics:

- persistent window/day limits;
- per domain plus optional global ceiling;
- no secret in client;
- no travel content in the counter;
- Preview may remain in-memory until a paid key exists;
- no provider purchase/activation;
- no Production flags true;
- DB migration and cost model are explicit Product-Owner gates;
- S6 is serial because schema/RLS/privileged execution are shared truth.

## 3. Repository evidence

### 3.1 Existing S1 seam is reusable

`lib/provider-ops/cost-guard.ts` already provides an async `ProviderOpsCostGuard` contract. This was intentionally shaped so S6 can add I/O without rewriting every domain wrapper.

Current implementation is `providerOpsInMemoryCostGuard()`:

- process-local `Map`;
- per-key window/day counts;
- fail-closed for empty keys/internal errors;
- **not Vercel-global / not Production-global**.

Flights, Hotels, Activities, Mobility, Rental Cars, Readiness and Safety domain rate-limit modules instantiate the in-memory guard directly.

### 3.2 Current domain guard is an abuse/rate limit, not a global provider budget

Example Flights:

- per identifier/IP key;
- 8 searches per 10-minute window;
- 24 searches per day;
- process-local storage.

Replacing only the `Map` with a persistent key-value store would make the per-identifier limit cross-instance, but would still **not** satisfy S6's global spend/activation gate.

A real S6 reservation must atomically account for all applicable buckets in one trusted transaction:

1. caller/identifier bucket where applicable;
2. provider domain bucket;
3. global provider budget bucket.

Checking these independently is insufficient because concurrent requests can pass separate checks and overshoot a shared budget.

### 3.3 `leeren()` is test-reset behavior, not a Production capability

The S1 interface exposes `leeren()` for deterministic in-memory tests and domain test helpers. A persistent S6 runtime must **not** introduce a remotely callable global reset/delete path merely to preserve this test helper. Production counters must not be clearable through the application request path.

## 4. Production Supabase read-only evidence

Project checked read-only:

`qscbgcdmivbbnzrcyegn`

Fresh Production inventory found:

- **no** provider-cost/provider-budget/provider-quota/provider-usage relation;
- **no** provider-cost/provider-budget/provider-quota RPC/function;
- `public.model_usage` exists;
- `public.modell_kontingent_beanspruchen(...)` exists;
- `public.model_usage` currently has **0 rows** and total recorded/reserved cost **0**;
- `jetnity_internal` schema exists.

Repository `supabase/config.toml` exposes only:

- `public`
- `graphql_public`

`jetnity_internal` is not in the Data API exposed schema list.

No Production mutation occurred in this precheck.

## 5. What may be reused from model usage – and what may not

`lib/modell/kontingent.ts` and its DB migration are a valid **conceptual pattern** for:

- reserve before a paid call;
- fail closed when accounting cannot be performed;
- serialize the check + reservation transactionally;
- count the worst case rather than optimistically undercounting;
- keep the browser away from privileged cost accounting.

They must **not** be reused as the provider table or copied verbatim:

- model usage has LLM-specific fields (`funktion`, `modell`, token counts, model pricing);
- provider cost truth is a separate domain and must not be mixed with model truth;
- current model SQL still contains legacy `auth.role()` defense-in-depth logic;
- S6 must follow current Supabase security guidance rather than freeze an older implementation pattern.

## 6. Current Supabase security implications

Fresh official Supabase guidance checked on 1 September 2026:

- `auth.role()` is deprecated for RLS-style role checks;
- database functions default to broad EXECUTE unless explicitly revoked;
- `SECURITY DEFINER` should be exceptional, have a fixed/empty `search_path`, and use fully qualified object names;
- secret/service-role-class keys bypass RLS and therefore have large blast radius;
- legacy `service_role` API keys are being replaced by backend `sb_secret_...` keys.

Therefore S6 must not casually expand broad `service_role` use or place an unrestricted privileged function in an exposed schema.

## 7. Recommended S6 architecture boundary

### 7.1 S6-A – repository foundation (recommended next implementation after PO approval)

A bounded repository implementation should prepare, but **not Production-apply**, the persistent guard:

- a dedicated provider-cost persistence model, separate from `model_usage`;
- no travel request/route/traveller content;
- only bounded operational identifiers/domain/bucket/time/reservation data needed for cost control;
- atomic reservation across identifier + domain + global ceilings;
- fail closed on DB/internal failure;
- no remote reset path;
- default/hard-off state must not authorize paid calls;
- server-only adapter implementing the existing async S1 guard boundary, or the smallest strictly necessary S1-compatible extension;
- current in-memory path remains available for Preview/test while no paid provider key is active;
- tests must prove concurrency/atomicity semantics at the contract level and prove that missing persistent accounting never falls back open.

### 7.2 S6-B – Production activation (later explicit PO gate)

Keep separate:

- Production migration apply;
- Production role/RLS/grant/function mutation;
- runtime writer/principal allocation;
- new Supabase secret/principal creation or key migration;
- enabling persistent provider cost guard in Production;
- setting any real >0 paid-provider budget;
- provider key/contract/live call.

S6-B must not be inferred from S6-A approval.

## 8. Cost-model rule

Do **not** invent vendor prices or live monetary budgets before a real vendor contract.

Safe repository default:

- disabled / hard-off / zero-authorized paid-provider capacity;
- schema/contract capable of domain + global ceilings;
- no real monetary value claimed until a Product-Owner-approved provider/cost model exists.

If count-based safety ceilings are represented before vendor selection, they are operational caps, not claims about vendor money cost.

## 9. Multi-Agent Suitability Check

### Precheck

**SINGLE_AGENT / Technical-Lead-owned.**

Reason: this precheck combines one shared S6 contract with live Production DB evidence. Parallel writers provide no safe speedup and risk conflicting architecture conclusions.

### Recommended S6-A implementation

**SINGLE_AGENT.**

Reason:

- one shared persistence schema/function contract;
- one shared `ProviderOpsCostGuard` boundary;
- multiple domain wrappers depend on the same semantics;
- privileged DB/security design must remain coherent;
- historical S6 contract explicitly marks it serial.

Independent QA/security review remains mandatory after the implementation agent, but must not be a parallel runtime/schema writer.

## 10. Product-Owner gate reached

The repository's binding S6 specification explicitly says:

> **DB-Migration und Kostenmodell sind eigene Product-Owner-Gates.**

Therefore autonomous Technical-Lead work may continue through this precheck, evidence gathering and bounded design, but must not create the schema-changing S6 implementation until the Product Owner explicitly approves that gate.

Recommended approval scope:

> Approve **S6-A repository-only Persistent Cost Guard foundation**, including a versioned migration/cost-policy schema with fail-closed/hard-off defaults and tests, but **no Production apply, no Production role/principal allocation, no secret/key creation, no >0 live budget and no provider activation**.

After that approval, create a new versioned S6-A issue/branch/task from then-current main and dispatch one implementation agent.

## 11. Hard stop

Until explicit Product-Owner approval for S6-A DB-migration/cost-model work:

- no S6 schema-changing migration file;
- no Production mutation;
- no writer/principal allocation;
- no Supabase secret/key creation/read;
- no paid/live provider call;
- no provider activation;
- no S7 start that bypasses the binding serial S6 step.

**S4 CLOSED. S6 PRECHECK COMPLETE. S6-A RECOMMENDED, BUT DB-MIGRATION/COST-MODEL GATE REQUIRES EXPLICIT PRODUCT-OWNER APPROVAL.**
