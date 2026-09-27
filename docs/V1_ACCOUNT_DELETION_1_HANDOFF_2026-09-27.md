# Jetnity – V1 Account Deletion 1 HANDOFF

Stand: 27. September 2026  
Status: **STOP FOR INDEPENDENT TECHNICAL-LEAD REVIEW**

Issue: #588  
Draft PR: #589  
Branch: `feat/v1-account-deletion-1`  
Binding task: `docs/V1_ACCOUNT_DELETION_1_TASK_2026-09-27.md`  
Base: `main@95e9da45ceeacbc8b461541f810a7c8011d2151a`

Cursor must not mark Ready, must not merge, and must not start a follow-up slice.

## Read next

1. `docs/V1_ACCOUNT_DELETION_1_TASK_2026-09-27.md`
2. `docs/V1_ACCOUNT_DELETION_1_STATUS_2026-09-27.md`
3. `docs/V1_ACCOUNT_DELETION_1_SELF_REVIEW_2026-09-27.md`
4. ADR-0215 in `DECISIONS.md`
5. Architecture section 4d

Do not treat this handoff as PASS. Do not edit `docs/ACTIVE_WORK_STATUS.md` from the agent. Do not touch #587.

## Owned surface

- `supabase/functions/account-delete-v1/index.ts`
- `supabase/config.toml` — `[functions.account-delete-v1] verify_jwt = true`
- `lib/account/kontoloeschung.ts`
- `lib/account/kontoloeschung-ausfuehren.ts`
- `lib/account/kontoloeschung-zustand.ts`
- `lib/account/kontoloeschung.test.ts`
- `components/account/KontoLoeschen.tsx`
- `app/account/settings/page.tsx`
- `app/(public)/konto-geloescht/page.tsx`
- `lib/account/datenexport.test.ts` — export section still says it is not deletion; the new section is separate
- ADR-0215 and architecture 4d

## Behaviour a reviewer should attack

- Body, query and nested `user_id` / email / role cannot select the target.
- Phrase match is exact, including `Ö`.
- Password check uses the verified user's email. A different returned user id does not delete.
- Verified TOTP + AAL1 stops. Verified TOTP + AAL2 may continue. Zero verified TOTP does not invent MFA.
- OAuth-only and phone/unknown providers fail closed.
- `deleteUser(id, false)` only. No second delete of `profiles`, `trips`, `account_travellers` or `account_visits`.
- `security_events` delete is `.eq('user_id', verifiedId)` after the auth delete. Error becomes residual, not `deleted`.
- Storage SQL is absent. Registry is empty. Storage-ownership Auth errors are not success.
- Logs go through `kontoLoeschungProtokoll`. Password, bearer, email, user id, factor id and service-role material are redacted.
- Stale authority: `proxy.ts` still uses `auth.getUser()` and denies `/account` when the user is missing.

## Open proof

Cursor did not deploy the function and did not delete a hosted user. Docker is down. The Technical Lead decides any Development deploy on the Development project and any disposable-account proof. Production project `qscbgcdmivbbnzrcyegn` stays read-only for this slice.

## Recommendation

Review this exact head. If it passes, deploy `account-delete-v1` only to Development and prove it with one disposable account. Do not activate it in Production. Any future user-upload feature must register its Storage prefix before launch.
