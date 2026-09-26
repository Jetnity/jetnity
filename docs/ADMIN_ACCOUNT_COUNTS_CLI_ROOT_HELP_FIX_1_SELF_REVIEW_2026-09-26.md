# Admin Account Counts CLI Root Help Fix 1 — SELF_REVIEW

This is author self-review, not an independent Technical-Lead PASS.

## Scope

Owned only:

- `scripts/e2e/admin-account-counts-local-runtime-1/cli-identity.mjs`
- `scripts/e2e/admin-account-counts-local-runtime-1/constants.mjs` (root-help command pins only; CLI version/hash pins untouched)
- `scripts/e2e/admin-account-counts-local-runtime-1/test.mjs`
- `scripts/e2e/admin-account-counts-local-runtime-1/README.md`
- this slice STATUS / HANDOFF / SELF_REVIEW / task
- `docs/ACTIVE_WORK_STATUS.md`
- new sanitized receipts `aaclr1-20260926T014638Z-*`

Product/Auth/SQL/config/migration/root package/lock/CI, Docker endpoint, start-help, archive binding and #559 browser files were not changed. Official CLI 2.117.0 hashes were not changed.

## Review mapping

| Requirement | Correction |
| --- | --- |
| Accept official v2.117 Cobra root help | `isOfficialCliRootHelp()` requires `Usage:` + `supabase [command]` plus `start` / `status` / `stop` entries with official descriptions |
| Reject start-help as root help | `Usage: supabase start [flags]` is classified as subcommand help |
| Reject arbitrary `supabase start` sentence | no root usage identity |
| Reject missing command | all three local-development entries required |
| Historical matcher only if root-compatible | `supabase start/stop/status` lines accepted only with the same Usage identity |
| Preserve existing runtime tests | prior 44 tests still PASS; `--help` doubles now return the official Cobra fixture |
| No Docker / Mac / official binary / Production | default no-start + helper doubles only |

## Misleading claims corrected

`codeCompleteClaim` remains false. Helper PASS is not a third real-Mac PASS. Default no-start `BLOCKED_ENVIRONMENT` on this Linux agent is expected: no docker executable and no official archive bytes.

Durable receipts still embed the previous macOS-Docker implementation note because `implementation.mjs` / `run.mjs` were outside this slice allowlist. That metadata is historical, not a claim that root-help is unchanged.

## Tests actually run

`node --test scripts/e2e/admin-account-counts-local-runtime-1/test.mjs` — **45/45 PASS** on this agent. Includes the prior 44 ownership/cleanup/endpoint/C2 cases plus the new root-help regressions.

`node scripts/e2e/admin-account-counts-local-runtime-1/run.mjs` — default no-start. Verdict `BLOCKED_ENVIRONMENT`, `fullLocalExecution=false`, `dockerUsable=false`, `cliVerified=false`, exit 2. Receipt `aaclr1-20260926T014638Z`. Official binaries/Docker/real stack/user's Mac/Playwright: **NOT RUN**.

## Residual risks

- P2: the next authorized real Mac run is still required to prove live `supabase --help` stdout matches this Cobra structure
- P2: if the live binary writes root help only to stderr, or exits non-zero before stdout is captured, `tryExec` still treats that as `help.ok=false` and this parser never sees the text. That capture path was not changed here.
- P3: Darwin tar/`--no-same-owner` extract still unverified
- Helper doubles cannot prove the exact live Cobra column wrapping or group headings beyond the official v2.117 command descriptions

## Proactive note (out of scope)

The previous root-help fallback also accepted any text containing the start-help sentence. That would have been too loose after this slice and is now rejected. If a later official CLI changes the three command descriptions, the pins in `CLI.rootHelpCommands` must be updated with that version, not loosened to a substring.

## Not claimed

Author does not claim TL PASS, Ready, merge, hosted parity, real-Mac acceptance, or full local execution.
