# MFA Existing Factor Step-Up 1 — SELF-REVIEW

Stand: 22. September 2026  
Status: **AGENT SELF-REVIEW OF THE REVIEW CORRECTION — NOT A TECHNICAL-LEAD PASS**

Issue: #541  
Draft PR: #542  
Branch: `fix/mfa-existing-factor-step-up-1`  
Binding task: `docs/MFA_EXISTING_FACTOR_STEP_UP_1_TASK_2026-09-22.md`  
Prior TL review: `5277515232` on `9b93efe468dadd2156202f404dbd50a2013643bf` — CHANGES REQUIRED

This document argues against the correction. It cannot replace an independent Technical-Lead PASS.

---

## 1. Attacks on the correction

| Attack | Result |
| --- | --- |
| Keep empty/missing ID as genuine no-factor | Rejected. That is MFA-R1. The wrong test was removed. |
| Silently drop malformed records and select a sibling verified TOTP | Rejected. Mixed malformed + valid is `unlesbar`. |
| Treat `{}` / `status:{}` as unverified and therefore no-factor | Rejected. Unclassifiable records are lookup errors. |
| Change `totpFaktorenAusAntwort` display filtering | Rejected. Display normalizer unchanged. |
| Treat unknown string `factor_type` as malformed | Rejected. Forward-compatible non-TOTP strings remain no-factor. |
| Claim hydrated Next `/login` or `/admin/mfa` | Rejected. Shared anzeige + Login predicate used by those components; not a browser route. |
| Claim real-device PASS | Rejected. |
| Production factor/challenge/verify | Rejected. Synthetic fixtures only. |
| Ready / merge / new writer | Rejected. |

## 2. Residual risks this correction does not close

- Real second-device / Production challenge remains unverified.
- Login still maps no-factor through `mapAuthError` as a generic form error. Admin distinguishes setup vs lookup error. Unchanged product asymmetry, not redesigned here.
- A list of well-formed records with unknown future types is no-factor. That is intentional compatibility, not a claim those types cannot later become TOTP-equivalent.
- `setBusy(true)` inside Admin `useEffect` is the previous pattern; eslint still warns. Not part of MFA-R1.
- `9b93efe4` CI/Auth/Preview do not gate the new head.

## 3. Compliance with TL MFA-R1

| Requirement | Met? | Note |
| --- | --- | --- |
| Malformed records → lookup error, not setup | Yes | `faktorDatensatzLesen` + `MFA_FAKTOREN_UNLESBAR` |
| Preserve display normalizer | Yes | `totpFaktorenAusAntwort` untouched |
| factor_type precedence + legacy fallback | Yes | existing `totpFaktorTyp` |
| Empty / unverified / phone remain no-factor | Yes | |
| Do not discard malformed to conclude absence | Yes | mixed list unlesbar |
| Forward-compatible non-TOTP strings | Yes | `webauthn` fixture |
| Replace wrong empty-ID no-factor test | Yes | |
| Bounded consumer dialog/setup/error proof | Yes | `starteTotpChallengeAnzeige` used by Admin |
| No Ready/merge/follow-up | Yes | |

## 4. What remains before Technical-Lead re-review

Live exact-head GitHub CI, Auth job and direct Vercel Preview on the frozen HEAD after this persist. Independent TL verdict. Historical `9b93efe4` gates do not apply.
