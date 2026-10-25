# R107-D — Admin User Directory Completion 1 — SELF-REVIEW

Date: 2026-10-25. Author: Jetnity Admin User Directory Completion 1 — Cursor Generation 1. This review is not a Technical-Lead PASS.

## Checked against the accepted plan

- Dispatch sets the operation to `dispatched` before `router.replace`. A URL that already matches the current read settles immediately, so a completed history step does not stay `acknowledged` and block retry.
- A text draft that differs from the URL cancels a checking lease before debounce. The draft does not relabel the current rows as the new result. It does mark them as the previous query.
- The same error, a lease timeout, Back/Forward, filter and page changes, and unmount behave as specified in the mounted cases. `router.refresh()` is counted as a call only.
- Every generated pager and recovery href in the presentation tests and the mounted ceiling cases stays in pages 1…5000. Count 100001 is shown. Page 5001 is an invalid address whose recovery is page 1.
- D-EX1 changes only the two named assertion sites. The page still awaits `leseOptionalRequestParam`, keeps `PAGE_SIZE = 20` and the `(await createServerComponentClient()) as any` cast, and opens that client only after `readUsersDirectory({`. The de-CH observation moved to `formatUsersDirectoryTimestamp`. Provenance tests still require `profilErstellt` and `last_seen_at ?? null`.

## Limits I am not calling success

- The mounted harness follows the URL with a test double. It does not prove that a Next.js server render produced the next `readAttempt`. A changed attempt means the stub delivered new props.
- The 8000 ms lease releases the button. It does not know whether a request is still running.
- `npm test` failed 11 local PostgreSQL proofs. Treating the other 7176 passes as a full-suite pass would hide that exit code.
- `total={result.count ?? 0}` remains on the ready page so the legacy prop stays a number. The visible count, when `read` is present, uses `read.count`, including null. The legacy branch without `read` still prints that numeric total. Production always passes `read`.
- Clear with an already clear URL returns before navigation. That click does not cancel a lease, because it is not a new query. A real filter clear goes through `dispatchNavigate`, which cancels the lease.
- Unknown stored role and status still display as `DEFAULT_ROLE` and `active`. That is P2 and was left in place so `toggleBan` and `changeRole` do not change.
- The historical #608 script still expects the old placeholder and `3 / 3`. It was not edited. That is P3.

## Not done

No Ready, no merge, no tracking closure, no write to `main`, no sibling integration, no hosted read, no personal browser.
