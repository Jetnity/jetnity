# Jetnity – V1 Admin MFA Loss Recovery Runbook 1 Task

Stand: 18. September 2026  
Status: **IMPLEMENTATION DELIVERED / DOCS-ONLY / NO AUTH OR PRODUCTION MUTATION / STOP FOR TECHNICAL-LEAD REVIEW**

Issue: #459  
Source audit: #438 / merged PR #449 / finding 3.4 operational half  
Standing authorization: #440  
Canonical base: `main@88382ce0ef1d01b1cb32677fa48dfde71b5055d1`

Branch: `docs/v1-admin-mfa-loss-recovery-runbook-1`

Cursor-Agent: **Jetnity V1 admin MFA loss recovery runbook 1**  
Generation: **1**  
Required parent model: **Cursor Grok 4.6 High Fast**

Do not use Auto. If Cursor Grok 4.6 High Fast is unavailable, stop and report instead of silently substituting.

---

## 1. Verified problem

The V1 Account / Privacy / Operations audit finding 3.4 records an operational P0:

- Jetnity admin access is hard-gated on AAL2;
- an admin who loses the only verified TOTP factor has no in-product path to clear that factor;
- the existing Jetnity admin break-glass shell does not restore database-backed admin access;
- there is no persisted recovery runbook.

This slice closes only the **operational runbook** half. It does not implement a new MFA mechanism.

## 2. Current external API evidence to re-verify

Current official Supabase documentation, checked by the Technical Lead at dispatch, documents an Auth Admin MFA operation that deletes a factor for a user and states that deleting a verified factor logs the user out of active sessions.

Relevant official references:
- https://supabase.com/docs/reference/javascript/auth-admin-deletefactor
- https://supabase.com/docs/reference/javascript/auth-admin-listfactors
- https://supabase.com/docs/guides/auth/auth-mfa

Do not copy a method signature blindly. Verify it against:
1. the currently installed Supabase client version / types in this repository; and
2. current official Supabase docs available to the agent.

If those disagree or the exact safe administrative operation cannot be established, STOP and report.

## 3. Product / security goal

Create a security-first operational runbook for recovering a **Jetnity application admin account** after loss of its verified TOTP factor, while preserving the permanent AAL2 requirement.

The runbook must explicitly distinguish:
- Jetnity application-user MFA stored in Jetnity's Supabase Auth project; from
- MFA protecting a Supabase platform/operator account.

This runbook must never claim it can recover a lost Supabase platform-account factor.

## 4. Required runbook contract

Create one canonical runbook document. It must cover, at minimum:

### Trigger / scope
- exact conditions for use;
- conditions where the runbook must not be used;
- lost-factor recovery versus suspected compromise.

### Authority / verification
- who is permitted to perform the privileged operation;
- explicit target environment verification;
- affected Jetnity Auth user identity verification;
- no guessing user IDs or factor IDs;
- verify the selected factor belongs to the exact intended user before deletion.

### Controlled recovery
- use only a current supported Supabase Auth Admin MFA operation;
- list/identify factors before deleting anything;
- delete only the intended lost factor;
- explain expected session invalidation;
- no deletion of unrelated factors;
- no role/account-status/RLS/policy changes as a shortcut.

### Re-establishment
- user signs in again after session invalidation;
- user enrolls a new TOTP through Jetnity's existing account security flow;
- verify AAL2 is restored;
- verify normal database-backed admin access works again;
- recovery is not complete before those checks pass.

### Evidence / security
- record date/time, environment, operator/requester, user identifier, factor identifier/status before action, supported operation used, outcome, AAL2 verification, and admin data-plane verification;
- never persist service-role keys, access tokens, passwords, OTPs, TOTP seeds/QR secrets or session cookies in repository evidence;
- record failures honestly.

### Compromise branch
If the device/factor may be stolen or the account may be compromised, factor deletion/re-enrollment alone is insufficient. The runbook must STOP the normal recovery path and escalate to incident handling / credential review. Do not invent an incident process that belongs to finding 5.5; clearly hand off to that future process.

### Stop conditions
Include fail-closed STOP conditions for:
- uncertain environment;
- uncertain user identity;
- uncertain factor ownership;
- unexpected multiple verified factors where intent is unclear;
- missing privileged authorization;
- unsupported/changed Supabase admin API;
- any request to bypass AAL2 or alter RLS/roles;
- evidence of wider compromise.

## 5. Allowed write scope

Only:
- `docs/V1_ADMIN_MFA_LOSS_RECOVERY_RUNBOOK_1_TASK_2026-09-18.md`
- `docs/V1_ADMIN_MFA_LOSS_RECOVERY_RUNBOOK_2026-09-18.md`
- `docs/V1_ADMIN_MFA_LOSS_RECOVERY_RUNBOOK_1_STATUS_2026-09-18.md`
- `docs/V1_ADMIN_MFA_LOSS_RECOVERY_RUNBOOK_1_HANDOFF_2026-09-18.md`
- `docs/V1_ADMIN_MFA_LOSS_RECOVERY_RUNBOOK_1_SELF_REVIEW_2026-09-18.md`

Read broadly as required for evidence.

## 6. Hard exclusions

Do **not**:
- delete or alter any actual MFA factor;
- mutate Production or Development Supabase Auth;
- execute a privileged recovery operation against any live user;
- change Supabase Auth configuration;
- change application runtime code;
- add recovery endpoints/scripts/Edge Functions;
- add backup codes, phone MFA, WebAuthn/passkeys or another factor type;
- weaken/bypass AAL2;
- change admin roles, RLS, DB policies, account status or permissions;
- expose/read/write secrets into docs, PR comments, logs or chat;
- implement consumer MFA recovery;
- start incident-process/support-process/error-boundary/revenue-caveat follow-ups;
- change global continuity docs;
- mark Ready;
- merge.

If a necessary step crosses these boundaries: STOP for Technical Lead.

## 7. Required repository evidence

The runbook must be grounded in current repository truth, including:
- current admin AAL2 enforcement;
- current account MFA enrollment/removal UX and its step-up behavior;
- current break-glass limitations;
- current installed Supabase package/API surface;
- current binding security/governance docs.

Do not copy stale audit line numbers as if they were current without checking the symbols.

## 8. Validation / handoff

Before handoff:
- prove changed files are docs-only and exactly within allowed scope;
- no secrets in the diff;
- run repository checks required by current CI;
- exact-head GitHub CI;
- exact-head Vercel Preview;
- no unresolved GitHub/Vercel threads known to the agent;
- re-fetch `origin/main`;
- report exact head / merge-base / ahead / behind / drift;
- persist STATUS / HANDOFF / SELF_REVIEW.

No Supabase live mutation or destructive smoke is permitted or required.

## 9. Governance

- One logical implementation agent owns this branch.
- Agent self-review is evidence, not Technical-Lead PASS.
- Changed heads invalidate previous exact-head gates.
- Do not Ready.
- Do not merge.
- Do not start any follow-up slice.
- Final state: **STOP FOR TECHNICAL-LEAD REVIEW**.

---

## 10. Implementation pointer (Generation 1)

Canonical runbook: `docs/V1_ADMIN_MFA_LOSS_RECOVERY_RUNBOOK_2026-09-18.md`  
Status / Handoff / Self-review: the three `V1_ADMIN_MFA_LOSS_RECOVERY_RUNBOOK_1_*_2026-09-18.md` files on this branch.

This pointer does not authorize Ready, merge, live Auth mutation or a follow-up slice.
