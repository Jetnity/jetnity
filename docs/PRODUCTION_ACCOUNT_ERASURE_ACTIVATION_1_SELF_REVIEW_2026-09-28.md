# Jetnity – Production Account Erasure Activation 1 SELF-REVIEW

Stand: 28. September 2026  
Status: **AGENT SELF-REVIEW — NOT A TECHNICAL-LEAD PASS**

Issue: #592  
Draft PR: #597  
Branch: `feat/production-account-erasure-activation-1`  
Runtime commit: `2a2bc1d0afb1c30b972ffbbb7687540a91170a06`  
Superseded: `2c39f7ba06794ac4f23ce5bbc470361ca50ff23c` and `494d4226fa84c7006146291b476a3777711156c2`.  
Exact review head: the commit that contains this R1/R2 correction. This self-review does not replace an independent PASS.

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
| Treat the Technical Lead migration application as Cursor work | Not done. Current history is canonical `20260927230000_reise_graph_kaskade_tiefe`. |
| Leave `20260928123859` as the current history version | Corrected. That version is the intermediate history entry before the repair. |
| Leave current prose saying the migration is unapplied or still to be applied | Corrected. Remaining unapplied wording is labelled historical task-creation state. |
| Start the remaining sequence with migration apply | Corrected. The sequence starts with Function deploy after exact-head PASS. |
| Log a secret or claim legal compliance | Not done. Copy tests still forbid DSGVO/GDPR/restore promises. |
| Deploy the Production Function | Not done. |

## `[::1]`

The previous allowlist named `::1`, but Node's hostname for `http://[::1]:54321` is `[::1]`. That entry never matched. The slice accepts `[::1]` so the reviewed local HTTP host works. It does not allow HTTPS loopback or any hosted project.

## Residual risks

- Integrating the app before `account-delete-v1` exists on Production exposes the delete UI. The call fails closed. It is not a successful delete. The graph-cascade migration is already applied. History is canonical `20260927230000_reise_graph_kaskade_tiefe`.
- This document is not an independent PASS.

## Recommendation

Review this R1/R2 head. Do not Ready or merge from this review. After PASS, deploy `account-delete-v1` with `verify_jwt=true`, verify the live bundle, integrate the app change, confirm post-merge CI and Production READY, then run the synthetic Production smoke. No follow-up slice starts from this agent.
