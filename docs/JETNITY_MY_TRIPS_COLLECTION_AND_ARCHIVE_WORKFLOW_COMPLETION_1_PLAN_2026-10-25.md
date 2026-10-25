# Jetnity My Trips Collection and Archive Workflow Completion 1 — PLAN

Date: 2026-10-25. **Plan only.** No implementation, test, audit, or other document change is authorized by this file.

Lane **M** of finite batch [#1011](https://github.com/Jetnity/jetnity/issues/1011). Tracking [#1014](https://github.com/Jetnity/jetnity/issues/1014). Draft PR [#1019](https://github.com/Jetnity/jetnity/pull/1019). Branch `feat/r107-my-trips-collection-archive-workflow-1`.

Immutable TASK: `docs/JETNITY_MY_TRIPS_COLLECTION_AND_ARCHIVE_WORKFLOW_COMPLETION_1_TASK_V1_2026-10-25.md`, blob `eeb1f1239e07df5d9d9bc7459c4c83918b947777`. This plan does not modify that file.

TASK seed: `195e35f07edf894ec3a4e69ba21b5bf28ae47b15`. The first plan head was `52e4b0c04a6547d3ec1461af9013fd3be5edd57c`, blob `f69ebc8ee95a2f0c0bebea78b4879deca208e3f6`. This revision answers Technical-Lead PLAN R1 (M-R1.1 through M-R1.4, M-EX1, M-EX2) on that head. The review head is the commit that contains this revision.

## 0. Identity, mode, and drift

Logical agent: **Jetnity My Trips Collection and Archive Workflow Completion 1 — Cursor Generation 1**.

Runtime read from this run's identity: `originalModelName=grok-4.7-high-fast`. Not Auto. No fallback was selected. Session `bc-27e5e422-852b-49c7-9b67-0fc723f13175`, https://cursor.com/agents/bc-27e5e422-852b-49c7-9b67-0fc723f13175.

Visible rename: the session-rename API accepted that exact title and returned it. This plan does not claim a separate screenshot of the agents list.

Machine mode at read: `.jetnity/operating-mode.json` `mode=NORMAL`. Product work on this dispatched branch is allowed. Special Product-Owner gates remain. This plan does not change operating mode, rulesets, or continuity files.

`git fetch origin main` for this R1 revision: `origin/main` is still `a74c443c6be3f064f150fcf021ab6154bda325e5`. Merge-base with the current branch is that same SHA. Before this revision commit the branch is **2 ahead / 0 behind**. No rebase, merge, or sibling cherry-pick was performed. Integration priority remains **T → S → D → W → M**.

Required reading used for this design: the immutable TASK; `AGENTS.md`; `JETNITY_START_HERE.md` (historical pointers only; live evidence wins); `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`; `docs/ACTIVE_WORK_STATUS.md` and the start-here handoff pointers (R106 is closed and is not reopened); `docs/JETNITY_MULTI_AGENT_SLICE_PLANNING_STANDARD.md`; `docs/JETNITY_THREE_PHASE_PRODUCT_STRATEGY_2026-09-01.md`; `docs/JETNITY_V1_BINDING_BUILD_ORDER_2026-09-01.md`.

Live issues read for this revision, not only the dispatch:

- [#751](https://github.com/Jetnity/jetnity/issues/751) is open, `updated_at` `2026-10-25T16:05:30Z`. Its current section is R107 V3. D has PLAN PASS and implementation authorization. T, W, and M revise PLAN R1. S revises one remaining PLAN R2 point. This lane is the named M session, last reviewed at `52e4b0c04a6547d3ec1461af9013fd3be5edd57c`, disposition PLAN R1 CHANGES REQUIRED. Accepted main in that checkpoint remains `a74c443c6be3f064f150fcf021ab6154bda325e5`. R106 is complete. The open P1 is Trip traveller relation-loss and belongs to lane T. Holds in that index are unchanged. D's authorization does not release this lane.
- [#1011](https://github.com/Jetnity/jetnity/issues/1011) is open, `updated_at` `2026-10-25T16:05:31Z`. The same V3 checkpoint names the five lanes, the same main, and integration order T → S → D → W → M. This lane does not take T's P1.

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
- Search raw maximum is 120 UTF-16 code units, matching the existing title/origin character cap as a hard reject before trim. A longer raw value is invalid; it is not truncated. U+0000 through U+001F and an unpaired surrogate are invalid. The committed needle is `trim` of an accepted raw value.
- Cursor raw maximum is `REISEN_SAMMLUNG_CURSOR_MAX = 626` unpadded base64url characters. Section 2.3 derives that number. It is not an arbitrary 512.
- Archive raw maximum is 16 characters.

URL on the existing `/reisen` route, via `leseOptionalRequestParam` from the existing `lib/next/request-api.ts` (import only):

| Param | Absent | Valid | Invalid, no database call |
| --- | --- | --- | --- |
| `q` | no text filter | one string, raw length ≤ 120, no C0 control, no unpaired surrogate; committed needle is `trim` | array, a control, an unpaired surrogate, raw length > 120 |
| `archiv` | `alle` | one of `alle`, `offen`, `archiv` | empty, array, or any other token, including a lifecycle status such as `archived` or `draft` |
| `cursor` | first page | one token that decodes as section 2.3 and binds to this `q` + `archiv` | array, oversized, malformed, bad version, bad timestamp, bad id, or filter mismatch |

Unknown parameters are ignored. Repeated values of `q`, `archiv`, or `cursor` arrive as arrays and are invalid. Whitespace-only `q` is a valid empty search and is omitted from the committed address, same as an empty needle in `reisePasstZurSuche`.

Archive selection is not a new lifecycle status. It only chooses a predicate over the existing `status` column:

- `alle`: no status predicate. The page may mix open and archived rows.
- `offen`: `status` not equal to `archived`, matching `offeneReisenAus`.
- `archiv`: `status` equal to `archived`, matching `archivierteReisenAus`.

Date grouping is not this predicate. After a successful read, the client classifies only the returned page with `kontoReisenSichten(zeilen, '', heute)`. The empty search needle makes `reisePasstZurSuche` a pass-through. The page does not apply a second JavaScript search, so a SQL match is not dropped by `de-CH` casing. Device-calendar grouping still waits for `heutigesDatum()` and still uses the frozen date-only helpers. Group counts and the hit count are counts of this page, with visible copy that they are not the account total. A partial page is not described as the whole account.

A committed filter change (`q` or `archiv`) builds a new address without `cursor`. Continuation keeps `q` and `archiv` and adds `cursor`. Navigation uses `router.push`, not `replace`, so Back and Forward stay meaningful. The draft input is local until an explicit submit. Keystrokes do not query. Clear-search and restart navigate to a new address and do not call the archive action.

Continuation, archive selection, clear, and restart are buttons. The click handler is the only call to `router.push`. The collection does not render `next/link` for those addresses and does not call `router.prefetch`. A viewport, hover, or idle pass therefore does not issue a page read. One explicit activation is one read of that address. There is no hidden next page and no background continuation.

The visible owner line names the committed `q`, archive selection, and whether a cursor is present, and it says the unsent draft is not that query. It does not show the filter grammar. Section 2.8 is the navigation lifecycle. The collection component in section 2.6 stays mounted across those transitions.

### 2.3 Cursor and order

Order is `updated_at` descending, then `id` descending. `id` is the unique tie-break. The cursor stores the exact `updated_at` string returned for the last displayed row plus that row's `id`. It is not parsed through `Date` and not rewritten with `toISOString()`, because that truncates fractional seconds and can change the offset form.

The timestamp check reads the original string. It does not call `Date`, does not pad or strip fractional digits, and does not emit a replacement string. The cursor stores and compares that original string.

Shape, entire string only: `YYYY-MM-DDTHH:mm:ss`, an optional `.` plus 1–6 digits, then `Z` or `±HH:mm`. Then semantic rejection:

- year `0001`–`9999`; month 1–12; day present in that Gregorian month, with 29 February only in a leap year (divisible by 4, and not by 100 unless also by 400);
- hour 0–23, minute 0–59, second 0–59 (no leap second);
- offset hour 0–15 and minute 0–59, so `+15:59` and `-15:59` pass and `+16:00`, `+15:60`, and `+24:00` fail.

`2026-02-29`, `2026-04-31`, `2026-01-01T24:00:00Z`, and `2026-01-01T00:00:00.1234567Z` fail. `2024-02-29T00:00:00.1Z` and `2024-02-29T00:00:00.10Z` both pass and stay different strings.

Accepted id: lowercase canonical UUID, 8-4-4-4-12 hex, the same shape as `istKontoKennung`. Uppercase hex fails. The check does not require a version nibble.

The token is unpadded base64url of UTF-8 JSON from `JSON.stringify` with only these keys in this order: `v`, `q`, `a`, `t`, `i`. `v` is the number `1`. `q` is the committed trimmed needle. `a` is `alle`, `offen`, or `archiv`. `t` and `i` are strings that already passed the checks above. An array, a missing key, an extra key, a string `v`, or a `q`/`a` that differs from the URL is a mismatch. Reject before any database call.

`REISEN_SAMMLUNG_CURSOR_MAX` is the length of that encoding for every accepted payload, not only one example. `JSON.stringify` on this server leaves a code unit outside U+0000–U+001F as itself, except `"` and `\`, which become two bytes. An unpaired surrogate is already rejected. A supplementary character costs 4 UTF-8 bytes and 2 code units. The maximum is therefore 3 UTF-8 bytes per accepted code unit, and 120 units are 360 bytes. U+2028 and U+2029 stay in that class in this runtime; they are not expanded to `\u2028`. The fixed envelope around that text, with `a` = `archiv`, `t` = `2026-10-25T23:59:59.123456+14:59` (32 characters, the longest accepted timestamp), and `i` = `ffffffff-ffff-ffff-ffff-ffffffffffff`, is 109 bytes. The total is 469 UTF-8 bytes and 626 unpadded base64url characters. U+754C repeated 120 times is one string in that maximum class. A shorter accepted search produces a shorter token and still passes. A token of 627 characters fails even if the rest would decode. The earlier 512 cap rejected this 120-character search (an independent fixture of the same shape was 623). C0 controls are rejected in `q` because `JSON.stringify` expands them to `\u00XX` (6 bytes) and that form would exceed 626; they are not truncated into a cursor. The roundtrip tests in section 4 cover this maximum, U+2028 at 120 units, the escaping overhead of 120 metacharacters, and impossible timestamps.

The next-page predicate, ANDed with the archive and search predicates, is:

`(updated_at < t) OR (updated_at = t AND id < i)`

with both values quoted in the PostgREST `or` value so `:`, `.`, and `+` stay one value. The synthetic boundary must show that exact string. This plan does not claim hosted PostgreSQL evaluated it.

Exactly-once traversal is promised only for an unchanged fixture walked through this seam. A live list can move when `updated_at` changes. Copy and the restart control say so. Refresh re-reads the current address; it is not a causal proof that a write is now visible.

The existing `(user_id, updated_at desc)` index is unchanged. No new index, RPC, or migration. The `id` tie-break is a sort/filter on top of that access path. The literal title/origin filter is not indexed. Both are acceptable at account scale and are not a reason to change schema.

### 2.4 Literal title/origin search

`textSuchfilter` cannot represent a literal asterisk. The PostgREST operator reference says `*` in `like` and `ilike` is an alias of `%` ([operators](https://docs.postgrest.org/en/stable/references/api/tables_views.html#operators)). PostgREST v13.0.7 implements that with `T.map star` on every `ilike` value, including a plain `column.ilike` value, and the map has no escape (`src/PostgREST/Query/SqlFragment.hs`; `ilike` is parsed as `OpQuant` with an empty quantifier). Its query spec treats `ilike.xy*` as a wildcard (`test/spec/Feature/Query/QuerySpec.hs`). A backslash before `*` does not survive: the quoted-value parser consumes the backslash, then `star` still rewrites the asterisk. The frozen helper always emits `.ilike.` and wraps `%…%`, so composing with it still broadens `*`. The helper stays unchanged. The user does not supply a regular expression.

`lib/trips/reisen-sammlung-abfrage.ts` owns the filter string. Empty needle: omit the search `or`. Otherwise:

1. Walk the trimmed needle and prefix a backslash to each of `\ . + * ? ^ $ ( ) [ ] { } |`. Every other character, including `%`, `_`, comma, and non-ASCII characters, is copied. This is a closed literal encoding for PostgreSQL `~*`. It does not leave a quantifier, anchor, or character class under user control.
2. Quote that pattern the way `zitiere` in `lib/api/suchfilter.ts` quotes a value: double each backslash, escape `"`, wrap in double quotes. Do not call `textSuchfilter`.
3. Emit `title.imatch.<quoted>,origin.imatch.<quoted>`.

`imatch` is `~*`. In the same SqlFragment, `~*` is not passed through `T.map star`, so an asterisk can remain a literal. The match is unanchored, which is a substring. Worked wire strings the unit test must assert exactly:

- `*` → `title.imatch."\\*",origin.imatch."\\*"`
- `%` → `title.imatch."%",origin.imatch."%"`
- `_` → `title.imatch."_",origin.imatch."_"`
- `\` → `title.imatch."\\\\",origin.imatch."\\\\"`
- `"` → `title.imatch."\"",origin.imatch."\""`
- `,` → `title.imatch.",",origin.imatch.","`
- `界` → `title.imatch."界",origin.imatch."界"`
- `100%` → `title.imatch."100%",origin.imatch."100%"`
- `a,b)` → `title.imatch."a,b\\)",origin.imatch."a,b\\)"`

A needle of 120 asterisks produces a filter of length 752. A needle of 120 backslashes produces a filter of length 992. Both are finite. The cursor stores the raw needle, so those filters do not lengthen the token past 626. The synthetic client records this `or` string. Hosted PostgreSQL is not executed. Jetnity's hosted PostgREST build is not read.

The routine UI does not show `imatch`, backslashes, or the filter string. It says the search looks at title and origin, and that the server's case handling can differ from this device. Report and proof state the actual limits: fields are `title` and `origin` only; `NULL` origin does not match; `~*` case-insensitivity follows the database's regular-expression rules, not `ILIKE` and not `toLocaleLowerCase('de-CH')`. `ß`/`ss`, Turkish casing, fullwidth characters, and normalization can diverge. The page does not re-filter with `reisePasstZurSuche`. There is no claim of NFC or of a specific hosted collation.

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

For every authenticated response, including invalid parameters, empty account, no matches, end of continuation, a normal page, and a read error, the page renders one `MyTripsCollection` and does not pass a `key` built from `q`, `archiv`, `cursor`, or the error. Those transitions do not remount the controller, so an unresolved archive operation stays in that mounted state. The guest branch does not mount it. Leaving `/reisen`, or a later guest render of this route, unmounts it. That full-route unmount drops client operation state. The report states that limit. The screen does not promise that an in-flight action survives leaving the route.

`components/trips/MyTripsCollection.tsx` renders the committed result, the draft form, the archive-selection buttons, continuation, restart, and the page-scoped group/archive sections. It uses the existing premium-hub class helpers (`hubDarstellung`, `kartenRasterKlasse`, `leistenKlasse`, section title classes) and `KontoReiseEintrag`. It does not import Workspace, readiness, visa, provider, or citizenship modules.

`KontoReisenGruppen.tsx` stays mounted by `MeineReisenHubAudit` and keeps the current 200-cap disclosure for that in-memory fixture. The product route stops using it, so that disclosure is no longer the account-collection contract. This plan does not edit that component.

### 2.7 Archive workflow

`lib/trips/archiv-aktionen.ts` is not edited. The client still calls `reiseArchivLebenszyklus({ tripId, aktion })`.

`lib/trips/trip-archive-workflow.ts` is a pure classifier and record updater. `components/trips/useTripArchiveWorkflow.ts` holds the imperative guard and calls the action. `KontoReiseEintrag` only passes the controller into `KontoReiseArchivAktion`. The card remains an article whose link and button are siblings. `min-h-11`, `data-reisen-aktion`, `Archivieren`, `Wiederherstellen`, and `role="alert"` stay. No `fetch(`. No nested interactive control.

The same-turn mutex is `archiveInvocationRef` in the hook, a ref, not a reducer update and not `useState`. Its value is `null` or `{ operationId, tripId, collectionId }`. `collectionId` is assigned once when the controller mounts and is the mounted collection, not the URL. `begin` reads and writes the ref synchronously:

1. If the ref is already set, return without calling the action. A second click in the same turn or while the call is in flight does not start.
2. Otherwise assign the ref before `setState` and before the call.
3. The call sits in `try`. `catch` records `unknown` for a synchronous throw and for a rejected promise. `finally` sets the ref back to `null` only when `ref.current.operationId` is still this operation. Feedback is applied only when the hook is still mounted, `collectionId` still matches, and the record for that trip still carries this `operationId`. Any other completion is obsolete and does not change feedback.

Captured at the gesture, before the await: trip id, displayed `status`, `updatedAt`, `archivePreviousStatus`, action (`archivieren` or `wiederherstellen`), `collectionId`, and the operation id. Restore is not started when `previousStatusAusReise` is null; the existing fail-closed sentence stays.

The frozen action's success value is `Aktionsergebnis<null>`: `{ ok: true, wert: null }`. Classification accepts a plain object only:

| Class | Exact shape | What it means | What it does not mean |
| --- | --- | --- | --- |
| `acknowledged` | own keys exactly `ok` and `wert`, `ok === true`, `wert === null` | This call returned the success contract. One `router.refresh()` of the current address may follow. | It is not proof the list already shows the write. |
| `returned-negative` | own keys exactly `ok` and `meldung`, `ok === false`, `meldung` a non-empty string | Show `meldung`. Do not refresh as success. | The action uses this same shape for a domain refusal, `meldungAus` after a read or write error, and the optimistic-guard miss. A negative result is not proof of rollback and not proof the row is unchanged. |
| `unknown` | throw, non-object, array, extra key, `{ ok: true }` without `wert: null`, `{ ok: true, wert: null, extra }`, `{ ok: false }` without a non-empty string `meldung`, or any other `wert` | The outcome is unknown. No refresh-as-success. | No automatic replay. |

`write` and `observation` stay separate fields on the collection record. `write` changes only from the classified call. Later props update `observation` only: `unread`, `row-status` (the row is present and its displayed status is recorded), or `row-absent`. A matching status, a different status, or absence is observed list state. None of them changes `write`, clears an acknowledgement, or counts as a transaction receipt. Copy can say that the action returned success and, separately, what the current list shows. It does not say the list proves the write. Expected status remains `archived` for archive and the captured `archivePreviousStatus` for restore, as a label for the observation, not as a commit proof.

Collection-level records are keyed by trip id plus operation id. Unmounting a card because of filter, cursor, empty, error, or removal does not delete the record and does not start the action again when the card remounts. A full route unmount drops the records with the controller. Navigation does not call the action.

The current effect that clears pending on any `status` / `archivePreviousStatus` change is removed.

### 2.8 Navigation and retry lifecycle

`useMyTripsCollectionNavigation` keeps three things: the draft, the committed result taken from server props, and `pendingIntentRef`. The ref is set synchronously in the handler before `router.push` or `router.refresh`, to `{ generation, address, kind }` where `kind` is `commit`, `retry`, `continue`, `clear`, `restart`, or `archiv`. Generation increases on every accepted intent.

Reducer law `sammlungAnzeige`, which the hook and its tests both follow:

- Committed rows, problem, and cursor belong to the props address. The draft never owns them. Editing the draft does not cancel a pending retry and does not change that owner.
- Retry addresses the committed props address, not the unsent draft. A second retry gesture while a retry of that same address is pending does not call `refresh` or `push` again. When that intent completes, a later explicit retry may start one new read.
- A new commit, archive selection, continuation, clear, or restart supersedes an older intent. An arrival whose generation is lower than the latest intent does not replace the committed result.
- An arrival whose address equals the latest intent acknowledges it and becomes the committed owner. The same address arriving again, with the same rows or with an error, clears pending once and leaves archive records unchanged.
- Back or Forward adopts the address in the new props as the committed owner and supersedes a pending intent that pointed elsewhere. It does not apply an older in-flight result as if it were the new commit.
- A read error for the acknowledged address replaces the rows for that address. It does not render the empty-account state and does not drop archive records.

Pending intent is visible before the URL props match it. Until they match, the rows on screen remain the previous committed result.

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
- Empty first page, empty final page, lookahead row not rendered, malformed cursor, a 627-character cursor, cursor/filter mismatch, repeated params, impossible dates, times, and offsets from section 2.3, uppercase and malformed ids, extra JSON fields, wrong JSON types, invalid archive token, oversized search, and a C0 control in `q`. The fake client's call count stays 0.
- Cursor roundtrip: U+754C repeated 120 times encodes to 626 unpadded base64url characters, decodes to the same needle and the same unpadded timestamp, and is accepted. U+2028 repeated 120 times also encodes to 626 and is accepted. Separate needles of 120 `*`, 120 `%`, 120 `_`, 120 `\`, 120 `"`, and 120 `,` each roundtrip through the cursor at or under 626 and through the emitted `imatch` string in section 2.4. The 120-asterisk filter is 752 characters. The 120-backslash filter is 992 characters. Those emitted strings contain `imatch` and do not contain `ilike`. The select list is the shared constant and does not add columns.
- `reisenLaden` regression: same mapper output, same 200 limit, same single `from('trips')` inside `reisenLaden`, no service role, no `user_id` equality. Source read of `app/account/page.tsx` and `app/account/welt/page.tsx` still shows `reisenLaden` and not the new reader. `reiseLaden` still uses `accountGraphLesen`.
- Archive cases from section 2.7: synchronous throw, rejected promise, exact `{ ok: true, wert: null }`, `{ ok: true }` without `wert`, extra keys, `{ ok: false, meldung }`, `{ ok: false }` without `meldung`, duplicate gesture while `archiveInvocationRef` is set, and an obsolete completion after a newer operation id or after unmount. A later list snapshot updates `observation` only. No test calls the server action against a database.
- Navigation reducer: pending intent before props acknowledgement, newer commit superseding a retry, duplicate retry suppressed, same-address success and error completion, and a stale generation that does not replace the committed owner.

Rendered proof is mandatory. M-EX2 declines a new app route and does not waive this proof. After plan acceptance, `scripts/my-trips-collection-archive-workflow-completion-1/` follows the existing esbuild and Playwright pattern in `scripts/account-traveller-management-completion-1/run.mjs`:

- esbuild bundles the real `MyTripsCollection`, `KontoReiseEintrag`, and `KontoReiseArchivAktion`. Aliases replace only `next/navigation` and `@/lib/trips/archiv-aktionen`. Project CSS comes from the existing PostCSS/Tailwind pipeline on `styles/globals.css`. A local static server serves that bundle. There is no Next route, no `ui-audit` page, no session, and no Supabase client.
- The navigation shim records `push`, `refresh`, and `prefetch`. The proof fails if `prefetch` is called or if a continuation control issues a read before the pointer or keyboard activation.
- The action shim returns a deferred promise, an exact `{ ok: true, wert: null }`, a thrown error, a malformed fulfillment, or `{ ok: false, meldung }`. The wrapper then passes the next scripted props. A resolved refresh is not treated as a list observation.
- Viewports 320, 390, 768, and 1440. Root font size 32px on `documentElement`. Long title and origin. Dense page. Pending, error, and end states. `prefers-reduced-motion: reduce`.
- Real pointer and keyboard events: commit search, clear, restart, next, Back, Forward, rapid commits, retry of the committed address, returned negative, thrown result, duplicate activation, acknowledged write beside a separate list observation, target absence, and a same-id prop update. Pagination controls must not call the action. The collection stays mounted across those transitions; the test reads the same controller instance.
- Evidence under `docs/evidence/my-trips-collection-archive-workflow-completion-1/` records source SHA, tree, dirty state, commands, exit codes, versions, the alias boundary, and the stubs. Screenshots are sanitized fixtures. They are not hosted, authenticated, native-device, zoom, screen-reader, SQL/RLS, or Production evidence. Setting root font size is not browser zoom.

Then the ordinary project gates: Typecheck, lint, the five hygiene checks (`check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`), production build, and `npm test`. Native App/Auth/Vercel gates run on the pushed head. Skipped work is not a pass. Local environment failures are recorded.

Existing limits that stay limits: the two established conditional browser skips, the existing lint-warning baseline, the previously reported untriaged dependency advisories, guest cross-tab non-atomicity, and full-unmount of client state. #748 personal-browser/CUA stays suspended. #917 hosted readback stays denied. This lane does not open an alternate SQL, connector, or manual-SQL path.

## 5. Costs and security

No new provider, paid call, secret, index, database, or hosted service. Each collection view is one bounded authenticated read of at most 49 summary rows instead of one 200-row read on this route. No prefetch and no polling. The USD 100 monthly infrastructure boundary is unchanged. Noindex stays.

Auth remains the existing `getUser()` gate plus RLS. Invalid input is rejected before the query. The archive write keeps its status and `updated_at` guard. No new personal field is selected. Search text is a filter, not stored by this lane.

## 6. Findings left outside the lane

Account home and World still stop at 200 trips. Severity: product gap, not a defect introduced here. The TASK freezes those readers. A later slice would have to own them.

The list index does not include `id`. Tie-break correctness does not require a new index at this scale. Adding one would be a schema change and is not requested.

Server `~*` and `reisePasstZurSuche` can disagree. The collection shows the server result and says, in ordinary language, that server case handling can differ from the device. The local helper stays the contract for the unchanged callers.

## 7. What this plan commit does not do

No Ready, no merge, no tracking close, no write to `main`, no follow-up slice, no self-PASS. Author self-review is not Technical-Lead acceptance. A later implementation head invalidates this plan head's gate.

Holds left unchanged: #985/#982, #917, #913/#911, #968, #748, #626, #937/#936, Bern #934, plus #944, #585, #960, and #957 as named in the TASK.

## 8. Allowlist decisions from PLAN R1

No further exception is requested. This revision does not edit the files below.

### 8.1 M-EX1 accepted for implementation after a later PLAN PASS

After that PASS, the select and mapper observation points may move to `lib/trips/reisen-uebersicht.ts` in:

- `lib/trips/archiv-aktionen.test.ts`
- `lib/trips/reise-orte.test.ts`
- `lib/account/world-map.test.ts`

Every existing field, count, provenance, and forbidden-transit assertion stays. The tests still prove `reisenLaden()` calls that one helper with one authenticated `from('trips')`, `REISEN_LISTE_GRENZE` of 200, the original `updated_at` descending order, `lese()` error behavior, no service role, and no `eq('user_id'`. `reiseLaden` and `accountGraphLesen` stay in `daten.ts` unchanged.

`lib/account/reise-gruppen-grenzen.test.ts` may expect `MyTripsCollection` on `app/(public)/reisen/page.tsx`. It still requires the guest branch, the single `getUser()`, the error heading distinct from the empty-account heading, no client status write, and no `reiseArchivLebenszyklus` on the page. The unchanged `KontoReisenGruppen.tsx` still has to carry the current 200-cap sentences. There is no broad rewrite of that suite. `lib/trips/my-trips-premium-hub-ux-1.test.ts` stays as it is while that component and the archive button's required strings stay.

### 8.2 M-EX2 declined

A new `app/(public)/ui-audit/meine-reisen-sammlung/page.tsx` will not be added. No fixture flag will be added to the product page. The mounted proof in section 4 uses the named script and evidence directories, the real collection components, and project CSS. Declining the route does not skip that proof.

## 9. Implementation order after explicit plan acceptance

1. Shared mapper and `reisenLaden` call-through, with the section 8.1 test retarget.
2. Pure URL/cursor/search contract and its tests, including the 626-character cursor and the `imatch` strings.
3. Synthetic reader and the 251-row seam.
4. Page integration and `MyTripsCollection`, one mounted controller, no prefetch.
5. Archive ref guard, classifier, and button wiring.
6. esbuild/Playwright script and evidence.
7. Status, report, self-review, and handoff for that implementation head.

Until that acceptance, the next action is independent Technical-Lead re-review of this exact plan head. Same session. No further Owner confirmation is required for this internal gate. Implementation, tests, and audit stay stopped.
