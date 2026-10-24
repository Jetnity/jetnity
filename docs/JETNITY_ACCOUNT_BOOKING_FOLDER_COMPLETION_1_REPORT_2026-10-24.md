# Account Booking Folder Completion 1 — REPORT

Date: 2026-10-24. Writer: **Jetnity Account Booking Folder Completion 1 — Cursor Generation 1**. Session `bc-a34030c7-4c19-4c9f-863f-193cfdfa34da`. Actual model `grok-4.7-high-fast`.

Author delivery evidence. Not Technical-Lead PASS, Ready, merge, or Production acceptance.

## Outcome

The existing Account → confirmed bookings read can continue past the old 200-row cut, filter by a literal title and by kind and archive, and open the existing plan item. A first page with no rows and no filter is an empty account. A first page with a filter and no rows is no match. A later page with no rows is the end of that read, including when rows change between requests. A failed read and an invalid address do not look like an empty account.

## What changed

`lib/account/buchungen-abfrage.ts` builds the query without importing Supabase. Page size is 50 visible rows and limit 51. The next cursor is the 50th visible row's exact confirmation text and id. The 51st row is only the sentinel. There is no count.

Title search is `.filter('title', 'imatch', '***=' + exactAcceptedTitle)`. No quotes are added and no title character is rewritten. The title is not inside the keyset `.or()`. `like` and `ilike` are not used. Absent `art` uses `.in('kind', ['flight','stay','transfer','rental_car'])` before the limit. A selected bookable `art` uses `.eq('kind', acceptedKind)` instead of that list. Active trips use `trips.status` in `draft, planned, booked`. Archived trips use `eq archived`. `alle` adds no status predicate.

The cursor token is `v1|<sha256 of v1, art, archive, title length, title>|<exact timestamp or null>|<lowercase uuid>`. A fingerprint mismatch, a repeated owned parameter, a title over 120 characters, or a cursor over 512 characters fails before the client is called. Unknown extra keys are ignored and omitted from the next link. Timestamp text is accepted only as a calendar-valid `YYYY-MM-DDTHH:mm:ss` with an optional 1–6 digit fraction and `Z` or `+00:00`. It is not round-tripped through `Date`.

`buchungen-daten.ts` still uses `import 'server-only'` and `createServerComponentClient()`. It applies that description: booked, kind, archive, title, keyset, order `booking_confirmed_at DESC NULLS LAST, id ASC`, limit 51. No `user_id`, service role, RPC, or write. Thrown reads and `data: null` are load errors. `problemAus` still maps connection failures to 503. Mapping that would have skipped a returned row, or a non-canonical confirmation time, fails the page instead of punching a hole in it.

The page reads `searchParams`, renders one list in query order, and keeps `noindex` / `nofollow` and `force-dynamic`. Cards link with the existing `modusUrl` plan target when both ids are canonical lowercase uuids. The visible name is `Planpunkt öffnen`. Archive remains a badge and a filter. The confirmation timestamp is not rendered. The form is GET and does not submit `weiter`, so a new filter starts at the first page.

`AccountAuditClient` is outside the allowlist and still passes the old props. The owned component accepts that shape so typecheck stays green. `abgeschnitten` is accepted and not shown. Audit fixture item ids that are not uuids do not get a plan link. The real page mapper rejects those rows before display.

## Tests and build

Focused booking tests: 35 pass, 0 fail. Details, the full-suite failures, and the Chromium measurements are in `docs/evidence/account-booking-folder-completion-1/NOTES.md`.

`npm run typecheck` exit 0. `npm run lint` exit 0 with 144 pre-existing warnings and 0 errors. `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, and `check:schema-bezug` exit 0. `npm run build` exit 0. Next.js 16.4.1. `/account/bookings` stays dynamic.

`npm test` exit 1: 7095 tests, 7079 pass, 11 fail, 5 skipped. The 11 failures are pre-existing official-truth native PostgreSQL proofs. PostgreSQL 16 binaries are absent. They were not installed and are not a booking regression.

Headless Chromium 140.0.7339.16, reduced motion, viewports 280 through 1280 plus landscape 844×390, and 320 at root 32px: horizontal overflow 0. Tab order reaches search, submit, clear, the plan link, next, first page, and retry on the states that show them.

## Security, database, cost

The read stays on the authenticated server client and existing RLS. The cursor is pagination state, not authorization. No service role, no client-supplied user id, no new table, RPC, grant, migration, or auth change. No traveller, price, or partner fields are selected or displayed. `noindex` stays.

No new provider, model call, or monthly cost. One page is one limit-51 read. Another read happens only when the user asks for the next page.

## Documentation

Owned: this REPORT, STATUS, SELF_REVIEW, HANDOFF, and `docs/evidence/account-booking-folder-completion-1/`. TASK and PLAN were not edited. Global handoff, active status, roadmap, ADR, and mode files were not edited.

## Remaining limits

Hosted matching and hosted RLS are unverified. Local `~*` is NOT-RUN. The in-memory walker uses exact timestamp text, not timestamptz normalization. The Chromium run is not a device, native zoom, or screen-reader pass. CI and Preview for this head are not claimed in this report.

Next actor: Technical Lead, same session, exact-head code review.
