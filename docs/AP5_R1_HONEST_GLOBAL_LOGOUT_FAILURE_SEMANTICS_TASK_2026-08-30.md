# Jetnity – AP-5-R1 Honest Global Logout Failure Semantics – Task

Stand: 30. August 2026  
Status: **AUTHORIZED / BOUNDED RUNTIME TASK / DRAFT ONLY / STOP FOR TL REVIEW**  
Workstream: Account / Security  
Cursor-Agent: **`Account plattform audit vorbereitung 22`**  
Issue: #241  
Branch: `feat/ap5-r1-honest-global-logout-2026-08-30`  
Baseline: `main @ 5129be01a9b8785bc9d7fed01a33186fa97345a1`

> Cursor implements only this slice. Cursor does **not** mark Ready, does **not** merge and does **not** start a follow-up slice. After implementation, tests, self-review and handoff: **STOP for independent ChatGPT Technical-Lead exact-head review.**

---

## 1. Why this slice is next

Fresh Technical-Lead precheck on the baseline found:

- TA-CUX1 is integrated and Agent 21 is stopped.
- Swiss PrivacyBee is selected but Jetnity activation is parked until `jetnity.com` serves a reachable website.
- AP-6a therefore cannot honestly ship its PrivacyBee-backed `/privacy` yet; `/terms` also remains a separate Legal-input gate.
- migrations/replay-related work remains behind the known P1 Supabase migration-history replay defect around `20260829140000_trip_item_commercial_provenance`.
- remaining official Entry/Transit/Multi-Citizenship decisions require real requirements evidence/provider truth; no fake regulatory logic may be invented.

A concrete, migration-free AP-5 residual remains in the live code: `app/auth/sign-out.ts` awaits Supabase `auth.signOut()` and redirects without checking the returned `{ error }`.

This can create a false security state: the visitor can be navigated as though logout succeeded even when the Auth authority did not confirm success.

### Enabler justification

This slice is not a differentiation feature. It qualifies under the Product Differentiation Doctrine as a **Security / Trust / Reliability enabler**.

Jetnity must never claim or imply a security-sensitive transition succeeded when the authoritative operation returned a failure.

---

## 2. Current contract to preserve

### 2.1 General logout

Baseline `app/auth/sign-out.ts` has two server actions:

- `signOutAction()` → successful target `/`;
- `signOutToAdminLoginAction()` → successful target `/admin/login`.

Both currently call `supabase.auth.signOut()` without an explicit scope. That existing behavior remains the contract of this slice: **general logout stays Supabase-default / unscoped / global semantics.**

Do not silently change general logout to `local` or another scope.

### 2.2 Account Security scoped logout

AP-5-S3 is integrated and owns the explicit `/account/security` scopes:

- `local` – this session only;
- `others` – other sessions while keeping the current session;
- `global` – all sessions.

`app/account/security/logout-action.ts` and `lib/auth/account-logout-scopes*` are an existing honest pattern. AP-5-R1 must **not** change their product contract or merge them into a new authority.

### 2.3 Admin

Admin logout must continue to land on `/admin/login` **only after confirmed successful logout**. Do not introduce a request-controlled redirect target or open redirect.

### 2.4 Security truth

- Auth authority = Supabase Auth response.
- `{ error }` is failure; do not treat it as success.
- no raw tokens, session IDs, cookies, Auth secrets or provider-internal details in UI/logging/docs.
- generic user-facing failure text must be understandable without fabricating a more precise cause than known.

---

## 3. Required discovery before implementation

Before editing UX, inventory all live callers and surfaces of:

- `signOutAction`;
- `signOutToAdminLoginAction`;
- any wrapper/form/button that triggers them;
- the AP-5-S3 scoped actions, solely to prove they stay unaffected.

Record the inventory in the slice-local status/self-review. Do not assume historical docs list every caller.

Evaluate the actual Next.js Server Action behavior for success redirect vs returned failure state before choosing implementation shape.

Do **not** solve the problem by catching/ignoring the error and redirecting anyway.

---

## 4. Required runtime behavior

### 4.1 Success

When the authoritative sign-out operation succeeds:

- public/general logout reaches `/` as today;
- admin logout reaches `/admin/login` as today;
- no user-controlled redirect target is introduced.

### 4.2 Failure

When Supabase `signOut()` returns an error or a relevant operation failure occurs:

- **do not execute the success redirect**;
- do not present the user as logged out;
- keep failure vs success explicit;
- provide a clear, accessible recovery path appropriate to the caller surface, e.g. retry or remain in the current context;
- do not expose raw Supabase error messages/codes unless an explicitly sanitized stable mapping is justified and tested;
- do not log tokens, cookies, session IDs or sensitive raw Auth payloads.

The exact UI mechanism may be chosen after caller inventory. Prefer the smallest architecture-consistent solution; do not create a new global notification framework for this slice.

### 4.3 Unknown/exceptional state

A thrown network/runtime error must not be converted into a false success. Treat it fail-closed as logout **not confirmed**.

Do not promise that a failed request means the server-side session definitely remains valid; simply state that logout could not be confirmed / completed and avoid a success claim.

---

## 5. Accessibility / UX requirements

- Failure copy is visible and understandable.
- Interactive retry/control target is keyboard-operable.
- Any status/error announcement needed for dynamic client UX is screen-reader accessible (`aria-live` or equivalent as appropriate).
- Do not trap focus or introduce gesture-only interaction.
- Mobile layout remains usable with >=44px effective touch target where a new action/control is introduced.
- Do not expose internal exception text as accessibility labels.

---

## 6. Acceptance criteria

AP-5-R1 is acceptable only if all are true:

1. All live general/admin logout callers were inventoried against the current branch.
2. General successful logout still performs Supabase-default/unscoped sign-out and reaches `/`.
3. Admin successful logout still performs Supabase-default/unscoped sign-out and reaches `/admin/login`.
4. An Auth `{ error }` prevents the success redirect.
5. A thrown/operational failure likewise does not imply success.
6. Failure UX is understandable, retryable where appropriate and accessible.
7. Raw Supabase errors, tokens, cookies, session IDs and secrets are not exposed.
8. No open redirect or request-controlled post-logout destination exists.
9. AP-5-S3 `local` / `others` / `global` semantics and code remain behaviorally unchanged.
10. S4 MFA step-up, S5 current-session view, login MFA, recovery, signed-in reauth and Admin AAL2 authorities remain unchanged.
11. No DB/schema/migration/RLS/Identity/Service Role/Auth-project-config change.
12. No PrivacyBee/AP-6/AP-7/AP-8/Provider/Payments/Homepage/Collaboration scope.
13. No global TL continuity files changed by Cursor.
14. Focused regressions plus full repository gates are green on the final exact head.

---

## 7. Required tests

At minimum add focused tests proving:

- public/general success → intended `/` success path;
- admin success → intended `/admin/login` success path;
- returned Auth error → no success redirect;
- thrown Auth/network-style failure → no success redirect;
- error output presented to user is sanitized / provider-detail-free;
- no request-controlled redirect target;
- general sign-out remains unscoped/default rather than `local`/`others`;
- AP-5-S3 scoped action contract is unchanged.

Test implementation details at the lowest stable seam possible. Do not write brittle source-string assertions when behavior can be tested directly, except where an existing repository contract-test style specifically requires source inventory.

Full gates before handoff:

- focused tests;
- `npm test`;
- TypeScript/typecheck;
- lint;
- repository hygiene/security checks normally run by CI;
- Production build;
- GitHub Actions on exact final head;
- Vercel Preview on exact final head.

Do not claim Browser/Real-Device evidence unless actually performed.

---

## 8. Hard non-scope

Do **not** change or start:

- Supabase project Auth configuration;
- MFA/AAL architecture or global Consumer AAL2;
- OAuth / Passkeys / WebAuthn;
- password recovery / signed-in password reauth contract;
- privileged/full session registry;
- DB/migrations/RLS/Ownership/Identity;
- Service Role or direct `auth.sessions` access;
- PrivacyBee or Legal runtime;
- AP-6 / AP-7 / AP-8;
- Traveller/Passport/Citizenship truth;
- Requirements/visa/entry/transit provider logic;
- commercial/provider live work;
- payments;
- Homepage / collaboration;
- Branch Protection;
- global continuity files (`JETNITY_START_HERE.md`, `JETNITY_HANDOFF.md`, `docs/ACTIVE_WORK_STATUS.md`, global build order/checkpoints).

If fixing the residual requires a **fundamental Auth/Session architecture change**, STOP and document the gate rather than widening scope.

---

## 9. Required deliverables

Runtime/code/tests plus exactly the slice-local evidence needed for handoff, including:

- `docs/AP5_R1_HONEST_GLOBAL_LOGOUT_FAILURE_SEMANTICS_STATUS_2026-08-30.md`
- `docs/AP5_R1_HONEST_GLOBAL_LOGOUT_FAILURE_SEMANTICS_SELF_REVIEW_2026-08-30.md`
- `docs/AP5_R1_HONEST_GLOBAL_LOGOUT_FAILURE_SEMANTICS_HANDOFF_2026-08-30.md`

Status/Handoff must record:

- exact Cursor logical name `Account plattform audit vorbereitung 22`;
- actual Cursor run/session ID if available;
- baseline/main and final branch head;
- caller inventory;
- changed filenames and scope statement;
- focused/full test evidence;
- exact-head GitHub Actions/Vercel evidence if available at handoff;
- known residuals;
- explicit statement that no follow-up slice was started.

Cursor does not edit global continuity.

---

## 10. STOP condition

After implementation + tests + self-review + slice-local status/handoff:

**STOP.**

Leave the PR Draft. Do not mark Ready. Do not merge. Do not start AP-6, AP-7, AP-8 or another AP-5 residual.

The ChatGPT Technical Lead will independently review the full diff and exact-head gates and will decide `PASS`, `CHANGES REQUIRED`, `BLOCKED` or `NO-GO`.