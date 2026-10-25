# R107-D — Admin User Directory Completion 1 — STATUS

Date: 2026-10-25. Author: Jetnity Admin User Directory Completion 1 — Cursor Generation 1. Session `bc-cc48889b-f8c5-4cce-9892-1daa0eab7fc6`. Runtime model `grok-4.7-high-fast`.

## State

Candidate re-review R2 correction is on `feat/r107-admin-user-directory-1`, Draft PR #1020. This is not a product PASS, not Ready, and not a merge. TASK blob `704b63dc2f0da1df30db73988cf7e3bb4ed6cbfb` and accepted PLAN blob `888407e808559463e22b0dbc2392bef09d01f48d` are unchanged. Machine mode: `NORMAL`.

- Reviewed head: `d29a621390bf1d760c3086bea8cb5f19e5160d25` (tree `2dd6dac278def5c897856c544ce92b12c267269f`)
- Correction commit: `5575794c1e84f703769bcaa2d1f98af0d4693812` (tree `2ca0dd3fea46a9a2cec88abdbba60adc2436ee49`)
- `origin/main` and merge-base at the correction: `a74c443c6be3f064f150fcf021ab6154bda325e5`
- Ahead / behind before the documentation commit: **8 / 0**
- The documentation commit adds no product-file change. The rebound mounted run left the committed screenshots byte-identical.

## R2 resolution

`commitFilters` no longer clears `ownSearchAcks`. A delayed own search acknowledgement stays owned, so it does not restore the search field and does not replace the newer role or status operation with a settled operation for that older search. Clear still keeps acknowledgements and still dispatches when its target is the current URL. Page navigation still clears acknowledgements. External URL changes and native Back/Forward still restore the field.

Mounted receipts on `5575794c`: `role-keeps-delayed-search-ownership` ends at `page=1&role=operator` with an empty field. `status-keeps-delayed-search-ownership` ends at `page=1&status=pending` with an empty field. Both commit the older `q=anna` replace before the newer filter, and both record zero action calls. `clear-supersedes-delayed-search`, `external-wins-over-held-search`, and `native-back-keeps-pending-and-field` stayed green.

## Earlier R1 resolutions, still in force

- Retry compares `usersDirectoryLiveMatchesQuery`. Omitted page, `?q=anna`, padded `page=%201%20`, and explicit `page=1` each refresh once. Repeated `page=1&page=2` stays invalid.
- Clear keeps outstanding own acknowledgements.
- Keyboard proof presses Tab and Enter. The old `element.focus()` enumeration stays retired.

## Proof boundary

Authoritative mounted run: `docs/evidence/admin-user-directory-completion-1/mounted.json`, 44/44, exit 0, Node `v22.23.4`, Playwright `1.55.0`, recorded head `5575794c1e84f703769bcaa2d1f98af0d4693812`, dirty empty at capture. Local component evidence only.

Ordinary gates on the correction bytes: focused tests 69/69 after the product commit. `npm test` exit 1: 7193 tests, 7177 pass, 11 fail, 5 skipped. The 11 failures are the same local PostgreSQL environment limits. Typecheck, lint (0 errors, 181 warnings), five hygiene checks, and the production build exited 0. `/admin/users` stayed dynamic. Typecheck, lint, hygiene, `npm test`, and the build ran on the dirty tree before `5575794c`; that commit contains only `UsersTable.tsx` and `verify.mjs`.

## Next actor

Root Technical Lead, independent exact-head re-gate. Cursor does not Ready, merge, close #1015, write `main`, or start a follow-up.
