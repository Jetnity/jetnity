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

The first-delivery sentences below that described human review as the only future entry remain historical for `864d958d`. The architecture file on this correction is the binding wording.

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
7. #728 suggestions, and any #730-style suggestion implementation, stay advisory. The OpenAI Developers plugin note does not authorize a key, a secret, a paid call or a live call.
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

## #626 and #728

#626 stays **OPEN / BLOCKED**. Latest comment read in this session: `5908548520`. Temporary operator permission is not established. This architecture does not use that blocked path and does not adopt the Development security-event retention numbers.

Issue #728 defines the advisory suggestion assessments. This slice does not implement that contract and does not treat it as approval.

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

R1 gates are not yet recorded. Until this section names a SHA and results, the R1 wording has not claimed a gate pass.

## Exact-head gates

GitHub CI, the Auth job and Vercel Preview for the pushed tip are read after the push. They are not copied from baseline `5e291ed7`.

## Stop

No Ready. No merge. No implementation follow-up. No acceptance endpoint, no Auth change, no store apply and no model call.

**STOP for Technical-Lead R2 of the exact branch tip.**
