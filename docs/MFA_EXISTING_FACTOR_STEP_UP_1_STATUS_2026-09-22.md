# MFA Existing Factor Step-Up 1 — STATUS

Date: 2026-09-22  
Status: **REVIEW CORRECTION DELIVERED / STOP FOR INDEPENDENT TECHNICAL-LEAD RE-REVIEW**  
Issue: #541  
Draft PR: #542  
Branch: `fix/mfa-existing-factor-step-up-1`  
Agent: Jetnity MFA existing factor step-up 1, Generation 1  
Model: Cursor Grok 4.6 High Fast (`cursor-grok-4.6-high-fast`)  
Session: `bc-7a6af588-d7cf-4bd4-8707-fb4b3b8127a6`  
Baseline: `main@a3eb83b86d5aec604fb77d5d2b75d58c6a653ef1`  
Task seed: `fde86ba3b4fb7439e7386f8e4efbbd3ef132804d`  
Reviewed head (CHANGES REQUIRED): `9b93efe468dadd2156202f404dbd50a2013643bf`  
TL review: `5277515232`  
Correction commit: `7163f91a74c7bc17da51fb8a3b6013800ab559a9`

This is the same-session review correction. It is not a Technical-Lead PASS and is not Ready. Re-read `git rev-parse HEAD` for the frozen gate after this persist.

## MFA-R1 — malformed records were asserted absent

On exact reviewed head `9b93efe4`, `alsFaktorliste` accepted any array-of-objects and cast it. TL's four adversarial fixtures, independently re-read in that helper, all produced `MFA_TOTP_FEHLT` / `istKeinTotpFaktorFehler=true` / `challengeCount=0`. Admin would tell the user to enroll. The test `verified TOTP ohne gültige ID ist no-factor` had codified that wrong result.

A record that asserts verified TOTP without a usable ID is unreadable evidence, not proof that no authenticator exists.

Correction (challenge reader only):

- `faktorDatensatzLesen` requires nonempty string `id`, a classifiable string type (`factor_type` over nonempty legacy `type`), and nonempty string `status`.
- Any malformed record, including mixed malformed + valid, makes the list `unlesbar` → `MFA_FAKTOREN_UNLESBAR` → Admin `fehler`, not setup.
- Empty valid lists and well-formed only-unverified / phone / forward-compatible non-TOTP strings remain genuine no-factor.
- `totpFaktorenAusAntwort` display normalizer is unchanged.
- Current `all`/`totp`, totp-only without `all`, and supported legacy `type`/`factors` still start exactly one challenge.

## Consumer transitions

Admin mount/retry now call `starteTotpChallengeAnzeige`, the same function the tests exercise for `dialog` / `setup` / `fehler`. Login uses `brauchtLoginTotpStepUp(aal)` instead of an inlined copy. This is synthetic-SDK consumer-contract proof, not a hydrated Next `/login` or `/admin/mfa` route and not a device-switch PASS.

## Local gates on the correction working tree

| Check | Result |
| --- | --- |
| Owned MFA/admin regressions | 145 pass / 0 fail |
| `npm run typecheck` | pass |
| eslint on owned files | 0 errors; pre-existing warnings only |
| `check:exports` | pass |

Full suite / CI / Auth / direct Preview must be re-read on the new exact head. `9b93efe4` gates do not apply.

## Drift

`origin/main` re-read during correction: still `a3eb83b86d5aec604fb77d5d2b75d58c6a653ef1`. No unrequested merge/rebase/force.

## Limitations

- No real authenticated second-device retest and no Production factor/challenge/verify.
- Consumer proof is the shared anzeige + Login predicate used by the actual components, plus dialog markup. Not a browser-hydrated route.
- Real-device acceptance remains open.
