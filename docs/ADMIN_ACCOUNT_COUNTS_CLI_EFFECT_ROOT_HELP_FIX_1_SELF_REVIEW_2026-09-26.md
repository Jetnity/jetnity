# Admin Account Counts CLI Effect Root Help Fix 1 — SELF_REVIEW

This is author self-review, not an independent Technical-Lead PASS.

## Scope

Owned only:

- `scripts/e2e/admin-account-counts-local-runtime-1/cli-identity.mjs`
- `scripts/e2e/admin-account-counts-local-runtime-1/constants.mjs` (root-help signature constants only; CLI version/hash pins untouched)
- `scripts/e2e/admin-account-counts-local-runtime-1/test.mjs`
- `scripts/e2e/admin-account-counts-local-runtime-1/README.md`
- this slice STATUS / HANDOFF / SELF_REVIEW / task
- `docs/ACTIVE_WORK_STATUS.md`
- new sanitized receipts `aaclr1-20260926T095843Z-*`

Product/Auth/SQL/config/migration/root package/lock/CI, Docker endpoint, start-help, archive binding and #559 browser files were not changed. Official CLI 2.117.0 hashes were not changed.

## Review mapping

| Requirement | Correction |
| --- | --- |
| Accept official v2.117 Effect root help | `isOfficialCliEffectRootHelp()` requires `supabase [flags]` plus structural `start` / `status` / `stop` short-description entries |
| Exact real-Mac lines | fixture `supabase [flags]` + the three captured short descriptions PASS |
| Official-source Effect form with headings/spacing | `USAGE` / `COMMANDS` fixture PASS |
| Reject start-help as root help | `Usage: supabase start [flags]` and bare `supabase start [flags]` fail as root help; start-help predicate is unchanged |
| Reject missing command | all three Effect short-description entries required |
| Reject arbitrary sentence | no Effect usage identity and no complete structural trio |
| Reject Cobra start description as the sole Effect-root signature | Effect usage + long Cobra start text fails both forms |
| Historical Cobra support | complete Cobra usage + long descriptions, or complete Cobra usage + historical `supabase start\|status\|stop` lines, PASS only under that separate checker |
| Forms do not weaken each other | Effect fixture is not Cobra; Cobra fixture is not Effect; mixed fixture is neither |
| Preserve existing runtime tests | prior 45 tests still PASS; `--help` doubles in C2 / macOS endpoint tests still return the complete Cobra fixture |
| No Docker / Mac / official binary / Production | default no-start + helper doubles only |

## Misleading claims corrected

`codeCompleteClaim` remains false. Helper PASS is not a fourth real-Mac PASS. Default no-start `BLOCKED_ENVIRONMENT` on this Linux agent is expected: no docker executable and no official archive bytes.

Durable receipts still embed the previous macOS-Docker implementation note because `implementation.mjs` / `run.mjs` were outside this slice allowlist. That metadata is historical, not a claim that root-help is unchanged.

## Tests actually run

`node --test scripts/e2e/admin-account-counts-local-runtime-1/test.mjs` — **46/46 PASS** on this agent. Includes the prior 45 ownership/cleanup/endpoint/C2/Cobra-root cases plus the new Effect-root regressions.

`node scripts/e2e/admin-account-counts-local-runtime-1/run.mjs` — default no-start. Verdict `BLOCKED_ENVIRONMENT`, `fullLocalExecution=false`, `dockerUsable=false`, `cliVerified=false`, exit 2. Receipt `aaclr1-20260926T095843Z`. Official binaries/Docker/real stack/user's Mac/Playwright: **NOT RUN**.

## Residual risks

- P2: the next authorized real Mac run is still required to prove live `supabase --help` stdout matches this Effect structure
- P2: if the live binary writes root help only to stderr, or exits non-zero before stdout is captured, `tryExec` still treats that as `help.ok=false` and this parser never sees the text. That capture path was not changed here.
- P3: ANSI/color wrapping was not added because the captured real-Mac lines did not justify it. If the next live capture is only colorized, that is a later fail-closed parser tightening, not a reason to loosen this one.
- P3: Darwin tar/`--no-same-owner` extract still unverified
- Helper doubles cannot prove every live Effect column wrap beyond the captured usage line and the three official short descriptions

## Proactive note (out of scope)

#561 keyed the parser to a historical Go/Cobra root that the SHA-verified v2.117 release binary does not emit. After a later authorized Mac preflight proves `helpVerified=true`, the retained Cobra alternative is dead relative to this pin and can be removed in a later dedicated slice. Do not drop it in the same review pass. If the next live run still fails after this parser, inspect capture (stdout vs stderr / exit code) before guessing another description.

## Not claimed

Author does not claim TL PASS, Ready, merge, hosted parity, real-Mac acceptance, or full local execution.
