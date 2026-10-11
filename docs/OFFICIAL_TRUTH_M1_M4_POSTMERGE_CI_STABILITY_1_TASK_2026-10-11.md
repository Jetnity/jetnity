# Official Truth M1–M4 — Post-merge actual-main CI stability correction 1

**Date:** 11 October 2026. **Parent engineering Issue:** [#927](https://github.com/Jetnity/jetnity/issues/927). **Product parent:** [#917](https://github.com/Jetnity/jetnity/issues/917), remains SOURCE_NOT_QUALIFIED. **Merged original PR:** [#928](https://github.com/Jetnity/jetnity/pull/928). **Baseline:** `main@bc5d7a98f78e4560785127d9a20d6ee99a78e438`, mode NORMAL. **This is a new forward-only Draft PR after a merge**, never an edit to merged history.

## Independent Technical-Lead failure evidence and reason for slice

Actual `main` **push** [Actions run 38142134697](https://github.com/Jetnity/jetnity/actions/runs/38142134697), exact baseline SHA, COM​PLETED FAILURE. Full **original Verify job 114477982326** read independently by TL: 6,326 tests / 819 suites, 6,317 pass, 7 fail, 2 cancelled, all confined to `lib/readiness/official-truth-original-custody.test.ts`. The first substantive failure `acknowledged commit fresh-reader full closure and exact encrypted original reproof` (83.7s) throws `LocalPgError` SQLSTATE `55000` in `bindCandidate` via `persistCandidate`. M1–M4 parent then reaches unchanged **240s**; remaining subtests are cancelled/parentAlreadyFinished cascades. Auth **original job 114477982172 PASS** 55 exact values / 243 keys; Mode, typecheck, lint PASS; schema/API/hygiene/build SKIPPED. Independent [TL failure receipt](https://github.com/Jetnity/jetnity/issues/927#issuecomment-6109767151). Prior PR CI 38139174775 success 6,326/6,326 only after an initial exact-author-HEAD timeout, so old PASS is not stable actual-main PASS.

**Hypothesis, not diagnosis:** `official_original_private.check_head` currently requires an independent heartbeat younger than **60 seconds** and emits `55000` for invalid witness/age/history. Under GitHub runner load the local `publishIntegratedBundle → bindCandidate` phase might overrun a valid checkpoint. Other explicit `55000` paths exist; prove the actual source before changing production-contract behavior.

## Exact logical implementation writer and ownership

**Only permitted proposed coder:** **Jetnity Official Truth CH-DE Source-to-Workspace V2 1 — Codex Generation 1**, **same existing Codex Desktop session** as the just-merged source slice, if safely resumable. This is the immediate post-merge review-fix continuation with a NEW forward-only branch/PR; the original #928 is immutable. Do not invent a new Codex agent, rename generation or claim session resumed based solely on this Task or GitHub comments. **No writer is running at Task seed.** Codex may commit and push only to this new branch AFTER actual manual/session dispatch. Cursor or GitHub Copilot is not an automatically authorized substitute. Single code writer per branch.

## Acceptance (ST01–ST12)

**ST01 – Fresh baseline:** Read `JETNITY_START_HERE.md`, TL standard, live mode/main/#751/#927/#748 and last original R4; verify branch exact head, merge-base, ahead/behind, active writers and bounded diff. Stop for conflicts/drift; no blind rebase or merge.

**ST02 – Genuine reproducible diagnosis:** Independently reproduce or convincingly isolate native PostgreSQL16 CI error path with sanitized phase markers, SQLSTATE (not secrets), relative timings and recorded parent timeout. Distinguish: cursor/checkpoint expiry; head/history mismatch; lock contention; stale transaction; SQL source/unavailable, fixture recency; and runner parallelism. A bare `55000` cannot be called proven heartbeat expiry without evidence.

**ST03 – Preserve fail-closed security:** Keep 60s independent heartbeat/restore quarantine, ordered revocation/withdrawal, lock serialization, native PG RLS/FORCE RLS/privileges, accepted-review provenance/Rule linkage, body fingerprint/crypto/custody, idempotency and current read protections. Never widen source admission, trust caller DTO, mint Visa truth or change `requirementsProviderAus()`.

**ST04 – Minimal repair:** Implement the smallest deterministic, scope-faithful performance/fixture-lifecycle correction. Prefer test/proof performance and scheduling controls that do NOT relax safety. If a database/security/SQL semantic change, global CI workflow concurrency change, or 60s/240s timeout change appears necessary, STOP and submit an exact TL arbitration packet with evidence. Never silently raise thresholds or hide a failure.

**ST05 – Instrument safely:** New diagnostic output must be deterministic, redacted and bounded. Do NOT log passwords, project IDs/tokens, raw government response, local personal paths or ciphertext/keys/connection strings/SQL parameters; no verbose 3MB log artifact committed or runtime telemetry costs. No sensitive evidence in PR.

**ST06 – Native adversarial guards:** Explicitly test that known-stale/mismatched independent witness still refuses; all original negative tests (ACL, rollback, corrupt bytes, immutable history, concurrent reader/revocation, restore quarantine, expiry) remain effective. Synthetic `regulations.example` only. NO production accepted Rule/provenance source activation.

**ST07 – Stability demonstration:** Run native targeted M1–M4 proof repeatedly at least 3 times, then full suite with `npm test` exactly as CI runs. Use observable durations and CI or equivalent workload contention; if intermittent failures remain, report CHANGES REQUIRED instead of a flaky PASS. No test.skip/only or swallowed errors. Ensure 6,326 tests / 819 suites baseline count unless valid narrow test additions are documented.

**ST08 – Exact-head complete CI:** All mandatory GitHub Actions Verify + real Auth checks must complete, including Typecheck, Lint, schema/API/hygiene and Production Build; matching Vercel Preview READY for current author head. Any pushed new head invalidates previous gates. Local tests alone are not TL CI PASS.

**ST09 – Post-merge gate:** After independent TL review and merge, actual `main` `push` workflow (not PR ref) MUST pass on exact new merge SHA; issue #927 remains OPEN until this is independently verified. Additional repeated-check evidence desirable given two failures. Do not self-close #927.

**ST10 – Non-scope:** No Supabase hosted Dev/Production SQL/data/migrations, no Auth/RLS/MFA roles, no secret/provider/api activation, no actual official-source content registration/retention, no Owner AAL2 rule promotion/F8/visa, no public indexing/launch, no work on blocked #913, no package/lock/dependency fixes disguised as stability, no unrelated Trip Workspace feature changes. Infra incremental recurring spend = USD0; respect <=USD100/month.

**ST11 – Reporting:** Task-scoped PLAN, STATUS, REPORT, SELF_REVIEW, HANDOFF in `docs/OFFICIAL_TRUTH_M1_M4_POSTMERGE_CI_STABILITY_1_*.md`; minimal sanitized evidence, exact commits, branch, native PG version, failure/passes/attempts, phase durations, changed-file inventory and independent reproduction method. Update #927 technical notes as directed; do not edit #751 canonical state autonomously or claim TL PASS.

**ST12 – STOP:** Stop after pushed repair, completed author handoff, all author-only local gates, exact PR CI/Preview evidence and an explicit request for independent Technical-Lead review. **DO NOT mark Ready, DO NOT merge, DO NOT launch follow-up.** If fix impossible within boundaries: return precise BLOCKED / TL arbitration packet; never dilute security.

## Initial allowed touchpoints

- `lib/readiness/official-truth-original-custody.test.ts` native proof harness, plus narrowly owned diagnostic/proof helper if justified.
- `scripts/db/official-truth-original-custody-1/storage.ts` ONLY when diagnosis establishes a minimal transport/producer issue without altering public/server trust contract.
- New `docs/OFFICIAL_TRUTH_M1_M4_POSTMERGE_CI_STABILITY_1_*.md` and sanitized evidence under `docs/evidence/official-truth-m1-m4-postmerge-ci-stability-1/`.
- Protected `supabase/migrations/20261011111839_official_truth_original_custody_lifecycle_1.sql`, `.github/workflows/ci.yml`, `package.json`, `package-lock.json`, shared production source/provider/legacy schema and test runner settings are NOT within default edit scope. Escalate for TL arbitration BEFORE touching them.

## Review boundaries

Current Production Vercel is READY code-only, not proof of passing main CI. New SQL artifacts `20261010180000` and `20261011111839` still hosted UNAPPLIED. Research S3 Bern/S1 AA remains SOURCE_NOT_QUALIFIED. #913 is platform safety BLOCKED. G7 separate npm-audit reachability remains OPEN (19 advisories/3 production highs). Resolve these only in separately scoped, approved efforts. Historical successful review #5483417695 is valid on code-only #928 author HEAD but does **not** approve the failed actual-main push gate or new repair code.

**Task seed state: SCOPE APPROVED BY TECHNICAL LEAD FOR A DORMANT DRAFT; NOT STARTED / NOT CODE PASS / NOT READY / NOT MERGED.**
