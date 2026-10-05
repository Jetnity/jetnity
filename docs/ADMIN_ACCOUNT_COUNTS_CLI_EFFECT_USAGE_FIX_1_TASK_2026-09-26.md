# Admin Account Counts CLI Effect Usage Fix 1 — TASK

Date: 2026-09-26
Base: 4beaca99586c4f7f1a25e0ab90ed37a3eae965fb
Branch: fix/admin-account-counts-cli-effect-usage-1
Mode: NORMAL

## Trigger — fourth real Mac attempt

The Product Owner fast-forwarded the Apple-Silicon Mac to exact main 4beaca99586c4f7f1a25e0ab90ed37a3eae965fb and reran the already-authorized full local acceptance exactly once.

Observed summary:
- dockerUsable=true
- cliVerified=false
- fullLocalExecution=false
- stack/browser did not start
- this is still a G0 preflight-only block, not a failed application/browser acceptance.

The immediately preceding read-only direct `--help` capture against the SAME pinned SHA-verified Supabase CLI 2.117.0 Darwin ARM64 release binary showed the actual Effect CLI root usage line as:

`supabase <subcommand> [flags]`

and the actual required root command entries:
- `start   Start local Supabase stack`
- `status  Show status of local Supabase containers`
- `stop    Stop all local Supabase containers`

#562 correctly changed the short-description signatures, but its `hasOfficialCliEffectRootUsageIdentity()` still requires only:
`supabase [flags]`

That cannot match the real release-binary usage line with `<subcommand>`.

## Required end state

Implement the smallest fail-closed root-usage correction.

1. Primary v2.117 Effect root identity MUST recognize the real usage line:
- `supabase <subcommand> [flags]`
- allow harmless leading whitespace and the renderer's optional USAGE/Usage heading form.
- If supporting the previously-modelled `supabase [flags]` form, it must be a separate strict compatibility alternative and must NOT be sufficient without all three Effect command entries.

2. Keep all three exact Effect command short descriptions required:
- start = `Start local Supabase stack`
- status = `Show status of local Supabase containers`
- stop = `Stop all local Supabase containers`

3. Preserve strict rejection:
- subcommand help `supabase start [flags]`
- arbitrary prose
- missing any of start/status/stop
- mixed Effect usage + Cobra long start description
- unrelated binary help.

4. Preserve historical Cobra root path only as its own fully strict alternative. Do not mix signatures.

5. Do NOT change:
- CLI v2.117.0 pin, hashes, archive binding
- version check
- start --help check
- Docker endpoint logic
- runtime/stack/browser/ownership/cleanup
- Product/Auth/SQL/migrations/config/root deps/CI
- Production/hosted state.

6. Controlled tests:
- exact real-Mac root help fixture with `supabase <subcommand> [flags]` + exact three Effect entries => PASS
- same with heading/spacing => PASS
- `supabase [flags]` compatibility only if intentionally retained and still requiring all three entries
- `supabase start [flags]` => FAIL root help
- missing command => FAIL
- mixed Effect/Cobra => FAIL
- composed version + real Effect root help + unchanged start-help => identityVerified=true
- preserve all existing tests.

## Scope

Allowed:
- scripts/e2e/admin-account-counts-local-runtime-1/cli-identity.mjs
- scripts/e2e/admin-account-counts-local-runtime-1/test.mjs
- constants only if truly necessary
- README if needed
- own STATUS/HANDOFF/SELF_REVIEW/new sanitized evidence
- docs/ACTIVE_WORK_STATUS.md continuity only

Forbidden:
- Docker endpoint files
- run/runtime/stack/browser/cleanup behavior
- #559 browser files
- product/Auth/SQL/migrations/config/root dependencies/package-lock/CI
- CLI upgrade
- hosted/Production mutation
- user's Mac execution by Cursor

Freeze one coherent head. Do not Ready. Do not merge. STOP for independent TL review.
