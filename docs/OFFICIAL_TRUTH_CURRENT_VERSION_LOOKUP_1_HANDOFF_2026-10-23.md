# Official Truth Current-Version Lookup 1 — HANDOFF

Date: 23 October 2026 (Europe/Zurich)
Issue: #975, reopened
Repair Draft PR: #979
Historical merged PR: #976
Branch: `fix/official-truth-current-version-lookup-1-postmerge-f4`
Writer: **Jetnity Official Truth Current-Version Lookup 1 — Cursor Generation 1**
Session: https://cursor.com/agents/bc-16e2789c-fc9b-4bbc-925b-ba43273b6cc3
Actual model: `grok-4.7-high-fast` (Product Owner acceptance: https://github.com/Jetnity/jetnity/issues/751#issuecomment-6368365938)

**STOP.** This handoff requests independent Technical-Lead review. It does not mark Ready, does not merge, and does not start a follow-up slice. Immediate fixes stay with this writer and session.

## Implemented local lookup

Exact canonical cell definition, scope, fact kind and requirement type resolve to at most one currently usable retained receipt. The caller supplies the external lifecycle witness and does not supply a fingerprint. Completeness of the accepted event, binding, review and receipt set is proved before identity filtering. Before provenance hashing and before that filter, every accepted receipt also proves its protected review packet key and ordered original-support metadata. Ambiguity, damaged competitors, unknown completeness and count or byte overflow refuse the lookup. The unique fingerprint is then passed to the existing `readCandidate`, which keeps the lifecycle SHARE lock and opens the separate archive snapshot.

The accepted-store helper opens its own `ot_original_test_writer`, commits the existing publish and bind, and closes that producer in `finally` before the witness alignment and the later fresh-reader lookup.

Post-merge repair F4 keeps that transaction and every named scenario. It moves the isolated rollback cases onto the first accepted receipt and uses one held proof for the restored three-receipt match and the withdrawal race. Phase start and completion lines are emitted before the final diagnostic. A thrown failure emits the same schema with status `FAIL`, the SQLSTATE or error name, and the phases already recorded.

The result is local and non-authoritative: `productionAcceptedRead: NOT_AUTHORIZED`, `positiveVisaCells: 0`, `reusablePositiveCache: false`. Freshness is the witness plus `read_at`. It is not a reusable positive cache, an OfficialEvaluation, a key, or an original body.

## Still unimplemented

Real-source and government calls, hosted database access or migration apply, #917 readback and any alternate route, legacy accepted-claim bridging, provider or pilot activation, retention and key hosting, and Production acceptance are not implemented. The synthetic corpus remains `https://regulations.example/rules/{primary_rule|composed_effect|composed_mode}`.

## Exact refs

Historical merge record:

- Integration merge `90d120bf3fc29c2bff694176000f62176bdef8b2`
- Merge parents `2e251c853d87e700b65ccb29590229d9992e23d4` and `8ec8e8ed8a63781fa88ece617b17f382340b6645`
- Integrated main tree `5c583d65df5e087baf9131e5d56d515e06c43544`
- Dispatch baseline `5269b9192a2300c6c03fc8659964583130d2d1d1`
- origin/main at the merge `8ec8e8ed8a63781fa88ece617b17f382340b6645`
- 15 ahead / 0 behind at that merge; the F3 commit is one more, so 16 ahead / 0 behind if main is unchanged
- Mode `NORMAL`
- Immutable blobs V1 `d74d6f3e88eec0fe807cc57a71913235dfc572bd`, V2 `2e20181849d5575b440fcec004b521e562775751`, V3 `2f304122b59bba6bdb5f0bbb86fba46b139d3add`
- SQL blob `609d10b9727e5fa4f91896d64086798e989ae50b`, unchanged from the reviewed F2 migration

Current repair:

- Repair seed `689686758f97575c5329e59c715df5dbbb4629bc`, tree `f2b9091092c3750714a7940b2840122239ec6917`
- F4 task blob `a93581f630fba4673e22a8ff6c306aa0ea6e1d43`, unchanged by this commit
- Baseline main `76a30c5694bc7bd0dfb20544eb05a6c884c51576`, tree `6b37f099c7666cc4fab841fe2d4e1df2c21cb213`
- 1 ahead / 0 behind at the seed; the F4 commit is one more, so 2 ahead / 0 behind if main is unchanged
- Lookup blob `d9a22eba073752a94bdc58616c70100d557b3f61`
- SQL blob `609d10b9727e5fa4f91896d64086798e989ae50b`
- Baseline test blob `505dc6bcd534937cd182ca2260d8bf1a6443d91d`

The F4 review head `1e7459b79d92131a2d9aa89131e33ba4a2493131` is historical. F5 seed `e126621f7c902b2af8fe251d127f1d0e5459200b`, tree `3a68781ad83727e45539493b2ad49bf9336db507`, task blob `05e5f9a7c2606a648cd185a0560cb841954c6f7c`. That seed is 4 ahead and 0 behind main. The F5 commit is one more, so 5 ahead and 0 behind if main is unchanged. Draft PR #979 records the review SHA and tree. The current-version test blob `a4b058c21f894ab64f044063f45b1d31845ace82` and custody storage blob `e9798d606309fa121cf4fb21a28cf15e191fd27d` stay frozen. Every later head invalidates this gate.

## Evidence

CI job `120529859925` on `a1da094e` reported `not ok` for this native test after 300002ms, `testTimeoutFailure`, before the docs commit cancelled the job. The corrected proof on `e9f66ada` passes in 119.9s, in 119.1s on one core, and in 120.7s inside the full suite. PostgreSQL 16.15, `hostedWrites: 0`. Those measurements show less repeated proof work and match the broader runner slowdown. No reproduced deadlock; exact old-run cause not established. The diagnostic still contains the damaged-review check: both the real match and the otherwise empty request refuse with `accepted_corpus_incomplete`, and the untouched corpus succeeds after rollback. Historical local `npm test` on `e9f66ada`: 7098 tests, 7094 pass, 0 fail, 4 skips, exit 0. That local skip count is not the hosted count. Hosted CI on F4 head `1e7459b7`, run `40002295282`, was 7121 tests, 7117 pass, 0 assertion failures, 2 cancelled, 2 skips. `tsc --noEmit` PASS on that head. Build, lint and hygiene were not re-run there.

Focused native proof of the integrated F3 test: PASS, 120236.681862ms, PostgreSQL 16.15, `hostedWrites: 0`. Historical PR CI `39994517447` later passed the same test in 273762.711987ms. Post-merge CI `39997551343` timed out at 300004.537475ms with no terminal diagnostic. Those runs do not bind the repair head. No reproduced deadlock; exact old-run cause not established.

Focused native proof of the F4 test: PASS, 101564.501414ms locally and 228091ms in CI `40002295282`. That same run failed the unchanged custody parent at 240003.457393ms. Those results do not bind the F5 head. No unique custody-timeout cause is claimed.

Focused native custody proof of the F5 test: PASS, 93552.077094ms, PostgreSQL 16.15, `hostedWrites: 0`, all 12 named checks. Stage 4 no longer has a second publish/bind success. Stage 6's final retry is the idempotent proof and keeps one current read and one archive read. The 240000ms and 300000ms limits were not raised. F5 CI and Preview are pending. No local full suite and no second F4 lookup run.

Commands and the non-authoritative diagnostic are in `docs/OFFICIAL_TRUTH_CURRENT_VERSION_LOOKUP_1_STATUS_2026-10-23.md`.

## P0–P3

- P0: none observed in the local F5 custody proof.
- P1: none against baseline main `76a30c5694bc7bd0dfb20544eb05a6c884c51576`. A later main move is new drift and is not integrated here.
- P2: hosted migration remains UNAPPLIED.
- P2: F5 CI and Preview are pending. Local custody time 93552.077094ms does not prove the runner finishes under 240000ms. Earlier hosted custody runs had only about 6–8 seconds of headroom, and one exceeded 240000ms.
- P2: no unique cause of that timeout is established. Neither native parent limit was raised.
- P3: historical local suite evidence had 4 skips. Hosted F4 CI had 2 skips and 2 cancelled tests. This head has no new full-suite count. Lint was not re-run.

## Next actor

Technical Lead, exact-head review of Draft PR #979. No follow-up slice is dispatched from here.
