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

Exact canonical cell definition, scope, fact kind and requirement type resolve to at most one currently usable retained receipt. The caller supplies the external lifecycle witness and does not supply a fingerprint. Completeness of the accepted event, binding, review and receipt set is proved before identity filtering. Ambiguity, damaged competitors, unknown completeness and count or byte overflow refuse the lookup. The unique fingerprint is then passed to the existing `readCandidate`, which keeps the lifecycle SHARE lock and opens the separate archive snapshot.

The result is local and non-authoritative: `productionAcceptedRead: NOT_AUTHORIZED`, `positiveVisaCells: 0`, `reusablePositiveCache: false`. Freshness is the witness plus `read_at`. It is not a reusable positive cache, an OfficialEvaluation, a key, or an original body.

## Still unimplemented

Real-source and government calls, hosted database access or migration apply, #917 readback and any alternate route, legacy accepted-claim bridging, provider or pilot activation, retention and key hosting, and Production acceptance are not implemented. The synthetic corpus remains `https://regulations.example/rules/{primary_rule|composed_effect|composed_mode}`.

## Exact refs before the documentation commit

- Implementation head `4578052e0f4dbf9b3df883c6a5e79a308ba03557`
- Tree `d08308c1137aead3fe13166cdb47cfa24ac21cfa`
- Merge-base with current origin/main `5269b9192a2300c6c03fc8659964583130d2d1d1`
- origin/main `de169965f8318a46bdd350eb14df88b0682fc803`
- 9 ahead / 13 behind
- Mode `NORMAL`
- Immutable blobs V1 `d74d6f3e88eec0fe807cc57a71913235dfc572bd`, V2 `2e20181849d5575b440fcec004b521e562775751`, V3 `2f304122b59bba6bdb5f0bbb86fba46b139d3add`

Main drift is the merge of #972 and #973. No overlapping paths. Not rebased. The review head is the commit that adds these documents; the PR states that SHA. Every later head invalidates this gate.

## Evidence

Native PostgreSQL 16.15 proof PASS (`hostedWrites: 0`). Full `npm test` PASS: 7098 tests, 7094 pass, 0 fail, 4 pre-existing skips. Typecheck PASS. Build PASS. Hygiene checks PASS. Lint 0 errors, 146 pre-existing warnings.

Commands and the non-authoritative diagnostic are in `docs/OFFICIAL_TRUTH_CURRENT_VERSION_LOOKUP_1_STATUS_2026-10-23.md`.

## P0–P3

- P0: none observed.
- P1: main is 13 commits ahead of the baseline. Disjoint from this diff. Technical Lead owns integration.
- P2: hosted migration remains UNAPPLIED; the fingerprint must not be cached as a positive decision.
- P2: CI and Preview must be read on the final head. Older Preview comments do not bind it.
- P3: pre-existing lint warnings and four pre-existing skips.

## Next actor

Technical Lead, exact-head review of Draft PR #976. No follow-up slice is dispatched from here.
