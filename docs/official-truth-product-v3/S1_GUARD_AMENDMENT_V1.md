# S1 Guard Amendment V1 — S1G1

9 November 2026. Exact Root authorization, read before edits: [S1G1](https://github.com/Jetnity/jetnity/pull/1168#issuecomment-6738345693). Root's subsequent S1G1/R1 correction removes item3 entirely: the existing Content-Identity scanner excludes test files, so that guard is byte-identical to E1. No extra test-only allowance is necessary.

The same S1 author/session adds only the finite consumers listed by Root. Existing scanner logic, entries, negative assertions and complete inventory/set equality remain intact. No broader directory, namespace, alias or authority exception is added.

| Existing guard | Exact new consumer under `lib/readiness/official-truth-product-v3/storage/` | Scope |
| --- | --- | --- |
| `official-truth-autonomous-producer-custody-foundation.test.ts` | `intake-contract.ts` | `immutable`, `ownRecord` |
| same | `quarantine-codec.ts` | `immutable`, `ownRecord`, `provenanceCanonical` |
| same | `quarantine-postgres.ts` | `immutable`, `ownRecord` |
| same | `retention-shape.ts` | `provenanceCanonical` |
| `regulierungs-anwendbarkeit.test.ts` | `quarantine-codec.ts`, `quarantine-postgres.ts`, `retention-shape.ts` | Closed data/equality helpers; exact runtime inventory |
| same | `retention-shape.test.ts` | Test-only canonical source hash mention |

New positive/negative assertions cover exact names, namespace/default imports, additional authority helpers, neighboring names, raw traversal spellings, application paths and unreviewed consumers as applicable. S0/I1 runtime contracts, all existing implementations, native owned-cluster/pg-wire controls and existing CI configuration remain unchanged. No N1 entry is included in this isolated S1 branch.

Final verification and source hashes belong to the S1 implementation handoff; this amendment is authorization evidence, not TL PASS.
