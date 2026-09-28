# Jetnity – Production Account Erasure Activation 1 STATUS

Stand: 28. September 2026  
Status: **IMPLEMENTED / LOCAL GATES PASS / NOT A TECHNICAL-LEAD PASS / NOT READY / NOT MERGED / STOP FOR INDEPENDENT REVIEW**

Issue: #592  
Draft PR: #597  
Branch: `feat/production-account-erasure-activation-1`  
Base: `main@a2645cfa622e272ee224b77d7c6478e84931fd84` (behind 0, ahead by the task commit plus this slice)  
Binding task: `docs/PRODUCTION_ACCOUNT_ERASURE_ACTIVATION_1_TASK_2026-09-28.md`  
Runtime commit covered by the local gates below: `2a2bc1d0afb1c30b972ffbbb7687540a91170a06`  
Exact review head: the tip of this branch that contains this STATUS, the HANDOFF and the SELF_REVIEW. `2a2bc1d0` is the runtime parent, not the review head. Any later commit invalidates the gate.

Cursor-Agent: **Jetnity production account erasure activation 1**, Generation 1  
Required model: **Grok 4.7 High Fast** — confirmed (`originalModelName=grok-4.7-high-fast`)  
Session: `bc-27f20108-d06f-4bf1-b5d4-b9629f5a5b06`

No Ready. No Merge. No Production Supabase mutation. No follow-up slice.

## What changed

`loeschUmgebungErlaubt()` now allows the exact Production host `qscbgcdmivbbnzrcyegn.supabase.co` only over HTTPS. Exact Development HTTPS and the reviewed local HTTP hosts stay allowed. Unknown `*.supabase.co` projects, arbitrary external hosts, malformed URLs, and Production or Development over HTTP stay denied.

`kontoloeschungFunktionsUrl()` therefore returns `https://qscbgcdmivbbnzrcyegn.supabase.co/functions/v1/account-delete-v1` for that exact Production HTTPS origin. Settings and `KontoLoeschen` still call the same function, so the delete UI is offered when the configured public Supabase URL is that origin.

No second flag was added. Confirmation, reauth, MFA/AAL, JWT identity, Storage ownership, security-event deletion, Auth deletion order, OAuth fail-closed behavior and generic result classes are unchanged. `kontoloeschung-direkt.ts` still refuses Production before any network call. Migration `supabase/migrations/20260927230000_reise_graph_kaskade_tiefe.sql` is byte-identical to the task parent (`git rev-parse` blob `6ca1a19c70958729f3bd6b9e57fa5ef2a07ebadd`).

Node reports IPv6 loopback as `[::1]`. The existing allowlist compared `::1` and never matched. The contract now accepts `[::1]` as that same reviewed local HTTP host. Hosted projects are unaffected.

## Local gates

Run on `2a2bc1d0` before this documentation commit. This documentation commit does not change runtime. It is not a substitute for GitHub CI or Vercel on the review tip.

| Gate | Result |
| --- | --- |
| `npm test` | PASS — **4016** tests, 0 fail |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS — 0 errors, **145** warnings, none introduced by this slice |
| `npm run check:dead` | PASS — 0 unwarranted orphans |
| `npm run check:exports` | PASS — 0 unwarranted exports |
| `npm run check:deps` | PASS |
| `npm run check:api-schutz` | PASS — 12 admin routes |
| `npm run check:schema-bezug` | PASS. Pre-existing note `admin_account_counts_v1` remains outside this slice |
| `npm run build` | PASS — includes `○ /konto-geloescht` |

GitHub Actions and Vercel Preview for the review tip were not claimed here. They must be read on the pushed tip. A green run on `2a2bc1d0` would not gate the documentation tip.

## Production non-mutation

Cursor did not apply a Production migration, deploy an Edge Function, create or delete a Production user, read or write Production secrets, change Auth/MFA/OAuth, change Vercel Production environment variables, or enable indexing. No Production deletion smoke was run.

## Browser

This environment was not pointed at Production Supabase. The settings page still decides visibility only through `loeschUmgebungErlaubt(process.env.NEXT_PUBLIC_SUPABASE_URL)`. There is no new screen to exercise without that Production URL. Focused tests cover the allow/deny matrix and the exact Function URL.
