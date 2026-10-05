# Admin Users Search Navigation 1 — report

Stand: 28 September 2026
Status: **R2 CORRECTION FOR INDEPENDENT WORK/TL REVIEW — NOT PASS — NOT MERGED**
Task: `docs/ADMIN_USERS_SEARCH_NAVIGATION_1_TASK_2026-09-28.md` v1.0
Issue: #607
Draft PR: #608
Branch: `fix/admin-users-search-navigation-1`
Seed: `cbef14d1b31c22b5a8068d15f689c81c88d4ffc9`
Baseline main: `46b35d9808dc8929fae6adf96aef3572249bf2f8`

Writer: **Jetnity admin users search navigation 1**, Generation 1.
Session: https://cursor.com/agents/bc-32378ddb-57fe-45cb-8134-62721416684c
`originalModelName=grok-4.7`. Dispatch states Grok 4.7 High Fast was visibly selected; that qualifier is not a separate run-info field. Not Auto. The session UI name remained `Admin users search navigation` because this run exposed no programmable rename.

Work/TL R1 review `5344508093` required changes on exact head `433e9a25426c93f9949c017ef36229c569996d5b`. Work/TL R2 review `5344639303` required changes on exact head `99d2ab4a30b3915db35890bd4f5a395ae8cd8c89`. Review the branch tip that contains this R2 section. Live `git rev-parse` wins. This correction does not claim Technical-Lead PASS, Ready, or merge.

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
- Back/Forward copy the URL filter into the input and cancel a stale timer. A native `popstate` does that even when the restored query equals a pending own-search href. `pushState` and `replaceState` are not traversals. An in-memory harness history update is not a `popstate`.
- Page click keeps the committed filter, moves to the clamped page, cancels a pending timer, and puts the committed filter back into the input. The uncommitted draft is discarded so the field matches the list filter.
- Identical target URLs are not replaced. StrictMode did not create a replace loop in the harness.
- Role and status handlers are unchanged. The harness did not call them.

The page label uses `shrink-0 whitespace-nowrap`. The baseline screenshot wrapped `1 / 3` inside the flex row; the after screenshots show `3 / 3` on one line.

## 4. Local verification

| Command | Result |
| --- | --- |
| `node scripts/admin-users-search-navigation-1-verify.mjs --baseline` | Defect reproduced on the unfixed component. Exit 0. |
| `node --import ./scripts/server-only-test-register.mjs --import tsx --test lib/admin/users-search-navigation.test.ts` | 8 pass, 0 fail, including own-ack href matching |
| `node scripts/admin-users-search-navigation-1-verify.mjs` | 19 cases pass after R2, including the native Back/Forward coincidence, four delayed-commit cases, pagination, unmount and StrictMode remount. Exit 0. No console or page errors. |
| `npm test` | 4025 pass, 0 fail on the R2 correction |
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

## 4a. R1 — delayed own-search acknowledgement

Review `5344508093` reproduced a P2 on the actual component with a delayed Next navigation boundary. Start `anna` / page 3, type `bob` and let the debounce call `replace` while holding the URL commit, type `bobby`, then commit the older `bob` URL before `bobby`'s timer. The previous render copied `urlQ` into the field whenever `trackedUrl` changed, so `bobby` was discarded and no `bobby` replace followed. Unchanged main keeps that newer edit. The synchronous stub could not see it.

The correction treats a URL that matches a replace this table already issued as acknowledgement of our own search, unless that update is a native history traversal. That acknowledgement does not overwrite a newer draft, including a draft edited back to the previous committed value, and a draft whose replace is already queued is not queued again. A URL that does not match is external or pagination: it still replaces the field and cancels stale work. Native Back/Forward are classified by `popstate`, not by href equality. See §4b.

New harness cases, all passing on the actual `UsersTable`: `delayed-own-ack-keeps-newer-draft`, `delayed-own-ack-keeps-edit-back-to-previous`, `delayed-external-wins-over-held-search`, `delayed-older-ack-after-newer-replace-once`. The earlier pagination, unmount, remount/StrictMode and external cases still pass. No extra replace loop was observed after the delayed commits settled.

## 4b. R2 — native Back can equal a pending own-search URL

Review `5344639303` reproduced a P2 on the actual component. Start `q=bob&page=1&source=support&reviewHold=1`, push same-document history to `q=anna&page=3` with the other params kept, type `bob` and hold that `replace`, type `bobby`, then native `history.back` before the next debounce, without acknowledging the held `bob` replace. Href matching treated that Back target as our own acknowledgement, left `bobby` in place, and issued `bobby` afterwards. That undoes the traversal.

`popstate` now invalidates own-search markers and the debounce. The field follows the restored URL. `pushState` and `replaceState` still do not emit `popstate`, so a delayed own acknowledgement can still keep a newer draft. The stub does not turn every URL update into `popstate`.

Harness case `native-back-equals-pending-own-search` passes on the actual `UsersTable`: after Back, the input is `bob`, page label `1 / 3`, the held replace is still uncommitted, and no `bobby` replace appears after 700 ms. Forward then restores `anna` / page 3 with the same single held replace. The R1 delayed-commit cases and the earlier pagination, unmount, remount/StrictMode and external cases still pass.

## 5. Limits

- Not signed-in Admin, not a physical device, not Production.
- The coincidence case uses native `history.back` / `history.forward` and `popstate` on the same harness document. It is not Chrome's back button on `next dev`. The older stub back/forward cases still update an in-memory history and do not emit `popstate`.
- The harness updates table props from the stub URL in the same React commit. A real Next server render can refresh rows one round-trip later. The server page and actions were not changed.
- `--baseline` on this fixed head fails closed. That is expected.

## 6. Stop

Cursor does not Ready and does not merge. No follow-up slice. Same session for review fixes. Normal ChatGPT main chat keeps later selection. Admin E and AP-8 stay gated.
