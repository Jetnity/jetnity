# C1 TASK V2 — exact dormant import-isolation amendment

9 November 2026. Root / Technical Lead amendment to C1_TASK_V1.md and the accepted, unchanged C1_PLAN_V1.md R1 (SHA256 `1513c5784d3b2b45afd76db67b9bb2d51162f535b98747aae3a7bb48205f100b`). All existing contract, data, runtime, author, execution and Owner boundaries remain binding.

## Concrete finding and decision

The broader author offline run passed 433 of 434 tests. The existing `full repository candidate import isolation` test in `lib/readiness/official-truth-ch-de-aa-visa-mapping-candidate-1/mapping.test.ts` rejected the accepted C1 mapper's two explicit imports of the old, code-owned AA application/reviewed metadata. Root read the actual guard and new mapper. The guard previously permitted only the two original candidate implementation files; it has no exception for a new transitively isolated metadata-only mapper.

This is a real integration failure, not a reason to remove or skip the guard, duplicate metadata, conceal imports or relax runtime isolation. Root requires the same C1 Generation 1 writer/session to correct it under this finite amendment before publication. No new Product Owner permission is needed for this scoped code/test correction already authorized by the V3 program.

## Additional ownership: one test file only

In addition to V1 ownership, permit changes only to:

`lib/readiness/official-truth-ch-de-aa-visa-mapping-candidate-1/mapping.test.ts`

Changes are limited to the existing repository import-isolation guard and focused tests of its new narrow resolution/exception behavior. All existing AA recognition, source pin, canonical application, disabled catalog, current:false, and negative authority tests must remain unchanged and mandatory. No changes to AA implementation files, source metadata, package/tsconfig aliases, runtime catalogs, application authority or fixtures outside existing C1 ownership.

## Required guard behavior

1. Keep the complete-checkout prerequisite, repository traversal and current `.test`/`.spec` exclusion. Do not exempt an entire directory, all scripts, or the whole C1 package.
2. Preserve the old two-file candidate ownership and its existing checks. All other non-test references to the old candidate stem remain forbidden, except the single exact mapper path below.
3. The only new non-test path allowed to reference those old modules is `lib/readiness/official-truth-product-v3/global-conditions/pilot-context.ts`. It may use exactly the two current static named metadata imports: `AA_CH_DE_VISA_APPLICATION_CONTRACT_CANDIDATE` from the old `mapping` module, and `AA_CH_DE_VISA_REVIEWED_SOURCE_CANDIDATE` from the old `reviewed-source` module. No default/namespace/dynamic import, additional candidate symbol, re-export, or reference hiding is allowed by this exception. Keep the mapper server-only and pure; no source retrieval, clock, SQL/client, registration or callback execution is introduced.
4. Close the transitive boundary: no other non-test source may reference/import/re-export the new C1 mapper. Resolve the repository's existing alias and relative paths (including normalized parent segments and module extensions); cover ordinary static import, re-export, require/dynamic-import literal forms. Do not weaken the original old-stem detection. A new production or script caller must fail the guard, not acquire authority through the new mapper.
5. Add focused negative guard cases for forbidden production callers via alias, relative and literal dynamic/re-export forms, and for unauthorized imports from the exact mapper path. Prove the exact current mapper metadata imports are permitted and no broader exception is accepted. These tests must not write production files or execute a dynamic import.

## Re-review and gates

This amendment does not change the accepted plan bytes or its Stage1 production-source hashes. The author also reported and fixed an unused test-helper export inside existing C1 ownership; its seven-byte removal is a nonbehavioral hygiene fix, but the old 19-file Stage2 manifest is consequently stale.

After the guard correction, issue a refreshed complete source manifest including this one additional test file and the current fixture hash. Root and peers review the actual guard diff and affected hashes. Rerun the failed broader explicit offline selection and export hygiene, then the required complete exact-head CI/native/UI/Preview gates after publication. Retain original failed command logs; do not claim a native or browser run from offline checks.

Same writer: Jetnity Official Truth V3 Global Conditions 1 — Codex Generation 1, actual session `/root/v3_global_conditions_writer`. No writer commit/ref/remote mutation, no local native transport workaround, no hosted DB/source/provider operation, no Ready, merge or activation. STOP for independent Root review.
