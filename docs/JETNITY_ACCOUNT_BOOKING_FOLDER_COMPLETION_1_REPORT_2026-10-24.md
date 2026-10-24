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

## Review repair

Code review V1 on `de836013e78827d66e02be501d353f3ae2cf225e` required three repairs. The repeat sentinel is a `Symbol`, so the literal title `wiederholt` is accepted, including as a one-element array. The filter form remounts from the applied retry address, so reset, next, and back replace a pending edit and a new search still omits `weiter`.

## Main integration and B-P2-PROOF-04

Accepted main `9092b29c2e187bd73d644a3d85670f3ac6436be1` merged cleanly. The action proof no longer treats a submit marker or `postgrest.at(-1)` as the completed request, and it no longer opens Enter from `weiter=seite-2`. Before the button search and before Enter, the harness follows the loader's real continuation and waits until that second page is committed. Each later action snapshots the request count and the commit sequence, then requires one new request and a newer `useLayoutEffect` witness. Rendered identity is the ordered Planpunkt `punkt` value and the card `h2`. The Alpha fixture's second page is `Alpha Zürich`. The generic fixture's second page is exactly `Flug 1`, cursor timestamp `2026-01-01T00:00:02.123456Z`, id of visible row 50. Back restores the applied address, all three fields, and the first-page cards inside `history.state` of the same `about:blank` document. Retry uses a second page of title `Flug`, kind `flight`, and archive `aktiv`, whose request status is `trips.status=in.(draft,planned,booked)`. The 211-row walk still runs once. New files are only under `docs/evidence/account-booking-folder-completion-1/v2-proof04-2026-10-24/`. Earlier evidence blobs were not rewritten.

## Tests and build

On executed head `1574adcb802cc7c0039eb9724e0a8a11191d4ed8`: focused booking tests 32 pass, 0 fail. `npm run typecheck` exit 0. `npm run lint` exit 0 with 144 pre-existing warnings and 0 errors. The five hygiene guards exit 0. `check:dead` reports 845 starts and 1589 reachable modules. `npm run build` exit 0, Next.js 16.4.1, compiled in 15.0s, `/account/bookings` dynamic.

The action harness and the static montage both exit 0 and write only the new `v2-proof04-2026-10-24` directory. Chromium 140.0.7339.16. Action viewport 390×844, root font 16px. Montage overflow maximum 0 across 56 measurements; root font 32px only at width 320. Local full `npm test` was not run on this head. Details are in `docs/evidence/account-booking-folder-completion-1/NOTES.md`.

The earlier local full suite on `5a284965` was exit 1 with 11 pre-existing native PostgreSQL failures. That result stays a failure for that environment. Native CI `40120501254` was green for `5a284965` only and does not gate this head.

## Security, database, cost

The read stays on the authenticated server client and existing RLS. The cursor is pagination state, not authorization. No service role, no client-supplied user id, no new table, RPC, grant, migration, or auth change. No traveller, price, or partner fields are selected or displayed. `noindex` stays.

No new provider, model call, or monthly cost. One page is one limit-51 read. Another read happens only when the user asks for the next page.

## Documentation

Owned: this REPORT, STATUS, SELF_REVIEW, HANDOFF, and `docs/evidence/account-booking-folder-completion-1/`. TASK and PLAN were not edited. Global handoff, active status, roadmap, ADR, and mode files were not edited.

## B-P2-PROOF-05

`docs/evidence/account-booking-folder-completion-1/NOTES.md` is restored exactly to blob `5fdde5ee5eb264b051ad7dd24f4c8999e2afeec9` from `5a284965`. The notes text that existed at `fe6cca37` is copied byte-for-byte to `docs/evidence/account-booking-folder-completion-1/v2-proof04-2026-10-24/NOTES-at-fe6cca37.md`, blob `61ee41957c8cf5d7f245dc42f4e269b5d3bf9505`. That archive records the already executed `1574adcb` proof. It is not a new run. The V2 JSON files and screenshots stay in place. No component, library, app, script, TASK, or PLAN blob changes in this preservation commit. The `1574` command results and native CI `40140352357` on `fe6cca37` are not relabeled as gates for the preservation head.

## Remaining limits

Hosted matching and hosted RLS are unverified. Local `~*` is NOT-RUN. The synthetic store uses exact timestamp text and `String.includes`. The action history is one `about:blank` document. The montage is static markup with production CSS, not hydration or native zoom. CI and Preview for the final head are not claimed in this report.

Next actor: Technical Lead, same session. STOP / write freeze on the commit that contains this report.
