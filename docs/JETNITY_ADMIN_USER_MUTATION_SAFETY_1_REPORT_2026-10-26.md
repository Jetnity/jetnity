# Admin User Mutation Safety 1 — REPORT

**26 October 2026**

## What changed

The users page no longer paints an unknown stored role as the default user role or an unknown status as active. The table asks for the exact account and the requested role or status before it calls the existing server actions. A second activation for the same target does not send. A different target can proceed. Success text appears only after a newer read attempt shows the requested row. Recovery closes the local note and does not send again.

## Verification

Node `v22.23.4`. Playwright Chromium 140.0.7339.16. External requests aborted at `https://example.com`.

Mounted harness `scripts/admin-user-mutation-safety-1/verify.mjs`: 21 cases, all ok. Evidence `docs/evidence/admin-user-mutation-safety-1/mounted.json` plus layout screenshots at 320px with 32px root font, 390px and 1280px.

`npx tsc -p tsconfig.json --noEmit`: exit 0.  
`npm run build`: exit 0.  
`check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`: exit 0.  
Owned ESLint: exit 0. Full `npm run lint`: exit 1 with 178 warnings and, before the harness ref fix, 2 errors in this harness; after the fix the owned harness file is clean. The remaining lint failure is the pre-existing warning set. `page.tsx` still warns on the pre-existing `as any` client cast, which this slice did not introduce.

`npm test`: 7268 tests, 7252 pass, 11 fail, 5 skip. All 11 failures are `spawnSync /usr/lib/postgresql/16/bin/initdb ENOENT` in unrelated official-truth/native PostgreSQL proofs. Skips are native PostgreSQL or an unset shared-layout audit server. No user-mutation test failed.

R107 directory script: every witness before `editable-lower-rank-records-one-call` passed. That one witness waits for `setUserRole` on the menu click and now times out, because dispatch waits for confirmation. From `own-row-does-not-mutate` through the CSS and keyboard witnesses, a continuation run passed, including the own-account block. The older search-navigation script still waits for placeholder `Suche nach Name oder E-Mail…`. The seed table already uses `Name oder E-Mail suchen…`, so that failure is not from this slice.

## Limits

No hosted SQL, no signed-in admin, no persistence proof. Full unmount drops the in-memory operation. There is no cross-tab channel. A refresh count is not a saved row.
