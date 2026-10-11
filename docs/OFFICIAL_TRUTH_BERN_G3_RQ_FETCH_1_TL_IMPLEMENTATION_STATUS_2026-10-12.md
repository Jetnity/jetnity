# Jetnity G3-RQ-FETCH-1 — direct Technical Lead code-only implementation checkpoint

**Date:** 12 October 2026. **Parent:** #917 remains SOURCE_NOT_QUALIFIED.
**Child:** #934 OPEN. **Draft PR:** #935 remains NOT READY.
**Explicit Product Owner approval:** #917 comment 6114368313 (A code-only plus B one conditional later real Bern S3 request).
**Task:** docs/OFFICIAL_TRUTH_BERN_G3_RQ_FETCH_1_TASK_2026-10-12.md, immutable Git blob fc4a2db0fd9a3ee552ce6da212d696ee38ef8135.
**Baseline main:** f48b01eba499186bdf52e13b2d7b398383507f84; NORMAL.

## Why work continued directly

Both Codex and GitHub Copilot reported exhausted credits. Copilot STOPPED correctly at A03 and published only documentation. Technical Lead independently rejected a design that would have put Bern research inside the existing trusted Official Truth admission path (R1 review 5485310658). The TL first preserved Copilot docs on the existing branch without force, then recorded the strictly additive corrected A03 scope at PR #935 comment 6114751328.

**This subsequent code is authored DIRECTLY by the Technical Lead using the connected GitHub repository API, not by a separate coding agent.** The result MUST NOT be described as an independently reviewed agent implementation merely because the TL wrote or studied it. Independent exact-code Security review and full CI/Auth/Preview still required for FINAL PASS/merge, with no fake self-approval.

## Current code-only change inventory (subject to CI and exact-head review)

- Additive protected module change:
  `lib/readiness/official-truth-server-owned-retrieval.ts`:
  maintains BODY_MAX=65536 and original trusted decideServerOwnedRetrieval, profile, LIVE_PRIVILEGED_TRANSPORT paths unchanged; adds optional native IncomingMessage.complete reader-only witness to the HTTP client response and strictly separate, fixed-target `bern_research_only` implementation.
  New research uses the same physical serverDns/serverHttp/HTTPS/TLS/certificate/pinned DNS/SSR F defenses, existing hopLesen and bounded stream reader. Research has zero source catalog, identity profile, Evidence, accepted Rule or law-validity output.
- New synthetic/adversarial research-only tests:
  `lib/readiness/official-truth-bern-g3-rq-fetch-1/research-only.test.ts` and `cli.test.ts`. Includes byte/declared-length mismatch and HTTP framing complete evidence, exact 131071/131072/131073 boundaries, private/mixed DNS, one GET no follow, timeout and early cancellation, protected default 65536 invariant and conservative blocked output.
- New manually gated standalone developer-only CLI:
  `scripts/official-truth-bern-g3-rq-fetch-1/run.ts`. Normal CLI with zero arguments yields NOT_RUN. A live request is impossible without the operator's explicit opt-in, current matching reviewed main SHA, a sanitized Issue #934 ATTEMPT_CONSUMED comment ID, and an atomic local reservation marker before the request; library backstop enforces one in-process attempt. This does not independently validate an arbitrary provided GitHub comment ID; the Technical Lead must inspect and record that Issue comment before executing B.

## Mandatory blockers that remain

- **PHASE A TEST/REVIEW PENDING:** exact final code HEAD GitHub CI Verify/Auth, native PostgreSQL16 M1–M4, 6455+ tests, Typecheck, Lint, API/Schema/Hygiene, Production Build, Vercel Preview. The first checks may fail; any new HEAD invalidates older checks. No READY/MERGE until fully reviewed. The TL himself authored the code; ensure independent Security review rather than self-certifying.
- **PHASE B PHYSICAL NETWORK NOT RUN**: zero Bern origin requests, no use of reviewed CLI, no real 128KiB source imported, and no consumed approval. A live one-shot may only be performed after A code passes independently and after postmerge, with TL publishing sanitized ATTEMPT_CONSUMED to #934 *before* a single authorized execution. If tooling cannot run the exact protected code, STOP; do not substitute web/browser/curl.
- **No source acceptance**: the return type is permanently `bern_research_only`, never government official source identity/current, trusted retrievedAt, fingerprint, raw HTML sourceSnapshot, Evidence/Rule, Provider/F8 or positive Visa.
- Parent #917 OPEN, Requirements Provider NULL, Visa UNKNOWN. #913 separately privacy/safety BLOCKED. No Supabase Hosted Development/Production migration or Auth/RLS/AAL2.
- **Risks:** known P2 native-PG16 M1–M4 CI runtime volatility (historically up to ~234/240s); G7 19 npm advisories (17 high, 2 moderate, including production sharp/source-map-js/ws), reachability unresolved. No automatic upgrade or running costs.

## STOP / operating procedure

The current PR may be debugged and hardened code-only through normal GitHub CI, but no live Bern call, no Ready and no Merge until an independent, exact HEAD Security and CI/Preview gate. No automatic child/follow-up slice. All durable gates and owner approvals remain in parent #917, engineering #934, current status #751 and linked PR #935.
