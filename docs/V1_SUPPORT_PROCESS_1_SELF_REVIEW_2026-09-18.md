# Jetnity – V1 Support Process 1 SELF-REVIEW

Stand: 18. September 2026  
Status: **AGENT SELF-REVIEW — NOT A TECHNICAL-LEAD PASS**

Issue: #467  
Draft PR: #470  
Branch: `docs/v1-support-process-1`  
Binding task: `docs/V1_SUPPORT_PROCESS_1_TASK_2026-09-18.md`

This document argues against the implementation. It cannot replace an independent Technical-Lead PASS.

---

## 1. Attacks on the runbook

| Attack | Result |
| --- | --- |
| Invent a named inbox owner or “we read mail daily” | Rejected. Coverage remains unknown. |
| Invent a first-response window / SLA | Rejected. |
| Treat Footer `mailto` as proven controller | Rejected. |
| Claim `Fehler-ID` can be looked up | Rejected. |
| Add `app/account/error.tsx` or mailto on error surfaces | Rejected. Other parallel slice. |
| Use `/admin/users` as a support disclosure source | Rejected after TL P1. Internal AAL2 triage only; no user-facing existence/status. |
| Confirm or deny account existence from ordinary email | Rejected after TL P1. §11.1 default is non-disclosure. |
| Ask for government ID / passport / OTP / password “to verify” | Rejected. §4.3 / §5 / §11.1. |
| Invent From:-header or “reply from the account” as proof | Rejected. Forgeable / out of band. |
| Fulfill DSAR / deletion by ad-hoc Production export or email identity check | Rejected. PO + Legal; no uncontrolled DB access. |
| Apply the admin MFA runbook to consumer lockouts | Rejected. |
| Promise refunds or treat admin `payments` as user billing | Rejected. |
| Invent visa / official-truth answers | Rejected. |
| Bundle a helpdesk or error-tracking vendor | Rejected. |
| Edit global continuity docs or reserved files / Ready / merge | Rejected. |

## 2. Residual risks this slice does not close

- Mail may sit unread.
- No approved secure support identity-verification channel. Honest non-disclosure can frustrate a real account holder; that is preferred to an existence oracle.
- Account-area error boundary and unresolvable `Fehler-ID` remain (4.2 / 4.3 / 5.5 tooling).
- Data-rights requests can be classified, not fulfilled, and identity for those requests is still not operable from this process.
- Consumer MFA unrestorable; Auth mail ceiling (3.8); single-operator mailbox risk.
- The merged incident runbook may still say finding 4.1 had no process; this slice must not edit it.

## 3. Compliance with the binding task and TL P1

| Requirement | Met? | Note |
| --- | --- | --- |
| Docs-only allowed write scope | Yes | |
| Original 4.1 process contract | Yes | unchanged except P1 tightening |
| No confirm/deny account existence from normal email | Yes | §11.1 |
| `/admin/users` internal triage only | Yes | §11 |
| Generic replies unless approved secure identity exists | Yes | none exists; default non-disclosure |
| Data-rights identity = PO + Legal, not email | Yes | §8.6 / §11.1 |
| No government ID / passport / OTP / password to verify | Yes | |
| No uncontrolled Production DB / special gates preserved | Yes | |
| Exact-head gates + persist | Yes for `a0a1a958`: CI `35334204721` SUCCESS including Auth; Vercel `F9maBcjCQYZzqxnMYDddg9WBXjrm` READY. This evidence persist is a newer HEAD. |
| Reconcile exact `origin/main@d0a940c2`; behind 0 | Yes | |
| Five-doc scope preserved | Yes | |
| P1 text preserved | Yes | §11.1 |
| No Ready / no merge / no follow-up | Yes | |

## 4. What remains before Technical-Lead review

Main reconciliation `5728623314` is applied. `a0a1a958` had complete CI including Auth and Vercel READY. This evidence persist is a newer HEAD. Agent self-review is still not PASS.
