# Jetnity – V1 Account Data Export 1 SELF-REVIEW

Stand: 18. September 2026  
Status: **AGENT SELF-REVIEW — NOT A TECHNICAL-LEAD PASS**

Issue: #474  
Draft PR: #476  
Gated implementation head: `dd99ee9d70b6b6c704d35e889b8600c41c8b6345`  
Exact-head CI: `35337090168` SUCCESS  
Exact-head Vercel: `C5vUCdkrgYY1P1vCPMTHdJb3oj9j` READY

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
| Hide `.from('trip_travellers')` to dodge the write-path inventory | Rejected. Inventory was updated to allow this helper only as SELECT. |
| Call this account deletion or a complete DSAR package | Rejected. Settings copy and JSON scope say Jetnity-owned rows only. |
| Touch #475 CookieConsent files or global continuity | Rejected. |
| Mark Ready or merge #476 | Rejected. |

## 2. Residual risks

- No globally durable export throttle. A motivated authenticated client can repeat downloads.
- `/api/account` is not in `proxy.ts`; the route is the auth gate.
- PostgREST pages are read in 1000-row steps up to 20_000 rows per table; beyond that the export fails closed.
- Profile/travel rows may contain sensitive traveller facts already stored by the user. That is intended and warned.
- Authenticated happy-path download was not live-exercised here.
- This evidence persist invalidates exact-head gates on `dd99ee9d`.

## 3. Recommendation

The bounded export is implemented and locally plus exact-head gated on `dd99ee9d`. Review the current PR head after this persist. Do not treat this self-review as PASS.
