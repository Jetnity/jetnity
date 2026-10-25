# Jetnity Admin User Directory Completion 1 — PLAN

Date: 2026-10-25
Status: **PLAN ONLY.** No implementation, test, audit, or other document is authorized by this file.
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
- Fetched `origin/main` this session: **a74c443c6be3f064f150fcf021ab6154bda325e5**, tree **c1fe5a50b0da710ef425674057f782b1dff6f8bc**. Merge-base with seed HEAD is that same SHA. Ahead/behind **1 / 0**. No main drift. No rebase, merge, or sibling cherry-pick.
- Seed HEAD **1718577ef469b709cbe270c7ec25de87f8aadd4b**, tree **a0c058df51a430d1664f0a8c80b7832b5d155124**. Sole parent and merge-base `a74c443c6be3f064f150fcf021ab6154bda325e5`. Diff is the one TASK file. This plan commit is the second commit and is not implementation.
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

## Requested allowlist exception

Not self-authorized. Implementation does not edit either file unless this plan head is accepted **with this exception**. If the exception is refused, implementation stops before changing the unsafe page lines or the date ternaries, because `npm test` would then fail.

Narrow edits, and nothing else in those files:

1. `lib/next/request-api-compat.test.ts`, only the test `Admin Users q/page bleiben nach Await dieselben Pagination-Werte`. Replace the two assertions that lock `const q = (params?.q ?? '').trim()` and `const page = Math.max(1, Number(params?.page ?? 1))` with assertions that the page still awaits `leseOptionalRequestParam`, still contains `PAGE_SIZE = 20` and `(await createServerComponentClient()) as any`, and that the inbound page/filter decision comes from `decideUsersDirectoryRead` before any `executeUsersDirectoryRead`. Do not change the `PageRequestParam<SearchParams>` signature assertion or any other page in that file.
2. `lib/admin/profil-erstellt.test.ts`, only the table assertion that locks `u.created_at ? dtf.format(new Date(u.created_at))` and the same for `last_seen_at`. Point it at the safe formatter. Keep the `profilErstellt` behavior tests and the page-source assertions for `profilErstellt(r?.created_at)`, `last_seen_at ?? null`, and the absence of `new Date().toISOString()`. Do not edit `lib/admin/profil-erstellt.ts`.

No other unlisted file is required. `components/admin/users/UsersDirectory.tsx` is not created: the #608 state machine already lives in `UsersTable`, and a second shell is not needed.

## Design

### Inbound query

New pure module `lib/admin/users-directory-query.ts`. No Next, React, or Supabase import.

Constants:

- `USERS_DIRECTORY_PAGE_SIZE = 20`
- `USERS_DIRECTORY_Q_MAX = 200` (JavaScript string length after trim)
- `USERS_DIRECTORY_MAX_PAGE = 5000` (range `99980–99999`)

`5000` is the operational ceiling. A page whose range end is a safe integer can still be near `2^53` and force a large Postgres offset for 20 rows. Pages above `5000` are rejected before the client is used. The page file also keeps the source literal `const PAGE_SIZE = 20`, and a test asserts it equals the module constant. The Technical Lead can change only this number at plan review; the implementation will not pick a second ceiling later.

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

Outbound page handling stays `Number.isFinite` then `Math.max(1, Math.trunc)`. That is the existing client guard. It is not the inbound parser.

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

`goto` already uses the committed query and cancels the timer. It will also leave `role` and `status` in place because the builder preserves omitted keys.

Pending versus current: the visible rows and count are labeled from the server props. A polite live region says they are current when the URL’s canonical `q` / `page` / `role` / `status` match those props. When the URL has moved and the props have not, the same rows stay on screen and the region says they belong to the previous query. The count text is not rewritten as if it were the new filter. Typing a draft does not do this; the draft is not yet the URL. There is no poll.

Retry: the error state renders frozen `Fehlerflaeche` with `onWiederholen`. The handler calls `router.refresh()` only when the live URL still equals the failed committed query captured at click, and only one refresh for that query is in flight. A newer replace or popstate means a later click is a new intent; the old refresh is not started again. `Fehlerflaeche` still says a second try can help only when `wiederholbar` is true (503). The button is still present for a 500 because the task requires an explicit retry of the failed query plus a way to change it. `lib/admin/ladezustand.ts` and `components/admin/Ladezustand.tsx` are not edited. No new animation is added. The frozen spinner remains the existing one when `laeuft` is set.

### Result copy

| State | Condition | What the operator sees | Recovery |
| --- | --- | --- | --- |
| Current page | query succeeded, count known, page in range | rows, “Seite n / m”, “N Nutzer” or “N Treffer” | previous / next inside range |
| Count unknown | success, count not a safe non-negative integer | rows if any; “Anzahl nicht verfügbar”; no invented “/ 1” | previous when page > 1; next only when this page is full (20 rows). No last-page claim |
| Empty directory | count `0`, page 1, no `q` / role / status | “Keine Konten vorhanden.” | filters stay usable |
| No match | count `0`, page 1, some filter | “Keine Treffer für diese Suche oder Filter.” | clear and edit stay usable |
| Out of range | count known and `(page - 1) * 20 >= count` and page > 1 | “Seite n ist in dieser Abfrage nicht vorhanden.” No “Keine Nutzer gefunden.” | first page always; last page when count > 0 (`ceil(count / 20)`) |
| Invalid URL | parser rejection | the reason, no rows, no zero count | recovery link from the valid subset; controls remain |
| Read error | PostgREST `error` | `Fehlerflaeche`, no rows presented as results | retry bound to that URL; change or clear the query |
| Denied / redirect | guard or `canManageUsers` failure | no directory body | existing redirect; not a read state |
| Pending | URL committed, server props older | previous rows explicitly labeled as previous | the in-flight URL owns the next result |

Page 1 with count `0` is empty or no-match, not out of range. A full page of 20 with an unknown count does not invent a last page.

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
| success, count known, requested page past the end | yes, the range is numerically valid | out-of-range explanation, not an empty account | known | first and last valid page |
| success, count null | yes | rows if returned; unknown count | unknown | page without a fake maximum |
| PostgREST error | attempted | no | none | retry that URL or change it |
| guard redirect or thrown denial | no | no | none | existing redirect |
| draft text before 400 ms | no new navigation | previous committed URL | previous | keep typing |
| late own ack after a newer draft | the older replace is acked | newer draft stays in the field | unchanged by the ack | the newer draft commits later |
| native Back/Forward | no extra replace | URL value replaces the field | from the history entry | history wins and cancels the timer |
| page click during a text timer | committed `q` and neighboring page | input snaps to committed `q` | from the new page | timer cannot reset the page |
| refresh while the URL still matches the failure | `router.refresh` once | previous rows labeled previous until props match | none until success | not a second concurrent refresh |
| refresh click after the URL changed | no refresh | the newer URL owns intent | — | edit stands |

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
- the two exception files above, only if this exception is accepted, and only the assertions named here
- later STATUS, REPORT, SELF_REVIEW, and HANDOFF for this lane only

Not created: `components/admin/users/UsersDirectory.tsx`.

Frozen: `actions.ts`; `lib/auth/**`; `lib/admin/profil-erstellt.ts`; `lib/admin/ladezustand.ts`; `components/admin/Ladezustand.tsx`; `lib/api/datenbank-lesen.ts`; `lib/api/suchfilter.ts`; Supabase clients, schema, migrations, RLS; Admin shell, command palette, System Health, Provider Ops; payment and security mutations; Trip and Account runtime; package, lockfile, workflows, operating mode, and global continuity. Shared contracts are imported, not edited.

Multi-agent: this writer is D only. T, S, W, and M are other branches. No sibling merge or cherry-pick.

## Proof plan

`npm test` is `node --test` over `lib/**/*.test.ts` plus two script globs. There is no jsdom. Mounted proof uses the existing esbuild-plus-Playwright pattern. No package is added.

Pure tests:

- `users-directory-query.test.ts`: every invalid row in the matrix does not build a range; valid rows emit page size 20, both orders, the exact select list, and `.eq` only for canonical tokens; `textSuchfilter(['display_name', 'email'], q)` is the `or` argument for comma, quote, percent, underscore, and `müller`; count `null` stays null and `0` stays `0`; a spy client records zero `from` calls when the decision is invalid.
- `users-directory-read.test.ts`: a throwing guard is not caught and the spy client is unused; a `canManageUsers` denial returns before `from`; one valid execute records `from('profiles')` once, the column string, `created_at` desc then `user_id` asc, and the range; a second call is a second explicit execute, not a hidden retry loop.
- `users-directory-presentation.test.ts`: invalid and empty timestamps are `Nicht verfügbar` and do not throw; a fixed ISO timestamp matches `Intl` de-CH medium/short and is not `new Date().toISOString()`; state copy distinguishes empty, no-match, out-of-range, and unknown count; page 99 with count 20 is out of range and does not report max page 1.
- Existing `users-search-navigation.test.ts` stays green without edited expectations. New cases cover preserve, set, and delete of `role` and `status`, and foreign keys surviving a filter change.
- Existing `lib/auth/roles.test.ts` is not edited. A source assertion in the read test checks that `editable`, `changeRole`, `toggleBan`, and `assignable` remain, and that self and lower-rank conditions are still the current expressions.

Mounted production `UsersTable` through a controlled router stub copied forward for this lane (the old evidence stub is not rewritten):

- page-3 deep link idle for 700 ms, remount, whitespace no-op, genuine edit resets page only after 400 ms, clear removes `q`, punctuation and Unicode, previous page keeps `q` and foreign keys, external URL, Back/Forward, edit then external before timeout, page click during the text timer, rapid edits commit the last value, unmount cancels the timer, late own ack keeps a newer draft, external wins over a held search
- role and status change, same-value no-op, clear filters, page click keeps both filters
- invalid, empty, no-match, out-of-range, unknown count, error, and pending props
- retry calls refresh once for the failed query and not after a newer URL
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
- `router.refresh()` causality is not proven beyond the stub recording one refresh intent. The harness does not prove Next.js request identity.
- The historical #608 script’s placeholder and `3 / 3` expectations already disagree with this seed. They are not re-labeled as passing.
- Unknown database role/status still display as `DEFAULT_ROLE` / `active` so the frozen action menu does not change. That is not a claim that every stored value is a canonical badge.
- `textSuchfilter` still treats `%` and `_` as ILIKE wildcards.
- The two conditional browser skips, 181 existing lint warnings, 11 previously reported untriaged dependency advisories, guest cross-tab non-atomicity, and full-unmount limits stay existing limits.
- Author self-review is not Technical-Lead PASS. This plan head is not implementation authority.

## Findings left outside the lane

- **P2, not fixed here.** `page.tsx` maps an unknown profile status to `active` and an unknown role through `parseRole` to `DEFAULT_ROLE`. That is what makes `toggleBan` and `changeRole` decide. An honest badge would be a write-behavior change in the frozen action path.
- **P3, not fixed here.** `scripts/admin-users-search-navigation-1-verify.mjs` does not match the current placeholder or page label. It is historical evidence, outside this allowlist.

## Stop

This commit adds only the plan. The TASK file stays byte-identical. No Ready, no merge, no tracking closure, no write to `main`, no global continuity edit, and no next slice. The same session waits for an independent Technical-Lead review of the exact plan head.
