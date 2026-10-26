# Admin User Mutation Safety 1 — HANDOFF

**26 October 2026 · controlled integration of accepted A main · stopped for Technical-Lead review**

## Identity

- Logical name: Jetnity Admin User Mutation Safety 1 — Cursor Generation 1
- Model: `grok-4.7-high-fast` (`originalModelName` on Cursor Cloud run-info for this session)
- Session: `bc-0f319766-c72a-4754-b297-6f449bc5dced`
- Link: https://cursor.com/agents/bc-0f319766-c72a-4754-b297-6f449bc5dced
- Branch: `feat/r109-admin-user-mutation-safety-1`
- Draft PR: #1035
- Tracking: #1032
- Parent: #1026
- Starting reviewed head: `4b7d6616218b7f613dc91d061f87595d03424a6f`, tree `d61df342e73fa5205a45bd070c0d9afa52b6f78a`
- Accepted main merged: `813c0ca774e3bf45ef2a7d7b8404556028389ca2`, tree `ac655160fb063b44f103f37827361c17c1931e4f`
- Ordinary merge commit: `54b540c0e9860f77d02cfd09512c5a514d5aa6df`
- Merge parents: `4b7d6616218b7f613dc91d061f87595d03424a6f` and `813c0ca774e3bf45ef2a7d7b8404556028389ca2`
- Merge tree: `7eb8dc14a5314db025baa5f055e2e0c15b927d1c`
- Merge-base with that main, after the merge: `813c0ca774e3bf45ef2a7d7b8404556028389ca2`
- No rebase, reset, force push, sibling merge or cherry-pick. No conflicts.
- The documentation commit on top of that merge is the delivery tip. Its hash, tree and ahead/behind are in the PR author block, because this file is inside that commit.
- Mode re-read: `NORMAL`.
- TASK V1 blob remains `d9fb19170be99c0decb06125f8556aeb3a0470e3`.

## R1

- A failed or invalid directory read no longer says the account is missing. Only an accepted read may do that.
- A later accepted read that contradicts or drops a confirmed account replaces the current sentence with an explicit historical note. Recovery still does not send.
- A later failed read after confirmation does not invent a new role or status.
- Removing a confirmation because the account left an accepted list does not pull focus out of the search field. Escape still returns to the row trigger.
- `editable-lower-rank-records-one-call` now waits for the confirmation control, asserts zero calls before it, then asserts one `setUserRole`. That is the only edit in `scripts/admin-user-directory-completion-1/verify.mjs`.
- R1.3 supplement: the confirmation is an inline named region. It does not set `aria-modal` and does not trap Tab. Search input and a second target confirmation stay available. Escape inside one confirmation cancels that confirmation and restores its trigger. Mounted proof checks keyboard movement, two regions, zero `aria-modal="true"` and zero `inert`. No screen-reader run. The UUID character-class note stays a non-blocking P3 with no server, SQL or Auth edit.
- R1.2 residual: after an ambiguous note, a later accepted read replaces the sentence. Absence followed by Creator no longer says the account is missing. Nutzer followed by Moderation no longer says the current read shows Nutzer. A failed read after Nutzer keeps that role in the past tense and does not claim a new absence. One original call, no resend.

## Changed files

- `components/admin/UsersTable.tsx`
- `components/admin/users/UserMutationConfirmation.tsx`
- `components/admin/users/user-mutation-confirmation.css.ts`
- `components/admin/users/user-mutation-copy.ts`
- `lib/admin/user-mutation-lifecycle.ts` and `.test.ts`
- `scripts/admin-user-mutation-safety-1/verify.mjs`
- `docs/evidence/admin-user-mutation-safety-1/harness.tsx` and `mounted.json`
- `scripts/admin-user-directory-completion-1/verify.mjs` — one case only
- these PLAN, STATUS, REPORT, SELF_REVIEW and HANDOFF files

Not changed by this writer: `actions.ts`, `lib/auth/**`, directory query/navigation modules, migrations, workflows, global CSS, operating mode, TASK V1, `package.json`, `package-lock.json`. Accepted S, T and A arrived only as the second parent of the merge. `package-lock.json` on the merge is byte-identical to accepted main `abffddeeea0cc1f5507280f82ebf71fd56052fa8`. Installed from that lock: `ws` 8.21.0 and `source-map-js` 1.2.2.

## Checks on the integrated tree

Node `v22.23.4`. Playwright `1.55.0`. `npm ci` from the integrated lock. Focused suites `user-mutation-lifecycle`, `user-row-truth` and `users-directory-read`: 21 passed, 3 suites, 0 failed, 0 skipped. Mounted mutation harness: 31/31 ok, external network aborted. That includes captured target and one write, duplicate and conflicting locks, independent targets, failed and invalid reads versus absence, later accepted and failed reads after an ambiguous note, no resend, search-focus preservation, Cancel and Escape, named non-modal regions, natural Tab order, scoped Escape, and unmount.

Historical directory provenance stays mixed-head. On `0a6fccee`, Root observed 28 legacy passes and one `css-320` failure, with 15 cases unexecuted. Those remaining 15 passed on `4b7d6616`. That is not 44 passes of one head. The `css-320` assertion was not weakened. On this integrated tree the same directory script, including the already authorized confirmation witness, returned 44/44, and `css-320` passed this local Chromium run. That run does not replace the independent `0a6` failure. Root collects all 44 outcomes on the integrated head. The script rewrote `docs/evidence/admin-user-directory-completion-1/mounted.json` and three screenshots; those files were restored to the historical R107 record and are not part of this delivery.

`npx tsc -p tsconfig.json --noEmit` exit 0. Owned ESLint exit 0. `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug` exit 0. The schema check still prints the pre-existing LOCAL/UNAPPLIED RPC notes. `npm run build` exit 0. `npm test`: 7312 tests, 7296 pass, 11 fail, 5 skip. The 11 failures are local PostgreSQL proofs in this environment: four report `spawnSync /usr/lib/postgresql/16/bin/initdb ENOENT`, five stop at `local_proof_connection_override_forbidden` because `SUPABASE_PROJECT_REF` is set, and two report `NOT_VERIFIED: local PostgreSQL binaries are required`. Two of the eleven are parent rows of a failed subtest. No user-mutation test failed. No PostgreSQL was installed and the project ref was not unset.

No hosted SQL, no signed-in admin, no persistence or Production claim. No screen-reader run. No physical device. CI and Preview for this delivery head are pending and are not copied into a later docs-only commit.

## Gate

Draft. No Ready. No merge. No FINAL integrated-head PASS from this writer. Next actor: Technical Lead. No follow-up slice.
