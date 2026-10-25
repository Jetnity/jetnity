# R107-D — Admin User Directory Completion 1 — STATUS

Date: 2026-10-25. Author: Jetnity Admin User Directory Completion 1 — Cursor Generation 1. Session `bc-cc48889b-f8c5-4cce-9892-1daa0eab7fc6`. Runtime model `grok-4.7-high-fast`.

## State

Main-sync 1 is integrated on `feat/r107-admin-user-directory-1`, Draft PR #1020. This is not a product PASS, not Ready, and not a PR merge. TASK blob `704b63dc2f0da1df30db73988cf7e3bb4ed6cbfb` and accepted PLAN blob `888407e808559463e22b0dbc2392bef09d01f48d` are unchanged. Machine mode: `NORMAL`.

## Main-sync 1

History-preserving merge of accepted main `747c909cccb2b18ac91b7976b5b671dc11347cf3` (tree `63acafa9716450b6b5eadbddd25b6db693abefba`) into pre-sync head `878212adf0384bba02cd1ce217041a673bfdaf84` (tree `b0e0fe9601404e0954c956b19c6bf437a32b9a1d`). Prior merge-base `a74c443c6be3f064f150fcf021ab6154bda325e5`. Merge commit `b83477489864ed357f27c7bd1bd8d8b5ee92484c`, parents those two SHAs, tree `4e9032f5c455ed54074eef379d491e349a33c0a0`. Incoming main paths 99, lane paths 29, overlap none. The commit that contains this note is the only change after that merge. Its SHA is the branch head and is reported in the PR handoff, not here.

`UsersTable.tsx` stays blob `4151e01aec8d60fc61f7685af583c6037dd1c718`. User actions stay `bd30b9e108890e17f1d6dc32829c687c089958e1`. `lib/auth/roles.ts` stays `01b8290bab658bb7a8b5a2ade491e4d31737ae7d`. `package-lock.json` stays `4c64e03d16a54ae6c648dc3e40c88d6b94c5cfbe`. `mounted.json` stays blob `b72ed29e3273326597d0c97384a0a4fe5ef9e18b` and still names execution head `5575794c1e84f703769bcaa2d1f98af0d4693812`. That 44-case run was not repeated. Root's five R2 cases at `878212ad` under Node 24.22.1 stay a separate historical packet.

The earlier 69 focused results are not input-identical on this tree. `kein Caller reicht eine Factory-Promise als Client weiter` and `der Kompatibilitätsalias createServerClient bleibt unbenutzt als synchrone Hintertür` walk every non-test TS/TSX file. They see these 14 incoming paths: `components/trips/GastArbeitsbereich.tsx`, `components/trips/KontoArbeitsbereich.tsx`, `components/trips/RegistryReiseUebernahme.tsx`, `components/trips/Reisevorbereitung.tsx`, `components/trips/TripWorkspace.tsx`, `components/trips/useTripTravellerSnapshotLifecycle.ts`, `lib/readiness/trip-traveller-snapshot-workflow-1.ts`, `lib/traveller/account-registry-trip-copy.ts`, `scripts/trip-traveller-snapshot-workflow-completion-1/aktions-stub.ts`, `scripts/trip-traveller-snapshot-workflow-completion-1/flaeche.tsx`, `scripts/trip-traveller-snapshot-workflow-completion-1/matrix.tsx`, and the three shims `cache.ts`, `headers.ts`, `navigation.tsx`. The fresh native App run is the integrated-tree gate for those tests. This note does not record that run.

## Earlier correction state

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

Root Technical Lead, after the fresh native Typecheck/Lint/Build, Auth configuration, and exact-head Preview on the pushed head. Those results are recorded in the PR handoff. Cursor does not Ready, merge, close #1015, write `main`, or start a follow-up.
