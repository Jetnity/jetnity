# Provider Readiness Final Recheck – Current Gate Matrix

Stand: 1. September 2026  
Status: **CURRENT GATE TRUTH / NO GATE CROSSED**

Issue: #386  
Baseline: `main@a64fb13fb2a2078e95a41354cdbb9e88e37f4f18`

## 1. Current readiness layers

| Layer | State | Meaning |
| --- | --- | --- |
| S4 truth/activation foundation | **CLOSED** | no current S4 blocker |
| S5-A Commercial Provenance contract | **READY** | provider truth can be typed only with evidence |
| S5-B persistence | **PRODUCTION APPLIED / UNALLOCATED** | relation + writer contract exist, rows 0, no login writer |
| S6-A repository Cost Guard | **CLOSED** | migration + server adapter contract exist in repo |
| S6 Production Cost Guard | **BLOCKED / PO GATE** | migration/runtime/HMAC/>0 policy not activated |
| S7 Observability | **CLOSED** | payload-safe events + truthful health exist |
| S8 Cache/Persist/Attribution hook | **CLOSED** | fail-closed shared usage policy exists |
| first real vendor | **NOT SELECTED** | Product Owner decision required |
| real Commercial Truth row | **NONE** | Production row count 0 |
| real provider Production activation | **BLOCKED / PO GATE** | not authorized |

## 2. Product-Owner gates before first real provider

| Gate ID | Required decision/action | Current state |
| --- | --- | --- |
| PO-S6-01 | apply S6-A migration to Production | NOT APPROVED |
| PO-S6-02 | allocate Production runtime/login principal + capability | NOT APPROVED |
| PO-S6-03 | create/allocate HMAC secret | NOT APPROVED |
| PO-S6-04 | define first >0 provider cost policy/budget | NOT APPROVED |
| PO-S6-05 | bind and verify persistent reservation transport | NOT APPROVED |
| PO-PROV-01 | select first real provider/vendor | NOT DECIDED |
| PO-PROV-02 | vendor signup/account activation | NOT DONE |
| PO-PROV-03 | contract/ToS/commercial acceptance | NOT DONE |
| PO-PRIV-01 | DPA/subprocessor/data-transfer review | NOT DONE |
| PO-LIC-01 | cache/persist/redisplay/attribution terms verified | UNKNOWN |
| PO-SEC-01 | create/allocate live API secret | NOT DONE |
| PO-COST-01 | paid/live-call economics approved | NOT APPROVED |
| PO-ACT-01 | Production provider activation | NOT APPROVED |

No gate above is implied by completing repository S4/S6-A/S7/S8.

## 3. Technical gates after provider selection

A selected provider path must prove, on its own exact head:

1. adapter remains behind the existing domain port;
2. no new universal provider architecture;
3. request remains PII-minimized;
4. current shared Provider Ops kill switch applies;
5. persistent S6 reservation succeeds before every cost-bearing call;
6. S7 event emission contains only allowlisted operational metadata;
7. vendor-specific S8 usage policy is derived only from reviewed terms;
8. provider response is normalized fail-closed;
9. quote provenance/freshness/revalidation is mapped to S5-A;
10. client cannot mint or overwrite Provider Truth;
11. Commercial Provenance writer remains server-owned;
12. stale/expired/changed quotes cannot appear current;
13. timeouts/rate-limits/provider failure cannot create fake availability;
14. Production remains hard-off until a final Product-Owner activation gate.

## 4. Sandbox/test gate

Sandbox/testing can be useful for integration mechanics but has separate truth:

- no sandbox/test price may mint `live_api` unless the provider explicitly guarantees that environment supplies real live market truth and Jetnity separately reviews that guarantee;
- Duffel test mode is explicitly **not** real/live price truth;
- HBX evaluation environment is a technical test environment and is not automatically Production Commercial Truth;
- sandbox data must not silently become a persisted current quote;
- sandbox harness work is not a substitute for S6 Production readiness or live vendor legal/commercial review.

## 5. TW-8 / TW-9

Current state remains blocked.

A real provider integration is a prerequisite, not sufficient closure. TW-8 still needs the secure commercial Workspace read/adopt/freshness path after real Commercial Truth exists. TW-9 follows only after the corresponding journey-level product contract is ready.

## 6. What no longer blocks provider selection discussion

The following generic repository work should not be reopened without new evidence:

- S4 generic truth foundation;
- S6-A repository schema/adapter design;
- S7 generic observability contract;
- S8 generic cache/persistence/attribution hook;
- creating another UniversalProvider/UniversalOffer abstraction.

## 7. Next decision boundary

The next responsible Product-Owner decision package should combine two questions without conflating them:

### A. Which first live Flight provider should Jetnity pursue?

Current candidates:

- Duffel live;
- Skyscanner Flights Live Prices.

### B. Is the Product Owner willing to authorize the bounded Production S6 prerequisites necessary before any cost-bearing provider call?

Provider signup/contract and Production S6 can be planned together, but neither is silently authorized by this audit.

**NO REAL PROVIDER IS UNLOCKED BY THIS MATRIX.**
