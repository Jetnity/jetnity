# Jetnity – V1 Production Auth Verification 1 STATUS

Stand: 18. September 2026  
Status: **PHASE B IMPLEMENTED / LOCAL GATES PASS / EXACT-HEAD GATES PENDING THIS PERSIST / DRAFT / NOT READY / NOT MERGED / STOP AFTER FRESH GATES**

Issue: #479  
Draft PR: #480  
Branch: `verify/v1-production-auth-verification-1`  
Binding task: `docs/V1_PRODUCTION_AUTH_VERIFICATION_1_TASK_2026-09-18.md`  
TL Phase A PASS / Phase B dispatch: comment `5730259722`

Canonical base / live main: `d67529a297a5de8c5a2e83b8d80caf4d34755384`  
Phase-A persist head (TL PASS): `66ee5fe5ca7f2b8052dfeadfc1d270022750e001`

Cursor-Agent: **Jetnity V1 production auth verification 1**, Generation 1  
Required parent model: **Cursor Grok 4.6 High Fast** — confirmed  
Session: `bc-1d490756-eed2-4390-a8bf-04645bf58082`

This file is point-in-time evidence. Every new head invalidates older exact-head gates. Agent self-review is not Technical-Lead PASS.

Production Auth was **not** changed.

---

## 1. Immutable Phase-A evidence

Do not treat later heads as a new Production snapshot.

| | |
| --- | --- |
| First snapshot head | `82c0f564865894ee4639a59f966db75cafb11878` |
| First snapshot CI | `35346050116` SUCCESS / auth job `105602766085` |
| First snapshot Preview | `DitxsU4VaKNhjXLjvBoGXnDm7y8M` READY |
| Phase-A persist / TL PASS head | `66ee5fe5ca7f2b8052dfeadfc1d270022750e001` |
| TL-read snapshot CI | `35346401221` SUCCESS / auth job `105603875234` |
| TL-read Preview | `dpl_L89PhB6yT8rBYNSeKHAC9Eya33yK` READY |

Sanitized allowlist (identical in both job logs):

```
site_url = http://localhost:3000
uri_allow_list = ""
password_hibp_enabled = true
rate_limit_email_sent = 2
rate_limit_otp = 30
rate_limit_verify = 30
rate_limit_token_refresh = 150
mfa_totp_enroll_enabled = true
mfa_totp_verify_enabled = true
mfa_allow_low_aal = false
mailer_allow_unverified_email_sign_ins = false
```

`SUPABASE_ACCESS_TOKEN` was masked as `***`. No raw config or secrets were emitted.

---

## 2. Phase B changes

- Removed the temporary exact-branch Production Auth CI step from `.github/workflows/ci.yml`. Normal Development `auth:pruefen` is unchanged.
- Kept the manual GET-only reader, helper, focused tests and `npm run auth:produktion:lesen`.
- Corrected `docs/AUTH.md`: stale „Production nicht“ AAL2 sentence; alignment migration applied / no second apply; Development config-as-code vs 18 Sep 2026 snapshot; Production redirect localhost + empty allowlist **not launch-ready**; verified HIBP/TOTP/AAL/rate-limit values; SMTP P0 preserved.
- Narrow QS2 cross-reference only; QS2 remains the correct apply-evidence side.
- Audit matrix 3.3 / 3.6 / 3.7 dated resolution updates; historical audit text preserved.
- Audit handoff item 7 marked completed; 3.6 redirect remediation remains open and Production-write-gated; 3.8 remains open P0.
- No global continuity edit.
- No Production write, config push, secret/env mutation, test user, DB/RLS/migration change.

---

## 3. Local gates on this Phase-B working tree

| Gate | Result |
| --- | --- |
| Focused reader tests | PASS — 16/16 |
| `npm test` | PASS — **3485** tests, 0 fail |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS — 0 errors, **138** warnings |
| `npm run build` | PASS |
| Hygiene (`dead`/`exports`/`deps`/`api-schutz`/`schema-bezug`) | PASS |

Exact-head CI / Preview for the persist head are recorded after push.

---

## 4. Resolution truth recorded

- **3.3** verified live / contradiction resolved.
- **3.7** Production HIBP + requested rate limits verified; 2/h remains 3.8 P0.
- **3.6** live config verified; **open P2 launch blocker** (localhost + empty allowlist).
- **3.8** separate open P0. No SMTP/provider activation.

---

## 5. Next step

Obtain fresh exact-head CI and Vercel Preview on the Phase-B persist head, then **STOP FOR TECHNICAL-LEAD REVIEW**. No Ready. No merge. No follow-up slice.
