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
Superseded: `2c39f7ba06794ac4f23ce5bbc470361ca50ff23c`, `494d4226fa84c7006146291b476a3777711156c2`, and `7cbf1c7bf400f3b354fdc4a0ca468766dd0f4e18`.  
Exact review head: the commit that contains this history clarification. Do not review those superseded SHAs.

Task: `docs/PRODUCTION_ACCOUNT_ERASURE_ACTIVATION_1_TASK_2026-09-28.md`  
Status: `docs/PRODUCTION_ACCOUNT_ERASURE_ACTIVATION_1_STATUS_2026-09-28.md`  
Self-review: `docs/PRODUCTION_ACCOUNT_ERASURE_ACTIVATION_1_SELF_REVIEW_2026-09-28.md`  
Decision: ADR-0215, including the 28 September Nachtrag

Cursor does not mark Ready, does not merge, and does not start a follow-up slice.

## Production migration

**APPLIED.** Current history version is `20260927230000`, name `reise_graph_kaskade_tiefe`. `reise_graph_geaendert()` remains SECURITY INVOKER. Trigger count remains 9.

The Technical Lead repaired the remote history so it matches that repository filename. Cursor did not apply or repair it. The repository file is unchanged. Statements that the migration is currently unapplied are historical task-creation state only.

## Production sequence

Do not start this sequence with a migration apply. After independent exact-head PASS:

1. exact-head PASS;
2. deploy the accepted `account-delete-v1` bundle to Production with `verify_jwt=true`;
3. verify the Function live, its version and its bundle;
4. integrate the app change deliberately;
5. post-merge CI and Production READY;
6. bounded synthetic Production account smoke. Never a real Production user.

## Read first

1. `lib/account/kontoloeschung-vertrag.ts` — `loeschUmgebungErlaubt()`
2. `lib/account/kontoloeschung.test.ts` — Production HTTPS allow, HTTP deny, Function URL, MFA still blocks deletion
3. `lib/account/kontoloeschung-direkt.ts` — Development proof still aborts on Production; not an activation switch
4. `app/account/settings/page.tsx` and `components/account/KontoLoeschen.tsx` — same contract, no second flag
5. ADR-0215 Nachtrag

## What the reviewer should check

1. Exact Production HTTPS is allowed. Production HTTP, Development HTTP, unknown `*.supabase.co`, arbitrary hosts and malformed URLs are denied.
2. The Function URL for exact Production HTTPS is `https://qscbgcdmivbbnzrcyegn.supabase.co/functions/v1/account-delete-v1`.
3. A valid mocked deletion on that URL is no longer `umgebung_gesperrt`. MFA/reauth/JWT/Storage/OAuth tests still pass. The request body is still only `{ confirmation: "KONTO LÖSCHEN" }`.
4. The graph-cascade migration file in the repository is unchanged. Live Production history is version `20260927230000`, name `reise_graph_kaskade_tiefe`, already applied.
5. No Production Function, user, secret, Auth, OAuth, indexing, provider or payment mutation is claimed for Cursor.
6. The current sequence starts at Function deploy after PASS, not at migration apply.

If the app change is integrated while `NEXT_PUBLIC_SUPABASE_URL` is the exact Production project and the Function is still absent, `/account/settings` will show the existing delete control. A submit reauthenticates and then fails closed. It does not delete the Auth user. The graph-cascade migration is already applied. This slice does not add a second flag.

## Do not

- Do not restart this writer for a new slice.
- Do not modify the accepted migration file.
- Do not deploy the Production Function from Cursor.
- Do not use the Development proof script against Production.
- Do not mark Ready or merge from Cursor.
