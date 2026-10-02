# Official Truth Autonomous Freshness / Authority Witness 1 — Self Review

Date: 2 October 2026
Issue: #766
Draft PR: #767
Branch: `fix/official-truth-autonomous-freshness-witness-1`
Implementation reviewed locally: `d43711afd6cbd0ff02c9ed9bfebe63b45c81b136`
R1 corrects `c0a9e707ed12fba0a946f54b1cb587bdcf2912ea`. That head is not the review head.
Logical agent: **Jetnity Official Truth autonomous freshness authority witness 1**
Generation: **1**
Session: https://cursor.com/agents/bc-46d4f594-e303-4969-b3ce-10d4392fbd48
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This is the author self-review. It is not an independent Technical-Lead PASS. The review head is the branch tip after the documentation commit.

## Scope check

| Binding | Result |
| --- | --- |
| F7 same-request witness only | Held. No F8 acceptance path. |
| Authority only through `loadOfficialTruthFactEntryAuthority()` | Held on the live entry. The seam injects authority for tests and is documented as not the live entry. |
| One catalog read for #723 and #726 v2 | Held by `officialTruthServerHeldReviewReproof`. Test counts one `read_registry`. |
| Freshness exactly `current` | Held with existing `officialFrische` and `OFFICIAL_CHECKED_AT_MAX_AGE_MS`. No new TTL. |
| Ephemeral proof, not a bearer capability | Held. No persistence, no route, no token. |
| No acceptance, store, route, migration, Auth, #626, provider, or cost | Held by source assertions and the diff. |

## Findings I am not hiding

1. `officialFrische` receives `hasProvider: true` and `sourceAvailable: true` only inside the witness. That does not call `requirementsProviderAus()` and does not select a provider. It exists so the existing helper applies the time ceiling instead of returning `provider_unavailable`. A reviewer should treat that as a local freshness argument, not as provider activation.
2. Descriptor objects may still carry `sourceClass` and `domains`. That is the merged retrieval shape. Those keys are rejected when they are caller authority on the envelope, request, material, metadata, extraction, or dependency. The injected catalog remains the registry. This slice does not add a second registry model.
3. F7-R1 is corrected. Support ids are compared as a canonical multiset, not by caller array position. The reversed composed-support test proves the same key, the same sorted ids, one catalog read per re-proof, and a successful witness. An artificial internal divergence between the pure packet and fingerprint functions is still not simulated; both still read the same reconstructed object and fail closed if their id multisets differ.
4. The live loader is not executed against a real session in this slice. Tests use the seam. The source test locks that the live function calls `loadOfficialTruthFactEntryAuthority()` and passes no catalog override.
5. `decideOfficialTruthAutonomousPreacceptanceWitness` is exported. No `app/` file imports it. A later route that calls it would reopen F7. The architecture note says that.
6. Eligible quality is read from the re-proved candidate, so that check happens after the catalog read. Unauthorized input, forbidden witness fields, and an invalid server clock do not read the catalog.
7. The witness walker fails closed past depth 16. Current coverage and request shapes fit. A forbidden key buried deeper than that becomes `unexpected_fields`, which is still not a witness.
8. `docs/ACTIVE_WORK_STATUS.md` was not edited. The task allowlist does not include it. This handoff and the report are the continuity record.

## Validation seen on the implementation commit

Witness 13/13. Registry 10/10. `npm test` 4474/4474. Typecheck pass. Lint 0 errors and 148 pre-existing warnings. Build pass on Next.js 16.3.8 with 25 static pages. Hygiene checks pass. `git diff --check` pass. No remote database. Local PostgreSQL 16.15 ran the existing throwaway catalog and store proofs. Nothing was applied. These gates are on `d43711af`, before this R1 documentation commit.

## Stop

Cursor does not Ready or merge and does not start F8 or another slice.
