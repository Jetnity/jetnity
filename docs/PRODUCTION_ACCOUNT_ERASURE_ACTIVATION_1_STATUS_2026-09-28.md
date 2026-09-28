# Jetnity – Production Account Erasure Activation 1 STATUS

Stand: 28. September 2026  
Status: **R1/R2 CORRECTED / NOT A TECHNICAL-LEAD PASS / NOT READY / NOT MERGED / STOP FOR RE-REVIEW**

Issue: #592  
Draft PR: #597  
Branch: `feat/production-account-erasure-activation-1`  
Base: `main@a2645cfa622e272ee224b77d7c6478e84931fd84`  
Binding task: `docs/PRODUCTION_ACCOUNT_ERASURE_ACTIVATION_1_TASK_2026-09-28.md`  
Runtime contract commit: `2a2bc1d0afb1c30b972ffbbb7687540a91170a06`  
Superseded, not the review head: `2c39f7ba06794ac4f23ce5bbc470361ca50ff23c`, `494d4226fa84c7006146291b476a3777711156c2`, and `7cbf1c7bf400f3b354fdc4a0ca468766dd0f4e18`.  
Exact review head: the commit that contains this history clarification. Any later commit invalidates the gate.

Cursor-Agent: **Jetnity production account erasure activation 1**, Generation 1  
Required model: **Grok 4.7 High Fast** — confirmed (`originalModelName=grok-4.7-high-fast`)  
Session: `bc-27f20108-d06f-4bf1-b5d4-b9629f5a5b06`

No Ready. No Merge. No Production Function deploy. No follow-up slice.

## Live Production migration fact

The Production graph-cascade migration is **APPLIED** and independently verified on `qscbgcdmivbbnzrcyegn`. Current history version is `20260927230000`, name `reise_graph_kaskade_tiefe`. `reise_graph_geaendert()` remains SECURITY INVOKER. Trigger count remains 9.

The Technical Lead repaired the remote history so it matches that repository filename. Cursor did not apply the migration and did not repair the history. The repository file is unchanged (blob `6ca1a19c70958729f3bd6b9e57fa5ef2a07ebadd`). Wording that the migration was not yet applied is historical task-creation state only.

The Production Edge Function `account-delete-v1` is not deployed. No Production user was created or deleted by Cursor.

## Production sequence

Migration apply is not an open step. After an independent exact-head PASS the Technical Lead sequence is:

1. exact-head PASS;
2. deploy the accepted `account-delete-v1` bundle to Production with `verify_jwt=true`;
3. verify the Function live, its version and its bundle;
4. integrate the app change deliberately;
5. post-merge CI and Production READY;
6. bounded synthetic Production account smoke.

No real Production account is smoke evidence.

## What changed in the repository

`loeschUmgebungErlaubt()` allows the exact Production host `qscbgcdmivbbnzrcyegn.supabase.co` only over HTTPS. Exact Development HTTPS and the reviewed local HTTP hosts stay allowed, including Node's `[::1]` form of the existing loopback entry. Unknown `*.supabase.co` projects, arbitrary external hosts, malformed URLs, and Production or Development over HTTP stay denied.

`kontoloeschungFunktionsUrl()` returns `https://qscbgcdmivbbnzrcyegn.supabase.co/functions/v1/account-delete-v1` for that exact Production HTTPS origin. Settings and `KontoLoeschen` use the same function. No second flag was added.

Confirmation, reauth, MFA/AAL, JWT identity, Storage ownership, security-event deletion, Auth deletion order, OAuth fail-closed behavior and generic result classes are unchanged. `kontoloeschung-direkt.ts` still refuses Production before any network call.

## Changed files

- `lib/account/kontoloeschung-vertrag.ts`
- `lib/account/kontoloeschung.test.ts`
- `app/account/settings/page.tsx`
- `DECISIONS.md` (ADR-0215 and the 28 September Nachtrag)
- `docs/ACTIVE_WORK_STATUS.md`
- `docs/PRODUCTION_ACCOUNT_ERASURE_ACTIVATION_1_STATUS_2026-09-28.md`
- `docs/PRODUCTION_ACCOUNT_ERASURE_ACTIVATION_1_HANDOFF_2026-09-28.md`
- `docs/PRODUCTION_ACCOUNT_ERASURE_ACTIVATION_1_SELF_REVIEW_2026-09-28.md`
- `docs/PRODUCTION_ACCOUNT_ERASURE_ACTIVATION_1_TASK_2026-09-28.md` (task-creation state remains historical)
- `docs/CHATGPT_NEW_CHAT_CHECKPOINT_2026-09-28.md`

## Local gates

The commands below are the fresh local gates for this clarification commit. `2c39f7ba`, `494d4226`, and `7cbf1c7b` are not gated by this table. The binding evidence is the clean post-commit run of the commit that contains this clarification.

| Gate | Result |
| --- | --- |
| `npm test` | PASS — **4016** tests, 0 fail |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS — 0 errors, **145** warnings, none from this slice |
| `npm run check:dead` | PASS — 0 unwarranted orphans |
| `npm run check:exports` | PASS — 0 unwarranted exports |
| `npm run check:deps` | PASS |
| `npm run check:api-schutz` | PASS — 12 admin routes |
| `npm run check:schema-bezug` | PASS. Pre-existing note `admin_account_counts_v1` remains outside this slice |
| `npm run build` | PASS — includes `○ /konto-geloescht` |

## Cursor did not mutate Production

No Production migration was applied by Cursor. No Edge Function was deployed. No Production user was created or deleted. No secret, Auth, OAuth, indexing, provider or payment setting was changed. No Production deletion smoke was run.

## Browser

This environment was not pointed at Production Supabase. Visibility remains `loeschUmgebungErlaubt(process.env.NEXT_PUBLIC_SUPABASE_URL)`. Focused tests cover the allow/deny matrix and the exact Function URL.
