# Jetnity – V1 Security Event Ingestion Architecture 1 HANDOFF

Stand: 21. September 2026  
Status: **F1–F3 CONTRACT REPLACED / LIVE-HEAD `61c65be9` GATES RECORDED / STOP FOR TECHNICAL-LEAD REVIEW / KEIN READY / KEIN MERGE / KEIN WRITER 1**

Binding task + amendment: `docs/V1_SECURITY_EVENT_INGESTION_ARCHITECTURE_1_TASK_2026-09-18.md`  
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
| Rejected head | `035486e021cf56c0ada4a3dc7ad1924cb1c01de4` |
| Architecture replacement persist | `c7c614d8ea45ca51d34420b47038f8c10c969e6d` |
| Recorded live HEAD before this persist | `61c65be9607418a549d1fd3e5eb0d717b118e294` |
| TL review | CHANGES REQUIRED `5265503350` on the rejected head |
| Agent / session | Generation 1 / `bc-5208e459-47c3-4d03-ba30-7ebb633c71bd` |
| Same-session dispatch | comment `5759015153` — already implemented in `c7c614d8` |

Read first: TL review F1–F3, decision §0–§1 and §5.3, then this file’s recorded gates. A new HEAD after this persist invalidates `61c65be9`.

## 2. What changed

The actor-JWT INSERT contract was **replaced**, not caveated.

Persistable V1 evidence is only a **mutation-derived** `blocked_ips` trigger row. Auth login/step-up/denial/break-glass are **unobserved**. Writer 1 is withdrawn.

No runtime, migration, grant or Production change was made.

This persist does not reopen architecture. It only records exact-head CI / Auth / Preview on `61c65be9`.

## 3. What a reviewer should verify first

1. Merge-base equals live `origin/main@4a223d34` and behind=0.
2. Diff is still the five architecture docs.
3. Decision no longer grants authenticated INSERT or calls actor JWT “server truth”.
4. AAL1 step-up is unobserved; AAL2 is not weakened.
5. Finding 5.2 is not marked resolved; no PASS claim.
6. `61c65be9` CI `35589413339` SUCCESS (Auth `106300164451`, Typecheck `106300164095`) and Vercel `9hzjqpe84FMGrv8sCeg5iHqUBTy3` READY are recorded only for that SHA.
7. Re-fetch CI / Preview / threads on the **live HEAD** after this persist.
8. Formal review `5265503350` is still CHANGES REQUIRED on the old head until independent re-review.
9. Line review threads were 0 at last fetch.
10. PR description may still show the pre-correction “required corrections” text if ManagePullRequest refuses a non-agent-managed body. The binding replacement is the five docs.

## 4. What this does not mean

Not implemented. Not PASS. Not Ready. §G unsatisfied. Mutation-Derived Producer 1 is **not** authorised.

## 5. Next step

**STOP FOR TECHNICAL-LEAD REVIEW.** Independent Guardian review belongs on the corrected frozen head after that review, not as a substitute for F1–F3.
