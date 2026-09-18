# Jetnity – V1 Legal Claim Hygiene 1 SELF-REVIEW

Stand: 18. September 2026  
Status: **AGENT SELF-REVIEW — NOT A TECHNICAL-LEAD PASS**

Issue: #456  
Draft PR: #457  
Branch: `fix/v1-legal-claim-hygiene-1`  
Binding task: `docs/V1_LEGAL_CLAIM_HYGIENE_1_TASK_2026-09-18.md`

This document argues against the implementation. It cannot replace an independent Technical-Lead PASS.

---

## 1. Attacks on the copy change

| Attack | Result |
| --- | --- |
| Soften instead of remove (`weitgehend konform`, `orientiert an DSGVO`) | Rejected. Entire standalone footers removed. No replacement legal/compliance wording added. |
| Keep the first footer sentence (`Mit der Registrierung/Anmeldung stimmst du unseren Richtlinien zu.`) | Rejected. That leftover is still legal/consent semantics. On login it would also introduce terms-acceptance copy the task forbids. The Register checkbox already states acceptance of `/terms` and `/privacy`. |
| Change the Register checkbox, labels, links or `disabled={loading \|\| !accept}` while touching the footer | Rejected. Those lines are unchanged. |
| Add a login checkbox or legal links | Rejected. Login only lost the unsupported footer. |
| Edit `/privacy`, `/terms` or invent legal content | Rejected. Out of scope. |
| Persist consent or close finding 1.5 (OAuth bypass) | Rejected. Named and left open. |
| Touch Auth / MFA / AAL / OAuth / recovery | Rejected. No handler or session logic changed. |
| Touch Supabase / migrations / RLS / Production | Rejected. |
| Flip the AP-6a inventory test to `false` without locking the exact prohibited strings | Mitigated. The inverted test also asserts absence of `DSGVO & CH-DSG konform` and the JSX entity form. |
| Leave the old inventory lock asserting presence | That would fail the required full repository tests. Inverting the existing legal inventory test is the smallest faithful regression lock. |
| Edit global continuity docs | Rejected. Only this slice's TASK / STATUS / HANDOFF / SELF_REVIEW plus the two forms and the inventory test. |
| Mark Ready or merge | Rejected. |

## 2. Residual risks this slice does not close

- `/privacy` and `/terms` still 404. Register still links them. That is finding **1.1**, not this slice.
- Register acceptance is still client-only and OAuth still bypasses it. That is finding **1.5**.
- No data export or account deletion. Findings **2.1** / **2.2**.
- Users may still infer compliance from the remaining checkbox wording plus the missing pages. That is a product/legal follow-up, not a reason to invent copy here.

## 3. Compliance with the binding task

| Requirement | Met? | Note |
| --- | --- | --- |
| Remove unsupported claim from RegisterForm | Yes | Entire standalone footer removed |
| Remove unsupported claim from LoginForm | Yes | Entire standalone footer removed |
| Preserve Register checkbox / links / validation / submit gating | Yes | Existing inventory test still locks those facts |
| No replacement legal wording | Yes | |
| Smallest focused regression test | Yes | Existing `lib/legal` inventory test inverted to lock absence |
| Persist STATUS / HANDOFF / SELF_REVIEW | Yes | This set |
| No legal-content generation | Yes | |
| No Auth/consent/DB/provider/cost/Ready/merge/follow-up | Yes | |

## 4. What remains before Technical-Lead review

Local gates, exact-head GitHub CI, exact-head Vercel Preview, review/Vercel-thread state and a live `origin/main` drift report. Those are not claimed here because they do not yet exist for the implementation head.
