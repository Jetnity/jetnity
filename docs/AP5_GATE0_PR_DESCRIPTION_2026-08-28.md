## Status

**AUTHOR COMPLETE / DRAFT / AUDIT + ARCHITECTURE ONLY / NO AP-5 RUNTIME**

Tracks Issue #128.

Cursor-Agent: `Account plattform audit vorbereitung 8`

This PR stays Draft. It is **not** Ready and must **not** be merged by the author. Independent Technical-Lead exact-head review is the next step.

Live start baseline: `main` = `0bca31b5de06bcee74c5436122b1685b6d2092f6` (PR #127). P2-TA-04 C1 / PR #126 is integrated; Issue #122 is CLOSED. Do not rebuild C1.

Exact-Head on stamp-head `8ead1a8f7e34c7d1745e358faed9705779ebe1fb`:

- GitHub Actions Run `33137160070`: **SUCCESS** (Typecheck/Lint/Build + Auth-Konfiguration)
- Vercel Preview `8h2J9vfjaCWSJVS6W4RcvLEHVowz`: **SUCCESS**
- GitHub Preview deployment `6134729753`: success

This commit only records that re-gate. Do not add another evidence stamp unless this stamp CI fails. The PR stays Draft.

## What Gate 0 reconstructs

The existing Auth / Session / MFA contract, with evidence:

- In-account password change must use `secure_password_change` / `reauthenticate()` + `updateUser({ password })`. No current-password submit.
- Current „Abmelden“ already calls `signOut()` with the client default `scope: 'global'`.
- User-facing session/device listing is **unsupported** in `@supabase/auth-js` 2.71.1. Honest UI is `unsupported`, not `empty`.
- MFA enroll/unenroll is client-only today. Login MFA dialog is skippable and leaves AAL1. Admin-AAL2 stays untouched.
- Later AP-5 slices are classified as normal Technical-Lead gate or Product-Owner special gate.

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
- Exact-Head CI on `8ead1a8f`: Actions `33137160070` SUCCESS; Vercel `8h2J9vfjaCWSJVS6W4RcvLEHVowz` SUCCESS
- `auth:fluesse` was **not** re-run in this slice (it creates a throwaway account)
- No browser / Real-Device claim

## Stop

Independent Technical-Lead review. Not Ready. Do not merge. No automatic AP-5 runtime follow-up.
