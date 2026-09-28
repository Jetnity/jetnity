# Jetnity – Production Account Erasure Activation 1 SELF-REVIEW

Stand: 28. September 2026  
Status: **AGENT SELF-REVIEW — NOT A TECHNICAL-LEAD PASS**

Issue: #592  
Draft PR: #597  
Branch: `feat/production-account-erasure-activation-1`  
Runtime commit: `2a2bc1d0afb1c30b972ffbbb7687540a91170a06`  
Superseded stamp: `2c39f7ba06794ac4f23ce5bbc470361ca50ff23c`  
Exact review head: the commit that contains this reconciliation. This self-review does not replace an independent PASS.

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
| Change the accepted migration file | Not done. Blob unchanged. |
| Treat the Technical Lead migration application as Cursor work | Not done. History version `20260928123859_reise_graph_kaskade_tiefe` is recorded as a TL fact. |
| Leave current prose saying the migration is unapplied | Corrected. Remaining unapplied wording is labelled historical task-creation state. |
| Log a secret or claim legal compliance | Not done. Copy tests still forbid DSGVO/GDPR/restore promises. |
| Deploy the Production Function | Not done. |

## `[::1]`

The previous allowlist named `::1`, but Node's hostname for `http://[::1]:54321` is `[::1]`. That entry never matched. The slice accepts `[::1]` so the reviewed local HTTP host works. It does not allow HTTPS loopback or any hosted project.

## Residual risks

- Merging the app before `account-delete-v1` exists on Production exposes the delete UI. The call fails closed. It is not a successful delete. The graph-cascade migration is already applied by the Technical Lead. The Technical Lead owns Function deploy, smoke, Ready and merge.
- This document is not an independent PASS.

## Recommendation

Review the branch tip. Do not Ready or merge from this review. After PASS, the Technical Lead deploys the Function and runs the disposable Production smoke. No follow-up slice starts from this agent.
