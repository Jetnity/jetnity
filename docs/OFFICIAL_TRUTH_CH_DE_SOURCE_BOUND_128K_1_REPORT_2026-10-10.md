# CH→DE Source-Bound 128 KiB Retrieval 1 — Report

## Disposition

**Transport engineering: author-local checks pass; exact-head CI remains authorization-blocked. Source: `SOURCE_NOT_QUALIFIED`.**
This is not an independent Technical Lead review, source/legal approval, public
activation, or merge authorization.

## Changes

- Kept an exact Bern representation candidate, but its privileged server-owned
  size selection is dormant: the compiled identity-profile registry has no Bern
  profile. A private authorization is required from the direct live loader, and
  the profile object must be the exact object in the compiled registry.
- All injected-catalog/profile and other non-authorized paths retain the
  unchanged 65,536-byte cap. A separate byte-only bounded transport utility,
  capped absolutely at 131,072 bytes, is tested synthetically and cannot emit a
  source identity or retrieval envelope.
- Removed the alternate direct-SHA path. `sourceContentHash` uses only
  `evidenceQuellenFingerprint`; a snapshot it cannot carry fails as
  `invalid_source_snapshot` and produces no trusted retrieval envelope.
- Reject malformed/comma-joined Content-Length before body reads; valid short
  and absent lengths remain protected by actual streamed-byte accounting.
  Unknown/duplicate media parameters, compressed/conflicting encodings, invalid
  charset, BOM and unsafe redirects fail closed; DNS/TLS/timeout guards remain.
- Added synthetic boundaries, fake-profile default-cap refusals, canonical
  fingerprint-boundary, malformed/conflicting-header, oversized-chunk and
  cancellation tests.
- Added only the exact new policy-module path to the finite content-identity
  importer test inventory, with an adversarial `.evil.ts` lookalike refusal.
  This preserves the guard scope and satisfies SB29.
- No database/API/UI/provider/source-registry/profile-registry or production
  activation change was made.

## Test outcomes

- Focused correction suites:
  `node --import ./scripts/server-only-test-register.mjs --import tsx --test lib/readiness/official-truth-content-identity.test.ts lib/readiness/official-truth-server-owned-retrieval.test.ts lib/readiness/official-truth-bounded-response-body.test.ts`
  — **93 passed, 0 failed, 0 skipped**.
- TypeScript: `npm run typecheck` — passed after the R1 correction.
- Full suite:
  `node --import ./scripts/server-only-test-register.mjs --import tsx --test --test-concurrency=1 "lib/**/*.test.ts" "scripts/operating-mode-guard.test.mjs"`
  — **6,268 passed, 0 failed, 0 skipped; 818 suites** (810,179 ms).
  Real disposable PostgreSQL 16.15 R3 passed 1,008 codec comparisons; the
  synthetic R2 primary/composed semantic-publication proof passed with fresh
  readback. Structural-storage proof passed, while its distinct integrated
  receipt roundtrip remained `NOT_VERIFIED` and full semantic publication
  remained `BLOCKED`. Production activation and hosted apply were false.
- The first corrected full-suite attempt found one failure in the finite
  content-identity importer search: the new policy module was not yet in the
  exact allowed-path inventory. The run was stopped; only that exact path and
  `.evil.ts` refusal assertions were added. The focused guard/regression set
  and complete serial suite above then passed. No existing assertion was
  removed or weakened.
- The initial pre-correction full-suite run used parallel test execution while other validation
  competed for the single-CPU sandbox: **6,262/6,264 passed**; two native
  PostgreSQL checks timed out with SQLSTATE `57014`. The prior-head serial rerun
  passed all tests; no test was skipped or weakened.
- Lint: `npm run lint` — passed with 144 warnings and zero errors; no warning
  referred to the changed retrieval files.
- Production build: `npm run build` — passed. The setup precheck noted absent
  `.env`/`.env.local`; build output also noted no cache and stale Browserslist
  data. No secret was required or added.
- `npm ci` — passed, with no dependency changes; npm reported 19 existing audit
  findings (2 moderate, 17 high).
- Setup/API/schema/dead-code/export/dependency and operating-mode checks passed.
  The operating-mode check first could not compare because this shallow clone
  lacked local `main`; fetched the exact approved `main` commit and enough
  in-scope branch ancestry for comparison only, without merging. `check:schema-bezug`
  emitted existing LOCAL/UNAPPLIED RPC notices and exited successfully.
- An initial targeted invocation before dependency installation failed to locate
  `tsx`/`next`; `npm ci` restored the lockfile dependencies. The first focused
  run after header hardening caught one fixture missing a required Content-Type;
  the fixture was corrected and the focused rerun passed.
- Exact code/test-head `f5f0c21af694e5f91b662488db8efc839533557b` (tree
  `4a617583bc53c600a1071d6e5541affc14380ee6`) CI run `38066022947` is
  `action_required`; Actions reports zero jobs and the failed-job log request
  confirms `total_jobs: 0`. This is an unresolved GitHub authorization gate,
  **not a CI pass**; no retry or security bypass was attempted. Earlier
  implementation-head runs are likewise not evidence of a passing CI.
  Seed-head run `38038004927` passed but does not validate implementation
  changes.
- The prior correction head `167bb9e4bb1ee613b1757934e67dbf52d51158f4` had a
  successful `Vercel Preview Comments` check, which is not evidence of a deployed
  Preview or Auth approval. Preview/Auth acceptance for the final head and
  independent Technical Lead review remain separate gates; no PASS is claimed.
- Final parallel validation was invoked on the code/test head. No review findings
  were returned, but the Code Review engine could not start because its configured
  `claude-sonnet-4.6` model was unavailable; it is **not an independent review**.
  CodeQL was skipped because the database was too large. Neither is claimed as a
  completed review/scan. A documentation-only handoff update followed; the exact
  verified code/test head/tree are recorded above.
- PR #920 remains open and Draft. No Ready, merge, Production action, source
  qualification, or follow-up was performed.

## Source, legal, privacy and operations

The official Bern page was not fetched or parsed during this implementation.
The task and prior #918 research provide a one-time body-size observation only.
Current page identity, page-wide privacy, legal text/scope, operative references,
effective period, exception completeness and source ownership remain unverified.
No live source retrieval, content body, body hash, or legal fact is included in
the test fixtures or this report.

The current code-owned identity profile registry contains GOV.UK only. A
candidate Bern catalog tuple without a separately registered profile fails
before DNS/HTTP. No Supabase access/write, migration, RLS/Auth, new dependency,
secret, paid service, recurring cost or public result was added. Monthly
infrastructure remains unchanged.

## Sanitization

`docs/evidence/official-truth-ch-de-source-budget-128k-1/manifest.json` records
only synthetic case names, byte boundaries and expected dispositions. It
contains no raw source content, content hash, person data, resolved IP, machine
path, credential or live-network observation.
