# GetYourGuide Visual Discovery Foundation 1 — STATUS

Date: 26 October 2026.
Author: Jetnity GetYourGuide Visual Discovery Foundation 1 — Cursor Generation 1.
Branch: `feat/getyourguide-visual-discovery-foundation-1`. Draft PR #1039. Tracking #1038. Parent #1023 V5.

This file records Review R1 corrections on the same branch. It is not a new generation and not a follow-up slice. The gate stays closed.

## Runtime

From cursor-cloud `run-info`, not from the dispatch text:

- Model: `grok-4.7-high-fast`
- Metadata source: cursor-cloud MCP `run-info`
- Session: https://cursor.com/agents/bc-301aaa79-6426-49bb-b534-3232a8a5ee9b
- Logical name: Jetnity GetYourGuide Visual Discovery Foundation 1 — Cursor Generation 1

Node used for the checks: v22.23.4.

Reviewed head that Root rejected for these defects: `3051d4d868bb4139f1dd5a9f70e3247bd084f8cd`. The exact corrected head is in the PR author block after push. This file does not quote its own commit.

## Corrected

Each started load owns a separate node. Invalidation, reload, retry, permission withdrawal and unmount detach that node and dispose that load. A late writer keeps only the detached node.

The operation key includes the confirmed place type and the public identifier, including country mode. A real change drops the old display and waits for a new explicit load. A new array with the same mapping does not.

Country collection deduplicates reads and checks every stage occurrence. An unresolved or conflicting extra stage does not become an automatic single-country decision. An explicit valid country selection stays available, including after ready, unsupported, error and display states.

On a selected day, the canonical country code counts only when it is already stored as two uppercase letters. Null, empty, lowercase and any other shape stay unconfirmed for a city, a region and an island. The stage hint does not fill that code. A valid canonical code that disagrees with a valid stage code stays a contradiction. No new country catalogue was added. Places import and lookup were not changed.

## Review R2

A fulfilled renderer decline now aborts, detaches and disposes that exact load before the recoverable error is shown. A successful display keeps its node. A late decline for an older load does not touch the current one. The visible failure sentence is the existing fixed German sentence. Supplied decline text is not shown. Root's probe had rendered that supplied text; this correction suppresses it. `aufloesung.ts` stays the accepted local reducer for exact-id confirmation. No canonical-cache redesign.

The application resolver stays null. The test seam can confirm an exact id late. Synchronous load failures and rejected confirmations become the existing recoverable error, without the exception text. The closed path does not look a place up.

## Work V2

Received. Archive SHA256 `a996f359d529be827376bf5545fb0f806f0ea6e32f9da5891711b08620ff3844`. The generated samples are evidence only. Still missing: account-authorized scalable place resolution, the SPA lifecycle, and the private-page Analyzer/data/consent contract, then an actual widget render and product click. The vendor draft is ready and unsent. No contact authorization.

## Not implemented and not verified

- No official manual widget, no Analyzer, no live pictured offers, no product or partner link in the application.
- No provider, image, script or hosted place request.
- No physical device. The mounted proof is headless Chromium at 320, 390, 768 and 1440, plus 200% root text.
- No CI or Preview claim for the corrected head. The earlier Preview on `3051d4d8` does not cover this head.
- `docs/ACTIVE_WORK_STATUS.md` was not edited. Continuity for this slice is this file and the handoff.

## Addendum, selected-day canonical country

The day path now fails closed when the stored country code is null, empty, lowercase or any other shape than two uppercase letters. City, region and island are covered. Uppercase agreement stays ready. A different uppercase code stays a contradiction. Country mode already rejected the malformed case and still does. `lib/places` was not edited.

## Checks on this correction

The counts below are the addendum head. The earlier R1 correction had 33 GetYourGuide tests and 7358 full-suite tests.

- GetYourGuide unit tests: 34 pass, 0 fail.
- Mounted harness: exit 0. Ten local requests, including the page assets and one synthetic `POST /api/activities/search` on localhost. Zero external requests. The cooperative page still records 7 loads, 7 disposals and 7 aborts. The counterexample page uses a renderer that ignores abort and writes late.
- `npm test`: 7359 tests, 885 suites, 7343 pass, 11 fail, 5 skipped. The 11 failures are the same class of local PostgreSQL proofs. They are not repaired.
- `npm run lint`: 0 errors, 175 warnings, exit 0.
- `npm run typecheck` and `npm run build`: exit 0.
- Hygiene `check:dead`, `check:exports`, `check:deps`, `check:api-schutz` and `check:schema-bezug`: exit 0. Schema check still reports the pre-existing LOCAL/UNAPPLIED RPCs.

## Checks on Review R2

Node v22.23.4, after the decline fix and before the documentation commit. GetYourGuide unit tests: 34 pass. Mounted harness: exit 0. Ten localhost requests, zero external. The cooperative page still records 7 loads, 7 disposals and 7 aborts. The counterexample now also covers an immediate fulfilled decline, a throwing disposer, a retry, and a late decline that leaves the newer display alone. `npm run lint`: 0 errors, 175 warnings. `typecheck`, `build` and the hygiene commands exited 0. Schema check still reports the pre-existing LOCAL/UNAPPLIED RPCs.

The full `npm test` suite was not repeated on this head. Root asked not to regenerate the known local PostgreSQL failures. Their last observed counts remain 7359 tests, 7343 pass, 11 fail, 5 skipped, from the selected-day addendum. Those 11 failures are unchanged in kind and are not claimed as re-run here. No CI or Preview claim for this head.

## Main, at the read before this correction's commit

`origin/main` was `3a25fc15a38087190c72b49373fb2233af1f6248` at the start of Review R1. The delivery reads it again immediately before push and records the result in the PR author block. This branch is not merged and not rebased.

## Stop

Ready, merge and a follow-up slice are not this writer's actions. The corrected head needs a new independent Technical-Lead review.
