# Persisted Canonical Read 1 — TL Amendment R3: native fixture isolation and decisive deadlines

Date: 2026-11-07. Tracking #1150 / Draft PR #1151.
Same author **Jetnity Official Truth Persisted Canonical Read 1 — Codex Generation 1**, actual session `/root/persisted_canonical_read_writer`.
Prior immutable TASK `101be0875126d0e79a65636c1f7f49facea2d0d8`, R1 `2baa526d48a9c370abcfd86b3e35a2c9547159e8`, R2 `4c30954be0e3d5cb1c845a40c223fb65a83afee0` remain unchanged.
This is an immediate same-session correction after TL CHANGES REQUIRED, not a successor slice.

## 1. Actual independent evidence

Head `2f87820651c57e242a01567e819e393df1906e57`, CI **42378701031 attempt 1**, App job **128421608359** failed with 8,190 tests / 8,187 pass / 1 fail / 0 cancelled / 2 unchanged skips / 0 TODO. Both full primary/composed persisted Requirements positives and all five new unit/isolation tests actually passed. Later native criteria were not reached.
Root receipt: https://github.com/Jetnity/jetnity/pull/1151#issuecomment-6707952062

The native failure at line 313 expected unavailable for an injected final transport failure but received refused. Its last fixture restore/checkpoint completed by 203,391ms; the full guarded positive completed at 228,451ms; two cancellation cases and the transport case then reached failure at 269,290ms without a new fixture checkpoint. More than 65,898ms had elapsed against the unchanged 60-second lifecycle-head availability. The log does not expose the exact refusal reason, so that reason is not asserted as observed. It does establish inadequate independent-case isolation and missing proof that the intended hook was reached.

The real healthy two-receipt read required about 25,060ms. Thus an 18-second bound installed before the whole operation cannot reliably reach the required successful final query. The former 360-second total bound for this NEW unmerged suite is also unsupported: the first partial 269 seconds plus six remaining full metadata cases at the observed rate already exceeds 419 seconds, before the other required deadline/version/rollback cases.

A second independent review confirms that the previous earliest-bound counterexample is not decisive for a final SQL query taking at least three seconds: returning three seconds before actual expiry may already be beyond the final query's own conservative deadline. It must separate the initial and later confirmed bounds explicitly.

## 2. Exact correction scope

Author may change only:
- `lib/readiness/official-truth-persisted-canonical-read-1-native.test.ts`
- `docs/OFFICIAL_TRUTH_PERSISTED_CANONICAL_READ_1_HANDOFF_2026-11-07.md`

Root adds this immutable R3 document before dispatch. No runtime reader/projection/lookup/SQL/controlled-runtime change is justified by the current evidence. If a concrete runtime defect is discovered, return its exact evidence to TL before changing that surface. Correct the HANDOFF's last-call name to read_projection_candidate, which delegates read_candidate, and record the real first CI failure and remaining gates.

All original requirements and R2 security semantics remain in force. No test removal, retry, skip, fake SQL success, reduced implementation capsule, bypassed verifier, positive cache, altered old migration, hosted action or held-scope work.

## 3. Honest independent fixture state

Before each independent healthy native case, explicitly prepare the existing local fixture with its externally held witness and the existing checkpoint operation. This occurs BEFORE invoking the reader, on the separate lifecycle authority connection. The owned reader never checkpoints, renews, writes or retries. Do not hide renewal inside a query hook or production reader.

Deliberately stale, foreign, expired or otherwise negative fixture cases must retain their intended condition. Do not refresh a stale-head case into a healthy case. Existing restore/checkpoint helpers may be reused transparently between cases.

Every intended injected cancellation, transport failure, metadata alteration, delayed-success boundary and lock wait must assert that its exact hook or observed state was reached. Failure to reach a target cannot count as a successful negative proof merely because an earlier unrelated check refused. Include only fixed phase/reason/count/elapsed diagnostics, never bodies, keys or raw SQL parameters.

## 4. Efficient full-corpus order

Keep ONE disposable native cluster and the actual complete captured primary and composed bundles.

Perform the generic primary/lifecycle/deadline/metadata families while only the actually committed primary receipt is present. Publish and prove the composed receipt afterward, then run its ordered-row swap and the subsequent ambiguity/damaged-rival/supersession/forgery/rollback families. The composed body and code capsules must still be real full controlled execution, acknowledged COMMIT, closed producer and fresh reader.

This changes fixture scheduling only. Every actual lookup still enumerates and verifies its ENTIRE actual current corpus. Do not filter ignored competitors, erase accepted data to accelerate a reader, replace capsules, split the parent suite to evade its bound, introduce more clusters or weaken the later three-/four-receipt cases.

## 5. Decisive actual-time deadline counterexamples

Prepare actual expiry/freshness/head timing BEFORE starting each owned reader. Never extend or rewrite the chosen bound during that operation. A finite code-owned calibration using the elapsed time of an already successful full real native read is allowed solely to select a feasible test window; it is not an injected production clock or a synthetic SQL result.

For this correction, use one code-owned calibration from a real healthy primary read: round up its observed complete read duration plus its maximum observed original-SQL duration plus 5,000ms reserve. Assert the resulting window is at most 45,000ms; do not clamp an infeasible measurement into a passing fixture. The earliest-bound test may add the explicit initial 5,000ms delay allowance, while remaining strictly below 50,000ms. A bounded pre-final-query staging wait may only consume time, never renew data; it must itself fit all unchanged idle/operation limits and be reported. Actual final-response assertions below remain mandatory.

The calibrated windows must be bounded below the unchanged 60-second operation/head limits, leave a measured margin to reach actual final SQL success, and keep each intentional final-response idle delay below 18 seconds (and therefore below the existing 20-second idle protection). Assert feasibility and fail if the real measurements do not support the required window. Do not retry to obtain favourable timings or silently skip the proof.

For retention, freshness and lifecycle independently:
1. Start with the specifically prepared real persisted bound.
2. Observe an actually successful final candidate query.
3. Use its actual returned observed_at/deadline values and real elapsed time.
4. Delay delivery across the relevant actual database deadline while remaining below the independent whole-operation limit.
5. Assert the deadline was crossed, the final SQL-success hook was reached, the result is freshness_lost, and backend/lock cleanup completed.
A rejection before the final successful SQL response is not this proof.

For the earliest-confirmed monotonic bound:
- Capture both actual query-start instants, the initial start BEFORE the intentional initial-query delay. A temporary pass-through spy may observe performance.now only if it returns each actual original monotonic value unchanged; no synthetic offset or clock replacement is permitted in this earliest-bound case. Capture the last real reader anchor at query-wrapper entry before any test clock observation, and restore the spy afterward. The separate existing negative whole-budget test remains isolated.
- Derive both conservative deadlines from the actual returned nine-column rows using the same stated two-millisecond precision rule.
- Establish a real positive separation between the first and later deadlines with a useful explicit margin.
- Deliver the final successful response at a real monotonic instant STRICTLY AFTER the initial confirmed bound and STRICTLY BEFORE the later confirmed bound, with assertions protecting both margins. Actual database expiry and the whole-operation deadline must still be in the future.
- The correct reader must refuse because it preserves the earlier bound. A faulty reader replacing the first bound with the later one must not also be rejected solely by that later bound in this fixture.
If the timings do not create that distinguishing interval, the test fails as unproven. Do not weaken the assertions or extend the reader's authority.

## 6. Only the new suite's aggregate work budget changes

Root explicitly changes the aggregate timeout of this one newly introduced, not-yet-accepted native test from 360,000ms to **900,000ms (15 minutes)**. The actual partial-run cost and complete remaining proof matrix justify an aggregate work allowance after the scheduling optimization above.

This supersedes R2's no-budget-increase wording ONLY for that new suite's aggregate 360s value. It authorizes no other timeout change. Every pre-existing main test and the CI workflow remain byte-for-byte unchanged. In particular:
- CI App job: 30 minutes, unchanged.
- SQL statement: 25 seconds, unchanged.
- SQL lock: 15 seconds, unchanged.
- SQL idle transaction and COMMIT: 20 seconds each, unchanged.
- New runtime reader: 60 seconds with explicit monotonic enforcement, unchanged.
- Actual original/freshness/lifecycle and canonical source bounds: unchanged.

Retain phase diagnostics and report the complete actual duration. A further inability to complete under this finite aggregate bound requires a new concrete diagnosis; no automatic extension or suite split.

## 7. Re-gating and preserved authority

Same author/session returns an exact changed-file manifest and updated HANDOFF. Root independently reviews this delta and the complete resulting tree, then reruns ALL exact-head gates: full tests/native PG16, hygiene, build, fresh Auth, Preview, open threads, main/ruleset checks. First-run successes are not a PASS for the changed head. Actual-main CI and Production/jetnity.com identity remain mandatory after any merge.

No PASS, Ready or Merge until Root's complete acceptance. No new successor task.
Development remains APPLY_RESPONSE_SUCCESS / INDEPENDENT_READBACK_PENDING, actual ledger UNKNOWN, Stage 2 NOT_ATTEMPTED. No platform clearance exists for the original denied readback; no repeat or alternate route. All application/provider/source/Owner/hosted gates and held work remain closed.
