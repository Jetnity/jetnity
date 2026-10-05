# MFA Existing Factor Step-Up 1 — HANDOFF

Stand: 22. September 2026  
Status: **STOP FOR INDEPENDENT TECHNICAL-LEAD RE-REVIEW**

Same session as the first delivery. Same Generation 1 writer. Review correction only.

## For the next reader

Read in this order:

1. `docs/MFA_EXISTING_FACTOR_STEP_UP_1_TASK_2026-09-22.md`
2. Independent TL review `5277515232` on `9b93efe468dadd2156202f404dbd50a2013643bf`
3. `docs/MFA_EXISTING_FACTOR_STEP_UP_1_STATUS_2026-09-22.md`
4. `docs/MFA_EXISTING_FACTOR_STEP_UP_1_SELF_REVIEW_2026-09-22.md`
5. `docs/evidence/mfa-existing-factor-step-up-1/r1-malformed-records.json`
6. Live Draft PR #542 head, comments, CI, Auth, direct Vercel Preview — not remembered IDs

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
| Reviewed head | `9b93efe468dadd2156202f404dbd50a2013643bf` (historical; CHANGES REQUIRED) |
| Correction | `7163f91a74c7bc17da51fb8a3b6013800ab559a9` |
| origin/main at re-read | `a3eb83b86d5aec604fb77d5d2b75d58c6a653ef1` (0 behind) |

The live branch HEAD after this persist is the gate. Re-read `git rev-parse HEAD` and GitHub. A new head invalidates older gates, including `9b93efe4` CI/Auth/Preview.

## What changed in the review correction

- `lib/auth/account-security-faktoren.ts`: challenge-list reader validates id/type/status; any malformed record is `unlesbar`. Display `totpFaktorenAusAntwort` unchanged.
- `lib/auth/mfa.ts`: still one list / one challenge; malformed → `MFA_FAKTOREN_UNLESBAR`. Added `starteTotpChallengeAnzeige` and `brauchtLoginTotpStepUp`.
- `app/(public)/admin/mfa/AdminMfaStepUp.tsx`: mount and retry use the shared anzeige (`dialog` / `setup` / `fehler`).
- `components/auth/LoginForm.tsx`: uses `brauchtLoginTotpStepUp(aal)`. Challenge/verify/AAL2 policy unchanged.
- Tests: replaced the wrong empty-ID no-factor case; added malformed/missing/empty/non-string ID, malformed type/status, mixed malformed, totp-only, legacy, and Admin anzeige transitions.

## What the evidence does and does not prove

Proves (synthetic SDK):

- TL's four malformed fixtures plus non-string ID, malformed type, and mixed malformed are lookup errors, not setup
- current all/totp and totp-only still challenge the verified ID once
- supported legacy `type`/`factors` still works
- empty / unverified-only / phone-only / forward-compatible non-TOTP string remain no-factor
- Admin anzeige used by the component returns `dialog` / `setup` / `fehler` correctly

Does **not** prove:

- a real second-device login or Admin step-up
- hydrated Next `/login` or `/admin/mfa` browser events
- physical device acceptance

## Next actor

Technical Lead: independent exact-head review of the frozen HEAD after this persist. Re-gate CI/Auth/direct Preview on that SHA. Cursor must not Ready, merge, or start a follow-up.
