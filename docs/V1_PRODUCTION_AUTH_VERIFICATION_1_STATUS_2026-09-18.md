# Jetnity – V1 Production Auth Verification 1 STATUS

Stand: 18. September 2026  
Status: **PHASE A EVIDENCE CAPTURED / GATED ON `82c0f564` / THIS PERSIST COMMIT INVALIDATES THAT EXACT-HEAD / DRAFT / NOT READY / NOT MERGED / STOP FOR TECHNICAL-LEAD REVIEW**

Issue: #479  
Draft PR: #480  
Branch: `verify/v1-production-auth-verification-1`  
Binding task: `docs/V1_PRODUCTION_AUTH_VERIFICATION_1_TASK_2026-09-18.md`

Canonical base: `main@d67529a297a5de8c5a2e83b8d80caf4d34755384`  
Dispatch head: `7c9d902cb9e4ba553ca579bd99685949bd8af6d8`  
Implementation / evidence head: `82c0f564865894ee4639a59f966db75cafb11878`

Cursor-Agent: **Jetnity V1 production auth verification 1**, Generation 1  
Required parent model: **Cursor Grok 4.6 High Fast** — confirmed (`originalModelName=cursor-grok-4.6-high-fast`)  
Session: `bc-1d490756-eed2-4390-a8bf-04645bf58082`

This file is point-in-time evidence. Every new head invalidates older exact-head gates. Agent self-review is not Technical-Lead PASS.

Phase B is **not** started. Production-truth docs were **not** edited.

---

## 1. What Phase A implemented

GET-only Production Auth snapshot reader:

- `scripts/auth/produktion-lesen.ts` — wiring only
- `lib/supabase/auth-produktion-lesen.ts` — allowlist, fail-closed CLI contract, sanitized formatter
- `npm run auth:produktion:lesen`
- temporary exact-branch CI step on `pull_request` when `github.head_ref == 'verify/v1-production-auth-verification-1'`
- Development `auth:pruefen` step unchanged

The reader requires `--produktion --projekt-ref qscbgcdmivbbnzrcyegn`, `SUPABASE_ACCESS_TOKEN`, and `SUPABASE_PROJECT_REF` equal to that ref. It calls existing `produktionsZiel()` then GET-only `authKonfiguration()`. It never calls `authKonfigurationSetzen()`, `projektSchluessel()`, Admin Auth, or any write method.

---

## 2. Live git comparison on evidence head `82c0f564`

| | |
| --- | --- |
| Evidence | `82c0f564865894ee4639a59f966db75cafb11878` |
| `origin/main` | `d67529a297a5de8c5a2e83b8d80caf4d34755384` |
| Merge-base | **`d67529a`** (canonical base / current main) |
| Ahead / behind | **2 / 0** at `82c0f564` |

Slice vs main at `82c0f564` was only the task plus the five Phase-A implementation files. This persist adds the three slice docs and therefore creates a new head.

---

## 3. Local gates on `82c0f564`

| Gate | Result |
| --- | --- |
| Focused reader tests | PASS — 16/16 |
| `npm test` | PASS — **3485** tests, 0 fail |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS — 0 errors, **138** warnings |
| `npm run build` | PASS |
| Hygiene (`dead`/`exports`/`deps`/`api-schutz`/`schema-bezug`) | PASS |
| Local Production reader without matching ref | FAIL-CLOSED — `SUPABASE_PROJECT_REF` was the Development target; no Production GET from this agent |

---

## 4. Exact-head CI + Preview on `82c0f564`

| | |
| --- | --- |
| CI | **SUCCESS** — run `35346050116` on `82c0f564` |
| Auth job | **SUCCESS** — `105602766085` |
| Development `Abgleich` | ran and succeeded before the Production step |
| Production GET step | ran and succeeded |
| Vercel Preview | **READY** — `DitxsU4VaKNhjXLjvBoGXnDm7y8M` |
| Preview URL | `https://jetnity-app-git-verify-v1-production-au-78c333-jetnity-e1b93c82.vercel.app` |

GitHub review threads: none. Vercel unresolved threads: 0.

---

## 5. Sanitized Production Auth snapshot from the exact-head job log

Source: job `105602766085`, step `Production Auth lesen (GET-only, dieser Branch)`, head `82c0f564`.

Job env showed `SUPABASE_ACCESS_TOKEN: ***` and step-scoped `SUPABASE_PROJECT_REF: qscbgcdmivbbnzrcyegn`.

```
JETNITY_PRODUCTION_AUTH_SNAPSHOT_BEGIN
target_project_ref=qscbgcdmivbbnzrcyegn
method=GET
fields=allowlist
{
  "site_url": "http://localhost:3000",
  "uri_allow_list": "",
  "password_hibp_enabled": true,
  "rate_limit_email_sent": 2,
  "rate_limit_otp": 30,
  "rate_limit_verify": 30,
  "rate_limit_token_refresh": 150,
  "mfa_totp_enroll_enabled": true,
  "mfa_totp_verify_enabled": true,
  "mfa_allow_low_aal": false,
  "mailer_allow_unverified_email_sign_ins": false
}
JETNITY_PRODUCTION_AUTH_SNAPSHOT_END
```

No raw config, JWT secret, SMTP/captcha/OAuth secrets, API keys, or unknown keys were printed.

These values are **observed GET evidence**. They are not a rewrite of `docs/AUTH.md` and not a Production change.

---

## 6. Scope still held

- no Production Auth write
- no DB mutation / migration / RLS change
- no test user
- no SMTP/provider activation
- no secret/env mutation
- no Ready / merge
- no Phase B
- no global continuity edit
- `docs/AUTH.md` and `docs/QS2_ADMIN_AAL2_PRODUCTION_APPLY_GATE_STATUS_2026-08-27.md` untouched

---

## 7. Next step

**STOP FOR TECHNICAL-LEAD REVIEW.**

Do not mark Ready. Do not merge. Do not start Phase B until the Technical Lead has read this snapshot and dispatched the same logical session.
