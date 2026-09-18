# Jetnity – V1 Security Event Ingestion Architecture 1 SELF-REVIEW

Stand: 18. September 2026  
Status: **AGENT SELF-REVIEW — NOT A TECHNICAL-LEAD PASS**

Issue: #486  
Draft PR: #487  
Branch: `docs/v1-security-event-ingestion-architecture-1`  
Binding task: `docs/V1_SECURITY_EVENT_INGESTION_ARCHITECTURE_1_TASK_2026-09-18.md`

This document argues against the decision. It cannot replace an independent Technical-Lead PASS.

---

## 1. Attacks on the slice

| Attack | Result |
| --- | --- |
| Leave A/B/C open instead of choosing | Rejected. Authenticated Jetnity-owned events are the V1 source. |
| Choose platform auth-log ingestion because the audit called it cheapest | Rejected. Repository cannot prove a safe runtime read; it needs a privileged secret and would import PII / wrong trust class. |
| Write unauthenticated login failures so §G KPIs move | Rejected. That is the spam/forgery surface the task asked to close. |
| Use service role because INSERT policy is missing | Rejected. Missing grant is a reason for a later additive policy, not for privileged ingest. |
| Add a SECURITY DEFINER RPC “just for failures” | Rejected. New DEFINER write is privilege escalation. |
| Store IP “for security usefulness” | Rejected. Not required for authenticated admin attribution; IP is not anonymous. |
| Store failed-login email | Rejected. Forbidden by the task and by §G. |
| Hook writes into `evaluateAdminAccess` | Rejected in the follow-up contract. That path is a poll/layout flood. |
| Mark finding 5.2 PASS because architecture exists | Rejected. Ingestion remains OPEN. |
| Claim release-gate §G is satisfied | Rejected. |
| Invent a legal retention period | Rejected. Finding 2.4 stays separate. |
| Edit global continuity / start Writer 1 / Ready / merge | Rejected. |
| Commit `next-env.d.ts` environment noise | Rejected. Restored, not staged. |

## 2. Residual risks this slice does not close

- Nothing in application runtime writes `security_events`.
- Unauthenticated failures stay invisible to Jetnity.
- Baseline `service_role` ALL policy remains a latent blast radius.
- Summary/UI KPIs still key off `auth_failed` / `anomaly*` / `failed` / bot strings.
- Platform Auth log availability is UNKNOWN.
- Retention and blocklist enforcement are untouched.
- No logged-in Preview click was required or performed.

## 3. Compliance with the implementation dispatch

| Requirement | Met? | Note |
| --- | --- | --- |
| Choose and justify preferred source | Yes | Authenticated Jetnity-owned events |
| Minimum V1 taxonomy + trust classes | Yes | Decision §4–§5 |
| Spam / forgery / service-role / DEFINER | Yes | Decision §3.2 / §7 |
| PII classification | Yes | Decision §6 |
| Schema assessment without mutation | Yes | Decision §9 |
| Gates table + smallest follow-up | Yes | Decision §10 / §12 |
| No runtime / migration / service-role / Auth mutation | Yes | docs only |
| No raw auth-log ingestion / secret / scheduler / cost | Yes | |
| No blocklist enforcement | Yes | |
| No global continuity edits | Yes | |
| Do not mark 5.2 resolved | Yes | |
| Persist DECISION / STATUS / HANDOFF / SELF_REVIEW | Yes | |
| Exact-head evidence | Yes on `98b0ff33` | CI `35366837440` SUCCESS; Vercel `69HMZy4hedL3iAD81xdpZng1RDQD` READY. This persist invalidates that SHA. |
| Review threads 0 before stop | Yes at reconstruction | Re-fetch on live HEAD |
| No Ready / merge / follow-up | Yes | |

## 4. What remains before Technical-Lead review

`98b0ff33` had CI `35366837440` SUCCESS and Vercel `69HMZy4hedL3iAD81xdpZng1RDQD` READY. This evidence persist is a newer HEAD and invalidates those exact-head gates. Re-fetch CI/Vercel/threads on the live HEAD. Agent self-review is still not PASS.
