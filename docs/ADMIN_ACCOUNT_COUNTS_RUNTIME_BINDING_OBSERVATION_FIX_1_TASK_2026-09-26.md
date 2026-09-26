# Admin Account Counts Runtime Binding Observation Fix 1 — TASK

Date: 2026-09-26
Base: 40fffe38102012ae3ffa5f5b7e2bc24c1a100b42
Branch: fix/admin-account-counts-runtime-binding-observation-1
Mode: NORMAL

## Trigger — first real stack startup on Product Owner Mac

After #563, the already-authorized full local acceptance was run once on Apple-Silicon macOS.

This run crossed the previous G0 blockers and actually started the real Supabase CLI-managed stack. The run created the dedicated owned Docker network with:
`com.docker.network.bridge.host_binding_ipv4=127.0.0.1`

Then post-start binding verification aborted with:
`Public or unspecified bind observed: {"containerPort":"8025/tcp","HostIp":"","HostPort":"54324"}`

Real run id visible in failure evidence:
`aaclr1-20260926T104932Z`

The service is Supabase Mailpit:
- official v2.117 source publishes Mailpit HTTP container port 8025 to configured local_smtp port 54324;
- current accepted Jetnity config has [local_smtp] enabled=true / port=54324.

Important source defect on main:
`parseDockerPortBindings()` currently chooses:
`parsed.HostConfig?.PortBindings || parsed.NetworkSettings?.Ports || parsed`

That means it prefers Docker's requested/configured port-bind intent over the actual resolved post-start runtime mapping.

Docker's bridge behavior is authoritative for this run:
- the owned network is created BEFORE listeners with `com.docker.network.bridge.host_binding_ipv4=127.0.0.1`;
- when a published port omits a host address, that network option supplies the default bind address;
- actual post-start binding truth is represented by runtime NetworkSettings port mappings, not an empty HostIp placeholder in HostConfig.

This is a P1 isolation false-positive / P2 runtime-observation defect. Do NOT weaken the loopback requirement and do NOT exclude Mailpit merely to hide it.

## Required end state

Implement the smallest fail-closed correction so post-start safety verifies actual runtime port publication.

1. Runtime binding truth
- For a started container, prefer `NetworkSettings.Ports` as the authoritative resolved runtime port mapping when that field exists.
- Do NOT let an empty HostConfig HostIp override a concrete resolved NetworkSettings HostIp.
- HostConfig may be used only as a bounded fallback when NetworkSettings.Ports is genuinely absent/unavailable, and then only explicit numeric-loopback HostIp is acceptable.
- If NetworkSettings.Ports is present but a published mapping is empty/unspecified/public, fail closed. Do not fall back to HostConfig to manufacture PASS.
- Do not infer PASS solely from the network driver option; actual post-start mappings are still required.

2. Loopback policy remains strict
PASS only for resolved `127.0.0.1`.
Reject:
- empty HostIp in authoritative runtime mapping
- `0.0.0.0`
- `::` / `[::]`
- hostname localhost
- other host IPs
- malformed/missing runtime publication when a published service should exist.

3. Pre-launch network control remains unchanged
- dedicated run-owned network
- `com.docker.network.bridge.host_binding_ipv4=127.0.0.1`
- no daemon/global setting change
- no LAN/public binding
- no Production/hosted service.

4. Mailpit
- Do NOT disable/exclude Mailpit in this slice.
- Current auth semantics keep email confirmations enabled; this slice is about truthful runtime binding observation, not service removal.
- 8025/54324 is a useful real control because it exercises Docker's network-default host binding.

5. Tests
Add focused controlled tests:
- HostConfig HostIp="" + NetworkSettings.Ports HostIp=127.0.0.1 => parsed runtime binding is 127.0.0.1 and loopback assertion PASS.
- HostConfig HostIp="" + NetworkSettings.Ports HostIp=0.0.0.0 => FAIL.
- NetworkSettings.Ports HostIp="" => FAIL even if HostConfig says 127.0.0.1.
- NetworkSettings.Ports absent + HostConfig explicit 127.0.0.1 => bounded fallback PASS.
- NetworkSettings.Ports absent + HostConfig empty/public => FAIL.
- Multi-port container: every published runtime mapping must be 127.0.0.1; one public mapping fails.
- Existing isolation/ownership/cleanup tests remain green.

6. Evidence
- Controlled tests only by Cursor. NO real Docker, no user's Mac, no official CLI execution, no hosted/Production mutation.
- Fresh exact-head CI/Auth/Preview.
- Report real Mac rerun as still required.

## Scope

Allowed:
- `scripts/e2e/admin-account-counts-local-runtime-1/stack.mjs`
- `scripts/e2e/admin-account-counts-local-runtime-1/test.mjs`
- README if needed
- own STATUS/HANDOFF/SELF_REVIEW/new sanitized evidence
- `docs/ACTIVE_WORK_STATUS.md` continuity only
- this task doc

Forbidden:
- Supabase canonical config / auth semantics
- Mailpit exclusion/service removal
- Docker endpoint selection
- CLI identity/version/hash/parser
- runtime/fixtures/browser/product/Auth/SQL/migrations/root deps/package-lock/CI changes
- Production/hosted mutation
- user's Mac execution by Cursor

Freeze one coherent head. Do not Ready. Do not merge. STOP for independent TL review.
