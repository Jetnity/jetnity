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

Identity reconciliation on 1 October 2026 supersedes the delivery-time apply sentence below.

- Original local CLI filename/version: `20261001140356_official_truth_accepted_rule_claim_persistence_schema_1.sql`. That timestamp came from Supabase CLI `2.48.3` via `supabase migration new`. It was not typed by hand.
- Canonical reconciled repository file and Development migration-history version: `20261001151048_official_truth_accepted_rule_claim_persistence_schema_1`. That version was not invented by hand. Supabase recorded it when the Technical Lead applied the accepted SQL once.
- `git mv` changed only the filename. SHA-256 before and after is `d5a5d759c98c6b2875baedbd6c90e4752b9bca1e5d852d1d1dd734d413b807bf`.
- This reconciliation did not apply, repair, rebase, reset or re-apply the migration. Production was not touched. A second remote apply is not allowed.
- Issue #680. Draft PR #681. No Ready, no merge, no Technical-Lead PASS for the identity slice.

Delivery-time state, true when this handoff was first written for #679: the repository schema was not yet applied to Development or Production, and there was no Technical-Lead PASS. #679 later merged at `main@0fa5f7f0255ade1d7a9e9307cd275019ac9e8506`.

Migration file:

`supabase/migrations/20261001151048_official_truth_accepted_rule_claim_persistence_schema_1.sql`

The original CLI timestamp was `20261001140356`. The CLI warned that `2.119.0` exists. The file was not recreated with a newer CLI.

Read first:

1. `docs/OFFICIAL_TRUTH_RULE_CLAIM_PERSISTENCE_SCHEMA_1_TASK_2026-10-01.md`
2. `docs/OFFICIAL_TRUTH_RULE_CLAIM_PERSISTENCE_SCHEMA_1_REPORT_2026-10-01.md`
3. `docs/OFFICIAL_TRUTH_SOURCE_EVIDENCE_ARCHITECTURE_2026-10-01.md` section 12
4. ADR-0219 in `DECISIONS.md`

`docs/OFFICIAL_TRUTH_RULE_CLAIM_PERSISTENCE_SCHEMA_1_TASK_2026-10-01.md` is inside the task allowlist. Section 0 is the Technical-Lead R1 override: a present airport list has no finite maximum, and a deferred constraint trigger requires a matching fact payload at commit. The old `1..16` bullet is historical and superseded. Do not restore it.
`docs/ACTIVE_WORK_STATUS.md` was not updated. It is outside the task allowlist. This handoff is the continuity pointer for the slice.

## Session facts — #679 delivery

These facts belong to the schema delivery. They are not the current apply state. The current migration identity is in Current state above.

- Machine mode: `NORMAL`
- `git fetch origin main` in this session: `f4ed316714687ca597c59ce47bfb69f5a290440b`
- Merge-base was that SHA. The branch was 0 behind and 1 ahead before this delivery. The ahead commit is the task seed `92e7bdac36ca96cc7af293eaaf65f1ee4c6ba784`.
- Open drafts besides #679 are historical #52, #50, #40, #39 and #28. They are not current writers.
- Issue #678 is OPEN.
- The Supabase CLI was not on PATH. The official `2.48.3` binary was used only to create the empty migration file. It was not used to push, repair, reset or apply a remote migration. Gitignored `supabase/.temp/cli-latest` was removed after the CLI wrote it.
- Local proof used throwaway PostgreSQL 16.15 and was dropped. Development and Production were not contacted. Development is stated as PostgreSQL 17.6 by the task and was not re-queried.
- Static schema test: **12/12 pass**.
- `npm test`: **4171 pass / 0 fail**.
- `npm run typecheck`: pass.
- `npm run lint`: 0 errors, 148 pre-existing warnings. None are in the new schema test.
- Hygiene: operating-mode guard PASS, API protection PASS, schema reference PASS with the pre-existing LOCAL/UNAPPLIED RPC `admin_account_counts_v1`, dead-code 0, unused exports 0, unused packages 0, `git diff --check` pass.
- `npm run check:setup:ci`: pass, with the existing missing-`.env` warning.
- `npm run build`: pass. Next.js 16.3.8. 25 static pages.
- `db:rechte`, `db:rls`, `db:sicherheit` and `auth:pruefen` were not run locally. They talk to live Development. GitHub CI still runs `auth:pruefen`. That is not an apply of this migration.
- Exact-head GitHub CI, Auth and Vercel Preview belong to the pushed tip. This file does not embed a run id, because writing one after the run would create a newer head. Read the checks on the tip SHA. Do not treat a parent SHA or `main` as this head's gate.

## Writer boundary the next slice must keep

The later trusted writer calls `regelKandidatAkzeptieren()` and persists only the returned `AkzeptierteRegelClaim`. It derives `rule_scope_key` in TypeScript. It writes the matching fact rows and the support rows. SQL will reject a licensed provider, a candidate evidence version, a bad duration, a wrong fact kind, a claim with no matching fact payload, and a non-canonical airport list. SQL will not reject an empty support list or a key that does not match the typed columns.

Airport lists have no finite maximum. A present list must be non-empty, IATA-shaped, sorted and unique. `flughaefenLesen` still canonicalizes a valid list. Persist that canonical list. Do not edit the TypeScript contract inside this slice.

## Stop

Stay Draft.

Cursor does not Ready, merge, apply this migration again, repair remote history, call OpenAI or the web, activate a provider, contact Sherpa/IATA/KAYAK, continue #626, change indexing or launch, or start a follow-up slice. The one Development apply already happened. Production remains untouched.

**STOP for independent Technical-Lead exact-head review of the identity reconciliation.**

The delivery-time sentence that said the Technical Lead may still apply this migration was true before that apply. It is historical. A second remote apply is not allowed. Cursor does not perform another apply. Production remains a Product-Owner gate.
