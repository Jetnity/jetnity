# Official Truth Rule Acceptance Trust Boundary Architecture 1 — Report

Date: 2 October 2026
Issue: #729
Draft PR: #731
Branch: `docs/official-truth-rule-acceptance-trust-boundary-1`
Baseline: `main@5e291ed7c4814f034224eda46c3bd62cc9815ea3`

Logical agent: **Jetnity Official Truth Rule acceptance trust boundary architecture 1**, Generation 1
Session: https://cursor.com/agents/bc-3c2a0ed3-71de-4424-a8a5-f0570830c839
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This report is the author record. A Technical-Lead PASS requires an independent exact-head review. This report is not Ready and not a merge.

## R1 correction

Technical-Lead R1 `5390891105` on `864d958ddf16aedff485b810468b6006bccd2dfa` is `CHANGES REQUIRED`. That head is not the review head.

R1-F1: the permanent invariant is that model or plugin output alone never becomes `trustedRuleFact` or Official Truth. Human/operator review is the only authorized current V1 acceptance path. A separately versioned deterministic, non-model, fail-closed policy may later be designed for narrowly provable cases. This slice does not design, imply or authorize that policy.

R1-F2: architecture section 10 is the current V1 human/operator implementation sequence. It is not a permanent ban on every later non-model authority mechanism. No capability is selected. No automated acceptance slice starts.

The first-delivery sentences below that described human review as the only future entry remain historical for `864d958d`. The architecture file on the R1 correction is the binding wording. R2 did not change it.

## R2 integration

Technical-Lead R2 `5391464128` accepted the architecture on exact head `8a5f8cf1cc9252778d6fd5e710e41043fc66971e`. No behavior or architecture correction was requested.

`git fetch origin main` resolved `origin/main` to `906fb4a5714f8c1836d1894acc6332084f7f6280`, `Merge #730: validate non-authoritative Official Truth review suggestions`. Merge commit `084d900d98008d14a2bcab704f5c662df2bfe2f1` is 0 behind that SHA.

#730 is **MERGED / ADVISORY**. `officialTruthRegelReviewVorschlag` in `lib/readiness/official-truth-review-suggestion.ts` re-proves one #723 packet and one #726 key, then accepts only `assessment`, `citedSupportVersionIds` and `reasonCodes`. The assessments are `supports_candidate`, `contradicts_candidate`, `insufficient_evidence` and `needs_human_review`. The result status is `review_suggestion` or `blocked`. It does not emit `trustedRuleFact` and it does not call `regelKandidatAkzeptieren`. This branch does not modify that file or its test. `git diff origin/main` for `lib/`, `app/`, `components/`, `supabase/`, `types/` and `hooks/` is empty.

The #730 delivery handoff still says that writer was a Draft. That sentence was true when #730 was written. The merge SHA above is the current fact. This integration does not rewrite those #730 files.

## Result

The binding architecture is `docs/OFFICIAL_TRUTH_RULE_ACCEPTANCE_TRUST_BOUNDARY_1_ARCHITECTURE_2026-10-02.md`.

On the current V1 path it places a server-verified human boundary in front of `regelKandidatAkzeptieren`. Model and plugin output alone may suggest, extract, compare or flag review material. That output cannot become `trustedRuleFact` or Official Truth. A caller field such as `reviewerKind: human` is not authority.

The architecture defines:

1. Every decision binds to one exact #726 `reviewPacketKey`. The server re-runs `officialTruthRegelReviewPacketFingerprint` on the original `{ supports, metadata }` input. A missing or different key invalidates the decision.
2. Reviewer identity, role, capability and AAL come from the existing server guard: `auth.getUser()`, `profiles.role`, `decideAdminAccess`, and `currentLevel === 'aal2'`. Break-glass does not reach the database and cannot open fact entry.
3. Decision states are `needs_more_evidence`, `reject_candidate` and `proceed_to_trusted_fact_entry`. On the current V1 path only the separate human fact-entry step may supply `trustedRuleFact`.
4. The human sees the re-proven candidate and the official support snapshots. The proposal is not copied into the trusted fact. Explicit and composed primary quality remain the only acceptable qualities. `research_gap`, `stale_primary_evidence` and `unresolved_conflict` cannot become accepted truth.
5. Acceptance re-proves the #723 packet, the #726 key, accepted Evidence and the registry, then calls only `regelKandidatAkzeptieren`.
6. Minimal later audit fields are `reviewPacketKey`, `ruleScopeKey`, `factKind`, the server-derived reviewer uid, the server-derived timestamp and the decision type. Retention is not chosen. Passport, MRZ, scan, biometric and health data are excluded.
7. #728 suggestions are advisory. #730 is merged and its suggestion contract stays advisory. The OpenAI Developers plugin note does not authorize a key, a secret, a paid call or a live call.
8. The current V1 implementation order is the human/operator path: the pure decision contract, then an authenticated review endpoint, then the privileged authorization check, then fact-entry validation, then `regelKandidatAkzeptieren`, then the existing dormant store writer, with audit/retention designed separately. That order is not a permanent ban on a later deterministic non-model policy.
9. Special gates are classified in the architecture. Pure contracts are not those gates. A new or remapped capability, persistent audit storage, Production activation of the store writer, and any model call with secret or cost are.

No capability is selected. `konfiguration-verwalten` is not silently reused. Adding a capability is recorded as a later Product-Owner gate.

## What this slice did not change

- No runtime file, API route, Auth module, RLS policy, migration or store call.
- No call to `regelKandidatAkzeptieren` and no `trustedRuleFact` generator.
- No edit to `rule-claims.ts`, the #723 packet, the #726 fingerprint, `evidence.ts`, the source registry or `official-truth-store-server.ts`.
- No model call, provider call, secret, Production apply or indexing change.
- `requirementsProviderAus()` stays `null`.
- `docs/ACTIVE_WORK_STATUS.md`, `JETNITY_HANDOFF.md`, `JETNITY_START_HERE.md`, `DECISIONS.md`, `ARCHITECTURE.md` and `ROADMAP.md` were not edited. The task forbids global continuity edits. This report, the handoff and the architecture are the continuity for the slice.

## Traveller context

One decision is one review packet and one regulatory cell. The cell keeps the full citizenship set on the re-proven candidate. A second document or citizenship relation is a second key. The issuing country is not citizenship. A rejection does not become `not_required` for another option. No legal rule is invented.

## #626 and #730

#626 stays **OPEN / BLOCKED**. Latest comment read in this session: `5908548520`. Temporary operator permission is not established. This architecture does not use that blocked path and does not adopt the Development security-event retention numbers.

Issue #728 defined the advisory suggestion assessments. PR #730 implemented that contract and is merged at `906fb4a5714f8c1836d1894acc6332084f7f6280`. The merged function remains a suggestion validator. It is not approval and not acceptance.

## Validation

The table below is the first delivery, run on `22b1f7a63b858e98bc794d9c18ebe6ba1ee61cc0` before R1. R1 changes wording. R1 gates are recorded in the following section after they run on the R1 tree. `git fetch origin main` during R1 resolved `origin/main` to `5e291ed7c4814f034224eda46c3bd62cc9815ea3`. The branch was 0 behind. Re-fetch before treating any later SHA as current.

This VM did not have PostgreSQL 16 when the session started. PostgreSQL 16.15 was installed from Ubuntu packages so the existing throwaway store proofs could run. Package setup initialized a local cluster. `policy-rc.d` denied starting it. The suite then created its own temporary clusters through `/usr/lib/postgresql/16/bin/initdb`. No remote database was contacted. This slice did not add or apply SQL. Development and Production were not touched.

| Check | Result |
| --- | --- |
| `git diff --check` | pass |
| operating-mode guard | PASS |
| `npm test` | 4381 pass / 0 fail, 756 suites |
| `npm run typecheck` | pass |
| `npm run lint` | pass, 0 errors, 148 pre-existing warnings, none in the new docs |
| `npm run build` | pass |
| `check:dead` | 0 orphans |
| `check:exports` | 0 unused exports |
| `check:deps` | pass |
| `check:api-schutz` | pass, 12 admin routes use `requireAdminApi()` |
| `check:schema-bezug` | pass. It still lists the already known LOCAL/UNAPPLIED RPCs `admin_account_counts_v1`, `official_truth_source_catalog_v1` and `official_truth_store_accepted_v1`. This slice did not add an RPC. |

`auth:pruefen` was not run locally because it needs repository secrets. This slice does not change Auth.

## R1 validation

R1 gates below were run on `db33cfbe6f5a0656e7d2df4df9b3535b6f7b2e9a`. That SHA is the wording correction. This gate-record commit does not change the architecture again. `git fetch origin main` before the R1 commit resolved `origin/main` to `5e291ed7c4814f034224eda46c3bd62cc9815ea3`. The branch was 0 behind and 3 ahead. Re-fetch before the final push.

No new SQL. No remote database. PostgreSQL 16.15 was already installed from the first delivery. The package cluster stays unstarted.

| Check | Result |
| --- | --- |
| `git diff --check` | pass |
| operating-mode guard | PASS |
| `npm test` | 4381 pass / 0 fail, 756 suites |
| `npm run typecheck` | pass |
| `npm run lint` | pass, 0 errors, 148 pre-existing warnings, none in these docs |
| `npm run build` | pass |
| `check:dead` | 0 orphans |
| `check:exports` | 0 unused exports |
| `check:deps` | pass |
| `check:api-schutz` | pass, 12 admin routes use `requireAdminApi()` |
| `check:schema-bezug` | pass. The same three LOCAL/UNAPPLIED RPCs remain. This slice added none. |

## R2 re-gate

Local gates below were run on `52f38f51937fa4c58650d9e30495e955db086755`. That SHA records the #730 integration. This gate-record commit does not change the architecture or the #730 runtime. `git fetch origin main` before the integration resolved `origin/main` to `906fb4a5714f8c1836d1894acc6332084f7f6280`. The branch was 0 behind. Re-fetch before the final push.

No new SQL from this slice. No remote database. PostgreSQL 16.15 stayed local. The package cluster stays unstarted.

| Check | Result |
| --- | --- |
| `git diff --check` | pass |
| operating-mode guard | PASS |
| `npm test` | 4391 pass / 0 fail, 757 suites |
| `npm run typecheck` | pass |
| `npm run lint` | pass, 0 errors, 148 pre-existing warnings, none in these docs or the untouched #730 suggestion files |
| `npm run build` | pass |
| `check:dead` | 0 orphans |
| `check:exports` | 0 unused exports |
| `check:deps` | pass |
| `check:api-schutz` | pass, 12 admin routes use `requireAdminApi()` |
| `check:schema-bezug` | pass. The same three LOCAL/UNAPPLIED RPCs remain. This slice added none. |

Exact-head GitHub CI, the Auth job and Vercel Preview belong to the pushed tip. They are read after that push and are not copied from `906fb4a` or from `52f38f51`.

## Stop

No Ready. No merge. No implementation follow-up. No acceptance endpoint, no Auth change, no store apply, no capability selection and no model call.

**STOP for final Technical-Lead review of the exact branch tip.**
