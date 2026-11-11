# M04 R33 — Technical Lead source review V24

**2026-11-10 21:47:13 UTC.** Exact input head **b1265b2bf8b8822d035bdf68023383242b670fba**, Draft#1183; main/merge-base **e7aae86c18238033c2186722e24c84dc7a5f69b9**. This is an independent pre-publication source review. **No new-head runtime PASS, TL-PASS, Ready or merge.**

## Problem and selected scope

R32 completed24/31 native groups and the full ledger boundary but failed during cycle17 at the unchanged240s budget. Root personally checked all eight final job metadata records and all seven permitted non-Auth logs; the independent CI auditor obtained identical full-log pins. Complete failure25, both actualR9receipts, unknown outstanding command outcome, fullcleanup and successful companions are preserved in the accompanying V24 JSON and [terminal receipt](https://github.com/Jetnity/jetnity/pull/1183#issuecomment-6779635862). Earlier failures and genuine successes remain distinct.

[Binding V24 v2](https://github.com/Jetnity/jetnity/pull/1183#issuecomment-6780021283) selects one SQL path and exactly two function bodies. Author **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation3**, actual session **/root/m04_durable_jobs_writer_g3**, read the amendment and delivered its exact source anew. Independent source reviewer **/root/m04_recovery_source_review_g3** reconstructed the same candidate and found no source-level blocker. Author self-review does not constitute TL-PASS.

## Exact content and scope

| Content | UTF-8 bytes | SHA256 |
|---|---:|---|
| R32 baseline SQL |146813|b4774a30188443162caec517543b7a6c8d6c90009882e5180c54b8c06384326a|
| R33 selected SQL |147856|e0bb8eded96ad53737228e1d4e824057abc2cadf73ee08267c3a9011aee02ae8|
| New object branch |2525|824f032c28a3f6e485de519500eb3675c14eaa5d7bf5aa5706e82e22adc403f6|
| Unchanged native |191098|f5d849c643ff22d264bc9adc1a7cd65f12caaac80a804647604851f22effbde0|

Candidate Git blob **6465147678a3024748f98ad151b63bc412ccc6c4**; full18source aggregate **d70a20d3b3881b56fb7274d3b30089e56e33081f2cb95deb7528b585540f4c76**. Author independently fetched and hashed all18 baseline files; all17 other files remain unchanged.

Root verified all five unique old/new anchors, exact whole-file inverse, all29 declaration/attribute pairs and27 unchanged function blocks. The canonical array/root-scalar suffix, standalone transition and later history loops remain byte-identical. The only existing copied transition statement changed by R33 is its byte-length expression, now using the same row's actual retained canonical text. The historical R32 proof of56copied-line identity remains historical, not a false current claim.

## Logical behavior and error order

The journal first checks the same four command identity fields. If any is TRUE, P7603 still precedes envelope canonicalization. Otherwise the same actual canonical function runs, its result is retained with explicit default collation, and the same canonical/audit comparisons run. FALSE/NULL combinations preserve PL/pgSQL IF behavior. No stored envelope text is substituted: a collation-sensitive equality alone would not justify a byte-length identity.

The new result is assigned on every reached row before use; earlier refusal/parse errors cannot reach the later length test. No trusted result crosses rows or calls. canonical_v1 is immutable, has no table/authority/clock reads and retains fixed search_path; the repeated computation therefore receives identical data and environment. All later quota, prior/next job, wait, transaction, S1 and final MA1 steps stay in place.

In the object canonicalizer, three ordered aggregates share the same unique-key C order and contain every input entry. Valid immediate scalar output is computed in SQL. Containers, non-ASCII keys/strings, invalid numeric values and depth refusals receive SQLNULL sentinels. The loop visits those slots in original ascending key order through the existing guard/recursive/fallback statements. This retains the first logical refusal; no invalid scalar is raised prematurely by the batch.

SQLNULL input still fails the unchanged top guard. Empty objects produce an empty parts array and return{} without accessing NULL key/value arrays. JSONnull is non-NULL text null, not a sentinel. Existing successful-object retention remains unchanged across scalar/array siblings, and its comparison stays exact C-text equality.

The number fast path is guarded by jsonb_typeof and directly copies the stored Numeric via jsonb::numeric. Integral/safe-integer bounds and truncation output are unchanged; refused numbers run through the original fallback. No floating-point conversion or new rounding occurs. Array and root scalar paths are unchanged.

SQLSTATE and explicit logical messages remain; **diagnostic PG_EXCEPTION_CONTEXT stack equality is not claimed**. Eager materialization can change resource-failure timing outside the bounded supported domain; that is disclosed below, not hidden as universal behavior equivalence.

## Primary-source and syntax review

Root independently read immutable [PostgreSQL16 source at c372fbbd8e911f2412b80a8c39d7079366565d67](https://github.com/postgres/postgres/tree/c372fbbd8e911f2412b80a8c39d7079366565d67). Exact blobs are recorded in the V24 JSON.

- array_userfuncs.c proves array_agg preservesNULL, returnsNULL on no input and creates one-based arrays; array_positions(NULLsearch) visits positions in order without text equality.
- jsonb.c proves jsonb_numeric copies the stored Numeric. The author also checked its cast registration.
- parse_collate.c and pl_comp.c establish noncollatable canonical inputs/default text locals; pg_locale.c documents default deterministic locale.
- optimizer/util/clauses.c preserves nonconstant OR argument order; executor/execExpr.c andexecExprInterp.c compile left-to-right, stop atTRUE and retainNULL behavior for this scalar expression.
- Existing pl_gram.y/pl_exec.c references support FOREACH/block syntax and variable semantics. The new SELECT/CASE expression is not an unparenthesized CASE inside a PL/pgSQL IF.

No SQL/parser/native code was executed locally. The existing CI must compile and run the published candidate. The preceding permitted CI log identifies PostgreSQL16.15 onUbuntu24.04; immutable source analysis is not execution.

## Complete-work model and practical limits

Within assert_history_v1, the complete two quota groups visit66557ledger queue rows plus49794cycle queue rows; cycle start-history adds16512rows and ledger5rows. Root independently derived queue traversal counts from the actual before/after-effect calls and independently crosschecked per-row canonical/key/container weights against the functions. Author and independent reviewer obtained the same totals.

| Source-derived work | R32 baseline | R33 model |
|---|---:|---:|
| Canonical entries within full history validation |3474354|2711699|
| Required object key visits after envelope reuse |18217843|12879779|
| Scalar PL iterations replaced by SQL evaluation |0|11185347|
| Remaining deferred container PL iterations |2406769 before reuse|1694432|
| nodes_v1 visits |533301|533301|

Envelope reuse removes762655 full canonical entries and5338064key visits. Object batching still evaluates every remaining scalar condition in SQL; it does not remove those checks. The counts cover all assert_history_v1 queue/current-job/start checks across both complete quota proofs. They exclude front-door/wire validation, execute_v1 pre-lock command/standalone-transition checks, raw_reply serialization, other per-call setup/authority/effect work and earlier/later proof groups. Those operations remain required and are not represented as zero. This is not a claim of total canonical calls for the entire two proofs. The detailed per-kind and Root crosscheck model is in the JSON.

History remains quadratic. No server profile, measured wall-time saving, Production SLO or guaranteed240s PASS is claimed. Compared with envelope reuse alone, this selected pair also reaches remaining command/job/subject/start serializations.

## Memory and countercosts

Three arrays, aggregate states/sorts, per-element Numeric copies, array_positions traversal, recursive frames and transient copies add work. Actual peak RSS and net timing remain unmeasured.

The existing API wire first limits text to262144bytes and validates depth24/nodes32768. Accepted job/context records have depth16/nodes8192/canonical65536 limits. Persisted command/claim/subject text is≤65536 and envelope text≤196608. No new limit or refusal is introduced.

For accepted canonical values with known sizeS/nodecountN, conservative accounting for the **three final array datums only** is3S+64N+256bytes. Under the wire/history domain it is below2.76MiB. This is not a backend peak bound. raw_reply has a later262144byte check without the adjacent32768-node condition; a looser syntax-basedN≤S+1 gives≤17563968bytes for those final datums, still not peakRSS. Arbitrarily large or malformed owner-only direct helper inputs do not have a proved identical OOM/resource-failure order.

Existing worst-valid node/wire and full native gates must execute successfully. The materialization risk is not waived by this source review.

## Existing coverage and explicit gap

Unchanged N02 contains fixed R19 scalar/key/order/escape/depth/NULL cases, R20 exact decimal/exponent/safe-integer cases, R21 string normalization, R26 repeated-object and later-invalid cases, and the complete subsequent key/calendar/time oracles. Both kinds and mixed histories, maximum valid wire/node groups and all31 native groups remain mandatory.

No new persisted-envelope corruption fixture was added. The previous dedicated malformed-persisted-envelope negative-oracle gap remains explicit. No replication-role change, trigger bypass, fixture/native/workflow/guard/package change, budget relaxation or unchanged-head rerun is authorized.

## Publication and acceptance decision

**Source-only suitable for bounded publication**, subject to complete immutable10file/18source/fulltree/diff readback and fresh Root live gates. Exactly one source plus nine continuity paths; all historical files, outside-marker bytes and36parallel#1181leaves remain unchanged.

Every new head needs all8CIjobs/31groups,full254/255/256and64/65,inherited761/minOwned4182,bothactualR9,rollback/late-writer,drainedcleanup,mountedLifecycle,fullCore,fivehygiene,Build and exactPreview. Only Root may later Ready/expected-headmerge after genuine independentPASS. Actual new main must separately pass fullCI/native and Production via bothaliases.

SQLUNAPPLIED;MethodNOT_APPROVED;#1139NOT_RELEASE_READY/17gaps,#1131ReadySTOP,both#1135holds,target#968isolation,#911/#913privacy,#917UNKNOWN/Stage2NOT_ATTEMPTED without any retry/substitute;D1#1169separately unfinished. All local/hosted/Auth/provider/credential execution stops remain. The mandatory separate8-path documentation closure remainsHELD until corrected actual-mainPASS, then needs its own fullgates. Final receipts remain on existingPR/#751. No automatic following slice.
