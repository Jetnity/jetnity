# Jetnity – V1 Production Auth Verification 1 HANDOFF

Stand: 18. September 2026  
Status: **PHASE B COMPLETE FOR REVIEW / EVIDENCE HEAD `a84317ee` / STOP FOR TECHNICAL-LEAD REVIEW / KEIN READY / KEIN MERGE / PRODUCTION UNCHANGED**

Binding task: `docs/V1_PRODUCTION_AUTH_VERIFICATION_1_TASK_2026-09-18.md`  
Detailed status: `docs/V1_PRODUCTION_AUTH_VERIFICATION_1_STATUS_2026-09-18.md`  
Self-review: `docs/V1_PRODUCTION_AUTH_VERIFICATION_1_SELF_REVIEW_2026-09-18.md`  
TL dispatch: comment `5730259722`

---

## 1. Where the work lives

| | |
| --- | --- |
| Issue | #479 |
| Draft PR | #480 |
| Branch | `verify/v1-production-auth-verification-1` |
| Phase-A TL PASS head | `66ee5fe5ca7f2b8052dfeadfc1d270022750e001` |
| Phase-B evidence head | `a84317eee71873fa4be5f3c4eb75020e0964cfa4` |
| Canonical / merge-base | `main@d67529a297a5de8c5a2e83b8d80caf4d34755384` |
| Ahead / behind at evidence | **4 / 0** |
| Exact-head CI | `35347350401` **SUCCESS** |
| Auth job | `105606906931` **SUCCESS**, Development `Abgleich` only |
| Exact-head Vercel | `6k61PrTc6d53A3G61zbfhpo2wg1T` **READY** |
| Agent | Jetnity V1 production auth verification 1, Generation 1 |
| Session | `bc-1d490756-eed2-4390-a8bf-04645bf58082` |

Immutable Phase-A snapshot jobs: `105602766085` (`82c0f564`) and TL-read `105603875234` (`66ee5fe5`).

---

## 2. What a reviewer should verify first

1. Merge-base equals current `origin/main` `d67529a`. Behind must be **0**.
2. `.github/workflows/ci.yml` has **no** exact-branch Production reader step and still runs Development `auth:pruefen`.
3. `scripts/auth/produktion-lesen.ts` and `lib/supabase/auth-produktion-lesen.ts` remain GET-only.
4. `docs/AUTH.md` no longer says Production lacks `aktuelles_admin_aal2()`; section 12 records the 18 Sep snapshot and marks redirects **not launch-ready**.
5. QS2 apply status is not rewritten as wrong.
6. Audit 3.3 resolved; 3.7 verified; 3.6 open P2; 3.8 open P0.
7. No Production Auth write is claimed or present.

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

**STOP FOR TECHNICAL-LEAD REVIEW.** This persist invalidates the exact-head gates on `a84317ee`. No Ready. No merge. No follow-up slice. TL persists global continuity after merge.
