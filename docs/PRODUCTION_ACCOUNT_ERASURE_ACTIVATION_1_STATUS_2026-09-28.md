# Jetnity – Production Account Erasure Activation 1 STATUS

Stand: 28. September 2026  
Status: **TL FINAL PASS ON RUNTIME HEAD / PRODUCTION BACKEND ACTIVE / POST-DEPLOY DOCS RE-GATE REQUIRED / NOT MERGED**

Issue: #592  
Draft PR: #597  
Branch: `feat/production-account-erasure-activation-1`  
Base before integration: `main@a2645cfa622e272ee224b77d7c6478e84931fd84`  
Binding task: `docs/PRODUCTION_ACCOUNT_ERASURE_ACTIVATION_1_TASK_2026-09-28.md`  
Accepted runtime/repository head before backend deploy: `1b5e2b708c26e294c7216b4cd65559ff7d0d34aa`  
Runtime contract commit: `2a2bc1d0afb1c30b972ffbbb7687540a91170a06`

Cursor-Agent **Jetnity production account erasure activation 1**, Generation 1, session `bc-27f20108-d06f-4bf1-b5d4-b9629f5a5b06`, is stopped/completed. No follow-up writer is authorized.

## Independent Technical-Lead gate

TL FINAL PASS review `5339269517` was issued on exact head `1b5e2b708c26e294c7216b4cd65559ff7d0d34aa` after:
- branch behind main: 0;
- mergeable: true;
- 0 unresolved review threads;
- GitHub Actions run `36427159093`: SUCCESS, including typecheck, lint, tests, admin API protection, schema reference, dead code, unused exports/packages, Production build and Auth config;
- Vercel Preview `dpl_AnPFic9rNoseM9b84TSntTzfDyco`: READY on the exact same head.

## Production backend — ACTIVE

Production Supabase: `qscbgcdmivbbnzrcyegn`.

Graph-cascade:
- migration **APPLIED**;
- canonical history version `20260927230000`, name `reise_graph_kaskade_tiefe`;
- `public.reise_graph_geaendert()`: SECURITY INVOKER;
- trigger count: 9.

Edge Function:
- `account-delete-v1`: **ACTIVE v1**;
- Function id `58a3892d-2743-4a6d-a301-acd311ad7fa7`;
- `verify_jwt=true`;
- bundle SHA256 `b338776f80c35d70393deb31b1843a190b153244f8ed246720f0b5802f96a3cc`;
- live source readback matches the accepted deployment inputs.

No Production Auth/MFA/OAuth/indexing/provider/payment setting was changed. No real Production account was used or deleted.

## Repository behavior

`loeschUmgebungErlaubt()` allows exact Production and Development Supabase hosts only via HTTPS plus the reviewed local HTTP hosts. Unknown hosted projects, arbitrary hosts, malformed URLs and hosted HTTP remain denied.

Typed confirmation, fresh password reauth, MFA/AAL, JWT-derived identity, no browser-provided `user_id`, Storage ownership cleanup, security-event deletion, Auth deletion order and OAuth fail-closed behavior remain intact.

## Current integration boundary

This file and the current continuity updates were written **after** the Production Function deploy. Therefore the prior exact-head integration gate is intentionally invalidated for the new docs-only head.

Required next sequence:
1. fresh exact-head GitHub CI + Vercel Preview on the post-deploy continuity head;
2. TL exact-head re-gate;
3. mark PR #597 Ready and SHA-locked merge;
4. verify post-merge CI and Vercel Production on exact new `main`;
5. bounded synthetic Production account smoke only if a safe synthetic-account creation/authentication path is available;
6. never use an existing real Production account, and never substitute direct raw insertion into `auth.users`.

KAYAK inquiry remains WAITING FOR RESPONSE and is separate from this slice.
