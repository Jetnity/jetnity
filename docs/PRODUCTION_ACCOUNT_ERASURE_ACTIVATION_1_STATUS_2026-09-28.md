# Jetnity – Production Account Erasure Activation 1 STATUS

Stand: 28. September 2026  
Status: **IMPLEMENTED / LOCAL EXACT-HEAD GATES BELOW / NOT A TECHNICAL-LEAD PASS / NOT READY / NOT MERGED / STOP FOR INDEPENDENT REVIEW**

Issue: #592  
Draft PR: #597  
Branch: `feat/production-account-erasure-activation-1`  
Base: `main@a2645cfa622e272ee224b77d7c6478e84931fd84`  
Binding task: `docs/PRODUCTION_ACCOUNT_ERASURE_ACTIVATION_1_TASK_2026-09-28.md`  
Previous stamp, not the review head: `2c39f7ba06794ac4f23ce5bbc470361ca50ff23c`  
Runtime contract commit: `2a2bc1d0afb1c30b972ffbbb7687540a91170a06`  
Exact review head: the commit that contains this reconciliation. It supersedes `2c39f7ba`. Any later commit invalidates the gate.

Cursor-Agent: **Jetnity production account erasure activation 1**, Generation 1  
Required model: **Grok 4.7 High Fast** — confirmed (`originalModelName=grok-4.7-high-fast`)  
Session: `bc-27f20108-d06f-4bf1-b5d4-b9629f5a5b06`

No Ready. No Merge. No Production Function deploy. No follow-up slice.

## Live Production migration fact

Technical Lead, 28 September 2026: Production migration `20260928123859_reise_graph_kaskade_tiefe` is **APPLIED** and independently verified on `qscbgcdmivbbnzrcyegn`. `reise_graph_geaendert()` remains SECURITY INVOKER. Trigger count remains 9.

That application is not a Cursor action. The repository file `supabase/migrations/20260927230000_reise_graph_kaskade_tiefe.sql` is unchanged (blob `6ca1a19c70958729f3bd6b9e57fa5ef2a07ebadd`). The task-creation statement that the migration was not yet applied is historical only.

The Production Edge Function `account-delete-v1` is still not deployed by Cursor. No Production user was created or deleted by Cursor.

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
- `docs/PRODUCTION_ACCOUNT_ERASURE_ACTIVATION_1_TASK_2026-09-28.md` (task-creation state labelled; later TL fact recorded)
- `docs/V1_ACCOUNT_ERASURE_1_STATUS_2026-09-27.md`
- `docs/V1_ACCOUNT_ERASURE_1_HANDOFF_2026-09-27.md`
- `docs/CHATGPT_NEW_CHAT_CHECKPOINT_2026-09-28.md`
- `docs/PROVIDER_ACCESS_READINESS_REFRESH_2026-09-28.md`

## Local gates

The table is the local run of this slice tree. The exact review head is the commit that contains the filled table. A clean post-commit rerun of the same commands is the binding check for that SHA; it is not a further commit when the results match.

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
