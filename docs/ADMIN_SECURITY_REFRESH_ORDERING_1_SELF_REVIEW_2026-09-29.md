# Admin Security Refresh Ordering 1 — SELF-REVIEW

Stand: 29. September 2026
Writer: **Jetnity admin security refresh ordering 1**, Generation 1
This is the author self-review. It is not an independent Technical-Lead PASS.

## Exact diff intent

Allowed and present:

- `components/admin/security/SecurityWidget.tsx` — list-read ordering only
- `lib/admin/security/refresh-reihenfolge.ts` — identity and authority predicate
- `lib/admin/security/refresh-reihenfolge.test.ts`
- `scripts/admin-security-refresh-ordering-1-verify.mjs`
- `docs/evidence/admin-security-refresh-ordering-1/`
- this status, handoff and self-review

Not modified:

- `lib/admin/security/filter-ehrlichkeit.ts`
- `lib/admin/ehrliche-zustaende.ts`
- `app/api/admin/security/list/route.ts`
- `app/api/admin/security/block/route.ts`
- `app/api/admin/security/unblock/route.ts`
- SQL, Auth, RLS, users, payments, `package.json`, workflows, `docs/ACTIVE_WORK_STATUS.md`, `JETNITY_START_HERE.md`

## Attempts to refute the fix

1. An older success can replace a newer success.
   Result: the actual widget showed `synthetic-newer-read` after A resolved second. `synthetic-older-read` was absent. Refuted on the component. The unguarded run did the opposite (`before.json`).
2. An older success can clear a newer failure.
   Result: `synthetic-newer-failure` and the first-load failure headline stayed. The older row did not appear. Refuted.
3. An older failure can attach an error to a newer success.
   Result: no alert, and `synthetic-older-failure` was absent. Refuted.
4. An older completion can turn loading off while the newer read is in flight.
   Result: the Aktualisieren button stayed disabled and the older row stayed hidden until B resolved. Refuted.
5. The guard drops the current failure's stale-data behaviour.
   Result: after a successful read, the next failed read kept `synthetic-kept-read` and the blocklist IP, and showed the update-failed / older-data sentences. Refuted.
6. The poll loops or changes interval.
   Result: the registered delay stayed `[15000]`. The overlapping pair was two GETs. One further clock tick added exactly one GET. Refuted for that tick.
7. Filter or bound copy moved.
   Result: this harness plus the existing #614 and #618 harnesses passed on this head. Refuted.
8. Block or unblock bodies changed.
   Result: synthetic bodies were `{"ip":"203.0.113.42","reason":"synthetic-reason"}` and `{"ip":"203.0.113.42"}`, each followed by one list GET. The `schreibe` function was not edited. Refuted for the rendered contract.
9. The same identity could be issued twice.
   Result: the ref increment happens before `await`. The predicate is true only when the started id equals the newest id and is greater than zero. Unit tests cover inequality. Not refuted by a second synchronous caller in the harness, because the widget does not call `refresh` twice before the first await except through later timers and clicks, which the harness did exercise.

## Overlap

Re-read `origin/main` at `6b267186bd8f8261b76583cc3a20af4ddc4fbf89`. This branch was 0 behind that main.
PR #616 head `fd73e7e631f8d07e3bc4ce60427f3879f036648b` still changes only users created-at paths. This diff has none of those paths.

## Validation recorded in NOTES

Focused tests, the actual-widget harness, both merged Security honesty harnesses, `npm test` (4040 pass), typecheck, lint (0 errors, 144 pre-existing warnings), hygiene checks and production build passed. `npm ci` was not re-run. No `.env` was present for `check:setup`. Database and Auth checkers were not run because those surfaces were not changed.

## Stop

No Ready. No merge. No follow-up slice.

**STOP FOR INDEPENDENT CHATGPT TECHNICAL-LEAD CODE + INTERACTION REVIEW.**
