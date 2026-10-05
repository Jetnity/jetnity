# Admin Account Counts G8 Enroll Success Observation 1 — STATUS

Stand: 2026-09-26  
Slice: **IMPLEMENTATION FROZEN FOR INDEPENDENT TECHNICAL-LEAD REVIEW / NOT A TECHNICAL-LEAD PASS / DRAFT / NOT READY / NOT MERGED / NO REAL MAC/BROWSER RUN / NO PRODUCTION MUTATION**

## Live pins (reconstruct if they move)

| Item | Value |
| --- | --- |
| Mode | `NORMAL` (`.jetnity/operating-mode.json`) |
| Product / integration baseline | `26b763016322fb1c929e131b4ff5bf467533e809` (Merge #569) |
| Binding task | `docs/ADMIN_ACCOUNT_COUNTS_G8_ENROLL_SUCCESS_OBSERVATION_1_TASK_2026-09-26.md` |
| Branch | `fix/admin-account-counts-g8-enroll-success-observation-1` |
| PR | https://github.com/Jetnity/jetnity/pull/571 (Draft) |
| Task seed | `8e743142c31fe74966cf9bf5acf72940c94f1870` |
| Frozen contract | `jetnity.account-counts.local-acceptance.v1` (unchanged) |

Reconstruct live HEAD after this persist; a later commit invalidates older gates. CI/Auth/Preview are not claimed on the implementation head from this writer.

## This writer

| Field | Value |
| --- | --- |
| Agent | Jetnity admin account counts G8 enroll success observation 1 |
| Generation | 1 |
| Required / actual model | cursor-grok-4.6-high-fast |
| Session | `bc-684e6634-d146-403e-a86c-1f44c18cd3d6` |
| URL | https://cursor.com/agents/bc-684e6634-d146-403e-a86c-1f44c18cd3d6 |
| Display name | `G8 enroll success observation` — UI rename not performed |

## Product truth inspected first (read-only)

Authoritative current source, not the stale browser constant:

| Path | Post-verify fact |
| --- | --- |
| `components/account/SecurityMFA.tsx` `handleVerify` | After successful `mfa.verify()`, sets toast `Authenticator-App erfolgreich aktiviert.`, clears `factorId` / QR / code, then `await refreshFactors()`. |
| `components/account/SecurityMFA.tsx` `refreshFactors` | Starts with `setMessage(null)`. The toast is therefore not a durable UI signal. |
| `lib/auth/account-security-lage.ts` | `totpListeLage` becomes `ready` when factors exist. `TOTP_LAGE_TEXTE.ready` = `Eingerichtete Authenticator-Apps.` `totpFaktorStatusText('verified')` = `bestätigt`. |
| Same SecurityMFA list | Renders heading `Eingerichtete Authenticator-Apps`, `data-security-lage={totpLage}`, and hides the `#totp-code` form once `factorId` is null. |

No product mutation. Timeout was not increased. The real-Mac G8 timeout at `enroll.success exceeded 15000ms` matches this source: G6/G7 passed, enrollment/verify ran, then the harness waited for a toast that `refreshFactors()` immediately clears.

## What this head implements

- G8 still requires a real enroll response/secret, real 6-digit TOTP, a verify POST, and a successful expected-actor-compatible verify payload when that payload is available.
- Final success observation waits for the durable confirmed-factor state: list copy + `bestätigt` + enrollment form gone.
- Fleeting/stale toast alone cannot PASS. Confirmed-factor state PASSes even when that toast is absent.
- Observed unsuccessful or wrong-actor verify payloads FAIL closed.
- G10 `forceNewEnrollment` refusal is unchanged.

Allowed files only: browser-flow `session.mjs`, `constants.mjs`, lane tests, own STATUS/HANDOFF/SELF_REVIEW, `docs/ACTIVE_WORK_STATUS.md`, task status line.

## Authoritative real-Mac trigger (not re-run here)

Authorized Apple-Silicon Mac full run `aaclr1-20260926T182151Z`:

- G6_login_ui_password = PASS
- G7_aal1_denied_step_up = PASS
- G8_totp_enroll_via_ui = FAIL only at `enroll.success exceeded 15000ms; run is terminal until cleanup`
- G9–G19 = NOT RUN after terminal state

This writer did not run a real Mac/browser lane.

## What was executed here

| Class | Result | Kind |
| --- | --- | --- |
| `node --test scripts/e2e/admin-account-counts-browser-flows-1/test.mjs` | **42/42 PASS, 0 FAIL** (1.8s) | controlled helpers only |
| Artifact | `/opt/cursor/artifacts/aacbf1-g8-enroll-success-observation-controlled-tests.log` | local agent evidence |
| Real Mac / Playwright / Docker / hosted Supabase / Production | **NOT RUN / NOT MUTATED** | forbidden by task |

Prior browser-flow suite remained green. Eleven G8 observation proofs were added.

## What is not done

- No real Mac/browser/Playwright execution
- No Docker cleanup (#570), runtime npm/cache, artifact-export, SQL/Auth, product, root-dep or CI change
- Independent Technical-Lead exact-head review has not happened
- Authorized later real-Mac full acceptance run after integration remains a later TL step

## First unfinished action

Technical Lead reviews the exact current head of Draft PR #571. Cursor does not Ready, merge, or start a follow-up.
