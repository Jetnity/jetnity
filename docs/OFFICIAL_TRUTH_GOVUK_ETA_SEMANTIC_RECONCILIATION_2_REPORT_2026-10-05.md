# Official Truth GOV.UK ETA Semantic Reconciliation 2 — Report

Date: 5 October 2026
Issue: #838 · Draft PR: #839
Branch: `audit/official-truth-govuk-eta-semantic-reconciliation-2`
Baseline / merge base: `58d2781d4b48cfdc8f9131f374f90d9b96a10787`
Immutable task seed: `60b58d0d54ca9c23ac8d799b0589e16d61904a20`
Logical writer: **Jetnity Official Truth GOV.UK ETA semantic reconciliation 2**, Generation 1
Execution: **Codex Desktop — `gpt-6-astra` / `xhigh`**
Session: `01a10975-f354-71d0-8384-942a51f6f736`

## Result

**`GOVUK_ETA_SEMANTIC_CHAIN_NOT_READY`**

The [audit](OFFICIAL_TRUTH_GOVUK_ETA_SEMANTIC_RECONCILIATION_2_2026-10-05.md) replaces stale #791 reasons with current code evidence. Named predicates, canonical schema-1 parsing and same-authority distinct-content-item composition machinery exist. No real ETA family is selectable: semantic qualification, Appendix identity, CTA activation, ETA policy/extractor, composed acceptance, lossless persistence and context-consumer gaps remain.

The record includes every Swiss-relevant exemption/qualification in the repository's Appendix snapshot, a per-fact provenance/availability matrix, precise negative-assertion limits, proposed Appendix identity fields, the minimum persistence contract, P1/P2 blockers, an ordered bounded sequence and explicit answers to all ten hard questions. It does not refresh or certify current government law.

Two material reconciliations deserve independent scrutiny:

- The prior architecture's `not origin IE` contradicts the audited travel-to-UK-from-elsewhere-in-CTA wording. A reviewed UK-relative mapping is needed. Age 16 is an evidence duty, not an exemption age floor.
- A composed branched input fails acceptance as `condition_provenance_ambiguous` before the store can return `applicability_not_persistable`. The latter still blocks accepted schema-1 facts before transport. Composition execution, acceptance and persistence are three separate boundaries.

## Exact scope

Four new writer-owned documents, all dated 2026-10-05:

- `docs/OFFICIAL_TRUTH_GOVUK_ETA_SEMANTIC_RECONCILIATION_2_2026-10-05.md`
- `docs/OFFICIAL_TRUTH_GOVUK_ETA_SEMANTIC_RECONCILIATION_2_REPORT_2026-10-05.md`
- `docs/OFFICIAL_TRUTH_GOVUK_ETA_SEMANTIC_RECONCILIATION_2_HANDOFF_2026-10-05.md`
- `docs/OFFICIAL_TRUTH_GOVUK_ETA_SEMANTIC_RECONCILIATION_2_SELF_REVIEW_2026-10-05.md`

The PR also contains the pre-existing TASK from the immutable seed. Its Git blob remains `c828bfd4a1736b2684d64e16fb79d0d3318bd596`. No runtime, test, package, migration, machine-mode or central status/architecture document is changed. The allowed-file contract is why continuity lives in these delivery documents instead of `ACTIVE_WORK_STATUS.md`, `DECISIONS.md` or `ROADMAP.md`.

The isolated checkout was created from existing local repository objects and fetched against GitHub; it does not share a working tree with #837. Dependencies were temporarily reused through a local symlink after checking identical package-lock bytes. The symlink is removed before delivery and is not a PR file.

## Model and coordination evidence

The Codex session's `turn_context` at `2026-10-05T00:28:08.822Z` records model `gpt-6-astra`, effort `xhigh`. The user dispatch and #751 name the same requirement. This is session evidence, not an inferred model label. No Cursor session, fallback model or subagent was started.

Parallelism assessment: **SINGLE_AGENT** for this audit. #837 is an independent user-owned writer with its own disjoint task. Its live head at the gate read was `e5ae8e54040c69d38c37e57d740e973982355446`, Draft; its only changed file was `docs/TRIP_WORKSPACE_MANUAL_FLIGHT_ROUTE_COMPLETION_1_TASK_2026-10-05.md`. Its allowed runtime/test/delivery paths do not overlap these four documents. This audit neither borrows its pending implementation nor messages or dispatches that writer.

## Validation on the delivered docs tree

| Check | Result |
| --- | --- |
| Existing applicability, rule-claim, composition-policy, same-request extraction and GOV.UK identity-profile suites | **413 pass, 0 fail**, eight suites |
| Existing store test selected by `Schema 1 wird im Speicher` | **1 pass, 0 fail**; proves schema-1 rejection before client/RPC |
| `npm run check:operating-mode` | PASS, `NORMAL` |
| `npm run check:dead` | PASS, 655 start points, 1,312 reachable modules, zero orphans |
| `npm run check:exports` | PASS, 1,055 files, zero unused exports |
| `npm run check:deps` | PASS, 11 dependencies and two inspected dev dependencies, zero unused |
| `npm run check:api-schutz` | PASS, all 12 admin routes use `requireAdminApi()` |
| `npm run check:schema-bezug` | PASS; repository-only generated-schema comparison |
| `git diff --check` and document-link/file-scope checks | PASS before delivery commit |

Tests used Node 22 with `--import ./scripts/server-only-test-register.mjs --import tsx --test`. The selected store test uses in-process mocks; the full store/SQL suite was not run. No SQL or hosted connection was executed.

The schema check reports the existing LOCAL/UNAPPLIED references `admin_account_counts_v1`, `darf_official_truth_freigeben`, `official_truth_source_catalog_v2`, and `official_truth_store_accepted_v2`. That is its comparison with generated types, not evidence of hosted deployment state. The latest #748 receipt is the authority for the already-completed Development hardening apply.

Full `npm test`, typecheck, lint and production build were not run for this four-document change. Focused existing tests were run as evidence for the audit, not as an implementation change. No runtime/build success is invented. Exact-head CI belongs to the pushed head and must be read separately by the reviewer.

## Live gate and final-head receipt

Re-read main, machine mode, #751, #748, open PRs, #839 metadata/files/reviews/threads and #837 metadata/files before delivery. Main remained the baseline and the seed remained unchanged. #751 still authorizes these two disjoint Codex writers; #748's latest material is `5984004655`, with final hosted-apply closure `5985858310`. No additional material or mode change was found. #839 had no review submissions or inline review threads at the gate read.

Before the writer commit the branch was **one ahead / zero behind** main (task seed only). The delivery consists of that seed plus one four-document audit commit, so the delivered head is **two ahead / zero behind** this baseline. A file cannot name the hash of the commit containing itself. The exact final SHA, fresh remote readback and CI snapshot are placed in the PR delivery body and user delivery response; the reviewer must fetch that tip. The seed is not the review head. No rebase or merge was performed.

## Security, database, cost and remaining risk

Security: no route, authentication, authorization, secret, RLS or service-role change. Global Official Truth stays non-personal; no new context fingerprint or retained legal assertions.

Database: no migration creation, hosted read, apply, registration, Evidence/Rule write or Production operation. Reported hosted state is explicitly attributed to the Technical Lead's existing receipt.

Cost: no new running cost, government/provider/model API call from the application, or provider activation. Only local repository checks and GitHub coordination were used.

Risk: this is a negative readiness verdict from repository snapshots; it is not a fresh legal-source audit, official proof of traveller facts, positive extractor selection or Technical-Lead PASS. No tests were added to imply otherwise.

Next step: independent ChatGPT / Technical-Lead review of the exact delivered head. Keep #839 Draft. No Ready, merge, F8 or follow-up implementation.
