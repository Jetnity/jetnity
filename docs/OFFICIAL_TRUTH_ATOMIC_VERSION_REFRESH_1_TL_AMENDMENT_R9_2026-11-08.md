# Official Truth Atomic Version Refresh 1 — TL Amendment R9

Date: 2026-11-08 UTC
Status: explicit immediate CHANGES REQUIRED correction; same task #1152 and Draft PR #1154; same author/session; no new product slice

## 1. Authority and exact starting point

Only Root Technical Lead decides PASS, Ready and merge. The assigned author remains **Jetnity Official Truth Atomic Version Refresh 1 — Codex Generation 1**, actual session **/root/atomic_version_refresh_writer**. Cursor stays paused. Return/STOP after one complete immutable delivery.

The original TASK and R1–R8/R6A remain immutable. This R9 explicitly supersedes only R8's membership-only and frozen-traversal-representation limits for the narrowly selected change below. All semantic checks, ordering, bounds, outer reproofs and other prohibitions remain binding.

Current failed R8 implementation Head: **97ecd946bec8797844080b42de9fc5033858e8d8**; Tree **a049354dc0330de6f5d934c4472aeecf0faa13b5**. Actual main is **ddb36b2b6a5bd67afa4249028f57a1ea318ec7d8**, Tree **dccde88ac41710aea5ccf43482b11af9b34d82fa**. There is no Main POST-MERGE PASS. Use the complete Final11 snapshot as the author baseline, not Final10 or an older partial file.

Root failed-run receipt: https://github.com/Jetnity/jetnity/pull/1154#issuecomment-6715007390
Run 42427653304, attempt1: https://github.com/Jetnity/jetnity/actions/runs/42427653304
Refresh job128569303082; strict aggregate128573104192 both FAILURE. Actual checkout6ccd29236fcdf28b97864f0cd377da53f2bf279e has exactly the R8 tree and parents main ddb36b2… / head97ecd94….

Pinned R8 files:
- semantic-v2.sql blob **13bb5d01b3fff02e516a50c36878d95e3f65f766**, SHA256 **f1e610c259f91b4e429b376f13f6b6a7068da2467ea8da1d607b87cee5c7c2af**.
- native.test.ts blob **0632690ca790ba14e38fd974fd5e0d1ab9914c74**.
- test-lifetime.ts blob **dfafa09b6bac17561f42f76ab15646656f84bf20**.
- fixtures.ts blob **1944d04fa77d2818467c735a72afca1e4d05b5de**.
- Unit-test file blob **424a28dd378d68f1e47f561815791d3a477caf97**.
- Handoff blob **fac7bfd3c4793811605ec9876e5e40ae43b979a4**.
- R8 task blob **4b0b400dcb9464958a78dec83e14b0efffc9e551**.
Final11 manifest SHA256 **b9aee5b2c66ff0e8bbb355ae1ec0411e99cfa9ad2e5f25cffbea559c1fee8d51**.

## 2. What the completed original actually proves

Root and independent reviewers read the completed originals. Refresh timed out at **900260.587411 ms**; final TAP total900935.196282ms, pass0/fail0/cancelled1, regular step exit1. Its126 diagnostics are the exact expected prefix of130. Last complete terminal marker850851ms; only49149ms remained for reader_after_bound and final cleanup/matrix completion.

The new actual Abort probe passed: pending SQL and held connection hook observed, two Actors settled, three own backends gone,11/11 operations settled,0pending,3/3connections closed,1cluster stopped, no next scenario/cluster, **239ms abort cleanup**. This does not replace the missing final disposal proof for the later timed-out Parent. No provider events after the timeout and no explicit orphan termination lines are visible; neither a leaked orphan nor complete Parent cleanup can be inferred.

All8 original reference/current probes,14 negative pairs,99 role denials per mode,2 actual count256 SQL refusals, both publisher coexistence probes,30 direct negative statements and complete rollback markers, all3 Corrupt-Old cases, all3 Guards, all3 R6 cases, actual Race and first3 terminal cases completed.
- Primary positive SQL13547.465ms /11452.535ms reserve.
- Composed15381.528ms /9618.472ms reserve.
- Race13558.517ms /11441.483ms reserve.
- R6 ends618483ms; Race cleanup664375ms; terminal completions714236/764569/850851ms.
- Current graphworker self **521.754–631.701ms** per probe, total528.536–641.255ms, about41–47% of current full probe time. artifact_v2 total461.889–583.975ms. Individual inner-statement costs and a future speedup are not measured.
- Primary section292233ms, Composed84485ms, Corrupt-Old111707ms, Guards23374ms, R682577ms, Race45892ms, three finished terminals186476ms. Do not double-add included oracle/negative statement times.
- JIT on/off1297/1308ms does not show a useful gain.

Core8197/8195/0/2 with unchanged old TAP inventory plus3 tests, full isolation/hygiene/build; Persisted95diagnostics/45reads; Auth55values/243keys; exact-head Preview all succeeded. These remain evidence for R8 only. Every changed Head needs fresh gates.

## 3. TL-selected implementation: local container representation only

Change only the existing private **validate_inspected_graph_v2** worker's local adjacency and FIFO representation. Do not alter its signature, attributes, ownership, ACLs, external callers or validation algorithm.

### A. Build each adjacency value locally

Keep the original per-artifact key calculation and initial **graph := graph || jsonb_build_object(key, empty-array)** in place. Its early NULL-key error and relative error order are part of the baseline.

After the unchanged inspected-edges array check, collect that artifact's targets into a fresh local adjacency value in the exact original FOR-edge order. Keep each original edge-count increment, membership check, bigint cast, expected-type comparison and target-string construction unchanged and in the same order. After that artifact's edges are checked, set its complete adjacency into graph once, instead of rebuilding the complete graph for every edge. Empty adjacency, duplicate edges and any original key-collision behavior remain unchanged. This is a representation change, not deduplication or graph normalization.

### B. Preserve the FIFO algorithm using a local PostgreSQL array

Keep original starts construction/root order/root depths and every pre-traversal check. Replace the JSONB work array plus delete-index-zero/whole-array-concat operations with a one-dimensional local **jsonb[]** and explicit head/tail cursors.

Maintain this invariant at each loop boundary: the old JSONB pending work equals the ordered suffix of nonconsumed native-array slots from head through tail, item for item. Start with the same ordered items; pop the same oldest item; release its consumed slot by assigning NULL; enqueue the same JSONB item at the tail.

The following must remain identical:
- FIFO order and JSONB item contents, including path.
- Original target-key strings; do not canonicalize root/edge version text beyond the existing membership bigint comparison.
- **depth limit, then cycle check, then dominated-longest check**, in that order.
- Longest-depth relaxation and all updates to longest/visited.
- Root depth1/2 distinctions, complete traversal and unsolicited-artifact refusal.
- All byte/node/edge/depth bounds, all membership and malformed-input refusal behavior.
- Pending-work bound **16384** checked immediately after every enqueue. Pending count is **tail - head + 1**, not total enqueues and not native-array cardinality including consumed slots.
- No new cache, retained proof token, data admitted across invocations or skipped byte/semantic validation.

Use simple local array assignment so PostgreSQL can retain an expanded array; do not reconstruct/flatten it through a per-iteration SELECT or whole-array slice. Bound cursor growth under the unchanged nodes/edges/depth constraints and document the argument; do not invent a new total-enqueue refusal.

The actual >16384 pending branch has not been shown reachable under the existing <=1024 edges/roots and depth16 constraints. Do not lower a limit, bypass prechecks or fabricate a canonical positive to force this branch. Preserve its exact predicate mechanically and document any unexecuted branch honestly.

### C. Primary source basis and limits of the inference

Root has independently read the relevant official PostgreSQL16 source:
- https://github.com/postgres/postgres/blob/REL_16_STABLE/src/backend/utils/adt/jsonfuncs.c — jsonb_delete_idx, jsonb_set and IteratorConcat rebuild JSONB containers.
- https://github.com/postgres/postgres/blob/REL_16_STABLE/src/pl/plpgsql/src/pl_exec.c — exec_check_rw_parameter supports simple local expanded-array assignments.
- https://github.com/postgres/postgres/blob/REL_16_STABLE/src/backend/utils/adt/arrayfuncs.c — expanded array element replacement and old-element release.

These source facts and the measured worker self-time justify trying this bounded representation change. They do not establish an isolated queue cost or promise a speedup. Actual fresh full-run performance decides acceptance.

## 4. Required proof, without shrinking the existing matrix

Add a narrowly bounded native comparison against the exact full R8 worker, owner-only and outside application paths.

1. One new native-only fixture may contain the complete pinned R8 worker with only its qualified function name changed, plus the minimum owner-only setup/revocation. Mechanical equality must prove that its body and function attributes equal Final11. It must not replace or edit the earlier full semantic reference fixture.
2. Run actual old/new worker comparisons for Primary and Composed using the actual existing full retained closure inputs. Inputs must remain full and byte-bound. Derive any shared comparison inputs before the individual worker timing counters, but keep all setup/comparisons inside the same timed900s Parent. These are worker measurements, not substituted full-verifier or acceptance proofs.
3. Add a finite owner-only structural comparison that exercises an empty adjacency, edge ordering/duplicates, shared nodes reached later by a deeper path, exact depth16 acceptance/depth17 refusal, cycle-before-dominance and a wide reachable worklist. Include meaningful malformed/null/key/version refusal cases where affected by the representation. Report exact success or SQLSTATE/error equivalence. Do not claim a particular internal branch was reached without evidence.
4. Structural inputs are explicitly graph-worker fixtures, **not accepted capsules/receipts, official source evidence or canonical product positives**. The unchanged authentic Primary/Composed full verifier/oracle and end-to-end cases remain mandatory.
5. Keep all existing **218 native assertions** word-identical and ordered; only add focused coverage. Keep all8 existing full reference/current probes, all14 adversarial pairs,99 role denials per mode,count256,full17-table snapshots,5Fresh executions,9outer reproofs,allfault/corrupt-Old/Guard/R6/Race/4terminal cases.
6. Keep R8 test-lifetime/fixtures implementation and all earlier8 unit-test bodies unchanged. Add only needed focused source/isolation assertions/tests. Native reference functions must be owner-only; no API-role permission may be added. New test code remains outside all application/runtime imports.
7. Report the exact new diagnostic inventory/order and completion criteria before Root publication. All original130 mandatory diagnoses must remain in their relative order, with only the newly specified probes added.
8. Record actual Parent elapsed/reserve, both25s positive reserves, comparative worker measurements, all terminal markers and final parent-resource cleanup. No assertion reduction, no declared-but-unrun proof and no reuse of a prior successful CI as new-head evidence.

## 5. Exact writable scope

Allowed author changes:
- scripts/db/official-truth-integrated-pilot-1/semantic-v2.sql: **only validate_inspected_graph_v2 declarations/body for section3**. All other30 functions and outer definitions remain byte-identical to Final11.
- scripts/db/official-truth-atomic-version-refresh-1/native.test.ts: only the focused R9 owner-only worker comparison and structural coverage in section4. Existing production-like orchestration, all218 old assertions, lifecycle, timing, failure injection and cases stay unchanged.
- At most one new fixture: scripts/db/official-truth-atomic-version-refresh-1/graph-reference-r9.fixture.sql, as described above.
- lib/readiness/official-truth-atomic-version-refresh-1.test.ts: focused additive R9 isolation/equivalence/source guards; all previous8 test bodies unchanged.
- docs/OFFICIAL_TRUTH_ATOMIC_VERSION_REFRESH_1_HANDOFF_2026-11-07.md: append truthful R8failure/R9implementation/evidence/limitations and exact remaining gates.

All other18-file-baseline author files remain byte-identical, especially test-lifetime.ts, fixtures.ts, shared pg-wire, driver, refresh/reader contracts, engine, payloads, earlier reference fixture, workflow, package commands, migrations and production configuration. Do not modify earlier TASK/amendments or this R9. No dependency installation.

Any necessary wider change must first be reported with concrete evidence to Root. It is not automatically authorized.

## 6. Hard limits, platform boundaries and delivery

Keep **900s Parent,20min job,25s SQL,15s lock,20s idle/COMMIT,60s reader,120s coordinator** and all existing earlier-deadline/guard/retention constraints. No shortening deliberate authority-bound/pause probes, no moving setup outside Parent, no splitting/sharding or favorable unchanged rerun. No automatic replay after uncertain commit. Failure remains failure.

No hosted SQL/readback/apply, schema/role/Auth change, real source fetch/admission, pilot/provider activation, environment/protection/cost/settings change or Cursor restart. Development Stage1 remains **APPLY_RESPONSE_SUCCESS / INDEPENDENT_READBACK_PENDING**, ledgerUNKNOWN; Stage2 **NOT_ATTEMPTED**. The original refused readback still has no evidenced platform clearance. No repeat/rephrasing/rerouting through another agent/tool/access path. #1131 and other held work remain separate; no copying held code.

Deliver one complete immutable snapshot containing all18 previous author files plus the authorized fixture, old/new Git blobs/SHA256/byte sizes, complete delta, Root-document pins including thisR9, and mechanical unchanged-function/old-test/assertion proofs. Root publishes the implementation, never the author. The Root task seed and implementation baseline must be bound separately.

Local PostgreSQL is absent in this workspace; do not claim local native compile/PASS. Use available meaningful local checks and report their exact scope. Root independently reviews the entire changed source and publishes the new Head on the existing Draft#1154. Fresh full Core/Persisted/Refresh/Auth/hygiene/build/Preview/strict-aggregate gates follow. After Root PASS/ordinary merge, actual newmain needs its own complete fresh gates and Production/alias/both-host checks before POST-MERGE PASS or closing#1152.

After complete delivery: **RETURN / STOP**. No automatic follow-up or feature slice. The full own versioned/refreshable entry-requirements product and the separate hosted/source/Owner/Production A–F path remain the overarching task.
