# Jetnity – V1 Account Erasure 1 – Binding Task

Stand: 27 September 2026
Issue: #588
Base: `main@95e9da45ceeacbc8b461541f810a7c8011d2151a`
Branch: `feat/v1-account-erasure-1`

## Authority

Product Owner approved #588:
- V1 semantics = immediate hard delete after fresh identity proof;
- Development implementation/proof is authorized;
- no Production user deletion;
- no Production migration/RLS/schema change.

## Required model

New Cursor agent/session: **Grok 4.7 High Fast**.
Do not use Auto.
If unavailable: STOP/report, do not substitute.

## Target

Implement the bounded V1 account-erasure path with:
- account settings UI;
- explicit irreversible confirmation;
- existing export prominently offered first;
- fresh reauthentication;
- MFA step-up if verified MFA exists and session is not AAL2;
- a narrow privileged Supabase Edge Function `account-delete-v1`;
- Development-only disposable-user acceptance proof.

## Security contract

The browser must NEVER submit an arbitrary target user_id.

The Edge Function must:
- require JWT;
- derive the acting/target user from the verified token/user;
- fail closed if identity cannot be verified;
- never expose/log service-role key, access token, raw auth headers, user email, storage paths, or tokenized URLs;
- perform no generic admin actions;
- accept only the minimal deletion request shape;
- return only a generic success/error class.

Deletion order:
1. verify authenticated current user;
2. delete user-owned Storage objects via Storage API, never SQL;
3. delete `security_events` linked to that exact user_id;
4. hard-delete exact Auth user with Admin Auth API;
5. rely on existing verified cascades for profiles/trips/travellers/visits;
6. client clears local session state and redirects outside /account.

No 30-day soft delete. No restore promise.

## Reauthentication

Reuse existing Jetnity security contracts where possible:
- password accounts: require fresh current-password or equivalent strong Supabase reauth proof;
- verified TOTP + current AAL1: require existing TOTP step-up semantics;
- OAuth-only future account: fail closed / unsupported until separately reviewed. OAuth is disabled today.

Do not weaken existing password/MFA behavior.

## UI

Under `/account/settings`:
- destructive section `Konto löschen`;
- clear permanent-deletion copy;
- link/button to existing JSON export;
- typed confirmation `KONTO LÖSCHEN`;
- explicit fresh-auth step;
- accessible disabled/loading/error states;
- never claim GDPR/CH-DSG compliance;
- no countdown/grace period.

## Development proof

Use Supabase Development project:
`yfvbxvijcorffwxbxahl` (branch `develop`).

Only disposable Development test user/data.

Must prove at minimum:
- wrong confirmation fails locally;
- missing/expired session fails closed;
- wrong password/reauth fails;
- verified-MFA path cannot bypass step-up;
- user-owned Storage object is deleted via Storage API before Auth deletion;
- linked security_event is removed;
- account graph rows cascade;
- stale token cannot regain account authority after deletion;
- second delete is honest not-found/no-session, never false success;
- unrelated user data untouched;
- no secret/token/path leakage in logs/evidence.

If the current Development branch schema/runtime is missing prerequisites, STOP and report. Do not patch Production.

## Testing / gates

- focused contract tests;
- full tests;
- typecheck;
- lint;
- build;
- repository hygiene;
- local/Development disposable acceptance;
- exact-head GitHub CI;
- Vercel Preview;
- no unresolved review threads.

## Hard exclusions

- no Production user deletion;
- no Production migration/RLS/schema mutation;
- no real-user acceptance test;
- no account-retention redesign;
- no payment/accounting work;
- no OAuth enablement;
- no public launch/indexing;
- no unrelated provider work;
- no global continuity edits.

## Governance

Cursor:
- does not mark Ready;
- does not merge;
- does not start follow-up;
- stops for independent Technical-Lead review.

Any head change invalidates exact-head gates.
