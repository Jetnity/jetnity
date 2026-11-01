# Official Truth Whole-Source Current Request 1 — HANDOFF

**Cursor-Agent: Jetnity Official Truth Whole-Source Current Request 1 — Cursor Generation 1**

Date: 23 October 2026. Stop for independent Technical-Lead review of Draft PR #985. Do not mark Ready. Do not merge. Do not start a follow-up slice. Immediate review fixes stay in this session and on this branch.

## Where the work is

- Branch: `feat/official-truth-whole-source-current-request-1`
- Issue #982, parent #917, PR #985
- Task blob: `b1371993e1e7f5b09ceebd4462325c1b94c3faba` (not edited)
- Session: `bc-45700535-8356-442d-aba6-1ed8373578fc`
- Model: `grok-4.7-high-fast`
- Fresh `origin/main`: `e372f4d830c35a74a235d345c2baaf08ab615e6c`
- Merge-base: `ba0725d6dd2ce3d5e170eb1eab03cedef2def1de`
- 5 ahead and 15 behind that main. The extra main commits are lodging PRs #984 and #983. No allowlist overlap. This branch was not rebased.

The exact final head and tree are in the PR comment on the commit that contains this file.

## What the next reviewer should re-gate

1. Read CONTRACTS, INVENTORY, STATUS, and SELF_REVIEW at this head.
2. Re-run the three new test files and the existing application, retrieval, identity, review, extractor, and history suites on this head.
3. Treat local PostgreSQL `initdb ENOENT` and `local_proof_connection_override_forbidden` as environment limits unless a database is intentionally provided. They are not a license to change the custody proof guard.
4. Read CI and Preview for this head only. An older preview does not cover it.
5. R1 accepted `http_failed` for protocol-3 framing, Content-Length mismatch, and duplicate raw header metadata. The bridge report enum was not amended.
6. Re-review the R1 head, not `385a621e70a4f15622dad9312a96ee79717a6f59`. That earlier head is invalidated.
7. Integrate or leave the five main commits. Do not treat this handoff as that integration. Main synchronization was not authorized by R1.

## Product boundary

The path is dormant. Production has no profile, no contract, and no extractor for the tuple. A real Fedlex GET, a hosted readback, a retained original, and a visa result are still prohibited. #917 Stage 2 remains `NOT_ATTEMPTED`. `positiveVisaCells` remains 0 outside the test-only module copy.

## Writer

Same writer for an immediate exact-head fix: Jetnity Official Truth Whole-Source Current Request 1 — Cursor Generation 1. A new logical slice needs a new generation.
