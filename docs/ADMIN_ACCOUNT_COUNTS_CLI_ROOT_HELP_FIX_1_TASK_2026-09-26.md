# Admin Account Counts CLI Root Help Fix 1 — TASK

Date: 2026-09-26
Base: 4df0a8bff16f050314a3a0bc75827a9764173eb7
Branch: fix/admin-account-counts-cli-root-help-1
Mode: NORMAL

## Trigger — second real Mac preflight

After #560 was merged and the Product Owner fast-forwarded the Apple-Silicon Mac to exact main 4df0a8bff16f050314a3a0bc75827a9764173eb7, the explicitly authorized full local acceptance command was rerun once.

Real Mac evidence now proves the Docker compatibility fix works:
- platform: darwin-arm64
- Docker present=true
- Docker usable=true
- endpoint ok=true / verified=true
- endpoint kind=docker-desktop-unix
- source=docker-context
- contextName=desktop-linux
- sanitized host=unix://<redacted-home>/.docker/run/docker.sock
- usedExplicitLocalHost=true

Pinned Supabase CLI evidence:
- selected=2.117.0
- archiveBound=true
- version=2.117.0
- versionVerified=true
- startHelpVerified=true
- helpVerified=false
- failedIdentityChecks=["help"]
- identityVerified=false

Therefore the real stack/browser still did NOT start. This is a narrow parser compatibility defect in the general/root `supabase --help` verification, not Docker, not archive provenance and not a Production incident.

Current root-help predicate on main is too strict:
`CLI.helpPattern = /supabase\s+(start|stop|status)/i`

Actual Cobra root help lists commands as command-name + description (for example `start Start containers for Supabase local development`, `status Show status of local Supabase containers`, `stop Stop all local Supabase containers`) rather than repeating the binary prefix on each command line. The v2.117.0 official repository docs preserve those command descriptions. The real Mac proves `start --help` itself is already correctly recognized.

## Required end state

Implement the smallest fail-closed root-help parser correction.

1. Do NOT change:
- CLI version pin 2.117.0
- archive/checksum digests
- archive binding/extracted binary proof
- version parser
- `start --help` parser or requirement
- Docker endpoint logic
- runtime/stack/browser/cleanup semantics

2. General/root `--help` verification must accept the official Cobra root-help shape for 2.117.0 without becoming permissive.
Prefer structural verification over one loose substring. Require a coherent root help, such as:
- root usage/help identity for `supabase`, AND
- the expected local-development command entries for `start`, `status`, and `stop` with their official descriptions (or an equivalently strict v2.117-root-help signature).

3. It must reject:
- arbitrary text containing only `start`
- subcommand help masquerading as root help
- missing `status` or `stop`
- unrelated/new binary help text without the expected Supabase root structure.

4. Tests:
- exact/representative official v2.117 Cobra root-help fixture => PASS
- historical old matcher case still supported only if it is genuinely root-help compatible
- missing one required command => FAIL
- `start --help` text alone => FAIL as root help
- arbitrary `supabase start` sentence => FAIL
- full identity composition: version PASS + corrected root help PASS + start-help PASS => identityVerified true.
Preserve all existing 44 runtime tests.

5. Evidence:
- no real Docker/official binary/Mac/hosted/Production execution by Cursor.
- exact-head CI/Auth/Preview.
- same pinned version/hash facts.

## Scope

Allowed:
- scripts/e2e/admin-account-counts-local-runtime-1/cli-identity.mjs
- scripts/e2e/admin-account-counts-local-runtime-1/constants.mjs only if necessary
- scripts/e2e/admin-account-counts-local-runtime-1/test.mjs
- runtime README if needed
- own STATUS/HANDOFF/SELF_REVIEW/new sanitized evidence
- docs/ACTIVE_WORK_STATUS.md continuity update

Forbidden:
- Docker endpoint/ownership/cleanup behavior unless test import only
- #559 browser code
- product/Auth/SQL/migrations/config/root dependency/lock/CI
- Production/hosted mutation
- CLI version upgrade
- provider/payment/launch/cost changes
- user's Mac execution by Cursor

Freeze one coherent head. Do not Ready. Do not merge. STOP for independent TL review.
