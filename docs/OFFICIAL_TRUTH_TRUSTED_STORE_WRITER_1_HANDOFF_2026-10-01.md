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

The repository contains a dormant accepted-store writer. It is not applied to Development or Production. There is no Technical-Lead PASS.

Migration file, created by Supabase CLI `2.48.3` through `supabase migration new official_truth_trusted_store_writer_1`:

`supabase/migrations/20261001171111_official_truth_trusted_store_writer_1.sql`

The timestamp was not typed by hand. The CLI warned that `2.119.0` exists. The file was not recreated with a newer CLI. The CLI was not used to push, repair, reset or apply a remote migration. It wrote gitignored `supabase/.temp/cli-latest`. That file was removed and is not part of the commit.

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
- Focused writer test: 7 pass / 0 fail, including the throwaway cluster.
- `npm test`: 4178 pass / 0 fail.
- `npm run typecheck`: pass.
- `npm run lint`: 0 errors, 148 warnings. None are in the new writer files.
- `npm run build`: pass. Next.js 16.3.8. 25 static pages.
- Hygiene before the push: operating-mode guard PASS, dead-code 0, unused exports 0, unused packages 0, API protection PASS, schema reference PASS with the pre-existing LOCAL/UNAPPLIED RPC `admin_account_counts_v1`. `git diff --check` pass.
- `db:rechte`, `db:rls`, `db:sicherheit` and `auth:pruefen` were not run locally. They talk to live Development. GitHub CI still runs `auth:pruefen`. That is not an apply of this migration.
- Exact-head GitHub CI, Auth and Vercel Preview belong to the pushed tip. This file does not embed a run id, because writing one after the run would create a newer head. Read the checks on the tip SHA. Do not treat a parent SHA or `main` as this head's gate.

Command results recorded for the tip are in the delivery summary that accompanies the push. Do not copy a green parent run forward.

## Writer boundary

- Evidence: `evidenceKandidatAkzeptieren`, then `regelScopeAusEvidenceScope`. An already accepted object returns `not_candidate` and does not call the RPC.
- Rule Claim: `regelKandidatAkzeptieren` only. Persist `claim.key`, `claim.supportVersionIds` and `claim.fact`. Do not persist `proposal`.
- Citizenship stays the full supplied set. Issuing country is not copied into citizenship. One credential option is stored as given. Unknown stays unknown.
- Exact duplicate: idempotent no-op. Conflict: fail closed. No update.
- Support and action source class come from stored rows.
- The fact-payload trigger remains. This function sets the nine existing constraint triggers immediate before return. Do not add a second `SECURITY DEFINER` and do not disable the trigger.
- No direct grant on `private.official_*`.
- Do not import Candidate Evidence or CH research. Do not seed a real source catalog. Do not call `requirementsProviderAus()` into activity. Do not apply this migration remotely from Cursor.

## Stop

Stay Draft.

Cursor does not Ready, merge, apply this migration, write Development data, touch Production, start a source-catalog slice, start a Candidate Evidence import, or start a follow-up slice.

**STOP for independent Technical-Lead exact-head review.**

Development apply, if it is accepted, is Technical-Lead work after exact-head PASS. Production remains a Product-Owner gate.
