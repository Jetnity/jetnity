# Jetnity – V1 Account Deletion 1 — Binding Task

Stand: 27. September 2026  
Status: **VERSIONED IMPLEMENTATION TASK / DEVELOPMENT-ONLY / NO PRODUCTION USER DELETE**

Issue: #588  
Branch: `feat/v1-account-deletion-1`  
Base: `main@95e9da45ceeacbc8b461541f810a7c8011d2151a`  
Supabase Development branch: `develop` / project ref `yfvbxvijcorffwxbxahl`  
Supabase Production: `qscbgcdmivbbnzrcyegn` — **READ-ONLY FOR THIS SLICE**

Cursor-Agent: **Jetnity V1 account deletion 1**  
Generation: **1**  
Required model: **Grok 4.7 High Fast** — no Auto/substitution.

## 1. Product-Owner decision

#588 is approved for:
- immediate irreversible V1 hard-delete semantics;
- bounded implementation and Development proof;
- disposable Development test account only.

Not approved:
- deleting any existing Production account;
- deploying/activating the delete Edge Function in Production;
- Production migration/RLS/schema changes;
- public launch/indexing;
- OAuth activation;
- general retention changes.

#587 / AGB is HOLD and unrelated. Do not touch it.

## 2. Current verified truth

Read-only Production evidence already established:
- `profiles.user_id`, `trips.user_id`, `account_travellers.user_id`, `account_visits.user_id` → `auth.users` ON DELETE CASCADE;
- trip/traveller child graph cascades through its parents;
- Supabase Auth identities/sessions/MFA rows cascade from `auth.users`;
- `security_events.user_id` is nullable and has no auth-user FK;
- Storage owner fields have no auth-user FK;
- current Production has 0 user-owned Storage objects and 0 security_events rows with a user_id;
- only current Storage bucket is private `jetnity-legacy-recovery`, with one unowned object;
- Supabase docs: Auth user delete fails if user owns Storage objects; Storage objects must be removed through Storage API, never SQL; already-issued JWT may remain cryptographically valid until expiry.

Existing account settings already expose the V1 JSON data export.

## 3. Required user experience

Under `/account/settings`, add a clearly separated destructive section:
- title: Konto löschen;
- honest irreversible explanation: account, trips, travellers and confirmed visits are permanently removed;
- link/button to existing `/api/account/export` before deletion;
- typed destructive phrase exactly `KONTO LÖSCHEN`;
- require fresh password proof for current email/password accounts;
- if a verified TOTP factor exists and current session is not AAL2, require a fresh TOTP step-up before deletion;
- OAuth-only or otherwise unsupported identity proof must fail closed; OAuth is currently disabled;
- no undo/grace-period promise;
- after confirmed success, clear local session and route outside `/account` with an honest success state.

Do not expose raw provider/security errors or secrets.

## 4. Privileged boundary

Implement a single narrow Supabase Edge Function source:
`supabase/functions/account-delete-v1/**`

Deployment config must require JWT verification.

The function:
- never accepts a target `user_id`, email, role or account identifier from the caller as deletion authority;
- derives current identity from the bearer session and independently verifies it;
- may accept only the minimum proof inputs required for this operation, such as current password and exact typed confirmation;
- never logs password, Authorization, JWT, service-role key, email, user ID, factor/challenge IDs or token-bearing URLs;
- uses server-only service-role capability only inside this function;
- exposes no general admin client/API;
- hard-deletes, not soft-deletes;
- fails closed on unknown/unsupported auth state.

### Fresh password proof

Do not trust UI-only proof.

The privileged function itself must verify the submitted current password against Supabase Auth using the verified current user's email and a non-persistent server-side auth client. The returned identity must equal the bearer-authenticated user. Any temporary reauth session/token must not be persisted or exposed.

### MFA

Using the caller's authenticated session:
- detect verified TOTP factors;
- if at least one verified TOTP factor exists, require current AAL2;
- client may perform the existing Supabase TOTP challenge/verify flow before invoking deletion;
- never downgrade or bypass MFA;
- do not create a global consumer-AAL2 requirement outside this destructive action.

## 5. Storage safety

Never delete Storage rows with SQL.

Current Jetnity has no user-owned Storage product surface. Do not invent a broad expensive scan or pretend ownership can be inferred from object names.

Required V1 contract:
- model Storage cleanup behind a narrow, testable port/helper;
- support only explicitly registered Jetnity account-owned Storage surfaces/prefixes;
- the registry is currently empty unless live code proves a current user-owned surface;
- if Supabase Auth delete reports that Storage ownership blocks deletion, return a specific fail-closed internal classification and **do not claim account deletion succeeded**;
- document that any future user-upload feature MUST register its cleanup contract before launch;
- do not touch `jetnity-legacy-recovery` merely because it exists; current evidence says its object is unowned.

If you find a safe official Storage-API mechanism that can enumerate exact owner_id without a schema/migration/new privileged DB path, you may use it, but prove it with current Supabase documentation and tests. Otherwise keep the bounded registry/fail-closed contract above.

## 6. Security-events residual

`security_events.user_id` is not cascade-bound.

For V1 this task may remove rows linked to the deleting user with service-role DB access because no approved retention basis exists for keeping user-linked rows.

Failure semantics must be explicit. Do not silently report full deletion if a user-linked residual remains. Prefer sequencing that minimizes retained personal data without pretending cross-service atomicity exists.

No generic retention framework.

## 7. Auth-user deletion

Use Supabase Admin Auth hard delete for the exact verified current user only.

Rely on the verified FK cascades for the Jetnity account/trip/traveller/visit graph. Do not manually duplicate those deletes in app code.

After deletion:
- do not rely on local JWT payload alone;
- normal protected routes already use `auth.getUser()`; preserve that contract;
- client must clear local auth state/cookies as far as the existing SSR/session APIs allow;
- stale-token tests must show deleted authority cannot re-enter normal protected/user-owned flows.

## 8. Implementation structure

Keep logic small and testable.

Expected owned surface (adjust minimally if architecture proves a better split):
- `supabase/functions/account-delete-v1/**`
- one small `lib/account/**` deletion contract/state module;
- one focused client component/action under account settings;
- `app/account/settings/page.tsx`
- focused tests;
- slice-specific docs:
  - `docs/V1_ACCOUNT_DELETION_1_STATUS_2026-09-27.md`
  - `docs/V1_ACCOUNT_DELETION_1_HANDOFF_2026-09-27.md`
  - `docs/V1_ACCOUNT_DELETION_1_SELF_REVIEW_2026-09-27.md`

Do not edit global continuity `docs/ACTIVE_WORK_STATUS.md` from the agent.

## 9. Required tests

At minimum lock:
- no caller-supplied user ID can choose deletion target;
- exact destructive phrase required;
- missing/incorrect password fails;
- reauthenticated identity mismatch fails;
- OAuth-only/unsupported proof fails closed;
- verified TOTP + AAL1 fails;
- verified TOTP + AAL2 may proceed;
- no verified TOTP does not invent an MFA requirement;
- service-role secret/password/token cannot appear in response/log helper;
- hard delete only; no soft delete;
- no manual duplicated delete of cascade-owned account/trip/traveller tables;
- linked `security_events` cleanup contract;
- Storage cleanup uses Storage API adapter, never SQL;
- unknown user-owned Storage causes honest fail-closed behavior, not success;
- second/replayed deletion is honest/not-found and cannot target another account;
- settings page offers data export before deletion and clearly states permanence;
- success routes out of account and local session cleanup is attempted;
- stale-token authorization path fails after user no longer exists;
- existing data-export/security/account tests remain green.

## 10. Development proof boundary

Cursor must NOT deploy to hosted Production or Development Supabase.

Cursor should:
- implement source + deterministic/unit tests;
- if Docker/local Supabase is available, a local disposable proof is allowed;
- if real hosted Development credentials/user setup are unavailable, STOP with exact evidence instead of inventing success.

After independent TL exact-head PASS, the Technical Lead will decide and execute any hosted Development Edge Function deployment + disposable-account proof using project `yfvbxvijcorffwxbxahl`.

No existing real Production user may be used as acceptance evidence.

## 11. Gates

Run:
- focused tests;
- full test suite;
- typecheck;
- lint;
- build;
- repository hygiene gates;
- fresh exact-head GitHub CI/Auth;
- fresh Vercel Preview;
- report GitHub/Vercel review threads.

Any new head invalidates prior exact-head gates.

## 12. Governance

- Do not mark Ready.
- Do not merge.
- Do not deploy Production.
- Do not deploy hosted Supabase from Cursor.
- Do not start follow-up work.
- Do not touch #587.
- STOP FOR INDEPENDENT TECHNICAL-LEAD REVIEW.
