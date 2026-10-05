## Status

**REVIEW-FIX FOR 5049870788 / DRAFT / AUDIT + ARCHITECTURE ONLY / NO AP-5 RUNTIME**

Tracks Issue #128.

Cursor-Agent: `Account plattform audit vorbereitung 8`

This PR stays Draft. It is **not** Ready and must **not** be merged by the author. Independent Technical-Lead re-review is the next step.

Live start baseline: `main` = `0bca31b5de06bcee74c5436122b1685b6d2092f6` (PR #127). P2-TA-04 C1 / PR #126 is integrated; Issue #122 is CLOSED. Do not rebuild C1.

Docs-truth fix for review `5049870788`: verified-factor unenroll requires `aal2` (UI does no step-up; GoTrue enforces it); Recovery ≠ signed-in reauthentication; `security_update_password_require_current_password = true` stays a Product-Owner gate and must have Recovery compatibility verified separately.

## What Gate 0 reconstructs

The existing Auth / Session / MFA contract, with evidence:

- Password-Recovery and signed-in reauthentication are two authorities. Recovery stays Recovery-session → `updateUser({ password })`. In-account change under `secure_password_change` is `reauthenticate()` → nonce → `updateUser({ password, nonce })`. The recovery link is not reauthentication. No current-password submit.
- Turning `security_update_password_require_current_password` on remains a Product-Owner special gate. Recovery compatibility must be verified separately before that config change; this Gate 0 does not claim the recovery path would break.
- Current „Abmelden“ already calls `signOut()` with the client default `scope: 'global'`.
- User-facing session/device listing is **unsupported** in `@supabase/auth-js` 2.71.1. Honest UI is `unsupported`, not `empty`.
- MFA enroll/unenroll is client-only today. Jetnity UI does no proactive step-up. Current Supabase reference for `auth.mfa.unenroll` requires `aal2` to unenroll a **verified** factor; GoTrue enforces that server-side. Later AP-5-S4 may add a friendly challenge/verify step-up without introducing Consumer-AAL2 globally. Login MFA dialog is skippable and leaves AAL1. Admin-AAL2 stays untouched.
- Later AP-5 slices are classified as normal Technical-Lead gate (`AP-5-S1`–`S5`) or Product-Owner special gate (`AP-5-P1`–`P5`).

## Strict non-scope

- No AP-5 runtime
- No C2, no REVOKE, no SECURITY DEFINER
- No Auth config push
- No Consumer-AAL2
- No OAuth/Passkey live
- No migration / RLS / ownership / identity
- No Supabase mutation or Production data
- No AP-6/AP-7
- No passport / MRZ / biometric persistence

## Tests

- `npm run auth:pruefen`: 55/55 expected values, 242 keys classified (Development branch, read-only)
- Inventory test: 8/8
- Focused Auth/Account unit: 84/84
- Prior Exact-Head on `41d0863d` was SUCCESS; this review-fix head must be live-read after push
- `auth:fluesse` was **not** re-run for this docs-truth fix
- No browser / Real-Device claim

## Stop

Independent Technical-Lead re-review after review `5049870788`. Not Ready. Do not merge. No automatic AP-5 runtime follow-up.
