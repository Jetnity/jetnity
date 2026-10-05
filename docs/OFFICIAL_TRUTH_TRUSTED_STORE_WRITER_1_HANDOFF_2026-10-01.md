# Official Truth Trusted Accepted-Store Writer 1 — Handoff

Date: 1 October 2026
Issue: #682
Draft PR: #683
Branch: `feat/official-truth-trusted-store-writer-1`
Baseline: `main@7c3dc2835622355d3dd8f5fb9efa4b3e63899b9e`

Logical agent: **Jetnity Official Truth trusted accepted-store writer 1**, Generation 1
Session: https://cursor.com/agents/bc-9f6575c9-7aa3-4b97-b0a4-4ff4db26f877
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

## Current state

The repository contains a dormant accepted-store writer. The Technical Lead applied it exactly once to Development as history version `20261001180549`. Production is untouched. Merge remains held. There is no merge PASS.

Technical-Lead R1 review `5383176732` is **CHANGES REQUIRED** on `7eff82b7bc3fee950dc85f4525e6f57b152f1c13`. That head's CI `36900295291`, Auth `110497479353`, Typecheck/Lint/Tests/Build `110497479627` and Vercel Preview `dpl_2i6juhsXg1ei6UgF4W3HVSJ8bWG5` are historical. The correction on this tip is only R1-F1 and R1-F2:

- the server calls `.rpc('official_truth_store_accepted_v1', ...)`;
- `LOCAL_UNAPPLIED_RPCS` registers that name from `lib/readiness/official-truth-store-server.ts` to `supabase/migrations/20261001180549_official_truth_trusted_store_writer_1.sql`;
- `check:schema-bezug` classifies it LOCAL/UNAPPLIED beside the existing `admin_account_counts_v1` entry;
- `accepted_evidence` rejects unless `lifecycle` is `accepted` and `validation_state` is `valid`, before duplicate handling.

Canonical repository file, matching the one Development history version:

`supabase/migrations/20261001180549_official_truth_trusted_store_writer_1.sql`

The original local CLI filename, from Supabase CLI `2.48.3` through `supabase migration new official_truth_trusted_store_writer_1`, was `20261001171111_official_truth_trusted_store_writer_1.sql`. That timestamp was not typed by hand. Technical-Lead R3 review `5383450871` recorded the one successful Development apply as `20261001180549`. `git mv` changed only the repository filename. SHA-256 before and after is `8b9a47f42ac9d2fcef62775a8a824c2e79abc86f583ebeea5a5ece56f7a93df4`. The SQL bytes are unchanged. This correction does not apply, repair, reset, or push Supabase. A second apply is forbidden. The CLI warned that `2.119.0` exists. The file was not recreated with a newer CLI. It wrote gitignored `supabase/.temp/cli-latest` at creation time. That file was removed and is not part of the commit.

Server module:

`lib/readiness/official-truth-store-server.ts`

Read first:

1. `docs/OFFICIAL_TRUTH_TRUSTED_STORE_WRITER_1_TASK_2026-10-01.md`
2. `docs/OFFICIAL_TRUTH_TRUSTED_STORE_WRITER_1_REPORT_2026-10-01.md`
3. `docs/OFFICIAL_TRUTH_TRUSTED_STORE_WRITER_1_SELF_REVIEW_2026-10-01.md`
4. ADR-0220 and the 1 October 2026 writer Nachtrag on ADR-0219 in `DECISIONS.md`
5. `docs/OFFICIAL_TRUTH_SOURCE_EVIDENCE_ARCHITECTURE_2026-10-01.md` section 14

Live `main` at the start of this slice is the baseline above. Older continuity text that still names Draft #671 or `63af11cda231b26ada4717d29b78fc7f9ab4d828` as current is historical. Re-fetch before treating any later SHA as current.

## Session facts

- Machine mode: `NORMAL`. `.jetnity/operating-mode.json` was not edited.
- `git fetch origin main` before the final push must still show merge-base `7c3dc2835622355d3dd8f5fb9efa4b3e63899b9e` and 0 behind. If that is no longer true, stop and report drift. Do not rebase this writer onto a newer main inside this slice unless the Technical Lead assigns that.
- Local proof: throwaway PostgreSQL 16.15, dropped after the test. Development is PostgreSQL 17.6 in the task and was not queried. Production was not contacted.
- Corrected-tip local validation, recorded before the push of this correction:
  - focused writer test: 7 pass / 0 fail, including throwaway PostgreSQL 16.15 and the `candidate` / `pending` rejection with unchanged counts
  - schema-reference tests: 4 pass / 0 fail; the allowlist is exactly the two reviewed local RPCs
  - `npm test`: 4178 pass / 0 fail
  - `npm run typecheck`: pass
  - `npm run lint`: 0 errors, 148 warnings. None are in the R1 files
  - `npm run build`: pass. Next.js 16.3.8. 25 static pages
  - operating-mode guard PASS, dead-code 0, unused exports 0, unused packages 0, API protection PASS, `git diff --check` pass
  - `check:schema-bezug` on `0f4490ab` printed LOCAL/UNAPPLIED for `admin_account_counts_v1` and for `official_truth_store_accepted_v1` from `lib/readiness/official-truth-store-server.ts` to the original CLI path `supabase/migrations/20261001171111_official_truth_trusted_store_writer_1.sql`. After R3 the same registration points at `supabase/migrations/20261001180549_official_truth_trusted_store_writer_1.sql`.
- The same command totals on `7eff82b7` are the reviewed head. They are historical. A silent miss of the store RPC was the R1-F1 defect.
- R3 identity correction, recorded before the push of the rename: SHA-256 before and after `git mv` is `8b9a47f42ac9d2fcef62775a8a824c2e79abc86f583ebeea5a5ece56f7a93df4`. Focused writer test 7/7. Schema-reference tests 4/4. `npm test` 4178/4178. Typecheck pass. Lint 0 errors and 148 warnings. Build pass on Next.js 16.3.8 with 25 static pages. Hygiene PASS. `check:schema-bezug` prints LOCAL/UNAPPLIED for `official_truth_store_accepted_v1` pointing at `supabase/migrations/20261001180549_official_truth_trusted_store_writer_1.sql`.
- `db:rechte`, `db:rls`, `db:sicherheit` and `auth:pruefen` were not run locally. They talk to live Development. GitHub CI still runs `auth:pruefen`. That is not an apply of this migration.
- Exact-head GitHub CI, Auth and Vercel Preview belong to the pushed tip. This file does not embed a run id, because writing one after the run would create a newer head. Read the checks on the tip SHA. Do not treat a parent SHA or `main` as this head's gate.

Command results recorded for the tip are in the delivery summary that accompanies the push. Do not copy a green parent run forward.

## Writer boundary

- Evidence: `evidenceKandidatAkzeptieren`, then `regelScopeAusEvidenceScope`. An already accepted object returns `not_candidate` and does not call the RPC.
- Rule Claim: `regelKandidatAkzeptieren` only. Persist `claim.key`, `claim.supportVersionIds` and `claim.fact`. Do not persist `proposal`.
- Citizenship stays the full supplied set. Issuing country is not copied into citizenship. One credential option is stored as given. Unknown stays unknown.
- Exact duplicate: idempotent no-op. Conflict: fail closed. No update.
- `accepted_evidence` persists only `lifecycle = accepted` and `validation_state = valid`. Anything else raises `22023` before a duplicate check or an insert. Do not add support-count or rule-scope truth to SQL.
- Support and action source class come from stored rows.
- The fact-payload trigger remains. This function sets the nine existing constraint triggers immediate before return. Do not add a second `SECURITY DEFINER` and do not disable the trigger.
- No direct grant on `private.official_*`.
- Do not import Candidate Evidence or CH research. Do not seed a real source catalog. Do not call `requirementsProviderAus()` into activity. Do not apply, repair, reset, or push this migration. Development already has it once as `20261001180549`.

## Stop

Stay Draft.

Cursor does not Ready, merge, apply this migration, write Development data, touch Production, start a source-catalog slice, start a Candidate Evidence import, or start a follow-up slice.

**STOP for independent Technical-Lead exact-head review.**

Development apply, if it is accepted, is Technical-Lead work after exact-head PASS. Production remains a Product-Owner gate.
