# Admin Users Search Navigation 1 — report

Stand: 28 September 2026
Status: **DELIVERY FOR INDEPENDENT WORK/TL REVIEW — NOT PASS — NOT MERGED**
Task: `docs/ADMIN_USERS_SEARCH_NAVIGATION_1_TASK_2026-09-28.md` v1.0
Issue: #607
Draft PR: #608
Branch: `fix/admin-users-search-navigation-1`
Seed: `cbef14d1b31c22b5a8068d15f689c81c88d4ffc9`
Baseline main: `46b35d9808dc8929fae6adf96aef3572249bf2f8`

Writer: **Jetnity admin users search navigation 1**, Generation 1.
Session: https://cursor.com/agents/bc-32378ddb-57fe-45cb-8134-62721416684c
`originalModelName=grok-4.7`. Dispatch states Grok 4.7 High Fast was visibly selected; that qualifier is not a separate run-info field. Not Auto. The session UI name remained `Admin users search navigation` because this run exposed no programmable rename.

Behavior commit `c03b7d76e1ba5b868d14d362d11c8d174592c724` contains the fix, harness and this report's first body. Review the branch tip that contains this line. Live `git rev-parse` wins. This delivery does not claim Technical-Lead PASS, Ready, or merge.

## 1. Live reconstruction before writes

- Operating mode: `NORMAL`.
- Live `main`: `46b35d9808dc8929fae6adf96aef3572249bf2f8` (merge #606). CI `36476538615` SUCCESS on that exact SHA.
- This branch was `cbef14d1`, 1 commit ahead of main, 0 behind. Remote branch matched the seed. Draft #608 was open on that seed.
- Open PRs: #608 (this slice) and historical drafts #52, #50, #40, #39, #28.
- Open issues: #607, #585, #440, #395, #294, #236, #20.
- Running cloud agents in this environment: this session only.
- Admin F palette remains the #545 shipment. Admin E and AP-8 were not started.

## 2. Defect, reproduced before the fix

Unfixed `UsersTable` scheduled `router.replace` on mount. The actual rendered component, synthetic rows, and router/action stubs, with no typing and no click:

- start: `q=anna&page=3&source=support`, label `3 / 3`, zero replaces
- after 700 ms: one replace to `/admin/users?q=anna&page=1&source=support`, label `1 / 3`

Evidence: `docs/evidence/admin-users-search-navigation-1/before.json` and `before-desktop.png`.

## 3. Behavior

Committed filter is the URL `q` (trimmed). The `q` prop only seeds the first input value.

- Opening or remounting a valid page/query does not rewrite the URL.
- An edit whose trimmed value differs from the committed filter resets to page 1 after 400 ms.
- Empty input deletes `q`. Whitespace-equivalent input does not reset the page.
- Unrelated query parameters stay. Values are written with `URLSearchParams`.
- A later edit, an authoritative URL change, or unmount cancels the previous timer.
- Back/Forward in the harness history, and any other authoritative query change, copy the URL filter into the input and do not let a stale timer overwrite that navigation.
- Page click keeps the committed filter, moves to the clamped page, cancels a pending timer, and puts the committed filter back into the input. The uncommitted draft is discarded so the field matches the list filter.
- Identical target URLs are not replaced. StrictMode did not create a replace loop in the harness.
- Role and status handlers are unchanged. The harness did not call them.

The page label uses `shrink-0 whitespace-nowrap`. The baseline screenshot wrapped `1 / 3` inside the flex row; the after screenshots show `3 / 3` on one line.

## 4. Local verification

| Command | Result |
| --- | --- |
| `node scripts/admin-users-search-navigation-1-verify.mjs --baseline` | Defect reproduced on the unfixed component. Exit 0. |
| `node --import ./scripts/server-only-test-register.mjs --import tsx --test lib/admin/users-search-navigation.test.ts` | 7 pass, 0 fail |
| `node scripts/admin-users-search-navigation-1-verify.mjs` | 14 cases pass after the fix, including a second run after the ref-in-effect lint fix. Exit 0. No console or page errors. |
| `npm test` | 4024 pass, 0 fail |
| `npm run typecheck` | pass |
| `npm run lint` | 0 errors, 145 warnings, all pre-existing. Two `any` warnings remain in the untouched role/status handlers. |
| `npm run check:dead` | 0 unreached files |
| `npm run check:exports` | 0 unused exports |
| `npm run check:deps` | 0 unused packages |
| `npm run check:api-schutz` | pass |
| `npm run check:schema-bezug` | exit 0. It still prints the existing LOCAL/UNAPPLIED `admin_account_counts_v1` note. |
| `npm run check:operating-mode` | PASS |
| `npm run build` | pass. `check:setup` warned that no `.env` file is present and continued. |

Focused ESLint on the edited runtime and harness files: 0 errors. Exact-head CI, Auth and Vercel for the pushed head are Technical-Lead gates. The green checks on seed `cbef14d1` are not this head's gate.

## 5. Limits

- Not signed-in Admin, not a physical device, not Production.
- History Back/Forward is the harness history, not Chrome's back button on `next dev`.
- The harness updates table props from the stub URL in the same React commit. A real Next server render can refresh rows one round-trip later. The server page and actions were not changed.
- `--baseline` on this fixed head fails closed. That is expected.

## 6. Stop

Cursor does not Ready and does not merge. No follow-up slice. Same session for review fixes. Normal ChatGPT main chat keeps later selection. Admin E and AP-8 stay gated.
