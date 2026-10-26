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

The confirmation is now an inline `region` with its existing name and description. `aria-modal` and the Tab trap are gone. A mounted case types in search, leaves the region with Tab, opens a second confirmation, and checks zero `aria-modal="true"` nodes and zero `inert` nodes. Escape in the search field leaves the confirmation open. Escape inside Ada's confirmation restores Ada's trigger and leaves Bao's confirmation open. No screen-reader run. No server, SQL or Auth change for the non-blocking UUID qualification.

On `0a6fccee`, an ambiguous sentence stayed worded as the current read. The replacement head revisits that note. Creator after an accepted absence is described as the latest accepted role. Moderation replaces a Nutzer sentence. A failed read after Nutzer uses the past tense and does not say the account is missing. Each mounted sequence keeps one `setUserRole` call.

Mounted mutation harness: 27/27 ok. R107 directory harness: 44/44 ok. `npx tsc -p tsconfig.json --noEmit`: exit 0. `npm run build`: exit 0. Owned ESLint: exit 0. `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`: exit 0. The schema check still prints the pre-existing LOCAL/UNAPPLIED RPC notes.

`npm test`: 7270 tests, 7254 pass, 11 fail, 5 skip. The 11 failures are `spawnSync /usr/lib/postgresql/16/bin/initdb ENOENT` in unrelated native PostgreSQL proofs. No user-mutation test failed.

## Integration — 26 October 2026

Accepted main `813c0ca774e3bf45ef2a7d7b8404556028389ca2` merged into `4b7d6616218b7f613dc91d061f87595d03424a6f` as `54b540c0e9860f77d02cfd09512c5a514d5aa6df`. Parents are those two commits. Merge tree `7eb8dc14a5314db025baa5f055e2e0c15b927d1c`. `package.json` and `package-lock.json` match that main. `npm ci` installed `ws` 8.21.0 and `source-map-js` 1.2.2.

On that integrated tree, before this documentation commit: focused tests 21/21. Mounted mutation harness 31/31. Directory script 44/44, including `css-320` on this local run. The independent `0a6fccee` result remains 28 passes, one `css-320` failure, and 15 cases not run there. The later 15 on `4b7d6616` do not turn those mixed runs into 44 passes of one head. Directory evidence files rewritten by the script were restored.

`tsc` exit 0. Owned ESLint exit 0. Hygiene checks exit 0. `npm run build` exit 0. `npm test` 7312 tests, 7296 pass, 11 fail, 5 skip. Failures are local PostgreSQL proofs: missing `initdb`, `local_proof_connection_override_forbidden` while `SUPABASE_PROJECT_REF` is set, or an explicit local-binary `NOT_VERIFIED`. No database was provisioned.

## Limits

No hosted SQL, no signed-in admin, no persistence proof, no screen-reader run, no physical device. Full unmount drops the in-memory operation. There is no cross-tab channel. A refresh count is not a saved row. CI and Preview for the delivery head are pending. This integration is not a Technical-Lead PASS.
