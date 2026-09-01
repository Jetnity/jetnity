# Jetnity – Provider Readiness Final Recheck

Stand: 1. September 2026  
Status: **AUDIT / PHASE 1 / REPOSITORY FOUNDATIONS READY / REAL PROVIDER STILL GATED / NO PROVIDER ACTIVATION / NO PRODUCTION MUTATION**

Issue: #386  
Baseline: `main@a64fb13fb2a2078e95a41354cdbb9e88e37f4f18`

## 1. Executive verdict

The historical Provider Activation Readiness Precheck was directionally correct, but its Jetnity-side gap list is now stale.

Current live truth:

- S4: **CLOSED**;
- S5-A Commercial Provenance contract: **INTEGRATED**;
- S5-B Commercial Provenance persistence: **APPLIED TO PRODUCTION**, RLS enabled, row count **0**, no login writer allocated;
- S6-A Persistent Cost Guard repository foundation: **CLOSED**;
- S6 Production apply/runtime allocation/HMAC/>0 policy: **UNAPPLIED / HARD-OFF / PRODUCT-OWNER GATED**;
- S7 Observability: **CLOSED**;
- S8 Cache/Persistence/Attribution usage-policy hook: **CLOSED**;
- no real provider active;
- no current Commercial Truth row exists;
- current Flight Production path is hard-off independently of credential presence.

### Binding conclusion

> **Stop building generic Provider Readiness foundations.**

The next blockers are no longer missing shared abstractions. They are controlled Production activation and vendor-specific commercial/legal truth.

## 2. Supersession of stale historical statements

The following old statements must no longer be used as current truth:

| Historical statement | Current truth |
| --- | --- |
| residual S4 open | **superseded** — S4 CLOSED |
| S6 persistent cost guard missing | **superseded at repository level** — S6-A foundation CLOSED; Production S6 remains UNAPPLIED |
| S7 observability missing | **superseded** — S7 CLOSED |
| S8 license/cache hooks missing | **superseded** — S8 CLOSED |
| Observability `missing` in old Provider Readiness Matrix | **historical only** — shared S7 contract and runtime emission are integrated |
| Cache/licence hooks `missing` in old Provider Readiness Matrix | **historical only** — shared S8 fail-closed policy hook is integrated; vendor-specific rights remain unknown until contract review |
| first provider may proceed after generic readiness code | **incomplete** — Production S6 + vendor/contract/secret/live-call gates still block real use |

Historical documents remain valid evidence of their time and should not be rewritten destructively.

## 3. Repository readiness vs Production readiness

### Repository readiness

For the first real Commercial Truth provider path, the shared Jetnity foundations are now sufficiently complete to move from generic readiness work to a vendor-specific integration decision:

- fail-closed Provider Ops state/kill-switch;
- request/failure contracts;
- Commercial Provenance truth contract and persistence foundation;
- persistent Cost Guard repository contract;
- payload-safe observability and health derivation;
- fail-closed cache/persistence/attribution policy hook;
- provider-neutral domain ports;
- hard Traveller/Multi-Citizenship/Multi-Document truth boundaries.

This does **not** mean Production is ready to call a provider.

### Production readiness

Still blocked:

1. S6-A migration not applied to Production;
2. no Production Cost Guard runtime/login principal;
3. no HMAC secret allocated for persistent caller pseudonymization;
4. no >0 live provider budget/policy;
5. no persistent Cost Guard runtime transport binding;
6. no live provider secret/API credential;
7. no provider-specific S8 verified usage policy;
8. no real provider activation flag/path;
9. no Commercial Provenance row writer login allocated.

## 4. Commercial Provenance Production truth

Read-only Production audit on Supabase project `qscbgcdmivbbnzrcyegn` verified:

- `public.trip_item_commercial_provenance` exists;
- RLS enabled;
- migration `20260829140000_trip_item_commercial_provenance` applied;
- row count = **0**;
- `authenticated` has SELECT only;
- internal function `jetnity_internal.trip_item_commercial_provenance_schreiben(jsonb)` exists;
- EXECUTE is limited to `postgres` and `jetnity_commercial_writer`;
- `jetnity_commercial_writer` and `jetnity_commercial_runtime` are NOLOGIN roles;
- `jetnity_commercial_runtime` is a member of `jetnity_commercial_writer` but no real login principal is allocated.

Therefore the persistence foundation exists, but no real app/provider writer path is active.

## 5. Production S6 truth

Read-only Production audit verified that all S6-A Production objects remain absent:

- `jetnity_internal.provider_cost_guard_runtime_gate`;
- `jetnity_internal.provider_cost_guard_policy`;
- `jetnity_internal.provider_cost_guard_reservation`;
- `jetnity_internal.provider_cost_guard_reservieren(jsonb)`;
- role `jetnity_provider_cost_guard_writer`.

Migration `20260901020000_provider_cost_guard_s6a` is not present in Production migration history.

Therefore:

> **S6-A repository foundation CLOSED != Production Cost Guard active.**

## 6. First Commercial Truth domain

Preferred first domain remains **Flights**.

Reason:

- highest Phase-1 traveller leverage;
- hardest/most valuable freshness lesson;
- existing provider-neutral Flight port and Nachweis mechanics;
- no citizenship/passport/document data is required for search;
- strong direct connection to TW-8 Commercial Workspace closure;
- stale-price failure is high-impact and therefore a good first proof of Jetnity's truth architecture.

This audit does **not** select the live vendor.

## 7. Current vendor posture

Current official-source recheck supports this ordering:

1. **Flights – live vendor decision:** Duffel live vs Skyscanner Live Prices remains open pending partner/licence/cost/DPA review.
2. **Hotels – later:** Booking.com Demand API if Managed Affiliate access is available; HBX remains technical fallback/evaluation candidate.
3. **Activities – later:** Viator remains viable but not first Commercial Truth domain.

Hard truth:

- Duffel test mode is sandbox mechanics only; its prices are not real/live and must never mint `live_api` Commercial Truth.
- Skyscanner Live Prices provides current partner prices and a Refresh Prices flow, but partner/licence/cache/redisplay terms must be reviewed before persistence or display policy is set.
- Booking.com Demand API sandbox/testing itself requires Managed Affiliate access and credentials.
- HBX evaluation remains bounded and is not automatically Production Commercial Truth.

## 8. Exact remaining blockers before a real provider

### Jetnity Production blockers

- Product-Owner approval for S6 Production migration apply;
- runtime/login principal allocation and capability membership;
- HMAC secret creation/allocation;
- bounded >0 live provider cost policy;
- persistent Cost Guard runtime binding and verification.

### Vendor blockers

- Product-Owner provider selection;
- vendor signup/account activation where required;
- contract/ToS/commercial terms;
- DPA/subprocessor/data-transfer review;
- cache/persistence/redisplay/attribution licence truth;
- API key/live secret allocation;
- rate limits and real cost model;
- paid/live-call approval.

### Provider-path validation blockers

- exact adapter implementation or live-mode hardening behind existing domain port;
- S8 policy populated only from reviewed vendor terms;
- S7 observability validated for the real adapter path;
- S6 persistent reservation required before provider call;
- real quote mapped to S5-A Commercial Provenance without client trust;
- stale/revalidation behavior tested;
- no PII/document leakage;
- Production provider activation remains a separate final gate.

## 9. Next smallest safe Phase-1 step

No further generic runtime slice is justified before a Product-Owner decision.

The next smallest responsible step is a **Product-Owner provider activation decision package**, not provider activation itself. It should present:

1. recommended first domain: Flights;
2. live vendor comparison: Duffel live vs Skyscanner Live Prices;
3. expected cost/rate-limit model;
4. contract/DPA/licence/cache/attribution questions;
5. exact S6 Production changes required;
6. minimum PII-free request shape;
7. bounded rollout: Preview/dev proof -> real quote verification -> Production activation only after separate PASS.

After the Product Owner selects and approves the required gates, the first vendor-specific implementation can be versioned independently.

## 10. Multi-Agent suitability

**SINGLE_AGENT / Technical-Lead direct** for this recheck.

Repository, Production and vendor evidence are separate inputs but converge on one gate matrix. There is no safe or useful parallel implementation work because this task performs no runtime changes.

A later selected provider adapter may be delegated to a narrowly scoped Cursor agent while Product-Owner-gated Production/security changes remain Technical-Lead controlled.

## 11. Explicit non-actions

This recheck performed no:

- Production DB/RLS/grant/role/function mutation;
- runtime/login principal allocation;
- secret/API-key creation/read/rotation;
- provider signup or contract acceptance;
- >0 live budget;
- paid/live provider call;
- provider activation;
- Commercial Provenance write;
- TW-8/TW-9 implementation;
- Auth/MFA/AAL/payment/public-launch action.

**LIVE-EVIDENCE WINS. GENERIC PROVIDER READINESS FOUNDATION IS SUFFICIENT. REAL PROVIDER REMAINS PRODUCT-OWNER GATED.**
