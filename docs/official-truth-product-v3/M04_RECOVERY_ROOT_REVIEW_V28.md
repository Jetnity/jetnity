# M04 R37 / V28 — bounded diagnostic source review and failure 29 continuity

**Source checkpoint 2026-11-11T02:30:20Z. Root and independent literal source review are complete. Immutable publication and runtime gates remain pending. R37 is a diagnostic only and must never be Ready or merged, even if CI becomes green.** The current failed parent is d1f134a698ddd63c147191b34f24f529a28f5605; main remains fbcb72e7c65a5e7c7e4f2e20105ab6f4b2201a54. The full binding tasks are in M04_RECOVERY_TASK_V28.md and [V28 v2](https://github.com/Jetnity/jetnity/pull/1184#issuecomment-6784909084).

## Exact reviewed proposal

Native206062 UTF-8 bytes / SHA25619289ec373b5de36c7db6fab68a15ec9a6e93cb2416bd8dc9bef293a383b4623 / Gitblob15923a09e760438a9e62a534aa757a11317c23a5. Helper14420 bytes / SHA2560e111c5f2c34f29b6de5a3373d0121a1ee71883088baffbcc6409a060e087948. Root and independent reviewer reconstructed the same eight literal spans and reversed them exactly to the191098-byte original. All18 complete source pins were independently checked; the other17 remain exact. New aggregate6080cf19173c912b7de7d691719e78afc8129afee7fd172cdb3a70b4f390bf71, using SHA256 SPACE decimalBytes SPACE path LF in sorted path order.

All31 original proof openings/order, original quota helpers, original native receipt and final aggregate-error suffix are exact. The full-file restricted connection expression count remains five: four original witnesses unchanged, one persistent acquisition moved into the helper. Setup has nine extra queries; twelve snapshots have three serial queries each; all45 starts are hard-capped. The independent reviewer also reproduced the author's122998-byte conservative whole-record bound, leaving8074 bytes under131072; actual complete serialization checks remain authoritative. No local project/parser/SQL/typecheck/native execution occurred. Static source review is complete for the selected diagnostic only; there is no runtime PASS or merge eligibility.

## Decision and evidence

R36 failed the unchanged 240-second effect budget. All 24 completed groups, full ledger proof, incomplete cycle ACK/UNKNOWN state, genuine R9 witnesses and terminal cleanup are retained in the evidence JSON. All six companion jobs passed; Repository and the dependent aggregate failed. Root and the same independent reviewers completed full permitted log reviews. Auth was checked by terminal metadata only. The earlier R35 PR success and subsequent actual-main failure remain distinct observations, reachable through immutable V27/V26 evidence.

R36 source query-count reductions did not establish actual runtime reserve. Root selects a bounded function-cost measurement in the existing disposable CI fixture, before another source optimization. SQL remains exact. No weakened assertion, smaller quota, longer timeout, skipped family or unchanged-head rerun is authorized.

## Intended exact implementation scope

Only scripts/db/official-truth-v3-durable-jobs-1/native.ts may change, additively. Baseline: 191098 UTF-8 bytes / SHA256 f5d849c643ff22d264bc9adc1a7cd65f12caaac80a804647604851f22effbde0 / blob0b3f7d9906687ec42171de5af60fed009d07b39f. All other 17 protected sources, including SQL92ca2bf0… and rollback9b9089d7…, stay exact. The same author delivers literal spans and an exact inverse, then Root and the independent source reviewer review the same bytes. All original 31 proof calls and every original assertion, input, quota helper, fixed SQL call, transaction boundary, authority witness, original native receipt and budget must remain.

The selected setup scopes track_functions=all to the one already-existing runtime connection by temporarily setting the fixed jobs login's database-specific default. Both executor setups finish first. Existing owner/runtime/observer transports only; no added connection. Require an absent original role/database record, set the one default, perform the existing real restricted login, reset only the setting and verify exact absent restoration immediately. Existing and later connections retain their prior settings. A live-only finally must preserve both setup and restore failures; parent abort prohibits further SQL and relies on the genuine owned-cluster disposal evidence without fabricating RESET acknowledgement.

Snapshots are finite completed-prefix observations: six ledger anchors and six cycle anchors, after existing ACK/current-state/counter updates. Each serially awaits runtime force-flush through ReadyForQuery, clears the observer's cached statistics snapshot in a separate query, then reads the fixed 29-function catalog inventory with LEFT JOIN statistics in stable C order. Missing rows remain NULL, every actual row is retained, no sampling or clamping. The whole serialized receipt, not just its rows, is bounded to 131072 UTF-8 bytes. Cached final emission must preserve the original failure and original native receipt even if telemetry serialization fails.

## Independently checked PostgreSQL semantics

Root and source reviewer read pinned PostgreSQL source at c372fbbd8e911f2412b80a8c39d7079366565d67. All 15 complete primary file pins and three project transport/lifetime pins are in the evidence record. Root personally read the relevant implementations; this is source-text verification, without local project or SQL execution.

- pg_stat_force_next_flush exists and is callable without adding grants; it requests the current backend's next forced statistics flush.
- pgstat_report_stat consumes that flag and publishes pending counters before ReadyForQuery outside a transaction. Existing pg-wire returns the ordinary result only on tag Z, so awaited flush completes before the observer's separate clear/read sequence.
- The statistics view omits untracked functions, so fixed catalog inventory plus LEFT JOIN is required to distinguish missing from zero.
- ALTER ROLE IN DATABASE affects new logins; RESET of the sole track_functions entry restores the previously absent exact record. The live backend retains its effective setting. No RESET ALL or unrelated role/database setting is touched.
- Current SET search_path wrappers are not SQL-inlined. Built-in functions are not individually tracked. Eligible transitive user functions outside the retained 29 rows are also instrumented on that backend.
- Function tracking starts after the function's own SET/security setup and ends before its restore. Failed/error calls can bypass usage completion. Completed descendants may still be counted.

## Interpretation and acceptance limits

The diagnostic measures cumulative completed-prefix function costs on a database-wide statistics surface. Attribution to the selected runtime lane depends on proved one-connection tracking and immediate exact default restoration. Failed or interrupted calls are not complete timing or call evidence. Overlapping total_time values must not be summed. Function elapsed time is not CPU-only; own wrapper setup/restore is excluded, and child wrapper time can appear in parent self time.

Instrumentation consumes the same effect budget, including earlier proofs. Snapshot duration measures collection overhead only; it cannot measure or subtract all transitive tracking overhead. The bounded snapshot count is not a bound on all tracker bookkeeping. No query-plan, I/O, allocation, controlled before/after speedup or final runtime-margin claim follows. Only genuinely cached completed prefixes survive abort; no stale snapshot can be relabeled final and no SQL may run after abort.

R37 data-quality review is separate from acceptance. **The instrumented diagnostic head is categorically nonmergeable.** After evidence, Root must select a separately versioned bounded correction and restore native.ts to its exact baseline before full final PR, actual-main and Production gates. Any new head invalidates earlier exact-head checks.

## Continuity, publication and gates

The new commit is expected to change ten paths from d1: native.ts, six current entry/handoff files and three new V28 records. Seven modified / three added / zero deleted, 9418 unchanged old leaves, 9428 total leaves, 838 directories including root and 10265 recursive entries. The cumulative PR is expected to contain fourteen paths against main: eight modified and six added. These are expectations until the actual immutable candidate tree is independently reconstructed and read back. All 36 parallel #1181 leaves must remain exact.

Five existing current blocks may change; every byte outside them remains. The complete previous M04 handoff is retained unchanged after the new checkpoint. Earlier V27/V26 records are immutable and not rewritten or duplicated. New evidence retains full R36 native/TAP/terminal metadata, all companion objects and the Atomic escaped raw line. Current bodies #751/#1182/#1183/#1184 were updated after exact fresh comparisons and independently read back by Root at02:20:27UTC. Their later update does not alter the dated 02:13 independent observation.

Root alone publishes via expected-parent fast-forward after independent source and immutable readback. Existing full eight-job CI runs once for the changed head. Root checks terminal metadata before each permitted non-Auth log and authorizes independent review. Preview and Production/aliases, NORMAL, rules, Owner/Guardian and open review-thread gates remain required. No Auth logs or artifact downloads. The full prior CI metadata and the later live review are preserved in the JSON evidence.

Finite eight-path documentation completion remains HELD until genuine corrected actual-main PASS, then its already-contracted separate Draft, full PR/main/Production gates and final receipts, followed by STOP. No automatic product slice or self-attestation commit loop. SQL_UNAPPLIED; METHOD_NOT_APPROVED; #1139 NOT_RELEASE_READY with the same 17 pre-Owner gaps; #917 UNKNOWN / Stage2 NOT_ATTEMPTED with no individual access, retry, rephrase, delegation, reroute, transport switch or human SQL substitute; #1131 Ready STOP; both #1135 holds; #968 target isolation; #911/#913 privacy; D1 #1169 separately unfinished; concrete client/SSR/Auth binding remains unproved.

P1: actual main and R36 remain without M04 acceptance. P2: runtime cost and total instrumented overhead remain unmeasured. P3: two inherited skips and held finite closure. No new concrete P0 within this bounded review; no global clearance.
