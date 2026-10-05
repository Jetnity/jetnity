# Official Truth Refresh Source Identity Binding 1 — Self-Review

Date: 2 October 2026
Issue: #756
Draft PR: #757
Branch: `fix/official-truth-refresh-source-identity-1`

This is the author self-review. It is not an independent Technical-Lead PASS. Cursor does not Ready and does not merge.

## Scope check

Changed paths:

- `docs/OFFICIAL_TRUTH_REFRESH_SOURCE_IDENTITY_BINDING_1_TASK_2026-10-02.md` (task seed, not rewritten by the implementation)
- `lib/readiness/official-truth-refresh-diff.ts`
- `lib/readiness/official-truth-refresh-diff.test.ts`
- `docs/OFFICIAL_TRUTH_REFRESH_SOURCE_IDENTITY_BINDING_1_REPORT_2026-10-02.md`
- `docs/OFFICIAL_TRUTH_REFRESH_SOURCE_IDENTITY_BINDING_1_HANDOFF_2026-10-02.md`
- `docs/OFFICIAL_TRUTH_REFRESH_SOURCE_IDENTITY_BINDING_1_SELF_REVIEW_2026-10-02.md`

`lib/readiness/source-registry.ts` is unchanged. `lib/readiness/official-truth-server-held-source-registry.ts` is unchanged. `lib/readiness/provider.ts` has no diff against `origin/main`. No file under `app/`, `supabase/`, or `.jetnity/` changed. `docs/ACTIVE_WORK_STATUS.md` and the #754 Guardian current-state files match `origin/main` and were not edited by this slice. No migration was added.

The refresh runtime and tests are byte-identical to `aaa297bfa83caeb1ef07057b0d73ccdf358ff219`. The integration commit is `0cb661586700e332313e7de6be4167276c9a985e`, which merges `main@7df2c9dc7c6679db74bb1476bc07366737f2c2b3`.

## Contract

- Content comparison is reached only after the same source id, the same rule-scope key, the same receipt `canonicalUrl`, and the same module-local registry identity.
- `different_official_page` and `different_source_registry` are distinct from `different_official_source` and `different_rule_scope`.
- The page check uses the canonical URL already produced by the existing retrieval proof. This file does not import `source-registry.ts` and does not call `quellenUrlAufloesen` or `quellenRegistryErstellen`.
- Registry identity reads `sources` and `blockedDomains` only. Each source must have exactly `sourceId`, `sourceClass`, `publisherName`, `authorityName`, and `domains`. The comparison keeps the stored order. It does not sort again and it does not compare object identity.
- Registries built independently from the same canonical inputs compare equal because the existing builder already sorts source ids, domains, and blocked domains.
- A changed publisher, authority, other-source class, domain set, blocked-domain set, or source-id set blocks `different_source_registry` when the refreshed envelope is still valid.
- A selected-source class change, a domain that no longer covers the URL, a blocked page domain, and a stale descriptor keep the earlier closed reason.
- Same hash and changed hash both fail closed on a page or registry mismatch. `ruleChange` on success stays `not_asserted`.
- One credential option stays one cell. `requirementsProviderAus()` is null.
- No provider, model, network, or storage path was added.

## Gates

First run on `aaa297bfa83caeb1ef07057b0d73ccdf358ff219`, then the same commands again on the integrated tree `0cb661586700e332313e7de6be4167276c9a985e` before this note:

- focused refresh tests 16/16
- `npm test` 4429 / 4429, 760 suites
- typecheck pass
- lint 0 errors, 148 pre-existing warnings
- production build pass, Next.js 16.3.8, 25 static pages
- `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`, `check:operating-mode` pass
- `git diff --check` pass
- schema reference still lists the same three LOCAL/UNAPPLIED RPCs
- no remote Supabase access

Local PostgreSQL 16.15 was installed so the existing throwaway catalog and store proofs inside `npm test` could start `initdb`. That install is not a database apply. Development and Production were not used.

## Disclosed limits

The comparator does not re-sort. A hand-reordered source list, domain list, or blocked-domain list is `different_source_registry` even when the set of values is the same. Fresh builder output is already sorted, so two independent builds compare equal. An extra registry field is also `different_source_registry`, not a third reason.

This closes F3 only inside the pure refresh function. It does not close F1 again, and it does not wire the #755 server-held registry into a live refresh. F2, F4, F5, F6, F7, F8, and F9 remain open. No route calls this function. `unchanged_source_content` is still not Rule truth.

## Not claimed

No Ready. No merge. No Development apply. No Production mutation. No provider activation. No follow-up slice. This self-review is not an independent Technical-Lead PASS.
