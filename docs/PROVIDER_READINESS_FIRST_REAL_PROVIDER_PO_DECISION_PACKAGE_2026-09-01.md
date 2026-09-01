# Jetnity – First Real Provider Product-Owner Decision Package

Stand: 1. September 2026  
Status: **DECISION PACKAGE ONLY / NOTHING APPROVED BY THIS DOCUMENT / NO PROVIDER ACTIVATION**

Related: Issue #386

## 1. Why a Product-Owner decision is now required

Generic Provider Readiness repository foundations are sufficiently complete. The next meaningful progress crosses explicit Product-Owner gates.

A broad approval such as “start providers” is not acceptable because it would conflate commercial, security, Production and spend decisions.

This package separates the decisions.

## 2. Decision A — first provider commercial diligence

### Technical-Lead recommendation

Authorize **Skyscanner Flights Live Prices commercial/technical due diligence first**, with Duffel live retained as fallback/second comparison.

What “due diligence” would authorize:

- initiating/continuing partner eligibility discussions or signup flow as needed;
- obtaining non-secret commercial/access information;
- reviewing contract/ToS/DPA/subprocessors;
- confirming API access eligibility, quotas and pricing/commission model;
- confirming cache/persistence/redisplay/attribution rules for Jetnity;
- confirming allowed deeplink/tracking behavior;
- confirming whether Jetnity's Switzerland-first use case is supported.

What it would **not** authorize:

- accepting a binding contract without the Product Owner seeing/approving material commercial terms if acceptance is irreversible or materially consequential;
- creating/storing a live API secret;
- paid/live API calls;
- Production activation;
- Production DB/security mutation;
- Commercial Provenance writes.

### Why Skyscanner first

- aggregator/deeplink model matches Jetnity's current product mandate;
- Impact affiliate tracking and commission-sharing are documented;
- Live Prices + Refresh Prices align with Commercial Provenance and freshness truth;
- current API exposes booking deeplinks rather than requiring Jetnity to become the booking merchant;
- self-transfer/mash-up metadata can feed Jetnity's route/risk intelligence.

### Fallback

If Skyscanner access, contract, licensing or economics are unsuitable, evaluate **Duffel live** next.

Duffel remains technically attractive because of explicit offer expiry/revalidation and existing Jetnity adapter work, but its search-to-order commercial model may be less aligned with an aggregator-first V1.

## 3. Decision B — Production S6 preparation

A real cost-bearing provider call must not occur without the persistent Cost Guard.

Separate Product-Owner approval is required before any of these Production changes:

1. apply `20260901020000_provider_cost_guard_s6a.sql` to Production;
2. allocate the narrowly scoped Production runtime/login principal;
3. grant only the intended capability membership;
4. create/allocate the HMAC secret used for caller pseudonymization;
5. configure a bounded initial >0 provider cost policy/budget;
6. bind server runtime to `provider_cost_guard_reservieren(jsonb)`;
7. verify fail-closed behavior in Production before any real provider call.

### Recommended sequencing

Do **not** apply Production S6 merely because the code exists.

Recommended:

1. complete enough Skyscanner commercial diligence to know likely quota/economics and whether the provider is viable;
2. define the exact initial cost policy from those facts;
3. then request Product-Owner approval for the bounded S6 Production apply/allocation package;
4. provider live secret and paid-call gate remain separate until the adapter path is reviewed.

This avoids activating Production infrastructure for a vendor that may fail commercial diligence.

## 4. Decision C — live secret / first real call

Only after A and B are sufficiently resolved:

Separate approval is required for:

- creating/allocating the chosen provider's live secret/API key;
- making the first real/live provider call;
- any vendor cost exposure;
- any Production provider flag/activation.

Recommended first real call should be:

- PII-minimized;
- non-booking;
- one bounded known route/date query;
- cost-guarded before transport;
- S7-observed without payload logging;
- no persistence unless vendor licence has been explicitly reviewed and S8 policy permits it;
- compared against provider response/freshness/revalidation contract;
- not public-facing until exact-head and runtime review passes.

## 5. Decision D — Commercial Provenance writer allocation

Even after a real quote can be retrieved, do not automatically allocate a Production writer.

Separate approval is required before a real runtime principal can execute:

`jetnity_internal.trip_item_commercial_provenance_schreiben(jsonb)`

Recommended sequence:

1. prove live retrieval and revalidation ephemerally;
2. verify vendor persistence/licence terms;
3. verify S8 provider-specific usage policy;
4. only then request writer allocation/persistence gate if V1 needs stored quote snapshots.

This keeps “can call provider” separate from “may persist provider truth”.

## 6. Minimal future provider implementation scope after approval

If Skyscanner diligence succeeds, the first implementation slice should be narrowly bounded to Flights:

- Skyscanner server adapter behind existing `FlugProvider` port;
- no UniversalProvider;
- no hotel/activity edits;
- PII-minimized request mapping;
- create/poll orchestration;
- refresh/revalidation seam;
- booking deeplink normalized server-side and treated as provider/affiliate truth, not client truth;
- S6 persistent cost reservation before calls;
- S7 events;
- S8 reviewed usage policy;
- S5-A Commercial Provenance mapping;
- deterministic fixtures/tests plus bounded integration test only after secret/live-call approval;
- Production remains hard-off until separate activation approval.

## 7. Approval wording should be explicit

A future Product-Owner approval should state exactly which decision is approved, for example:

- `A APPROVED: Skyscanner due diligence only.`
- `B APPROVED: bounded Production S6 preparation/apply/allocation under reviewed plan.`
- `C APPROVED: live provider secret + first bounded real call under stated budget.`
- `D APPROVED: Commercial Provenance runtime writer allocation/persistence.`

Approving one does not approve the others.

## 8. Current recommendation

**Next Product-Owner decision requested after this audit closes: A only — Skyscanner due diligence first.**

Production S6 (B) should be planned in parallel at documentation level but applied only after vendor viability/economics are sufficiently known.

**NO DECISION IS GRANTED BY THIS DOCUMENT.**
