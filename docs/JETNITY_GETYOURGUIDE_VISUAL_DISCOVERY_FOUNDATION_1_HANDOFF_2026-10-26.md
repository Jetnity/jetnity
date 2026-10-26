# GetYourGuide Visual Discovery Foundation 1 — HANDOFF

Date: 26 October 2026.
Exact writer: Jetnity GetYourGuide Visual Discovery Foundation 1 — Cursor Generation 1.
Observed runtime: `grok-4.7-high-fast`, from cursor-cloud `run-info`.
Session: https://cursor.com/agents/bc-301aaa79-6426-49bb-b534-3232a8a5ee9b
Branch: `feat/getyourguide-visual-discovery-foundation-1`
Draft PR: #1039
Tracking: #1038
Parent: #1023 V5
Immutable TASK blob: `dbe1c2def1a4f1b2d8158e467971601a80d03b43`
Task seed: `8822282c24a03e8975ecc53184e661471405d1ba`

This handoff is the Review R1 correction in the same session. It is not a new generation.

## What the next reviewer has

A closed GetYourGuide block. Each load has its own node. The operation key includes place type and public identifier. Unresolved or conflicting extra stages do not auto-select a country, and the country choice stays reachable. The application resolver is null. Late exact confirmation exists only on the test seam. Work V2 is received and not activated.

The synthetic harness proves the abort-ignoring late writer, A→B→A, retry, repeated stages, type and mapping changes, keyboard country change, permission withdrawal, sync throw, disposal throw, and a populated native card. It blocks every non-local request.

## Exact git

The author block on PR #1039 is written from the commands after push. This file is inside the review head, so it does not quote its own commit SHA.

Reviewed head: `3051d4d868bb4139f1dd5a9f70e3247bd084f8cd`, tree `57cf4ab8256c8068b0cd85d8675ed9300045d2c0`.

`origin/main` is read again immediately before push. At the start of this correction it was `3a25fc15a38087190c72b49373fb2233af1f6248`. This branch was not merged and not rebased.

## Checks the reviewer can repeat

```text
node --import ./scripts/server-only-test-register.mjs --import tsx --test lib/activities/getyourguide/*.test.ts
node --import tsx scripts/getyourguide-visual-discovery-1/run.ts
npm test
npm run typecheck
npm run lint
npm run check:dead
npm run check:exports
npm run check:deps
npm run check:api-schutz
npm run check:schema-bezug
npm run build
```

On this correction, before the documentation commit: GetYourGuide tests 33 pass. Harness exit 0, 10 localhost requests, 0 external. Full suite 7358 tests, 7342 pass, 11 fail, 5 skipped. The 11 failures are local PostgreSQL proofs. Lint 0 errors and 175 warnings. Typecheck, build and the hygiene commands exited 0.

## Stop

Independent Technical-Lead review of the new head. This writer does not mark Ready, does not merge, and does not start a follow-up slice.
