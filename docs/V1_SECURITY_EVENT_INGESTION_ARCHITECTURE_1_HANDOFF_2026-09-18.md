# Jetnity – V1 Security Event Ingestion Architecture 1 HANDOFF

Stand: 21. September 2026  
Status: **F1–F3 CONTRACT REPLACED / RE-GATE LIVE HEAD / STOP FOR TECHNICAL-LEAD REVIEW / KEIN READY / KEIN MERGE / KEIN WRITER 1**

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
| Correction persist | `c7c614d8ea45ca51d34420b47038f8c10c969e6d` |
| TL review | CHANGES REQUIRED `5265503350` |
| Agent / session | Generation 1 / `bc-5208e459-47c3-4d03-ba30-7ebb633c71bd` |

Read first: TL review F1–F3, decision §0–§1 and §5.3, then live HEAD CI/Preview.

## 2. What changed

The actor-JWT INSERT contract was **replaced**, not caveated.

Persistable V1 evidence is only a **mutation-derived** `blocked_ips` trigger row. Auth login/step-up/denial/break-glass are **unobserved**. Writer 1 is withdrawn.

No runtime, migration, grant or Production change was made.

## 3. What a reviewer should verify first

1. Merge-base equals live `origin/main@4a223d34` and behind=0.
2. Diff is still the five architecture docs.
3. Decision no longer grants authenticated INSERT or calls actor JWT “server truth”.
4. AAL1 step-up is unobserved; AAL2 is not weakened.
5. Finding 5.2 is not marked resolved; no PASS claim.
6. `c7c614d8` CI `35589130241` SUCCESS and Vercel `47NWELGnCWNcpXc4kqvwjhFpgH1H` READY are recorded only for that SHA.
7. Re-fetch CI / Preview / threads on the **live HEAD** after this persist.
8. PR description was not rewritten (tool refused a non-agent-managed body).

## 4. What this does not mean

Not implemented. Not PASS. Not Ready. §G unsatisfied.

## 5. Next step

**STOP FOR TECHNICAL-LEAD REVIEW.** Independent Guardian review belongs on the corrected frozen head after that review, not as a substitute for F1–F3.
