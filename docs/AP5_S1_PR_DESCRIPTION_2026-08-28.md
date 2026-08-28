## Status

**DRAFT / AP-5-S1 ONLY / NORMAL TECHNICAL-LEAD GATE / NO PRODUCT-OWNER SPECIAL GATE**

Tracks Issue #132. Draft-PR: https://github.com/Jetnity/jetnity/pull/133

Cursor-Agent: `Account plattform audit vorbereitung 9`

This PR stays Draft. It is **not** Ready and must **not** be merged by the author. Independent Technical-Lead review is the next step.

Live start baseline: `main` = `eaa03ad71509d281990e0d34ca359e0750eb9591` (PR #131). AP-5 Gate 0 / PR #129 is integrated; Issue #128 is CLOSED. Do not rebuild Gate 0.

## What S1 changes

`/account/security` becomes truthful without changing Auth authority:

- TOTP list states: `empty` ≠ `unsupported` ≠ `error`.
- Passkeys follow server/config authority. With `[auth.passkey] enabled = false`, the panel is `unsupported` even if the browser has WebAuthn.
- Raw GoTrue/Supabase messages, otpauth URIs, tokens and factor-ID prefixes stay out of the user-facing copy.
- Existing TOTP enroll/verify/unenroll remains. No step-up.
- Login MFA dialog uses the same safe verify-error mapping.

## Strict non-scope

- No AP-5-S2 in-account password change
- No `reauthenticate()` / nonce
- No AP-5-S3 logout changes
- No AP-5-S4 MFA step-up
- No AP-5-S5 session/device list
- No Consumer-AAL2
- No Auth config push / Passkey live
- No migration / RLS / ownership / identity
- No C2 / REVOKE / SECURITY DEFINER
- No Provider / TW-8 / Search / Homepage / Native

## Tests

- Focused S1 unit + UI-semantics + Gate-0 inventory + Account-Nav/MFA-A11y
- Exact-Head GitHub Actions and Vercel Preview must be live-read on the final head
- No browser / Real-Device claim

## Stop

Independent Technical-Lead review. Not Ready. Do not merge. Do not start S2–S5 automatically.
