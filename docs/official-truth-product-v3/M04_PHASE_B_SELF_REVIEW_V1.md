# R28 author self-review — explicit CI prerequisite exception

Snapshot: 2026-11-10T16:03:09Z. Same author `/root/m04_durable_jobs_writer_g2`, exact ec4de baseline. Root [v1](https://github.com/Jetnity/jetnity/pull/1182#issuecomment-6772056631) and [v2](https://github.com/Jetnity/jetnity/pull/1182#issuecomment-6772232105) explicitly authorize the two-path repair. This is source reasoning and text/hash verification, **not runtime or Technical-Lead PASS**.

## Scope and inverse proof

The workflow changes exactly lines 15, 83, 120 and 153 from `ubuntu-latest` to `ubuntu-24.04`. Seven job definitions still expand to eight jobs; both accepted-store matrix groups remain mandatory. Every other workflow byte remains exact: names, commands, dependencies, matrix, timeouts, concurrency, environment, permissions and guards. UI/Auth/aggregate runners remain unchanged.

The independent reviewer found that the existing atomic contract selects exactly accepted_store_native and requires ubuntu-latest. The author confirmed it from the immutable source and stopped that unapproved expansion. Root v2 then authorized exactly line 139 to require `/runs-on: ubuntu-24\.04/`. The assertion remains; the escaped dot checks the literal separator. No other assertion or byte changes.

Both inverse deltas recover the exact published sources. Prepared workflow is 12325 bytes/SHA256 `3889e092f9cf4ce4b917a786a3267bf9bb510b727d5c76db7cabf6b08f9e6d18`; prepared contract is 24091 bytes/SHA256 `06fe1dc21c9d605e1cb9c6f96dc715674481889fc5106ea54031f49ad2b4b102`.

**Zero M04 source changes:** all 18 pins and aggregate `d2753193415468a06ea93f23e21b40e3e2b822a5dd6d3736d28db6eafd24f761` remain exact. No SQL, Native oracle, detector, predecessor, rollback or browser source changed. All 31 groups/order, full quotas, both R9, inherited 761 pairs/minOwned4182, final N15 and time/resource bounds remain.

## Contract and compatibility limits

Immutable mode is NORMAL; mode metadata and guards were read and remain unchanged. The UI contract explicitly retains ubuntu-latest for unchanged UI. Package commands, aggregate requirements and the other read CI protections remain. The fixed four-binary PostgreSQL detector was independently hash-checked: 5280 bytes/SHA256 `f6d21b3fef8f0ad41a8ac3951972ea5cba0394cfe41037eba8d0258ed508aa10`.

Root's complete historical evidence records the observed Ubuntu26 toolchain incompatibility and official runner-image documentation. Selecting Ubuntu24.04 does not install binaries, widen discovery to PostgreSQL18, add fallback, or guarantee a future image patch. No timing gain, sufficient margin or future success is claimed.

## Exact historical failure and current false flags

Failure 18 is copied completely from [Root's terminal R27 object](https://github.com/Jetnity/jetnity/pull/1182#issuecomment-6772268521): 37967 pretty-JSON bytes including trailing LF, SHA256 `db7b166bbcff8941604c7ef73e5f358a4752817e0b19a218990f206fe1b47897`. All seventeen earlier failure objects, genuine R21 success, corrected R22 metadata and the previous Markdown tail remain exact.

Historical `executed:true` means harness entry, with zero native groups, fixture_acquire failure and cleanupFailureCount 1. Raw clusters 1/stoppedClusters 0 are preserved without claiming a created cluster or clean cleanup. Core's five extra PostgreSQL-unavailable skips are not accepted. All four companion native bootstrap failures remain part of that historical result; Auth evidence is metadata only.

No current local/project/test/parser/compiler/SQL/native/build execution occurred. All 22 current R28 coverage rows, execution/PASS/Ready/merge flags remain false. Root must independently reconstruct, publish with the exact ec4de lease and verify complete new-head CI/runner/native/lifecycle/Preview evidence, followed by actual-main CI/native/Production. All Owner, SQL UNAPPLIED, Method NOT_APPROVED, privacy/hosted/#917 hard stops persist.

**AUTHOR STOP.** No author publication, Ready, merge or automatic follow-up slice.

---

# R27 author self-review — source reasoning only

Snapshot: 2026-11-10T15:33:27Z. Same author `/root/m04_durable_jobs_writer_g2`, same Draft #1182 and frozen b841 baseline. [Recovery Task V18 v2](https://github.com/Jetnity/jetnity/pull/1182#issuecomment-6771362923) is the complete implementation authorization. This author review is **not** a compiler, native, performance or Technical-Lead PASS.

## Selected delta and equivalence

Only the 957-byte `nodes_v1` body becomes the selected 1233-byte body. Its original entry guard is exact. For objects, every immediate field contributes one key and one minimum value node; for arrays each immediate value contributes one minimum node. Thus object weight is `1+2K+Σ(m−1)` and array weight is `1+N+Σ(m−1)`, with corrections only for actual container children.

Every successful recursive count is at least one, so corrections cannot reduce the minimum. Minimum cap refusal is equivalent to eventual old-loop refusal. Nonempty maximum-depth containers still refuse before filtering; empty containers and scalar roots retain one. Recursive depth/cap arguments remain identical. The bigint count is capped before assigning the integer total; later `n+m−1` is at most 131071 before the cap check. SQL NULL/invalid parameters return the same -1 sentinel. Unicode/control/empty key bytes remain count-only; no canonical guard moves or disappears.

The sole Native insertion is 1818 bytes, SHA256 `54b02b8de7d77ce75d250186890be86187f20156e8429ea4b382c26465780e3e`. The twelve labeled tuples exactly match the authorized 1189-byte JSON, SHA256 `72bdb47fef878e4ae2461de6d5c1feb5a52dfc26a5c5b9e30f339dd86b9ebf06`. Each awaits the existing owner connection and four-parameter NULLIF query, then checks an independent literal count or -1:

- Sixteen scalar fields: 33 at cap 33; refusal at cap 32.
- Sixteen scalar array values: 17 at cap 17; refusal at cap 16.
- Early and late mixed container placement: 11 at cap 11; refusal at cap 10 for each.
- Mixed array: 8 at cap 8; refusal at cap 7.
- A later nonempty container at depth 24: refusal after a valid earlier empty container.
- Empty/control/Unicode keys with empty children at the limit: 7.

Every previous R19 NULL/scalar/depth/cap case, all R20–R26 oracles, the 36-case/72-mode key matrix, all 31 groups and their order remain exact. Inverse text transformations recover the published sources; all 29 declarations/attributes, every byte outside the body/insertion and sixteen other source pins remain unchanged. Current source aggregate is `d2753193415468a06ea93f23e21b40e3e2b822a5dd6d3736d28db6eafd24f761`.

## Cost limits and historical evidence

The source model is limited to queued/leased Discovery child-loop iterations, 23→2 and 27→3. All recursive container validation remains. PG16 `jsonfuncs.c` at immutable ref `c372fbbd8e911f2412b80a8c39d7079366565d67`, blob `70cb922e6b7aa45629483bb64d3380d07a1e81a0`, shows the additional object-key allocation/count and retained each/elements materialization; array length reads the header. No aggregate history count, measured speedup, server profile, runner-cause claim or adequate margin is inferred.

The complete [actual R26 object](https://github.com/Jetnity/jetnity/pull/1182#issuecomment-6771379206), 38889 pretty-JSON bytes/SHA256 `46d76c6da0f91c001706a1fccd595e86833c373ab9edaa10d46bba8c0c8d16d1`, is appended as failure 17 without alteration. It includes 24 completed groups, both R9/full ledger, cycle deadline failure, exact cleanup and the genuine separate lifecycle success. All sixteen earlier failures, genuine R21 success, corrected R22 metadata and the previous Markdown tail remain exact. No history is upgraded into current R27 coverage.

## Disposition

No local/project/parser/SQL/native/compiler/build execution occurred. All current R27 execution and 22 coverage rows remain unexecuted; PASS/Ready/merge remain false. Full history, 254/255/256 and 64/65 boundaries, both R9, inherited 761 pairs/minOwned4182, final N15, all time/resource bounds and every Owner/hosted/#917 gate remain.

Root must independently reconstruct and review, publish with the expected b841 lease, then accept the full unchanged new-head CI and exact Preview. Actual new main CI/native/Production and finite closure follow separately. **AUTHOR STOP**; no Ready, merge or next slice by the author.

---

# R26 / Recovery Task V17 — bounded author self-review

Captured: 2026-11-10T14:46:48Z. Same Generation2 session; baseline `45be21e57988d91dca3ee0758712f3ef5f39d744`. [Binding authorization](https://github.com/Jetnity/jetnity/pull/1182#issuecomment-6770330334). Prepared source only: no local project/compiler/parser/SQL/native execution and no runtime or Technical-Lead PASS.

## Same-invocation equivalence

The selected helper retains one input object and its successful canonical result in separate uninitialized local variables. Only the object-parent/object-child branch changes. The first object always calls the original recursive validator. Later objects reuse its result only when complete JSONB text representations compare equal under explicit C; otherwise the original call runs and both retained fields update only after success.

The original parent-key ASCII guard and child-depth guard still precede lookup. The same parent invocation guarantees the same child depth. Scalar and array siblings execute their original checks and cannot overwrite the separate retained result. There is no prefilter, cross-call state, trust marker or map. Other canonical branches, ordering, key encoding and all other functions remain exact.

Added retained state is one object/result per active invocation, input-sized under existing bounded application entrypoints and depth. This is not a universal byte cap for arbitrary private helper calls. Extra serialization, comparison and allocation are real costs.

Independent source reasoning read PostgreSQL 16 at `c372fbbd8e911f2412b80a8c39d7079366565d67`: JSONB output is an iterator loop; its child iteration does not recursively expand the C stack in one call. Source blobs `cf43c3f2ded19aabd2a913ab914f84d6c70d3afc` and `9cc95b773dbf070123a657194c95d321ea05272d` are recorded in the JSON correction. This addresses the proposed depth-stack error concern, not elapsed-time or allocation guarantees.

## Source work and regression boundary

A representative queued Discovery job has three object containers, 23 keys and 21 scalar leaves. The two envelope traversals per dedup historical row can avoid six recursive entries and 46 key visits while adding eight JSONB text serializations. The planned 254-command fill entails 64009 dedup historical-row validations: 384054 entries and 2944414 key visits removed in that static model. Singleton-object parents add no comparison serialization.

These are source counts only. Complete history remains quadratic; both command validations, both envelope validations and every row, job/node/hash/time/authority/error-order check remain. No measured speedup, sufficient budget margin, full-cap Rule latency or Production SLO claim.

The sole 2010-byte N02 insertion adds 18 calls through existing canonicalAt: seven fixed output oracles and eleven P7601 refusals. It covers scalar/array interleaving, A/B/A and A/B/B, C-distinct strings/raw safe integers, normalized key order, same-depth empty objects and invalid first/second objects, keys, control/nonASCII strings, unsafe/fractional numbers, depth and true SQL NULL. Raw JSON strings preserve numeric precision; existing NULLIF reaches actual SQL NULL. No internal branch receipt is invented.

Inverse deltas recover exact 45be SQL/native. All outside bytes, 29 declarations/attributes, 31 group names/order, prior 36-case/72-mode matrix and 16 other source pins remain unchanged. SQL: 139163 / `81bb875daa205d087b1f9faba7f3a41fd445bec14cbbe6b7a0aea628818ef820`; Native: 177160 / `d413d4de82548af38cbd7f54f226c2a72c582b4fd3e913b557793d8a3e12548c`; all-18 aggregate `aae92c558a32210c6f86d3140e00798fd6a36c5f942a9b4a8d9322ddc8a407ba`. Root independently reconstructed these source pins; that source review is not execution acceptance.

## Historical evidence and remaining gates

Actual 45be R25 passed Typecheck/Lint, 23 native groups and both R9, then reached the ledger deadline after 237 acknowledged commands. Later database outcome is UNKNOWN. All 27068 effects settled and 4242 connections closed, zero pending/errors. Independently, lifecycle stopped at the 5s Chrome-version preflight before its actual fixture/browser proof; cause UNKNOWN, browser source unchanged. Five jobs passed and three failed.

All 15 prior failures, complete genuine R21 success, corrected separate R22 terminal metadata and Markdown tails remain exact. The full actual R25 receipt and separate lifecycle finding form failure 16. Earlier local 64-test/TypeScript/lint results stay historical; all 22 current rows and execution/PASS/Ready/merge fields remain false.

P1 remains unmet full new-head and mandatory actual-main acceptance under unchanged limits. Both complete quotas, R9, inherited 761-pair/minOwned4182 boundary, final N15/latewriter/cleanup and actual lifecycle proof are mandatory. Root owns V17 Task/Review/Evidence/Excerpt, publication and re-gating; all Owner, SQL UNAPPLIED, Method/#1139, forbidden #917, privacy/hosted and resource gates remain.

**AUTHOR STOP.** No author execution, installation, environment reconstruction, logs/hosted/#917 access, publication, Ready, merge or automatic follow-up slice.

## Previous author self-review — preserved verbatim

# R25 / Recovery Task V16 — bounded author self-review

Captured: 2026-11-10T13:55:02Z. Same Generation2 author/session; baseline `1aecc862c4b2710bb12c900195259ee25eb6f70d`. [Exact Root authorization](https://github.com/Jetnity/jetnity/pull/1182#issuecomment-6769130908). Prepared source only; no Typecheck, SQL execution, native PASS or Technical-Lead acceptance is claimed.

## Selected computation and equivalence

The sole SQL-body replacement is:

```sql
  SELECT v IS NOT NULL AND expected IS NOT NULL AND jsonb_typeof(v)='object' AND
    ARRAY(SELECT k FROM jsonb_object_keys(CASE WHEN jsonb_typeof(v)='object' THEN v ELSE '{}'::jsonb END) k ORDER BY k COLLATE "C")
    = ARRAY(SELECT k FROM unnest(expected) k ORDER BY k COLLATE "C")
```

The original guards and safe nonobject CASE remain. Each constructor consumes the same sorted text sequence as the former array_agg. Duplicate and NULL elements remain; unchanged unnest flattens dimensions; nonempty result arrays have lower bound 1 and empty results match former COALESCE normalization. Selected `k` remains uncollated and C remains exclusively in ORDER BY. No new equality collation, key normalization, acceptance limit or exception is introduced.

Primary PostgreSQL 16 sources were read at `c372fbbd8e911f2412b80a8c39d7079366565d67`. Array transition/finalization, ARRAY_SUBLINK and makeArrayResultAny establish the element/empty/bound behavior; parse_collate excludes ordering-only aggregate arguments from result collation and derives ARRAY result collation from selected `k`. Exact source blobs are recorded in the JSON correction. LANGUAGE sql, search_path and every declaration/attribute remain unchanged.

SQL-function startup and executor initialization show why source structure is relevant: subplans can require initialization even when CASE avoids their evaluation. This does not mean the unused R24 fallback was evaluated. Three source subqueries become two, but the new valid path again sorts/builds arrays. No server plan/profile, causal R24 regression, timing advantage or sufficient budget margin was measured.

## Native coverage and source boundary

Only the selected comment and two case labels change. All 36 existing VALUES cases and 72 default/C observations retain literal booleans, original-expression comparison, exact input values, assertions, query/connection count and their position inside N02. The tests still cover SQL NULL distinct from JSON null, every scalar/array category, empty/Unicode/escaped/control keys, duplicates/NULLs, missing/extra/wrong/nested keys, multidimensional arrays, nonstandard lower bounds and 32/33-key cases. No new test or availability skip is introduced. Default/C are two selected modes, not proof of two distinct effective CI collations or executed nondeterministic collation coverage.

Inverse text replacement restores exact 1aecc SQL/native. All outside bytes, 29 declarations, 31 proof labels/order, prior queries, R23 annotation and 16 other source pins remain exact. Root and the independent reviewer separately reconstructed the final source pins without a concrete source blocker; execution still awaits new CI.

SQL: 138695 / `4861f083bffcc5fb662128bff01e687662d62f5e8e5bf6af3512efbaad8616aa` / blob `67f073a0d19b31309f8276bba62770a4f36f8fb9`. Native: 175150 / `ae583470991dd991e1775af845cd8dfe71c878770339adca00545e5e248b922a` / blob `89f8026cf0b96971f529d6ab59fe14a2fbfe6150`. All-18 aggregate: `7617013b8a5f8fd83e59d8ec577cd2e9aacfb51849850944fae1e3e6744b0d6d`.

## Evidence precision and remaining risk

Actual 1aecc Typecheck/Lint, N02 matrix and both R9 passed, with 23/31 groups complete. Ledger group 24 failed at global 240s after 228 acknowledged commands, no START/cycles; later DB outcome UNKNOWN. All 26776 effects settled and 4242 connections closed, zero pending/errors, 240422ms total / 38ms cleanup. These are historical client/fixture observations, not current R25 acceptance or server-cost attribution. No individual serialized per-case receipt is invented from the completed N02 group.

All 14 old failure objects, complete genuine R21 PR success, corrected separate old-R22 terminal observation and Markdown tails remain exact. The full actual R24 receipt is appended as failure 15. Existing local 64-test/TypeScript/lint results remain historical. All 22 current rows and execution/PASS/Ready/merge fields remain false.

P1 remains unmet full new-head and mandatory actual-main acceptance under unchanged bounds. Every history row, command/transition/authority/error-order check, both full quotas, R9, inherited 761-pair/minOwned4182 proof, final rollback and complete cleanup remain mandatory. History stays quadratic; no full-cap Rule latency or Production SLO claim. Root owns V16 Task/Review/Evidence/Excerpt, publication and re-gating. All Owner, SQL UNAPPLIED, Method/#1139, forbidden #917 and privacy/hosted gates remain.

**AUTHOR STOP.** No author project/parser/SQL/native/tests/typecheck/build execution, installation, environment reconstruction, hosted access, publication, Ready, merge or automatic follow-up slice.

## Previous author self-review — preserved verbatim

# R24 / Recovery Task V15 — bounded author self-review

Captured: 2026-11-10T12:55:53Z. Same Generation2 author/session. Baseline `ca6fcb8930e68e394156d67351ee087c4cddb180`; existing Draft #1182. [Root authorization](https://github.com/Jetnity/jetnity/pull/1182#issuecomment-6767645250). This is a source/data review, not a Typecheck, SQL execution, native proof or Technical-Lead PASS.

## Exact-key equivalence

The only changed SQL body is `exact_keys_v1`. An actual nested CASE protects the new delete and key-count operations with object JSONB, one-dimensional expected array and cardinality <=32. The complete prior guards, two C-sorted array_agg/COALESCE expressions and original comparison remain verbatim in the fallback.

Let K be the actual keys and U the distinct non-NULL expected elements. Membership proves U subset K; deletion-empty proves K subset U. Equal actual-key count and full expected cardinality then exclude duplicate and NULL positions. The original C-sorted arrays are byte-identical on the selected positive path. False, NULL and nonselected cases execute the original expression, preserving collation-sensitive equality. The 32 selector is not an acceptance restriction; all current caller lists are at most 20 keys.

Primary PostgreSQL 16 source was read at commit `c372fbbd8e911f2412b80a8c39d7079366565d67`: `jsonb_op.c` blob `054351f0a31e7621c2eec8e20d20c11808c9ffeb`, `jsonfuncs.c` blob `70cb922e6b7aa45629483bb64d3380d07a1e81a0`, and SQL-function parameter collation in `functions.c` blob `f55424eb5ad8a97ba3c76169860762c05015d8cd`. JSONB deletion rejects scalar/multidimensional inputs, so the CASE placement is material. The unchanged LANGUAGE sql/search_path and original fallback remain part of the reasoning. No nondeterministic-collation execution is claimed.

The source model counts 14 helper calls per representative queued Discovery dedup history row. The planned ledger has 253 squared = 64009 such row validations, hence 896126 helper calls / 1792252 original aggregate-plus-COALESCE expressions. These are written-operation counts only. JSONB membership/deletion/count add their own cost; no measured timing or speedup follows. No command/history/transition validation or error order is removed, and history remains quadratic.

## Prepared finite oracles

A sole 6625-byte N02 insertion contains 36 fixed VALUES cases in one SELECT. Every row has a literal boolean, actual helper and complete original-expression result, in default and explicit C modes: 72 case/mode observations awaiting CI. Coverage includes reordered/exact keys, arbitrary nested values, empty/Unicode/control/escaped keys, missing/extra/wrong/nested-only keys, duplicates/NULLs at matching raw cardinality, SQL NULL distinct from JSON null, every scalar/array category, empty arrays, zero/negative lower bounds, correct/incorrect multidimensional inputs and exact 32/33 boundaries.

The SQL NULL cases use actual `NULL::jsonb` / `NULL::text[]` literals. String.raw preserves the escaped-key SQL text. Fixed results use `boolean::text` values `true`/`false`; the original differential appears twice verbatim. No availability skip, collation object, extra connection, history seed, any/suppression/domain cast or modified existing oracle is added. The existing R22 36-query block and R23 safe annotation remain exact.

SQL pin: 139034 / `9dccc0108dd8397730c968c1bfb944100e963932f64dcc34442b00b1e71a0f42` / `af60edee3776d9eba5b13b6db3cfad733b245567`. Native pin: 175160 / `f1221afc362db3f49232ce02bfc45233f498590e4c79f00d5a559b3e907adf1a` / `560c1cebc71ce21936b08d3d6296de0a8edea843`. Aggregate: `daf5cd8a8644e0a37d5903f2e95d95bec8b9b458ad19204751b0ddccebdbc9a3`. Pure text comparison preserves every outside byte, all 29 declarations, 31 proof labels/order and 16 other source pins. Independent review separately reconstructed the same final source pins; that is source review only.

## Evidence, risk and STOP

Actual ca6f Typecheck/Lint and 24 groups passed, including N02/both R9/full ledger. Cycle group 25 failed at global 240s after 113 acknowledged commands and 38 STARTs; later database outcome UNKNOWN. Cleanup: 26926/26926 settled, 4242/4242 closed, no pending/errors, 240470ms total / 21ms cleanup. First 23 groups 90403ms, ledger 106544ms, failed cycle 42668.60444ms. Full receipt and Root log pins are preserved in the fourteenth historical record; no current R24 runtime result is inferred.

All 13 prior failures, separate genuine R21 success and Markdown tails remain exact. The later terminal status of the old R22 run is appended separately without rewriting its original snapshot or inventing native/cleanup execution. Earlier local 64-test/TypeScript/lint evidence remains historical, not R24 execution.

P1 remains unmet full exact-head and actual-main acceptance under unchanged bounds. No source-only proof guarantees enough runtime margin, full-cap Rule latency or a Production SLO. Root owns Task/Review/Evidence/Excerpt V15, publication and re-gating. SQL remains UNAPPLIED and every Owner/hosted/privacy/#917 gate remains in force.

**AUTHOR STOP.** No author local/project/parser/SQL/native/typecheck/build execution, installation, replacement environment, hosted access, publication, Ready, merge or next slice.

## Previous author self-review — preserved verbatim

# M04 Phase B — R23 / Recovery Task V14 current author self-review

**Source/data review only; AUTHOR STOP.** Same `/root/m04_durable_jobs_writer_g2` session, existing Draft #1182. No new runtime or Technical-Lead acceptance.

## One permitted type annotation

The exact published R22 source fails Typecheck TS7022 on the newly added local `value`. The only change is:

```ts
const value: Record<string, unknown> = { ...base, lease: { ...base.lease, acquiredAt, expiresAt, ...(extraKey ? { extra: true } : {}) } }
```

`Record<string, unknown>` represents an object that intentionally includes valid and malformed negative-test variants. It does not assert that those variants are valid V3 domain records. There is no `any`, cast, suppression, ts-ignore, helper/contract edit or configuration exception. JSON serialization and equality assertions receive the same initializer. Exactly 25 added ASCII bytes are the entire source delta.

Native pin: 168535 bytes / `dbc3ad51567753dd5ebc71fe6106504f5a6d112f73aed8e62f136454a8c626a2` / blob `2be195a3346213b12a9498a07ae398dc9922dae1`. All-18 aggregate: `1d30c2168051a359797cd6700ee3e1d6dab7b023a026119a1377cd8ee880d2bc`.

Pure text comparison restores the complete exact-54c4 native file when the annotation is removed. All 17 other source pins, SQL, 36 queries, fixed expectations, 31 groups/order, R9, both full quotas, final N15 and every resource limit remain unchanged. The independent reviewer separately reconstructed these final source pins. Actual Typecheck and execution still require the new unchanged CI.

## Historical evidence precision

Root's terminal Repository verification job 129809743296 failed Typecheck in run 42810301725. Tests/M04 never executed; no native or cleanup receipt exists and no successful cleanup is inferred from ordinary job cleanup. Full non-Auth job log: 106133 bytes / 106065 characters / 869 lines, SHA256 `b48164c277aa81719c4f069024bbc28642b0a25b6360d394ce2c05b2a50655cf`. The author read only the sanitized [Root dispatch](https://github.com/Jetnity/jetnity/pull/1182#issuecomment-6766572359). Overall run was in progress at Root's stated 11:49:52 UTC observation.

Exact Preview dpl_4Se4HcJSTKcnAmL7QAxAUKT7eEYU was ERROR / lint_or_type_error on head 54c4, according to Root's metadata verification. No Vercel/Auth logs were read. Root-prepared failure excerpt: 1989 bytes / SHA256 `6cd22336ecb4d4ddbefc46dd8cb897c35b475fb88210f9c78324ade5821b4751`.

The twelve previous failure objects and complete separately stored genuine R21 PR success are preserved exactly. This thirteenth record is a confirmed Typecheck-job failure, distinct from earlier native budget failures. Last actually executed native progress remains historical main 4bfa. Current R23 execution/PASS fields remain false; the annotation is not a claim of measured performance or repaired native budget margin.

P1 remains the failed Typecheck/Preview and unmet full exact-head plus actual-main acceptance. Existing quadratic-history performance limits and all Owner/hosted/privacy/#917 gates remain. Root owns Task/Review/Evidence/Excerpt V14, publication and complete re-gating. No author local execution, installation, environment reconstruction, publication, Ready, merge or next slice.

## Previous author self-review — preserved verbatim

# M04 Phase B — R22 / Recovery Task V13 current author self-review

**Prepared source/data review only. AUTHOR STOP; no current native, runtime or Technical-Lead PASS.** Same Generation2/session `/root/m04_durable_jobs_writer_g2`. Origin #1178 is merged; the linked R22 fix PR remains pending Root creation.

## Scope and equivalence

1. `subject_v1` retains the existing first canonical validation in local `pair_text` and hashes those same bytes. For two actual country JSON strings, closed Pair/Method shapes and JSON escaping make the unescaped root `,"method":` token unique. `overlay` inserts the actual kind's depth-1 canonical scalar immediately before that property; `strpos` explicitly uses C collation. The existing original full second expression remains for other shapes. Every Method/Pair guard and all Rule code are unchanged. This selector adds no refusal or unchecked constant-kind normalization. An unusual-collation fallback execution is not claimed.
2. At the two existing `acquiredAt` parser positions, exact original-text C equality permits reuse of already validated `updated`. Unequal or NULL text invokes the original parser at the same position. Created/updated order, both expiry parses, range/state/fence checks and the 900-second duration remain byte-identical outside these two expressions. There is no hoisting or expiry cache.
3. All outside-scope SQL bytes, 29 declaration signatures/attributes and all native bytes outside the single N02 insertion are preserved; the other 16 source pins and 31 proof names/order are unchanged. No history row, command/journal/transition check, R9 witness, full quota, final N15 or resource limit is removed.

## Finite independent oracles

The 7192-byte insertion adds exactly 36 direct SQL queries: three fixed Discovery subject strings/job digests, six refusals, one anonymous DO with two fixed Method-before-Pair error-message oracles, and thirteen lease-time vectors for each of Rule and Discovery. Expected strings/digests are literal independently derived data. Minimum/maximum MethodId length and revision, reordered input keys, hostile metadata and closed-key/method/pair refusals are retained.

Both leased bases are derived by the unchanged actual queue using prospective enqueue/claim envelopes; no journal is seeded. Cases cover equal/older valid acquiredAt at exactly 900 seconds, before-created/future times, JSON null/object/malformed/noncanonical same-instant input, expiry-at-updated/malformed/>900 refusal, and an older acquiredAt lasting 900.001 seconds while only 899.001 seconds have elapsed from updatedAt. The latter distinguishes correct fallback from unconditional reuse in the upper bound. The final extra-lease-key case intentionally fails at the earlier exact-key guard.

These are prepared oracles, not execution evidence. The independent reviewer verified the final literal bytes, fixed digests and bounded source semantics; Root alone decides acceptance after full actual CI.

## Pre-publication findings resolved

[Root dispatch v4](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6766052044) approved exactly two immediate fixes in the same session: remove the new claim envelope's extra root `kind` while preserving `claim(kind)` and locator-derived kind; apply C collation only to the new anchor search. The earlier SQL `c9717766...` / native `e4f03b2c...` pins are explicitly discarded, unpublished and unexecuted. Neither issue caused the historical main failure.

Final candidate SQL: 138753 bytes / SHA256 `9a92e0b8d9b948df49e5c1557aa116af37607e6e282dd3af897be5b84bcf567f` / blob `50fa3a48fb6af74dea120dc71940945bb9500537`.

Final native: 168510 bytes / SHA256 `e296958fec8e6d7afa113ccb4d24f4d7a2434cb1e3bc232ac120eb2a9efb2ec1` / blob `f59f4b571cb22592cef94af3cbaff2bf12ca30de`. Insertion SHA256 `bdfb119db60b0812fd8e83c98f112fbcf403014f4df11147fdca8ca04e591f5b`.

All-18 aggregate: `8aa1579386054a9a991cc9dd63c0b61b96f60e716a731f956b66c4b5b210e77b`.

## Evidence precision and risks

Genuine R21 PR CI 42798428417 passed all 31 groups/all eight jobs and received Root FINAL PASS before merge to main4bfa. Actual-main CI 42801478210 then failed group25/N05 after 24 groups, full ledger and both R9 witnesses. First23 groups totalled 90384ms, ledger group111659ms, failing cycle group37652.09814ms. Cycle counters show 103 acknowledged commands and 34 STARTs; the next database outcome remains UNKNOWN. No server profiling or causal runner/code explanation is asserted.

All eleven old failed-run objects and Markdown tails are preserved; actual-main is appended as failure twelve. The complete successful PR receipt is held separately, not rewritten as failure or treated as current R22 acceptance. Root's actual-main full-log SHA256 is `a14ef9c860a87b331346edf23583161f80b43c69d562759401e76fb4275efa59`; the author read sanitized Root evidence only.

P1 remains the unmet mandatory actual-main acceptance gate. P2 remains quadratic full-history work and unproved reliable margin, full-cap Rule latency and Production capacity/SLO. Source counts describe conditional avoided work only: three Discovery subject calls can avoid six repeated container loops/eighteen key encodings per representative dedup row while actual-kind validation remains; equal leased time text can avoid two timestamp and two civil-date calls. Added selector/search/overlay work exists; no speed guarantee follows. No new permitted-evidence Production incident is established. Existing Owner/privacy/hosted/#917 gates remain.

No local project/parser/SQL/native/build/test execution, installation, forbidden logs/hosted access, Git mutation, Ready, merge or next slice by this author. Root owns Task V13, Root Review, failure evidence/excerpt, linked Draft publication and all fresh gates.

## Previous author self-review — preserved verbatim

# M04 Phase-B author self-review V1 — R21 current

**SAME GENERATION2 SESSION. AUTHOR REVIEW IS NOT TL ACCEPTANCE.**

[R21 authorization](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6761489935) binds this delivery to baseline `d51d420a0ba83c56c7cf72166b5d328491fe54a5`. Only the approved three string outputs and one N02 block change.

## Equivalence and regression scope

Each unchanged canonical branch already establishes a JSONB string and validates its decoded text as printable ASCII. Serializing that original scalar preserves the same JSONB quoting/escaping previously obtained by reconstructing it with to_jsonb. Object-key reconstruction remains. No extraction, guard, order, depth, numeric rule, timestamp reuse or other SQL byte changes. History and command/transition failure ordering remain exact.

Nine direct queries cover seven scalar cases at root/object/array: empty string, alternate ASCII escapes, escaped slash, quote, backslash, literal backslash-u without second interpretation, and string null. Two independent fixed mixed vectors cover successive/nested values. All expected bytes are explicit literals. Existing rejection cases and all R20 queries are untouched.

The 1555-byte insertion leaves every other native byte unchanged. Source counts give 106 redundant value reconstructions per representative Discovery dedup history row; keys remain encoded. This is no server profile, measured speedup, reliable margin or full-cap Rule/Production SLO evidence.

## Frozen evidence and interruption recovery

SQL 138224 bytes/SHA256 `063180813b9a4fac6df1493202c3e45c1b6d711de92cf9edcb2c7910b44e2080`; native 161318 bytes/SHA256 `c4001fd857386f2b789852f346086cb0167ffd627959802d65baf6d11bd86104`. Aggregate `11183e770f0c39dc51878e38b0a92a76a7b05a974f681bea13b87857daae60c6`. The manifest records all 18 pins; the two changed-source Git blobs are in the status record. All 16 other sources, 29 declarations, 31 groups/order, R9, quotas and budgets remain.

The transient store was lost after the source delivery; no completed R21 author documents existed then. After Root resumed the persisted authorization, exact GitHub file reads restored the d51 baseline. Pure text/hash reconstruction reproduced the frozen source pins exactly. No project/parser/SQL/native/build execution, installation, repository reconstruction, hosted action or git fetch/push occurred. Root alone reread terminal logs; author did not access logs.

Root's rechecked CI 42771272293 receipt has compact-JSON SHA256 `a2c0bfa546603aaec6cc7835494e2e989c132ff2b62358d84aa2947678fb8acf`. First 23 groups and both R9 passed; group 24 timed out; 25–31 were unreached. The 215 acknowledged ledger commits do not establish the unfinished next call's database outcome. All 26644 operations settled and 4242 connections closed with zero cleanup errors; total 240376 ms/cleanup 26 ms. Core 8682/8678 passed/2 failed/2 skipped/0 cancelled, 844519.303993 ms. No causal performance conclusion is drawn.

Full source/log evidence and the new 6417-byte V12 excerpt pin are in the JSON documents. The old lost unpublished excerpt is not used. All eleven historical failures, previous ten exact objects, previous Markdown tails, 18 source pins, 22 current-unexecuted rows and 31 groups are preserved. Historical 64/64 author checks were not rerun.

**AUTHOR STOP.** Current R21 execution/native/runtime PASS/Ready/merge are false. Root independently reviews, publishes and gates the unchanged full CI, including actual quota boundaries and cleanup within 240s effects +60s/300s total. Method NOT_APPROVED, #1139/17 gaps, #1131, both #1135 holds, #968, #911/#913 and the specific #917 refusal remain. No automatic follow-up slice.

---

## Historical R20 and earlier author self-reviews

The exact previous records follow unchanged and do not grant current R21 acceptance.

# M04 Phase-B author self-review V1 — R20 current

**SAME GENERATION2 / SAME SESSION. AUTHOR SELF-REVIEW IS NOT TECHNICAL-LEAD ACCEPTANCE.**

[Diagnosis](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6760723089) and [finite authorization](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6760854161) bind this cut to `72868a287280a6c1d96222268a1413110ec95039`, tree `06ac3e6d4eedbb3e42795bff942b19364a45a848`.

## Exact equivalence boundary

In canonical_v1, one numeric local replaces repeated text-to-numeric conversion in the two inline leaf branches and root numeric branch. Each branch assigns that local before use; successive values cannot reuse a previous number. One existing assignment stays one assignment. Both trunc calls, the integral/safe-range condition, P7601 error and output structure remain. Numeric uses PostgreSQL exact numeric, not floating-point conversion. Every other canonical branch and depth/order/ASCII/string/node behavior remains.

In job_v1, createdAt still passes timestamp_v1 first. The following updated assignment compares original extracted texts with explicit COLLATE C. Only exact equality reuses validated created. SQL NULL/JSON null yields an unknown comparison and takes the original parser fallback. Different text, even another representation of the same instant, also takes that parser. Invalid identical strings fail the mandatory created parse. The returned record remains the original input; no timestamp is rewritten.

Only these two bodies change. All created, lease, backoff and final lifecycle predicates, timestamp_v1/civil_date_v1 and nodes_v1 bodies remain exact. No guard is reordered; no validation is dropped from history, command, transition, catalog, API/transaction staging or final authority. All 29 declarations/attributes, objects, indexes, roles/grants and resource limits remain.

## Bounded independent regression oracles

One 2417-byte N02 insertion adds exactly 24 direct queries. Existing commandRequest prepares a valid prospective queued record for each kind at a fixed timestamp; no journal write or new persisted subject is introduced.

For each kind, two valid cases return the exact complete input record: equal timestamps and a different later updated timestamp. Eight refusal cases retain both keys: equal invalid calendar strings, different malformed updated text, JSON null, boolean, number, object, valid earlier updated time, and a same-instant +00:00 representation that violates the required Z syntax. Rejection requires P7601.

Two raw numeric mixed object/array cases have fixed expected canonical strings for multiple values, signed zero, scaled and exponent-form safe endpoints. A near-safe-limit fractional root and an array with a valid first value followed by an unsafe exponent reject P7601. Inputs never round-trip through JavaScript numbers. The signed-zero expectations concern private JSONB canonicalization; raw wire negative-zero refusal remains unchanged.

All existing R19 direct-helper tests, including root/object/array paths and NULL/depth/count boundaries, remain. All native bytes outside the insertion, 31 proof group names/order, R9, quotas/progress, histories, ownership and cleanup remain exact.

## Frozen sources

| Source | Bytes | SHA256 | Git blob |
| --- | ---: | --- | --- |
| jobs-candidate.sql | 138254 | `18c5d6c7f724e9c90c2f6e2aa96b429afb397d405db355057071d195b1c5417e` | `779f45640fa80d1f64282191d94ed365e7fdb31a` |
| native.ts | 159763 | `7c1770792308989ee09dd460d97cc7df0c1193f45326612c842147abd3020810` | `810ed62e7c19e7f3d88d2ce9e88e767dcacaa39d` |

Eighteen-source aggregate: `cd76347b518c7c8cecd5661e73886712a8597164c8f98b3c8acebc84be9ae87e`. Sixteen other source pins and rollback remain unchanged. Text-only reconstruction/scope comparison is source review, not execution evidence.

## Historical actual receipt

Root independently read [terminal Repository verification 129666585217](https://github.com/Jetnity/jetnity/actions/runs/42767273189/job/129666585217), then provided the exact safe receipt and terminal metadata. The R20 author made no network or log request. Full log: 4253591 UTF-8 bytes /4244373 characters /63178 lines, SHA256 `ef023cffe525fbaed3491199a8292dcb6cf92a30d62aad74f7ae4f5adebca2f8`.

All six companions succeeded; Repository verification and aggregate 129670976070 failed. Typecheck/lint passed, tests failed, hygiene/build skipped. Core: 8689 tests /8685 passed /2 failed /2 skipped /0 cancelled; 557126.408018 ms. The two inherited layout skips are unchanged.

First 30 groups passed, including R19 N02, both actual R9 witnesses and all ledger/start quota boundaries. Their times total 238267 ms: first 23 groups 75116 ms, ledger 78506 ms, cycles 83847 ms and groups 26–30 798 ms. Final N15 failed after 174.23375 ms because the global effect budget expired; the exact failing statement is not identified.

Ledger completed index 253 with 256 commits/one START, 258 constructions/463 ms and 260 fulfilled fixed calls/78236 ms. Cycles completed index 63 with 193 commits/64 STARTs, 194 constructions/355 ms and 260 started/259 fulfilled fixed calls/83650 ms. The rejected pointer query explains the expected fulfilled-count difference; these counters are distinct from lifetime settlement and are client-await aggregates, not server timings.

All 27554 lifetime operations settled; zero pending, 4245 connections closed, two clusters stopped, zero child processes/cleanup errors. Total 240184 ms, cleanup 16 ms. Inherited commit-guard pairs 761 and minimum-owned 4182 were reached. Historical R9 distinguishes actual SQL wait, closed backend and retained executor; no raw-worker-return or elapsed 30s timer claim is added.

## Work model, limits and STOP

Full pre/post history traversal for 254 writes yields 64516 row validations. Each row validates one queued job with identical created/updated original text, removing one timestamp_v1 and nested civil_date_v1 call under the new assignment. A representative Discovery dedup row has 39 numeric canonical leaf visits: command4+4, envelope12+12 and job7; four conversions become one, removing 117 written conversions per representative visit. These are source-derived operation counts. Every value and history row still validates.

Execution overhead, catalog/hash/scan/transport work and total CI margin remain unmeasured for R20. No speedup or complete-CI guarantee is made. Discovery full-cap evidence does not establish Rule full-cap latency or Production SLO.

Ten historical failures remain separately preserved. Current 18 source pins, 22 current-unexecuted matrix rows and 31 native obligations remain. Prior Markdown tails are byte-identical. Historical 64/64 author checks were not rerun; no local project/parser/SQL/native/build execution, environment reconstruction, network/log access or Git/hosted mutation occurred.

Corrected R20 native/runtime/PASS flags remain false. Complete unchanged new-head CI must pass all 31 groups, both R9 cases, actual quotas and cleanup within 240s effects +60s cleanup/300s total. **AUTHOR STOP.** Root owns exact review, V11 publication and TL PASS/Ready/merge. No next slice or activation. Method NOT_APPROVED, #1139/17 gaps, #917 refusal, #1131, both #1135 holds, #968 and #911/#913 remain.

---

## Historical R19 and earlier author self-reviews

The exact previous records follow unchanged. Their headings and execution statements do not grant R20 acceptance.

# M04 Phase-B author self-review V1 — R19 current

**R19 SAME GENERATION2 / SAME SESSION. AUTHOR SELF-REVIEW IS NOT TECHNICAL-LEAD ACCEPTANCE.**

[Diagnosis](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6760204443) preceded [finite authorization](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6760293239). Baseline `f29ff3914f6731789f03970e1263a82b93844e3c`, tree `98a8b38b1f7d95fb2cd788dd347490d36f33a772`.

## Exact equivalence boundary

The candidate changes only canonical_v1 and nodes_v1 bodies. Function signatures, language, volatility, security/NULL attributes and fixed search paths remain. All root guards and canonical scalar-root branches remain byte-identical.

In canonical object/array loops, child depth is checked before processing. Object key validation and C order remain; arrays retain input order. Containers recurse. Scalar strings use the original extraction, ASCII test and to_jsonb escaping; numbers use the original integral/safe-range test and trunc(numeric)::text; booleans and JSON null keep their original representation. Both loop blocks use identical scalar dispatch. The P7601 error text is unchanged.

In nodes loops, child depth is checked before scalar weight one is used; containers recurse. Object accumulation still adds child weight plus one key; arrays add child weight only. The original maximum-count rejection follows accumulation. SQL NULL and invalid arguments still return -1; JSON null is one node. Empty containers at maximum depth remain valid and nonempty scalar-child containers remain invalid.

No history validation is removed or moved. assert_history, command, transition, catalog, API/transaction flow, final MA1/deadline checks and all other SQL bytes remain exact. No signature, helper, cache/trust flag, object, index, role/grant, resource or timeout is added.

## Finite direct native regression matrix

Only one N02 block is inserted. Fixed scalar expected strings are used directly and in literal object/array wrappers; independent explicit order/depth strings and node counts avoid deriving an oracle from the changed SQL helpers.

The cases cover:

- Scalar roots and both object/array nested scalar paths, including JSON null, booleans, ASCII-edge strings and quote/backslash escaping.
- C key order A, _, a, aa, b; array order; escaped quote/backslash keys; control/non-ASCII keys and values refused at root and nested positions.
- Raw JSON text 18.0, 18e0 and 1.8e1; both safe integer endpoints; both just-outside endpoints and fractions. Values are not rounded through JavaScript numbers.
- SQL NULL input/depth/limits, negative depth/limits, depth above maximum, max_d25 and max_n0/65537 refused. Small fixtures verify accepted max_d24/max_n65536.
- At depth24, scalar/empty containers accepted and scalar-child containers refused. At depth23, empty child containers accepted and scalar grandchildren at25 refused.
- JSON null=1, object {a:null}=3 versus array [null]=2, and mixed {a:1,b:[true,null]}=7; exact accepted cap and one-below refusals.
- Node counting still accepts non-ASCII/fraction/unsafe-number scalar values as weight one; it does not accidentally inherit canonical-value validation.

The existing text() helper converts JavaScript null to empty text. New nullable queries explicitly apply NULLIF before casts, reaching actual SQL NULL helper guards rather than empty-input JSON cast errors. Shared transport code is unchanged. The finite block contains 101 query calls by source counting; this is not an execution receipt.

All other native bytes, R18 N02/N03, corrected Rule age 68, all 31 groups/order, R9, quota histories/progress, timers and cleanup remain unchanged.

## Frozen source pins

| Source | Bytes | SHA256 | Git blob |
| --- | ---: | --- | --- |
| jobs-candidate.sql | 138052 | `5a05e41a7834307b8f28279493620d65150d8fc1a9b5b7f679d905de638787f8` | `b33072933f6a674478888e78284625983a084756` |
| native.ts | 157346 | `d50276c81d23f78c74baf12f110e72d6675aaa14e5061fbe13e4b2d199ffc582` | `6b5cc1a17f44fcb00acf2151f28d50887c3f2745` |

Eighteen-source aggregate: `69a61d7e59970c2bc71212ebc3225fdd039e6edbb2f904a5943b3cf6c3b550c6`. Sixteen other sources and rollback remain unchanged. Pure text comparison verifies all outside-block SQL/native bytes and all 29 function declarations/attributes; no code/parser/SQL execution was used.

## Historical observed evidence and uncertainty

[Repository verification 129654116009](https://github.com/Jetnity/jetnity/actions/runs/42763390608/job/129654116009): complete terminal non-Auth log **4250826 bytes / 63142 lines**, SHA256 `63cdb80bd138389acb0fe6efbe52b5b54e0db6c502245dc252f687d726d59b91`. Terminal run/jobs independently confirm failure, six successful companions and failed aggregate 129658414629. Typecheck/lint passed; tests failed; hygiene/build skipped.

First 23 groups passed, including R18 N02/N03 and both R9 witnesses; group-time sum 85796 ms. Actual R9 preserves the real SQL-wait and retained-executor/drain distinction. Natural I1 timeout and explicit caller abort remain distinct; no elapsed 30s worker timer is claimed.

N05/A03 timed out after 153758.244793 ms. Its receipt records last started/completed indices 240/239, 241 resolved constructions (427 ms), 242 fixed calls started/241 resolved (153556 ms), and 240 acknowledged commits. No START occurred and the cycle group was not reached. The next command's final database outcome is UNKNOWN. These are rounded client-await timings, not server CPU/function profiles.

Core: 8682 tests / 8678 passed / 2 failed / 2 skipped / 0 cancelled; 649469.896049 ms. All 27042 lifetime operations settled; 4242 connections closed; one cluster stopped; zero pending/children/cleanup errors; 240339 ms total / 22 ms cleanup. Nine historical failures, 18 pins, 22 current-unexecuted rows, 31 groups and prior Markdown tails remain.

## Source model and acceptance limit

Pre/post full-history traversal yields N squared visits for N new acknowledged fills: 57600 for 240; the planned 254 fill remains 64516. The planned 192 cycle commands remain 36864 visits and 64 STARTs add 12352. For a queued Discovery dedup row, recursive canonical entries 208→38 and node entries 24→3 are source-derived helper-entry counts. They exclude enclosing scans/catalog/authority/transport and do not measure speedup.

Every scalar and every history row remains processed. Catalog work, leaf operations, scans, hashes, locks and transport remain. **No wall-time speedup or complete CI success is promised.** Full-cap Rule latency and Production capacity/SLO remain unproved.

No local project/parser/test/SQL/native/build execution, installation, reconstruction or Git/hosted mutation occurred. Historical 64/64 author results are not reruns. Corrected R19 native/runtime/PASS fields remain false. Complete unchanged exact-head CI must prove all 31 groups, both R9 cases, quotas and cleanup inside 240s effects +60s cleanup/300s total.

**AUTHOR STOP.** Root exclusively reviews, publishes and decides TL PASS/Ready/merge. No follow-up slice or activation. Method NOT_APPROVED, #1139/17 gaps, #917 refusal, #1131, both #1135 holds, #968 and #911/#913 remain.

---

## Historical R18 and earlier author self-reviews

The exact previous records follow unchanged. Their headings and execution statements do not grant R19 acceptance.

# M04 Phase-B author self-review V1 — R18 current

**R18 SAME GENERATION2 / SAME SESSION. AUTHOR SELF-REVIEW IS NOT TECHNICAL-LEAD ACCEPTANCE.**

[Root dispatch and exact authorization](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6759595208) permits two local SQL computation reuses, meaningful native regressions, bounded quota progress and four author files. Baseline: `1d8eeddd8e2da9341f659f2b024e653c5ba5d310`, tree `224d89c68fbc665c39298b9c16bede277f87596f`.

## Source equivalence

command_v1 never changes input v between its original canonical calls. It now rejects SQL NULL explicitly with the original P7601/m04 invalid command outcome, computes the same canonical text once, checks the same 65536-byte limit and uses that same text/hash preimage at return. Existing shape/identity/domain checks remain. The canonical helper's depth, ASCII-key/string and numeric checks are untouched; node validation remains separately in wire_v1.

transition_v1 sets internal kind to deduplicated only when an enqueue retains an already valid queued/leased/backoff job. That branch assigns n:=expected after job_v1 has fully validated current_record, and does not subsequently alter n. Skipping only the second validation of this identical local value preserves its validation result. IS DISTINCT FROM keeps job_v1 for all other or NULL kinds. Final supplied-next equality, audit, deadline, fence and command/identity guards remain exactly present.

There is no cross-call cache, trusted caller bit, history-row exclusion, new SQL helper, signature, catalog object, grant or owner change. All other SQL function bodies and rollback remain unchanged. Every retained history row is still processed.

## Meaningful regressions

N02 tests real command_v1 output for Rule and Discovery against the existing canonical text/key/value. An anonymous DO asserts the original SQL-NULL error and the byte-size error for each kind. Oversized ASCII padding passes canonicalization but exceeds the command bound; if that bound were removed, the different invalid-enqueue message would fail the oracle. Unexpected errors rethrow. JSON-null separately rejects. Fixed internal messages are compared inside SQL without exposing raw errors or creating catalog objects.

N03 uses Rule age 68 and coherent Discovery CH → SE; neither subject is otherwise used in the baseline source. Actual fixed absent probes precede first writes. Both obtain real initial and dedup commits, and retained history has exactly two commands. The malformed-prior negative makes current_record, commit.expected and commit.next the same malformed queued job, so unrelated equality guards cannot mask missing prior validation. The forged-next negative first proves its distinct next record is structurally valid, then requires real fixed rejection and unchanged persisted state. Pure transition checks never populate positive journals.

Pre-publication P2 review caught that provisional Rule age 61 overlaps unchanged R9's computed helper range 61-63/65-67 (R9 main cases 60/64). The new N03 case now uses age 68; explicit and computed contexts were checked, and R9 remains byte-identical. This was a source-review isolation correction, not an observed CI failure.

## Bounded diagnostics and preserved execution

Two constant-size records describe ledger fill and start cycles. Finite boundary labels and zero-based last started/completed indices accompany started/resolved command construction and fixed calls, command commits and START reservations. Successful resolution is separate from commit/reservation; the expected rejected pointer probe counts as started only.

Elapsed values are rounded aggregate client-await durations, capped at 300000 ms. They separate commandRequest work from fixed-call awaits including transport; they are not server CPU or individual-statement profiling. Wrapper finally blocks record elapsed values without changing replies/errors. No per-row trace, payload/token serialization, timer, resource or deadline is added.

Every 254-command fill, original claim 255 and terminal credit, real START, interstitial refusal, exact-token/fence terminal Fail 256, exhausted state, cleared credit and beyond-cap refusal remains. All 64 real enqueue/claim/START/fail cycles, 65th enqueue/refused claim, 193 commands/64 starts/64 dispositions and pointer-corruption/refusal/restoration remain. The original ownership/cleanup, authority/catalog/history checks and all 31 groups/R9 cases remain mandatory.

## Frozen pins

| Source | Bytes | SHA256 | Git blob |
| --- | ---: | --- | --- |
| jobs-candidate.sql | 136035 | `520e9b3435676ce38eb8312b22a2935f8449afbf4c9d31d36a7bf7d92382d984` | `8202f4a667f0953e01364cfffcc4507747bc24f4` |
| native.ts | 151886 | `9eb7de5270d0beffbfa2da1f38ef0478aca4858b98268f010eb65054f69643a5` | `55c4e57472efefd87d09065495e137e08fb88a24` |

Eighteen-source aggregate: `166f8b79e2a4b564b17a835e44cd0f5294ea80ce7ca005d8c3bfda32775d6859`. Sixteen other source pins and all protected helpers, rollback, roles/grants, workflow/package and time/resource limits remain unchanged. Three SQL replacements in two functions and six native replacements; no local execution.

## Independently fetched historical evidence

[Repository verification 129638063982](https://github.com/Jetnity/jetnity/actions/runs/42758402735/job/129638063982): full non-Auth log **4249970 bytes / 63142 lines**, SHA256 `c1fb0d06b046fd1658caedb0a1d3f132c714bbf5d319cb7a9586e1f7a02f2247`. Terminal metadata confirms failed run/aggregate 129644016381 and six successful companions. Typecheck/lint passed; tests failed; hygiene/build skipped.

First 23 groups passed again, including N07/R4 (783 ms), full N08 and both R9 cases (combined group 12673 ms). Real SQL-wait observations, backend-absent retained executor cleanup, unavailable→invalid admission and no terminal effects are historical exact-head receipts. Natural I1 fail-confirm and explicit worker caller abort remain distinct; no elapsed 30-second worker timer is claimed.

N05/A03 then exceeded the 240-second effect budget after 154781.596676 ms; failed iteration and per-function cost are unknown. Seven later groups were not reached. Core: 8682 tests / 8678 passed / 2 failed / 2 skipped / 0 cancelled, 642911.28969 ms. Cleanup: 26975/26975 settled, zero pending, 4242/4242 closed, one stopped cluster, zero children/errors; 240354 ms total / 35 ms cleanup. Eight histories, eighteen pins, twenty-two matrix rows and thirty-one obligations remain. Overall nativePass is false.

## Limits and STOP

**No measured or promised speedup or full CI success.** Source analysis establishes only the removal of repeated pure computation within a call. Whole-history work remains; full-cap Rule latency and Production capacity/SLO approval remain unproved.

No local project/parser/SQL/native/build execution, installation or checkout reconstruction occurred. Prior 64/64 author results remain historical; corrected R18 source has not run. Full unchanged exact-head CI must reprove every group and both R9 witnesses inside the original budgets.

**AUTHOR STOP.** Root alone reviews, publishes and decides TL PASS/Ready/merge. No hosted action or follow-up slice. Method NOT_APPROVED, #1139/17 gaps, #917 specific refusal, #1131, both #1135 holds, #968 and #911/#913 remain.

---

## Historical R17 and earlier author self-reviews

The exact previous records follow unchanged. Their source claims and headings remain historical and do not grant R18 acceptance.

# M04 Phase-B author self-review V1 — R17 current

**R17 SAME GENERATION2 / SAME SESSION. AUTHOR SELF-REVIEW IS NOT TECHNICAL-LEAD ACCEPTANCE.**

[Diagnosis](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6759048050) preceded edits. [Root authorization](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6759160977) permits only the two native quota blocks and four author files. Baseline: `69f4dcc78e8670099fb5997f825edf1027956b33`.

## Diagnosis and equivalent shared-cap coverage

The failed run reached the unchanged 240-second effect deadline during N05/A03. It does not identify the failing iteration or per-function/statement times. Source shows complete history validation before and after each successful command. A completed 254-command fill entails 64516 historical transitions; the following 192 commands entail 36864, plus 12352 from 64 starts. These are full-loop control-flow counts, not measured costs.

The frozen Plan N05/A03 requires actual cap and full-history witnesses without prescribing a Rule-only subject. Shared SQL subject/count/credit/unknown/START/CAS predicates do not branch on Rule versus Discovery. Discovery identity/job validation still runs completely; locks, catalog and final MA1 proof remain. commandRequest selects the unchanged Discovery coordinator through the actual command kind/job-key namespace.

The two blocks now use coherent contexts from originals.context('CH','IS') and originals.context('CH','NO'). Explicit key assertions distinguish the quota subjects and prior CH-to-AQ; actual fixed absent probes precede their first writes. Enqueue kind/input, claims and every state/fence/job locator consistently use Discovery.

No journal row is manufactured or removed. The 254/255/256 original-credit proof and all 64 real enqueue/claim/START/fail cycles, refused 65th claim, 193 retained commands/64 starts/64 dispositions and pointer-corruption/restoration proof remain. Neither quota block previously consumed S1; all existing actual Rule/S1/I1 and Discovery/S1 groups are unchanged.

## Frozen source and scope

native.ts: **142485 bytes**, SHA256 `2e757ad2a3242e3881eba5b498c595a2447846157e3de698d17dd356d499375a`, Git blob `20247c75ed2dd9c834304429c138054383913b1f`.

Eighteen-source aggregate: `57169eb6ccf365164c1a334eee57bb887640c11e2342dd03d109c5444d999fc0`. All seventeen other source pins, SQL/rollback, helpers, roles/grants, packages/workflows and budgets remain unchanged. Two exact bounded block replacements; 31 groups and both R9 cases retained. No profiling instrumentation added.

## Independently fetched historical evidence

[Repository verification 129625959864](https://github.com/Jetnity/jetnity/actions/runs/42754606380/job/129625959864): full non-Auth log **4250048 bytes / 63143 lines**, SHA256 `9ed6f37a9c2685c9e9b86e64493b4beb93e167a42e5f0da510b6f13ff108f64b`. Terminal metadata confirms run failure, six successful companions and failed aggregate 129630534969. Typecheck/lint passed; tests failed; hygiene/build skipped.

First 23 groups passed, including R16 N07/R4 (812 ms), full N08 and both R9 witnesses (combined group 13075 ms). Actual R9 receipts distinguish real SQL waits from backend-absent retained executor cleanup, preserve the same executor until drain, show unavailable→invalid slot admission with the other three methods held, and record no terminal effects. I1 fail-confirm was observed; explicit worker caller abort is not an elapsed 30-second timer proof.

N05/A03 then timed out after 149149.71633 ms; seven later groups were not reached. Core: 8682 tests / 8678 passed / 2 failed / 2 skipped / 0 cancelled, 655018.2848 ms. Cleanup: 26653/26653 settled, 0 pending, 4242/4242 closed, one stopped cluster, 0 children/errors; 240314 ms total / 20 ms cleanup. All seven histories, 18 pins, 22 rows and 31 groups remain. Historical R9 success is bound to exact 69f4dcc; overall nativePass remains false.

## Limits and STOP

**This is a shared-cap fixture correction, not a runtime optimization, full-cap Rule latency proof or Production capacity/SLO approval.** Repeated Rule-context validation at full caps is no longer the workload of these two groups; quadratic Rule history cost remains unchanged. No measured speedup or new CI success is asserted.

No local project/parser/SQL/native/build execution, installation or checkout reconstruction occurred. Prior 64/64 author checks remain historical; corrected R17 source has not run. The complete unchanged CI must reprove all groups and both R9 cases on the published new head.

**AUTHOR STOP FOR ROOT REVIEW.** Root alone publishes and accepts. No Ready, merge or next slice. Protected-source, resource, hosted and Owner gates remain; #917 is not retried or substituted.

---

## Historical R16 and earlier author self-reviews

The exact previous record follows. Its former current claims and pins are historical; this R17 block governs the new delivery.

# M04 Phase-B author self-review V1 — R16 current

**R16 SAME GENERATION2 / SAME SESSION. AUTHOR SELF-REVIEW IS NOT TECHNICAL-LEAD ACCEPTANCE.**

[Diagnosis](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6758625887) was completed before edits; [Root authorization](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6758675083) then allowed only the finite N07/R4 native fixture correction and four author files. Baseline: `07367f7ce4f811dabb43ba340650fab3f77585e5`.

## Confirmed boundary mismatch

[Protected quarantine-postgres.ts](https://github.com/Jetnity/jetnity/blob/07367f7ce4f811dabb43ba340650fab3f77585e5/lib/readiness/official-truth-product-v3/storage/quarantine-postgres.ts), blob `3746b98623bc93d72abfe1cba8c8ebef42d0f34e`, decodes raw reference/text/outcome/audit into application reference/text/upload/completion. [intake-server.ts](https://github.com/Jetnity/jetnity/blob/07367f7ce4f811dabb43ba340650fab3f77585e5/lib/readiness/official-truth-product-v3/storage/intake-server.ts), blob `0605decae43995be0fd0a5183a501067e8a03685`, exposes that backend read as store.open.

The positive fixture serialized this application DTO into consume_s1_v1, whose exact-key entry gate requires the raw shape. That source path necessarily rejects before archive checks. The P7604 log does not itself identify the statement, revision case or predicate. The SQL guard is correct and unchanged; archive.method remains an intentional unknown-field negative.

## Source correction and retained proof

After actual S1 capture/reserve/finish/open, the test requires completion and reads the actual raw reply through the existing private S1 bridge. Its full envelope must exactly equal the decoded reference/text/completion counterpart. Only this actual database reply is consumed positively and cloned for mutations.

The old application DTO is now an explicit P7604 negative per case. Positive assert.doesNotReject reports only bounded case index and method revision. Both revision cases, four original negatives and the final immutable store.open comparison remain. No protected wire/errors or SQL validation change; one raw read and one explicit negative are added per existing case, without new connections or budget changes.

Frozen native: **141437 bytes**, SHA256 `1e25514e6baecf7e0c38d0cdbdbbaaa14f38a11b9693149b76a97bc0b56932a5`, Git blob `732ec5389e26cc1f09c32626117588d23384e0d3`. Aggregate: `fd829dbf93171d8bc2d352cd02aa92126e8ee8ab64ac2fc0392d4863f63fb19e`. All seventeen other source pins remain unchanged.

## Evidence and remaining acceptance

I independently fetched [Repository verification 129615553280](https://github.com/Jetnity/jetnity/actions/runs/42751380067/job/129615553280). Full non-Auth log: **4240386 bytes**, SHA256 `0b9d3b2907e8f32c5e5f80c5a4562b25ad4187d29eea1965a309caa362ae7f6b`. Terminal metadata confirms run failure, six successful companions and failed aggregate 129620812719; typecheck/lint passed, hygiene/build skipped.

Historical first N01/N02/N03/N07 passed in 42/2227/2728/12322 ms, including R15's three variants. N07/R4 failed P7604; 26 later groups and R9 were not reached. Core: 8663 tests / 8659 passed / 2 failed / 2 skipped / 0 cancelled. Cleanup: 4576/4576 settled, 0 pending, 870/870 closed, one cluster stopped, 0 errors; 18928 ms total / 169 ms cleanup.

All six failed histories and complete 18-pin/22-row/31-group inventory remain. No local project execution, parser, SQL/native run, installation or environment reconstruction occurred. Previous 64/64 checks remain historical; corrected R16 source has not run.

**AUTHOR STOP FOR ROOT REVIEW.** Root alone publishes and accepts after new exact-head unchanged CI. No Ready, merge or automatic next slice. Protected-source, resource, hosted and Owner gates remain; #917 is not retried or substituted.

---

## Historical R15 and earlier author self-reviews

The exact previous record follows. Its former current claims and pins are historical; this R16 block governs the new delivery.

# M04 Phase-B author self-review V1 — R15 current

**R15 SAME GENERATION2 / SAME SESSION. SOURCE REVIEW IS NOT TECHNICAL-LEAD ACCEPTANCE.**

[Dispatch](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6758201727) resumes `/root/m04_durable_jobs_writer_g2` from `30c6299a76fda7b50493a46596a57af3777a7372`.

## Source-confirmed cause and bounded correction

The native stack identifies parsed.ok at 662:61. The [originals context builder](https://github.com/Jetnity/jetnity/blob/30c6299a76fda7b50493a46596a57af3777a7372/lib/readiness/official-truth-product-v3/integration/test-support/originals.ts) sets citizenship, passport issuer and related citizenship together. The old N07 code changed only citizenship to DE/FR, leaving the passport link at CH. The [protected S0 refinement](https://github.com/Jetnity/jetnity/blob/30c6299a76fda7b50493a46596a57af3777a7372/lib/readiness/official-truth-product-v3/contract.ts) correctly rejects that inconsistency. The CI log does not separately identify the loop index.

The correction uses the existing coherent builder with the same destination, then applies the common age 18 condition. Both original DE/FR inconsistencies remain explicit negative assertions. Parsed contexts must validate; actual contextKey and jobKey sets must each have cardinality three. No protected reader, fixture source, schema or permission changes.

All three number spellings remain in the same loop. The real producer, S1/I1/MA1 path, exact original-byte comparison, prepared outcome, completed durable disposition and succeeded state body is byte-identical. All seventeen other sources are unchanged.

Frozen native: **140353 bytes**, SHA256 `a1e16286e9114b9a07271ddf4b9879f0714ad15295212dfe7016c157c2685dea`; aggregate `a21b19390e4e1b3d49022cb7a86848568c4439eff3c39e4963131331e93d1da0`. Root and the read-only reviewer independently reconstructed both unique hunks and matched this pin. No execution or acceptance is implied.

## Actual evidence and remaining proof

I independently fetched [Repository verification 129607034059](https://github.com/Jetnity/jetnity/actions/runs/42748744481/job/129607034059). Full non-Auth log SHA256: `ee6012947a9e9faf770af914c21847274609d25ee588a8ebc12e12a612d65e0f`. Final metadata confirms run failure, six successful companions and failed aggregate 129611926295; typecheck/lint passed and hygiene/build were skipped.

Receipt: first N01/N02/N03 passed in 23/1134/1532 ms; N07 assertion failed; 27 later groups and R9 not reached. The completed N02 group includes R13/R14. This does not complete M04 or all compound coverage rows.

Core: 8662/8658 passed/2 failed/2 skipped/0 cancelled. Cleanup: 2297/2297 settled, zero pending, 426/426 closed, one stopped cluster, zero errors; 5954 ms total and 155 ms cleanup. All five failed histories and the complete 22-row/31-group inventory remain.

Original checkout absent despite reachable shell. No repository reconstruction, install or local project execution occurred. Previous 64/64 results remain historical. The corrected R15 source has not run; complete unchanged CI is mandatory.

**AUTHOR STOP FOR ROOT REVIEW.** Root alone publishes and accepts. No Ready, merge or next slice. Existing protected-source, resource, hosted and Owner gates remain; #917 is not retried or substituted.

---

## Historical R14 and earlier author self-reviews

The exact earlier record follows. Its former current claims are historical; this R15 block governs the new delivery.

# M04 Phase-B author self-review V1 — R14 current

**R14 SAME GENERATION2 / SAME SESSION. AUTHOR SELF-REVIEW IS NOT TECHNICAL-LEAD ACCEPTANCE.**

[Dispatch](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6757910444) resumes `/root/m04_durable_jobs_writer_g2` against `313c1db0d96d62f94f22c5db94c74bb75779f542`.

## Cause and source-only correction

The exact CI stack identifies `assert.ok(alternate)` at native.ts:617:14. [The strict identity reader](https://github.com/Jetnity/jetnity/blob/313c1db0d96d62f94f22c5db94c74bb75779f542/lib/readiness/official-truth-product-v3/jobs/contract.ts) permits only context/method/factKind/researchReason. The failing spread additionally includes operationId/jobId/attemptLimit; returning null is correct.

The old bad shape is retained as an explicit rejection assertion. A separate four-field alternate uses contextFor(60) and the valid method/factKind/researchReason, then requires non-null and distinct jobKey/subjectText. The real wrong-subject SQL P7601, forged-command P7601, epoch P7504 and state-equality checks are untouched. No reader relaxation, removed negative case, skip or substituted persistence assertion.

Only native.ts changes: 139506 bytes, SHA256 `5cf0852b7ad101d6fa0a1d792c88657df9bb1d35a32d2bf7e2b4bd3765219921`; aggregate `23f9a54835534afe9a8ca9be5a1aa51c37c5e7ae1e90b15f9b5e014b0cc51e5f`. Seventeen other source pins, including SQL/rollback, remain unchanged. Root and the read-only reviewer independently reconstructed the exact source bytes and found no additional blocker in this finite correction; this is source review only.

## Execution truth

I independently fetched [Repository job 129599589985](https://github.com/Jetnity/jetnity/actions/runs/42746442139/job/129599589985). Full non-Auth log SHA256: `cd8fe512ca2409cdaa4a48019a6f6a15b466fa54bc7d39659c78b388884f8a33`. Run/jobs metadata subsequently confirmed terminal failure, six successful companion jobs and failed aggregate 129604596107. Typecheck/lint succeeded; tests failed; hygiene/build were skipped.

The native receipt contains N01 only (28 ms), N02 assertion failure, no R9 witness and nativePass:false. Cleanup: 587/587 settled, 90/90 closed, one stopped cluster, zero errors; 2569 ms total / 162 ms cleanup. Core: 8660 tests / 8656 passed / 2 failed / 2 skipped / 0 cancelled.

Earlier R13 checks completed by inference from sequential arrival at line 617; there are no per-assertion receipts. This does not establish N02 completion or broader native acceptance. All four failed CI histories and all 22/31 coverage obligations are retained.

The environment is **UNAVAILABLE**. No new local SQL/parser/test/typecheck/lint/native/build execution occurred. Historical 64/64 checks do not validate this native-source change. A new exact-head unchanged complete CI remains mandatory.

**AUTHOR STOP FOR ROOT REVIEW.** No publication, Ready, merge or automatic next slice. All existing protected-source, resource, hosted and Owner gates remain; #917 is not retried or substituted.

---

## Historical R13 and earlier author self-reviews

The exact prior record follows. Its old current claims and pins are historical; the R14 block above governs this delivery.

# M04 Phase-B author self-review V1 — R13 current

**R13 SAME GENERATION2 / SAME SESSION. SOURCE CORRECTION PREPARED; NEW NATIVE CI PENDING.** Author self-review is not Technical-Lead acceptance.

Author/session: **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation2**, `/root/m04_durable_jobs_writer_g2`. [Dispatch](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6757521662), baseline `82b116fbb4c6f001f72e60459e83965edcaf8302`.

## Cause, identity protection and scope

Actual [CI42742925010](https://github.com/Jetnity/jetnity/actions/runs/42742925010) installed the R12 candidate and passed N01, then failed `proof_2:N02` with SQLSTATE42501. It proves that phase and error, not an exact SQL location. Source inspection identifies `assert_catalog_v1`'s predecessor `to_regprocedure` lookup under the existing postgres definer. This restricted role has no S1 private/API USAGE.

Primary PostgreSQL16 sources were independently read through GitHub:

- [regproc.c](https://github.com/postgres/postgres/blob/REL_16_STABLE/src/backend/utils/adt/regproc.c), blob `296930eb3bca7ae56162ad9f3acfcd271c82db4f`: to_regprocedure calls regprocedurein and FuncnameGetCandidates.
- [namespace.c](https://github.com/postgres/postgres/blob/REL_16_STABLE/src/backend/catalog/namespace.c), blob `4449f867413eebd65e529fce54cf756fb57cf3ff`: explicit namespace lookup checks ACL_USAGE and raises the privilege error.
- [ruleutils.c](https://github.com/postgres/postgres/blob/REL_16_STABLE/src/backend/utils/adt/ruleutils.c), blob `5fd68ab48b4e4eceaec598124cd67605b6eeeeb1`: pg_get_functiondef resolves PROCOID and always emits the qualified namespace/name and arguments.

Only the pg_proc predicate changes to the stored fingerprint OID. Every existing fingerprint component remains compared. A rename/signature/schema change alters the definition hash; removal of the pinned OID produces a missing actual fingerprint and refuses. No new grants, role/owner changes, protected code edits, connections or budget increase are introduced. Other to_regprocedure sites are installer-only; parsed bridges remain unchanged.

## Prepared regression and independent-review correction

N02 now checks all four absent S1 schema privileges, succeeds through the actual restricted runtime, renames the disposable pinned binding_valid_v1 while verifying its OID is unchanged, and requires P7603. That function is not a direct parsed bridge target. Finally restores the original name; the normal path then requires exact full-catalog equality and another successful runtime probe. No protected source file is changed by this disposable-fixture test.

Root caught a pre-publication assertion mistake: boolean::text produces the strings `true`/`false`, so all four expected values are now `false`. Earlier proposed native pins were superseded and never executed or published. The delivered native pin is `5b586cb8291caeb954f6afffb80d82a1666c9050e209e1df3bf0f81dc169f87c` (138948bytes); SQL is `a22e6a015c8fc5a268500659ace31a938d2ce3614625e9df1982308b73199a59` (135947bytes). Aggregate: `5d33e2eef75e612b650bae2f2eb5ea0062918d1b7005ea2e2eb9bfba76b131f1`.

## Executed evidence versus remaining gates

The failed82b receipt reports N01 only, no R9 witnesses, nativePass:false,551/551 settled operations,90/90 closed cumulative connections, one stopped cluster,0 cleanup failures and3020ms total. Core8660/8656pass/2fail/2skip/0cancel. The d9 and7ac failures remain in historicalCIRuns.

The environment is **UNAVAILABLE**. No new local or native execution, parser, typecheck, lint or build was attempted. Earlier64/64 unit and static results are historical; native.ts changes in R13. These new assertions and the SQL fix need new exact-head unchanged CI. Source inspection and primary-source reading are not execution.

**AUTHOR STOP FOR ROOT REVIEW.** Root owns final acceptance, Task V4, publication, complete native re-gating and live exact-head review. No Ready/merge or automatic next slice. Method NOT_APPROVED; #1139 NOT_RELEASE_READY/17 gaps; #917 refusal and all other existing Owner gates remain.

---

## Historical R12 and earlier author self-reviews

The exact previous record follows. Its former current claims and pins are historical; the R13 block above governs this delivery.

# M04 Phase-B author self-review V1

**R12 SAME GENERATION2 / SAME SESSION — SOURCE CORRECTION ONLY; NEW NATIVE CI PENDING.** This is author self-review, not Technical-Lead acceptance.

Author/session: **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation2**, `/root/m04_durable_jobs_writer_g2`. [R12 dispatch](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6757102845) follows failed published head `7ac9c4bc3f284775e5236d5d862e90fabbf2822b`.

## R12 grammar finding and minimal correction

The actual CI receipt reports jobs_candidate / SQLSTATE 42601, with zero native groups/R9 witnesses. Exact source reading identifies two unparenthesized SQL CASE expressions inside PL/pgSQL IF conditions: predecessor defaults (line 75) and queue-CAS quota (line 1020). PostgreSQL 16 `stmt_if` uses `expr_until_then`, which calls `read_sql_expression(K_THEN)`; `read_sql_construct` stops at THEN when parenthesis depth is zero. It tracks parentheses/brackets, not CASE nesting. Thus the inner CASE THEN prematurely terminates an incomplete IF expression. This is a source-derived diagnosis consistent with the real error; the receipt does not provide an exact error position.

Both CASE expressions now have parentheses. Four ASCII bytes are added; values, limits, branch logic and all remaining source bytes stay unchanged. No ACL expression, helper, predecessor or conflict setting changes. The briefly proposed extra-parenthesis issue at line 72 was withdrawn after exact-byte rereading; that valid line is unchanged.

Primary source: [PostgreSQL REL_16_STABLE pl_gram.y](https://github.com/postgres/postgres/blob/REL_16_STABLE/src/pl/plpgsql/src/pl_gram.y), blob `cd172ef2f8d6c792b0ee26f5162ced0c90694277`. A bounded token inspection found exactly two naked CASE-in-IF occurrences among 262 IF/ELSIF sites and zero after correction. This check is not a PostgreSQL parser and establishes no native runtime acceptance.

Corrected SQL: 135,966 bytes, SHA256 `ed8cf918bb595b6933d4517575d0b8bb6a583277302f5dcc83a6ccee150c123c`. New eighteen-source aggregate: **`c8062e47c23e11b1d7bfb1da66331ab779a11952c45651f492962d4ea6c9479a`**. Other seventeen source pins unchanged.

## Current evidence boundary and STOP

[CI 42739327115](https://github.com/Jetnity/jetnity/actions/runs/42739327115), job 129576216777: 8,658 core tests, 8,655 passed, one failed, two skipped. M04 failed candidate setup; nativePass:false, all 22 owned operations settled, both connections closed, one cluster stopped, cleanup failures zero. This is a failed historical run against the prior SQL bytes, not corrected-source proof.

The execution environment is unavailable. **No tests, typecheck, lint, SQL/parser/native execution or build ran for R12.** Previous 64/64 unit results and static checks remain historical evidence for unchanged TypeScript bytes; they do not validate this SQL correction. R9 code and assertions are unchanged, and their actual native execution is still open. The full proof map is retained below and in JSON with those limits explicit.

**STOP for Root independent review, new-head publication and unchanged CI.** No Ready, merge, activation, Git mutation/publication or automatic next slice. All existing Owner/hosted/#917 gates remain unchanged.

## Previous Generation2 self-review — historical snapshot before R12

The following text records the earlier reviewed source cut and offline checks. Its old aggregate and execution statements are historical and subordinate to the R12 boundary above.

**GENERATION2 AUTHOR SELF-REVIEW — INDEPENDENT ROOT REVIEW AND CURRENT NATIVE CI STILL REQUIRED.** Author statements are not Technical-Lead acceptance.

Author/session: **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation2**, `/root/m04_durable_jobs_writer_g2`. This is a new documented context-loss continuation of d9, not a claim to Generation1's old session. [Dispatch](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6756274057); [TaskV2](M04_RECOVERY_TASK_V2.md). Exact eighteen-source digest **`cc2e47f1afcec38ea749b1d3f88372a18ed01e14b2005501585e96dee4df1c3f`**; individual pins and check commands are in [source manifest](M04_PHASE_B_SOURCE_MANIFEST_V1.json).

## R9: what is now directly demonstrated

The two added full-factory protocol tests retain the actual nested S1 reserve executor under real M04/I1/worker control flow. In the natural I1 case, the unchanged5000ms facade deadline expires and a subsequent fail `queue_confirm` is observed while that executor is still pending. In the caller-abort case, cancellation propagates and the outward factory remains pending. Three other same-facade method calls retain the remaining lanes. A fifth invalid call is `unavailable` while all four are occupied and becomes `invalid` only after the original reserve is released and actually joined; the three other promises remain pending at both checks. No terminal fail/complete CAS, backoff state, finish or late native admission is observed. Every gate is released and each started promise is joined in finally.

An additional test directly invokes the existing exported `composeM04Invocation` with a real owned scope, actual standalone MA1 and an explicitly handwritten fixed-request protocol bridge. It observes the **raw integration result** `unconfirmed` while the same reserve remains pending, then separately observes `scope.drainNative()` and `scope.finish()` remain pending with one occupied lane. Releasing the reserve permits both to complete and releases the lane. This test does not measure private `authorityCore`, a separately held raw worker promise or a natural30000ms worker expiry. The full-factory tests retain actual private wiring coverage. No protected code or production debug API was introduced.

The native group uses exact S1 operation2 (`reserve_v1`), which is inside I1 and distinct from pre-I1 capture/read. A separate holder locks the real captured operation row; target PID, backend birth, blocking holder and relation must be observed before cancellation. It then keeps that same executor at its existing `beforeDrain` hook. Target/control backends are already closed there: the test explicitly queries their absence and separately asserts retained executor/context ownership. It never calls that retained context a live backend.

Three pre-enqueued independent work calls use the same outward facade. Each performs its actual native MA1 read and retains its original executor promise with the unchanged30s work budget; they cannot start a producer while held. They enter before the nested native cleanup gate because the adapter serializes cleanup. Both lane checks require these three still pending, eliminating accidental method expiry as the explanation. The natural case also observes fail-confirm; explicit caller cancellation is labelled separately and does not claim a separately observed raw native worker return. Before/after snapshots include exact S1 operations, reservations and completions plus full M04 state. The original nested call must be dispatched, drained and uncommitted; admissions/state remain unchanged after join. Cleanup releases and joins all calls in finally. **These native assertions have not executed for this cut.**

## R10/R11 and diagnostic correctness

All four double `set_config` queries now return unique column names. This repairs a concrete incompatibility with unchanged `pg-wire` duplicate-column rejection while preserving statement/call counts. Source tracing correlates the historical18-operation setup stop to the fixture-marker query; the historical AggregateError did not independently reveal the code. New fixture-only diagnostics emit a finite phase and bounded sanitized LocalPgError/SQLSTATE or fixed error kind, with at most eight causes and depth2. Raw exception messages/stacks, SQL and parameters are excluded. Cleanup assertion errors are collected before the receipt so nativePass cannot become true on terminal failure, and errors still propagate.

The new SQL candidate's two PL/pgSQL record aliases now have distinct names (`binding_row`, `function_row`), avoiding collision with catalog relation aliases. Protected SQL, decoder, runtime authority contract, `variable_conflict`, budgets and workflow remain unchanged. Installation, runtime catalog assertions and rollback require actual CI.

## Full frozen proof map

The machine-readable evidence contains all22 U01–U07/N01–N15 rows, exact test/group anchors, assertion descriptions and practical limits. The table below is a navigation map, not a claim that a source test name proves every proposed variant or that native persistence passed.

| ID | Requirement | Concrete test files or native groups | Evidence state |
|---|---|---|---|
| U01 | Closed contract, all seventeen predicate families, strict shape/numeric/JSON admission | contract.test.ts | Named offline suite PASS; protocol/source limit |
| U02 | Full identity and support stripping after actual S0 validation | contract.test.ts | Named offline suite PASS; protocol/source limit |
| U03 | Immutable command and original claim/replay binding | composition.test.ts, contract.test.ts, postgres.test.ts | Named offline suite PASS; protocol/source limit |
| U04 | Whole-original/whole-batch D01 admission and bounded wire | composition.test.ts, contract.test.ts | Named offline suite PASS; protocol/source limit |
| U05 | MA1 custody, monotone deadlines and closed private outward surface | authority.test.ts, composition.test.ts | Named offline suite PASS; protocol/source limit |
| U06 | Nested I1/worker race and actual owned drain/retired lane | composition.test.ts, owned-scope.test.ts | Named offline suite PASS; protocol/source limit |
| U07 | Uncertain I1 results cannot create known failure | composition.test.ts, owned-scope.test.ts | Named offline suite PASS; protocol/source limit |
| N01 | Exact fictional install and security/catalog inventory | N01, N01/N14/T02 | Source implemented; current native NOT RUN |
| N02 | Native canonical/direct-entry identity | N02, N02/U04 | Source implemented; current native NOT RUN |
| N03 | Durable commands, exact replay and dedup | N03 | Source implemented; current native NOT RUN |
| N04 | One original START winner, ACK uncertainty and restart | N04/N06, N04/N06/N10, N05/N09, N04/N10/N12 | Source implemented; current native NOT RUN |
| N05 | All older unknown and finite history/ledger caps | N05/N09, N05/A03, N05 | Source implemented; current native NOT RUN |
| N06 | Preflight/start contention and independent progress | N04/N06, N04/N06/N10 | Source implemented; current native NOT RUN |
| N07 | Actual Rule S1/I1/PREPARED/completion/E1 path | N07, N07/R4 | Source implemented; current native NOT RUN |
| N08 | Sixteen persisted originals and whole-batch admission | N08, N08/U04, N04/N10/N12 | Source implemented; current native NOT RUN |
| N09 | Fresh-process PREPARED/completed recovery and claim fidelity | N05/N09, N09 | Source implemented; current native NOT RUN |
| N10 | Known failure versus unknown callback/native outcome | N04/N06/N10, N10/U06, N04/N10/N12, N13, N05/A03 | Source implemented; current native NOT RUN |
| N11 | Real waits followed by final authority/clock | N11 | Source implemented; current native NOT RUN |
| N12 | Acquisition/cancellation/ACK and nested executor terminal ownership | N12, N04/N10/N12, N12/U06/R9, N12/R7-03 | Source implemented; current native NOT RUN |
| N13 | Legacy original preserved but ineligible for M04 preparation | N13 | Source implemented; current native NOT RUN |
| N14 | Creator defaults, prerequisite drift and actual dependencies | N14, N01/N14/T02 | Source implemented; current native NOT RUN |
| N15 | Guarded rollback with nonempty and concurrent late history | N15, N15/T02 | Source implemented; current native NOT RUN |

## Preserved implementation boundaries

The dormant factory still exposes only enqueueRule/enqueueDiscovery/workOnce; actual existing S0/S1/I1/M1/E1 composition and original-byte custody remain. Whole-batch D01 admission precedes the first S1 effect. Older unresolved starts remain blockers across identities/reasons/epochs; known failure still requires privately justified original custody and actual child terminality. The new candidate remains seven tables/twenty-nine functions/fourteen guards/seven policies with actual final S1/MA1 proof, fixed dependencies and guarded companion-first rollback. No source change in this continuation alters those runtime designs.

Only four of eighteen sources changed. All49 protected input paths equal d9, including the two previously allowed authority files. Frozen plan and historical V7 evidence remain historical and unmodified. Root owns current-main integration after concurrent PR#1180 and all global continuity documents. No author Git mutation or publication occurred.

## Executed checks and honest limits

The five named nonnative files passed **64/64**,0 failures/cancellations/skips,8102.282633ms. Focused sixteen-root TypeScript5.9.3 has0 diagnostics; ESLint has0 errors/warnings. Node24.22.1 differs from CI22. During authoring, one initial full-factory timeout witness intercepted an original remaining method read because its helper hold was armed before coordinator microtasks settled; the finite test sequencing was corrected. The added raw bridge initially needed its explicitly test-only nominal request type. Final frozen checks passed; neither interim test issue established a production ownership defect.

The historical d9 native run failed before all groups and is separately recorded. Current native SQL syntax/installation, transactions, catalog/ACL assertions, real waits/process restart, full budget and terminal cleanup remain unexecuted until unchanged GitHub CI. No local PostgreSQL, native SQL/socket, full test:core/build or package installation ran.

The240-call terminal test is actual generic queue, standalone MA1 and scope through a handwritten fixed bridge; it is not a private-authorityCore-at240 proof. Source-derived wire bound160772 is below262144, but its native entry/reply assertion is pending. Same-Held exclusion remains a reviewed private source boundary, with no test-only production export. Arbitrary hostile JavaScript is not sandboxed: code-owned SQL-incapable producer/evidence/history ports remain a design premise. Native group N08's uncertainty coverage uses a separate finish-ACK-loss witness; no distinct sixteenth-write-loss execution is claimed.

## Risk and disposition

P0/P1 prevention (authority, full identity/privacy, original uncertainty, atomicity and terminal lifetime) is implemented but still requires independent exact-source/native acceptance before release. This author delivery activates no production change. P2 conservative unknown/capacity refusal, unbound provider/scheduler operation, public-p95 and inherited dependency/operational gaps remain. P3 inherited presentation limitations stay outside scope.

**AUTHOR STOP FOR ROOT REVIEW; no Ready/merge/follow-up slice.** Root must decide R9/R10/R11 sufficiency, integrate latest main, publish a new head and independently inspect all new exact-head CI/Preview/Production/thread evidence. Method NOT_APPROVED; #1139 NOT_RELEASE_READY/17gaps; #917's refused readback is not retried/substituted. #1131, both #1135 holds, #968 and #911/#913 remain. No hosted DB/Auth/RLS/ACL/migration/credentials/Auth logs, provider/source research, scheduler, notification, cost or public activation.
