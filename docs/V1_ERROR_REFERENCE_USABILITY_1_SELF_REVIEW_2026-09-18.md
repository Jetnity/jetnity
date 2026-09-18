# Jetnity – V1 Error Reference Usability 1 SELF-REVIEW

Stand: 18. September 2026  
Status: **AGENT SELF-REVIEW — NOT A TECHNICAL-LEAD PASS**

Issue: #482  
Draft PR: #483  
Gated implementation head: `afb0b98b68dd108a78346917fc5d72b2a54a7b9b`  
Canonical main: `21f489d3beed55ca6a80d901d4aded5e669eb1a9`

This document cannot replace an independent Technical-Lead PASS.

---

## 1. Attacks on the slice

| Attack | Result |
| --- | --- |
| Claim operator-side Fehler-ID lookup exists | Rejected. Copy and runbook keep the ID as context only. |
| Prefill mailto with user, account, URL or error details | Rejected. Bare `mailto:info@jetnity.ch` only. |
| Leave admin on optional digest-only `Ref` | Rejected. Shared `oeffentlicheFehlerId` + `useId` fallback. |
| Show `error.message` in Production admin | Rejected. Development-only, matching public/account. |
| Add Sentry / observability / helpdesk | Rejected. No vendor, no cost, no secret. |
| Mark 5.5 tooling PASS | Rejected. Correlation/tooling half remains open. |
| Edit global continuity files | Rejected. Slice evidence only. |
| Ready / merge / follow-up slice | Rejected. |

## 2. Evidence checked on `afb0b98b`

- Three error boundaries contain `mailto:info@jetnity.ch` and `Fehler-ID`.
- Admin source has no `error.digest &&` optional reference and no ungated `error.message`.
- Runbook contains the required no-correlation phrase and the 4.3 half-closed / 5.5-open wording.
- Contract tests fail if those truths regress.
- Local 3488-test suite, typecheck, lint, hygiene and production build PASS.
- GitHub CI `35355276691` SUCCESS, including Auth job `105633274639`.
- Vercel Preview `8H5mfBS3su2z3NqSrvVCFcUa6VPJ` READY.
- Merge-base `21f489d3`, behind **0**. PR mergeable_state **clean**.

This persist creates a new head and invalidates `afb0b98b` as the exact current SHA.

## 3. Residual risks

- Jetnity still has no operator-side automatic Fehler-ID correlation (open 5.5).
- Inbox monitoring, SLA and auth-form mailto remain absent.
- A quoted Fehler-ID is still not proof of a server incident.
- Persist-after-gates creates a new head that needs independent TL re-bind.

## 4. Recommendation

Accept the user-facing/process half of 4.3 if the live diff matches the required contact path, stable admin Fehler-ID and truthful no-correlation wording. Do not Ready or merge from this document.
