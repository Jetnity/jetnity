# Admin Account Counts macOS Docker Runtime Fix 1 — SELF_REVIEW

This is author self-review, not an independent Technical-Lead PASS.

## Scope

Owned only:

- `scripts/e2e/admin-account-counts-local-runtime-1/**`
- this slice STATUS / HANDOFF / SELF_REVIEW / task
- `docs/ACTIVE_WORK_STATUS.md`
- new sanitized receipts `aaclr1-20260926T010618Z-*`

Product/Auth/SQL/config/migration/root package/lock/CI and #559 browser files were not changed. Official CLI 2.117.0 hashes and version/help/start-help predicates were not weakened.

## Review mapping

| Requirement | Correction |
| --- | --- |
| Discover endpoint before isolated execution | `waehleLokalenUnixDockerEndpunkt()` reads parent CLI/context only |
| Accept only local Unix | `istLokalerUnixDockerHost()`; tcp/ssh/http/cloud fail closed |
| Linux default remains | `/var/run/docker.sock` then `/run/docker.sock` |
| Docker Desktop macOS without hard-coded user | context inspect Host, or parent-HOME-relative `.docker/run|desktop/docker.sock` |
| Isolated HOME authoritative | child gets only verified `DOCKER_HOST`; `DOCKER_CONTEXT` / TLS / certs deleted; no Docker config copy |
| Docker capability proof | `docker info` in isolated env on that host |
| CLI identity | same isolated env for version/help/start-help; failed checks named |
| Controlled tests only | 44/44 PASS; no real Docker / Mac / hosted / Production |

## Misleading claims corrected

`codeCompleteClaim` remains false. Helper PASS is not a Mac Docker Desktop PASS. Default no-start `BLOCKED_ENVIRONMENT` on this Linux agent is expected: no docker executable and no official archive bytes.

C2 full-mode helper now sees the merged #559 sibling module on this base. The control importer is not a real consumer and still cannot report `LOCAL_FULL_STACK_PASS`. That is a test compatibility note, not a #559 edit.

## Tests actually run

`node --test scripts/e2e/admin-account-counts-local-runtime-1/test.mjs` — **44/44 PASS** on this agent. Includes prior ownership/cleanup/foreign-resource cases plus the new endpoint cases.

`node scripts/e2e/admin-account-counts-local-runtime-1/run.mjs` — default no-start. Verdict `BLOCKED_ENVIRONMENT`, `fullLocalExecution=false`, `dockerUsable=false`, `cliVerified=false`, exit 2. Receipt `aaclr1-20260926T010618Z`. Official binaries/Docker/real stack/user's Mac/Playwright: **NOT RUN**.

## Residual risks

- P2: the first authorized real Mac run is still required to prove Docker Desktop `desktop-linux` against the live engine
- P2: official CLI extract / `start --help` on that Mac remain unverified if the previous `cliVerified:false` had a second cause besides the wrong socket
- P3: Darwin tar/`--no-same-owner` extract still unverified
- Helper doubles cannot prove a live Desktop socket inode or Desktop context JSON shape beyond the official `--format` Host field

## Proactive note (out of scope)

No other runtime-lane file still hard-codes `unix:///var/run/docker.sock`. This agent did not search-and-fix unrelated scripts. If a later lane copies isolated Docker env construction, it should reuse this selector rather than invent another default socket.

## Not claimed

Author does not claim TL PASS, Ready, merge, hosted parity, real-Mac acceptance, or full local execution.
