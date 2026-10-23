# Official Truth Current-Version Lookup 1 — Post-Merge Repair F4 TASK V1

**BINDING IMMEDIATE REVIEW CORRECTION. 23 October 2026.** Parent issue #975 (reopened), merged PR #976. This repairs the current scope; it is not an automatic follow-up feature.

## Authority, baseline and exact author

Technical Lead alone sets PASS, Ready and merges. Existing immutable TASK V1/V2/V3 and F1/F2/F3 requirements remain in force. This addendum owns only the bounded correction below.

- Exact baseline main: `76a30c5694bc7bd0dfb20544eb05a6c884c51576`.
- Baseline tree: `6b37f099c7666cc4fab841fe2d4e1df2c21cb213`.
- Repair branch: `fix/official-truth-current-version-lookup-1-postmerge-f4`.
- Same logical author: **Jetnity Official Truth Current-Version Lookup 1 — Cursor Generation 1**.
- Same real session: **bc-16e2789c-fc9b-4bbc-925b-ba43273b6cc3**.
- Actual Owner-approved model: **grok-4.7-high-fast**. No new generation/session or silent model fallback.
- Review finding: https://github.com/Jetnity/jetnity/pull/976#issuecomment-6371537562 .

Read live main, this branch/task, original tasks, actual failed CI and current working state before changes. ACK the exact existing session/model and seed SHA. If the existing session cannot safely work on the prepared repair branch, report that limitation and STOP; do not silently launch another author. Preserve any unrelated workspace changes. If main has moved from the baseline, report drift before integration.

## Proven failure and desired result

Original final PR run39994517447 passed the native PostgreSQL test in273762.711987ms. Actual main PUSH run39997551343 failed: app job120564923182, native test1083, `testTimeoutFailure` after300004.537475ms under300000ms. Overall7121tests/7118pass/0assertion-fail/1cancelled/2skip. Later hygiene/build skipped. This is not PASS despite the `fail0` aggregate field. No final native PASS/phase diagnostic was emitted.

The desired result is a complete, reliable native proof with less redundant test work and useful phase evidence if it fails. A unique old-run slow-phase/deadlock cause is unproven. Do not invent one.

## Exclusive editable scope

- `lib/readiness/official-truth-current-version-lookup-1.test.ts` (baseline blob505dc6bcd534937cd182ca2260d8bf1a6443d91d).
- `scripts/db/official-truth-current-version-lookup-1/fixtures.ts`, only if a concrete test-only necessity is demonstrated.
- Existing task-owned PLAN, STATUS, HANDOFF and SELF_REVIEW documents dated2026-10-23, only truthful delivery/review/check updates.
- This new task is immutable after dispatch; any amendment comes from TL.

**Frozen:** lookup.ts blob`d9a22eba073752a94bdc58616c70100d557b3f61`; SQL blob`609d10b9727e5fa4f91896d64086798e989ae50b`; old TASK V1/V2/V3; all existing shared helpers; workflows/packages/test runner configuration; every runtime/UI/source/provider/hosted file. No new migration. If a concrete defect outside the allowlist is found, report exact evidence and the smallest proposed amendment before editing it.

## Permitted correction and proof obligations

1. Make safe phase-progress/partial-failure evidence visible, instead of retaining all timings until final PASS. Log bounded synthetic phase names, elapsed time and safe counters only; no originals, key, credential, local home path or personal data. Preserve the final native schema/check/authority diagnostic and clean up local connections/cluster on failure.
2. Remove only demonstrably duplicate expensive full proofs or unnecessary fixture work. Preserve every existing asserted behavior, all19 named scenarios, complete accepted-corpus F1 proof, closed-producer/fresh-reader F3, true PostgreSQL functions/roles/transactions and actual publication/withdrawal lock races. Do not substitute stubs, mock proof results, cached positive receipts or a smaller production verifier.
3. Concrete independently reviewed candidate: after F1 corrupt-other-cell rollbacks, the separate restored-primary positive lookup and the immediately following held-primary lookup see the same three-receipt corpus and witness. Move the wrong-pin no-match control before the held transaction, then use one genuine full held proof to establish both restored-real-match and withdrawal-race start. Keep the restored wrong-pin no-match assertion, exact result/fingerprint properties, transaction lifetime and lifecycle blocking observation.
4. A second permitted candidate, subject to verifying exact preconditions: run the source-withdrawal/profile-withdrawal/expiry/stale-witness/restored-head rollback scenarios with the first accepted receipt, before adding the second. Original TASK requires these real cases but not a two-accepted-receipt setup for them. Preserve every actual function/readCandidate/refusal/rollback/checkpoint assertion. Use the existing later fresh, tainted-input positive read as the restored-positive control and F3 proof if the causal conditions are identical, avoiding a duplicate full read. The full two-version ambiguity/supersession and later three-receipt F1/corrupt competitors/publication/withdrawal races remain intact. Document the precise before/after coverage mapping; do not remove a required lifecycle/no-fallback condition.
5. **Do not remove** the `publishIntegratedBundle(..., 'verify_existing')` in the publication transaction. Existing bind contract requires publish and bind in the same transaction; an earlier unbound stored receipt is not a substitute.
6. Keep the native test's **300000ms** limit and existing runtime SQL/lock/witness/transport limits unchanged. No skip, workflow/runner serialisation, concurrency flags, timeout inflation, rerun-only acceptance or splitting solely to evade the aggregate gate.
7. Preserve all event/review/receipt completeness, byte/count limits and boundary cases, no-match/ambiguous/refused/unique semantics, actual full original/provenance re-proof, caller-fingerprint distrust, independent connections, producer-close evidence, legacy empty tables and NOT_AUTHORIZED/positiveVisaCells0/hostedWrites0 outputs.
8. If these bounded corrections do not provide a defensible improvement, stop with actual measured phase evidence and a concrete TL decision request. No speculative broad optimisation or relaxation.

## Verification and delivery

Run the focused native PostgreSQL16 test on the actual corrected code, reporting original command, PG version, complete19-check diagnostic, duration and safe phase evidence. Compare the call/fixture chronology against the baseline so the removed work is shown to be redundant. A representative constrained local measurement is useful only if readily available; do not claim it simulates GitHub or spend unbounded time benchmarking.

Let ordinary final-head CI provide the complete typecheck/lint/full-suite/hygiene/build gates. No repeated local full suite is required solely for this test-only repair. CI must actually succeed on the final implementation head; a task-seed run is not repair evidence. Report pending as pending. TL will read original final-head and post-merge native logs independently.

Commit only the allowed correction and truthful delivery notes on the prepared repair branch. Keep the separate repair PR Draft. Record exact head/tree, task blob, current main/merge-base/ahead/behind, full diff, same actual session/model, local results, actual CI/Preview and all unresolved limits. Do not add a commit merely to quote the final SHA. Then STOP.

## Unchanged special gates

Synthetic/local proof only. No hosted Supabase SQL, migration apply, blocked #917 retry/reworded query/alternate connector/credential/operator/manual Owner SQL workaround; no real source/government/provider acquisition; no real legal Rule, pilot/provider/Production activation; no secrets, outreach, new cost, retention/key-hosting change or customer data. #917/#944/#937/#748 and all special gates remain.

**DO NOT MARK READY. DO NOT MERGE. DO NOT START A FOLLOW-UP SLICE.**
