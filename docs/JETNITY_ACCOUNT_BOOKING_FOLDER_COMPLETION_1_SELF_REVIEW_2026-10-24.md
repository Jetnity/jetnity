# Account Booking Folder Completion 1 — SELF_REVIEW

Date: 2026-10-24. Writer: **Jetnity Account Booking Folder Completion 1 — Cursor Generation 1**. Session `bc-a34030c7-4c19-4c9f-863f-193cfdfa34da`. Model `grok-4.7-high-fast`.

This self-review is not Technical-Lead PASS. It does not authorize Ready or merge.

## Checked against the accepted plan

- Title transport is the raw top-level value `imatch.***=` plus the accepted title. The serialization test covers star, percent, underscore, slash, quotes, punctuation, regex-looking text, and `Zürich`. No added quotes.
- Selected kind is `.eq` before the limit. Absent kind is the derived `in` list. Both are not sent. `getAll('kind')` sees one value.
- The next cursor is row 50. The sentinel is not visible and is not the cursor.
- Empty account and no-match require the first page. A later empty page has its own copy and a first-page link.
- Display order follows the query order. The old archive/date re-sort is gone.
- Invalid input returns before `from('trip_items')`.
- The diff does not add a write, service role, `user_id` filter, RPC, migration, auth change, dependency, or workflow edit.
- `loading.tsx` was left unchanged. Its copy does not claim a result.
- TASK blob `754fc2e0d87ba0755713c174acf60723ab3d1f13` and PLAN blob `b29a5195c57c797f6252dc5863fc6c7b9f0ebac2` match the accepted head.

## Findings

### P0

None in the local proof.

### P1

Hosted PostgREST has not applied the raw `imatch` value or the quoted keyset `.or()`. The v12.2.3 parser reading in the accepted PLAN explains the client shape. It is not a server execution. Hosted RLS was not executed. Serialization and synthetic pages must not be read as those passes.

### P2

- Local `value ~* pattern` is NOT-RUN. `psql` and PostgreSQL 16 `initdb` are absent. Case folding for `ß` / `ss` and umlauts is unverified.
- The in-memory continuation compares exact ISO text. Fixed-width timestamps match the cursor rule used here. Mixed `Z` and `+00:00`, or unequal fraction widths, are not claimed as timestamptz equality.
- The Chromium proof uses production CSS and a root font-size. It is not a physical device, native zoom, or screen reader.
- `npm test` exits 1 because 11 pre-existing official-truth native PostgreSQL proofs fail in this environment. They are outside this slice. A skip is not a pass. The runner reports 5 skips; the TAP stream also shows 7 `# SKIP` annotations.

### P3

- Setup check warns that no `.env` / `.env.local` is present. Browserslist data is 13 months old. Neither comes from this slice.
- The current repository handoff block is still the historical 2 October Official-Truth entry. This delivery does not edit it. The Technical Lead can reconcile the live writer pointer after review.
- The account-audit fixture still mounts the component with the old props and non-uuid item ids. That fixture no longer shows a truncation banner, and it does not show a plan link. The account page does not use that fixture.
- On a completely invalid parameter set the form fields render empty, while "Erneut versuchen" keeps the raw address. Read errors and stale cursors keep the parsed filter in the form.

## Ownership

Owned paths only, plus the new evidence and these four docs. `AccountAuditClient` was not edited. Shared contracts were not edited. No sibling branch was merged.
