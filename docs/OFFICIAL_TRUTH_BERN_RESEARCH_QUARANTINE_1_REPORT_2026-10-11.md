# Bern research quarantine 1 — author report

Author: **Jetnity Official Truth Bern Research Quarantine 1 — GitHub Copilot Generation 1**.
Issue #932 / Draft #933. This is an author report for independent TL review.

## Delivered behavior

- Added `lib/readiness/official-truth-bern-research-quarantine-1/offline.ts` with:
  - fixed Bern source tuple and source-family pin,
  - separate quarantine contract (`research_only_quarantine`, `not_run|blocked`),
  - conservative indicator-only output, no raw source material,
  - strict request shape guard (`operation: offline_mock` only),
  - future one-shot reservation refusal semantics,
  - offline-only modeled 131,072-byte policy helper.
- Retrieval safety internals are reused through
  `decideOfficialTruthServerOwnedRetrieval` with fixed offline catalog/dependencies.
- Added `scripts/official-truth-bern-research-quarantine-1/run.ts`:
  - default `NOT_RUN`,
  - invalid-argument refusal,
  - no live mode switch.
- Added adversarial tests in
  `lib/readiness/official-truth-bern-research-quarantine-1/offline.test.ts`.
- Added explicit completeness guard in the quarantine-owned offline wrapper:
  declared `Content-Length` (when present and bounded) must match streamed byte
  count exactly before any analysis fields are emitted.

## Security and publication boundary

- No output includes `sourceSnapshot`, `sourceContentHash`, trusted `retrievedAt`,
  law validity intervals, review packet keys, accepted Evidence/Rule, or provider activation.
- No persistent HTML/body storage and no network call in this task.
- Authority/PII-style injected request fields are rejected as invalid request shape.
- Truncated or mismatched declared-length responses now refuse with
  `content_length_mismatch`, keep `bodyByteCount=null`, and keep conservative
  unknown/safety flags (no false “absence” publication).

## What was tested by offline mocks vs. provided by protected architecture

### Offline-mock tested in this task-owned module
- Fixed Bern target tuple pinning in quarantine-owned request path.
- Request-shape and authority-field rejection.
- Declared length vs streamed byte count mismatch rejection.
- Stream overrun handling against the existing 65,536 default cap.
- Conservative publication fallback when completeness is not verified.
- Redirect/scheme/port/content-type/charset/compression/timeout/error refusal
  behavior via synthetic HTTP/DNS fixtures.

### Provided by existing protected architecture (not re-implemented here)
- Core DNS/IP/public-address enforcement internals.
- HTTPS-only transport contract, redirect-depth limits and bounded body reader.
- UTF-8/BOM handling and media-type parsing in shared retrieval internals.
- Existing server-owned retrieval trust boundary and official-source contract.

This slice validates integration behavior through offline injection. It does not
claim that mocks exercised live TLS certificate chains, real SNI validation, or
real network sockets against origin infrastructure.

## Scope compliance

- No edit to protected shared retrieval file
  `lib/readiness/official-truth-server-owned-retrieval.ts`.
- No source registry/profile activation and no modifications to Bern approved profile
  or source-budget live entitlement wiring.
- No Supabase migration, Auth/RLS change, CI workflow change, package/lockfile change,
  UI change, or #913 change.

## Residual limits

- This slice is intentionally non-authoritative and offline-only.
- Parent #917 remains SOURCE_NOT_QUALIFIED.
- Any future real Bern fetch or live 131,072-byte path still requires separate TL/PO gate.
- Exact-head CI/Auth/Preview for author commit
  `5b954f6677f073f471ddb07b9204f9999fbf0c72` is pending because PR #933 still
  references `feat/...@37e3e47` at evidence collection time.
