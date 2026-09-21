# Jetnity – V1 Security Event Ingestion Architecture 1 STATUS

Stand: 21. September 2026  
Status: **TL CHANGES REQUIRED F1–F3 ADDRESSED IN DOCS / NOT A TECHNICAL-LEAD PASS / DRAFT / NOT READY / NOT MERGED / FINDING 5.2 INGESTION OPEN / STOP FOR TECHNICAL-LEAD REVIEW**

Issue: #486  
Draft PR: #487  
Branch: `docs/v1-security-event-ingestion-architecture-1`  
Binding task + 21 September amendment: `docs/V1_SECURITY_EVENT_INGESTION_ARCHITECTURE_1_TASK_2026-09-18.md`  
Decision: `docs/V1_SECURITY_EVENT_INGESTION_ARCHITECTURE_1_DECISION_2026-09-18.md`  
Current integration base / live `origin/main` at last fetch: `4a223d342e24fb9316f5ee4333914a16dca3b7bc`  
Reviewed rejected head: `035486e021cf56c0ada4a3dc7ad1924cb1c01de4`  
TL review: `5265503350` CHANGES REQUIRED

Cursor-Agent: **Jetnity V1 security event ingestion architecture 1**, Generation 1  
Session: `bc-5208e459-47c3-4d03-ba30-7ebb633c71bd`

This file is point-in-time evidence. A new head invalidates older exact-head gates. Agent self-review is not Technical-Lead PASS. Integration preservation was **not** architectural acceptance. No prior PASS is claimed.

Finding 5.2 remains **OPEN**. Writer 1 is **withdrawn**. Mutation-derived producer is **not** implemented.

---

## 1. Goal

Correct the architecture package for F1–F3. Do not implement a writer.

## 2. Implemented

Replacement decision:

- **F1:** Actor-JWT INSERT is rejected. Persistable V1 rows must be **derived from a `blocked_ips` mutation** via a trigger-only least-privilege function. Same-JWT Data API bypass is a specified fail case.
- **F2:** Role × AAL × grant table. Login / step-up / AAL1 / denial / break-glass are **unobserved**. AAL2 and break-glass rules are not weakened. Break-glass grant payloads removed.
- **F3:** Payload, time, size and historical-type compatibility are required of the producer function, not a TypeScript helper. Retention/row-cap is an **activation prerequisite**. No invented legal period. Legacy `login_failed` fixtures must remain readable (no table-wide type CHECK rewrite).
- Follow-up renamed to **Mutation-Derived Producer 1**. Previous Writer 1 is withdrawn.

Wording that called the draft “accepted architecture” was removed.

## 3. Changed files versus current `origin/main`

Exactly the five #487 architecture documents (task + DECISION/STATUS/HANDOFF/SELF_REVIEW).

## 4. Traveller-context check

Not relevant.

## 5. Hard exclusions held

No runtime writer, migration, RLS/grant, Auth/Supabase/Production mutation, service-role client, auth-log ingest, provider/secret/scheduler, Writer 1, Ready or merge.

## 6. Local gates

To be completed on the correction persist head.

| Gate | Result |
| --- | --- |
| Merge-base vs live `origin/main` | pending this persist |
| Behind | pending this persist |
| Scope | five architecture docs only (intended) |
| PostgreSQL/RLS attack tests | **not run** — matrix is source reasoning |
| DB / Auth / Production calls | **none** |

## 7. Exact-head CI / Preview

`035486e0` gates (CI `35587798753` / Vercel `dpl_FTvYZRjcrADw5pqbfdvHSS7pzcrg` per TL review) are **invalidated** by this correction head. Re-fetch on the live HEAD.

## 8. Drift / threads

| | |
| --- | --- |
| Live `origin/main` at last fetch | `4a223d342e24fb9316f5ee4333914a16dca3b7bc` |
| Formal review | CHANGES REQUIRED `5265503350` |
| Line review threads at last fetch | **0** (review was a summary review) |

## 9. Residual risks

- Finding 5.2 still OPEN. Almost all auth signals unobserved.
- Baseline `service_role` ALL remains.
- Trigger DEFINER, if later built, is still privileged and must stay trigger-only.
- Retention/activation still gated.
- `.jetnity/operating-mode.json` on main may still park this PR at an old SHA.

## 10. Next step

Obtain fresh exact-head CI + Preview on the **live HEAD**, then **STOP FOR TECHNICAL-LEAD REVIEW**. No Ready. No merge. No Writer 1. No follow-up slice.
