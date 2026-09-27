# Jetnity – V1 Account Deletion 1 SELF-REVIEW

Stand: 27. September 2026  
Status: **AGENT SELF-REVIEW — NOT A TECHNICAL-LEAD PASS**

Issue: #588  
Draft PR: #589  
Branch: `feat/v1-account-deletion-1`

This document cannot replace an independent Technical-Lead PASS.

## 1. Attacks considered

| Attack | Result |
| --- | --- |
| Caller-supplied `user_id`, email or role chooses the victim | Rejected before any delete. Identity is `auth.getUser()` on the bearer. |
| UI-only password check | Rejected. The function calls `signInWithPassword` and requires the returned id to match. |
| Verified TOTP bypass at AAL1 | Rejected with `aal2_erforderlich`. No global consumer AAL2 rule was added. |
| OAuth-only delete without a password | Fail closed. OAuth remains disabled. |
| Soft delete or a second manual wipe of cascaded tables | `deleteUser(id, false)` only. Those tables are not named in the function. |
| Storage rows deleted with SQL, or `jetnity-legacy-recovery` touched | Storage API port only. Registry is empty. That bucket name is absent from the function. |
| Auth "database error" treated as success or as storage | Classified as failure. Only storage-ownership wording or `storage_owner_delete_blocked` is `speicher_blockiert`. |
| Residual `security_events` reported as full deletion | HTTP 500 `deleted_security_events_residual`. |
| Replay deletes a different account | A body id is rejected. A missing session does not delete. `not_found` still uses the verified id only. |
| Secrets in the response or log helper | Redaction test covers password, JWT, email, user id, factor id, challenge id and service-role material. |
| Public indexing of the result page | `robots: { index: false, follow: false }`. Path is not in `SITEMAP_OEFFENTLICHE_PFADE`. |
| Production user delete or hosted deploy from Cursor | Not done. |
| Ready or merge | Not done. |
| Edit #587 or `docs/ACTIVE_WORK_STATUS.md` | Not done. |

## 2. Residual risks

- Auth delete and `security_events` cleanup are not one transaction. A crash between them can leave linked rows. The response must not claim full success when the cleanup call fails; a crash that never returns is still a residual.
- The proof `signInWithPassword` creates a server session. Local sign-out is best-effort. If that logout fails and the later auth delete also fails, a short-lived proof session can remain until expiry. It is not returned to the client.
- An already issued access token can stay cryptographically readable until expiry. Protected routes use `auth.getUser()`. A deleted user must not pass that check. This was locked with the proxy contract, not with a live deleted user.
- Unknown storage ownership is visible only when Auth reports it, or when a future registered prefix cannot prove `owner`. There is no bucket-wide scan.
- A generic Auth database error is not relabelled as storage. A real storage block with an undocumented message would be `loeschung_fehlgeschlagen`, still not success.
- The signed-in form and the hosted function were not exercised. Preview can render the page; it cannot delete an account until the function exists on that Supabase project.
- Lint still reports 145 existing warnings. The new files added none.

## 3. Recommendation

Do not Ready and do not merge from this review. Re-review the exact head after its own CI and Vercel Preview. Deploy and prove the function only on Development, with a disposable account, after PASS.
