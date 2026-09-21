# Jetnity – V1 Security Event Ingestion Architecture 1 HANDOFF

Stand: 21. September 2026  
Status: **R3/R4 CORRECTED / F1–F2/R1 PRESERVED / FREEZE THIS HEAD / REPORT CI IN A PR COMMENT / STOP FOR TECHNICAL-LEAD REVIEW / KEIN READY / KEIN MERGE / KEIN PRODUCER CONTRACT 1**

Binding task + amendments: `docs/V1_SECURITY_EVENT_INGESTION_ARCHITECTURE_1_TASK_2026-09-18.md`  
Decision: `docs/V1_SECURITY_EVENT_INGESTION_ARCHITECTURE_1_DECISION_2026-09-18.md`  
Status: `docs/V1_SECURITY_EVENT_INGESTION_ARCHITECTURE_1_STATUS_2026-09-18.md`  
Self-review: `docs/V1_SECURITY_EVENT_INGESTION_ARCHITECTURE_1_SELF_REVIEW_2026-09-18.md`

This document is enough for a new agent or Technical Lead to continue without the chat.

---

## 1. Where the work lives

| | |
| --- | --- |
| Issue | #486 |
| Draft PR | #487 |
| Branch | `docs/v1-security-event-ingestion-architecture-1` |
| Integration base | `main@4a223d342e24fb9316f5ee4333914a16dca3b7bc` |
| R3/R4 reviewed head | `37abe3e15bd4fd3c37c741dc37ed500283384fb5` / review `5266535944` |
| Agent / session | Generation 1 / `bc-5208e459-47c3-4d03-ba30-7ebb633c71bd` |

Read first: review `5266535944`, then decision §8.1 and §8.2.

## 2. What changed

F1/F2/R1 are **preserved**.

R3 defines `used` as currently retained tracked producer rows and couples future cleanup to the same serialized quota lock/transaction. R4 keeps the row-level trigger and reserves **1** per qualifying row; over-cap RAISE rolls the whole statement back. No statement-wide `n`.

No runtime, migration, grant or Production change was made. Do **not** add another commit whose only purpose is to record this correction’s later CI.

## 3. What a reviewer should verify first

1. Merge-base equals live `origin/main@4a223d34` and behind=0.
2. Diff is still the five architecture docs.
3. §8.1 no longer claims an upfront bulk `n`.
4. §8.2 defines cleanup/`used` coupling; no invented N.
5. Finding 5.2 is not marked resolved; no PASS claim.
6. Final gates for the **new** frozen head belong in a PR comment.
7. Next independent gate is a **full Guardian architecture review**, not event-assurance `5759414802`.

## 4. What this does not mean

Not implemented. Not PASS. Not Ready. §G unsatisfied. Producer Contract 1 is **not** authorised.

## 5. Next step

**STOP FOR TECHNICAL-LEAD REVIEW** after the frozen head’s CI/Auth/Preview are posted as a PR comment.
