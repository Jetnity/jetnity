# Official Truth Private Evidence Store Schema 1 — Self-Review

Date: 1 October 2026
Issue: #674
Draft PR: #675
Branch: `feat/official-truth-private-evidence-store-schema-1`

Logical agent: **Jetnity Official Truth private evidence store schema 1**, Generation 1
Session: https://cursor.com/agents/bc-7ddd81cb-1513-4ecc-9745-08a611b1b06b
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This is the author self-review. It is not a Technical-Lead PASS.

## Scope check

The diff stays inside the task allowlist. The binding task file is unchanged. `docs/ACTIVE_WORK_STATUS.md` was not edited, because the allowlist forbids it. Continuity for this slice is the report and this handoff pair.

No remote Supabase command was run. The migration was applied only to a local throwaway PostgreSQL 16.15 database, which was then dropped.

## What I checked

- The migration filename came from `supabase migration new`, CLI `2.48.3`, after the binary was downloaded outside the repo. I did not invent the timestamp.
- The CLI warned that `2.119.0` is newer. I did not recreate the file with a newer CLI, because that would mint a second timestamp.
- The same CLI wrote gitignored `supabase/.temp/cli-latest`. The sanitation test correctly failed while that file existed. I deleted the temp directory. The clean `npm test` was 4140 pass / 0 fail. The temp file is not committed.
- Static test `lib/readiness/evidence-store-schema.test.ts`: 7/7.
- `git diff --check` and the operating-mode guard passed.
- Typecheck passed. Lint passed with 0 errors and 148 pre-existing warnings, none in the new test.
- Hygiene checks passed. `check:schema-bezug` still reports the pre-existing LOCAL/UNAPPLIED RPC `admin_account_counts_v1`.
- Setup check passed with the existing missing-`.env` warning.
- Production build passed on Next.js 16.3.8 and generated 25 static pages.
- Local SQL covered the date-only versus instant distinction, class/authority consistency, domain shape, citizenship ordering, the unlinked relation, forced RLS, and the `anon` revoke.

## Findings I am not calling done

1. `service_role` bypasses RLS. The migration revokes it. A later grant to that role would expose the table to a bypass role even with no policy. The next adapter must treat that grant as a security decision, not as a convenience.
2. Source class and authority are not snapshotted onto the evidence version. That avoids a second writable truth. It also means a later privileged update of `official_sources` would rewrite history. The adapter slice should freeze those columns or snapshot them under a reviewed write path.
3. Parent and child hostnames are not rejected. DNS ownership is not proved. The URL check is narrower than `quelleUrlLesen`.
4. A source may be inserted before any domain row. A version chain is not proved acyclic under a later update. Both would need a trigger or a writer, and this task forbids triggers.
5. Local PostgreSQL 16.15 does not prove the Development server version. Development application and the advisor readback remain Technical-Lead work after PASS.
6. `db:rechte`, `db:rls`, `db:sicherheit` and `auth:pruefen` were not run. Running them would talk to the live Development database. This slice does not do that.

## Exact-head gates read after the implementation push

Read in this session for `5a537ddb7107eef49779273b4556c38c25cfe679` only:

- GitHub CI run `36855719623` **SUCCESS**, event `pull_request`
- Auth job `110347617833` **SUCCESS**
- Typecheck, Lint & Build job `110347618104` **SUCCESS**
- Vercel commit status **success**, inspector `https://vercel.com/jetnity-e1b93c82/jetnity-app/BKSExJ7Cp1i3zPPeHwRR2SVySfGF`
- GitHub Preview deployment `6783105853` **success**, target `https://jetnity-nyhb0pcnx-jetnity-e1b93c82.vercel.app`, direct GET HTTP 302 to Vercel SSO

The commit that writes these facts is a newer head. Those gates do not cover it.

## R1-F1

Review `5378817724` on `55c7956301c692ee52b8f47be0964fc9ab046c53` found that a `CHECK` expression of `NULL` passes. I added `IS NOT NULL` before the value test in the option, required-residence and `travel_date` branches of the same migration. I did not require `related_citizenship_country_code`. Null there remains unlinked.

Static test `mode checks fail closed when a required child is null` is in `lib/readiness/evidence-store-schema.test.ts`. The file is 8/8. Throwaway PostgreSQL 16.15 rejected the four null cases with `23514` and the named check, accepted the unlinked relation and the not_applicable-null children, and was dropped. No remote database command was run.

CI and Preview for `55c7956301c692ee52b8f47be0964fc9ab046c53` do not cover this correction.

Read in this session for correction head `3b99d57581f362076dcbdf618f62d451c87f2067` only:

- GitHub CI run `36858435155` **SUCCESS**, event `pull_request`
- Auth job `110356425778` **SUCCESS**
- Typecheck, Lint & Build job `110356426704` **SUCCESS**
- Vercel commit status **success**, inspector `https://vercel.com/jetnity-e1b93c82/jetnity-app/De1DAXtqgL8oG5BJjMFpg5zj2sKD`
- GitHub Preview deployment `6783588278` **success**, target `https://jetnity-pdmt06zdx-jetnity-e1b93c82.vercel.app`, direct GET HTTP 302 to Vercel SSO

The commit that writes these facts is a newer head. Those gates do not cover it.

## Stop

No Ready. No merge. No remote apply. No follow-up slice.

**STOP for independent Technical-Lead re-review of the R1 correction head.**
