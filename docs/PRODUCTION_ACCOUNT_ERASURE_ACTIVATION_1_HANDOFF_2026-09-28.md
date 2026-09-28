# Jetnity – Production Account Erasure Activation 1 HANDOFF

Stand: 28. September 2026  
Status: **STOP FOR INDEPENDENT TECHNICAL-LEAD REVIEW / NOT PASS / NOT READY / NOT MERGED**

Cursor-Agent: **Jetnity production account erasure activation 1**, Generation **1**  
Session: `bc-27f20108-d06f-4bf1-b5d4-b9629f5a5b06`  
Model: `grok-4.7-high-fast`  
Issue: #592  
Draft PR: #597  
Branch: `feat/production-account-erasure-activation-1`  
Base: `main@a2645cfa622e272ee224b77d7c6478e84931fd84`  
Runtime commit: `2a2bc1d0afb1c30b972ffbbb7687540a91170a06`  
Evidence narrative commit: `acd0aa8d214829aaad64a36de837266f134b982e`  
Exact review head: child of that evidence commit; `git rev-parse HEAD` after this stamp. Do not review `2a2bc1d0` or `acd0aa8d` as the gated head.

Task: `docs/PRODUCTION_ACCOUNT_ERASURE_ACTIVATION_1_TASK_2026-09-28.md`  
Status: `docs/PRODUCTION_ACCOUNT_ERASURE_ACTIVATION_1_STATUS_2026-09-28.md`  
Self-review: `docs/PRODUCTION_ACCOUNT_ERASURE_ACTIVATION_1_SELF_REVIEW_2026-09-28.md`  
Decision: ADR-0215

Cursor does not mark Ready, does not merge, and does not start a follow-up slice.

## Read first

1. `lib/account/kontoloeschung-vertrag.ts` — `loeschUmgebungErlaubt()`
2. `lib/account/kontoloeschung.test.ts` — Production HTTPS allow, HTTP deny, Function URL, MFA still blocks deletion
3. `lib/account/kontoloeschung-direkt.ts` — Development proof still aborts on Production; not an activation switch
4. `app/account/settings/page.tsx` and `components/account/KontoLoeschen.tsx` — same contract, no second flag
5. ADR-0215

## What the reviewer should check

1. Exact Production HTTPS is allowed. Production HTTP, Development HTTP, unknown `*.supabase.co`, arbitrary hosts and malformed URLs are denied.
2. The Function URL for exact Production HTTPS is `https://qscbgcdmivbbnzrcyegn.supabase.co/functions/v1/account-delete-v1`.
3. A valid mocked deletion on that URL is no longer `umgebung_gesperrt`. MFA/reauth/JWT/Storage/OAuth tests still pass. The request body is still only `{ confirmation: "KONTO LÖSCHEN" }`.
4. The graph-cascade migration file is unchanged.
5. No Production project mutation is claimed or performed in this slice.

## Production sequence — Technical Lead only

Do not treat this repository change as a live deletion path. Production still needs, after an independent PASS:

- apply the already accepted graph-cascade migration;
- deploy `account-delete-v1` with `verify_jwt=true`;
- smoke only with a disposable Production identity, never a real user.

If the app merge reaches Vercel Production while `NEXT_PUBLIC_SUPABASE_URL` is `https://qscbgcdmivbbnzrcyegn.supabase.co` and the Function or migration is still absent, `/account/settings` will show the existing delete control. A submit reauthenticates and then fails closed against a missing Function. It does not delete the Auth user by itself. Order the backend activation and the app merge deliberately. This slice does not add a second flag to hide that window.

## Do not

- Do not restart this writer for a new slice.
- Do not modify the accepted migration unless a safety defect is found.
- Do not use the Development proof script against Production.
- Do not mark Ready or merge from Cursor.
