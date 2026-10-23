# Visit Date Precision Fix 1 — handoff

Stop for independent Technical-Lead review. Do not Ready. Do not merge. Do not start a follow-up slice.

## Identity

| Item | Value |
| --- | --- |
| Logical agent | Jetnity Visit Date Precision Fix 1 — Cursor Generation 1 |
| Session | https://cursor.com/agents/bc-d763a36a-3e5e-4ae4-bb44-0bcf66384c17 |
| Session id | `bc-d763a36a-3e5e-4ae4-bb44-0bcf66384c17` |
| Session title | Set through the run rename API. The API returned `Jetnity Visit Date Precision Fix 1 — Cursor Generation 1`. The Cursor window itself was not screenshotted. |
| Requested model | Claude Opus 5.5 High |
| Observed model | `originalModelName=grok-4.7-high-fast` from this run's identity. Not Auto. Not Claude Opus 5.5. No alternative was selected by this writer. |
| Issue / PR | #969 / Draft #972 |
| Immutable TASK blob | `7d466cdb61b6988f7df1d627aaf0ff2651789baa` |

## Git, re-read before this handoff commit

| Item | Value |
| --- | --- |
| `origin/main` | `5269b9192a2300c6c03fc8659964583130d2d1d1` |
| Merge-base | `5269b9192a2300c6c03fc8659964583130d2d1d1` |
| Ahead / behind before this docs commit | 2 / 0 |
| Code head | `b40cf319fca60066c16c90b637c2f3e2902355e1` |
| Code tree | `d3e175dd4fd6d20507b81a72a8d7bbcf08958579` |
| Seed head | `09dcff69b0aacd25d6b4c882921514ae52bcae0a` |
| Review head | The commit that adds this file. Its SHA is the PR evidence comment, not this paragraph. Main had not moved at the fetch immediately before the commit. |

Files on the branch versus main, before this docs commit:

- `docs/JETNITY_VISIT_DATE_PRECISION_FIX_1_TASK_2026-10-23.md` (seed, unchanged since)
- `docs/JETNITY_VISIT_DATE_PRECISION_FIX_1_PLAN_2026-10-23.md`
- `components/account/AccountBesuchFormular.tsx`
- `lib/account/visit-date-precision-1/zeitfeld.ts`
- `lib/account/visit-date-precision-1/zeitfeld.test.ts`

This commit adds STATUS, SELF_REVIEW and HANDOFF only.

## Decision

`besuchZeitfeldSetzen` is the only date-field transition. A parent is cleared when its new text trims to empty, matching the existing disable checks. Descendants become `''` and are not restored. A nonempty edit keeps them, including an invalid leap day or a future date. Create and edit already share the form and `besuchEingabeAus`, so `AccountBesuche.tsx` stayed read-only.

## Commands

| Command | Result |
| --- | --- |
| Focused `zeitfeld.test.ts` | 9 pass / 0 fail. Re-run after `npm ci`: same. |
| `lib/account/besuche.test.ts` with the focused file | 57 pass / 0 fail. File unchanged. |
| `npm test` first, no local `initdb` | 6985 pass / 10 fail / 5 skip. All 10 failures: `spawnSync /usr/lib/postgresql/16/bin/initdb ENOENT` in pre-existing disposable-cluster proofs. |
| Local PostgreSQL 16.15 binaries installed. Package cluster init ran; `policy-rc.d` denied service start. No Jetnity database was contacted. | Binaries present. |
| `npm test` with binaries, ambient `SUPABASE_PROJECT_REF` still set | 7050 pass / 7 fail / 4 skip / 33 cancelled. Failures: `local_proof_connection_override_forbidden`. The value was not read. |
| `env -u SUPABASE_PROJECT_REF npm test` | **7102 pass / 0 fail / 4 skip / 835 suites.** This is the full-suite result. The variable was removed from that process only. |
| 4 skips | T09 shared layout browser audit; shared responsive layout audit (`SHARED_LAYOUT_AUDIT_BASE` unset); two CI-only cases that assert failure when PostgreSQL binaries are absent. |
| `npm run typecheck` | pass |
| `npm run lint` | 0 errors, 146 pre-existing warnings. None in this slice's files. |
| `npm run build` | pass. Next.js 16.4.1. Setup check warning: no `.env` / `.env.local` in this workspace. |
| `npm ci` | pass. 532 packages. Audit text reported 10 existing vulnerabilities. No dependency change. |
| `check:dead` | pass. 0 unowned files. |
| `check:exports` | pass. 0 unused exports. |
| `check:deps` | pass. |
| `check:api-schutz` | pass. 12 admin routes. |
| `check:schema-bezug` | pass, with the pre-existing LOCAL/UNAPPLIED RPC list. None added. |
| `check:operating-mode` | pass. Mode NORMAL. |
| `auth:pruefen`, hosted DB gates | not checked. Not required for this surface, and not run. |

## CI / Preview

On code head `b40cf319` only, not on the review head:

- GitHub CI [39972111536](https://github.com/Jetnity/jetnity/actions/runs/39972111536) success.
- Auth job `120477382995` success.
- Typecheck, Lint & Build job `120477383835` success.
- Vercel check pass, deployment `uQGWP96JsamepeBX4pcwBLtJeY3W`.
- Seed CI `39970691182` on `09dcff69` was cancelled when the code head was pushed.

Preview UI was not opened and no account was signed in. The docs commit needs its own exact-head CI and Preview. Those were not claimed here.

## Excluded

No Production or Development database call or write. No Supabase Auth/Admin/RLS/migration. No secret read. No real account, personal browser or Owner profile. No government, provider, LLM or paid call. No feature flag, dependency, workflow or deployment/alias action. #917, #944, #936, #937, #911, #913, #626, #968 and #748 gates were not acted on. #937 stays paused. #957 stays dormant. #955 stays complete. No Official-Truth follow-up.

The newest #751 material read was R98 FINAL `6367452544`, which left this implementation open. The newest #748 material was COS-20261019-1521-016 `6268214902` on the #968 Preview credential scope. It does not change this form fix and was not re-opened.

## Risks

- P0: none.
- P1: none from this diff.
- P2: signed-in create/edit click-through not checked.
- P3: impossible calendar days still reach the server and are rejected there.

Global `ACTIVE_WORK_STATUS`, roadmap and governance were left for the Technical Lead. A pointer update is not required for this fix to be reviewed.

Self-review: `docs/JETNITY_VISIT_DATE_PRECISION_FIX_1_SELF_REVIEW_2026-10-23.md`. It is not TL acceptance.
