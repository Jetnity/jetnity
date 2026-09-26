# Admin Account Counts G8 Enroll Success Observation 1

Date: 2026-09-26
Status: IMPLEMENTATION FROZEN FOR INDEPENDENT TL REVIEW / DO NOT READY / DO NOT MERGE
Base: `26b763016322fb1c929e131b4ff5bf467533e809`
Branch: `fix/admin-account-counts-g8-enroll-success-observation-1`

## Trigger

Real Apple-Silicon Mac full run:
`aaclr1-20260926T182151Z`

Private browser receipt proves:
- G6_login_ui_password = PASS
- G7_aal1_denied_step_up = PASS
- G8_totp_enroll_via_ui = FAIL
- G8 failure note:
  `enroll.success exceeded 15000ms; run is terminal until cleanup`
- G9–G19 = NOT RUN due terminal ownership uncertainty.

Current G8 implementation:
- navigates to real security UI;
- clicks real enroll button;
- waits for real local `/auth/v1/factors` response;
- extracts real in-memory TOTP secret;
- generates 6-digit TOTP;
- fills real UI code input;
- clicks real confirm;
- observes local `/verify` response if available;
- then waits for exact UI copy:
  `Authenticator-App erfolgreich aktiviert.`

The real failure is at the final success observation only.

## Goal

Align G8 success observation with the actual current Jetnity product MFA UI after successful local factor verify, without weakening the requirement that enrollment/verification really succeeded.

## Required first step: inspect product truth

Before changing browser flow:
1. inspect the current product source for the MFA/TOTP enrollment UI and verify-success transition;
2. identify the exact post-verify behavior:
   - success text,
   - redirect,
   - factor list state,
   - step-up state,
   - confirmed-factor UI,
   - or another deterministic product signal;
3. document the observed source paths and exact behavior in STATUS/SELF_REVIEW.

Do NOT assume the stale browser constant is still product truth.

## Required design

G8 may PASS only after all of these remain true:
- real enrollment response produced a TOTP secret;
- real 6-digit code was generated from that secret;
- real verify POST was triggered;
- verification returned a successful, expected-actor-compatible result when payload/token is available;
- the browser observes the current product's deterministic post-verify success state.

The final UI success predicate must be based on actual product source and may use one or more of:
- exact current success copy;
- confirmed factor visible in the UI;
- deterministic redirect to the expected security/step-up route;
- disappearance of enrollment form plus confirmed state;
- other source-backed stable product signal.

### Forbidden shortcuts
- do not PASS from elapsed time;
- do not PASS solely because verify request existed;
- do not remove verify/actor checks;
- do not hard-code a broader arbitrary text match;
- do not increase timeout as the only fix unless source + real timing evidence proves the current state is correct but legitimately exceeds 15s;
- do not change product UI unless the product itself is wrong;
- do not forge AAL2/session/storage/cookies.

## Timing

Keep fail-closed ownership semantics.
If the actual product transition needs a bounded wait, use the existing run budget and a source-backed predicate.
A timeout must still terminate the browser lane safely.

## Tests required

Add controlled tests for:
1. current source-backed post-verify success state => PASS;
2. stale old success copy absent but current valid state present => PASS, if source confirms this case;
3. verify response failure => FAIL;
4. wrong actor payload/token => FAIL;
5. no verify response and no deterministic success state => FAIL;
6. enrollment response without secret => FAIL;
7. timeout without success state => ownership uncertainty/FAIL as before;
8. no arbitrary text can manufacture PASS;
9. G10 existing-factor path is not weakened;
10. prior browser-flow suite remains green.

## Important separation

Do NOT modify:
- Docker cleanup classifier (#570);
- runtime npm/cache/canonicalization;
- artifact export/missing screenshot policy in this slice.

Missing G18 screenshots are a consequence of G8 terminal failure and remain a separate evidence/export concern.

## Scope

Allowed:
- `scripts/e2e/admin-account-counts-browser-flows-1/session.mjs`
- `scripts/e2e/admin-account-counts-browser-flows-1/constants.mjs` only if stale UI copy is proven
- browser-flow tests in the same lane
- own STATUS/HANDOFF/SELF_REVIEW
- `docs/ACTIVE_WORK_STATUS.md`

Product source is READ-ONLY for this slice unless independent inspection proves an actual product defect and the TL explicitly issues CHANGES REQUIRED for a separate product slice.

Forbidden:
- runtime cleanup files
- E2E npm/cache
- SQL/Auth policy changes
- product mutation without separate TL decision
- root dependencies/CI
- Production

## Agent

Logical name: **Jetnity admin account counts G8 enroll success observation 1**
Generation: **1**
Required model: **cursor-grok-4.6-high-fast**

## STOP

Do not Ready.
Do not merge.
Do not start follow-up.
STOP for independent Technical-Lead exact-head review.
