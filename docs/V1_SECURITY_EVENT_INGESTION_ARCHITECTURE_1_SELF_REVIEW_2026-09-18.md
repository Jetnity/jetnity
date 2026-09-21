# Jetnity – V1 Security Event Ingestion Architecture 1 SELF-REVIEW

Stand: 21. September 2026  
Status: **AGENT SELF-REVIEW — NOT A TECHNICAL-LEAD PASS**

Issue: #486  
Draft PR: #487  
Binding task amendments §13–§15  
TL review: `5266535944` on `37abe3e1`

This document argues against the correction. It cannot replace an independent Technical-Lead PASS.

---

## 1. Attacks on the correction

| Attack | Result |
| --- | --- |
| Re-open actor-JWT INSERT / weaken AAL2 | Rejected. F1/F2 preserved. |
| Re-open fail-closed vs best-effort | Rejected. R1 preserved. |
| Treat `used` as lifetime admissions | Rejected. R3: retained tracked-row count. |
| Cleanup without decreasing `used` | Rejected. |
| Decrement `used` without deleting, or vice versa, in different xacts | Rejected. Same lock domain. |
| Delete legacy/`login_failed` to repair quota | Rejected. |
| Upfront statement-wide `n` reservation | Rejected. R4: reserve 1 per row. |
| Add a statement-level collector here | Rejected. |
| Implement SQL in this slice | Rejected. Docs only. |
| Persist another commit only to store CI SHAs | Rejected. |
| Ready / merge / start Producer Contract 1 | Rejected. |

## 2. Residual risks

- Cleanup/`used` coupling can still be implemented wrongly (count vs ledger drift). Tests are specified, not run.
- `service_role` writes remain outside quota.
- Fail-closed plus a drifted quota will refuse in-scope blocklist writes after a later activation.
- No PostgreSQL test of R3/R4 was run here.

## 3. Adversarial matrix — reasoning vs tests run

| Case | Source reasoning | Test actually run this slice |
| --- | --- | --- |
| Same-JWT / moderator forge / AAL1 / break-glass | Unchanged F1/F2 | **None** |
| In-scope fail-closed | R1 RAISE rolls back source+event | **None** |
| Reserve 1 per row | R4 | **None** |
| Multi-row over-cap | Whole statement rolls back | **None** |
| Two admissions at C−1 | Row lock; cannot commit C+1 | **None** |
| Cleanup decreases `used` | Same xact / lock | **None** |
| Cleanup rollback | Rows and `used` restored | **None** |
| Drift / missing quota | Persistent writes disabled | **None** |
| Legacy rows used to repair quota | Forbidden | **None** |

## 4. Dispatch compliance

| Requirement | Met? |
| --- | --- |
| Same session / branch / PR | Yes |
| Preserve F1/F2/R1; correct only R3/R4 | Yes |
| No runtime / migration / privileged activation | Yes |
| No false prior-PASS | Yes |
| CI for this head in a PR comment, not a second persist | Yes after freeze |
| Stop for TL review | Yes after freeze |

## 5. What remains

Independent Technical-Lead re-review of the frozen R3/R4 head, then a **full Guardian adversarial architecture review**. Event assessment `5759414802` is not that review. Agent self-review is not PASS.
