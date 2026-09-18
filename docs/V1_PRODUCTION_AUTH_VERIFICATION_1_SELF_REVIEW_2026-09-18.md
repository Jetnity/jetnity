# Jetnity – V1 Production Auth Verification 1 SELF-REVIEW

Stand: 18. September 2026  
Status: **AGENT SELF-REVIEW — NOT A TECHNICAL-LEAD PASS**

Issue: #479  
Draft PR: #480  
P3 correction evidence head: `f72cdd499c6ee0e6ec782e0df5011e223d8d814d`  
TL CHANGES REQUIRED: comment `5730407196`

This document cannot replace an independent Technical-Lead PASS.

---

## 1. Attacks on the P3 correction

| Attack | Result |
| --- | --- |
| Keep the “ref does not belong in a public repository” rationale | Rejected. |
| Invent a new remotes architecture or write path | Rejected. Edit is rationale-only. |
| Treat the public project ref as a leaked secret | Rejected. It is already operational metadata. |
| Turn `auth:produktion:lesen` into config-as-code | Rejected. Still GET-only. |
| Reopen 3.3 / close 3.6 / close 3.8 | Rejected. Phase-B conclusions preserved. |
| Production Auth write / Ready / merge | Rejected. |

---

## 2. Evidence checked on `f72cdd49`

- §9 now names the write boundary, not public-repo secrecy, as the reason there is no Production `[remotes.*]`.
- The only remaining “öffentliche Repository” phrase is the explicit negation of the old claim.
- CI `35348329618` SUCCESS; auth job `105610134444` ran only Development `Abgleich`.
- Vercel Preview `GdeQ6s9AJrRwzeNjgUbaw59vbPmu` READY.
- Merge-base `d67529a`, behind **0**. Threads 0.

This persist creates a new head and invalidates `f72cdd49` as the exact current SHA.

---

## 3. Residual risks

- Production redirect values remain localhost + empty allowlist (open P2).
- No production-capable SMTP (open P0).
- Persist-after-gates creates a new head that needs independent TL re-bind.

---

## 4. Recommendation

Accept the §9 rationale if it matches the required write-boundary wording and no other Phase-B truth changed. Do not Ready or merge from this document.
