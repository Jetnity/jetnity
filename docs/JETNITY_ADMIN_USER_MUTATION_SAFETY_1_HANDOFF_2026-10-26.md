# Admin User Mutation Safety 1 — HANDOFF

**26 October 2026 · R1 stop for independent Technical-Lead review**

## Identity

- Logical name: Jetnity Admin User Mutation Safety 1 — Cursor Generation 1
- Model: `grok-4.7-high-fast` (`originalModelName` on Cursor Cloud run-info for this session)
- Session: `bc-0f319766-c72a-4754-b297-6f449bc5dced`
- Link: https://cursor.com/agents/bc-0f319766-c72a-4754-b297-6f449bc5dced
- Branch: `feat/r109-admin-user-mutation-safety-1`
- Draft PR: #1035
- Tracking: #1032
- Parent: #1026
- Reviewed head: `425ff6270d12de981b3b4c5b92af36f06a8ec6f1`
- Main re-read, not merged: `68435f012f27f599a1092699f5635aa88312ea67`
- Previous merge-base remains `6ae344f4453b16514f9048083bb8b07396135fa2` until Root integrates
- The PR author block carries the exact R1 tip, tree and ahead/behind after push

## R1

- A failed or invalid directory read no longer says the account is missing. Only an accepted read may do that.
- A later accepted read that contradicts or drops a confirmed account replaces the current sentence with an explicit historical note. Recovery still does not send.
- A later failed read after confirmation does not invent a new role or status.
- Removing a confirmation because the account left an accepted list does not pull focus out of the search field. Escape still returns to the row trigger.
- `editable-lower-rank-records-one-call` now waits for the confirmation control, asserts zero calls before it, then asserts one `setUserRole`. That is the only edit in `scripts/admin-user-directory-completion-1/verify.mjs`.

## Changed files

- `components/admin/UsersTable.tsx`
- `components/admin/users/UserMutationConfirmation.tsx`
- `components/admin/users/user-mutation-copy.ts`
- `lib/admin/user-mutation-lifecycle.ts` and `.test.ts`
- `scripts/admin-user-mutation-safety-1/verify.mjs`
- `docs/evidence/admin-user-mutation-safety-1/harness.tsx` and `mounted.json`
- `scripts/admin-user-directory-completion-1/verify.mjs` — one case only
- these PLAN, STATUS, REPORT, SELF_REVIEW and HANDOFF files

Not changed: `actions.ts`, `lib/auth/**`, directory query/navigation modules, migrations, workflows, global CSS, operating mode, TASK V1. This branch was not synchronized with main or siblings.

## Checks

Node `v22.23.4`. Mounted mutation harness: 27 cases, all ok, external network aborted. R107 directory harness: 44 cases, all ok, including `editable-lower-rank-records-one-call`. `tsc` exit 0. `npm run build` exit 0. Owned ESLint exit 0. Five hygiene checks exit 0. `npm test`: 7270 tests, 7254 pass, 11 fail on missing local `initdb`, 5 skip. No user-mutation failure.

No hosted SQL, no real account, no persistence or Production claim.

## Gate

Draft. No Ready. No merge. Next actor: Technical Lead, independent exact-head review. No follow-up slice from this writer.
