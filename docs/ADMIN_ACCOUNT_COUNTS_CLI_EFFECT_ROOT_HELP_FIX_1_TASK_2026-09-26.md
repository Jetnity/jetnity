# Admin Account Counts CLI Effect Root Help Fix 1 — TASK

Date: 2026-09-26
Base: 6cdc357f2759bda8b4196e5643ba3847e13151b3
Branch: fix/admin-account-counts-cli-effect-root-help-1
Mode: NORMAL

## Trigger — third real Mac preflight + direct binary help capture

Third explicitly authorized real Mac full run on exact main 6cdc357f2759bda8b4196e5643ba3847e13151b3:
- dockerUsable=true
- cli archiveBound=true
- versionVerified=true
- startHelpVerified=true
- helpVerified=false
- failedIdentityChecks=["help"]
- G1 source pins PASS
- G20 cleanup PASS
- G2–G19 NOT RUN because G0 remained BLOCKED solely on supabase-cli root help.

The Product Owner then executed a read-only diagnostic against the SAME pinned, SHA-verified Supabase CLI 2.117.0 Darwin ARM64 archive. No containers were started. Actual root help contains:
- `supabase [flags]`
- `start   Start local Supabase stack`
- `status  Show status of local Supabase containers`
- `stop    Stop all local Supabase containers`

This is authoritative real-binary evidence.

Independent official-source verification at tag `v2.117.0`:
- `apps/cli/src/cli/root.ts` defines `legacyRoot = Command.make("supabase")` + `Command.withSubcommands([... legacyStartCommand, legacyStatusCommand, legacyStopCommand ...])`; this is Effect CLI, not the old Go Cobra root renderer.
- `apps/cli/src/commands/start/start.command.ts` has short description `Start local Supabase stack`.
- `status.command.ts` short description `Show status of local Supabase containers`.
- `stop.command.ts` short description `Stop all local Supabase containers`.

Therefore #561's parser was still keyed to the historical Go/Cobra root shape (`Usage: supabase [command]` + long descriptions) and cannot recognize the actual v2.117 release-binary root help.

## Required end state

Implement the smallest fail-closed parser correction for the ACTUAL v2.117 Effect-CLI root-help shape.

1. Preserve without change:
- CLI pin 2.117.0
- release/archive/checksum digests
- archive-to-extracted-binary binding
- version parser/requirement
- `start --help` parser/requirement
- Docker endpoint logic from #560
- runtime/stack/browser/ownership/cleanup semantics
- Production/hosted state.

2. Root help acceptance:
- recognize the official Effect CLI root identity for v2.117, including the actual root usage form `supabase [flags]` (allow harmless surrounding headings/formatting/ANSI stripping only if already justified by actual output);
- require ALL THREE official v2.117 short-description command entries:
  - start -> `Start local Supabase stack`
  - status -> `Show status of local Supabase containers`
  - stop -> `Stop all local Supabase containers`
- command entries must be structural root-level help entries, not arbitrary prose.

3. Historical compatibility:
- It is acceptable to retain support for the already-modeled Go/Cobra root form ONLY as a separate strict alternative if structurally complete. Do not let one form weaken the other.
- The real v2.117 Effect form is the primary required form.

4. Reject:
- `supabase start [flags]` subcommand help;
- only one/two of the required command entries;
- arbitrary sentences mentioning start/status/stop;
- wrong start description (`Start containers for Supabase local development`) if used as the sole Effect-root signature;
- unrelated binary help.

5. Tests:
- fixture matching the exact real-Mac lines above => PASS;
- official-source Effect form with headings/spacing => PASS;
- start-help => FAIL as root help;
- missing start/status/stop => FAIL;
- arbitrary sentence => FAIL;
- historical full Cobra form, if retained => PASS only under its own complete strict signature;
- composed identity: version + real Effect root help + unchanged start-help => identityVerified=true.
Preserve all existing runtime tests.

6. Evidence truth:
- no real Docker, no official binary execution, no user's Mac execution by Cursor;
- exact-head CI/Auth/Preview;
- helper tests are not full-local acceptance.

## Scope

Allowed:
- scripts/e2e/admin-account-counts-local-runtime-1/cli-identity.mjs
- scripts/e2e/admin-account-counts-local-runtime-1/constants.mjs only for exact root-help signature constants
- scripts/e2e/admin-account-counts-local-runtime-1/test.mjs
- runtime README if needed
- own STATUS/HANDOFF/SELF_REVIEW/new sanitized evidence
- docs/ACTIVE_WORK_STATUS.md continuity only

Forbidden:
- Docker endpoint code
- run/runtime/stack/browser/cleanup behavior
- #559 browser files
- product/Auth/SQL/migrations/config/root dependencies/package-lock/CI
- CLI upgrade
- hosted/Production mutation
- provider/payment/launch/cost action
- user's Mac execution by Cursor

Freeze one coherent head. Do not Ready. Do not merge. STOP for independent TL review.
