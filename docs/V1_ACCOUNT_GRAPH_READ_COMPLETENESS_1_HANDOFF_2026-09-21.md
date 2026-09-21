# V1 Account Graph Read Completeness 1 — Handoff

Stand: 21. September 2026  
Status: **IMPLEMENTATION DELIVERED / STOP FOR INDEPENDENT TECHNICAL-LEAD REVIEW / KEIN READY / KEIN MERGE / KEIN FOLGE-SLICE**

Binding task: `docs/V1_ACCOUNT_GRAPH_READ_COMPLETENESS_1_TASK_2026-09-21.md`  
Detailed status: `docs/V1_ACCOUNT_GRAPH_READ_COMPLETENESS_1_STATUS_2026-09-21.md`  
Self-review: `docs/V1_ACCOUNT_GRAPH_READ_COMPLETENESS_1_SELF_REVIEW_2026-09-21.md`  
Decision: `docs/V1_ACCOUNT_GRAPH_READ_COMPLETENESS_1_DECISION_2026-09-21.md`

---

## 1. Where the work lives

| | |
| --- | --- |
| Issue | #529 |
| Draft PR | #531 |
| Branch | `fix/v1-account-graph-read-completeness-1` |
| Assigned dispatch base | `main@e818c13ed009932bc06be1382a89467866699995` |
| Dispatch seed | `4e1df6d00532c6b44f48c522b006db9feef295ec` |
| Agent | **Jetnity V1 account graph read completeness 1**, Generation 1 |
| Session | `bc-7aea55a7-c218-4b66-8fdf-a546dbbe6b74` |
| Required model | Cursor Grok 4.6 High Fast (`originalModelName=cursor-grok-4.6-high-fast`) |

Exact freeze SHA, ahead/behind, CI/Auth/Preview and thread counts belong in the STOP PR comment on the frozen head.

## 2. What a reviewer should verify first

1. Diff vs baseline is only the account read boundary, named tests, this prefix’s docs/evidence. No guest/create, types, Auth, DB, package or global-continuity edit.
2. Complete canonical multi-citizenship/multi-document parties still map. Empty party and loaded empty children stay empty.
3. Missing-relation detector still runs exactly one legacy select. Nonempty fallback is `Lesung.problem` / `zeilen: null` before `reiseAus`. Empty fallback stays absent. Other errors do not retry.
4. Canonical success with any missing/null/non-array child, including mixed travellers, fails closed. No filtering.
5. Internal message may say incomplete traveller load. It must not contain SQL, schema names or raw rows. Page/actions already show generic 500 copy.
6. Named consumers stop before use. Safety is executed. No out-of-scope caller expansion was needed.
7. `partyAusZeilen` guest/legacy semantics are unchanged. Existing reisende tests stay green.
8. This self-review is not Technical-Lead PASS.

## 3. What this slice does not mean

- Production child tables are not validated here.
- Guest active-draft preservation is #532. Do not merge/rebase that sibling here.
- Unavailable workspace on an incomplete read is the accepted bounded tradeoff, not data loss.
- Source/unit proof is not authenticated E2E.

## 4. Next Cursor/Guardian action

**STOP FOR TECHNICAL-LEAD REVIEW.** No Ready. No merge. No follow-up slice.  
Guardian was not required at dispatch. Reassess only if TL finds a material Truth/Auth risk.
