# Admin Account Counts Docker Publish Shim 1 — TASK

Date: 2026-09-26
Base: 8bb9dd31d5b1a585262c3e773bddab0693d0d3ba
Branch: fix/admin-account-counts-docker-publish-shim-1
Mode: NORMAL

## Trigger — real Docker Desktop binding is genuinely public

Latest already-authorized Apple-Silicon Mac full run after #564:
- exact main 8bb9dd31d5b1a585262c3e773bddab0693d0d3ba
- G0 and CLI identity already clear
- official Supabase CLI-managed stack starts
- run id: `aaclr1-20260926T113202Z`
- post-start runtime truth now correctly reports:
  `{"containerPort":"8025/tcp","HostIp":"0.0.0.0","HostPort":"54324"}`
- harness correctly aborts. This is NOT a parser false-positive.

The earlier run-owned bridge option
`com.docker.network.bridge.host_binding_ipv4=127.0.0.1`
is not sufficient on this real Docker Desktop path.

Official / pinned Supabase CLI 2.117.0 source evidence:
- Mailpit publishes `8025 -> local_smtp.port` without a HostIp.
- `LegacyStartPortBindingSpec` has only hostPort/containerPort/protocol, no host IP.
- container lifecycle builds `docker create` argv and spawns the container CLI by executable name `docker` from PATH.
- `legacyDockerCreateContainer()` calls `spawnContainerCli(...)`; `spawnContainerCli` tries `docker` first.
- This exact release behavior plus the pinned archive SHA gives us a bounded interception point without modifying the official CLI binary.

Known Supabase history also documents that local services have been exposed on all interfaces when PortBindings omit HostIp. The acceptance harness MUST not depend on a daemon-global or user-global setting.

## Security outcome

Keep the official SHA-verified Supabase CLI binary unchanged, but run it with a run-owned, private Docker CLI shim at the front of ONLY its child PATH. The shim must force explicit numeric loopback host IP on every published port at `docker create` time, BEFORE the container starts.

This is not a general Docker wrapper installation and not a user/system configuration change.

## Required implementation

### 1. Private run-owned Docker shim

Create a new runtime module in:
`scripts/e2e/admin-account-counts-local-runtime-1/**`

It creates an executable named exactly `docker` inside a private run-owned directory under the already-private HOME/tooling area.

Properties:
- parent dir mode 0700;
- file mode 0700;
- immutable for the run after creation; compute/record SHA256;
- no symlink;
- no global filesystem install;
- no modification to /usr/local/bin, /opt/homebrew, shell profiles or Docker Desktop settings;
- shim delegates to the exact already-verified real local Docker binary path selected by the harness, never resolves a second arbitrary docker from PATH;
- no Podman fallback from the shim.

Use a safe implementation form (Node executable/script or equivalent) that does not eval shell text and does not expose secrets in argv/logs.

### 2. PATH scoping

For the official Supabase CLI child only:
- prepend the shim directory to the private allowlisted child PATH;
- verify before stack start that resolving `docker` in that child environment yields the exact shim path;
- preserve the real verified local `DOCKER_HOST`;
- harness-owned Docker operations continue to use the exact real Docker binary directly, bypassing the shim.

Do not put the shim on the user's shell PATH or parent process environment.

### 3. Rewrite policy — docker create only

All non-`create` Docker commands are delegated unchanged to the exact real Docker binary.

For `docker create`:
- inspect argv token-by-token;
- support the v2.117 forms actually emitted by its builder: `-p VALUE` and `--publish VALUE` if present;
- every host-published TCP/UDP port must become explicitly:
  `127.0.0.1:<hostPort>:<containerPort>[/protocol]`

Allowed input form from pinned v2.117:
- `<hostPort>:<containerPort>`
- optionally protocol suffix on container port.

If already explicit:
- `127.0.0.1:<hostPort>:<containerPort>...` may pass unchanged.
- any other explicit host/address (0.0.0.0, ::, [::], localhost, LAN IP, hostname) MUST be rejected, not rewritten.

Reject/fail closed:
- random host-port / single-field publish form;
- malformed/missing publish value;
- port ranges unless specifically proven emitted by pinned v2.117 and fully validated;
- host IP other than exact 127.0.0.1;
- IPv6 host syntax;
- unexpected publish syntax;
- duplicate/ambiguous publish token forms that cannot be deterministically parsed.

Do not rewrite container-internal `--expose`; it is not a host publication.

### 4. Provenance and bounded authority

The shim must only be considered usable when:
- official Supabase CLI is still archiveBound + identityVerified for v2.117.0;
- real Docker binary and local Unix endpoint are verified by existing gates;
- shim file SHA256 matches the bytes just created;
- child PATH resolution is exact;
- run identity/private HOME ownership matches current run.

No caller-supplied `shimVerified=true` boolean may bypass these checks.

### 5. Runtime verification stays authoritative

Do NOT weaken #564.

After stack start:
- collect authoritative `NetworkSettings.Ports`;
- every HostConfig-configured publication must have a well-formed runtime mapping;
- every actual host binding must be exact `127.0.0.1`;
- any 0.0.0.0 / empty / :: / hostname / other host remains hard FAIL.

The shim is prevention; runtime inspection is independent verification.

### 6. Cleanup / failure

- register shim path/directory ownership before use;
- cleanup removes only run-owned shim files/directories after child/process teardown is confirmed;
- if shim creation/hash/PATH proof is unknown or fails, runtime stays BLOCKED and no stack starts;
- never delete user Docker config/credentials;
- no global Docker cleanup/prune.

### 7. Controlled tests

Required tests:
1. `create -p 54324:8025` -> delegates `create -p 127.0.0.1:54324:8025`.
2. protocol suffix preserved.
3. multiple `-p` values all rewritten.
4. `--publish` equivalent handled.
5. existing explicit 127.0.0.1 preserved.
6. explicit 0.0.0.0 / :: / localhost / LAN IP rejected.
7. malformed / single-field / missing publish value rejected.
8. non-create commands delegated byte-for-byte in argv.
9. `--expose` untouched.
10. exact real Docker binary path is used, never recursive shim resolution.
11. hostile parent PATH cannot bypass shim selection.
12. shim hash / symlink / mode / path proof fail closed.
13. existing #564 runtime inspection tests remain green.
14. composed controlled start path proves official CLI child sees shim PATH while harness Docker checks use real binary.
15. cleanup retains private HOME if shim/process ownership is unknown.

No real Docker, no official binary execution, no user's Mac execution by Cursor.

## Scope

Allowed:
- `scripts/e2e/admin-account-counts-local-runtime-1/**`
- own STATUS/HANDOFF/SELF_REVIEW/evidence
- `docs/ACTIVE_WORK_STATUS.md` continuity only
- this task doc

Forbidden:
- canonical Supabase config/Auth semantics
- disabling/excluding Mailpit merely to hide public binding
- patching/repacking/modifying official Supabase CLI archive/binary
- Docker Desktop/daemon/global settings
- product/Auth/UI/browser-flow code
- SQL/migrations/grants
- root dependencies/package-lock/CI
- hosted/Production mutation
- provider/payment/launch/cost action
- user's Mac execution by Cursor

Freeze one coherent head. Do not Ready. Do not merge. STOP for independent TL review.
