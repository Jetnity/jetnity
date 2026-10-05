# Admin Account Counts macOS Docker Runtime Fix 1 — TASK

Date: 2026-09-26
Owner: Cursor implementation agent, independently reviewed by Jetnity TL
Base: b440a6759c7c479d1b7509ecbefcac7b95c4ea35
Branch: fix/admin-account-counts-macos-docker-runtime-1
Mode: NORMAL

## Trigger / real evidence

The first explicitly authorized real local execution on an Apple-Silicon Mac with Docker Desktop running exited during preflight in ~1 second.

Host evidence before the run:
- Docker Desktop Engine running.
- `docker --version` = 29.8.0.
- `docker compose version` = v5.5.1.
- `docker info` succeeds under active Docker Desktop context `desktop-linux`.
- Architecture aarch64; local engine, not remote.
- Node 22.x and clean exact Jetnity main checkout.

Harness evidence from the attempted full run:
- `failed to connect to the docker API at unix:///var/run/docker.sock ... no such file or directory`
- `dockerUsable: false`
- `cliVerified: false`
- `fullLocalExecution: false`
- no stack/browser stages started.

Source cause on base main:
- `baueRuntimePreflightUmgebung()` forcibly sets `DOCKER_HOST=unix:///var/run/docker.sock`.
- `baueDockerCliUmgebung()` defaults to the same path.
- This discards Docker Desktop's valid local macOS Unix endpoint/context.
- `supabase start --help` is invoked in the same isolated environment, so the same wrong Docker endpoint may also make CLI identity verification false.

This is a P2/P3 local harness compatibility blocker, not a Production incident.

## Required end state

Implement the smallest safe cross-platform correction so the reviewed local acceptance harness can use Docker Desktop on macOS without weakening isolation.

1. Resolve Docker endpoint truthfully before isolated execution.
   - Discover the active Docker CLI/context read-only from the parent machine environment only as an input to local endpoint selection.
   - Accept ONLY a local Unix Docker endpoint (`unix://...`), never tcp/ssh/http/cloud/remote contexts.
   - Linux default `/var/run/docker.sock` / `/run/docker.sock` remains supported.
   - Docker Desktop macOS local Unix endpoints/contexts must be supported without hard-coding a username or machine-specific absolute path.
   - Do not inherit arbitrary `DOCKER_HOST`, `DOCKER_CONTEXT`, TLS/cert values into child environments.

2. Isolated child environment remains authoritative.
   - After verified local endpoint discovery, set only the exact verified local `DOCKER_HOST` in the private child environment.
   - Continue deleting `DOCKER_CONTEXT`, cert/TLS variables and cloud/hosted/provider credentials.
   - Private HOME remains private; do not depend on copied Docker credentials/config inside it.
   - If endpoint discovery is absent, ambiguous, remote, missing or daemon verification fails, fail closed as BLOCKED.

3. Docker capability proof.
   - `docker info` must succeed using the explicit verified local Unix endpoint in the isolated env.
   - Record enough sanitized evidence to distinguish endpoint kind/context without persisting a user's absolute home path.
   - No docker login, no credential-store access requirement, no mutation during preflight.

4. Supabase CLI identity interaction.
   - Re-run the exact official-byte identity path under the corrected isolated Docker env.
   - Do not weaken version/help/start-help checks merely to obtain PASS.
   - If `cliVerified` still fails independently, surface which of version/help/start-help failed in sanitized diagnostics and STOP rather than guessing.
   - Preserve pinned CLI 2.117.0 hashes and archive-binding rules unchanged.

5. Tests.
   Add controlled tests for:
   - Linux default local socket success.
   - macOS Docker Desktop-style local Unix endpoint success with private HOME.
   - remote/tcp/ssh context refusal.
   - parent hostile `DOCKER_HOST` not blindly inherited.
   - missing/non-responsive local endpoint blocks.
   - corrected endpoint is used consistently by Docker capability and official CLI start-help verification path.
   - no regression to existing ownership/cleanup/foreign-resource protections.

## Scope

Allowed:
- `scripts/e2e/admin-account-counts-local-runtime-1/**`
- own status/handoff/self-review/new sanitized evidence
- this task doc

Forbidden:
- product UI/Auth/business logic
- SQL/migrations/grants/Production
- #559 browser implementation changes unless only an import/path compatibility change is proven unavoidable (report first; default no)
- root dependencies/package-lock/CI changes
- Docker installation/system settings
- hosted Supabase fallback
- real users/secrets/providers/payments/launch
- user's Mac execution by the agent

## Delivery

Freeze one coherent head, report exact diff, controlled tests, CI/Auth/Preview and remaining real-Mac execution step. Do not mark Ready, do not merge, do not start a follow-up. STOP for independent TL review.
