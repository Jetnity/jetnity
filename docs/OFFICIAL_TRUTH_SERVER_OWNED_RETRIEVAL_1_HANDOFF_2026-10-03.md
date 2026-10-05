# Official Truth Server-Owned Official Retrieval Boundary 1 — Handoff

Date: 3 October 2026
Issue: #776
Draft PR: #777
Branch: `fix/official-truth-server-owned-retrieval-1`
Baseline: `main@b4b2e001914ce82c8c195bc03b074623565a5b7b`
Implementation commit: `622f86fcbd2388a0655967ab41bebc102e45ad4b`
Type signature commit: `398cefacc6c8cafb72970da455b970f172784643`
Technical-Lead review head that required changes: `80d2be4c977fb828aadc0e9121e76979528325cd`
Port and fragment remediation: `eaf831519b2bce10c4bc54a80fa508d03ce2cc0f`
Logical agent: **Jetnity Official Truth server-owned official retrieval boundary 1**
Generation: **1**
Session: https://cursor.com/agents/bc-61eb7c94-41ab-4d04-ad39-8dde4d7cd8b6
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

Read `docs/OFFICIAL_TRUTH_SERVER_OWNED_RETRIEVAL_1_REPORT_2026-10-03.md` and then this handoff. The task file was not rewritten. `docs/ACTIVE_WORK_STATUS.md` was not edited because the task forbids global current-state files. This handoff is the continuity record.

## Current state

The review head is the branch tip after the remediation documentation commit. Re-fetch `origin/fix/official-truth-server-owned-retrieval-1` before review. Do not review `80d2be4c` or `eaf83151` as the tip once this documentation commit is pushed. The independent review of `80d2be4c` is CHANGES REQUIRED. R1 and R2 are implemented in `eaf83151` and are waiting for a new exact-head review.

At the remediation gate run, `origin/main` was `b4b2e001914ce82c8c195bc03b074623565a5b7b`. The branch was 0 behind it. Re-fetch main before review and do not treat a later main SHA as already integrated.

Machine mode is `NORMAL`. This slice does not edit `.jetnity/operating-mode.json`.

## Contract the next reader must keep

`loadOfficialTruthServerOwnedRetrieval(eingabe)` is the only live entry. It takes the caller proposal and nothing else. `decideOfficialTruthServerOwnedRetrieval` is the test seam. A route that calls the seam, injects a catalog, clock, resolver, or HTTP client, or returns the success object reopens the boundary.

The caller may pass `sourceId` and `url`. The catalog row is the source. The URL must resolve to that same `official_authority` id through `quellenUrlAufloesen`. Licensed providers stop before the network.

A catalog hostname authorizes only the default HTTPS port. Explicit `:443` is allowed and canonicalizes to the portless URL. Any other explicit port fails as `non_default_port` before DNS, on the first URL and on every redirect. Do not restore a 1..65535 port check. A real authority that needs another port needs a versioned catalog allowlist, not a caller URL.

Remove the fragment before registry validation, tracking checks, redirect-loop identity, and the network call. The success `canonicalUrl` is the fetched URL and has no fragment. A redirect that changes only the fragment is the same request and must not create a second connection or bypass the loop check. Do not strip functional query parameters. Tracking query parameters still fail.

The connection lookup is the DNS check. Do not add a separate preflight resolver and then call `fetch`, which would resolve the name again. Manual redirects only. Five is the maximum followed. Each hop must keep the same `sourceId`, the default port, and the address gate. The body ceiling is 65,536 bytes. UTF-8 is fatal. The hash is `evidenceQuellenFingerprint` of the decoded snapshot. `retrievedAt` is the server clock after that validation.

The frozen success object is not `retrieved_material`. `officialTruthAbgerufenMaterialPruefen` remains the historical submitted-material receipt. Do not delete it in this line of work, and do not let an extractor read its caller snapshot. Only this server-owned result may later feed deterministic extraction. That integration is not authorized here.

The boundary does not collect citizenship, documents, residence, or route. It does not rank credential options.

## Files

- `lib/readiness/official-truth-server-owned-retrieval.ts`
- `lib/readiness/official-truth-server-owned-retrieval.test.ts`
- `docs/OFFICIAL_TRUTH_SERVER_OWNED_RETRIEVAL_1_REPORT_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_SERVER_OWNED_RETRIEVAL_1_HANDOFF_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_SERVER_OWNED_RETRIEVAL_1_SELF_REVIEW_2026-10-03.md`

No other product file was edited. The task file stays as assigned.

## What is not authorized

No Ready. No merge. No follow-up slice. Do not start an extractor or F8. Do not call `regelKandidatAkzeptieren`. Do not call either store writer. Do not add an endpoint. Do not apply the catalog or the store. Do not touch #626. Do not select a provider. Do not store the snapshot. Do not treat this object as Official Truth or as a capability that can be replayed on a later request.

## Validation already recorded

Remediation gates on `eaf83151`, before this documentation commit: focused retrieval tests 25/25. `npm test` 4512 pass / 2 fail / 765 suites, 4514 tests. The two failures are the existing throwaway PostgreSQL proofs, both `initdb ENOENT` at `/usr/lib/postgresql/16/bin/initdb`. They did not run SQL. Typecheck pass. Lint 0 errors and 148 pre-existing warnings. Production build pass on Next.js 16.3.8 with 25 static pages. Hygiene checks pass. `git diff --check` pass. No remote database. Nothing was applied. Exact-head CI and Vercel belong to the pushed tip, not to this text.

The earlier 23/23 and 4510/4512 record belongs to `80d2be4c` and does not include the port or fragment tests.

## Next step

Independent main-chat Technical-Lead re-review of the exact branch tip. Cursor does not Ready or merge. Do not start a follow-up slice.
