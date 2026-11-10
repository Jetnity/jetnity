# M04 Recovery — TASK V4 / R13 restricted runtime catalog check

**2026-11-10 02:53:00 UTC.** Immediate CHANGES REQUIRED in the same G2 session, within Draft PR #1178. The frozen TASK V1 / Phase-A / plan / T01–T03 and [TASK V2](M04_RECOVERY_TASK_V2.md) / [TASK V3](M04_RECOVERY_TASK_V3.md) remain binding.

## Actual baseline and failure

Exact head `82b116fbb4c6f001f72e60459e83965edcaf8302`, tree `85b3e807a25d39f781a8a059c5aeceaad43716fa`. Branch `feat/official-truth-v3-durable-jobs-1-20261109`; main/merge-base `890dfe9323b4b6d3644c372d81cb8893b6548d11`, ahead5/behind0.

[CI42742925010](https://github.com/Jetnity/jetnity/actions/runs/42742925010), attempt1, [Repository verification129588134830](https://github.com/Jetnity/jetnity/actions/runs/42742925010/job/129588134830): installation succeeds, N01 passes, N02 executes and fails `proof_2:N02 / 42501`. Twenty-nine later groups and both native R9 witnesses are not reached. Cleanup551/551settled,0pending,90/90cumulativeconnectionsclosed,1clusterstopped,0cleanupfailures. Core8660/8656pass/2fail/2skip/0cancel. Six companion jobs pass; required aggregate fails. [Root R13 dispatch](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6757521662).

## Sole-author finite assignment

Continue **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation2**, actual session `/root/m04_durable_jobs_writer_g2`. No session/generation change.

1. In new candidate `assert_catalog_v1`, change only runtime predecessor lookup from `to_regprocedure(substring(binding_row.object_identity,4))` to `(binding_row.fingerprint->>'oid')::oid`. Keep the complete fingerprint comparison unchanged.
2. Add a bounded N02 regression in new `native.ts`: verify postgres and jobs-caller both lack USAGE on both S1 schemas; require the actual restricted runtime's empty probe to succeed; rename pinned `official_v3_intake_private.binding_valid_v1(jsonb)` in the existing disposable fixture while preserving its OID; require that same runtime probe to reject with P7603; restore the exact function name in finally; compare full catalog equality and require the restored probe to succeed.
3. Use binding_valid_v1, which is pinned but is not a direct target of a parsed bridge, so companion-function deparsing does not mask a weakened predecessor comparison. No schema/role/owner/grant change, new connection, helper, workflow, package or budget.
4. Boolean schema checks explicitly cast to text, so their four expected values are `'false'`. Root caught and returned the unpublished `'f'` expectation to this same session before delivery. Superseded source pins are not acceptance evidence.
5. Update the four existing author evidence files, append all three actual historical CI outcomes without dropping earlier failures, preserve the full U01–U07 / N01–N15 map, and mark corrected source as unexecuted.

Scope remains the original 18 source paths plus four author evidence paths; only these two source files change in R13. Root owns versioned task/review/checkpoints/current pointers and publication. Author STOP after coherent pinned delivery; no Ready/merge/Git publication.

## Why this correction preserves the boundary

The runtime API executes as NOSUPERUSER/NOINHERIT postgres. That role deliberately lacks S1 API/private schema USAGE. Named `to_regprocedure` resolution calls PostgreSQL's explicit namespace lookup, which requires USAGE. N01 checked through the installer, so it did not prove this restricted runtime path. The actual CI identifies N02/42501; attribution to its first direct runtime probe is source-derived, not a server-reported statement position.

Reading the stored OID through pg_proc avoids namespace resolution and retains the stored full definition/owner/ACL/config fingerprint. PostgreSQL pg_get_functiondef always emits the qualified function name and arguments, so same-OID identity drift still changes the fingerprint. Missing/recreated OIDs also fail the comparison. No permission expansion or privilege-check bypass in the database engine is requested; the application validates catalog metadata through an already readable catalog, without calling an unauthorized S1 entry.

Primary PostgreSQL16 source, independently fetched by Root: [regproc.c](https://github.com/postgres/postgres/blob/REL_16_STABLE/src/backend/utils/adt/regproc.c), blob296930eb3bca7ae56162ad9f3acfcd271c82db4f; [namespace.c](https://github.com/postgres/postgres/blob/REL_16_STABLE/src/backend/catalog/namespace.c), blob4449f867413eebd65e529fce54cf756fb57cf3ff; [ruleutils.c](https://github.com/postgres/postgres/blob/REL_16_STABLE/src/backend/utils/adt/ruleutils.c), blob5fd68ab48b4e4eceaec598124cd67605b6eeeeb1.

## Verification and unchanged gates

The local environment remains unavailable. Only pinned connector source reads, in-memory text transformations/review and integrity hashing are possible here. No new local tests/typecheck/lint/SQL/parser/native/build execution or replacement environment. All actual execution must be through the existing unchanged complete CI on the new exact published head. Require all31 native groups, both R9 witnesses, complete ownership/cleanup and all repository/deployment/review gates. No unchanged-known-bad rerun. Further failures return to this same session.

Method **NOT_APPROVED**. #1139 **NOT_RELEASE_READY**, pre-Owner gaps E01, E04, E06, E07, E09, E10, E11, E13, E15, E16, E17, E18, E21, E22, E24, E25, E28. #917 specifically refused independent readback remains pending, ledger UNKNOWN, Stage2 NOT_ATTEMPTED: no retry, rephrasing, delegation, rerouting, transport switch, human SQL substitute or renewed old Owner evidence request. #1131 Ready STOP; both #1135 holds; #968 preview isolation and #911/#913 privacy remain.

No hosted DB/Auth/RLS/ACL/migration/credential action or Auth-log access, real source/provider/research call, scheduler, notification, new cost or public V3 activation. No local PostgreSQL/native/socket execution, installation/download, missing binary retrieval, local full build or alternate execution environment. Native proof only in the unchanged existing GitHub CI. No git fetch/push; if local git becomes available, reads require GIT_NO_LAZY_FETCH=1. Preserve all 22 omitted binary IDs. No automatic follow-up product slice.
