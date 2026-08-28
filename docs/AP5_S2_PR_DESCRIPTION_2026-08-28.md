## Status

**DRAFT / AP-5-S2 ONLY / NORMAL TECHNICAL-LEAD GATE / NO PRODUCT-OWNER SPECIAL GATE**

Tracks Issue #136. Draft-PR: https://github.com/Jetnity/jetnity/pull/137

Cursor-Agent: `Account plattform audit vorbereitung 10`

This PR stays Draft. It is **not** Ready and must **not** be merged by the author. Independent Technical-Lead review is the next step.

Live start baseline: `main` = `0256905cee3e6705156ce642839983daf8b0709a` (PR #135). AP-5 Gate 0 / PR #129 and AP-5-S1 / PR #133 are integrated. Generation 9 must not be reused.

## What S2 changes

A signed-in user can change their password from `/account/security` inside the existing Auth contract:

- explicit `reauthenticate()` after a user action;
- nonce plus new password;
- `updateUser({ password, nonce })`;
- truthful idle / requesting / code-sent / verifying / updating / success / error / unsupported / unavailable states;
- existing password policy and HIBP helper;
- no current-password field;
- no raw GoTrue / token / nonce leakage.

Recovery (`/auth/update-password`) stays a separate authority and is not rewritten.

## Strict non-scope

- No AP-5-S3 logout changes
- No AP-5-S4 MFA step-up
- No AP-5-S5 session/device list
- No Consumer-AAL2
- No Auth config push / Passkey live
- No current-password contract
- No migration / RLS / ownership / identity
- No C2 / REVOKE / SECURITY DEFINER
- No Provider / TW-8 / Search / Homepage / Native

## Tests

- Focused S2 unit + contract/a11y + Gate-0 inventory + S1/Account-Nav/MFA-A11y/password-policy regression
- Exact-Head GitHub Actions and Vercel Preview must be live-read on the final head
- No browser / Real-Device claim

## Stop

Independent Technical-Lead review. Not Ready. Do not merge. Do not start S3–S5 automatically.
