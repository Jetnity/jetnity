# Jetnity – V1 Account Data Export 1 SELF-REVIEW

Stand: 18. September 2026  
Status: **AGENT SELF-REVIEW — NOT A TECHNICAL-LEAD PASS**

Issue: #474  
Draft PR: #476  
Dispatch head: `1e7dc04d950ba7e6be9d0c1b16d98f3ce99e8ebb`

This document cannot replace an independent Technical-Lead PASS.

---

## 1. Attacks on this slice

| Attack | Result |
| --- | --- |
| Use service role because RLS “might be incomplete” | Rejected. Live TL precheck already recorded owner SELECT policies. |
| Accept `user_id` from query/body/path | Rejected. `GET()` has no Request parameter. |
| Reuse in-memory provider cost guard as a real export limiter | Rejected. Documented as unreliable across serverless instances. |
| Add a rate-limit table/migration | Rejected. Hard exclusion. |
| Persist the JSON in Storage | Rejected. Direct response only. |
| Export unrelated `user_id` tables or commercial provenance | Rejected. Explicit table list only. |
| Call this account deletion or a complete DSAR package | Rejected. Settings copy and JSON scope say Jetnity-owned rows only. |
| Touch #475 CookieConsent files or global continuity | Rejected. |
| Mark Ready or merge #476 | Rejected. |

## 2. Residual risks

- No globally durable export throttle. A motivated authenticated client can repeat downloads.
- `/api/account` is not in `proxy.ts`; the route is the auth gate.
- PostgREST pages are read in 1000-row steps up to 20_000 rows per table; beyond that the export fails closed instead of truncating.
- Profile/travel rows may contain sensitive traveller facts already stored by the user. That is intended and warned.
- Full repo gates, exact-head CI and Vercel Preview are still pending at this persist.

## 3. Recommendation

Review the implementation against the binding task after full gates and exact-head evidence are persisted. Do not treat this self-review as PASS.
