# Official Truth Current-Version Lookup 1 — HANDOFF

Date: 23 October 2026 (Europe/Zurich)
Issue: #975
Draft PR: #976
Branch: `feat/official-truth-current-version-lookup-1`
Writer: **Jetnity Official Truth Current-Version Lookup 1 — Cursor Generation 1**
Session: https://cursor.com/agents/bc-16e2789c-fc9b-4bbc-925b-ba43273b6cc3
Actual model: `grok-4.7-high-fast` (Product Owner acceptance: https://github.com/Jetnity/jetnity/issues/751#issuecomment-6368365938)

**STOP.** This handoff requests independent Technical-Lead review. It does not mark Ready, does not merge, and does not start a follow-up slice. Immediate fixes stay with this writer and session.

## Implemented local lookup

Exact canonical cell definition, scope, fact kind and requirement type resolve to at most one currently usable retained receipt. The caller supplies the external lifecycle witness and does not supply a fingerprint. Completeness of the accepted event, binding, review and receipt set is proved before identity filtering. Before provenance hashing and before that filter, every accepted receipt also proves its protected review packet key and ordered original-support metadata. Ambiguity, damaged competitors, unknown completeness and count or byte overflow refuse the lookup. The unique fingerprint is then passed to the existing `readCandidate`, which keeps the lifecycle SHARE lock and opens the separate archive snapshot.

The result is local and non-authoritative: `productionAcceptedRead: NOT_AUTHORIZED`, `positiveVisaCells: 0`, `reusablePositiveCache: false`. Freshness is the witness plus `read_at`. It is not a reusable positive cache, an OfficialEvaluation, a key, or an original body.

## Still unimplemented

Real-source and government calls, hosted database access or migration apply, #917 readback and any alternate route, legacy accepted-claim bridging, provider or pilot activation, retention and key hosting, and Production acceptance are not implemented. The synthetic corpus remains `https://regulations.example/rules/{primary_rule|composed_effect|composed_mode}`.

## Exact refs before this documentation commit

- F2 implementation head `e9f66adaa79a5c690303481decaa7341187633f7`
- Tree `681d89dbf2f35551fd1dd336b2d553a40b5254ea`
- Merge-base with current origin/main `5269b9192a2300c6c03fc8659964583130d2d1d1`
- origin/main `8ec8e8ed8a63781fa88ece617b17f382340b6645`
- 13 ahead / 26 behind at that implementation head
- Mode `NORMAL`
- Immutable blobs V1 `d74d6f3e88eec0fe807cc57a71913235dfc572bd`, V2 `2e20181849d5575b440fcec004b521e562775751`, V3 `2f304122b59bba6bdb5f0bbb86fba46b139d3add`

The Technical Lead cited main `8f64d5fdb819065791235879822b1074205899c0`. Current origin/main contains that commit and the later merges of #972, #973, #974 and #978. No overlapping paths. Not rebased. The review head is the commit that updates these documents. If origin/main stays at `8ec8e8ed8a63781fa88ece617b17f382340b6645`, that head is 14 ahead and 26 behind. The PR states that SHA. Every later head invalidates this gate.

## Evidence

CI job `120529859925` on `a1da094e` reported `not ok` for this native test after 300002ms, `testTimeoutFailure`, before the docs commit cancelled the job. The corrected proof on `e9f66ada` passes in 119.9s, in 119.1s on one core, and in 120.7s inside the full suite. PostgreSQL 16.15, `hostedWrites: 0`. The diagnostic still contains the damaged-review check: both the real match and the otherwise empty request refuse with `accepted_corpus_incomplete`, and the untouched corpus succeeds after rollback. Full `npm test` on that head: 7098 tests, 7094 pass, 0 fail, 4 pre-existing skips, exit 0. `tsc --noEmit` PASS. Build, lint and hygiene were not re-run; this diff does not change application runtime. The test timeout was not raised.

Commands and the non-authoritative diagnostic are in `docs/OFFICIAL_TRUTH_CURRENT_VERSION_LOOKUP_1_STATUS_2026-10-23.md`.

## P0–P3

- P0: none observed.
- P1: main is 26 commits ahead of the baseline, at `8ec8e8ed8a63781fa88ece617b17f382340b6645`. Disjoint from this diff. Technical Lead owns integration.
- P2: hosted migration remains UNAPPLIED; the fingerprint must not be cached as a positive decision.
- P2: CI and Preview must be read on the final head. Older Preview comments do not bind it.
- P3: pre-existing lint warnings and four pre-existing skips.

## Next actor

Technical Lead, exact-head review of Draft PR #976. No follow-up slice is dispatched from here.
