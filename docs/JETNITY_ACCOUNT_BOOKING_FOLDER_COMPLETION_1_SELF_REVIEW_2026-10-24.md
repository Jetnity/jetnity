# Account Booking Folder Completion 1 — SELF_REVIEW

Date: 2026-10-24. Writer: **Jetnity Account Booking Folder Completion 1 — Cursor Generation 1**. Session `bc-a34030c7-4c19-4c9f-863f-193cfdfa34da`. Model `grok-4.7-high-fast`.

This self-review is not Technical-Lead PASS. It does not authorize Ready or merge. It answers code review V1 on head `de836013e78827d66e02be501d353f3ae2cf225e`. The repair head is the commit that contains this file.

## Repair against the three findings

- B-P2-CODE-01. The repeat sentinel is a `Symbol`, not the string `wiederholt`. A single string and a one-element array of that word are accepted and become `***=wiederholt`. Two title values still fail closed. Invalid cursors still fail before the client.
- B-P2-CODE-02. The form key is the applied `wiederholenHref` together with the applied title, kind, and archive. Reset, next, and back change that address and drop an unsent edit. The Suchen control still submits without `weiter`.
- B-P2-PROOF-03. Search by button and Enter, combined filters, a match past 200 rows, the 50th-row cursor, equal timestamps, the null transition, reset, next, back, a second-page error, retry of the same href, empty account versus empty continuation, and the plan link run through the real parser, loader, and rendered component. The data boundary is a synthetic interpreter of the sent URL. `buchungenSeitenLauf` is not exported and is not in the runtime.

## Still true from the accepted plan

- Title transport is the raw top-level value `imatch.***=` plus the accepted title. No added quotes.
- Selected kind is `.eq` before the limit. Absent kind is the derived `in` list. Both are not sent.
- The next cursor is row 50. The sentinel is not the cursor.
- Empty account and no-match require the first page. A later empty page has its own copy.
- TASK blob `754fc2e0d87ba0755713c174acf60723ab3d1f13` and PLAN blob `b29a5195c57c797f6252dc5863fc6c7b9f0ebac2` are unchanged.

## Findings

### P0

None in the local proof.

### P1

Hosted PostgREST has not applied the raw `imatch` value or the quoted keyset `.or()`. Hosted RLS was not executed. The synthetic `includes` check and the client serialization are not those passes.

### P2

- The three review findings above are implemented and locally exercised. This note does not close them. The Technical Lead re-reviews the new head.
- Local `value ~* pattern` is NOT-RUN. `psql` and PostgreSQL 16 `initdb` are absent. Case folding for `ß` / `ss` and umlauts is unverified. The flow's title check is `String.includes`.
- In-memory order and the synthetic keyset compare exact ISO text. Mixed `Z` and `+00:00`, or unequal fraction widths, are not claimed as timestamptz equality.
- The Chromium runs are not a physical device, native zoom, or screen reader. The action flow is not a Next App Router navigation. The static montage does not click the controls.
- `npm test` on this tree exits 1: 7092 tests, 7076 pass, 11 fail, 5 skipped. The 11 failures are the same pre-existing official-truth native PostgreSQL proofs. Native CI `40106883570/1` greened `de836013` and does not convert this local failure into a pass. It does not gate the repair head.

### P3

- Setup check warns that no `.env` / `.env.local` is present. Browserslist data is 13 months old. Neither comes from this slice.
- The current repository handoff block is still the historical 2 October Official-Truth entry. This repair does not edit it.
- The account-audit fixture still mounts the old props and non-uuid item ids. It does not show a plan link.
- On a completely invalid parameter set the form fields render empty, while "Erneut versuchen" keeps the raw address.

## Ownership

Owned paths only, plus the new harness, evidence, and these four docs. `AccountAuditClient` was not edited. Shared contracts were not edited. No sibling branch was merged.
