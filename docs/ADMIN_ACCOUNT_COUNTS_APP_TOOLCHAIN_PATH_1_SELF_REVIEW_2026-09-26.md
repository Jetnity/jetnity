# Admin Account Counts App Toolchain PATH Fix 1 — SELF_REVIEW

This is author self-review, not an independent Technical-Lead PASS.

## Scope

Owned only this correction:

- `scripts/e2e/admin-account-counts-local-runtime-1/runtime.mjs`
  - add `baueRuntimeAppParentQuelle(childEnv)`
  - refuse raw `process.env` and non-object sources
  - reuse one `appParentEnv` for prepare, initial launch and controller restart
- `scripts/e2e/admin-account-counts-local-runtime-1/test.mjs`
  - prove empty `parentEnv` still drops PATH
  - prove sanitized PATH survives while Docker/Node/hosted/provider/SMTP/Vercel values do not
  - prove initial and restart builders share the same parent source
  - prove `defaultInstallLockedDependencies` resolves a controlled fake `npm` through that PATH
  - prove missing npm still fails closed
  - pin `runtime.mjs` no longer uses `parentEnv: {}`
- this slice STATUS / HANDOFF / SELF_REVIEW
- `docs/ACTIVE_WORK_STATUS.md`
- task status line only

`app.mjs` and `env.mjs` were not changed. Canonical Supabase config, official CLI archive/binary bytes, Docker Desktop/daemon settings, product/Auth/SQL/migrations, root package/lock/CI and Docker publish shim were not changed.

Unrelated workspace drift `next-env.d.ts` was restored and never staged.

## Review mapping

| Requirement | Correction |
| --- | --- |
| Do not pass raw `process.env` | helper identity-rejects `process.env` |
| Reuse sanitized runtime `childEnv` | `appParentEnv = baueRuntimeAppParentQuelle(childEnv)` |
| Allowlist rebuild stays authoritative | still `baueRuntimeAppUmgebung` / `bauePreflightUmgebung` |
| Docker / NODE_OPTIONS / hosted / provider / SMTP / Vercel stripped | contract test asserts absence even when supplied in the candidate |
| Same source for prepare, launch, restart | one `appParentEnv` used in all three sites; source pin requires three `parentEnv: appParentEnv` |
| Private HOME + offline/no-script npm | still rebuilt by allowlist; receipt asserts `npm_config_offline` / `ignore_scripts` |
| Locked `npm ci --no-audit --no-fund` | unchanged installer; fake npm receipt argv pin |
| Missing npm fail-closed | empty PATH still ENOENT |
| No Docker/CLI/config/Auth/SQL/product/CI change | only runtime parent source + tests + docs |

## Misleading claims corrected

`codeCompleteClaim` remains false. Helper PASS is not a real-Mac PASS and does not prove the next live app boot. This writer did not run `run.mjs`, official binaries, Docker, or Playwright.

The cited Mac failure receipt path is not present in this checkout. That absence is recorded; it is not treated as a new Production or hosted incident.

The first fake-npm test revision used `#!/usr/bin/env node`. Isolated PATH correctly omitted a `node` binary, so the shebang failed after npm was resolved. The controlled fake npm now uses `#!${process.execPath}` so the test proves PATH resolution of `npm` without requiring `node` on the isolated PATH.

## Tests actually run

`node --test scripts/e2e/admin-account-counts-local-runtime-1/test.mjs` — **61/61 PASS, 0 FAIL** on this Linux agent (13.7s). Log: `/opt/cursor/artifacts/aaclr1-app-toolchain-path-controlled-tests.log`.

Real Docker / official CLI / user's Mac / hosted Supabase / Production: **NOT RUN / NOT MUTATED**.

## Residual risks

- P0: the next authorized real Mac run is still required to prove live locked `npm ci` now resolves the real npm through the sanitized PATH after the local stack starts
- P2: `childEnv` after Docker-shim composition remains the harness env, not the CLI shim PATH. That is intended; the app must not inherit the docker shim
- P2: if a later caller passes an unsanitized object that is not `process.env`, the allowlist still strips it, but the helper does not deep-copy. Mutation of `childEnv` after selection would also mutate the shared launch/restart source
- P3: source-text pins on `runtime.mjs` catch the exact empty-parent regression; they do not execute `defaultStartRuntime` through app install

## Proactive note (out of scope)

`defaultInstallLockedDependencies` still resolves the bare command `npm` from PATH. That is the accepted locked-install contract. A later dedicated slice could record the resolved npm path in the run receipt after a successful real install. Do not start that here.

Traveller-context intelligence is not relevant to this local harness PATH repair.

## Not claimed

Author does not claim TL PASS, Ready, merge, hosted parity, real-Mac acceptance, or full local execution.
