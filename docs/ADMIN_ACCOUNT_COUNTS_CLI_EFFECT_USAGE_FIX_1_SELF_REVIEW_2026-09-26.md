# Admin Account Counts CLI Effect Usage Fix 1 — SELF_REVIEW

This is author self-review, not an independent Technical-Lead PASS.

## Scope

Owned only:

- `scripts/e2e/admin-account-counts-local-runtime-1/cli-identity.mjs`
- `scripts/e2e/admin-account-counts-local-runtime-1/test.mjs`
- `scripts/e2e/admin-account-counts-local-runtime-1/README.md`
- this slice STATUS / HANDOFF / SELF_REVIEW / task
- `docs/ACTIVE_WORK_STATUS.md`
- new sanitized receipts `aaclr1-20260926T102641Z-*`

Constants were not changed: CLI version/hash pins and Effect command short descriptions were already correct. Product/Auth/SQL/config/migration/root package/lock/CI, Docker endpoint, start-help, archive binding and #559 browser files were not changed. Official CLI 2.117.0 hashes were not changed.

## Review mapping

| Requirement | Correction |
| --- | --- |
| Accept official v2.117 Effect root usage | `hasOfficialCliEffectRootUsageIdentity()` now matches only the real line `supabase <subcommand> [flags]` |
| Optional heading/spacing | `USAGE` / `Usage` heading plus leading whitespace still accepted on that primary line |
| Exact real-Mac lines | fixture `supabase <subcommand> [flags]` + the three captured short descriptions PASS |
| Official-source Effect form with headings/spacing | headed fixture with the same usage line PASS |
| `[flags]` compatibility | `hasOfficialCliEffectFlagsOnlyRootUsageIdentity()` is a separate alternative; `isOfficialCliEffectRootHelp()` still requires all three Effect entries |
| Usage line alone is not enough | `supabase <subcommand> [flags]` or `supabase [flags]` without the three entries FAIL |
| Reject start-help as root help | `Usage: supabase start [flags]` and bare `supabase start [flags]` fail as root help; start-help predicate is unchanged |
| Reject missing command | all three Effect short-description entries required for both Effect usage forms |
| Reject arbitrary sentence | no Effect usage identity and no complete structural trio |
| Reject Cobra start description as the sole Effect-root signature | both Effect usage forms + long Cobra start text fail both Effect and Cobra checkers |
| Historical Cobra support | complete Cobra usage + long descriptions, or complete Cobra usage + historical `supabase start\|status\|stop` lines, PASS only under that separate checker |
| Forms do not weaken each other | primary Effect fixture is not flags-only usage and not Cobra; flags-only is not primary usage; mixed fixtures are neither |
| Preserve existing runtime tests | prior 46 tests still PASS |
| No Docker / Mac / official binary / Production | default no-start + helper doubles only |

## Misleading claims corrected

`codeCompleteClaim` remains false. Helper PASS is not a fifth real-Mac PASS. Default no-start `BLOCKED_ENVIRONMENT` on this Linux agent is expected: no docker executable and no official archive bytes.

Durable receipts still embed the previous macOS-Docker implementation note because `implementation.mjs` / `run.mjs` were outside this slice allowlist. That metadata is historical, not a claim that root-usage is unchanged.

## Tests actually run

`node --test scripts/e2e/admin-account-counts-local-runtime-1/test.mjs` — **46/46 PASS** on this agent. Includes the prior 46 ownership/cleanup/endpoint/C2/Cobra-root/Effect-root cases; the Effect-root test now uses the real `<subcommand>` usage line and keeps `[flags]` as compatibility.

`node scripts/e2e/admin-account-counts-local-runtime-1/run.mjs` — default no-start. Verdict `BLOCKED_ENVIRONMENT`, `fullLocalExecution=false`, `dockerUsable=false`, `cliVerified=false`, exit 2. Receipt `aaclr1-20260926T102641Z`. Official binaries/Docker/real stack/user's Mac/Playwright: **NOT RUN**.

## Residual risks

- P2: the next authorized real Mac run is still required to prove live `supabase --help` stdout matches this Effect usage line plus the three short descriptions
- P2: if the live binary writes root help only to stderr, or exits non-zero before stdout is captured, `tryExec` still treats that as `help.ok=false` and this parser never sees the text. That capture path was not changed here.
- P3: ANSI/color wrapping was not added because the captured real-Mac lines did not justify it. If the next live capture is only colorized, that is a later fail-closed parser tightening, not a reason to loosen this one.
- P3: Darwin tar/`--no-same-owner` extract still unverified
- Helper doubles cannot prove every live Effect column wrap beyond the captured usage line and the three official short descriptions

## Proactive note (out of scope)

#562 keyed the Effect usage identity to `supabase [flags]`. The SHA-verified v2.117 release binary actually emits `supabase <subcommand> [flags]`. After a later authorized Mac preflight proves `helpVerified=true`, the retained `[flags]` compatibility and the Cobra alternative are dead relative to this pin and can be removed in a later dedicated slice. Do not drop them in the same review pass. If the next live run still fails after this parser, inspect capture (stdout vs stderr / exit code) before guessing another description.

## Not claimed

Author does not claim TL PASS, Ready, merge, hosted parity, real-Mac acceptance, or full local execution.
