# M04 current handoff — R28 / Recovery V19

**2026-11-10 16:13:22 UTC: CHANGES REQUIRED R28 / Recovery V19, binding scope v2.** Independently reviewed pre-publication snapshot. R28 has not executed. #1182 remains Draft; no current runtime/TL PASS, Ready, merge or actual-main acceptance. Later exact-head live evidence supersedes this dated snapshot.

[Draft #1182](https://github.com/Jetnity/jetnity/pull/1182) · [R28 v1 investigation](https://github.com/Jetnity/jetnity/pull/1182#issuecomment-6772056631) · [binding v2](https://github.com/Jetnity/jetnity/pull/1182#issuecomment-6772232105) · [complete actual R27 failure18](https://github.com/Jetnity/jetnity/pull/1182#issuecomment-6772268521)

Published R27 baseline **ec4de0958227d9733610b9a9125b2c3480631a36**, tree **f2c07e2fb8640c6c9ba3da13b6f280d7f9662a92**, sole parent **b8415a5f349a258f99109435ac174c9ed5b7a259**; ahead **6**, behind **0** of actual main/merge-base **4bfa8b466ebc0af761fc5050bb4c51d7e73400c7**, tree **793026a2c26725da06ff281924aaa561d43ee32f**. #1178 is historically merged after genuine R21 PR acceptance. The later actual-main failure remains independently true and unresolved. #1182 is the same immediate dormant post-merge recovery.

## Actual R27 execution, not current acceptance

[CI42847124579](https://github.com/Jetnity/jetnity/actions/runs/42847124579), attempt1/pull_request, completed FAILURE, updated2026-11-10T15:52:03Z. Root observed the complete terminal state at **2026-11-10 15:53:19 UTC** before reading completed Repository job **129937503558**. All eight jobs are terminal: Auth and isolated UI SUCCESS; Repository, Atomic, Persisted, Store, Lifecycle and aggregate FAILURE. Repository Typecheck/Lint passed; Tests failed; later hygiene/build skipped. Auth was inspected by metadata only.

The M04 receipt preserves **executed:true** because the harness entered, but **fixture_acquire** failed before any of31 native groups. Raw work/connection counters are zero; raw clusters1/stoppedClusters0 and **one cleanup assertion failure** remain unchanged. The cluster counter does not establish a created database, and zero work does not constitute a clean-cleanup PASS. Neither R9 race, quota boundary, inherited761/minOwned4182 nor rollback is proved. Total19ms/cleanup17ms is setup-failure timing, not a performance improvement.

Core **8521 tests /8462 pass /19 fail /33 cancelled /7 skipped**,411784.945222ms. Five PostgreSQL-unavailable skips are additional to the two inherited layout skips and are not accepted. Full Repository log3997458bytes/SHA256 **2748162df4c6937f16cca5470ef08574133f598323f376e230dfd574e2ded036**; compact receipt1818bytes/SHA256 **2c0c3fd65c04ec64805cd569968c5b75303e56c646461ab0381ec1cd262c3a6b**.

Four separate completed native jobs report **local_postgresql_not_available** before database proof: Atomic129937503029 (1 test/1 fail), Persisted129937503338 (1/1), Store129937503537 (4/4), Lifecycle129937503780 (4/4). Lifecycle has no actual mounted receipt. Root observed those jobs terminal at15:44:33UTC before reading their logs; the complete pins and counts are in V19 JSON/excerpt. This differs from R25 Chrome-version timeout; its underlying cause remains UNKNOWN.

R27 is the **18th actual failed run**. All17 earlier failure objects, the genuine R21 full success, original R22 in-progress observation plus corrected separate terminal metadata, and all earlier source/review/receipt records remain exact. [Prior complete V18 evidence](https://github.com/Jetnity/jetnity/blob/ec4de0958227d9733610b9a9125b2c3480631a36/docs/official-truth-product-v3/M04_RECOVERY_R27_EVIDENCE_V18.json).

## Exactly authorized implementation and review

All five PostgreSQL-dependent job executions used **ubuntu26/20261101.186**. The preceding R26 lifecycle used **ubuntu24/20261101.360**. Official actions/runner-images READMEs identify PostgreSQL18.6 and16.15 respectively. The unchanged fixed detector recognizes supported roots through17 and requires all four binaries. This supports a concrete CI OS-family compatibility repair, not M04 semantic correctness, improved timing or an explanation of older budget failures.

The original M04 scope forbids silent workflow expansion and sends concrete incompatibilities to Root. Root explicitly versions this ordinary prerequisite repair under Operating Standard §§2/4C; mode NORMAL. It crosses no reserved Owner, Production, secret, permission, provider, cost or access gate.

Exactly four runs-on values in **.github/workflows/ci.yml** change ubuntu-latest to ubuntu-24.04: verify, persisted_native, refresh_native and accepted_store_native. The latter retains both store/lifecycle matrix entries. UI, Auth and aggregate remain unchanged. All job identities, commands, steps, dependencies, matrix, timeouts, concurrency, permissions, environment and guards remain byte-identical.

Independent review found an existing contract selecting accepted_store_native and requiring ubuntu-latest. Version2 authorizes exactly one additional line in **lib/readiness/official-truth-atomic-version-refresh-1.test.ts**: the same assertion now requires the literal ubuntu-24.04 (escaped regex dot). All128 assert calls remain; every other byte is unchanged. Both inverse deltas recover the immutable ec4de baseline exactly. No guard/policy change, optional alternative, skipped check or installation/discovery fallback.

All18 M04 source pins are **unchanged R27**, aggregate **d2753193415468a06ea93f23e21b40e3e2b822a5dd6d3736d28db6eafd24f761**. Thus R27 SQL,12 added fixed N02 queries, all earlier oracles,31 named groups, predecessor bodies, attributes and rollback remain exact. This repair changes zero M04 source files. The detector remains5280bytes/SHA256 f6d21b3fef8f0ad41a8ac3951972ea5cba0394cfe41037eba8d0258ed508aa10.

| Changed file | Bytes | SHA256 | Git blob |
|---|---:|---|---|
| .github/workflows/ci.yml | 12325 | 3889e092f9cf4ce4b917a786a3267bf9bb510b727d5c76db7cabf6b08f9e6d18 | 22f6e50aaff600749814bf7e77e24c728b1cd5d5 |
| lib/readiness/official-truth-atomic-version-refresh-1.test.ts | 24091 | 06fe1dc21c9d605e1cb9c6f96dc715674481889fc5106ea54031f49ad2b4b102 | e405dbd711b6dc56697b407d1f6178fb5f873a62 |

Ubuntu24.04 binds the OS family, not an immutable image or guaranteed future patch. Actual runner/toolchain and every unchanged proof must be established by new CI. Root and the same independent reviewer confirmed source identity only; neither author self-review nor source review grants TL PASS.

## First unfinished step and acceptance sequence

1. Root alone publishes the independently reviewed two implementation files, four author documents and ten Root continuity files with expected-head **ec4de0958227d9733610b9a9125b2c3480631a36**, no force. Read back complete commit/parents/tree and every changed file. Preserve all unchanged leaves and all22 binary IDs.
2. Require the complete new exact-head CI: all eight jobs,31 named M04 groups, both R9 witnesses, full254/255/256 ledger and64/65-cycle boundaries, inherited761 pairs/minimumOwned4182, final rollback/late-writer, full cleanup, Core with only two inherited skips, hygiene/build and unchanged lifecycle. Check actual runner metadata. No unfinished, prior-head or source-only result counts.
3. Independently recheck main/merge-base/ahead/behind/actual diff, exact Preview, reviews/threads, strict rules, NORMAL mode, Guardian and permitted Owner gates. Only Root records TL PASS, sets Ready and merges the exact expected head.
4. Actual new main must independently pass full CI/native and both Production aliases resolve to that exact READY deployment. PR success cannot substitute.
5. Only then complete finite docs closure: its exact-head CI/Preview/gates and resulting actual-main CI/native/Production; final receipts on existing PR/status without another source commit, then STOP. No automatic next slice.

Failure means CHANGES REQUIRED to the same author/session, a new head and full re-gating. No unchanged known-bad rerun.

## Actual continuity

Author **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation2**, session /root/m04_durable_jobs_writer_g2; independent reviewer /root/m04_r9_review_g2; metadata auditor /root/m04_live_audit_g2. These are the actual resumed Codex G2 sessions; no Cursor session is invented. Only Root publishes, sets Ready or merges. Author delivery is stopped after this task.

Original checkout /workspace/scratch/01cbe1264212/jetnity-v3-durable-jobs remains unrecovered. No replacement project environment, local project/parser/SQL/native/build execution, download or reconstruction was used. Pure text/data transforms and immutable GitHub reads establish source identity. Runtime proof comes only from the existing CI with this narrowly authorized runner selection.

## Frozen boundaries and Owner gates

240 s effects + 60 s cleanup / 300 s total; four outer lanes and four native operations per family; eight active native / 256 total with 16 terminal admissions reserved; eight callbacks / 128 total; 30 s outer / 5 s child; three clusters / two children / 40 aggregate work connections / two M04 observers / one method observer / 16 fixture connections per cluster.

Method **NOT_APPROVED**. #1139 **NOT_RELEASE_READY**, pre-Owner gaps E01, E04, E06, E07, E09, E10, E11, E13, E15, E16, E17, E18, E21, E22, E24, E25, E28. #917 specifically refused independent readback remains pending, ledger UNKNOWN, Stage2 NOT_ATTEMPTED: no retry, rephrasing, delegation, rerouting, transport switch, human SQL substitute or renewed old Owner evidence request. #1131 Ready STOP; both #1135 holds; #968 preview isolation and #911/#913 privacy remain.

No hosted DB/Auth/RLS/ACL/migration/credential action or Auth-log access, real source/provider/research call, scheduler, notification, new cost or public V3 activation. No local PostgreSQL/native/socket/parser/project/build execution, installation/download, missing binary retrieval, clone/reconstruction or replacement environment. Native proof only in the existing GitHub CI with exactly the R28 v2 runner/contract selection; all proof commands and budgets unchanged. No git fetch/push; any local git reads require GIT_NO_LAZY_FETCH=1 and GIT_OPTIONAL_LOCKS=0. Preserve all 22 omitted binary IDs. No automatic next product slice.

The two explicit R28 implementation paths are the only exception to prior workflow/test-file freeze. No other workflow/package/guard change, reduced group/quota, raised budget, seeded/omitted history, cross-call cache, trust marker, broad command/history/transition rewrite or signature/LANGUAGE/attribute/search_path/ACL/role/predecessor/rollback change. SQL **UNAPPLIED**. Deployment READY is not schema/native acceptance. D1#1169 and unrelated PRs remain separate.
