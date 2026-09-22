# MFA Existing Factor Step-Up 1 — STATUS

Date: 2026-09-22  
Status: **IMPLEMENTATION DELIVERED / STOP FOR INDEPENDENT TECHNICAL-LEAD REVIEW**  
Issue: #541  
Draft PR: #542  
Branch: `fix/mfa-existing-factor-step-up-1`  
Agent: Jetnity MFA existing factor step-up 1, Generation 1  
Model: Cursor Grok 4.6 High Fast (`cursor-grok-4.6-high-fast`)  
Session: `bc-7a6af588-d7cf-4bd4-8707-fb4b3b8127a6`  
Baseline: `main@a3eb83b86d5aec604fb77d5d2b75d58c6a653ef1`  
Task seed: `fde86ba3b4fb7439e7386f8e4efbbd3ef132804d`  
Implementation: `e3c1c3d14b9bbec4f4ab22cfce4bf44d20f813f9`  
Follow-up on this delivery: typecheck/export-use + evidence/docs (this persist). Re-read `git rev-parse HEAD` for the frozen gate.

This is producer evidence. It is not a Technical-Lead PASS and is not Ready.

## Acknowledgement

Required model/session/branch/baseline were acknowledged before coding. Operating mode is `NORMAL`. This slice restores the existing challenge contract. It does not change authentication policy or waive special Product-Owner gates. Prior #538/#540 writers were not reused.

## Independently reproduced defect

On the unrepaired helper at the task seed, `startTotpChallenge` was invoked with the exact current-shape fixture from the task:

```json
{
  "all": [{ "id": "synthetic-factor", "factor_type": "totp", "status": "verified" }],
  "totp": [{ "id": "synthetic-factor", "factor_type": "totp", "status": "verified" }],
  "phone": []
}
```

Result: throw `Kein TOTP-Faktor gefunden. Bitte zuerst TOTP in den Sicherheitseinstellungen einrichten.` and `challengeCount === 0`. Receipt: `docs/evidence/mfa-existing-factor-step-up-1/repro-before.json`.

Cause: the helper searched `f.type === 'totp'`. Installed `@supabase/auth-js` `Factor` uses `factor_type`; `_listFactors` filters `factor_type === 'totp' && status === 'verified'` into `data.totp`. The same fixture after repair selects `synthetic-factor` and issues exactly one challenge.

## What changed

- `lib/auth/mfa.ts`: `startTotpChallenge` reads supported list shapes through the existing factor contract, selects the first verified TOTP (`factor_type` over legacy `type`), then issues one `challenge({ factorId })`. Public return remains `{ factorId, challengeId }`. Missing methods, rejected/thrown list, and unreadable responses stay errors. Empty / only-unverified / phone-only / missing-ID stay the existing no-factor message.
- `lib/auth/account-security-faktoren.ts`: added `mfaFaktorenListeLesen`, `istVerifizierterTotpFaktor`, `waehleVerifiziertenTotpFaktor`. `totpFaktorenAusAntwort` / `istTotpFaktor` / `totpFaktorTyp` public contracts unchanged.
- Tests: new `lib/auth/mfa.test.ts`; extended `lib/auth/account-security-faktoren.test.ts`.
- UI/consumers: `LoginForm`, `AdminMfaStepUp`, `admin-aal.ts`, AAL2 policy, enrollment, verify, and session duration were not edited.

## Local gates

| Check | Result |
| --- | --- |
| Full unit suite | 3771 pass / 0 fail |
| Owned MFA/admin regressions | 142 pass / 0 fail |
| `npm run typecheck` | pass after TS2367 fix |
| `npx eslint .` | 0 errors; 136 pre-existing warnings |
| `check:dead` / `exports` / `deps` / `api-schutz` / `schema-bezug` | pass |
| `npm run build` | pass |
| Local `auth:pruefen` | **UNAVAILABLE** — project/branch HTTP 401. Not a skipped-secret PASS. |

## CI / Auth / Preview on `e3c1c3d1` (superseded)

Run `35722111562` on the first implementation head:

- Auth job `106727158523` SUCCESS
- Typecheck/Lint/Build `106727158882` FAILED: `lib/auth/mfa.test.ts(329,18) TS2367` after `currentLevel` narrowing. Fixed by computing the Login AAL condition before the equality asserts.
- Vercel Preview Comments SUCCESS. Direct Preview for the later head must be re-read; do not treat the seed Preview as this delivery.

Those `e3c1c3d1` gates do not apply to the later head.

## Drift

`origin/main` re-read at handoff prep: still `a3eb83b86d5aec604fb77d5d2b75d58c6a653ef1`. Ahead 2 at implementation push; no unrequested merge/rebase/force.

## Limitations

- No real authenticated second-device retest and no Production factor/challenge/verify.
- Consumer proof is helper + `istKeinTotpFaktorFehler` + `MFATotpDialog` markup + source locks. It is not a hydrated Next `/login` or `/admin/mfa` browser pass.
- UI unchanged; no 390/desktop visual audit was required or claimed.
- No actual-device acceptance is claimed. The Product Owner can retest a real device switch after independent review and deployment.
