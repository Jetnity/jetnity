# M04 Recovery — Root Review / Continuity V4, R13

**2026-11-10 02:53:00 UTC. Corrected restricted-runtime catalog lookup independently source-reviewed; new-head native/full CI acceptance OPEN. Draft, no Ready/merge/activation.**

Read [TASK V4](M04_RECOVERY_TASK_V4.md) and current [Handoff](M04_HANDOFF_V1.md). [V3 review](M04_RECOVERY_ROOT_REVIEW_V3.md) preserves R12 and the original recovery history; [V2 review](M04_RECOVERY_ROOT_REVIEW_V2.md) preserves the independently executed local checks and initial R9/R10/R11 work. Later read-back PR receipts determine the actual current head/run/merge state.

## New actual CI evidence

The two R12 parenthesizations were published as `82b116fbb4c6f001f72e60459e83965edcaf8302`, tree `85b3e807a25d39f781a8a059c5aeceaad43716fa`. Root independently matched the full Git tree, all13 changed blobs and synthetic merge `9d782521e7b302d9c017ad2c6c339b3031f4e98e`. [Publication receipt](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6757257782).

[CI42742925010](https://github.com/Jetnity/jetnity/actions/runs/42742925010), attempt1, completed FAILURE at02:46:12UTC. Root independently retrieved the complete non-Auth Repository verification job129588134830 log. Exact observed receipt:

| Item | Actual outcome |
|---|---|
| Candidate | ed8cf918bb595b6933d4517575d0b8bb6a583277302f5dcc83a6ccee150c123c |
| Installation / N01 | installation successful; N01 PASS,41ms |
| N02 | executed and failed: proof_2:N02, PostgreSQL42501 |
| Later groups / R9 | 29 groups not reached; both native R9 cases not reached |
| Accepted groups | 1 of31; nativePassfalse |
| Core | 8660 total /8656pass /2fail /2skip /0cancel |
| Owned work | 551 started /551settled /0pending |
| Connections / clusters | 90/90cumulativeclosed;1/1clusterstopped |
| Effect plus cleanup / cleanup | 3020ms /209ms |
| Cleanup failures | zero |
| Other six jobs | SUCCESS |
| Required aggregate | FAILURE; hygiene/build skipped after Tests |

The two core failures are nested N02 and the parent M04 case. Successful synthetic R9/unit checks do not replace native R9. Resource cleanup evidence covers only the executed portion.

[Safe negative excerpt](M04_RECOVERY_R13_NATIVE_FAILURE_V4.txt). Full log4,229,702characters/63,015lines, SHA256`f156780fa41e4aee87d216e1fb6304d8be1c7c2a095a9a5ff14a7696f14716f8`; excerptSHA256`60140186df539b37d2df02067ad2858023a4a81e9f62936a5f5f1888d4054873`. Neither the safe error nor its stack supplies the exact offending SQL statement or position.

## Independent R13 cause and finite correction

Root and `/root/m04_r9_review_g2` independently traced the restricted API owner postgres into `assert_catalog_v1`. The loop resolves S1 predecessor names with `to_regprocedure`. The unchanged S1 schemas grant no USAGE to that NOSUPERUSER/NOINHERIT role. PostgreSQL16's regprocedure input path calls explicit namespace lookup with ACL_USAGE. This is a source-confirmed privilege defect consistent with N02's raw42501. The first direct empty runtime probe is the source-derived failing point; the log does not pin that statement.

The correction replaces that single name-resolution expression with the immutable stored fingerprint OID. The unchanged comparison includes OID, owner, ACL, configuration, definer/volatility/parallel/strict/defaults metadata and SHA256 of full pg_get_functiondef. PostgreSQL's function-definition formatter always includes the qualified name and argument signature. Missing/recreated functions fail by OID; rename/schema/signature/body/metadata changes fail through the fingerprint. All remaining name lookups in this candidate are installer-time.

No S1 USAGE grant, direct S1 API grant, owner/role change, elevated definer, protected helper modification or drift-check removal occurs.

The new N02 regression asserts the four negative schema-USAGE results, succeeds through the actual restricted runtime, then renames pinned binding_valid_v1 in the existing disposable fixture without changing its OID. That predecessor is not directly consumed by a parsed bridge, so the P7603 rejection specifically checks the predecessor fingerprint rather than a changed bridge definition. The name is restored in finally even on assertion failure. Full catalog equality and restored success are required on the passing path. No new connection or budget is introduced.

Root caught an unpublished expected-value error in the first test draft: boolean::text yields `'false'`, not `'f'`. The same author corrected it before publication; the superseded native f6b50a… source was neither executed nor published. Root and the reviewer independently reconstructed and matched the corrected two-source payload:

| Source | Bytes | SHA256 |
|---|---:|---|
| jobs-candidate.sql |135947|a22e6a015c8fc5a268500659ace31a938d2ce3614625e9df1982308b73199a59|
| native.ts |138948|5b586cb8291caeb954f6afffb80d82a1666c9050e209e1df3bf0f81dc169f87c|

Aggregate of all18sources: `5d33e2eef75e612b650bae2f2eb5ea0062918d1b7005ea2e2eb9bfba76b131f1`. Sixteen other source files are byte-identical to82b. Native proof-group count stays31; the regression expands existing N02. Rollback stays `9b9089d74242a802455cc7e3fb8a0a8515c17b61b45ae730b9bbba1adb650a66`.

Primary PostgreSQL source retrieved independently: [regproc.c](https://github.com/postgres/postgres/blob/REL_16_STABLE/src/backend/utils/adt/regproc.c) blob296930eb3bca7ae56162ad9f3acfcd271c82db4f; [namespace.c](https://github.com/postgres/postgres/blob/REL_16_STABLE/src/backend/catalog/namespace.c) blob4449f867413eebd65e529fce54cf756fb57cf3ff; [ruleutils.c](https://github.com/postgres/postgres/blob/REL_16_STABLE/src/backend/utils/adt/ruleutils.c) blob5fd68ab48b4e4eceaec598124cd67605b6eeeeb1.

**Bounded disposition: corrected source accepted for Root publication and CI only. No overall/native Technical Lead PASS.**

## Capability, baseline and continuity

No local execution since the environment became unavailable after7ac publication. Previous64/64 nonnative tests and focused TypeScript/lint remain historical; they do not execute the new native test or validate R13 SQL. New TypeScript/native checks must run in the unchanged existing CI. Root's orchestration JS performs only text review and hash/tree integrity verification, not repository or SQL execution.

Main/merge-base at the latest read remains `890dfe9323b4b6d3644c372d81cb8893b6548d11`, tree8c611ec31d518cce88a3a5abb75aecf6620d794c. The baseline82b is ahead5/behind0 with75 files versus main. Its exact Preview `dpl_GSHXF4BUY7TN41iCjLCBFcJRy96B` is READY; it does not accept the failed native gate. Last verified both Production aliases point to READY `dpl_7K4gHmn2d2HBqCq1CHBThRjAXHw7`, exactmain890; mainCI42736015143 all8SUCCESS. New candidate Preview/CI and premerge main/protection/review checks must be refreshed.

The original d9 saved interruption, both later failed heads and all author/root evidence remain preserved. #751/#1162 and PR1178 have the R13 CHANGES REQUIRED status. Only Root publishes/PASS/Ready/merges; same sole writer **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation2**, actual `/root/m04_durable_jobs_writer_g2`. The documented original-session gap is unchanged. D1#1169 remains separate Draft/unfinished; PR1180/atlas and PR1179/booking remain preserved.

**First unfinished step:** publish the two-source R13 correction and truthful evidence on expected82b, verify exact returned tree/blobs/head, then inspect the new complete unchanged CI: all31 native groups, both R9 witnesses, actual complete owned-resource/process cleanup, full core/hygiene/build and companion jobs, exact Preview and all live gates. Failed CI returns CHANGES REQUIRED to the same G2 author.

## P0–P3 and gates

- P0: no newly verified production incident; hosted truth is not inferred or accessed.
- P1: actual N02 privilege failure and all remaining native/R9/full-CI gates block Ready/merge until the corrected head independently passes.
- P2: method/Dev-package/Owner gaps and the possibility of further previously unexecuted runtime failures remain.
- P3: local environment unavailable; GitHub checkpoints and independently verified remote content preserve continuity.

Method **NOT_APPROVED**. #1139 **NOT_RELEASE_READY**, pre-Owner gaps E01, E04, E06, E07, E09, E10, E11, E13, E15, E16, E17, E18, E21, E22, E24, E25, E28. #917 specifically refused independent readback remains pending, ledger UNKNOWN, Stage2 NOT_ATTEMPTED: no retry, rephrasing, delegation, rerouting, transport switch, human SQL substitute or renewed old Owner evidence request. #1131 Ready STOP; both #1135 holds; #968 preview isolation and #911/#913 privacy remain.

No hosted DB/Auth/RLS/ACL/migration/credential action or Auth-log access, real source/provider/research call, scheduler, notification, new cost or public V3 activation. No local PostgreSQL/native/socket execution, installation/download, missing binary retrieval, local full build or alternate execution environment. Native proof only in the unchanged existing GitHub CI. No git fetch/push; if local git becomes available, reads require GIT_NO_LAZY_FETCH=1. Preserve all 22 omitted binary IDs. No automatic follow-up product slice.
