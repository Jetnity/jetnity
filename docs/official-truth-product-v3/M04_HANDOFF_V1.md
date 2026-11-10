# M04 — current Technical-Lead handoff

**2026-11-10 04:44:17 UTC. R17 / Recovery Task V8, bounded native-only correction prepared; complete acceptance pending.** This is the source checkpoint before publication. Read [Root Review V8](M04_RECOVERY_ROOT_REVIEW_V8.md) and the latest exact-head PR receipts before deciding what remains. Live evidence wins.

## Mandatory entry order

JETNITY_START_HERE.md → docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md → this Handoff → docs/ACTIVE_WORK_STATUS.md → [Root Review V8](M04_RECOVERY_ROOT_REVIEW_V8.md) → [Task V8](M04_RECOVERY_TASK_V8.md), [evidence](M04_RECOVERY_R17_EVIDENCE_V8.json), [failure excerpt](M04_RECOVERY_R17_NATIVE_FAILURE_V8.txt) → live PR#1178/issues751/1162, reviews, CI, Preview/Production and current Owner gates. Continue original frozen Task/Plan; no automatic product follow-up.

## Exact recovered state

[CI 42754606380](https://github.com/Jetnity/jetnity/actions/runs/42754606380), attempt 1 on exact **69f4dcc78e8670099fb5997f825edf1027956b33**, ended **FAILURE at 04:28:05 UTC**. Repository verification **129625959864** and aggregate **129630534969** failed; all six companions succeeded. Typecheck/lint passed; Tests failed; hygiene/build skipped. Core: **8682 total / 8678 passed / 2 failed / 2 skipped / 0 cancelled**.

The first **23 ordered native groups passed**, including corrected N07/R4, full 16-original Discovery, restart/reconciliation/lock/drain cases and both actual R9 witnesses. Their recorded group times sum to 90307 ms. Group 24 **N05/A03** failed after **149149.71633 ms** with **M04 240 s effect budget exceeded**, native.ts:457:52. The exact failed iteration and individual SQL costs are not logged. Seven later groups were not reached. Receipt failure is proof_24:N05/A03, fixture/unclassified_failure, nativePass false.

Executed-part cleanup is complete: **26653/26653 settled, 0 pending, 4242/4242 cumulative connections closed, one cluster stopped, no children or cleanup errors; 240314 ms total / 20 ms cleanup**. Later inherited commit-guard proof has not run (inheritedCommitGuardPairs 0, minimumOwned 0). No whole-native or overall TL PASS.

Both native R9 witnesses use actual reserve_v1 SQL, distinct target/control/holder PIDs and backend births, observed real wait, delivered abort, backend absence while executor custody remains held, actual retained executor drain, admission unavailable before drain and invalid after drain with three methods still held, and zero terminal effects. Natural I1 timeout additionally observes fail-confirm and returns worker_only; explicit worker caller-abort returns unconfirmed. Post-drain native admissions are 45 and 44 respectively.

The completedMethods=0 receipt field is intentionally captured while the three helpers remain held. The unchanged native scenario finally releases/joins all three, asserts empty contexts and admitted=drained, and is only appended to passed groups after inventory restoration. These are actual historical exact 69 witnesses; a changed head must reprove them.

native.ts: **142485 bytes**, SHA256 **2e757ad2a3242e3881eba5b498c595a2447846157e3de698d17dd356d499375a**, Git blob **20247c75ed2dd9c834304429c138054383913b1f**. All-18 source aggregate **57169eb6ccf365164c1a334eee57bb887640c11e2342dd03d109c5444d999fc0**. All 17 other sources, including candidate SQL a22e6a015c8fc5a268500659ace31a938d2ce3614625e9df1982308b73199a59 and rollback 9b9089d74242a802455cc7e3fb8a0a8515c17b61b45ae730b9bbba1adb650a66, remain unchanged.

Root independently inspected the frozen Plan §§96–98, N05 and A03, both quota blocks, actual fixture/coordinator selection and SQL subject/job/history/START/CAS/common-entry predicates. The sole author and independent reviewer reached the same bounded conclusion.

Every successful retained-subject command validates full history before and after effects. A completed 254-command fill entails 254² = 64,516 historical transitions before later boundary assertions. The following 64-cycle scenario also validates every retained command and start. This is source-derived multiplicity, not a measured failing iteration, per-function timing or dominant-function percentage.

The two quota predicates are shared by Rule and Discovery. The frozen plan requires actual complete 256-command/64-start histories and terminal capacity; it does not prescribe Rule-only fixtures or a full-cap cross-product. The accepted native-only change uses compact real Discovery jobs in two distinct coherent unused country pairs **CH → IS** and **CH → NO**, built through existing originals.context. An actual fixed queue_read probe must return absent before either first write, and identities must differ. All input/kind/claim/state/fence/pointer locators use that exact Discovery subject.

All 254 actual fill commands, claim 255 with original terminal credit, real START, blocked interstitial request/no-effect snapshot, exact-token/fence Fail 256, cleared credit/one disposition/exhausted state and overflow refusal remain. All 64 actual enqueue/claim/START/fail cycles, 65th enqueue/refused claim, 193 commands/64 starts/64 dispositions, pointer disagreement refusal and exact restoration remain. No journal seeding, deletion, disabled validation, bypassed catalog/current MA1, timeout increase, skip or SQL change.

**Limitation:** the two full-cap traces now use Discovery metadata. They do not establish full-cap Rule latency, optimize runtime SQL or approve Production capacity/SLO. Quadratic Rule-history validation remains a declared dormant performance limitation. Existing actual Rule/S1/I1 and Discovery/S1 groups and maximum-wire proof remain unchanged. Actual complete unchanged CI decides whether the new fixture sequence fits.

[Diagnosis dispatch](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6759048050) and [exact Root authorization](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6759160977). Previous exact 69 [publication receipt](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6758816492).

## First unfinished step

First unfinished step at this pre-publication snapshot: Root publishes the reviewed finite R17 delta on expected 69f4dcc, verifies every changed blob, complete tree and ancestry, then inspects the complete automatically triggered unchanged exact-head CI. All 31 ordered groups, both R9 witnesses, full resource/process completion, core/hygiene/build/companions and refreshed main/Preview/Production/Guardian/review/rules/gates are mandatory. A concrete failure returns to the same author/session; no unchanged-known-bad rerun. Root alone may grant TL PASS, Ready or merge after full exact-head acceptance. Later read-back PR receipts/live state determine the actual current head/run and first remaining step.

Sole author **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation2**, /root/m04_durable_jobs_writer_g2; independent reviewer /root/m04_r9_review_g2; live auditor /root/m04_live_audit_g2. Original G1 session is unavailable; no invented Cursor continuity. Author self-review is never TL PASS. Root owns publication, versioned tasks/reviews/current pointers, Ready and merge. Author stops after finite delivery.

The shell is reachable but the original checkout /workspace/scratch/01cbe1264212/jetnity-v3-durable-jobs is absent. It was not recreated. Text and independent hashes use in-session JavaScript only. Historical local 64/64 checks are earlier evidence, not R17 validation. Actual native execution is confined to the unchanged existing CI.

Baseline 69 ahead 9 / behind 0, 91 files against main 890; Atlas #1180,Booking #1179 and22 omitted binary IDs preserved. Production remains exactmain 890 per timestamped V8 live snapshot, no M04 production/runtime claim. All seven failures and previous local evidence remain historical. D1 #1169 is separate Draft/unfinished.

## Frozen limits and gates

Frozen limits remain 240 s effects + 60 s cleanup / 300 s overall; four outer lanes and four native operations per family, eight active native / 256 total with 16 terminal admissions reserved, eight callbacks / 128 total, 30 s outer / 5 s child, three clusters / two child processes / 40 aggregate work connections / two M04 observers / one method observer / 16 fixture connections per cluster.

Method **NOT_APPROVED**. #1139 **NOT_RELEASE_READY**, pre-Owner gaps E01, E04, E06, E07, E09, E10, E11, E13, E15, E16, E17, E18, E21, E22, E24, E25, E28. #917 specifically refused independent readback remains pending, ledger UNKNOWN, Stage2 NOT_ATTEMPTED: no retry, rephrasing, delegation, rerouting, transport switch, human SQL substitute or renewed old Owner evidence request. #1131 Ready STOP; both #1135 holds; #968 preview isolation and #911/#913 privacy remain.

No hosted DB/Auth/RLS/ACL/migration/credential action or Auth-log access, real source/provider/research call, scheduler, notification, new cost or public V3 activation. No local PostgreSQL/native/socket/parser/project/build execution, installation/download, missing binary retrieval, clone/reconstruction or replacement environment. Native proof only in unchanged existing GitHub CI. No git fetch/push; any local git reads require GIT_NO_LAZY_FETCH=1 and GIT_OPTIONAL_LOCKS=0. Preserve all 22 omitted binary IDs. No automatic next product slice.
