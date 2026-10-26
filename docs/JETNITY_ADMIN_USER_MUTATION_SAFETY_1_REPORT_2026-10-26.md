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

## R1 — 26 October 2026

Reviewed head `425ff6270d12de981b3b4c5b92af36f06a8ec6f1`.

A failed or invalid read after a fulfilled action keeps the operation unconfirmed and does not say the account is missing. A later accepted read can still confirm it. A confirmed role that a later accepted read shows as Nutzer, or omits, becomes a historical note. A later error does not replace that note with a new current role. Search focus survives automatic removal of the confirmation. Escape still returns to the row trigger.

`editable-lower-rank-records-one-call` asserts no `setUserRole` before confirmation and one call after it. The other 43 R107 witnesses were re-run and not rewritten.

Mounted mutation harness: 27/27 ok. R107 directory harness: 44/44 ok. `npx tsc -p tsconfig.json --noEmit`: exit 0. `npm run build`: exit 0. Owned ESLint: exit 0. `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`: exit 0. The schema check still prints the pre-existing LOCAL/UNAPPLIED RPC notes.

`npm test`: 7270 tests, 7254 pass, 11 fail, 5 skip. The 11 failures are `spawnSync /usr/lib/postgresql/16/bin/initdb ENOENT` in unrelated native PostgreSQL proofs. No user-mutation test failed.

## Limits

No hosted SQL, no signed-in admin, no persistence proof. Full unmount drops the in-memory operation. There is no cross-tab channel. A refresh count is not a saved row. This branch was not rebased onto main `68435f012f27f599a1092699f5635aa88312ea67`.
