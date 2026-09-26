# Admin account counts local runtime 1

Executable isolated local acceptance **runtime** for the frozen two-lane interface in
`docs/ADMIN_ACCOUNT_COUNTS_LOCAL_RUNTIME_1_TASK_2026-09-23.md`.

This lane owns stack/schema/fixture/app/observer/orchestration and gates G0–G5 / G20.
The sibling browser-flow lane owns UI steps G6–G19. This directory does not import
unmerged sibling implementation.

## What the command actually does

```bash
# Safe default: isolated preflight + source identity + owned cleanup. No stack start,
# no official-archive download.
node scripts/e2e/admin-account-counts-local-runtime-1/run.mjs

# Explicit later offline inputs (do not invent HOME layout). Both flags are required.
# Hashes official bytes and extracts into newly owned tooling. Default no-start still
# does not invoke version/help.
node scripts/e2e/admin-account-counts-local-runtime-1/run.mjs --cli-archive <path> --cli-checksums <path>

# Explicit local-execution acknowledgement. After verified offline archive/member
# binding, invokes --version / --help / start --help, then the runtime stages.
# Cannot report fullLocalExecution=true. This correction does not download or run
# an official binary.
node scripts/e2e/admin-account-counts-local-runtime-1/run.mjs --runtime-only --cli-archive <path> --cli-checksums <path>

# Full mode. Loads scripts/e2e/admin-account-counts-browser-flows-1/flows.mjs.
# Absent sibling module => NOT_IMPLEMENTED, never an empty successful flow.
node scripts/e2e/admin-account-counts-local-runtime-1/run.mjs --full
```

Helper / contract tests (no GoTrue, no real app, no hosted DB):

```bash
node --test scripts/e2e/admin-account-counts-local-runtime-1/test.mjs
```

## Implemented execution path (review-fix head; execution remains distinct)

Official CLI **v2.117.0** general `--help` must match the official Effect CLI
root-help structure: primary usage `supabase <subcommand> [flags]` plus the
short-description `start` / `status` / `stop` command entries. The previously
modelled `supabase [flags]` usage remains only a separate compatibility
alternative and is never sufficient without those same three entries. The
historical Cobra form (`Usage: supabase [command]` plus long
local-development descriptions) remains a separate complete alternative.
`start --help` text alone is not root help. The old
`supabase start|stop|status` substring is not sufficient.

When an already-working local Docker daemon and verified official CLI **v2.117.0**
are present, `--runtime-only` / `--full` can:

1. Rebuild an allowlisted child env with a private HOME. Discover one verified
   local Unix Docker endpoint from the parent CLI/context first; set only that
   `DOCKER_HOST` in the child. Linux default sockets remain supported. Docker
   Desktop macOS local Unix endpoints are supported without a hard-coded
   username. Remote/tcp/ssh/cloud contexts fail closed. No inherited connector,
   provider, SMTP, NODE_OPTIONS, preload, `.env`, Docker credentials or remote
   Docker context. Private HOME never receives copied Docker config.
2. Create a run-owned Docker network with
   `com.docker.network.bridge.host_binding_ipv4=127.0.0.1` **before** start.
3. Start the official CLI against a disclosed overlay (unique project id,
   numeric loopback ports, Studio off, seed off). Auth semantics stay unchanged.
   Post-start publication is read from resolved `NetworkSettings.Ports` when
   that field exists. Empty `HostConfig.PortBindings` HostIp placeholders cannot
   override a concrete runtime mapping, and they cannot manufacture PASS when
   the runtime mapping is public, empty or malformed. HostConfig is only a
   bounded fallback when `NetworkSettings.Ports` is genuinely absent, and only
   explicit `127.0.0.1` can pass. Mailpit stays enabled.
4. Replay the committed migration inventory into that owned catalog.
5. Install the unchanged #557 producer + wrapper only. SHA256 must remain
   `612f755c12f1817e129226648b6c6fd2c1eba19b57bd163102a2eb5e344c12de` /
   `13fa3fe280d76d42ca6b2a1dff12077edc3d44a599a22300e89dd5578d63a6fb`.
6. Provision synthetic actors through the local GoTrue Admin API.
7. Launch unchanged Jetnity ON/OFF via locked `next dev` with the isolated
   app environment applied before spawn/compile. Readiness requires a
   meaningful non-500 response while the owned child is still live.
8. Observe the actual app-to-Supabase HTTP boundary with a transparent
   forwarding proxy. Page request events are not used as server-side proof.

Missing Docker is an **execution blocker**, not permission to ship placeholders
and not a Production P0 incident. This command never installs Docker.

Tracked dotenv templates such as `.env.example` are excluded from the isolated
checkout snapshot. Inherited `.env*` files and symlinks remain forbidden.
Browser ownership uses one registry map. The durable exporter preserves only
`${runId}-counts-desktop.png`, `${runId}-counts-mobile.png` and
`${runId}-browser-flows-gates.json` for a completed full consumer, then deletes
private HOME. Those files are validated before publication: current-run identity,
expected product head, exact G6–G19 with permitted results, and the known
producer metadata fields. `thisInvocation.observedResults` must match the
G6–G19 gate results in order. Screenshots must be CRC-valid RGB/RGBA PNGs
(bit depth 8 or 16) with IHDR/IDAT/IEND only, nonzero dimensions and an
inflated payload that matches IHDR. Illegal color/depth combinations and
unreviewed ancillary chunks such as tEXt/eXIf are refused. Credential-shaped
fields and fill/otpauth/JWT material are refused or redacted as whole strings.
Receipt writes are exclusive and never overwrite history.
Preflight/runtime-only do not require those files.

Owned Docker teardown classifies each container and each volume from that
resource's own inspect metadata. A container label does not authorize its
mounted volumes. Attachment to the run network does not override an explicit
foreign container label. A stale same-name owned record cannot suppress live
foreign identity. Exact-project CLI stop is skipped when foreign, unresolved
or conflicting identity is present. Official CLI objects are recognized from
inspected `com.supabase.cli.project`, not by inventing or applying labels.
The exact prepared project id is passed through default start into first
resource discovery. An unconfirmed stack CLI-child stop retains private
HOME and cannot PASS G20.

## Forbidden substitutes

- Hosted Production / Development query, DDL, grant, exposure or activation
- Parent `SUPABASE_*` / `NEXT_PUBLIC_SUPABASE_*` connector values
- `#550` reduced `auth.users` bootstrap on GoTrue
- Historical Kong/Envoy assumptions
- Unpinned `npx supabase@latest` or a silent CLI version switch
- Treating `--runtime-only` or an absent browser module as full PASS

## Section 4

`contractVersion` is exactly `jetnity.account-counts.local-acceptance.v1`.
Neither lane may change that interface unilaterally.
