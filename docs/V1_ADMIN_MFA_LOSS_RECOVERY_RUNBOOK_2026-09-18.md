# Jetnity – V1 Admin MFA Loss Recovery Runbook

Stand: 18. September 2026  
Status: **DOCS-ONLY OPERATIONAL RUNBOOK / NO LIVE AUTH MUTATION / AAL2 REMAINS PERMANENT**

Issue: #459  
Draft PR: #460  
Source audit: #438 / merged PR #449 / finding 3.4 operational half  
Binding task: `docs/V1_ADMIN_MFA_LOSS_RECOVERY_RUNBOOK_1_TASK_2026-09-18.md`

This document describes a controlled recovery procedure. It does **not** execute that procedure. It does **not** by itself authorize a live factor deletion.

---

## 0. Two different MFA domains

These are not interchangeable. Using the wrong one is a hard STOP.

| Domain | What it protects | This runbook |
| --- | --- | --- |
| **Jetnity application-user MFA** | A user in Jetnity's Supabase **Auth project** (TOTP factor on that Auth user). Jetnity admin AAL2 is evaluated against that user's session. | In scope, after every verification step below. |
| **Supabase platform / operator-account MFA** | The human login that opens the Supabase Dashboard, organization, or billing account. | **Out of scope. This runbook cannot recover it and must never claim that it can.** |

If the locked-out secret is the operator's Supabase platform login, STOP. Use the platform vendor's own account-recovery channel. Do not delete Jetnity Auth factors as a substitute.

If it is unclear which domain was lost, STOP.

---

## 1. Trigger and scope

### 1.1 Use this runbook only when all of the following are true

1. The affected person is a **Jetnity application admin**: `profiles.role` is independently confirmed as at least `moderator` (`ADMIN_AREA_MINIMUM` in `lib/auth/roles.ts`).
2. That Auth user has a **verified TOTP** factor in the target Jetnity Auth project.
3. The user **lost access to the authenticator** that produces codes for that factor (device lost, app uninstalled, factor deleted from the authenticator, or equivalent).
4. The user therefore **cannot complete AAL2**. Jetnity admin access stays closed because the application guard and, where live, the admin data plane require `currentLevel === 'aal2'` / JWT `aal='aal2'`.
5. The user **cannot self-clear** the factor. Verified-factor unenroll in Jetnity (`/account/security`) requires a successful TOTP step-up to AAL2 (`lib/auth/account-mfa-step-up.ts`, ADR-0193). No backup codes, phone MFA, WebAuthn or in-product lockout recovery exist in the current repository.
6. There is **no suspicion** that the factor, device, password, mailbox or Auth account was stolen or otherwise compromised.
7. An authorized operator will use only the **current supported Supabase Auth Admin MFA** list/delete operations against the **already identified** user and factor.

### 1.2 Do not use this runbook when

- the lost factor belongs to a **consumer** (non-admin) account — consumer MFA recovery is a later follow-up, not this slice;
- the user has **no database admin role** and would only regain the break-glass shell;
- the target is a **Supabase platform/operator** factor;
- environment, user identity or factor ownership is uncertain;
- more than one verified factor exists and it is not independently clear which one was lost;
- anyone asks to skip AAL2, change RLS/roles/account status, add a second factor type, or build a recovery endpoint;
- the installed client or official Auth Admin MFA docs no longer support the operations documented here;
- compromise is suspected (use §8 instead).

### 1.3 Lost factor versus suspected compromise

| Situation | Path |
| --- | --- |
| Device/authenticator is gone or reset; password, mailbox and Auth account show no unexplained use | Continue this recovery path after §3–§4 verification. |
| Device/factor may be stolen; unexplained sign-ins; mailbox takeover; service-role or session-cookie exposure; unknown verified factors; requester cannot prove identity | **STOP this recovery path.** Go to §8. Factor deletion plus re-enrollment is not sufficient. |

`ADMIN_ALLOWED_EMAILS` break-glass is **not** a recovery path for this problem. It can open the admin shell only **after AAL2**, and it still does not reach the database (`reachesDatabase()` is false for `grant === 'break-glass'`; `NotzugangHinweis` is the honest UI). It cannot clear a lost TOTP factor.

---

## 2. Current repository truth used by this runbook

Verified against the current branch / installed packages. Stale audit line numbers were not copied as current truth.

### 2.1 Admin AAL2 is mandatory and permanent

- After identity and role/break-glass, `lib/auth/admin-guard.ts` loads `supabase.auth.mfa.getAuthenticatorAssuranceLevel()` and applies `applyAdminAal`.
- Only `currentLevel === 'aal2'` is sufficient (`lib/auth/admin-aal.ts`). `nextLevel`, factor existence, user metadata and a previous login do not grant access.
- AAL lookup failure is fail-closed (`aal-lookup-failed` / 503). AAL1 after an otherwise allowed grant is `aal2-required` (page redirect to `/admin/mfa`; API JSON 403).
- `/admin/mfa` is login-protected and outside the AAL2 page guard so step-up can run. Return targets are limited to internal admin paths (`erlaubtesAdminZiel`).
- After the client challenge, `bestaetigeAdminAal2Action` re-runs `evaluateAdminAccess` on the server.
- Break-glass does **not** bypass AAL2 (ADR-0169).
- Admin data-plane contract in `supabase/migrations/20260827170000_admin_aal2_data_plane_alignment.sql`: administrative capability = unchanged minimum role **AND** `auth.jwt() ->> 'aal' = 'aal2'` via `aktuelles_admin_aal2()`. Factor existence, `nextLevel`, metadata and break-glass do not satisfy it.

This runbook does not weaken that contract. After factor deletion the user is expected to be AAL1 until a **new** TOTP is enrolled and challenged. Admin access remains closed until then.

### 2.2 Enrollment and self-unenroll

- TOTP enroll/verify are enabled in `supabase/config.toml` (`auth.mfa.totp.enroll_enabled` / `verify_enabled` = true). Phone MFA and WebAuthn enroll/verify are disabled. `max_enrolled_factors = 5`.
- Admins enroll on the same consumer security surface: `ADMIN_MFA_EINRICHTUNG = '/account/security'` (`lib/auth/admin-aal.ts`).
- `AdminMfaStepUp` tells a user with no confirmed authenticator to enroll there and states that the admin area stays closed without a confirmed second factor.
- `darfTotpEinrichten` is true for an empty or already-ready TOTP list. Enrollment does not require current AAL2.
- Removing a **verified** factor through Jetnity requires AAL2 step-up. A user who lost the authenticator cannot complete that path.

### 2.3 Break-glass does not restore admin data

- `decideAdminAccess` may grant `break-glass` from an exact email in `ADMIN_ALLOWED_EMAILS`.
- `reachesDatabase()` is true only for `grant === 'role'`.
- Writes are denied (`adminWriteErlaubt` / `admin_break_glass_write_denied`).
- The shell shows `NotzugangHinweis`: lists stay empty and changes are rejected. Empty is not “nothing happened”.

Therefore recovery is complete only when the user again reaches **role-backed** admin access at AAL2, not when a break-glass banner is visible.

### 2.4 Installed Auth Admin MFA surface

Installed lockfile:

- `@supabase/supabase-js` **2.57.2**
- `@supabase/auth-js` **2.71.1**

Current Admin MFA API on `GoTrueAdminApi.mfa`:

| Operation | Installed signature | Effect |
| --- | --- | --- |
| List | `auth.admin.mfa.listFactors({ userId })` | Returns `{ factors }` for that Auth user. `userId` is required and UUID-validated. |
| Delete | `auth.admin.mfa.deleteFactor({ id, userId })` | Deletes that factor. Installed types: deleting a **verified** factor logs the user out of **all active sessions**. Both IDs are UUID-validated. |

HTTP operations used by the installed client:

- `GET /admin/users/<userId>/factors`
- `DELETE /admin/users/<userId>/factors/<id>`

These require a **server-side** client constructed with the **service_role** key of the **exact target Auth project**. Never put that key in the browser, the repository, chat, tickets or CI logs.

Supporting identity read (not a substitute for `listFactors`):

- `auth.admin.getUserById('<JETNITY_AUTH_USER_UUID>')` — confirm email and id. The `User` type may include `factors`, but this runbook still requires the dedicated Admin MFA list before any delete.

The installed types mark `GoTrueAdminMFAApi` as `@expermental` (upstream spelling). Official docs currently document the same methods. The experimental tag is not a license to invent another API. If a later SDK or official doc removes, renames or changes these operations, **STOP** and re-verify before any live use.

### 2.5 Official docs cross-check (agent verification, 18 September 2026)

Fetched and compared with the installed types:

- https://supabase.com/docs/reference/javascript/auth-admin-deletefactor — `deleteFactor(params)` / `AuthMFAAdminDeleteFactorParams`; documented effect: deleting a factor logs the user out of all active sessions if the deleted factor was verified. Example uses `{ id, userId }`.
- https://supabase.com/docs/reference/javascript/auth-admin-listfactors — `listFactors(params)` / `AuthMFAAdminListFactorsParams`. Purpose: list all factors associated to a user.
- https://supabase.com/docs/guides/auth/auth-mfa — user-level enroll / `unenroll` / `listFactors` / AAL1 vs AAL2. User-level `unenroll` is **not** the recovery operation (the locked-out admin cannot reach AAL2). Admin list/delete is the supported privileged path.

No contradiction that would make the safe administrative operation uncertain: method names, admin namespace, required user/factor identifiers and verified-factor session invalidation agree. The installed typed `listFactors` **requires** `{ userId }`. Use that form. Do not call the admin method without `userId`.

User-level `supabase.auth.mfa.listFactors()` / `unenroll({ factorId })` are a different API (current session). They are not this runbook's privileged operation.

---

## 3. Authority

### 3.1 Who may perform the privileged operation

Only a human operator who already has authorized access to the **service_role** (or equivalent Auth Admin privilege) for the **exact target Jetnity Auth project**, acting under current Product-Owner / Technical-Lead authority.

- Cursor agents, Guardian and this document **do not** perform the deletion.
- The locked-out admin **does not** perform the privileged call.
- A Jetnity application admin session, break-glass shell or `/account/security` UI is **not** sufficient privilege for this operation.

### 3.2 Live execution is a later gate

Writing this runbook is docs-only and ungated.

A later **live** `deleteFactor` against Production Auth is a Production Auth / MFA mutation and remains a **special Product-Owner gate**. A live call against Development Auth also needs explicit environment confirmation and current authorization. This slice does not grant either.

If authorization is missing, expired, informal, or “just use the service role because we have it”, STOP.

### 3.3 Dual control

If a second authorized person is available, they should confirm environment, user id, email and factor id **before** the delete is sent. If no second person exists, the single operator must still complete every verification step in writing and must not skip list/identify.

---

## 4. Verification before any delete

Do these in order. Any failure is STOP, not a workaround.

### 4.1 Environment

Independently confirm:

1. Intended target: Production or Development — named by the requester and by the operator, not inferred from habit.
2. Auth **project ref** and API URL of that environment. The documented Production ref in repository continuity is `qscbgcdmivbbnzrcyegn`. Treat that as a hint to confirm, not as a value to type from memory if the live secret store or Dashboard shows something else.
3. The service_role (or Auth Admin credential) belongs to **that same** project.
4. The project is the **Jetnity application Auth** project, not a personal/demo project and not a Supabase platform login.
5. You are not pointed at the opposite environment.

If any of those is uncertain, STOP.

### 4.2 Affected Auth user

Independently confirm **both**:

- exact email (normalized lowercase, full address, no domain-only match);
- exact Auth user UUID (`auth.users.id`).

Then, in the authorized secure operator environment only:

```js
const { data, error } = await supabase.auth.admin.getUserById('<JETNITY_AUTH_USER_UUID>')
```

Proceed only when `error` is null, `data.user.id` equals the intended UUID, and `data.user.email` equals the independently confirmed email.

Do not guess UUIDs. Do not pick a similar email. `listUsers` is paginated; a first-page hit is not identity. If `getUserById` and the confirmed email disagree, STOP.

Separately confirm `profiles.role` for that same `user_id` is a known admin role (`moderator` or higher). If the role is missing, unknown, or only break-glass would apply, STOP: deleting the factor cannot restore database-backed admin access.

### 4.3 Factors — list before any delete

```js
const { data, error } = await supabase.auth.admin.mfa.listFactors({
  userId: '<JETNITY_AUTH_USER_UUID>',
})
```

Record, without secrets:

- each `id`;
- `factor_type` (current truth; do not prefer a legacy `type` field);
- `status` (`verified` / `unverified`);
- optional `friendly_name` if it is not a secret;
- `created_at` / `updated_at`.

Identify the **exact** lost factor:

- `id` is a UUID you did not invent;
- `factor_type === 'totp'` (phone/WebAuthn are disabled in current Jetnity config; an unexpected type is STOP);
- `status === 'verified'` for the lost authenticator that currently blocks AAL2;
- the factor was returned for this `userId` and no other.

If `listFactors` fails, returns no factors, or the intended id is absent, STOP. Do not delete from memory, logs, or `User.factors` alone.

If more than one **verified** TOTP exists and the requester/operator cannot independently say which id was lost, STOP.

Do not delete unrelated factors. Do not delete every factor “to be safe”. Do not delete unverified leftovers unless they are independently confirmed as the same intended enrollment artifact; when unsure, leave them.

---

## 5. Controlled recovery (documented operation only)

This section is the only privileged mutation this runbook permits to be **described**. This slice does not run it.

Placeholders only. Privileged credentials stay in the authorized secure operator environment and never enter git, chat, tickets, screenshots or CI logs.

```js
// PLACEHOLDER — authorized secure operator environment only.
// Do not paste real project refs if that would identify a non-public secret
// mapping, service-role keys, tokens, passwords, OTPs, TOTP seeds, QR secrets
// or cookies into any repository or ticket.
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://<TARGET_PROJECT_REF>.supabase.co',
  '<SERVICE_ROLE_KEY_FROM_SECURE_OPERATOR_STORE>',
)

const userId = '<JETNITY_AUTH_USER_UUID>'
const factorId = '<FACTOR_UUID>'

const user = await supabase.auth.admin.getUserById(userId)
// STOP unless user.data.user.id and user.data.user.email match the intended admin.

const listed = await supabase.auth.admin.mfa.listFactors({ userId })
// STOP unless listed.data.factors contains exactly the intended factor
// { id: factorId, factor_type: 'totp', status: 'verified' } for this userId.

const deleted = await supabase.auth.admin.mfa.deleteFactor({
  id: factorId,
  userId,
})
// STOP unless deleted.error is null and deleted.data.id === factorId.
```

If a Dashboard UI on the **same confirmed project** offers deletion of that **already listed** factor, it is usable only when the operator can confirm it is the same Auth Admin deletion (`DELETE /admin/users/<userId>/factors/<id>`). If that is not confirmable, do not click around. Use the documented API in the secure operator environment, or STOP.

### 5.1 Expected session invalidation

Installed types and official `deleteFactor` docs: deleting a **verified** factor logs the user out of **all active sessions**.

The user must sign in again. Existing JWTs/cookies must not be treated as still valid for admin work. Do not copy, print or store those cookies.

### 5.2 What must not be changed

No role change, account-status change (`active|pending|disabled|banned`), RLS/policy edit, Auth config change, AAL2 bypass, second factor type, backup codes, recovery endpoint, or “temporary” service-role admin session in the Jetnity app.

---

## 6. Re-establishment — recovery is incomplete until all of these pass

After a later authorized delete (not in this slice):

1. **Sign-in.** The user signs in again with password (or the existing Jetnity sign-in method) at `/login` or `/admin/login`. Expect AAL1. Admin login keeps an AAL1-capable admin session for step-up (`entscheideAdminLoginFortgang`); it does not grant the admin area.
2. **New TOTP enrollment.** The user opens `/account/security` and enrolls a **new** TOTP through the existing Jetnity flow. Complete verify so the new factor is `verified`. Do not reuse a seed from the lost device. Do not paste the QR secret into tickets or git.
3. **AAL2 verification.**
   - Consumer security / `getAuthenticatorAssuranceLevel()`: `currentLevel === 'aal2'`.
   - Admin: `/admin/mfa` challenge succeeds and `bestaetigeAdminAal2Action` redirects into `/admin` (or another allowed admin path).
   - A later `/admin` load does not bounce to `/admin/mfa` with `aal2-required`.
4. **Normal database-backed admin access — read-only / non-mutating.**
   Recovery validation must not create, update or delete application data. No test write is required or permitted merely to prove the data plane.
   - Grant is `role`, not `break-glass`.
   - `NotzugangHinweis` is **absent**.
   - Use an **existing** capability-gated admin **read** (or another non-mutating role-backed data-plane check) that this role already had. Do not invent a write, refund, block, unblock, settings change or other mutation as a probe.
   - Distinguish the three honest outcomes of that read:
     - authorized rows/content → role-backed data plane is working;
     - honest empty (the query succeeded and there is nothing to show) → still role-backed; empty is not denied;
     - denied / lookup-failed / error (including the known break-glass empty-because-RLS-denied pattern) → recovery is **not** complete.
   - Do **not** attempt a write to distinguish empty from denied. Do not treat `admin_break_glass_write_denied` as a required recovery check.
   - Where `aktuelles_admin_aal2()` is live, the session JWT must carry `aal='aal2'`. If live data-plane AAL2 presence for that environment is uncertain, record **unknown** and do not claim data-plane recovery. Do not “fix” that uncertainty by altering RLS or by writing a probe row.

If any check fails, recovery is **not complete**. Do not announce restored admin access. Do not leave the user on break-glass as a substitute.

---

## 7. Evidence record

Keep an operator record **outside** this repository unless a later authorized process says otherwise. If a subset is later persisted in git, it must contain **no secrets**.

Record:

- date and time (UTC);
- target environment and independently confirmed project ref;
- operator and requester identifiers (names/roles, not credentials);
- Auth user UUID and email;
- factor id, `factor_type`, `status`, and list snapshot **before** action;
- supported operation used (`auth.admin.mfa.deleteFactor` with `id` + `userId`, or confirmed same HTTP delete);
- outcome (success with returned factor id, or honest failure);
- session-invalidation observation (user had to sign in again: yes/no/unknown);
- new enrollment completed (yes/no) — never the seed/QR;
- AAL2 verification result;
- database-backed admin verification result;
- stop/compromise branch used, if any.

Never persist or paste:

- service-role keys;
- access/refresh tokens;
- passwords;
- OTPs / TOTP codes;
- TOTP seeds, `otpauth` URLs or QR secrets;
- session cookies;
- screenshots that contain any of the above.

Record failures honestly. A failed delete, a mismatched email, or an unverified AAL2 check is evidence, not an embarrassment to omit.

---

## 8. Compromise branch

If the device/factor may be stolen or the Auth account, mailbox, password or privileged credential may be compromised:

1. **STOP** the normal recovery path. Do not delete-and-re-enroll as if this were a simple loss.
2. Do not invent a Jetnity incident process here. Finding **5.5** (audit #438 / PR #449) is the still-missing incident/alerting/escalation process. Hand off to that **future** process and to the current Product Owner / Technical Lead.
3. Until that process exists, the only honest action this runbook authorizes is: **do not proceed**, preserve what can be preserved without copying secrets into git, and escalate to the Product Owner and Technical Lead for credential review.
4. Factor deletion alone, role changes, account-status flips and AAL2 bypass remain forbidden shortcuts.

---

## 9. Fail-closed STOP conditions

STOP immediately when:

| Condition | Why |
| --- | --- |
| Uncertain environment (prod vs dev, project ref, credential mapping) | Wrong-project delete is irreversible for that user. |
| Uncertain user identity (email/UUID mismatch or guessed id) | May destroy another person's factor. |
| Uncertain factor ownership (id not in this user's `listFactors`) | Same. |
| Multiple verified factors and unclear intent | May delete the factor the user still has. |
| Missing privileged authorization / missing Product-Owner gate for live Production Auth mutation | Governance and blast radius. |
| Installed client or official Auth Admin MFA docs removed, renamed or disagree so the safe operation is uncertain | Do not invent a replacement API. |
| Request to bypass AAL2 or to alter RLS, roles, grants or account status | Permanent security contract. |
| Evidence of wider compromise | §8. |
| Target is Supabase platform-account MFA | Wrong domain. |
| User has no database admin role | Delete cannot restore the data plane. |
| Unexpected phone/WebAuthn/other factor types | Current Jetnity config does not enroll them. |
| Anyone asks for a recovery script, endpoint, Edge Function or second factor type | Out of scope; new Auth/MFA contract. |
| Secrets would have to be written into git, chat or tickets to continue | Stop rather than leak. |

After STOP: do not continue with a “smaller” mutation. Re-verify or escalate.

---

## 10. Forbidden shortcuts

- Using break-glass as “recovered admin access”.
- Softening application or data-plane AAL2 “temporarily”.
- Adding backup codes, SMS, WebAuthn or passkeys in this procedure.
- Disabling MFA in Auth config.
- Deleting the Auth user or rotating the user id.
- Promoting another account instead of recovering the intended admin, unless that is a separately authorized identity decision (not this runbook).
- Running the placeholder example from this repository, a CI job, Preview or a Cursor agent.
- Creating, updating or deleting any application row merely to prove that admin access returned.

---

## 11. What this document does not claim

- It does not claim a live factor was deleted.
- It does not claim Production or Development Auth was mutated by this slice.
- It does not resolve the existing repository contradiction about whether Production currently has `aktuelles_admin_aal2()` (`docs/AUTH.md` vs the 27 August 2026 Production apply evidence / finding 3.3). Operators must treat live data-plane AAL2 as **verify-in-environment** and record unknown if they cannot read it.
- It does not close consumer MFA recovery, finding 5.5, support process, or Auth-config Production parity.
- It does not recover a lost Supabase platform-account factor.

---

## 12. Traveller context

Not applicable. This runbook does not collect, infer or present citizenship, documents, residence or route facts.
