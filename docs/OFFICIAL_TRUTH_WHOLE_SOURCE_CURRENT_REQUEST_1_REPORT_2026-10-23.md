# Official Truth Whole-Source Current Request 1 — REPORT

**Cursor-Agent: Jetnity Official Truth Whole-Source Current Request 1 — Cursor Generation 1**

Date: 23 October 2026. Draft PR #985. Code-only. Not Technical-Lead PASS.

## Status

Partly finished as engineering on this branch. Blocked for real source, hosted readback, retention, and production. Ready and merge were not set.

## Implemented

A dormant Protocol 3 current-request path through the existing reader, retrieval, Evidence, review, extractor, and CH-DE application pilot. Caps are 393216 raw UTF-8 bytes and 393216 UTF-16 units. The new hash domain ends in one U+0000. The Fedlex tuple is a code-owned policy with no compiled profile, contract, or extractor. Protocol 3 is refused before store, bundle, custody, reproof, composition, and the other historical writers. V1/V2 caps and constructors stay in place.

## Tests

Synthetic 371444 and 393216 bodies passed the transpiled existing pipeline. Boundary, encoding, framing, redirect, clone, live-registry, and history-spy tests passed. Existing application, retrieval, identity, review, and extractor tests passed. See STATUS for the command table. Three environment or already-fixed failures are named there. One existing native-PG test skipped because no database was provided.

## Build

R1 re-ran `npm run typecheck` (exit 0), `npm run lint` (exit 0, 0 errors, 146 warnings), and `npm run build` (exit 0). Dead-code, export, dependency, API-protection, and operating-mode checks passed. `check:schema-bezug` exits 0 after `Buffer.from('a')` and `Buffer.from('x')` were rewritten to `Buffer.alloc` of the same bytes. On head `385a621e` those literals matched the schema scanner as unknown tables, so the earlier exit-0 claim for that head was wrong. The scanner script was not edited.

## Security

No new route, secret, service-role path, or RLS change. Protocol 3 cannot be stored, replayed, or composed. The live registry cannot select the larger cap. Caller byte budgets are rejected as authority. No personal data and no traveller credential were added. The synthetic visa-shaped result exists only in the test module copy.

## Database

No migration. No SQL change. Custody still throws before query when a protocol-3 marker is present. Local PostgreSQL 16 was not available.

## Documentation

Task-owned PLAN, CONTRACTS, INVENTORY, STATUS, SELF_REVIEW, HANDOFF, and this REPORT. The TASK file and the global status, architecture, roadmap, and decision files were not edited.

## Cost

No new running cost. No provider call.

## Remaining risk

Real source access, #917 readback, legal qualification, and retention stay open. R1 accepted `http_failed` for framing, length mismatch, and duplicate raw headers. The response buffer is 393216 bytes. The hash preimage of 393216 NUL characters is about 2.36MB, so this is not a 384KiB total-memory claim. `lib/readiness/official-truth-autonomous-review-material-server.ts` stays read-only and has no protocol field. Fresh `origin/main` is `e372f4d830c35a74a235d345c2baaf08ab615e6c`. This branch is 5 ahead and 15 behind, merge-base `ba0725d6dd2ce3d5e170eb1eab03cedef2def1de`. The extra main commits are lodging PRs #984 and #983. No allowlist overlap. This branch was not rebased. CI and Preview on head `385a621e` do not cover the R1 head.

## Next step

Independent Technical-Lead re-review of the R1 head in the PR comment. Every new head invalidates earlier gates. Do not mark Ready. Do not merge. Do not start a follow-up.
