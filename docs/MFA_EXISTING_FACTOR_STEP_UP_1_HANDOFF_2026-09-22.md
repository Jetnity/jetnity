# MFA Existing Factor Step-Up 1 — HANDOFF

Stand: 22. September 2026  
Status: **STOP FOR INDEPENDENT TECHNICAL-LEAD REVIEW**

New bounded defect. Generation 1. Do not reuse #538 or #540 sessions.

## For the next reader

Read in this order:

1. `docs/MFA_EXISTING_FACTOR_STEP_UP_1_TASK_2026-09-22.md`
2. `docs/MFA_EXISTING_FACTOR_STEP_UP_1_STATUS_2026-09-22.md`
3. `docs/MFA_EXISTING_FACTOR_STEP_UP_1_SELF_REVIEW_2026-09-22.md`
4. `docs/evidence/mfa-existing-factor-step-up-1/repro-before.json`
5. `docs/evidence/mfa-existing-factor-step-up-1/tests-after.json`
6. `docs/evidence/mfa-existing-factor-step-up-1/local-gates.json`
7. Live Draft PR #542 head, comments, CI, Auth, direct Vercel Preview — not remembered IDs

## Exact coordinates

| | |
| --- | --- |
| Agent | Jetnity MFA existing factor step-up 1, Generation 1 |
| Model | Cursor Grok 4.6 High Fast (`cursor-grok-4.6-high-fast`) |
| Session | `bc-7a6af588-d7cf-4bd4-8707-fb4b3b8127a6` |
| Issue / PR | #541 / #542 |
| Branch | `fix/mfa-existing-factor-step-up-1` |
| Baseline | `main@a3eb83b86d5aec604fb77d5d2b75d58c6a653ef1` |
| Task seed | `fde86ba3b4fb7439e7386f8e4efbbd3ef132804d` |
| Implementation | `e3c1c3d14b9bbec4f4ab22cfce4bf44d20f813f9` |
| origin/main at re-read | `a3eb83b86d5aec604fb77d5d2b75d58c6a653ef1` (0 behind) |

The live branch HEAD after this persist is the gate. Re-read `git rev-parse HEAD` and GitHub. A new head invalidates older gates.

## What changed

- `lib/auth/mfa.ts` — shared Login/Admin helper now selects a verified TOTP via `factor_type` (legacy `type` only when `factor_type` is empty). Unreadable list responses are errors, not setup claims.
- `lib/auth/account-security-faktoren.ts` — canonical list reader + verified-TOTP chooser. Existing display normalizer unchanged.
- `lib/auth/mfa.test.ts` — regression that failed on the baseline fixture; consumer contracts for AAL1 dialog / AAL2 skip / no-factor vs lookup failure / server recheck source.
- `lib/auth/account-security-faktoren.test.ts` — list readability and verified-only selection.

Not changed: LoginForm, AdminMfaStepUp, admin-aal policy, enrollment, unenroll, verify, AAL2 requirement, sessions, DB, Auth settings, dependencies.

## What the evidence does and does not prove

Proves (synthetic SDK, actual `startTotpChallenge`):

- current `all`/`totp` verified `factor_type` starts one challenge on that ID
- supported legacy `type`/`factors` still works
- phone + conflicting `type: 'totp'` is not TOTP
- unverified-first does not beat a later verified TOTP
- empty / unverified-only / phone-only / empty ID = existing no-factor, zero challenges
- missing method / rejected or thrown list / unreadable payload = error, not no-factor
- challenge error or missing `challengeId` = error
- AAL1 + verified factor yields `MFATotpDialog` code-entry labels, not enrollment copy
- AAL2 skips the helper; Admin page still redirects allowed AAL2; `bestaetigeAdminAal2Action` still rechecks `evaluateAdminAccess`

Does **not** prove:

- a real second-device login or Admin step-up against the designated account
- Production Auth/network traces
- hydrated Next `/login` or `/admin/mfa` keyboard/focus
- physical device acceptance

## Next actor

Technical Lead: independent exact-head review of the frozen HEAD after this persist. Re-gate CI/Auth/direct Preview on that SHA. Do not use `e3c1c3d1` Typecheck failure or Auth success as the later-head gate. Cursor must not Ready, merge, or start a follow-up.
