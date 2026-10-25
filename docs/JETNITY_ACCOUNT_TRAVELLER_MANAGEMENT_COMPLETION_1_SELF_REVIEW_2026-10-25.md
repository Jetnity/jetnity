# R106 A — Account Traveller Management Completion 1 — SELF-REVIEW

Author: Jetnity Account Traveller Management Completion 1 — Cursor Generation 1

Implementation head reviewed by the author: `4022bc8281e27d2d7965807f45964c9f7ab09d6d`

This review is the author's own reading. It is not an independent Technical-Lead PASS and it does not authorize Ready or merge.

## P0

None found in the owned diff.

## P1

None found in the owned diff.

## P2

1. Local `npm test` is not the cited native baseline. Exit 1. Summary: 7126 tests, 7110 pass, 11 fail, 5 skipped. Every failure inspected starts at `spawnSync /usr/lib/postgresql/16/bin/initdb ENOENT`. The account-registry, country, and document-lifecycle tests that this lane owns or touches passed in the focused run (74 pass, 0 fail). CI with PostgreSQL binaries remains not verified on this head.

2. Production `router.refresh()` returns `void`. The plan's rejection path runs only when the call returns a thenable. The harness shim does. The installed Next type does not. A failed production refresh is therefore not observable here, and a completed refresh is still not a list observation. The explicit reread keeps the 4000ms local deadline and does not send a write.

## P3

1. Create actions still return `wert: null`. The UI cannot point at the inserted row. Editing `account-registry-aktionen.ts` is outside this lane. Recommend a later Technical-Lead task if a later slice needs the id.

2. Two account tabs can still race. This client cannot see the other tab. The unknown-outcome rule does not claim exactly-once.

3. The repeat control uses `aria-disabled` and still receives a click, because `beginnen` is the authority. Playwright treats `aria-disabled="true"` as not enabled, so the mounted proof uses `click({ force: true })` to reach that guard. A forced click is not a second write path.

## Traveller context

Several citizenships stay equal. Residence, issuer, and citizenship stay independent. An empty document-to-citizenship choice is submitted as empty and preserved. The screen does not invent visa, transit, or carrier rules. A read error does not delete a person, citizenship, or document from the draft.

## Scope check

Diff is the two account components, the new hook, registry copy, the workflow module and its tests, the premium UX assertion move, and the disposable harness. TASK and PLAN blobs match the accepted plan head. No global continuity file was edited.
