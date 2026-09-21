# Jetnity – V1 Security Event Ingestion Architecture 1 STATUS

Stand: 21. September 2026  
Status: **R3/R4 SPECIFICATION CORRECTED / F1–F2/R1 PRESERVED / HEAD WILL BE FROZEN AFTER THIS COMMIT / NOT A TECHNICAL-LEAD PASS / DRAFT / NOT READY / NOT MERGED / FINDING 5.2 INGESTION OPEN / STOP FOR TECHNICAL-LEAD REVIEW**

Issue: #486  
Draft PR: #487  
Branch: `docs/v1-security-event-ingestion-architecture-1`  
Binding task + amendments §13–§15: `docs/V1_SECURITY_EVENT_INGESTION_ARCHITECTURE_1_TASK_2026-09-18.md`  
Decision: `docs/V1_SECURITY_EVENT_INGESTION_ARCHITECTURE_1_DECISION_2026-09-18.md`  
Current integration base / live `origin/main` at last fetch: `4a223d342e24fb9316f5ee4333914a16dca3b7bc`  
Reviewed R3/R4 head: `37abe3e15bd4fd3c37c741dc37ed500283384fb5` (review `5266535944`)

Cursor-Agent: **Jetnity V1 security event ingestion architecture 1**, Generation 1  
Session: `bc-5208e459-47c3-4d03-ba30-7ebb633c71bd`

This file is point-in-time evidence. Agent self-review is not Technical-Lead PASS. No prior PASS is claimed.

Final exact-head CI / Auth / Preview for **this** correction will be reported in a **PR comment** after they finish. **No further docs commit solely to record those checks.**

Finding 5.2 remains **OPEN**. Writer 1 is **withdrawn**. Producer Contract 1 is **not** implemented.

---

## 1. Goal

Correct only R3 (quota ↔ cleanup lifecycle) and R4 (row-level reserve-1 admission). Preserve F1/F2/R1.

## 2. Implemented

- **F1/F2/R1 preserved:** no actor-JWT INSERT; login/AAL1/denial/break-glass unobserved; in-scope mutations fail-closed.
- **R3:** `used` is currently retained tracked producer rows. Future cleanup decrements `used` in the same serialized lock/transaction as deletion. Rollback restores both. Legacy/privileged rows stay outside quota. Drift/missing quota disables persistent writes. Persistent activation stays closed until this coupling is implemented and tested. No invented N.
- **R4:** AFTER row-level trigger kept. Each qualifying row reserves **1**. A later over-cap RAISE rolls back the whole statement’s source rows, events and quota increments. No upfront statement-wide `n`. No statement-level collector.
- Follow-up remains **Mutation-Derived Producer Contract 1** (local disposable-database tests only). Not started.

## 3. Changed files versus current `origin/main`

Exactly the five #487 architecture documents.

## 4. Traveller-context check

Not relevant.

## 5. Hard exclusions held

No runtime writer, migration, RLS/grant, Auth/Supabase/Production mutation, service-role client, auth-log ingest, provider/secret/scheduler, Writer 1, Producer Contract 1, Ready or merge.

## 6. Local relation before this correction persist

| Gate | Result |
| --- | --- |
| Merge-base vs live `origin/main` | `4a223d342e24fb9316f5ee4333914a16dca3b7bc` |
| Predecessor reviewed head | `37abe3e1` — **11 ahead / 0 behind** |
| Scope | **5 architecture docs only** |
| PostgreSQL/RLS attack tests | **not run** — matrix is source reasoning |
| DB / Auth / Production calls | **none** |

## 7. Historical predecessor gates (invalidated by this correction)

`37abe3e1` had CI [`35592196285`](https://github.com/Jetnity/jetnity/actions/runs/35592196285) SUCCESS and Vercel `3sf7xkZSAuJcEE7cx5mNCu5QMF8g` READY. Those bindings do not apply to the new head.

## 8. Drift / threads

| | |
| --- | --- |
| Live `origin/main` at last fetch | `4a223d342e24fb9316f5ee4333914a16dca3b7bc` |
| Formal review | `5266535944` CHANGES REQUIRED on `37abe3e1` |
| Guardian event assessment | `5759414802` on `86540c7a` — historical; not an architecture PASS |
| Draft / Ready / merged | Draft; not Ready; not merged |

## 9. Residual risks

- Finding 5.2 still OPEN.
- `service_role` ALL and null-uid maintenance remain uncovered.
- Cleanup/`used` coupling is specified, not implemented.
- No PostgreSQL test of R3/R4 was run here.

## 10. Next step

Freeze this correction head. Report completed exact-head CI / Auth / Preview in a PR comment. Then **STOP FOR TECHNICAL-LEAD REVIEW**. The next gate after a clean frozen head is a **full independent Guardian adversarial architecture review**. No Ready. No merge. No Producer Contract 1.
