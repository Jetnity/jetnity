# Official Truth Current-Version Lookup 1 — SELF_REVIEW

Date: 23 October 2026 (Europe/Zurich)
Writer: **Jetnity Official Truth Current-Version Lookup 1 — Cursor Generation 1**
Session: https://cursor.com/agents/bc-16e2789c-fc9b-4bbc-925b-ba43273b6cc3
Actual model: `grok-4.7-high-fast`

This self-review is not a Technical-Lead PASS. It does not authorize Ready or merge.

## Scope check

The change stays inside the allowlist: the new lookup directory, one focused test, one CLI-named migration `20261023153726_official_truth_current_version_lookup_1.sql`, and task-owned PLAN/STATUS/SELF_REVIEW/HANDOFF. TASK V1, V2 and V3 blobs are unchanged. No custody module, provenance module, shared schema, package, workflow, role, or table was edited.

The migration creates one `SECURITY DEFINER` function, revokes `PUBLIC`, and grants `EXECUTE` only to the existing `ot_original_reader`. It does not create a table, role, policy, or writer. It is installed only inside the disposable cluster. Hosted apply is not authorized.

## Correctness

Selection order is witness lock, count ceilings, accepted-set completeness, receipt presence and byte ceilings, then verification of every accepted receipt. A missing or mismatched competitor refuses the whole lookup. Two still-active matches return `ambiguous` with a null fingerprint. Terminal `withdrawn`, `conflicted`, `superseded` and `expired` events drop that version only after it has been classified. Source withdrawal, profile withdrawal and expiry without that event still fail inside `readCandidate` and are not turned into success.

Review-fix F1 proves, for every accepted bound receipt, that the protected review packet key equals `proof.reviewPacketKey` and that each ordered support equals the stored original version id and raw digest at that position. That pass now finishes before `verify_retained_v2`. A damaged review returns `accepted_corpus_incomplete` without the closure hash. Every receipt that passes the review pass is still provenance-verified before terminal exclusion and the cell/fact filter. The check does not decrypt an original and does not copy `readCandidate`. The complete existing custody proof still runs only for the unique result. No existing helper outside the allowlist needed an amendment.

Review-fix F2 does not drop a scenario. The first identity is stored with the existing publish and bind functions, then proved once on a new connection, including a caller-supplied fingerprint that the lookup ignores. The native test timeout remains 300000ms. Measured times are in the status document. No reproduced deadlock; exact old-run cause not established.

Review-fix F3 restores the closed-producer condition. `storeAccepted` no longer writes on the shared writer that stays open until cleanup. It opens `ot_original_test_writer`, commits, and closes that connection in `finally` before the witness alignment and the fresh-reader lookup. Rollback still propagates. The SQL blob is unchanged.

Post-merge repair F4 changes only the focused test and these delivery notes. The one-receipt rollback cases keep the same function calls and refusal assertions. The fresh tainted read still requires the first fingerprint, a different backend, and a closed producer, and it is the positive control that used to run immediately after the expiry rollback. The held lookup still commits only after the lifecycle backend is observed waiting, and it now also requires the second fingerprint. The separate committed positive between the review-fault rollbacks and that held lookup is removed because both saw the same three-receipt corpus and witness. The publication transaction still calls `publishIntegratedBundle` with `verify_existing` and then `bindCandidate` before commit. Lookup and SQL bytes are untouched. The 19 check names remain; the rollback check moves ahead of the fresh-reader check.

CI repair F5 changes only `lib/readiness/official-truth-original-custody.test.ts` and these notes. Stage 4's successful `verify_existing` is removed. Its complete `counts()` equality, including head sequence, is asserted on stage 6's existing uninjected retry, together with the primary fingerprint, one support, synthetic custody status, historical-original reproof, an unchanged held cursor, and `NOT_AUTHORIZED` / `positiveVisaCells` 0. That retry is a real `persistCandidate` readback on a fresh reader, after the composed receipt exists. The lost-ack attempt still cannot return success, and the normal connection hook is asserted restored before the retry. Stage 4's closed-producer positive read and wrong-key `39000` refusal stay. All 12 custody names stay. The F4 lookup test is not edited.

The second synthetic receipt is a proof-time shift of the admitted `regulations.example` primary cell. It does not invent a source, profile, or domain. Supersession is an explicit lifecycle event, not an inference from the newer receipt.

The calendar adjustment calls `contentEvidenceVersionV2` from the focused test. A non-test importer would fail the existing content-identity allowlist. No allowlist amendment was required.

## Findings

| Level | Finding |
| --- | --- |
| P0 | None observed in the local proof. |
| P1 | None against baseline main `76a30c5694bc7bd0dfb20544eb05a6c884c51576`. The repair seed is that main plus the immutable F4 task. A later main move is not part of this delivery. |
| P2 | The migration is hosted-UNAPPLIED. Applying it, or treating the returned fingerprint as a reusable positive cache, would cross the task boundary. |
| P2 | F4 CI `40002295282` passed the current-version proof in 228091ms and failed the custody parent at 240003.457393ms. The F5 local custody proof is 93552.077094ms. No unique cause is established. That does not prove the F5 runner finishes under 240000ms. Neither parent limit was raised. F5 CI is pending. |
| P3 | Full `eslint .` was not re-run after `e9f66ada`. That run reported 146 warnings and 0 errors. Its 4 skips are historical local-suite evidence. Hosted F4 CI reported 7121 tests, 2 skips and 2 cancelled tests. This head has no new full-suite count. |

## Residual risk

`LocalPgError` keeps the SQLSTATE and not the message. Structured outcomes are rows. `check_head` and `readCandidate` failures stay exceptions (`25000`, `55000`). A caller that ignores the open-transaction contract can release the SHARE lock between selection and custody proof. The TypeScript entry does not open that transaction itself; the proof and the function comment state that the caller owns it.
