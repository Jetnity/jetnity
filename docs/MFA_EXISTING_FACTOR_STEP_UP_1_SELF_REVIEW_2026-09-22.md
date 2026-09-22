# MFA Existing Factor Step-Up 1 — SELF-REVIEW

Stand: 22. September 2026  
Status: **AGENT SELF-REVIEW — NOT A TECHNICAL-LEAD PASS**

Issue: #541  
Draft PR: #542  
Branch: `fix/mfa-existing-factor-step-up-1`  
Binding task: `docs/MFA_EXISTING_FACTOR_STEP_UP_1_TASK_2026-09-22.md`

This document argues against the delivery. It cannot replace an independent Technical-Lead PASS.

---

## 1. Attacks on the delivery

| Attack | Result |
| --- | --- |
| Change copy so the no-factor message sounds less like enrollment | Rejected. The helper now selects the verified `factor_type` factor and starts a challenge. |
| Prompt reenrollment whenever list shape looks unfamiliar | Rejected. Unreadable/rejected list is an error. Only an empty usable verified-TOTP list uses the existing setup message. |
| Treat `data.totp` as automatically trusted without status/`factor_type` | Rejected. Selection uses `waehleVerifiziertenTotpFaktor` / `istVerifizierterTotpFaktor`. |
| Invent a second factor-truth parser in `mfa.ts` | Rejected. Reused `account-security-faktoren` (`factor_type` over legacy `type`). |
| Choose the first TOTP regardless of status | Rejected. Unverified-first + verified-second selects only the verified ID; unverified-only is no-factor. |
| Treat phone with `type: 'totp'` as TOTP | Rejected. `factor_type` wins; conflict test expects no challenge. |
| Collapse malformed `{}` / `all: 'nope'` into no-factor | Rejected. `mfaFaktorenListeLesen` returns `unlesbar`; message is `MFA_FAKTOREN_UNLESBAR`, not matched by `istKeinTotpFaktorFehler`. |
| Fake a challengeId when challenge data is empty | Rejected. Still throws `challengeId fehlt.` |
| Bypass AAL2 or skip server recheck | Rejected. Login still gates on currentLevel !== aal2. Admin page still redirects allowed AAL2. `bestaetigeAdminAal2Action` still calls `evaluateAdminAccess`. |
| Edit LoginForm / AdminMfaStepUp / enrollment / #538 / #540 | Rejected. Shared helper + existing factor contract only. |
| Call live listFactors/challenge/verify or read the designated account | Rejected. Synthetic fixtures only. TL already did the read-only existence check. |
| Claim real-device PASS from dialog markup | Rejected. STATUS/HANDOFF say helper + markup + source locks. |
| Mark Ready or merge | Rejected. |

## 2. Residual risks this slice does not close

- A real second device / new browser session against the designated account is still unverified by this writer.
- LoginForm still surfaces the raw no-factor string through `mapAuthError`. Admin has a dedicated setup state. That asymmetry existed before this slice and was not redesigned.
- `getAAL` remains a thin SDK wrapper. A typed SDK vs mock-shape mismatch would still be an error, not silently treated as no-factor.
- `totpFaktorenAusAntwort` still lists unverified TOTP for account-security display. That is the previous public contract, not the step-up chooser.
- Local `auth:pruefen` was 401 in this environment. CI Auth SUCCESS on `e3c1c3d1` is not the later-head gate.
- Playwright / hydrated Next routes were not run. UI was not changed.

## 3. Compliance with the binding task

| Requirement | Met? | Note |
| --- | --- | --- |
| Acknowledge name/generation/model/session/branch/baseline before coding | Yes | STATUS |
| Independently reproduce current-shape verified factor as no-factor | Yes | `repro-before.json` |
| Repair shared `startTotpChallenge` for Admin and Login | Yes | `lib/auth/mfa.ts` |
| Canonical `factor_type` + verified status; no competing truth | Yes | `account-security-faktoren` |
| Preserve error vs absence and existing AAL2/server verification | Yes | tests + untouched consumers |
| Real regression that failed on baseline | Yes | first `mfa.test.ts` run 8 fail |
| Consumer contracts without claiming real-device PASS | Yes | dialog markup + AAL/source locks |
| No Production Auth/DB/settings/credential writes | Yes | |
| No Ready/merge/follow-up | Yes | |
| Re-read origin/main; no unrequested merge/rebase/force | Yes | main still `a3eb83b8` |

## 4. Proactive note (out of scope)

Login's no-factor path remains a generic form error, while Admin distinguishes setup vs lookup failure. A later bounded UX slice could align Login without changing MFA policy. This writer did not expand into that.

## 5. What remains before Technical-Lead review

Live exact-head GitHub CI, Auth job, and direct Vercel Preview on the frozen HEAD after this persist. Independent TL verdict. Cursor stops here.
