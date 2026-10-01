# Official Truth Accepted Rule Claim Persistence Schema 1 — Handoff

Date: 1 October 2026
Issue: #678
Draft PR: #679
Branch: `feat/official-truth-rule-claim-persistence-schema-1`
Baseline: `main@f4ed316714687ca597c59ce47bfb69f5a290440b`

Logical agent: **Jetnity Official Truth accepted Rule Claim persistence schema 1**, Generation 1
Session: https://cursor.com/agents/bc-2a2f9c56-970f-4445-a26b-191272ae7dd4
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

## Current state

Repository schema is written. It is not applied to Development. It is not applied to Production. There is no Technical-Lead PASS, no Ready and no merge.

Migration file:

`supabase/migrations/20261001140356_official_truth_accepted_rule_claim_persistence_schema_1.sql`

The timestamp came from Supabase CLI `2.48.3` via `supabase migration new official_truth_accepted_rule_claim_persistence_schema_1`. It was not typed by hand. The CLI warned that `2.119.0` exists. The file was not recreated with a newer CLI.

Read first:

1. `docs/OFFICIAL_TRUTH_RULE_CLAIM_PERSISTENCE_SCHEMA_1_TASK_2026-10-01.md`
2. `docs/OFFICIAL_TRUTH_RULE_CLAIM_PERSISTENCE_SCHEMA_1_REPORT_2026-10-01.md`
3. `docs/OFFICIAL_TRUTH_SOURCE_EVIDENCE_ARCHITECTURE_2026-10-01.md` section 12
4. ADR-0219 in `DECISIONS.md`

`docs/ACTIVE_WORK_STATUS.md` was not updated. It is outside the task allowlist. This handoff is the continuity pointer for the slice.

## Session facts

- Machine mode: `NORMAL`
- `git fetch origin main` in this session: `f4ed316714687ca597c59ce47bfb69f5a290440b`
- Merge-base was that SHA. The branch was 0 behind and 1 ahead before this delivery. The ahead commit is the task seed `92e7bdac36ca96cc7af293eaaf65f1ee4c6ba784`.
- Open drafts besides #679 are historical #52, #50, #40, #39 and #28. They are not current writers.
- Issue #678 is OPEN.
- The Supabase CLI was not on PATH. The official `2.48.3` binary was used only to create the empty migration file. It was not used to push, repair, reset or apply a remote migration. Gitignored `supabase/.temp/cli-latest` was removed after the CLI wrote it.
- Local proof used throwaway PostgreSQL 16.15 and was dropped. Development and Production were not contacted. Development is stated as PostgreSQL 17.6 by the task and was not re-queried.
- Static schema test: **9/9 pass**.
- `npm test`: **4168 pass / 0 fail**.
- `npm run typecheck`: pass.
- `npm run lint`: 0 errors, 148 pre-existing warnings. None are in the new schema test.
- Hygiene: operating-mode guard PASS, API protection PASS, schema reference PASS with the pre-existing LOCAL/UNAPPLIED RPC `admin_account_counts_v1`, dead-code 0, unused exports 0, unused packages 0, `git diff --check` pass.
- `npm run check:setup:ci`: pass, with the existing missing-`.env` warning.
- `npm run build`: pass. Next.js 16.3.8. 25 static pages.
- `db:rechte`, `db:rls`, `db:sicherheit` and `auth:pruefen` were not run locally. They talk to live Development. GitHub CI still runs `auth:pruefen`. That is not an apply of this migration.
- Exact-head GitHub CI, Auth and Vercel Preview belong to the pushed tip. This file does not embed a run id, because writing one after the run would create a newer head. Read the checks on the tip SHA. Do not treat a parent SHA or `main` as this head's gate.

## Writer boundary the next slice must keep

The later trusted writer calls `regelKandidatAkzeptieren()` and persists only the returned `AkzeptierteRegelClaim`. It derives `rule_scope_key` in TypeScript. It writes the matching fact rows and the support rows. SQL will reject a licensed provider, a candidate evidence version, a bad duration, and a wrong fact kind. SQL will not reject an empty support list, a missing fact row, or a key that does not match the typed columns.

Airport cardinality 1..16 is enforced in SQL and is not currently enforced by `flughaefenLesen`. Do not edit the TypeScript contract inside this slice. The writer must respect the database bound until a later slice aligns the reader.

## Stop

Stay Draft.

Cursor does not Ready, merge, apply this migration to Development or Production, call OpenAI or the web, activate a provider, contact Sherpa/IATA/KAYAK, continue #626, change indexing or launch, or start a follow-up slice.

**STOP for independent Technical-Lead exact-head review.**

After PASS, the Technical Lead may apply this exact migration to Development only and run readback and advisors. Production remains a Product-Owner gate. A second remote apply is not allowed. Cursor does not perform that apply.
