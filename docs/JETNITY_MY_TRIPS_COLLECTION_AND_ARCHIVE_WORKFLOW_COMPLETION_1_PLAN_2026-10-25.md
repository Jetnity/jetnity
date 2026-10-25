# Jetnity My Trips Collection and Archive Workflow Completion 1 — PLAN

Date: 2026-10-25. **Plan only.** No implementation, test, audit, or other document change is authorized by this file.

Lane **M** of finite batch [#1011](https://github.com/Jetnity/jetnity/issues/1011). Tracking [#1014](https://github.com/Jetnity/jetnity/issues/1014). Draft PR [#1019](https://github.com/Jetnity/jetnity/pull/1019). Branch `feat/r107-my-trips-collection-archive-workflow-1`.

Immutable TASK: `docs/JETNITY_MY_TRIPS_COLLECTION_AND_ARCHIVE_WORKFLOW_COMPLETION_1_TASK_V1_2026-10-25.md`, blob `eeb1f1239e07df5d9d9bc7459c4c83918b947777`. This plan does not modify that file.

Parent of this plan commit: seed `195e35f07edf894ec3a4e69ba21b5bf28ae47b15`. The plan head is the commit that adds this file. Re-read that head before review; do not treat the seed as the review head.

## 0. Identity, mode, and drift

Logical agent: **Jetnity My Trips Collection and Archive Workflow Completion 1 — Cursor Generation 1**.

Runtime read from this run's identity: `originalModelName=grok-4.7-high-fast`. Not Auto. No fallback was selected. Session `bc-27e5e422-852b-49c7-9b67-0fc723f13175`, https://cursor.com/agents/bc-27e5e422-852b-49c7-9b67-0fc723f13175.

Visible rename: the session-rename API accepted that exact title and returned it. This plan does not claim a separate screenshot of the agents list.

Machine mode at read: `.jetnity/operating-mode.json` `mode=NORMAL`. Product work on this dispatched branch is allowed. Special Product-Owner gates remain. This plan does not change operating mode, rulesets, or continuity files.

`git fetch origin main` during this plan read: `origin/main` is still `a74c443c6be3f064f150fcf021ab6154bda325e5`. Merge-base with the seed is that same SHA. The seed is **1 ahead / 0 behind**. No rebase, merge, or sibling cherry-pick was performed. Integration priority remains **T → S → D → W → M**.

Required reading used for this design: the immutable TASK; `AGENTS.md`; `JETNITY_START_HERE.md` (historical pointers only; live evidence wins); `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`; `docs/ACTIVE_WORK_STATUS.md` and the start-here handoff pointers (R106 is closed and is not reopened); `docs/JETNITY_MULTI_AGENT_SLICE_PLANNING_STANDARD.md`; `docs/JETNITY_THREE_PHASE_PRODUCT_STRATEGY_2026-09-01.md`; `docs/JETNITY_V1_BINDING_BUILD_ORDER_2026-09-01.md`. Issue bodies #751 and #1011 were not re-fetched in this plan turn beyond the dispatch that already names them binding. No new main drift was observed against the dispatched SHA.

Traveller-context check: this lane lists saved trips and archive/restore of an existing trip status. It does not read or write citizenships, travel documents, residence, or route eligibility. No traveller fact is collected. Route Truth stays untouched.

## 1. Source-confirmed current behavior

`reisenLaden()` in `lib/trips/daten.ts` selects `UEBERSICHT_SPALTEN`, orders `updated_at` descending, and applies `.limit(REISEN_LISTE_GRENZE)` where `REISEN_LISTE_GRENZE` is `200` (`lib/trips/liste-grenze.ts`). It uses `createServerComponentClient()`, `lese()`, and no `user_id` filter and no service role. RLS is the account boundary. The row mapper emits canonical `TripSummary`, including `archivePreviousStatus: previousStatusAusMetadata(...)`. `reiseLaden()` / `accountGraphLesen` stay in the same module and are not part of the list query. The existing index is `trips_user_id_updated_at_idx` on `(user_id, updated_at desc)` (`supabase/migrations/20260817120000_reiseschema.sql`). There is no `id` tie-break and no continuation.

`app/(public)/reisen/page.tsx` decides guest vs account with one `auth.getUser()` (not `getSession()`). Guests render `GastReisen` only. Accounts call `reisenLaden()` and then either the existing error copy, the empty-account copy, or `KontoReisenGruppen`. `robots: NICHT_INDEXIEREN` stays.

`KontoReisenGruppen` keeps search in component state. `reisePasstZurSuche` (`lib/account/reise-lage.ts`) trims, applies `toLocaleLowerCase('de-CH')`, and tests `title` then `origin` with `includes`. It does not search stages or destination. `kontoReisenSichten` (`lib/account/reise-archiv.ts`) applies that search, then splits `status === 'archived'` from the date-only groups. Groups wait for `heutigesDatum()` and are device-calendar date-only. When `reisen.length >= 200`, the component states that search, groups, and archive apply only to that loaded subset.

`KontoReiseArchivAktion` calls `reiseArchivLebenszyklus` and then `router.refresh()` on `{ ok: true }`. It has no `try/catch`. A same-turn second click can pass `if (laeuft) return` before React re-renders. The effect resets `laeuft` and `meldung` whenever `reise.status` or `reise.archivePreviousStatus` changes, including a change that is not the result of this operation. The server action in `lib/trips/archiv-aktionen.ts` already validates with Zod, reads `status, metadata, updated_at`, and updates only when `id`, `status`, and `updated_at` still match. It revalidates `/reisen`, `/account`, and `/reisen/${tripId}`. That file stays frozen.

`textSuchfilter` (`lib/api/suchfilter.ts`) wraps the raw needle as `%${suche}%`, quotes it for PostgREST `or` grammar (`"`, `\`, comma, parentheses), and emits `column.ilike."..."`. It does not escape ILIKE `%` or `_`. `textSuchfilter(['title','origin'], '100%')` would emit `title.ilike."%100%%",origin.ilike."%100%%"`, which is a wildcard pattern, not the literal substring `reisePasstZurSuche` uses. The shared helper stays unchanged.

`TripSummary` (`types/trips.ts`) and `TRIP_STATUSES` (`draft | planned | booked | archived`) stay unchanged. `trips.title` and `trips.origin` are bounded by `char_length` 120 in the existing check constraints. `updated_at` is `timestamptz`.

Account home (`app/account/page.tsx`) and World (`app/account/welt/page.tsx`) call the same `reisenLaden()`. They stay capped at 200. That is an intentional frozen limit of this lane, not a silent fix.

Existing source assertions that lock the current shape, and therefore constrain the extraction, are named in section 8. They are not failures today.

## 2. Design

One authenticated collection read replaces `reisenLaden()` on `/reisen` only. `reisenLaden()` remains the Account-home and World reader, still capped at 200, still ordered only by `updated_at` descending.

### 2.1 Shared summary mapper

`lib/trips/reisen-uebersicht.ts` becomes the single pure source of:

- the existing `UEBERSICHT_SPALTEN` string, unchanged, including `metadata` and `trip_stages(name, position, country_code, place_id, latitude, longitude)`, `trip_days(count)`, `trip_items(count)`;
- the existing row types and the existing map to `TripSummary` (`anzahl`, `betrag`, `status`, stage fields, `stageCount: stages.length`, `archivePreviousStatus`).

`reisenLaden()` calls that helper and keeps its signature, `lese()`, the 200 limit, `order('updated_at', { ascending: false })`, error/empty separation, and the graph-read functions below it. No second mapper. No new column. No `user_id` predicate. No service role.

### 2.2 Bounded query contract

`lib/trips/reisen-sammlung-abfrage.ts` is pure. It owns parsing, cursor binding, address building, and the emitted filter description. It does not import Supabase.

Constants:

- `REISEN_SAMMLUNG_SEITENGROESSE = 48` displayed rows.
- Lookahead fetch size is that constant plus one. The extra row is not rendered. There is no count query, no offset, no caller-supplied limit, and no page-number arithmetic.
- Search raw maximum is 120 UTF-16 code units, matching the existing title/origin character cap as a hard reject before trim. A longer raw value is invalid; it is not truncated.
- Cursor raw maximum is 512 characters.
- Archive raw maximum is 16 characters.

URL on the existing `/reisen` route, via `leseOptionalRequestParam` from the existing `lib/next/request-api.ts` (import only):

| Param | Absent | Valid | Invalid, no database call |
| --- | --- | --- | --- |
| `q` | no text filter | one string, raw length ≤ 120, no NUL; committed needle is `trim` | array, NUL, raw length > 120 |
| `archiv` | `alle` | one of `alle`, `offen`, `archiv` | empty, array, or any other token, including a lifecycle status such as `archived` or `draft` |
| `cursor` | first page | one token that decodes as section 2.3 and binds to this `q` + `archiv` | array, oversized, malformed, bad version, bad timestamp, bad id, or filter mismatch |

Unknown parameters are ignored. Repeated values of `q`, `archiv`, or `cursor` arrive as arrays and are invalid. Whitespace-only `q` is a valid empty search and is omitted from the committed address, same as an empty needle in `reisePasstZurSuche`.

Archive selection is not a new lifecycle status. It only chooses a predicate over the existing `status` column:

- `alle`: no status predicate. The page may mix open and archived rows.
- `offen`: `status` not equal to `archived`, matching `offeneReisenAus`.
- `archiv`: `status` equal to `archived`, matching `archivierteReisenAus`.

Date grouping is not this predicate. After a successful read, the client classifies only the returned page with `kontoReisenSichten(zeilen, '', heute)`. The empty search needle makes `reisePasstZurSuche` a pass-through. The page does not apply a second JavaScript search, so a SQL match is not dropped by `de-CH` casing. Device-calendar grouping still waits for `heutigesDatum()` and still uses the frozen date-only helpers. Group counts and the hit count are counts of this page, with visible copy that they are not the account total. A partial page is not described as the whole account.

A committed filter change (`q` or `archiv`) builds a new address without `cursor`. Continuation keeps `q` and `archiv` and adds `cursor`. Addresses use `router.push` / links, not `replace`, so Back and Forward stay meaningful. The draft input is local until an explicit submit. Keystrokes do not query. Clear-search and restart are navigation to a new address; they do not call the archive action.

The rows on screen are the server props for the address that produced them. The client hook does not keep its own row cache. The visible owner line names the committed `q`, archive selection, and whether a cursor is present, and it says the unsent draft is not that query. `useTransition` may mark the controls pending while a navigation is in flight; the rows stay the last committed props until the next props arrive. A newer committed address replaces those props. An older navigation result is not applied by this client because it never stores rows.

### 2.3 Cursor and order

Order is `updated_at` descending, then `id` descending. `id` is the unique tie-break. The cursor stores the exact `updated_at` string returned for the last displayed row plus that row's `id`. It is not parsed through `Date` and not rewritten with `toISOString()`, because that truncates fractional seconds and can change the offset form.

Accepted timestamp shape, length ≤ 35, unquoted:

`YYYY-MM-DDTHH:mm:ss` plus an optional `.` and 1–6 digits, plus `Z` or `±HH:mm`.

Accepted id: canonical UUID, the same shape as `istKontoKennung`. The token stores the lowercase form.

The token is unpadded base64url of a JSON object with only these fields: `v` (must be `1`), `q` (committed trimmed needle), `a` (`alle|offen|archiv`), `t` (exact timestamp), `i` (uuid). Extra fields, wrong types, and a `q`/`a` that differ from the URL are a mismatch. Reject before any database call.

The next-page predicate, ANDed with the archive and search predicates, is:

`(updated_at < t) OR (updated_at = t AND id < i)`

with both values quoted in the PostgREST `or` value so `:`, `.`, and `+` stay one value. The synthetic boundary must show that exact string. This plan does not claim hosted PostgreSQL evaluated it.

Exactly-once traversal is promised only for an unchanged fixture walked through this seam. A live list can move when `updated_at` changes. Copy and the restart control say so. Refresh re-reads the current address; it is not a causal proof that a write is now visible.

The existing `(user_id, updated_at desc)` index is unchanged. No new index, RPC, or migration. The `id` tie-break is a sort/filter on top of that access path. Title/origin `ILIKE` is not indexed. Both are acceptable at account scale and are not a reason to change schema.

### 2.4 Literal title/origin search

The new reader, not `textSuchfilter`, owns literal LIKE semantics.

For a non-empty trimmed needle:

1. Escape `\` first, then `%`, then `_`, using a single backslash as the PostgreSQL `LIKE` default escape.
2. Pass that escaped needle to the unchanged `textSuchfilter(['title','origin'], escaped)`.
3. Apply the returned string with `.or(...)`.

Empty needle: omit the `.or` entirely.

That composition is what makes `100%`, `_`, `\`, `"`, and `,` a quoted literal substring pattern rather than a wildcard or a split `or` expression. The plan does not treat the helper's existing quoting tests as proof of `%` / `_` literals. The new unit test must assert the composed string. Hosted matching remains untested.

Actual matching semantics to state in the UI and the report, without claiming JavaScript equivalence:

- Fields: `title` and `origin` only. No stage name, no destination, no metadata.
- Server match: PostgreSQL `ILIKE` substring under the database collation, after the escapes above. `NULL` origin does not match, which agrees with optional chaining in `reisePasstZurSuche`.
- Not the same operation as `toLocaleLowerCase('de-CH')` + `includes`. Differences include `ß`/`ss`, Turkish casing, fullwidth characters, and Unicode normalization. The collection does not re-filter with the JavaScript function.
- No claim of NFC, of a specific hosted collation, or of identical results on PostgreSQL versus the local helper.

### 2.5 Reader

`lib/trips/reisen-sammlung-daten.ts` is `server-only`. It accepts only an already validated request. It uses `createServerComponentClient()` and `lese()` from `lib/api/datenbank-lesen.ts`. One query: the shared select, the archive predicate, the optional search `or`, the optional keyset `or`, both orders, and `limit(49)`. It maps through the shared helper, drops the lookahead row, and returns `{ zeilen, problem, hatWeiter, naechsterCursor }`. The cursor is built from the last displayed row's original `updated_at` string and `id`.

Invalid requests never call this function. Guests never call it. Account home and World never call it. No new route handler. No service role.

### 2.6 Page and collection UI

`app/(public)/reisen/page.tsx` keeps the guest branch, the single `getUser()`, `AccountNavigation`, `GastreiseBruecke`, `NICHT_INDEXIEREN`, `dynamic = 'force-dynamic'`, the `/planen` links, and the headings `Deine Reisen konnten nicht geladen werden.` and `Noch keine Reise in deinem Konto.`

For an authenticated valid request it calls the new reader instead of `reisenLaden()`. States stay distinct:

| State | Condition | What the user sees | Database |
| --- | --- | --- | --- |
| Invalid request | parser rejection | Not the empty-account heading. Restart link to `/reisen`. Controls remain. | not called |
| Read error | `problem` set | Existing error heading. Body must not say that the trips are saved and must not use the empty-account section. Explicit retry of this same address. | called, failed |
| Empty account | valid first page, `alle`, empty needle, zero rows, no problem | Existing empty-account section | called |
| No matches | valid first page, zero rows, needle or `offen`/`archiv` | `Keine Reise passt zur Suche.` or, when the needle is empty and only the archive selection is narrow, `Keine Reise in dieser Auswahl.` | called |
| End of continuation | valid cursor, zero rows, no problem | Not the empty-account heading. Say this continuation step is empty. Restart stays available. | called |
| Current page | one or more rows | Page-scoped counts. Next only when lookahead returned a row. | called |
| Pending navigation | transition in flight | Previous committed rows remain. Controls show that a newer address is loading. | the in-flight request only |

The existing 503 sentence `Deine Reisen sind gespeichert` is replaced on this page because a failed read must not assert that. The error heading stays so the current source assertion still matches.

`components/trips/MyTripsCollection.tsx` renders the committed result, the draft form, the archive-selection links, continuation, restart, and the page-scoped group/archive sections. It uses the existing premium-hub class helpers (`hubDarstellung`, `kartenRasterKlasse`, `leistenKlasse`, section title classes) and `KontoReiseEintrag`. It does not import Workspace, readiness, visa, provider, or citizenship modules.

`KontoReisenGruppen.tsx` stays mounted by `MeineReisenHubAudit` and keeps the current 200-cap disclosure for that in-memory fixture. The product route stops using it, so that disclosure is no longer the account-collection contract. This plan does not edit that component.

### 2.7 Archive workflow

`lib/trips/archiv-aktionen.ts` is not edited. The client still calls `reiseArchivLebenszyklus({ tripId, aktion })`.

`lib/trips/trip-archive-workflow.ts` is a pure state machine. `components/trips/useTripArchiveWorkflow.ts` adapts it to the button and to `router.refresh()`. `KontoReiseEintrag` only passes the controller into `KontoReiseArchivAktion`. The card remains an article whose link and button are siblings. `min-h-11`, `data-reisen-aktion`, `Archivieren`, `Wiederherstellen`, and `role="alert"` stay. No `fetch(`. No nested interactive control.

Captured at the user gesture, before the await: trip id, displayed `status`, `updatedAt`, `archivePreviousStatus`, action (`archivieren` or `wiederherstellen`), collection generation, and a monotonic operation id. Restore is not started when `previousStatusAusReise` is null; the existing fail-closed sentence stays.

Same-turn duplicate protection is a synchronous lock in the reducer, not `useState`, so two clicks in one turn cannot both start. A second click while `pending` does not start.

Outcomes:

| Outcome | How it is recognized | Next state | Automatic replay |
| --- | --- | --- | --- |
| Returned rejection | `{ ok: false, meldung: string }` | `rejected`, show `meldung` | no |
| Thrown or malformed | exception, or result whose `ok` is not boolean, or `ok: false` without a string `meldung` | `unknown` | no |
| Acknowledged, awaiting read | `{ ok: true }` | `acknowledged-awaiting-read`, then one `router.refresh()` of the current address | no |
| Settled visible | that same operation was acknowledged, and the later props for the same id show the expected next status | clear pending for that operation id | no |
| Target removed | acknowledged, and the new props for the same committed query no longer contain the id while the active archive selection would exclude the expected next status | `removed`, keep a short collection-level note | no |
| Same-id props changed first | props change before acknowledgement, or the new status is not the expected next status | do not mark success and do not clear a newer operation's feedback | no |

Expected next status is `archived` for archive, and the captured `archivePreviousStatus` for restore. Absence on `alle` after an acknowledgement is `unknown`, not success, because the row should still be on an unfiltered page if nothing else moved it.

Collection-level records are keyed by trip id plus operation id. Unmounting a card because of filter, cursor, or removal does not delete the record and does not start the action again when the card remounts. A full unmount of the collection drops the records with the component state. That limit stays explicit. Navigation does not call the action.

The current effect that clears pending on any `status` / `archivePreviousStatus` change is removed.

## 3. File ownership

Edit after plan acceptance, all already allowlisted:

- `app/(public)/reisen/page.tsx`
- `components/trips/KontoReiseArchivAktion.tsx`
- `components/trips/KontoReiseEintrag.tsx`
- `lib/trips/daten.ts` — mapper extraction and a call to it from `reisenLaden()` only

Add after plan acceptance, all already named by the TASK:

- `components/trips/MyTripsCollection.tsx`
- `components/trips/useMyTripsCollectionNavigation.ts`
- `components/trips/useTripArchiveWorkflow.ts`
- `lib/trips/reisen-uebersicht.ts`
- `lib/trips/reisen-uebersicht.test.ts`
- `lib/trips/reisen-sammlung-abfrage.ts`
- `lib/trips/reisen-sammlung-abfrage.test.ts`
- `lib/trips/reisen-sammlung-daten.ts`
- `lib/trips/reisen-sammlung-daten.test.ts`
- `lib/trips/trip-archive-workflow.ts`
- `lib/trips/trip-archive-workflow.test.ts`
- `docs/JETNITY_MY_TRIPS_COLLECTION_AND_ARCHIVE_WORKFLOW_COMPLETION_1_STATUS_2026-10-25.md`
- `docs/JETNITY_MY_TRIPS_COLLECTION_AND_ARCHIVE_WORKFLOW_COMPLETION_1_REPORT_2026-10-25.md`
- `docs/JETNITY_MY_TRIPS_COLLECTION_AND_ARCHIVE_WORKFLOW_COMPLETION_1_SELF_REVIEW_2026-10-25.md`
- `docs/JETNITY_MY_TRIPS_COLLECTION_AND_ARCHIVE_WORKFLOW_COMPLETION_1_HANDOFF_2026-10-25.md`
- `scripts/my-trips-collection-archive-workflow-completion-1/**`
- `docs/evidence/my-trips-collection-archive-workflow-completion-1/**`

Not edited: `lib/trips/archiv-aktionen.ts`, `lib/account/reise-archiv.ts`, `lib/account/reise-lage.ts`, `lib/api/suchfilter.ts`, `lib/trips/liste-grenze.ts`, `types/trips.ts`, guest storage and `GastReisen`, Workspace, Account home, World, graph reads, schema, RLS, Auth, providers, package files, workflows, operating mode, `ACTIVE_WORK_STATUS.md`, and this TASK.

`components/trips/KontoReisenGruppen.tsx` is allowlisted but this design leaves it byte-identical so the audit harness and its source assertions keep a true statement about that component.

## 4. Proof plan (after acceptance only)

Not run for this plan commit.

Pure and synthetic, in the new `node:test` files:

- 251 unchanged fixture rows, including at least three equal `updated_at` values with distinct ids, and two timestamps that differ only at microsecond precision. Walk the real page-query function against a fake client that records `from`, `select`, `order`, `limit`, `eq`/`neq`, and `or`, and returns the next slice from the fixture using the emitted cursor. Concatenated ids equal the fixture order exactly once.
- Empty first page, empty final page, lookahead row not rendered, malformed cursor, oversized cursor, cursor/filter mismatch, repeated params, invalid timestamp, invalid id, invalid archive token, oversized search. The fake client's call count stays 0.
- Composed search strings for title/origin, punctuation, comma, quotes, backslash, percent, underscore, and a non-ASCII needle. Assert the emitted `or` string and that the select list is the shared constant and does not add columns.
- `reisenLaden` regression: same mapper output, same 200 limit, same single `from('trips')` inside `reisenLaden`, no service role, no `user_id` equality. Source read of `app/account/page.tsx` and `app/account/welt/page.tsx` still shows `reisenLaden` and not the new reader. `reiseLaden` still uses `accountGraphLesen`.
- Archive reducer cases from section 2.7, including same-turn double `begin`, thrown result, malformed result, removal, same-id prop update, and query-generation change. No test calls the server action against a database.

Rendered proof, only if section 8.2 is approved:

- A script under `scripts/my-trips-collection-archive-workflow-completion-1/` drives the fixture route with Playwright and project CSS.
- Viewports 320, 390, 768, and 1440. Root font size 32px. Long title and origin. Dense page. Pending, error, and end states. `prefers-reduced-motion: reduce`.
- Real pointer and keyboard events: commit search, clear, restart, next, Back, Forward, rapid commits, retry of the committed address, archive rejection, thrown result, duplicate activation, acknowledged-awaiting-read, target removal, same-id update. Pagination controls must not call the action.
- Evidence directory records source SHA, tree, dirty state, commands, exit codes, versions, and stubs. Screenshots are sanitized fixtures. They are not hosted, authenticated, native-device, SQL/RLS, or Production evidence.

Then the ordinary project gates: Typecheck, lint, the five hygiene checks (`check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`), production build, and `npm test`. Native App/Auth/Vercel gates run on the pushed head. Skipped work is not a pass. Local environment failures are recorded.

Existing limits that stay limits: the two established conditional browser skips, the existing lint-warning baseline, the previously reported untriaged dependency advisories, guest cross-tab non-atomicity, and full-unmount of client state. #748 personal-browser/CUA stays suspended. #917 hosted readback stays denied. This lane does not open an alternate SQL, connector, or manual-SQL path.

## 5. Costs and security

No new provider, paid call, secret, index, database, or hosted service. Each collection view is one bounded authenticated read of at most 49 summary rows instead of one 200-row read on this route. No prefetch and no polling. The USD 100 monthly infrastructure boundary is unchanged. Noindex stays.

Auth remains the existing `getUser()` gate plus RLS. Invalid input is rejected before the query. The archive write keeps its status and `updated_at` guard. No new personal field is selected. Search text is a filter, not stored by this lane.

## 6. Findings left outside the lane

Account home and World still stop at 200 trips. Severity: product gap, not a defect introduced here. The TASK freezes those readers. A later slice would have to own them.

The list index does not include `id`. Tie-break correctness does not require a new index at this scale. Adding one would be a schema change and is not requested.

Server `ILIKE` and `reisePasstZurSuche` can disagree. The collection shows the server result and says so. The local helper stays the contract for the unchanged callers.

## 7. What this plan commit does not do

No Ready, no merge, no tracking close, no write to `main`, no follow-up slice, no self-PASS. Author self-review is not Technical-Lead acceptance. A later implementation head invalidates this plan head's gate.

Holds left unchanged: #985/#982, #917, #913/#911, #968, #748, #626, #937/#936, Bern #934, plus #944, #585, #960, and #957 as named in the TASK.

## 8. Narrow allowlist exceptions for Technical-Lead decision

These are not authorized by this plan. Implementation stops at the boundary until the plan review explicitly allows the listed files. No other file is requested.

### 8.1 Source assertions that cannot survive a single mapper and a page that no longer mounts `KontoReisenGruppen`

Required because the TASK demands one shared mapper and forbids a second copy, while these tests match source text in `lib/trips/daten.ts`:

- `lib/trips/archiv-aktionen.test.ts` — `const UEBERSICHT_SPALTEN = ... trip_items(count)`, `stageCount: stages.length`, `itemCount: anzahl(zeile.trip_items)`, `archivePreviousStatus: previousStatusAusMetadata`.
- `lib/trips/reise-orte.test.ts` — the same select constant and the `trip_stages(...)` field list inside `daten.ts`.
- `lib/account/world-map.test.ts` — `UEBERSICHT_SPALTEN` and `trip_stages(name, position, country_code, place_id, latitude, longitude)` inside `daten.ts`, plus one `.from('trips')` between `reisenLaden` and `reiseLaden`.

Requested change: point the select/mapping assertions at `lib/trips/reisen-uebersicht.ts`, and keep asserting that `reisenLaden` uses that helper, limits with `REISEN_LISTE_GRENZE`, contains one `.from('trips')`, and contains neither service role nor `eq('user_id'`.

Also:

- `lib/account/reise-gruppen-grenzen.test.ts` asserts `app/(public)/reisen/page.tsx` includes the identifier `KontoReisenGruppen`. The product page will include `MyTripsCollection` instead. Requested change: accept `MyTripsCollection` there, and keep the assertions for the error heading, the empty-account heading, `GastReisen`, `if (problem)`, no local `status = 'archived'`, and no `reiseArchivLebenszyklus` on the page. The 200-cap sentences stay required inside the unchanged `KontoReisenGruppen.tsx`.

`lib/trips/my-trips-premium-hub-ux-1.test.ts` can stay unchanged if `KontoReisenGruppen.tsx` and the archive button's required strings stay.

If this exception is refused, the single-mapper extraction cannot land without breaking those tests or duplicating the mapper. This lane would stop rather than duplicate it or game the assertions with a dead copy of the select string.

### 8.2 One audit-only route for the required rendered proof

The TASK requires rendered project-CSS pointer and keyboard evidence. The established harness pattern is `uiAuditSeiteAktiv` (`lib/ui-audit/freigabe.ts`): production always 404, and outside production only `JETNITY_UI_AUDIT=true|1` responds. The existing `app/(public)/ui-audit/meine-reisen/page.tsx` renders `KontoReisenGruppen` fixtures and is not this collection.

Requested new file only:

- `app/(public)/ui-audit/meine-reisen-sammlung/page.tsx`

It would call the existing `uiAuditSeiteAktiv`, `notFound()` otherwise, `robots` noindex, and render `MyTripsCollection` from synthetic props. No database, no write, no new environment variable, no change to `lib/ui-audit/freigabe.ts`.

If this exception is refused, this lane will not add a fixture backdoor on the product page. Rendered CSS/pointer evidence would then be an explicit skipped limit. Unit and synthetic query proof could still run.

## 9. Implementation order after explicit plan acceptance

1. Shared mapper and `reisenLaden` call-through, with the section 8.1 test retarget only if approved.
2. Pure URL/cursor/search contract and its tests.
3. Synthetic reader and the 251-row seam.
4. Page integration and `MyTripsCollection`, preserving guest and auth boundaries.
5. Archive state machine and the button wiring.
6. Rendered script and evidence, only with section 8.2.
7. Status, report, self-review, and handoff for that implementation head.

Until that acceptance, the next action is independent Technical-Lead review of the exact plan head. Same session. No further Owner confirmation is required for this internal gate.
