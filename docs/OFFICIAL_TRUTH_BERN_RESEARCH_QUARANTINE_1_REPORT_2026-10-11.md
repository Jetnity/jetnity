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

## Security and publication boundary

- No output includes `sourceSnapshot`, `sourceContentHash`, trusted `retrievedAt`,
  law validity intervals, review packet keys, accepted Evidence/Rule, or provider activation.
- No persistent HTML/body storage and no network call in this task.
- Authority/PII-style injected request fields are rejected as invalid request shape.

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
