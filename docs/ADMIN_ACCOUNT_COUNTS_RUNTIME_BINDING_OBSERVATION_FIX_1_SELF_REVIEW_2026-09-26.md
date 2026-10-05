# Admin Account Counts Runtime Binding Observation Fix 1 — SELF_REVIEW

This is author self-review, not an independent Technical-Lead PASS.

## Scope

Owned only this correction:

- `scripts/e2e/admin-account-counts-local-runtime-1/stack.mjs`
- `scripts/e2e/admin-account-counts-local-runtime-1/test.mjs`
- this slice STATUS / HANDOFF / SELF_REVIEW
- `docs/ACTIVE_WORK_STATUS.md`
- new sanitized receipts `aaclr1-20260926T111109Z-*`

CLI identity, Docker endpoint, runtime/fixtures/browser/product/Auth/SQL/migrations/config, root package/lock/CI and Mailpit overlay semantics were not changed. Official CLI 2.117.0 hashes were not changed. The pre-launch network option remains `com.docker.network.bridge.host_binding_ipv4=127.0.0.1`. README was not edited in this C1 persist.

## Review mapping

| Requirement | Correction |
| --- | --- |
| Prefer actual runtime mapping | preserved: `NetworkSettings.Ports` remains authoritative when present |
| Empty HostConfig cannot hide resolved loopback | preserved: Mailpit HostConfig `HostIp:""` + runtime `127.0.0.1` still PASS |
| Public runtime mapping fails closed | preserved |
| C1 configured-but-missing runtime port | emits unresolved binding; aggregate FAIL even if another port is `127.0.0.1` |
| C1 configured + runtime `null` | unresolved / FAIL |
| C1 configured + runtime `[]` or non-array | unresolved / FAIL |
| C1 configured + missing HostIp/HostPort | unresolved / FAIL |
| C1 unconfigured internal `null` | ignored; does not false-fail a valid configured mapping |
| Present-but-empty Ports plus configured publication | unresolved for the configured port / FAIL |
| Bounded HostConfig fallback | unchanged when `NetworkSettings.Ports` is absent |
| Loopback policy remains strict | PASS only resolved `127.0.0.1` |
| Mailpit stays enabled | no exclude/disable |
| Preserve existing tests | prior 47 tests still PASS |
| No Docker / Mac / official binary / Production | default no-start + helper doubles only |

## Misleading claims corrected

`codeCompleteClaim` remains false. Helper PASS is not a real-Mac PASS and does not prove the next live Mailpit mapping. Default no-start `BLOCKED_ENVIRONMENT` on this Linux agent is expected: no docker executable and no official archive bytes.

Durable receipts still embed the previous macOS-Docker implementation note because `implementation.mjs` / `run.mjs` were outside this slice allowlist.

The network driver option is not treated as publication proof. C1 only prevents a configured published port from disappearing silently once runtime Ports exists.

## Tests actually run

`node --test scripts/e2e/admin-account-counts-local-runtime-1/test.mjs` — **48/48 PASS** on this agent. Includes the prior 47 ownership/cleanup/endpoint/C2/Cobra-root/Effect-root/Mailpit-observation cases plus the new C1 missing/null/empty/malformed/unconfigured-null regressions.

`node scripts/e2e/admin-account-counts-local-runtime-1/run.mjs` — default no-start. Verdict `BLOCKED_ENVIRONMENT`, `fullLocalExecution=false`, `dockerUsable=false`, `cliVerified=false`, exit 2. Receipt `aaclr1-20260926T111109Z`. Official binaries/Docker/real stack/user's Mac/Playwright: **NOT RUN**.

## Residual risks

- P2: the next authorized real Mac run is still required to prove live Mailpit `8025/tcp -> 54324` now appears as `NetworkSettings.Ports` `HostIp=127.0.0.1`
- P2: if a later Docker version publishes IPv6-only `::1` or dual-stack mappings, this slice still fails closed for anything other than `127.0.0.1`. That is intentional, not a hidden PASS.
- P3: inspect docs that omit `NetworkSettings.Ports` still use HostConfig only as a fallback. Existing ownership fixtures rely on that bounded path.
- Helper doubles cannot prove every live Docker inspect shape beyond the captured Mailpit case and the C1 fixtures

## Proactive note (out of scope)

C1 closes the aggregate silent-drop. After a later authorized Mac rerun proves live runtime mappings, a later dedicated slice may record the observed inspect pair as a dated fixture. Do not add that live inspect dump here, and do not disable Mailpit to skip the next proof.

## Not claimed

Author does not claim TL PASS, Ready, merge, hosted parity, real-Mac acceptance, or full local execution.
