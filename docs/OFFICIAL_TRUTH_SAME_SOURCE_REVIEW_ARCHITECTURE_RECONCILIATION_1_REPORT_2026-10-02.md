# Official Truth Same-Source Review Architecture Reconciliation 1 — Report

Date: 2 October 2026
Issue: #737
Draft PR: #738
Branch: `docs/official-truth-same-source-review-architecture-reconciliation-1`
Baseline: `main@f970669b084b288c3adbc85333ab6f12ce0589d1`

Logical agent: **Jetnity Official Truth same-source review architecture reconciliation 1**, Generation 1
Session: https://cursor.com/agents/bc-67d4fd67-f2fc-478b-93d3-27b1da95f2e1
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This report is the author record. A Technical-Lead PASS requires an independent exact-head review. This report is not Ready and not a merge.

## Result

The binding #731 architecture no longer treats a same-source composed input as a successful Rule Review Packet.

`docs/OFFICIAL_TRUTH_RULE_ACCEPTANCE_TRUST_BOUNDARY_1_ARCHITECTURE_2026-10-02.md` now says:

- `composed_from_multiple_primary_sources` means multiple distinct official sources before a Rule Candidate is emitted;
- #717 `officialTruthRegelKandidatAusEvidence` rejects fewer than two distinct official `sourceId` values with `{ ok: false, reason: 'same_source_composition' }` and returns no candidate;
- #723 therefore has no `rule_review_packet`, and #726 has no review key, for that input;
- no decision intent exists for that rejected input;
- `needs_more_evidence` and `reject_candidate` apply only to an input that successfully became a Rule Review Packet;
- after `same_source_composition`, more evidence has to come from the upstream research and evidence path as an eligible distinct official source, or as another valid candidate quality;
- the review layer must not relabel that invalid composition as valid review material;
- the #734 local source-count check on `proceed_to_trusted_fact_entry` is defense in depth, currently unreachable through a successful #723 packet, and not a new candidate path;
- `regelKandidatAkzeptieren` remains the only canonical acceptance function;
- this reconciliation changes no runtime behavior.

The original #731 section 5 sentence is quoted in a dated reconciliation note and marked superseded. The #731 task, report and handoff are unchanged.

The three decision states remain for a packet that #723 actually returns. `research_gap`, `stale_primary_evidence` and `unresolved_conflict` remain eligible for `needs_more_evidence` or `reject_candidate`, and they still cannot take `proceed_to_trusted_fact_entry`. Composed quality on a real packet still needs at least two supports and at least two distinct official `sourceId` values before fact entry. Human/operator V1 authority, AAL2, capability non-selection, packet-key re-proof, trusted-fact separation and the future deterministic-non-model rule are unchanged.

## What this slice did not change

- No `lib/`, `app/`, `components/`, `types/`, `hooks/` or `supabase/` file.
- No test file. #717, #723, #726 and #734 runtime stay as accepted on `main`.
- No edit to the #731 task, report or handoff.
- No edit to #734 task, report, handoff, self-review or runtime.
- No Auth, AAL, role, capability, RLS, migration, Supabase, provider, model, network, secret, cost, Production, indexing or launch change.
- No touch of #626.
- No authenticated endpoint and no call to `regelKandidatAkzeptieren`.
- `docs/ACTIVE_WORK_STATUS.md`, `JETNITY_START_HERE.md`, `JETNITY_HANDOFF.md`, `DECISIONS.md`, `ARCHITECTURE.md` and `ROADMAP.md` were not edited. The task forbids global current-state files.
- The binding task file was not edited.
- `requirementsProviderAus()` stays `null`.

## Traveller context

One decision still binds one `reviewPacketKey` and one regulatory cell. A second citizenship relation or a second travel document remains another packet. This correction does not collect credentials and does not invent a visa, transit, health, carrier, eligibility or document rule. A same-source rejection is not `not_required` and does not decide another credential option.

## #626

#626 stays **OPEN / BLOCKED**. This slice does not read or write that producer, does not adopt its retention numbers, and does not retry the blocked role operation.

## Validation

`git fetch origin main` before the architecture commit and again before this report resolved `origin/main` to `f970669b084b288c3adbc85333ab6f12ce0589d1`. The branch was 0 behind. Re-fetch before treating a later SHA as current.

Heavy gates below were run on `431214ab8be17d3c233c9818eeec2b130c044d0c`. This docs commit does not change runtime behaviour. GitHub exact-head CI, the Auth job and Vercel Preview belong to the pushed tip after this commit. Do not reuse a run id from `431214ab`.

PostgreSQL 16.15 was installed from Ubuntu packages so the existing throwaway store proofs could run. The binary is `/usr/lib/postgresql/16/bin/postgres`. Package setup initialized a local cluster. `policy-rc.d` denied starting it. The suite created its own temporary clusters. No remote database was contacted. This slice added no SQL and did not apply a migration. Development and Production were not touched.

| Check | Result |
| --- | --- |
| `git diff --check` | pass, including this docs tree before the docs commit |
| operating-mode guard | PASS |
| `npm test` | 4403 pass / 0 fail, 758 suites, on `431214ab` |
| `npm run typecheck` | pass |
| `npm run lint` | pass, 0 errors, 148 pre-existing warnings, none in the changed docs |
| `npm run build` | pass. Compiled successfully in 12.5s |
| `check:dead` | 0 orphans |
| `check:exports` | 0 unused exports |
| `check:deps` | pass |
| `check:api-schutz` | pass, 12 admin routes use `requireAdminApi()` |
| `check:schema-bezug` | pass. The same three LOCAL/UNAPPLIED RPCs remain: `admin_account_counts_v1`, `official_truth_source_catalog_v1`, `official_truth_store_accepted_v1`. This slice added none. |

`auth:pruefen` was not run locally because it needs repository secrets. This slice does not change Auth. Exact-head GitHub CI, the Auth job, and Vercel Preview belong to the pushed tip. They are not certified here.

## Continuity gap for the next reader

Global current-state files still describe the post-#734 writer. They do not yet point at this reconciliation, because this allowlist forbids them. After an independent Technical-Lead merge, a later continuity edit can point those files at the corrected architecture. This writer does not start that slice.
