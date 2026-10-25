# Jetnity Admin User Directory Completion 1 — PLAN

Date: 2026-10-25
Status: **PLAN R1 correction.** Still plan only. No implementation, test, audit, or other document is authorized by this file. This revision answers TL PLAN REVIEW R1 on exact head `bb93d72d79fc46d88246778c8256753ac8fc0b5c`, PLAN blob `cab569bc912b16a3dcab576d7de14e340bce56bd`: D-R1.1, D-R1.2, and the D-EX1 disposition.
Author: **Jetnity Admin User Directory Completion 1 — Cursor Generation 1**
Lane: R107 **D**. Tracking [#1015](https://github.com/Jetnity/jetnity/issues/1015). Finite batch [#1011](https://github.com/Jetnity/jetnity/issues/1011). Canonical index [#751](https://github.com/Jetnity/jetnity/issues/751).
Branch: `feat/r107-admin-user-directory-1`
Draft PR: #1020
Immutable TASK V1: `docs/JETNITY_ADMIN_USER_DIRECTORY_COMPLETION_1_TASK_V1_2026-10-25.md` (byte-identical; not edited here)
TASK blob: `704b63dc2f0da1df30db73988cf7e3bb4ed6cbfb`

## Session and model

- Logical name: **Jetnity Admin User Directory Completion 1 — Cursor Generation 1**
- Cursor session: `bc-cc48889b-f8c5-4cce-9892-1daa0eab7fc6`
- Session URL: https://cursor.com/agents/bc-cc48889b-f8c5-4cce-9892-1daa0eab7fc6
- Actual model: `grok-4.7-high-fast` (`originalModelName` on this run). Requested Grok 4.7 High Fast. No Auto fallback and no other model.
- Visible UI rename is supported on this run. It was applied to that exact logical name. This paragraph is the author attestation, not an independent Technical-Lead observation of the Cursor UI.
- Node `v22.23.4`.

## Live read

- Operating mode re-read this session: `NORMAL` (`.jetnity/operating-mode.json`). This bounded admin read surface is allowed. Special Product-Owner gates stay in force. This plan does not cross one.
- Fetched `origin/main` again at this R1 correction: **a74c443c6be3f064f150fcf021ab6154bda325e5**, tree **c1fe5a50b0da710ef425674057f782b1dff6f8bc**. Merge-base is that same SHA. Before this correction the branch was **2 ahead / 0 behind**. No main drift. No rebase, merge, or sibling cherry-pick.
- Seed HEAD **1718577ef469b709cbe270c7ec25de87f8aadd4b**, tree **a0c058df51a430d1664f0a8c80b7832b5d155124**. Sole parent and merge-base `a74c443c6be3f064f150fcf021ab6154bda325e5`. The reviewed plan head is the second commit. This correction is plan text only.
- Local `next-env.d.ts` was already dirty in the worktree (4-line environment drift). It is not staged and is not part of this delivery.
- Startup, Technical-Lead/Cursor operating standard, multi-agent operating and slice-planning standards, three-phase strategy, and V1 binding build order were read. `JETNITY_START_HERE.md` and `docs/ACTIVE_WORK_STATUS.md` still open on the R106 closure. Those markers are historical. They do not override #751, #1011, or this fetched main. R106 is not reopened.
- V1 binding build order §9 asks for an Admin operations minimum and explicitly does not require full Admin D–K before V1. Three-phase strategy Phase 1 item 14 includes necessary user administration and forbids fake data. This lane completes the existing `/admin/users` read journey only.
- Integration priority remains **T → S → D → W → M**. Other four branches are not dependencies. A later main move waits for an explicit same-session instruction.
- Standing exclusions stay binding: #985/#982 HOLD, #917 denied hosted readback, #913/#911 block, #968 PAUSED, #748 CUA SUSPENDED, #626 STOP, #937/#936 PAUSED, Bern #934 HARD-BLOCKED, and the other task exclusions. No hosted database, personal browser, credential, provider, payment, legal, or launch action.

## Traveller context

Not relevant. The directory lists account `role` and `status` already stored on `profiles`. It does not read citizenship, travel documents, residence, or route eligibility, and it does not create a second identity model.

## Source-confirmed gaps

Read on this seed. Not yet re-executed in a browser. Current files:

- `app/(admin)/admin/users/page.tsx`
- `components/admin/UsersTable.tsx`
- `lib/admin/users-search-navigation.ts` and `lib/admin/users-search-navigation.test.ts`
- Frozen neighbors used as contracts: `lib/api/suchfilter.ts`, `lib/api/datenbank-lesen.ts`, `lib/admin/ladezustand.ts`, `components/admin/Ladezustand.tsx`, `lib/admin/profil-erstellt.ts`, `lib/auth/roles.ts`, `app/(admin)/admin/users/actions.ts`

1. **Unsafe page arithmetic.** `page.tsx` lines 43–47 do `const q = (params?.q ?? '').trim()` and `const page = Math.max(1, Number(params?.page ?? 1))`, then `(page - 1) * 20`. `Number` accepts `Infinity`, fractions, and exponent forms. `Math.max(1, NaN)` is `NaN`. A repeated or non-string `q` has no `trim` and throws before a controlled state. Those values can reach `.range`.
2. **Count default.** Line 66 is `count = 0`. `null`, missing, and non-finite counts become zero. `UsersTable` line 135 then does `Math.max(1, Math.ceil(total / pageSize))`, so an unknown count and an empty directory both look like one page.
3. **False empty and page chrome.** Lines 245 and 321–326 render `Seite {page} / {maxPage}` and `Keine Nutzer gefunden.` for every empty row set. A request for page 99 with one real page becomes “Seite 99 / 1” plus the empty sentence. The error return at lines 73–83 renders `Fehlerflaeche` and drops the toolbar, so the operator cannot clear the query that failed.
4. **Order is not a total order.** Line 54 orders only `created_at` descending. Equal timestamps have no unique `user_id` tie-break.
5. **Dates can throw.** `UsersTable` lines 274 and 278 call `dtf.format(new Date(value))` whenever the string is truthy. `new Date('not-a-date')` is an Invalid Date, and `Intl.DateTimeFormat.format` throws `RangeError`. `profilErstellt` correctly keeps `null`/`undefined` unknown and keeps `''` as `''`. It does not validate a malformed timestamp, and it must not start doing so.
6. **No role/status read filter.** The same canonical `ROLES` and `ACCOUNT_STATUSES` are already visible as badges and as the frozen action menu. The URL contract is only `q` and `page`, plus any foreign key left untouched by `buildUsersListHref`.
7. **Accepted #608 behavior is in the client, not in the server parser.** `UsersTable` lines 67–148 own debounce (400 ms), own-ack, popstate cancellation, no mount reset, and page-click cancellation of a pending text timer. `buildUsersListHref` coerces a non-finite page to `1` (navigation test “ungueltige Seite wird zu 1”). That outbound coercion stays. Inbound URLs must not use it.

`lib/next/request-api-compat.test.ts` lines 227–233 require the page to keep `leseOptionalRequestParam`, the exact unsafe `q`/`page` lines, `PAGE_SIZE = 20`, and `(await createServerComponentClient()) as any`. `lib/admin/profil-erstellt.test.ts` lines 23–35 require `profilErstellt(r?.created_at)`, `last_seen_at ?? null`, no `new Date().toISOString()`, and the exact unsafe `dtf.format(new Date(...))` ternaries. Both files are outside the allowlist. See the exception below. They are not decoy-satisfied by leaving the unsafe expressions in place.

The historical mounted script `scripts/admin-users-search-navigation-1-verify.mjs` expects placeholder `Suche nach Name oder E-Mail…` and page text `3 / 3`. The current table uses `Name oder E-Mail suchen…` and `Seite {page} / {maxPage}`. That script is already stale on this seed, is not part of `npm test`, and is not on this allowlist. It will not be edited. The unit file `users-search-navigation.test.ts` is the live #608 assertion set and must keep every current expectation.

## D-EX1 — accepted assertion exception, not implementation permission

TL PLAN REVIEW R1 accepts the two source-justified test adaptations. They may be edited only after a later explicit PLAN PASS, and only as follows. This correction does not edit them. All other tests and runtime contracts stay frozen. This is not broad test relaxation.

1. `lib/next/request-api-compat.test.ts`, only the Admin Users q/page test. Replace the obsolete assertions that lock the unsafe `q` trim and `Math.max(1, Number(page))` expressions. Preserve awaited request access, `PageRequestParam<SearchParams>`, page size 20, the existing `(await createServerComponentClient()) as any` acquisition, and validated-before-query ordering. Do not change any other page in that file.
2. `lib/admin/profil-erstellt.test.ts`, only the table-formatter assertions that lock `dtf.format(new Date(...))`. Point them at the safe formatter. Preserve null/empty provenance, the page mapping `profilErstellt(r?.created_at)` and `last_seen_at ?? null`, and no render-clock fallback. Keep the **de-CH medium/short** guarantee. If formatting moves into `formatUsersDirectoryTimestamp`, move that locale assertion's observation point to the formatter; do not drop the guarantee. Do not edit `lib/admin/profil-erstellt.ts`.

No other unlisted file is required. `components/admin/users/UsersDirectory.tsx` is not created: the #608 state machine already lives in `UsersTable`, and a second shell is not needed.

## Design

### Inbound query

New pure module `lib/admin/users-directory-query.ts`. No Next, React, or Supabase import.

Constants:

- `USERS_DIRECTORY_PAGE_SIZE = 20`
- `USERS_DIRECTORY_Q_MAX = 200` (JavaScript string length after trim)
- `USERS_DIRECTORY_MAX_PAGE = 5000` (range `99980–99999`)

`5000` is the single operational page ceiling for every destination, not only for inbound rejection. A page whose range end is a safe integer can still be near `2^53` and force a large Postgres offset for 20 rows. Inbound `page=5001` is invalid and does not query; it is not coerced to 5000. Outbound pager, first, last, and recovery links are also confined to **1…5000**. At the ceiling the control is disabled. It does not emit an invalid request. The page file keeps the source literal `const PAGE_SIZE = 20`, and a test asserts it equals the module constant. The real known count stays visible even when the real last page is above 5000. That real span is not a link.

`decideUsersDirectoryRead(raw)` accepts `undefined`, a plain record, or `URLSearchParams`.

Scalar rule, same shape as the existing bookings reader: missing is absent; a one-element array is that element; a longer array is **repeated** and invalid even when the values match; a non-string is invalid. Unknown keys, including `source` and `ref`, are ignored and are not filters.

| Parameter | Valid | Invalid, and no query |
| --- | --- | --- |
| `q` | absent, empty, or trimmed length 1–200 | repeated, non-string, trimmed length greater than 200 |
| `page` | absent (means 1), or trimmed canonical `/^[1-9][0-9]*$/` from 1 through 5000 | empty, `0`, `01`, fraction, exponent, sign, `NaN`, `Infinity`, negative, above 5000, repeated, non-string |
| `role` | absent or empty after trim (no filter), or exact `ROLES` token | any other token, including `Admin`, repeated, non-string |
| `status` | absent or empty after trim, or exact `ACCOUNT_STATUSES` token | any other token, repeated, non-string |

Validation uses `isRole` and `isAccountStatus`. It does not use `parseRole`, because `parseRole` lowercases and would turn `Admin` into a real filter. Trim is only outer whitespace. `%`, `_`, comma, quote, plus, and Unicode inside the length cap stay in `q` unchanged.

A valid decision is `{ kind: 'query', query }`. `query` is `{ q: string, page: number, role: Role | null, status: AccountStatus | null }`. Every invalid decision is `{ kind: 'invalid', reason, recovery }` and does not include a range. Reasons: `repeated`, `non-scalar`, `oversized-q`, `malformed-page`, `page-above-max`, `invalid-role`, `invalid-status`. The first failing parameter in the order `q`, `page`, `role`, `status` is the reason. `recovery` is the valid subset: drop the bad key, keep valid `q` / `role` / `status`, set page to 1. Recovery is a URL built by `buildUsersListHref`, not a second parser.

`Number`, `parseInt`, and `Math.max(1, …)` are not used on inbound values.

### Query execution

`executeUsersDirectoryRead(client, query)` is called only for `kind: 'query'`.

The structural client is the existing server client. The page keeps one cast:

`(await createServerComponentClient()) as any`

That call sits after `requireAdminPage` and after `decideUsersDirectoryRead` returns `query`. An invalid decision returns the directory shell and does not call `createServerComponentClient` or `from`.

The builder applies, in order:

1. `.from('profiles')`
2. `.select('user_id, email, display_name, role, status, created_at, last_seen_at', { count: 'exact' })`
3. `.order('created_at', { ascending: false })`
4. `.order('user_id', { ascending: true })`
5. `.range((page - 1) * 20, (page - 1) * 20 + 19)`
6. if `q` is non-empty, `.or(textSuchfilter(['display_name', 'email'], q))`
7. if `role` is non-null, `.eq('role', role)`
8. if `status` is non-null, `.eq('status', status)`

`textSuchfilter` stays the frozen helper. The plan does not claim that it escapes `%` or `_`. A search for `100%` still contains those percent signs inside the quoted literal. Comma and quote remain grammar-quoted by `zitiere`. Role and status never go through `or` or through string concatenation.

The `user_id` ascending tie-break makes equal `created_at` values deterministic. It does not change which columns are readable.

Count mapping, after a successful response: a non-negative safe integer stays a number. `null`, `undefined`, a string, a float, `NaN`, `Infinity`, and a negative value become `count: null`. They are not coerced to `0`. The current `count = 0` default is removed.

Row mapping stays in the page and stays action-compatible:

- `role: parseRole(r?.role) ?? DEFAULT_ROLE`
- `status: isAccountStatus(r?.status) ? r.status : 'active'`
- `created_at: profilErstellt(r?.created_at)`
- `last_seen_at: r?.last_seen_at ?? null`

The unknown-role / unknown-status fallback is existing write-facing display. `toggleBan` treats a non-banned row as bannable. Replacing unknown status with an honest third badge would change that action. This lane reports it and does not change it.

### Authorization order

Unchanged, and not wrapped in `try/catch`:

1. `requireAdminPage({ surface: 'users', capability: 'konten-verwalten' })`
2. if `!role || !canManageUsers(role)`, `redirect('/unauthorized?grund=forbidden')`
3. only then parse and maybe read

`redirect()` throws. A thrown guard or an explicit denial never becomes an empty table or a read error. RLS-empty (`error == null`, count `0`) stays an empty result. A PostgREST `error` still goes through `problemAus` and `ausProblem`. Break-glass remains the case the existing shell banner explains. This lane does not edit that banner or RLS.

### URL builder

`buildUsersListHref(current, change)` keeps `{ q, page }` required. Add optional `role?: string | null` and `status?: string | null`.

- `undefined` leaves the current parameter in place. Existing #608 calls pass only `q` and `page`, so they keep a `role` or `status` that is already there, and every current unit assertion stays true.
- `null` or `''` deletes the parameter.
- any other string is `params.set`, still via `URLSearchParams`.

Outbound page handling stays `Number.isFinite`, then truncates, then clamps into **1…5000**. A finite page above 5000 becomes 5000 and is never written as 5001 or higher. Non-finite pages still become 1, which is the existing client guard. That guard is not the inbound parser: a deep link `page=5001` remains invalid and is not queried. Existing unit expectations for pages 1, 2, and 3 stay unchanged. `goto` and recovery compute the destination first. A result outside 1…5000 is not passed to the builder; the control is disabled.

`usersListHrefMatches` stays first-value and order-independent. It is the own-ack comparator. It is not a repeated-key validator.

Text commit, page click, and filter commit all go through this builder, so `source` and `ref` survive.

### Client read journey

The state machine stays in `UsersTable`. New props are optional, so a caller that still passes `users`, `page`, `pageSize`, `total`, `q`, `actorId`, `actorRole`, and `assignable` keeps today’s success-path behavior.

The page passes an explicit read model:

- `ready` with `count: number | null`, the executed query, and `rows`
- `invalid` with `reason` and `recovery` href, and no rows
- `error` with `Fehler` from `ausProblem(problemAus(...))`, the failed committed query, and no rows

Search debounce, own-ack, popstate, and page click stay as they are now, with two extensions:

- A role or status change commits immediately with `router.replace`, uses the committed `q` (`urlQ`), sets page to 1, leaves the other filter untouched, cancels the text timer (`epoch`), and snaps the input back to `urlQ`. It does not commit a draft.
- Choosing the value already in the URL does not navigate. Clearing removes `q`, `role`, and `status` and sets page 1 through the same cancellation.

`goto` already uses the committed query and cancels the timer. It will also leave `role` and `status` in place because the builder preserves omitted keys. Its destination is clamped to 1…5000 before the replace is issued.

### Read-intent ownership (D-R1.1)

One client operation record owns the read from the moment the operator or history **dispatches** it until that operation **settles** or is **superseded**. The label does not wait for the URL to change. There is no poll.

The page passes `readAttempt`, a new `crypto.randomUUID()` on every server render. The client uses it only as a render nonce. A changed nonce means a new server render of these props was observed. It does not prove that `router.refresh()` caused that render, and it is not a response receipt.

An operation is one of `navigate` or `refresh`. Its states are `dispatched`, `acknowledged`, `settled`, `cancelled`, or `released`. For a refresh, `dispatched` is the visible checking lease, and `released` is the timeout with no new render. Same-error completion settles the lease without calling that outcome a success. Only one operation is current. A new dispatch supersedes the previous one.

**Navigate**, used for a committed text replace, a role or status change, a page click, clear, and an external URL:

1. **Dispatch** happens before `router.replace` returns and before `useSearchParams` updates. This includes the existing delayed-commit window, where replace has been recorded and the URL and server props still show the old request. The visible rows and count stay the previous server result and are labeled as that previous query immediately. They are not relabeled as the dispatched query.
2. **Acknowledgement** is the URL matching the dispatched href, including a late `commitNext` of a held replace. Acknowledgement is not settlement. Rows stay previous.
3. **Settlement** is a later `readAttempt` whose query fingerprint equals the acknowledged operation. Only then are those rows current. A late acknowledgement of a superseded operation does not settle it. The existing own-ack rule still keeps a newer text draft in the field.
4. **Supersession** is a newer navigate dispatch, a newer text draft that differs from the operation’s `q`, a native Back/Forward entry, or unmount. The older operation becomes `cancelled`. Its deferred URL acknowledgement may still arrive, and the existing own-ack rule still applies to the field, but that late acknowledgement does not settle the rows. The newer draft or history operation owns intent.

**Back/Forward** dispatches a history operation at `popstate`, before the field is rewritten. It cancels a pending text timer, cancels a refresh lease, and cancels a navigate that has not settled. The field then follows the history URL, which is the existing #608 rule. Rows stay the previous server result until a `readAttempt` matches that history query.

**Unmount** cancels the timer, the navigate operation, and the refresh lease. It does not call `refresh`. It does not set state after unmount. A late timer must not replace.

**Text draft.** A draft that `userSearchEditChangesFilter` says differs from the committed `q` is intent immediately, before the 400 ms debounce writes the URL. It cancels a refresh lease at the input event and cancels a navigate that has not settled, including one whose replace is still waiting for URL acknowledgement. It does not by itself mark the current rows as a new result: the rows stay labeled as the previous server query until the draft’s own later commit is acknowledged and then settled by props. Whitespace that normalizes to the same `q` is not a new draft.

### Same-query refresh lease

The error state still renders frozen `Fehlerflaeche` with `onWiederholen`. The frozen component still says a second try can help only when `wiederholbar` is true (503). The button is still present for a 500 because the operator must be able to retry that query or change it. `lib/admin/ladezustand.ts` and `components/admin/Ladezustand.tsx` are not edited. No new animation is added.

`router.refresh()` is a call, not a promise receipt and not proof that a particular response arrived. The harness may record that the function was called. That record is not a completed read.

`USERS_DIRECTORY_REFRESH_LEASE_MS = 8000`. The lease is a UI checking bound. It is not a server timeout and it does not assert success.

Retry is eligible only when all of these hold: the server props are a read error, the live URL still equals that failed query, no navigate operation is `dispatched` or `acknowledged`, the text draft does not differ from the committed `q`, and no refresh lease is `checking`. A differing draft blocks the click even though the URL still shows the failed query.

Lifecycle:

1. **Dispatch.** An eligible click creates a `refresh` operation for that exact query, sets `checking`, records the current `readAttempt`, and starts the lease. It then calls `router.refresh()` once.
2. **Duplicate click.** While that lease is `checking`, another click does not call `refresh` and does not restart the 8000 ms timer.
3. **Same-error completion.** A new `readAttempt` arrives, the URL and the query fingerprint are still the failed query, and the props are still an error. The lease completes. `checking` ends. The error remains. The button **re-enables**. A later click is a new operation and may refresh again. The announcement does not say the retry succeeded.
4. **Other render.** A new `readAttempt` for that same query with a ready or invalid result ends `checking` and shows that result. The UI names that state. It still does not claim the refresh call’s identity.
5. **Cancellation.** A differing text draft, a navigate dispatch, Back/Forward, an external URL, or unmount sets the lease to `cancelled` immediately. If `refresh` has not been called, it is not called. If it has been called, the UI drops `checking` and does not treat a later render as that retry’s success while the newer draft, URL, or history operation owns intent. The component does not set state after unmount.
6. **Release without a new render.** If the lease timer fires and `readAttempt` is unchanged, `checking` ends without a success or failure claim. The copy says the check ended without a confirmed new read. The error, if still on screen, stays the error. The button re-enables for a later legitimate retry. Rows are not relabeled as a new result.

There is no background loop. A released or completed lease does not start another refresh by itself.

### Result copy

| State | Condition | What the operator sees | Recovery |
| --- | --- | --- | --- |
| Current page | query succeeded, count known, page in range, no open operation | rows, real count, “Seite n / m” only when m is the real last page and m ≤ 5000 | previous / next only when the destination is inside 1…5000 and inside the data |
| Count unknown | success, count not a safe non-negative integer | rows if any; “Anzahl nicht verfügbar”; no invented “/ 1” and no invented last page | previous when page > 1 and page − 1 ≥ 1; next only when this page has 20 rows **and** page < 5000 |
| Ceiling, count unknown | page 5000, 20 rows, count unknown | real count stays unknown; next is not offered | previous is 4999; next is disabled, not a link to 5001 |
| Known count past the ceiling | count 100001, so the real span is 5001 pages | the count stays **100001**; copy says the real span is 5001 pages and navigation stops at 5000 | first is 1; last is **5000**, not 5001; next on page 5000 is disabled |
| Empty directory | count `0`, page 1, no `q` / role / status | “Keine Konten vorhanden.” | filters stay usable |
| No match | count `0`, page 1, some filter | “Keine Treffer für diese Suche oder Filter.” | clear and edit stay usable |
| Out of range | count known, page > 1, and `(page - 1) * 20 >= count`, with page still inside 1…5000 | “Seite n ist in dieser Abfrage nicht vorhanden.” No “Keine Nutzer gefunden.” | first is 1; last is `min(realLast, 5000)`. When the real last page is 0, that last control is page 1 |
| Invalid URL | parser rejection, including `page=5001` | the reason, no rows, no zero count | recovery keeps the valid filter subset and uses page 1 only. No control targets a page outside 1…5000 |
| Read error | PostgREST `error` | `Fehlerflaeche`, no rows presented as results | retry lease for that same query, or change / clear it |
| Refresh checking | lease `checking` | the previous error stays; copy says the query is being read again | the retry button is disabled; a second click does nothing |
| Same error again | new `readAttempt`, same query, still an error | the error remains; copy does not say the retry succeeded | the button re-enables for a later new retry |
| Check released | lease timer fired, same `readAttempt` | “Die erneute Abfrage wurde nicht bestätigt.” No success and no new failure claim | the button re-enables; rows are not relabeled |
| Denied / redirect | guard or `canManageUsers` failure | no directory body | existing redirect; not a read state |
| Dispatched navigate | replace, filter, page, or clear issued; URL may still be old | previous rows labeled as the previous query immediately | the dispatched operation owns intent until it settles or is superseded |
| Acknowledged, not settled | URL matches the operation; props do not yet | previous rows stay previous | acknowledgement is not a new result |
| History or unmount | popstate or unmount | history owns the field; unmount owns nothing further | the previous refresh or navigate is cancelled |

Page 1 with count `0` is empty or no-match, not out of range. `realLast = count === 0 ? 0 : ceil(count / 20)`. That number may be greater than 5000 and is then described, not linked. Every linked destination is in **1…5000**. A short unknown-count page below the ceiling disables next because this page did not fill. Page 5000 disables next even when it is full.

### Dates

`formatUsersDirectoryTimestamp` in `lib/admin/users-directory-presentation.ts`:

- `null`, `undefined`, and `''` render `Nicht verfügbar`
- a string whose `new Date(value)` is invalid renders `Nicht verfügbar` and does not call `format`
- a valid string uses the existing `Intl.DateTimeFormat('de-CH', { dateStyle: 'medium', timeStyle: 'short' })`
- the function does not call `Date.now` or `new Date()`

The row still stores the `profilErstellt` result. Display does not replace a bad string with the render clock.

### Mutations

`editable`, `changeRole`, `toggleBan`, `assignable`, and the self/peer copy stay in `UsersTable` and keep their current conditions: self is not editable; non-owner actors only edit a lower rank; the menu lists `assignable` roles other than the row role; ban toggles `banned` and `active`. `app/(admin)/admin/users/actions.ts` is not imported by the new modules and is not edited. Read controls are `type="button"` or links. They do not call `setUserRole` or `setUserStatus`.

### Layout

Existing tokens only: `max-w-7xl`, card, border, muted text, badge variants already in the table. Toolbar stays `flex-wrap`. Role and status are native selects with accessible names `Rolle` and `Status`, plus `Alle Rollen` and `Alle Status`. Search keeps `aria-label="Nutzer nach Name oder E-Mail suchen"`. Display names gain `break-words`; emails keep `break-all`. No `overflow-hidden` clipping. The mobile grid (`block` / `lg:table`) stays. Focus is not moved on mount.

## State and failure matrix

| Input or outcome | Query | Rows shown as current | Count | Operator can |
| --- | --- | --- | --- | --- |
| missing params | page 1, no filters | yes, when the read succeeds | exact or unknown | search, filter, page |
| valid `q` with comma, quote, `%`, `_`, Unicode | one `textSuchfilter` `or` | yes | exact or unknown | keep editing |
| `q` over 200 | no | no | none | shorten or clear |
| repeated `q`, `page`, `role`, or `status` | no | no | none | open recovery |
| `page=3` deep link, reload, remount | that page, if otherwise valid | yes | from that read | stay on page 3 until a real edit |
| `page=0`, `1.5`, `1e2`, `Infinity`, `5001` | no | no | none | recovery to a valid page |
| canonical role/status | `.eq` on that column | yes | exact or unknown | change or clear |
| `role=Admin` or unknown status | no | no | none | pick a canonical value |
| success, count `0`, no filter, page 1 | yes | empty directory | 0 | change filters |
| success, count `0`, filter, page 1 | yes | no-match | 0 | clear |
| success, count known, requested page past the data and still ≤ 5000 | yes, the range is numerically valid | out-of-range explanation, not an empty account | known real count | first is 1; last is `min(realLast, 5000)` |
| success, count 100001, page 5000 | yes, range `99980–99999` | current rows; count text 100001; real span 5001 described, not linked | 100001 | first 1; last **5000**; next disabled |
| success, count null, page 5000, 20 rows | yes | rows; count unknown; no last page | unknown | previous 4999; next disabled; no 5001 href |
| success, count null, page below 5000 | yes | rows if returned; unknown count | unknown | next only when 20 rows were returned and the next page is ≤ 5000 |
| PostgREST error | attempted | no | none | one refresh lease, or change / clear; a differing draft blocks refresh before the URL changes |
| guard redirect or thrown denial | no | no | none | existing redirect |
| replace issued, URL and props still old | no new query until the URL is acknowledged | previous rows, labeled previous from dispatch | previous | the dispatched operation owns intent through the deferred acknowledgement |
| draft text before 400 ms | no new navigation | previous committed query | previous | the draft cancels an error retry immediately; the debounce has not committed |
| late own ack after a newer draft | the older replace may acknowledge | newer draft stays in the field; the old operation does not settle | unchanged by the ack | the newer draft commits later |
| native Back/Forward | no extra replace | previous rows until props match the history query | from the history entry | history cancels the timer, the navigate, and the refresh lease |
| page click during a text timer | committed `q` and a neighboring page inside 1…5000 | input snaps to committed `q`; rows labeled previous at click | from the new page once settled | timer cannot reset the page; no destination above 5000 |
| unmount during timer or lease | no replace and no refresh after unmount | none from this component | — | the operation is cancelled and does not set state |
| refresh click on the failed query | `router.refresh()` once | checking; error stays; call is not a receipt | none claimed | duplicate click ignored; lease does not restart |
| same error on a new `readAttempt` | the new render is whatever the server sent | error remains; not announced as success | none | button re-enables; a later click is a new lease |
| lease expires on the same `readAttempt` | no proven new render | check ended without a confirmed read | none | button re-enables; rows are not relabeled as success |
| refresh click while a newer draft exists | no refresh | the failed query’s error stays previous | previous | the draft owns intent before debounce |

## Ownership after plan acceptance

Allowed writes, and only these:

- `app/(admin)/admin/users/page.tsx`
- `components/admin/UsersTable.tsx`
- `lib/admin/users-search-navigation.ts`
- `lib/admin/users-search-navigation.test.ts`
- `lib/admin/users-directory-query.ts`
- `lib/admin/users-directory-query.test.ts`
- `lib/admin/users-directory-presentation.ts`
- `lib/admin/users-directory-presentation.test.ts`
- `lib/admin/users-directory-read.test.ts`
- `scripts/admin-user-directory-completion-1/**`
- `docs/evidence/admin-user-directory-completion-1/**`
- the two D-EX1 files, only after a later explicit PLAN PASS, and only the assertions named in that disposition
- later STATUS, REPORT, SELF_REVIEW, and HANDOFF for this lane only

Not created: `components/admin/users/UsersDirectory.tsx`.

Frozen: `actions.ts`; `lib/auth/**`; `lib/admin/profil-erstellt.ts`; `lib/admin/ladezustand.ts`; `components/admin/Ladezustand.tsx`; `lib/api/datenbank-lesen.ts`; `lib/api/suchfilter.ts`; Supabase clients, schema, migrations, RLS; Admin shell, command palette, System Health, Provider Ops; payment and security mutations; Trip and Account runtime; package, lockfile, workflows, operating mode, and global continuity. Shared contracts are imported, not edited.

Multi-agent: this writer is D only. T, S, W, and M are other branches. No sibling merge or cherry-pick.

## Proof plan

`npm test` is `node --test` over `lib/**/*.test.ts` plus two script globs. There is no jsdom. Mounted proof uses the existing esbuild-plus-Playwright pattern. No package is added.

Pure tests:

- `users-directory-query.test.ts`: every invalid row in the matrix does not build a range, including `page=5001`; `page=5000` does build range `99980–99999`; valid rows emit page size 20, both orders, the exact select list, and `.eq` only for canonical tokens; `textSuchfilter(['display_name', 'email'], q)` is the `or` argument for comma, quote, percent, underscore, and `müller`; count `null` stays null, `0` stays `0`, and `100001` stays `100001`; a spy client records zero `from` calls when the decision is invalid.
- `users-directory-read.test.ts`: a throwing guard is not caught and the spy client is unused; a `canManageUsers` denial returns before `from`; one valid execute records `from('profiles')` once, the column string, `created_at` desc then `user_id` asc, and the range; a second call is a second explicit execute, not a hidden retry loop.
- `users-directory-presentation.test.ts`: invalid and empty timestamps are `Nicht verfügbar` and do not throw; a fixed ISO timestamp matches `Intl` de-CH medium/short and is not `new Date().toISOString()`; state copy distinguishes empty, no-match, out-of-range, and unknown count; page 99 with count 20 is out of range and does not report max page 1. Count 100001 reports real count 100001 and real span 5001, while the last destination is 5000. Page 5000 with an unknown count and 20 rows has no next destination. Every first, last, next, previous, and recovery page in these cases is an integer in 1…5000 or is absent.
- Existing `users-search-navigation.test.ts` stays green without edited expectations. New cases cover preserve, set, and delete of `role` and `status`, foreign keys surviving a filter change, and an outbound page above 5000 clamping to 5000 rather than emitting 5001. Inbound rejection of 5001 stays in the query tests; the builder does not turn that deep link into a query.
- Existing `lib/auth/roles.test.ts` is not edited. A source assertion in the read test checks that `editable`, `changeRole`, `toggleBan`, and `assignable` remain, and that self and lower-rank conditions are still the current expressions.

Mounted production `UsersTable` through a controlled router stub copied forward for this lane (the old evidence stub is not rewritten):

- page-3 deep link idle for 700 ms, remount, whitespace no-op, genuine edit resets page only after 400 ms, clear removes `q`, punctuation and Unicode, previous page keeps `q` and foreign keys, external URL, Back/Forward, edit then external before timeout, page click during the text timer, rapid edits commit the last value, unmount cancels the timer, late own ack keeps a newer draft, external wins over a held search
- role and status change, same-value no-op, clear filters, page click keeps both filters
- invalid, empty, no-match, out-of-range, unknown count, and error props
- page 5000 with 20 rows and a null count: next control disabled, no generated href contains `page=5001`, previous destination is 4999, and there is no last-page control
- count 100001 on page 1 and on page 5000: the visible count is 100001, the real span is described as 5001, first is 1, last is 5000, and next from 5000 is disabled. Page 4999 may still go to 5000
- inbound `page=5001` renders the invalid state and its recovery href uses page 1, not 5001
- deferred replace: after `replace` is issued and before the delayed URL acknowledgement, the row region is already labeled as the previous query while the input and URL still show the old request. The late acknowledgement does not mark those rows current. Settlement waits for a new `readAttempt` whose query matches
- a newer text draft started before debounce cancels a checking refresh lease and blocks a new retry click; `refresh` is not called. After the draft is committed, the navigate operation owns the later props
- filter change, page click, Back/Forward, and unmount each cancel a checking lease. Unmount performs no replace and no refresh. Back/Forward does not let the cancelled lease settle
- same-query refresh: the first click calls `refresh` once and disables the button. A second click while checking does not call it again and does not reset the lease. A new `readAttempt` with the same error re-enables the button and does not announce success. A later click calls `refresh` once more. If the attempt id never changes, the lease releases, the copy does not claim success, and the button re-enables
- the mounted stub records `refresh()` calls only. Those calls are not treated as a received response
- read interactions record zero action-stub calls; one editable lower-rank role action records one call; the actor’s own row does not

CSS, same harness, real `styles/globals.css` through PostCSS and Tailwind:

- widths 320, 360, 390, 768, and 1280
- at 320, root font size 32 px
- long name and email, active filters, pending, and error
- no horizontal overflow on the directory root
- keyboard reachability of search, both selects, pager, and retry
- `prefers-reduced-motion: reduce` does not add a new infinite animation

Then, on the implementation head: TypeScript, lint, `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`, production build, and `npm test`. New exports are referenced from the page, the table, or the new tests so `check:exports` sees the names. Evidence records command, exit code, versions, head, and dirty state. Screenshots are synthetic fixtures only.

## Costs

No new dependency, hosted project, provider, secret, or paid call. Playwright and esbuild are already used by the historical admin harness. The read remains one `profiles` page of 20 rows under the existing `konten-verwalten` grant. No new monthly infrastructure.

## Evidence limits

- Synthetic router and fake client. Not a signed-in Next router, not hosted Supabase, not RLS, not Production, and not a real account.
- #748 personal-browser/CUA remains suspended. No private browser session is opened to obtain evidence.
- #917 hosted readback remains denied. A green local spy does not prove a live PostgREST response.
- `router.refresh()` is not a promise receipt and not proof that a particular response arrived. A changed `readAttempt` shows that a new server render was observed. It does not prove that this refresh call caused it. The lease release is a UI bound. It is not a successful read and not a hosted readback. The harness records calls and rendered copy only.
- The historical #608 script’s placeholder and `3 / 3` expectations already disagree with this seed. They are not re-labeled as passing.
- Unknown database role/status still display as `DEFAULT_ROLE` / `active` so the frozen action menu does not change. That is not a claim that every stored value is a canonical badge.
- `textSuchfilter` still treats `%` and `_` as ILIKE wildcards.
- The two conditional browser skips, 181 existing lint warnings, 11 previously reported untriaged dependency advisories, guest cross-tab non-atomicity, and full-unmount limits stay existing limits.
- Author self-review is not Technical-Lead PASS. This plan head is not implementation authority.

## Findings left outside the lane

- **P2, not fixed here.** `page.tsx` maps an unknown profile status to `active` and an unknown role through `parseRole` to `DEFAULT_ROLE`. That is what makes `toggleBan` and `changeRole` decide. An honest badge would be a write-behavior change in the frozen action path.
- **P3, not fixed here.** `scripts/admin-users-search-navigation-1-verify.mjs` does not match the current placeholder or page label. It is historical evidence, outside this allowlist.

## Stop

This correction revises only the plan. The TASK file stays byte-identical. No runtime, test, or evidence edit is included. No Ready, no merge, no tracking closure, no write to `main`, no global continuity edit, and no next slice. D-EX1 is recorded and is not used in this commit. The same session waits for a full Technical-Lead re-review of the exact new plan head.
