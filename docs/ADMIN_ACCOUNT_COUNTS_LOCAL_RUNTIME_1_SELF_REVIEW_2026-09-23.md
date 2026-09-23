# Admin Account Counts Local Runtime 1 — SELF_REVIEW

This is author self-review, not an independent Technical-Lead PASS.

## Scope

Owned only `scripts/e2e/admin-account-counts-local-runtime-1/**`, own STATUS/HANDOFF/SELF_REVIEW, and new sanitized receipts. #556 helpers were imported, not copied into a second framework. Product/Auth/SQL/config/migration/root package/lock/CI were not changed.

## Interface fidelity

Section 4 remains the frozen contract. `contractVersion` is exactly `jetnity.account-counts.local-acceptance.v1`. Runtime constructs context; the sibling consumer is loaded only in `--full`. Missing/duplicate/unknown browser gate IDs are rejected. Runtime-only and missing-module full mode cannot report `fullLocalExecution`.

## Safety

- Hosted/inherited/overridden env rejected; child env rebuilt from an allowlist
- Public `0.0.0.0` / `::` binds refused in the pre-start plan and in observed mappings
- #550 bootstrap refused; #557 producer/wrapper SHA256 pins enforced
- CLI 2.117.0 checksum/version/help mismatch fails closed; no silent version switch
- Evidence whitelist refuses secret-bearing fields; historical basenames are not overwritten
- Cleanup refuses foreign sentinels, unknown ownership, unverified Docker teardown and `pkill` / global prune

## Tests actually run

`node --test scripts/e2e/admin-account-counts-local-runtime-1/test.mjs` — **15/15 PASS** on Node v22.14.0.

`node scripts/e2e/admin-account-counts-local-runtime-1/run.mjs` — verdict `BLOCKED_ENVIRONMENT`, mode `preflight`, `fullLocalExecution=false`, exit 2. Receipt `aaclr1-20260923T123723Z`. G0 BLOCKED (container-runtime, supabase-cli). G1 PASS. G2–G19 NOT RUN. G20 PASS.

One read-only Docker check: no docker/podman/nerdctl, no local socket. Install not attempted.

No production build. No hosted Auth/DB query. No Mac execution. No integrated browser run.

## Residual risks

- P1: isolation/secret exposure/false full PASS — mitigated in code/tests; real stack still unverified
- P2: migration replay, fixture/observer and cleanup on a real CLI 2.117.0 / PG17 engine remain unverified
- P3: Darwin/container execution still unverified
- Official `supabase start` applies workdir migrations; a second apply is skipped when `schema_migrations` already has the version. A CLI image that uses a different history table name would BLOCK and name the file
- Current official local-dev docs bind via a Docker network option, not a historical Kong/Envoy assumption. Actual gateway image is recorded only after a successful owned start

## Not claimed

Author does not claim TL PASS, Ready, merge, hosted parity, or full local acceptance.
