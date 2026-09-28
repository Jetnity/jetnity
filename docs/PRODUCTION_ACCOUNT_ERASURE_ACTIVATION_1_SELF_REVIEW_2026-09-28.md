# Jetnity – Production Account Erasure Activation 1 SELF-REVIEW

Stand: 28. September 2026  
Status: **AGENT SELF-REVIEW — NOT A TECHNICAL-LEAD PASS**

Issue: #592  
Draft PR: #597  
Branch: `feat/production-account-erasure-activation-1`  
Runtime commit: `2a2bc1d0afb1c30b972ffbbb7687540a91170a06`  
Evidence narrative commit: `acd0aa8d214829aaad64a36de837266f134b982e`  
Exact review head: child of that evidence commit. This self-review does not replace an independent PASS.

Session: `bc-27f20108-d06f-4bf1-b5d4-b9629f5a5b06`  
Model: `grok-4.7-high-fast`

## Attacks on the contract

| Attack | Result |
| --- | --- |
| Allow every `*.supabase.co` project | Rejected. Only the two exact hosts match. |
| Allow Production over HTTP | Rejected. Hosted projects require `https:`. |
| Allow an arbitrary HTTPS host | Rejected. |
| Allow a lookalike suffix host | Rejected. `qscbgcdmivbbnzrcyegn.supabase.co.evil.example` does not match. |
| Accept a malformed URL | Rejected. `new URL` failure returns false. |
| Put `user_id` in the delete body | Rejected. Existing test still requires only `confirmation`. |
| Skip MFA because the project is Production | Rejected. AAL1 with a verified factor returns `mfa_erforderlich` and does not call Storage, events or Auth delete. |
| Open the Development proof script against Production | Rejected. `direktZugangPruefen` still returns `produktion` before fetch. |
| Add a second Production flag | Not done. Settings, the component and the Edge Function use `loeschUmgebungErlaubt()`. |
| Change the accepted migration | Not done. Blob unchanged. |
| Log a secret or claim legal compliance | Not done. Copy tests still forbid DSGVO/GDPR/restore promises. |

## `[::1]`

The previous allowlist named `::1`, but Node's hostname for `http://[::1]:54321` is `[::1]`. That entry never matched. The slice accepts `[::1]` so the reviewed local HTTP host works. It does not allow HTTPS loopback or any hosted project. This is the only local-host behavior change.

## Residual risks

- Merging the app before the Production Function and graph-cascade migration exist exposes the delete UI on the Production project URL. The call then fails closed. It is not a successful delete. The Technical Lead owns that order.
- GitHub CI and Vercel Preview for the documentation tip are outside this self-review. Local gates on `2a2bc1d0` are not that tip.
- This document is not an independent PASS.

## Recommendation

Review the branch tip. Do not Ready or merge from this review. After PASS, the Technical Lead deploys the Function, applies the migration, and runs the disposable Production smoke. No follow-up slice starts from this agent.
