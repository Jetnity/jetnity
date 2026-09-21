# Jetnity – V1 Security Event Ingestion Architecture 1 STATUS

Stand: 21. September 2026  
Status: **R1/R2 SPECIFICATION CORRECTED / F1–F2 PRESERVED / HEAD WILL BE FROZEN AFTER THIS COMMIT / NOT A TECHNICAL-LEAD PASS / DRAFT / NOT READY / NOT MERGED / FINDING 5.2 INGESTION OPEN / STOP FOR TECHNICAL-LEAD REVIEW**

Issue: #486  
Draft PR: #487  
Branch: `docs/v1-security-event-ingestion-architecture-1`  
Binding task + amendments §13/§14: `docs/V1_SECURITY_EVENT_INGESTION_ARCHITECTURE_1_TASK_2026-09-18.md`  
Decision: `docs/V1_SECURITY_EVENT_INGESTION_ARCHITECTURE_1_DECISION_2026-09-18.md`  
Current integration base / live `origin/main` at last fetch: `4a223d342e24fb9316f5ee4333914a16dca3b7bc`  
Reviewed rejected F1–F3 head: `035486e021cf56c0ada4a3dc7ad1924cb1c01de4` (review `5265503350`)  
Reviewed R1/R2 head: `86540c7a702547fbe5825784dbd64063ef9622cd` (review `5265844197`)

Cursor-Agent: **Jetnity V1 security event ingestion architecture 1**, Generation 1  
Session: `bc-5208e459-47c3-4d03-ba30-7ebb633c71bd`

This file is point-in-time evidence. A new head invalidates older exact-head gates. Agent self-review is not Technical-Lead PASS. Integration preservation was **not** architectural acceptance. No prior PASS is claimed.

Final exact-head CI / Auth / Preview for **this** correction will be reported in a **PR comment** after they finish. This commit cannot contain its own SHA. **No further docs commit solely to record those checks.**

Finding 5.2 remains **OPEN**. Writer 1 is **withdrawn**. Mutation-derived producer is **not** implemented.

---

## 1. Goal

Correct only R1 (fail-closed delivery) and R2 (volume / admission / retention) in the five-file package. Preserve the F1/F2 mutation-derived replacement. Do not implement a writer.

## 2. Implemented

- **F1/F2 preserved:** no actor-JWT INSERT; role × AAL × grant table; login/AAL1/denial/break-glass unobserved.
- **R1:** In-scope operator+AAL2 mutations are **atomic fail-closed**. Source row and derived event commit together or both roll back. Payload/admission/trigger errors RAISE. Login/MFA stay unobserved. Privileged/no-actor paths stay uncovered. Row-level, zero-row, upsert, multi-row and outer-rollback behaviour specified. Availability tradeoff documented; not activated.
- **R2:** Payload/tracked-row volume, serialized quota admission, and time-bound retention are **separate**. COUNT-then-INSERT rejected. Missing/invalid cap disables the producer. A count cap is not retention and cannot open persistent activation. Next slice narrowed to local disposable-database contract tests. Quota object named as an extra future dependency.
- Follow-up renamed to **Mutation-Derived Producer Contract 1**. Previous Writer 1 remains withdrawn.

## 3. Changed files versus current `origin/main`

Exactly the five #487 architecture documents (task + DECISION/STATUS/HANDOFF/SELF_REVIEW).

## 4. Traveller-context check

Not relevant.

## 5. Hard exclusions held

No runtime writer, migration, RLS/grant, Auth/Supabase/Production mutation, service-role client, auth-log ingest, provider/secret/scheduler, Writer 1, Producer 1, Ready or merge.

## 6. Local relation before this correction persist

| Gate | Result |
| --- | --- |
| Merge-base vs live `origin/main` | `4a223d342e24fb9316f5ee4333914a16dca3b7bc` |
| Predecessor reviewed head | `86540c7a` — **10 ahead / 0 behind** |
| Scope | **5 architecture docs only** |
| PostgreSQL/RLS attack tests | **not run** — matrix is source reasoning |
| DB / Auth / Production calls | **none** |
| GitHub PR body update | historically refused for a non-agent-managed description; binding text is the five docs |

## 7. Historical predecessor gates (invalidated by this correction)

`86540c7a` had CI [`35589833774`](https://github.com/Jetnity/jetnity/actions/runs/35589833774) SUCCESS (Auth `106301470507`, Typecheck `106301470717`) and Vercel `dpl_EgnAycGVJQuwYZZr8bCBVVQ66QjG` READY. Those bindings do not apply to the new head. Do not add a second persist just to copy the new head’s later green checks into this file.

## 8. Drift / threads

| | |
| --- | --- |
| Live `origin/main` at last fetch | `4a223d342e24fb9316f5ee4333914a16dca3b7bc` |
| Formal reviews | `5265503350` on `035486e0`; `5265844197` CHANGES REQUIRED on `86540c7a` |
| Guardian event assessment | PO-forwarded CoS readback in comment `5759414802` — MATERIAL event assessment, **not** an architecture PASS |
| Draft / Ready / merged | Draft; not Ready; not merged |

## 9. Residual risks

- Finding 5.2 still OPEN. Almost all auth signals unobserved.
- Baseline `service_role` ALL and null-uid maintenance remain uncovered.
- Trigger DEFINER plus quota object are still privilege; implementation can get serialization wrong.
- Fail-closed will reject some otherwise-valid local blocklist writes after a later activation.
- Retention law remains undecided.

## 10. Next step

Freeze this correction head. Report completed exact-head CI / Auth / Preview in a PR comment. Then **STOP FOR TECHNICAL-LEAD REVIEW**. No Ready. No merge. No Writer 1. No Producer Contract 1. No follow-up slice.
