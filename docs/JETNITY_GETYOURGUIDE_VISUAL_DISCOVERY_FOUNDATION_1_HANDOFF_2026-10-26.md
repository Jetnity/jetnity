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

## What the next reviewer has

A closed GetYourGuide block inside the existing activities area. It knows city, region, island and country, including a trip with no days. It does not load a provider. The synthetic harness proves lifecycle, keyboard, enlarged text and zero external requests. The work packet lists the human evidence still required before any live widget.

## Exact git

`origin/main` read before these commits, and again immediately before push: see the author block on PR #1039 for the pushed `HEAD`, tree, parent, merge-base and ahead/behind. That block is written from the commands after push. This file is inside the review head, so it does not quote its own commit SHA.

Known baseline, unchanged at the last fetch before the commit:

- `origin/main`: `3a25fc15a38087190c72b49373fb2233af1f6248`
- Merge-base of the task seed with that main: the same commit
- Task seed: `8822282c24a03e8975ecc53184e661471405d1ba`, then 1 ahead and 0 behind
- Implementation commit, parent of the documentation commit: `2128a3221bd4ce3df7309aefaf00df3abd94fe87`

This branch was not merged and not rebased.

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

The harness needs Playwright Chromium on the machine. It aborts every non-local request. Its screenshots are synthetic.

## Known failures that are not this slice

Full `npm test` on the final tree: 7350 tests, 7334 pass, 11 fail, 5 skipped. The failures are local PostgreSQL proofs. `initdb` is not installed here. Do not treat those failures as GetYourGuide regressions, and do not treat them as fixed.

`npm run build` and `npm run typecheck` on that same tree exited 0. `eslint .` exited 0 with 175 existing warnings and 0 errors.

## Stop

Independent Technical-Lead review only. Same session can take CHANGES REQUIRED. This writer does not mark Ready, does not merge, and does not start a follow-up slice.
