# R107-D — Admin User Directory Completion 1 — SELF-REVIEW

Date: 2026-10-25. Author: Jetnity Admin User Directory Completion 1 — Cursor Generation 1. This review is not a Technical-Lead PASS.

## R2 finding

The false settlement came from `commitFilters` clearing `ownSearchAcks` before the newer role or status replace. The later `anna` address then looked external: the field was restored and the open filter operation was replaced by an already settled search operation.

The correction removes only that acknowledgement clear. I did not rewrite `goto`, `clearFilters`, or the URL-sync branches. The two mounted cases commit both queued replaces. After the older search lands, the input stays empty, the status contains `vorherigen Abfrage`, and the phase is not `settled`. The later filter landing is `page=1&role=operator` or `page=1&status=pending`.

## R1 findings, left as accepted

- Retry still uses validated query identity. `usersListHrefMatches` stays literal.
- Clear still retains own acknowledgements and still queues when its href matches the current URL.
- Keyboard proof still presses Tab and Enter.

## What I am not calling success

- The router stub still supplies the next read. A refresh call is not a received response. A new `readAttempt` is not proof that this refresh caused it.
- The mounted run is 44/44 on `5575794c` with project CSS and the lane router stub. It is not hosted Supabase, RLS, Production, or a signed-in Next router.
- `npm test` still exits 1 because 11 local PostgreSQL proofs cannot start. 7177 other tests passed.
- Unknown database role and status still display as the default role and `active`. That exclusion stays.
- The historical #608 script is still outside this allowlist.
- A same-value role or status selection during a delayed search is not the reviewed case. `commitFilters` still returns without a new replace when the href is unchanged, after snapping the field to the committed query.

## Main-sync 1

I merged accepted main and recorded provenance only. I did not rerun the mounted packet or the 69 focused tests, and I do not call those historical results a new execution on the integrated tree. The two repository-scanning tests in `lib/next/request-api-compat.test.ts` see 14 incoming non-test TS/TSX files, so the focused set is not input-identical.

## Not done

No Ready, no merge, no tracking closure, no write to `main`, no hosted read, no personal browser.
