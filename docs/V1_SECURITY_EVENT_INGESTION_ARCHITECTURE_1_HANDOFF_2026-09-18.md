# Jetnity – V1 Security Event Ingestion Architecture 1 HANDOFF

Stand: 21. September 2026  
Status: **R1/R2 CORRECTED / F1–F2 PRESERVED / FREEZE THIS HEAD / REPORT CI IN A PR COMMENT / STOP FOR TECHNICAL-LEAD REVIEW / KEIN READY / KEIN MERGE / KEIN WRITER 1**

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
| Rejected F1–F3 head | `035486e021cf56c0ada4a3dc7ad1924cb1c01de4` / review `5265503350` |
| R1/R2 reviewed head | `86540c7a702547fbe5825784dbd64063ef9622cd` / review `5265844197` |
| Agent / session | Generation 1 / `bc-5208e459-47c3-4d03-ba30-7ebb633c71bd` |

Read first: review `5265844197` R1/R2, then decision §3.3, §7 and §8.

## 2. What changed

F1/F2 mutation-derived replacement is **preserved**.

R1 now binds **atomic fail-closed** audit for in-scope operator+AAL2 `blocked_ips` mutations. R2 separates volume, serialized admission and retention; names a quota-object dependency; keeps persistent activation closed; narrows the next slice to local disposable-database contract tests.

No runtime, migration, grant or Production change was made.

Do **not** add another commit whose only purpose is to record this correction’s later CI.

## 3. What a reviewer should verify first

1. Merge-base equals live `origin/main@4a223d34` and behind=0.
2. Diff is still the five architecture docs.
3. §3.3 no longer leaves exception vs no-op to implementation for in-scope writes.
4. §8 no longer treats a row cap as a retention/activation substitute.
5. Finding 5.2 is not marked resolved; no PASS claim.
6. Predecessor `86540c7a` CI `35589833774` / Vercel `dpl_EgnAycGVJQuwYZZr8bCBVVQ66QjG` are historical only.
7. Final gates for the **new** frozen head belong in a PR comment, not a second persist.
8. Guardian comment `5759414802` is an event assessment, not an architecture PASS.

## 4. What this does not mean

Not implemented. Not PASS. Not Ready. §G unsatisfied. Producer Contract 1 is **not** authorised.

## 5. Next step

**STOP FOR TECHNICAL-LEAD REVIEW** after the frozen head’s CI/Auth/Preview are posted as a PR comment.
