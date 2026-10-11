# Bern research quarantine 1 — implementation plan

Author: **Jetnity Official Truth Bern Research Quarantine 1 — GitHub Copilot Generation 1**.
Issue #932 / Draft #933. Parent #917 remains OPEN / SOURCE_NOT_QUALIFIED.

## Pre-edit reconstruction

- Branch head equals remote seed `c9a5bd73db42b4e270cd7d6613ff3172e2933f2f`; diff was TASK-only.
- No local Codex implementation bytes were present in this worktree (`git status` clean).
- Machine mode read: NORMAL.
- Reviewed required startup/governance docs plus #751, #917, #932, #933 and latest TL comments.

## Bounded implementation

1. Add a new isolated offline-only module at
   `lib/readiness/official-truth-bern-research-quarantine-1/offline.ts`.
2. Keep a separate non-authoritative result contract:
   `status: research_only_quarantine`, phases `not_run|blocked`, no trusted retrieval fields.
3. Hard-pin one exact Bern source tuple (`bern.diplo.de/.../2611474-2611474`) and disallow caller URL/profile authority.
4. Reuse the existing protected retrieval internals by calling
   `decideOfficialTruthServerOwnedRetrieval` with injected offline DNS/HTTP mocks and a fixed in-memory catalog snapshot.
5. Keep the default retrieval bound at 65,536 bytes; model a separate offline-only
   mock-body policy for a proposed 131,072-byte research cap that is not live-routable.
6. Add reserved one-shot permit semantics (future-only, consumed on first refused attempt, second call refused).
7. Add an offline-only runner script rejecting all runtime live flags.
8. Add adversarial tests for request authority injection, DNS/IP safety, redirects,
   scheme/port, status/timeout/compression/media/UTF-8/empty body, boundaries and publication fences.

## Scope and non-scope confirmation

- No edit to `lib/readiness/official-truth-server-owned-retrieval.ts`.
- No source registry/profile activation, no Supabase migration, no provider/F8/public visa,
  no #913 change, no recurring cost increase.
- No real HTTP requests and no raw HTML persistence.

## Verification plan

- New offline test file for Bern quarantine contract.
- Existing repository gates: setup/typecheck/lint/test/api/schema/dead/exports/deps/build/diff.
- Publish task-owned STATUS/REPORT/SELF_REVIEW/HANDOFF and sanitized evidence with
  `REAL_NETWORK_ATTEMPTS=0` and `RESEARCH_ONLY_NOT_QUALIFIED`.
