# Jetnity Account Booking Folder Completion 1 — PLAN

Date: 2026-10-24. Pre-code plan for immutable TASK V1. This file is the only planned change at this gate. No runtime, test, schema, or workflow edit is included. Implementation waits for Technical-Lead authorization in this same session.

## 1. Identity

| Field | Value |
| --- | --- |
| Logical author | Jetnity Account Booking Folder Completion 1 — Cursor Generation 1 |
| Requested model | Grok 4.7 High Fast / `grok-4.7-high-fast` |
| Actual `originalModelName` | `grok-4.7-high-fast` |
| Session | https://cursor.com/agents/bc-a34030c7-4c19-4c9f-863f-193cfdfa34da |
| Session id | `bc-a34030c7-4c19-4c9f-863f-193cfdfa34da` |
| UI rename | Performed. Chat title is now the logical author name. The rename tool returned that title. |
| Branch | `feat/account-booking-folder-completion-1` |
| Draft PR | #1000 |
| Tracking issue | #997 |
| Lane | R105 B |
| Machine mode | `NORMAL` (`.jetnity/operating-mode.json`, re-read this session) |

The requested model is the attested runtime model. This plan does not use an Auto or unrelated fallback.

## 2. Exact baseline re-read this session

`git fetch origin main` completed before these values were recorded.

| Ref | SHA |
| --- | --- |
| `origin/main` | `0c37d318c47a758f06634448d6e0de3856bbc6a6` |
| `origin/main` tree | `5e7b61a111f94f16a27c80a8ec89e42ef7af62e8` |
| Seed head before this plan | `f07833dd7b1d1e288e44047dab77d5b5f181b399` |
| Merge-base with `origin/main` at seed | `0c37d318c47a758f06634448d6e0de3856bbc6a6` |
| Ahead / behind at seed | 1 ahead / 0 behind |
| Seed diff | `docs/JETNITY_ACCOUNT_BOOKING_FOLDER_COMPLETION_1_TASK_V1_2026-10-24.md` only |

The plan commit head, merge-base, and ahead/behind after this file lands are in the PR comment posted from that commit. A later head invalidates this gate.

Live index [issue #751](https://github.com/Jetnity/jetnity/issues/751) top section, re-read this session, is R105 V2 with PLAN evidence pending and the same main/tree. [R105 precheck 6385343244](https://github.com/Jetnity/jetnity/issues/751#issuecomment-6385343244) names this logical author, this branch, and integration A → C → B. Issue #997 is open, status dispatched, PLAN first. `ACTIVE_WORK_STATUS.md` and `JETNITY_START_HERE.md` still point at the 2 October continuity snapshot. Those paragraphs are historical. Live main, live mode, #751, and the precheck supersede them. This plan does not edit those TL-owned files.

Startup read for this gate: operating mode, `JETNITY_START_HERE.md` pointer, `AGENTS.md`, `docs/ACTIVE_WORK_STATUS.md` pointer, TASK V1, the precheck, #751 and #997, AP-10 in `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md` lines 393–413, and the assigned account-booking source and tests named below. Vision, architecture, decisions, design, product-quality, and continuity standards were not re-litigated: AP-10 already permits this read-only aggregation, and the TASK forbids a new booking truth.

## 3. Evidence class for this delivery

This plan is source inference plus live git and GitHub reads. It is not mounted UI behavior, not a local test run, and not hosted, CI, RLS, or database proof. The existing Vercel preview on the task-only seed is a deployment of the unchanged account page. It is not acceptance of the folder completion. No hosted data was read.

## 4. Source-confirmed defects

Assigned source at the seed head:

1. `lib/account/buchungen-daten.ts` lines 46–58 reads with the authenticated server client, `booking_status = booked`, order `booking_confirmed_at DESC NULLS LAST, id ASC`, then `.limit(BUCHUNGEN_LISTE_GRENZE)`. `BUCHUNGEN_LISTE_GRENZE` is 200 in `lib/account/buchungen.ts` line 16. There is no continuation cursor. `count: 'exact'` is requested.
2. The same query does not constrain `kind` or trip archive status and does not filter `title` before the limit. `buchungAusZeile` later drops non-bookable and unconfirmed rows. A row dropped after the limit can occupy a slot in the 200-window.
3. `buchungenAbgeschnitten` (`lib/account/buchungen.ts` lines 204–211) treats a null count at the 200 cap as truncated and a null count below the cap as complete. The UI then shows either a truncation warning or a silent complete list. That is the false-completeness path the TASK removes.
4. `components/account/AccountBuchungen.tsx` lines 103–111 render only the truncation warning. There is no next page, search, kind filter, or archive filter.
5. Cards link through `buchungReisePfad`, which returns `/reisen/${tripId}` (`lib/account/buchungen.ts` lines 230–232). `modusUrl` in `lib/trips/workspace-mode.ts` lines 118–122 can address `ansicht=plan` and `itemId` as `punkt`. `modusFuerReise` lines 124–134 drops a missing item against the current graph. The booking card does not call that adapter.
6. `buchungenAusZeilen` (`lib/account/buchungen.ts` lines 148–169) re-sorts the already limited rows by archive flag, then travel date, then title. That order is not the keyset order. With more than one page it must not be described as global chronology. The precheck records the same defect.
7. `app/account/bookings/page.tsx` calls `buchungenLaden()` with no URL state. `metadata.robots` is already `noindex, nofollow`. The account proxy still guards `/account`.
8. Empty account and load error are already separate in `AccountBuchungen.tsx` lines 113–136. A filtered no-match state does not exist, because no filter exists. Mapping failure, `data: null`, and a thrown read already become a problem and must stay failures.

Related contract facts, read-only:

- Bookable kinds come from `kannBuchungMarkieren` (`lib/trips/buchung.ts` lines 33–58): `flight`, `stay`, `transfer`, `rental_car`. `activity` and `note` are excluded. The current DB check `trip_items_booking_nur_kommerziell` in `supabase/migrations/20260821200000_trip_items_rental_car.sql` allows `booked` only for those same four kinds. The query will derive the set from `kannBuchungMarkieren` applied to `TRIP_ITEM_KINDS`, not from a second handwritten list.
- `istArchiviert` is `status === 'archived'` (`lib/account/reise-archiv.ts` lines 45–47). Known trip statuses are `draft`, `planned`, `booked`, `archived`.
- `trip_items.id` is `uuid`. `title` is text with `char_length(btrim(title))` between 1 and 120. `booking_confirmed_at` is `timestamptz`. The consistency check requires a non-null confirmation time when `booking_status = booked`. The existing reader still orders nulls last, and the TASK requires null-timestamp continuation. The new query keeps `NULLS LAST` and proves the null transition with synthetic rows. A constrained database would reject a booked row with a null time; that constraint is not treated as a reason to drop the null branch.
- Installed client, from `node_modules` this session: `@supabase/supabase-js` 2.57.2 and `@supabase/postgrest-js` 1.21.3. `package.json` allows `^2.50.2`. No dependency upgrade.
- `ilike` in this postgrest-js writes `ilike.${pattern}` with no reserved-character quoting (`PostgrestFilterBuilder.js` `ilike`). `.or()` appends the caller string unchanged and documents that the caller must sanitize it. `.in()` quotes values only when they contain `,()` . `.order()` serializes `column.desc.nullslast` when `nullsFirst: false`. Official references used for this plan: [order](https://supabase.com/docs/reference/javascript/order), [ilike](https://supabase.com/docs/reference/javascript/ilike), [or](https://supabase.com/docs/reference/javascript/or). The 12 October changelog TLS note authorizes no infrastructure work.

## 5. Proposed behavior

One authenticated read of the existing booking folder:

Account → confirmed bookings → filter by title, bookable kind, and archive → continue past the first page in a bounded way → open that existing plan item.

Visible order is the continuation order: newest `booking_confirmed_at`, null confirmation times last, then `id` ascending. Travel dates stay on the card as stored dates. They are not the page order. Archive stays a badge and a filter. The current two-group re-sort is superseded for this page, because it reorders a page away from the keyset. A short visible note states that the list follows the user's own confirmation sequence. The confirmation timestamp stays off the card, as it does today. The note does not claim a snapshot across requests.

Page size is 50 visible rows plus at most one sentinel. The database limit is 51. A 51st row sets continuation and is not shown. The last page has no sentinel and an end-of-results note. There is no fetch-all loop and no caller-selected page size. `count: 'exact'` is removed. The UI does not show a total, a remaining-after-cursor count, or a page length as an account total.

Filters apply in the database before the limit:

- Title: optional contains-match on `trip_items.title` only, case-insensitive `ilike`, maximum 120 characters after trim. Empty or whitespace-only search removes the title predicate and restores the unfiltered title set. `%`, `_`, and `\` are escaped as ILIKE literals. The pattern is then wrapped as a double-quoted PostgREST value so comma, period, colon, parentheses, apostrophe, umlauts, and other punctuation cannot become filter grammar. No trip-title search, no full-text, no fuzzy search, no cross-table `.or()`.
- Kind: absent means all kinds `kannBuchungMarkieren` accepts. A present value must be one of those kinds. `activity`, `note`, and unknown values fail before the query.
- Archive: absent means `alle`. `aktiv` filters the inner `trips` relation to the known non-archived statuses `draft`, `planned`, `booked`. `archiviert` filters `trips.status = archived`. Any other value fails before the query.

URL state, one value each, on the existing `/account/bookings` route:

| Key | Meaning |
| --- | --- |
| `titel` | title search |
| `art` | one bookable kind |
| `archiv` | `aktiv`, `archiviert`, or `alle` |
| `weiter` | continuation cursor |

The filter form is `method=get` and does not include `weiter`, so a new search or filter starts at the first page. The clear control is a link to `/account/bookings`. The next-page link copies the current valid filters plus the next cursor. Browser back uses that history. Unknown query keys are ignored and are omitted from the next link. Repeated owned keys, a title longer than 120 characters, a cursor longer than 512 characters, or a malformed cursor fail before any database call.

The cursor is pagination state. It carries version, a filter fingerprint, the continuation timestamp or a null marker, and the row uuid. The fingerprint is a hash of the canonical kind, archive, and exact accepted title. The raw title, user id, trip title, and traveller data are not in the cursor. A cursor whose fingerprint does not match the current filters is invalid. It cannot be applied to a new filter and skip that filter's first page. An invalid address renders its own explanation, with a link back to the first page of the current filters and a retry of the current URL. It is not shown as an empty account, as no matches, or as a database outage.

Row mapping keeps the existing fail-closed rule for a malformed joined trip, an unknown trip status, or a missing title: the page is a load error. Because the query already restricts booked and bookable kinds, a returned row that `buchungAusZeile` would previously have skipped becomes that same honest mapping failure instead of a silent hole in the page. Existing pure tests that pass raw unconfirmed or non-bookable rows into `buchungAusZeile` stay valid for that function. The page path no longer depends on post-limit skipping.

The item link uses the existing adapter:

`modusUrl('/reisen/' + tripId, { ansicht: 'plan', bereich: null, itemId })`

`tripId` and `itemId` must be canonical uuids. `modusUrl` writes `punkt` only when `itemId` also satisfies the existing 1–80 character reference rule, which a uuid does. The visible name is `Planpunkt öffnen`. Deleted or moved items remain the existing workspace graph fallback. No workspace-mode edit. No external destination. No per-item booking detail, price, or partner target.

Result states stay separate:

| State | What the page shows |
| --- | --- |
| Empty account | Successful read, no active title/kind/archive narrowing, zero rows. Existing empty copy. |
| No matches | Successful read, at least one active filter, zero rows. Different title and text. |
| Load error | Thrown read, `error`, `data: null`, or a malformed row. Existing error copy, plus an explicit retry link. 503 copy stays on status 503. |
| Invalid address | Bad or stale cursor, repeated or oversized parameters, unknown kind or archive. No query. Own copy and a first-page link. |
| End of results | Successful page with no sentinel. End note. No next link. |
| Continuation | Sentinel present. Link `Weitere Buchungen`. |

Search, filter submit, clear, next page, and retry are native links or a native form, so they are keyboard operable. Controls use the existing minimum 44px target and visible focus ring. No request runs on each keystroke. New transitions follow the existing `motion-reduce` pattern. Card titles wrap. The page root does not gain overflow masking. `loading.tsx` keeps the current generic loading copy. That boundary cannot know the filters, so it does not claim empty, no-match, or error. Page metadata keeps `noindex, nofollow` and `force-dynamic`.

Account overview entry, account navigation, and the statement that bookings are absent from the nav stay unchanged.

## 6. Query shape to implement after authorization

Owned query description, built in `lib/account/buchungen-abfrage.ts` with no Supabase import:

- select the current columns only: `id, kind, title, starts_on, starts_at, ends_on, ends_at, booking_status, trips!inner(id, title, status)` plus `booking_confirmed_at` for the cursor only. The confirmation time is not added to `KontoBuchung` and is not rendered.
- `eq('booking_status', 'booked')`
- `in('kind', derivedBookableKinds)`
- archive predicate on `trips.status` when the filter is not `alle`
- quoted literal `ilike` on `title` when a title is present, via `.filter('title', 'ilike', quotedPattern)` so this client version does not concatenate an unquoted pattern
- `order('booking_confirmed_at', { ascending: false, nullsFirst: false })` then `order('id', { ascending: true })`
- `limit(51)`
- no `count`
- keyset, only when the cursor is valid for these filters:
  - non-null time: one `.or()` whose tokens are a quoted canonical timestamp and a lowercase uuid, closed by regex before interpolation: earlier time, or same time with a greater id, or null time
  - null time: `.is('booking_confirmed_at', null)` and `.gt('id', uuid)`, no `.or()`
- timestamp text is accepted only as a calendar-valid `YYYY-MM-DDTHH:mm:ss` with an optional 1–6 digit fraction and `Z` or `+00:00`. It is not round-tripped through `Date`, so microseconds survive. The next cursor copies that exact text.
- uuid text is the canonical 8-4-4-4-12 lowercase hex form.

`lib/account/buchungen-daten.ts` keeps `import 'server-only'` and `createServerComponentClient()`. It applies that description. It does not accept a caller user id, a service-role client, an RPC, or a write. Invalid input returns before the client is asked to query.

## 7. Owned paths after authorization

Implementation may touch only:

- `app/account/bookings/page.tsx`
- `app/account/bookings/loading.tsx` only if the loading copy must name the same page without claiming a result
- `components/account/AccountBuchungen.tsx`
- `components/account/BuchungenFilter.tsx` (new server form; it keeps the filter markup out of the result component)
- `lib/account/buchungen.ts`
- `lib/account/buchungen-daten.ts`
- `lib/account/buchungen.test.ts` and `lib/account/buchungen-ui.test.ts`, only where this task supersedes behavior
- `lib/account/buchungen-abfrage.ts` (new)
- `lib/account/buchungen-abfrage.test.ts` (new)
- `lib/account/buchungen-daten.test.ts` (new)
- `scripts/account-booking-folder-completion-1/**` for the local mounted harness
- `docs/evidence/account-booking-folder-completion-1/**` for that harness's notes
- later owned docs `STATUS`, `REPORT`, `SELF_REVIEW`, and `HANDOFF` with this same date, when implementation is authorized

Read-only, no edits: account layout, proxy, auth, Supabase client, `lib/api/datenbank-lesen.ts`, `lib/trips/buchung.ts`, `lib/account/reise-archiv.ts`, `lib/trips/workspace-mode.ts`, types, migrations, RLS, `AccountUebersicht`, and every sibling lane file.

Tests that must remain green in substance:

- booked-only and bookable-kind truth, including stay, transfer, and rental car
- unknown trip status stays fail-closed and is not rewritten to `draft`
- empty mapping stays distinct from a malformed row
- no price, provider, booking URL, or traveller field on `KontoBuchung`
- user-confirmed copy stays free of provider-confirmation and currency claims
- server client, `problemAus`, inner trip embed, no `user_id` filter, no service role, no insert/update/delete/rpc
- account nav still has no bookings item
- overview entry still points at `/account/bookings`
- `noindex` and `force-dynamic` remain

The archive/date sort assertion and the 200-cap completeness assertion are the behaviors this task supersedes. Their replacements are order preservation matching the query, and sentinel continuation instead of a count.

Global `START_HERE`, handoff, `ACTIVE_WORK_STATUS`, roadmap, ADR, build order, operating mode, and governance files stay untouched. The later handoff may propose that the Technical Lead reconcile the live writer pointer. This plan does not do that.

## 8. Proof to run only after authorization

Local and synthetic. Not a hosted RLS or database pass.

1. Pure continuation over synthetic rows for 0, 1, 50, 51, and more than 200 rows. Every unchanged row is returned once. Equal timestamps, the step from a timestamp onto null timestamps, a null-only sequence, and a short last page are included. Microsecond ties use the exact timestamp string.
2. Real installed supabase-js client against a recording `fetch`. Assert the serialized URL and the absence of `Prefer: count=exact`: booked predicate, derived kind list, archive predicate, quoted literal title pattern for `%`, `_`, apostrophe, umlaut, comma, period, and parentheses, keyset `.or()` or null continuation, order `booking_confirmed_at.desc.nullslast,id.asc`, and `limit=51`. A mock that only checks the description object is not this proof.
3. Invalid cursor, repeated parameters, oversized title, unknown kind, and a cursor from another filter do not call the recorder.
4. Mapping cases already listed, plus `data: null`, a thrown read, a next-page error, and a malformed joined row. Each stays an error. None renders the empty-account copy.
5. `renderToStaticMarkup` of the real result component for empty, no-match, error, invalid address, continuation, and end. Item href is the `modusUrl` plan target. Existing auth and read-only source assertions stay in `buchungen-ui.test.ts`.
6. Local Playwright harness under `scripts/account-booking-folder-completion-1/`, mounting that rendered page in headless Chromium. Keyboard path through search, submit, clear, next, and retry. Viewports 320, 390, and 1280, plus 320 with root font-size 32px. Record browser version, viewport, and root-font setting in new evidence. This is CSS and root-font simulation. It is not a physical device, screen reader, hosted account, or native zoom pass. Also inspect 280, 360, 430, 768, and landscape where the harness can do so without claiming a device lab. No overflow masking.
7. After implementation: focused owned tests, then TypeScript, lint, `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`, and the production build. Full existing `npm test` if the focused set is green. Existing warnings and the two optional browser skips stay disclosed. A skip is not a pass. Workflows, dependencies, and gate logic stay unchanged.
8. Full diff review for writes, privileged clients, new auth, and schema surface. Query serialization remains labeled as client-shape evidence.

CI and Vercel for a future implementation head are hosted/CI truth only after that head is pushed. This plan does not pre-claim them.

## 9. Cost, security, traveller context

No new provider, model call, paid API, contract, or infrastructure. The read changes from one capped count query to one limit-51 query per page. Continuation adds further reads only when the user asks for the next page. No new monthly cost.

The read stays on the authenticated server client and existing RLS. The cursor is not authorization. Invalid input does not widen the query. No service role, no client-supplied user id, no new table, RPC, grant, or auth change. No traveller, document, citizenship, price, or partner fields are selected or displayed. Traveller-context collection is not relevant to this read and will not be added. `noindex` stays.

## 10. Unknowns

- PostgreSQL `ILIKE` case folding and locale behavior for `ß` / `ss` and umlauts are not verified against a database. The proof shows the escaped pattern in the real client URL.
- PostgREST's actual application of the quoted `.or()` keyset is not verified against a server. The proof shows the sanitized token and an in-memory predicate that mirrors it.
- Whether any real account has more than 200 booked rows, null confirmation times, or microsecond ties is unknown. No hosted account is inspected.
- The 12 October Supabase TLS changelog was not re-fetched. It is out of scope.
- Sibling lanes A and C are not integrated. After main moves, this branch waits for a Technical-Lead synchronization instruction. No sibling merge.

## 11. Standing limits

This session does not retry, rephrase, or reroute the held review on #985 / #982, the denied hosted readback on #917, or the blocks and pauses recorded for #913 / #911, #968, #748, #626, Bern #934 / #937, #944, and #585. No credentials, hosted data, migration, RLS, auth, provider, payment, protection, or scope change.

Cursor does not mark Ready, merge, close #997, change `main`, or start a follow-up. Author self-review is not Technical-Lead PASS.

## 12. Stop

This is the PLAN gate. Next actor: Technical Lead, same session, to accept or correct this plan. Implementation starts only after that authorization.
