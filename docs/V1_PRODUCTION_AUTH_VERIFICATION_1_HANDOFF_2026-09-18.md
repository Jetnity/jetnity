# Jetnity – V1 Production Auth Verification 1 HANDOFF

Stand: 18. September 2026  
Status: **P3 AUTH.md §9 CORRECTION / STOP AFTER FRESH EXACT-HEAD GATES / KEIN READY / KEIN MERGE / PRODUCTION UNCHANGED**

Binding task: `docs/V1_PRODUCTION_AUTH_VERIFICATION_1_TASK_2026-09-18.md`  
Detailed status: `docs/V1_PRODUCTION_AUTH_VERIFICATION_1_STATUS_2026-09-18.md`  
Self-review: `docs/V1_PRODUCTION_AUTH_VERIFICATION_1_SELF_REVIEW_2026-09-18.md`  
TL CHANGES REQUIRED: comment `5730407196`

---

## 1. Where the work lives

| | |
| --- | --- |
| Issue | #479 |
| Draft PR | #480 |
| Branch | `verify/v1-production-auth-verification-1` |
| Phase-A TL PASS head | `66ee5fe5ca7f2b8052dfeadfc1d270022750e001` |
| Phase-B implementation head | `a84317eee71873fa4be5f3c4eb75020e0964cfa4` |
| Previous persist (invalidated) | `0b5993a3aa40f8a82a4b0a15b99cb43d4e2cf806` |
| Canonical / merge-base | `main@d67529a297a5de8c5a2e83b8d80caf4d34755384` |
| Agent | Jetnity V1 production auth verification 1, Generation 1 |
| Session | `bc-1d490756-eed2-4390-a8bf-04645bf58082` |

Immutable Phase-A snapshot jobs: `105602766085` (`82c0f564`) and TL-read `105603875234` (`66ee5fe5`).

---

## 2. What a reviewer should verify first

1. Merge-base equals current `origin/main` `d67529a`. Behind must be **0**.
2. `docs/AUTH.md` §9 no longer says a project ref does not belong in the public repository.
3. §9 states the real boundary: Production is not a normal config-as-code write target; `auth:produktion:lesen` is GET-only.
4. Phase-B conclusions unchanged: 3.3 resolved; 3.7 verified; 3.6 open P2; 3.8 open P0.
5. Temporary Production CI step still absent. GET-only reader retained.
6. No Production Auth write.

---

## 3. Observed Production Auth values (immutable)

| Field | Observed |
| --- | --- |
| `site_url` | `http://localhost:3000` |
| `uri_allow_list` | empty |
| `password_hibp_enabled` | `true` |
| `rate_limit_email_sent` | `2` |
| `rate_limit_otp` | `30` |
| `rate_limit_verify` | `30` |
| `rate_limit_token_refresh` | `150` |
| `mfa_totp_enroll_enabled` | `true` |
| `mfa_totp_verify_enabled` | `true` |
| `mfa_allow_low_aal` | `false` |
| `mailer_allow_unverified_email_sign_ins` | `false` |

---

## 4. Next step

Record fresh exact-head CI + Preview on the P3 correction head, then **STOP FOR TECHNICAL-LEAD REVIEW**. No Ready. No merge. No follow-up.
