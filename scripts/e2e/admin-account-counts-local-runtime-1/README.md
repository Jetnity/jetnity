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
# Hashes official bytes, extracts into newly owned tooling. This correction does not
# execute the official binary.
node scripts/e2e/admin-account-counts-local-runtime-1/run.mjs --cli-archive <path> --cli-checksums <path>

# Setup validation only. Cannot report fullLocalExecution=true.
node scripts/e2e/admin-account-counts-local-runtime-1/run.mjs --runtime-only

# Full mode. Loads scripts/e2e/admin-account-counts-browser-flows-1/flows.mjs.
# Absent sibling module => NOT_IMPLEMENTED, never an empty successful flow.
node scripts/e2e/admin-account-counts-local-runtime-1/run.mjs --full
```

Helper / contract tests (no GoTrue, no real app, no hosted DB):

```bash
node --test scripts/e2e/admin-account-counts-local-runtime-1/test.mjs
```

## Implemented execution path (review-fix head; execution remains distinct)

When an already-working local Docker daemon and verified official CLI **v2.117.0**
are present, `--runtime-only` / `--full` can:

1. Rebuild an allowlisted child env with a private HOME. No inherited connector,
   provider, SMTP, NODE_OPTIONS, preload, `.env` or remote Docker context.
2. Create a run-owned Docker network with
   `com.docker.network.bridge.host_binding_ipv4=127.0.0.1` **before** start.
3. Start the official CLI against a disclosed overlay (unique project id,
   numeric loopback ports, Studio off, seed off). Auth semantics stay unchanged.
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
Browser ownership uses one registry map. Sanitized consumer receipts and
screenshots are exported to the durable evidence directory before private HOME
removal.

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
