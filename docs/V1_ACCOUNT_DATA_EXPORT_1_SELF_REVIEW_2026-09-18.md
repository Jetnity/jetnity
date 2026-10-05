# Jetnity – V1 Account Data Export 1 SELF-REVIEW

Stand: 18. September 2026  
Status: **AGENT SELF-REVIEW — NOT A TECHNICAL-LEAD PASS**

Issue: #474  
Draft PR: #476  
Implementation head: `53dfd358b55100f259a52e793463783747d98b7c`  
TL CHANGES REQUIRED: comment `5729541740`

This document cannot replace an independent Technical-Lead PASS.

---

## 1. Attacks on the correction

| Attack | Result |
| --- | --- |
| Keep `select('*')` and only document the risk | Rejected. Every read uses `kontoDatenexportSpaltenliste`. |
| Add or drop semantic fields while “freezing” columns | Rejected. Allowlist equals current Row keys; typecheck locks completeness. |
| Bump schemaVersion without a shape change | Rejected. Version stays `jetnity.account-export.v1`. |
| Introduce service role / RPC / admin client / SQL / migration | Rejected. |
| Touch #477 or global continuity | Rejected. |
| Treat in-memory limiter as a global throttle | Rejected. Gap remains documented. |
| Mark Ready or merge #476 | Rejected. |
| Dispatch Guardian from this session | Rejected. TL forbade Guardian until after this correction review. |

## 2. Residual risks

- A later persist of this evidence creates a new head and invalidates exact-head CI/Preview on `53dfd358`.
- `metadata` / `evidence` JSON columns remain in the reviewed field set; they can carry nested application data that is not a new SQL column.
- No globally durable export throttle.
- Authenticated happy-path download was not live-exercised in this agent.
- External Guardian review is still required later; not started here.

## 3. Recommendation

Accept the allowlist lock if the frozen columns match the previously inspected Production schema. Re-review the new exact head after its own CI / Preview. Do not Ready or merge from this document.
