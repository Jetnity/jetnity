# Jetnity – V1 Account Deletion 1 STATUS

Stand: 27. September 2026  
Status: **IMPLEMENTED ON DRAFT / LOCAL GATES PASS / HOSTED SUPABASE NOT DEPLOYED / CI AND PREVIEW PENDING THIS PUSH / NOT READY / NOT MERGED / STOP FOR TECHNICAL-LEAD REVIEW**

Issue: #588  
Draft PR: #589  
Branch: `feat/v1-account-deletion-1`  
Binding task: `docs/V1_ACCOUNT_DELETION_1_TASK_2026-09-27.md`  
Canonical base: `main@95e9da45ceeacbc8b461541f810a7c8011d2151a`  
Supabase Development: not deployed by Cursor  
Supabase Production: `qscbgcdmivbbnzrcyegn` — not mutated, no user deleted

Cursor-Agent: **Jetnity V1 account deletion 1**, Generation 1  
Required model: **Grok 4.7 High Fast** — this session is Grok 4.7. No Auto/substitution was used.

This file is point-in-time evidence. A newer head invalidates older exact-head gates. Agent self-review is not Technical-Lead PASS. `docs/ACTIVE_WORK_STATUS.md` was not edited.

---

## 1. What landed

Immediate hard-delete contract for the signed-in account:

- Settings section **Konto löschen**, separated from the existing JSON export. Export stays available before deletion. Copy states that account, trips, travellers and confirmed visits are removed permanently, with no undo and no grace period.
- Typed phrase exactly `KONTO LÖSCHEN`, fresh password, and a TOTP step-up only when a verified factor exists and the session is not AAL2.
- Narrow Edge Function `account-delete-v1` with `verify_jwt = true`. Target identity comes only from `auth.getUser()` on the bearer session. Caller `user_id` is rejected.
- Password proof runs inside that function against the verified email. The proof session is not returned. `signOut({ scope: 'local' })` is attempted on that temporary client.
- Auth admin `deleteUser(id, false)` only. Cascade-owned account/trip/traveller tables are not deleted again in application code.
- Linked `security_events` rows for that same user are removed afterwards. Failure is `deleted_security_events_residual`, not full success.
- Storage registry `KONTO_SPEICHER_FLAECHEN` is empty. Cleanup goes through the Storage API port only. An Auth error that reports storage ownership is `speicher_blockiert` and is not success. `jetnity-legacy-recovery` is not referenced.
- After a server outcome that means the account is gone, the client attempts local `signOut({ scope: 'local' })` and routes to `/konto-geloescht`, which is outside `/account`, `noindex`, and not in the public sitemap.
- OAuth-only and any non-password proof fail closed. OAuth stays disabled.

Traveller context: deletion applies to the whole account. Citizenship, document and residence do not change the result and are not collected.

## 2. Local gates

| Gate | Result |
| --- | --- |
| Focused `lib/account/kontoloeschung.test.ts` + `lib/account/datenexport.test.ts` | PASS |
| `npm test` | PASS — **3995** tests, 0 fail |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS — 0 errors, **145** warnings, none in the new deletion files |
| `npm run build` | PASS — `ƒ /konto-geloescht` present; `/account/settings` remains behind the proxy |
| `check:dead` | PASS — 0 ungrounded orphans |
| `check:exports` | PASS |
| `check:deps` | PASS |
| `check:api-schutz` | PASS |
| `check:schema-bezug` | PASS |
| `check:operating-mode` | PASS |

## 3. Not proven here

- The Edge Function was **not** deployed to hosted Development or Production.
- Docker is down and the Supabase CLI is not available, so there is no local disposable-account proof.
- No existing Production user was used.
- The signed-in settings form was not clicked through. Unauthenticated `/account/settings` returns **307** to `/login?next=/account/settings`.
- `/konto-geloescht`, `?stand=ereignisse` and `?stand=bereits` were read in the browser, including a 390px width. Screenshots and a short recording are agent artifacts, not a deletion of a real account.
- GitHub CI / Auth and Vercel Preview for this head are recorded after the push. They are not claimed in this paragraph.

## 4. Stop

No Ready. No merge. No follow-up slice. No #587 edit. Independent Technical-Lead review is next. Hosted Development deploy and one disposable-account proof stay with the Technical Lead.
