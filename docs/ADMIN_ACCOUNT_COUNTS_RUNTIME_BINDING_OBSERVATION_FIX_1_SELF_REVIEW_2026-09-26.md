# Admin Account Counts Runtime Binding Observation Fix 1 — SELF_REVIEW

This is author self-review, not an independent Technical-Lead PASS.

## Scope

Owned only:

- `scripts/e2e/admin-account-counts-local-runtime-1/stack.mjs`
- `scripts/e2e/admin-account-counts-local-runtime-1/test.mjs`
- `scripts/e2e/admin-account-counts-local-runtime-1/README.md`
- this slice STATUS / HANDOFF / SELF_REVIEW / task
- `docs/ACTIVE_WORK_STATUS.md`
- new sanitized receipts `aaclr1-20260926T110432Z-*`

CLI identity, Docker endpoint, runtime/fixtures/browser/product/Auth/SQL/migrations/config, root package/lock/CI and Mailpit overlay semantics were not changed. Official CLI 2.117.0 hashes were not changed. The pre-launch network option remains `com.docker.network.bridge.host_binding_ipv4=127.0.0.1`.

## Review mapping

| Requirement | Correction |
| --- | --- |
| Prefer actual runtime mapping | `parseDockerPortBindings()` uses `NetworkSettings.Ports` when that field exists |
| Empty HostConfig cannot hide resolved loopback | HostConfig `HostIp:""` + runtime `127.0.0.1` parses as `127.0.0.1` and loopback assertion PASS |
| Public runtime mapping fails closed | HostConfig empty + runtime `0.0.0.0` FAIL; no HostConfig rescue |
| Empty runtime mapping fails closed | runtime `HostIp:""` FAIL even if HostConfig says `127.0.0.1` |
| Present-but-empty Ports cannot manufacture PASS | `NetworkSettings.Ports: {}` plus HostConfig `127.0.0.1` yields no published bindings and FAIL |
| Bounded HostConfig fallback | Ports absent + explicit HostConfig `127.0.0.1` PASS; Ports absent + empty/public/localhost/`::` FAIL |
| Multi-port | every published runtime mapping must be `127.0.0.1`; one public mapping FAIL |
| Loopback policy remains strict | PASS only resolved `127.0.0.1` |
| Do not infer PASS from network driver option | pre-launch option unchanged; post-start mappings still required |
| Mailpit stays enabled | no exclude/disable; 8025/54324 is the control case |
| Preserve existing tests | prior 46 tests still PASS |
| No Docker / Mac / official binary / Production | default no-start + helper doubles only |

## Misleading claims corrected

`codeCompleteClaim` remains false. Helper PASS is not a real-Mac PASS and does not prove the next live Mailpit mapping. Default no-start `BLOCKED_ENVIRONMENT` on this Linux agent is expected: no docker executable and no official archive bytes.

Durable receipts still embed the previous macOS-Docker implementation note because `implementation.mjs` / `run.mjs` were outside this slice allowlist. That metadata is historical, not a claim that binding observation is unchanged.

The network driver option is not treated as publication proof. This slice only changes how inspect JSON is read after start.

## Tests actually run

`node --test scripts/e2e/admin-account-counts-local-runtime-1/test.mjs` — **47/47 PASS** on this agent. Includes the prior 46 ownership/cleanup/endpoint/C2/Cobra-root/Effect-root cases plus the new Mailpit-shaped runtime-binding cases.

`node scripts/e2e/admin-account-counts-local-runtime-1/run.mjs` — default no-start. Verdict `BLOCKED_ENVIRONMENT`, `fullLocalExecution=false`, `dockerUsable=false`, `cliVerified=false`, exit 2. Receipt `aaclr1-20260926T110432Z`. Official binaries/Docker/real stack/user's Mac/Playwright: **NOT RUN**.

## Residual risks

- P2: the next authorized real Mac run is still required to prove live Mailpit `8025/tcp -> 54324` now appears as `NetworkSettings.Ports` `HostIp=127.0.0.1`
- P2: if a later Docker version publishes IPv6-only `::1` or dual-stack mappings, this slice still fails closed for anything other than `127.0.0.1`. That is intentional, not a hidden PASS.
- P3: inspect docs that omit `NetworkSettings.Ports` still use HostConfig only as a fallback. Existing ownership fixtures rely on that bounded path.
- Helper doubles cannot prove every live Docker inspect shape beyond the captured Mailpit HostConfig-empty / runtime-resolved case

## Proactive note (out of scope)

The first real stack start after #563 proved the owned network option works and that Mailpit is a useful control for Docker's default host binding. After a later authorized Mac rerun proves live runtime mappings, a later dedicated slice may record the observed inspect pair as a dated fixture. Do not add that live inspect dump here, and do not disable Mailpit to skip the next proof.

## Not claimed

Author does not claim TL PASS, Ready, merge, hosted parity, real-Mac acceptance, or full local execution.
