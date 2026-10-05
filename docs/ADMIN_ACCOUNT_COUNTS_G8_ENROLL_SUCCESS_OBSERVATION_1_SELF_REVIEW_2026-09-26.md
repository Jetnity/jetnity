# Admin Account Counts G8 Enroll Success Observation 1 — SELF_REVIEW

This is author self-review, not an independent Technical-Lead PASS.

## Scope

Owned only this observation repair:

- `scripts/e2e/admin-account-counts-browser-flows-1/session.mjs`
  - keep enroll response/secret, TOTP generation, verify POST and actor checks
  - fail closed when an observed verify payload is unsuccessful or for the wrong actor
  - replace stale toast wait with source-backed confirmed-factor observation
- `scripts/e2e/admin-account-counts-browser-flows-1/constants.mjs`
  - document fleeting toast vs durable list/status/form-gone copy
  - add `data-security-lage="ready"` selector pin
- `scripts/e2e/admin-account-counts-browser-flows-1/test.mjs`
  - required G8 PASS/FAIL matrix
  - prior browser-flow suite retained
- this slice STATUS / HANDOFF / SELF_REVIEW
- `docs/ACTIVE_WORK_STATUS.md`
- task status line only

Product `components/account/SecurityMFA.tsx` and `lib/auth/account-security-lage.ts` were read and pinned, not edited. Docker cleanup, runtime npm/cache, artifact export, SQL/Auth, root package/lock/CI were not changed.

Unrelated workspace drift `next-env.d.ts` was restored and never staged.

## Product inspection (required first step)

Inspected current source before changing the browser wait:

1. `handleVerify` sets `Authenticator-App erfolgreich aktiviert.` then immediately `await refreshFactors()`.
2. `refreshFactors()` calls `setMessage(null)` before `listFactors` returns. The toast is therefore a race, not a durable success state.
3. After a verified factor refresh, the durable UI is:
   - `data-security-lage="ready"`
   - `TOTP_LAGE_TEXTE.ready` / list heading `Eingerichtete Authenticator-Apps`
   - status `bestätigt`
   - `#totp-code` / `Schritt 2` form gone
4. There is no post-verify redirect away from `/account/security` and no AAL2/session forge.

That matches the real-Mac receipt: G6/G7 PASS, G8 FAIL only at `enroll.success exceeded 15000ms`. Increasing the timeout would have waited for a signal the product clears.

## Review mapping

| Requirement | Correction |
| --- | --- |
| Inspect product truth first | SecurityMFA + lage/faktoren source pinned in STATUS and a controlled test |
| Do not guess / do not only raise timeout | predicate changed; 15s budget unchanged |
| Real secret / TOTP / verify / actor stay mandatory | `enrollTotpViaUi` still extracts secret, generates 6 digits, waits for verify, then `applyObservedEnrollVerify` |
| Current source-backed state => PASS | confirmed list + `bestätigt` + form gone |
| Stale toast absent, current state present => PASS | default double after verify |
| Verify failure => FAIL | unsuccessful payload throws |
| Wrong actor payload/token => FAIL | actor mismatch throws |
| No verify and no success state => FAIL | wait expires fail-closed |
| Enrollment without secret => FAIL | existing throw kept |
| Timeout without success state | ownership-uncertain / FAIL via budget or wait |
| Arbitrary / stale-only text cannot PASS | toast-only and lorem rejected |
| G10 not weakened | `forceNewEnrollment` still refused; existing G10 test green |
| Prior suite remains green | 31 prior tests + 11 new = **42/42 PASS** |
| No product / Docker / npm / export / Production | confirmed by diff |

## Misleading claims corrected

Helper PASS is not a real-Mac G8 PASS and does not prove G9–G19 on hardware.

The fleeting toast string still exists in product source. This slice does not delete it and does not treat its absence as a product defect to fix here. It only stops using that non-durable toast as the G8 success gate.

## Tests actually run

`node --test scripts/e2e/admin-account-counts-browser-flows-1/test.mjs` — **42/42 PASS, 0 FAIL** on this Linux agent (1.8s). Log: `/opt/cursor/artifacts/aacbf1-g8-enroll-success-observation-controlled-tests.log`.

GitHub CI / Auth / Vercel Preview are not claimed on this implementation persist. Re-read those gates on the live SHA before review.

Real Mac / Playwright / Docker / official CLI / hosted Supabase / Production: **NOT RUN / NOT MUTATED**.

## Residual risks

- P0: the next authorized real Mac run is still required to prove G8 now observes the confirmed-factor UI after live enroll+verify
- P1: if `listFactors` after verify returned no verified TOTP, G8 would still FAIL. That is truthful product state, not a harness skip
- P2: a later product change that removes `Eingerichtete Authenticator-Apps` / `bestätigt` will fail the source-pin test; do not loosen the predicate to arbitrary text
- P3: missing G18 screenshots from the failed Mac run remain an export/evidence issue, not this observation slice

## Proactive note (out of scope)

`refreshFactors()` wiping the success toast is a real product UX gap: the user-visible confirmation is not durable. A later TL-owned product slice could keep the toast after refresh or show a durable confirmed-state message. That must not be mixed into this harness observation PR.

Traveller-context intelligence is not relevant to this admin MFA enroll-observation repair.

## Not claimed

Author does not claim TL PASS, Ready, merge, hosted parity, real-Mac acceptance, or full local execution.
