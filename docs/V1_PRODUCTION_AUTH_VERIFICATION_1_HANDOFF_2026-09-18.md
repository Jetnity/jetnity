# Jetnity – V1 Production Auth Verification 1 HANDOFF

Stand: 18. September 2026  
Status: **PHASE A COMPLETE FOR REVIEW / EVIDENCE HEAD `82c0f564` / STOP FOR TECHNICAL-LEAD REVIEW / KEIN READY / KEIN MERGE / KEIN PHASE B**

Binding task: `docs/V1_PRODUCTION_AUTH_VERIFICATION_1_TASK_2026-09-18.md`  
Detailed status: `docs/V1_PRODUCTION_AUTH_VERIFICATION_1_STATUS_2026-09-18.md`  
Self-review: `docs/V1_PRODUCTION_AUTH_VERIFICATION_1_SELF_REVIEW_2026-09-18.md`

---

## 1. Where the work lives

| | |
| --- | --- |
| Issue | #479 |
| Draft PR | #480 |
| Branch | `verify/v1-production-auth-verification-1` |
| Evidence head | `82c0f564865894ee4639a59f966db75cafb11878` |
| Canonical / merge-base | `main@d67529a297a5de8c5a2e83b8d80caf4d34755384` |
| Ahead / behind at evidence | **2 / 0** |
| Exact-head CI | `35346050116` **SUCCESS** |
| Auth job with snapshot | `105602766085` **SUCCESS** |
| Exact-head Vercel | `DitxsU4VaKNhjXLjvBoGXnDm7y8M` **READY** |
| Agent | Jetnity V1 production auth verification 1, Generation 1 |
| Session | `bc-1d490756-eed2-4390-a8bf-04645bf58082` |

This persist commit is docs-only and invalidates the exact-head gates above.

---

## 2. What a reviewer should verify first

1. Merge-base equals current `origin/main` `d67529a`. Behind was **0** at `82c0f564`.
2. New runtime/code files are only the reader, its test, `package.json`, and the temporary CI step. No Auth/UI/runtime product change.
3. `scripts/auth/produktion-lesen.ts` imports only `produktionsZiel` + `authKonfiguration` and never `authKonfigurationSetzen` / `projektSchluessel` / PATCH/POST/PUT/DELETE.
4. Output allowlist is exactly the eleven audit fields. Missing field => fail closed.
5. CI Production step is `pull_request` + exact branch only; Development `auth:pruefen` still runs first.
6. Job log `105602766085` contains the sanitized snapshot and `SUPABASE_ACCESS_TOKEN: ***`.
7. GitHub review threads: none. Vercel unresolved threads: none.

---

## 3. Observed Production Auth values

Copied only from the allowlisted CI snapshot. Do not treat this as a docs rewrite.

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

**STOP FOR TECHNICAL-LEAD REVIEW.** Same logical agent/session may continue only after an explicit Phase-B dispatch. No Ready. No merge. No Guardian dispatch from this agent. No follow-up slice.
