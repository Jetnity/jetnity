# Admin Account Counts Local Runtime 1 — SELF_REVIEW

This is author self-review, not an independent Technical-Lead PASS.

## Scope

Same-session focused completion of review `5293516993` on `07da4bdd07df73c0ee586e1e899841a3163389fc`. Owned only `scripts/e2e/admin-account-counts-local-runtime-1/**`, own STATUS/HANDOFF/SELF_REVIEW, and new sanitized receipts. Product/Auth/SQL/config/migration/root package/lock/CI were not changed. Task §4 was not drifted. No sibling-code import or writes.

## Review mapping

| ID | Correction |
| --- | --- |
| R1/R3 | Default no-start still does not download. Explicit `--cli-archive` + `--cli-checksums` hash real input bytes, validate pinned checksums/archive identity, extract into newly owned tooling, and compare the selected file to the archive member. `bindCliExecutableIdentity` rehashes supplied archive bytes; sidecar/`archiveVerified` cannot bind. CLI1 text-file+sidecar is unbound. Version/help is not invoked in this correction (`invokeBinary: false`). |
| R2 | `classifyDockerInspectError` requires resource-specific `No such <kind>: <name>`. Generic `not found` and `context … not found` are UNKNOWN (DOCKER2). `collectOwnedDockerResources` records every volume mount as owned/foreign/unresolved; VOLUME1 unlabeled mount is unresolved and `inventoryComplete=false`. Foreign volumes are retained. Already-removed owned resources after CLI stop stay ABSENT without permanently invalidating independently proved postconditions. Unqueryable daemon stays UNKNOWN. |
| R5 | `assertInstalledRelation` compares exact accepted dollar-quoted `prosrc` and exact proconfig set equality. SQL1 inert-literal tokens, SQL2 `search_path=pg_catalog, attacker`, and mutating `is distinct from 'active'` to `is not distinct from 'active'` fail. Rogue-grantee / missing-grant / grant-option controls remain. Accepted product SQL was not changed. |

## Misleading claims corrected

`IMPLEMENTATION.codeCompleteClaim = false`. STATUS does not say CODE-COMPLETE. Docker absence is an execution blocker **and** was not the only remaining defect on `07da4bdd`. Implementing the official-byte path is not executing official binaries.

## Tests actually run

`node --test scripts/e2e/admin-account-counts-local-runtime-1/test.mjs` — **31/31 PASS** on Node v22.14.0. Includes CLI1 sidecar unbound, `--cli-archive`/`--cli-checksums` fail-closed assembly, `materializeVerifiedArchive` valid extract of a local test tar (not official pins), DOCKER2, VOLUME1/VOLUME2, foreign retain, unresolved inventory, idempotent already-removed resources, SQL1/SQL2/active-mutation, and preserved A1/A2/D1/S1–S7.

`node scripts/e2e/admin-account-counts-local-runtime-1/run.mjs` — default no-start. Verdict `BLOCKED_ENVIRONMENT`, `fullLocalExecution=false`, `codeCompleteClaim=false`, exit 2. Receipt `aaclr1-20260923T161949Z`. Official archive bytes are not present; default does not download. G2–G19 NOT RUN.

No Docker retry. No official binary download or execution. No real stack. No Mac. No hosted query. No production build.

## Residual risks

- P1: isolation/secret exposure/false full PASS — additional archive-byte and inventory regressions added; real stack still unverified
- P2: actual official CLI 2.117.0 extract, PG17 catalog, Next compile and GoTrue provisioning remain **NOT RUN**
- P3: Darwin/container execution still unverified
- A direct observer probe is still not the app-server RPC positive control; that remains an integrated-run proof

## Not claimed

Author does not claim TL PASS, Ready, merge, hosted parity, code-completeness, or full local acceptance.
