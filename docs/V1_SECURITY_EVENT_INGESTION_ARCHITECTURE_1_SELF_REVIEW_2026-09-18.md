# Jetnity – V1 Security Event Ingestion Architecture 1 SELF-REVIEW

Stand: 21. September 2026  
Status: **AGENT SELF-REVIEW — NOT A TECHNICAL-LEAD PASS**

Issue: #486  
Draft PR: #487  
Binding task + 21 September amendment  
TL CHANGES REQUIRED: `5265503350` on `035486e0`

This document argues against the correction. It cannot replace an independent Technical-Lead PASS.

---

## 1. Attacks on the correction

| Attack | Result |
| --- | --- |
| Append caveats to actor-JWT INSERT | Rejected. Contract replaced. |
| Keep Writer 1 and add “don’t call Data API” | Rejected. |
| Call integration preservation a prior PASS | Rejected. |
| Persist AAL1 step-up by weakening `darf_*` | Rejected. Unobserved. |
| Table CHECK that bans `login_failed` | Rejected. Historical/test compatibility. |
| Implement the trigger in this slice | Rejected. Docs only. |
| Invent a legal retention period | Rejected. Activation prerequisite only. |
| Ready / merge / start follow-up | Rejected. |

## 2. Residual risks

- Trigger DEFINER is still privilege. Specification is least-privilege; implementation can get it wrong.
- `service_role` ALL remains a latent bypass of the “no app DML” rule.
- Unobserved auth signals can be misread as “no attacks” if #485 copy is later removed.
- No PostgreSQL test of the new matrix was run here.
- Block/unblock vs trigger-failure semantics are only recommended, not coded.

## 3. Adversarial matrix — reasoning vs tests run

| Case | Source reasoning | Test actually run this slice |
| --- | --- | --- |
| Same-JWT bypass | No INSERT grant ⇒ Data API fail | **None** (no DB) |
| Moderator forges operator event | No `blocked_ips` write; no event INSERT | **None** |
| AAL1 | `darf_betrieb_eingreifen()` false | **None** |
| AAL2 operator mutation | Trigger would fire after real change | **None** |
| Break-glass | `adminWriteErlaubt` + RLS | **None** |
| Foreign actor | `auth.uid()` in trigger | **None** |
| Arbitrary JSON / supplied time | Function-built extra/now() | **None** |
| Oversized / replay | Cap + one-event-per-mutation | **None** |
| Logging failure | Auth path does not write | **None** |
| Historical `login_failed` | No destructive type CHECK | **None** |

TL synthetic evaluation on the **old** predicate is evidence against that predicate, not a test of this replacement.

## 4. Dispatch compliance

| Requirement | Met? |
| --- | --- |
| Same session / branch / PR | Yes |
| Replace F1–F3, do not caveat | Yes |
| No runtime / migration / privileged activation | Yes |
| Writer 1 withdrawn | Yes |
| No false prior-PASS / self-SHA as current PASS | Yes |
| Fresh exact-head CI | Yes on `c7c614d8` | CI `35589130241` SUCCESS; Vercel `47NWELGnCWNcpXc4kqvwjhFpgH1H` READY. This persist invalidates that SHA. |
| Stop for TL review | Yes after re-gate |

## 5. What remains

`c7c614d8` had CI `35589130241` SUCCESS and Vercel `47NWELGnCWNcpXc4kqvwjhFpgH1H` READY. This evidence persist is a newer HEAD and invalidates those gates. Re-fetch on the live HEAD. Agent self-review is not PASS.
