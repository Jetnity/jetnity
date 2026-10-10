# CH→DE Source-Bound 128 KiB Retrieval 1 — Report

## Disposition

**Transport engineering: author-local focused pass. Source: `SOURCE_NOT_QUALIFIED`.**
This is not an independent Technical Lead review, source/legal approval, public
activation, or merge authorization.

## Changes

- Added a frozen code-owned exact Bern representation budget candidate with
  a 131,072-byte limit. All other tuples fall back to the unchanged 65,536-byte
  default.
- Replaced retained chunk arrays with a fixed-size bounded accumulator and
  used the selected per-hop limit for GET length and actual streamed bytes.
- Rejected compressed/conflicting content encodings, invalid UTF-8 charset,
  multi-valued media and UTF-8 BOM; retained existing DNS/TLS/redirect/timeout
  protections.
- Added synthetic candidate boundaries, default boundaries, spoofed/historical
  tuple refusals, absent production profile block, false-length/late-chunk
  refusals, cancellation, media/charset/encoding/BOM and redirect tests.
- No database/API/UI/provider/source-registry/profile-registry or production
  activation change was made.

## Test outcomes

- Focused retrieval suite:
  `node --import ./scripts/server-only-test-register.mjs --import tsx --test lib/readiness/official-truth-server-owned-retrieval.test.ts`
  — **40 passed, 0 failed, 0 skipped**.
- TypeScript: `npm run typecheck` — passed.
- Full suite:
  `node --import ./scripts/server-only-test-register.mjs --import tsx --test --test-concurrency=1 "lib/**/*.test.ts" "scripts/operating-mode-guard.test.mjs"`
  — **6,264 passed, 0 failed, 0 skipped** (1,433,739 ms). Native PostgreSQL
  16.15 R3 and R2 integrated synthetic semantic-publication tests passed
  (`integratedReceiptRoundtrip` and `fullSemanticPublication` verified). The
  separate structural-storage proof passed with its narrower fixture explicitly
  reporting semantic publication `BLOCKED`. These results concern synthetic
  fixtures only; they do not qualify the Bern source or create production truth.
- The first full-suite run used parallel test execution while other validation
  competed for the single-CPU sandbox: **6,262/6,264 passed**; two native
  PostgreSQL checks timed out with SQLSTATE `57014`. The serial full-suite rerun
  above passed all tests; no test was skipped or weakened.
- Lint: `npm run lint` — passed with 144 warnings and zero errors; no warning
  referred to the changed retrieval files.
- Production build: `npm run build` — passed. The setup precheck noted absent
  `.env`/`.env.local`; build output also noted no cache and stale Browserslist
  data. No secret was required or added.
- `npm ci` — passed without dependency changes; npm reported 19 existing audit
  findings (2 moderate, 17 high).
- Setup/API/schema/dead-code/export/dependency checks passed. The operating-mode
  check passed after fetching, but not merging, the exact approved main commit.
  `check:schema-bezug` emitted existing LOCAL/UNAPPLIED RPC notices and exited
  successfully.
- CI for the first implementation head, run `38061856864`, is
  `action_required` with zero jobs; its workflow-log request returned 404 because
  there are no job logs. Seed-head run `38038004927` passed but does not validate
  implementation changes. Implementation CI is therefore **not verified**.
- The exact implementation head has a successful `Vercel Preview Comments` check,
  which is not evidence of a deployed Preview or Auth approval. Preview/Auth
  acceptance and independent Technical Lead review remain separate gates; no PASS
  is claimed for them.
- Final review tools were invoked. A separate read-only code-review agent found
  no significant issues. The bundled parallel-validation Code Review could not
  start because its configured model was unavailable; CodeQL was skipped because
  the database was too large. Neither is reported as a completed scan/review.
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
