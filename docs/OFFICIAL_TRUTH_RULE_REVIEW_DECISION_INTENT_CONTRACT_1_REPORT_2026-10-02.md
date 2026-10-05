# Official Truth Rule Review Decision Intent Contract 1 — Report

Date: 2 October 2026
Issue: #733
Draft PR: #734
Branch: `feat/official-truth-rule-review-decision-intent-contract-1`
Baseline: `main@45a4592de638b0cb73f177e255a82dd55bb512ad`

Logical agent: **Jetnity Official Truth Rule review decision intent contract 1**, Generation 1
Session: https://cursor.com/agents/bc-02e0c991-cb8c-4fbe-96b4-3f603671ce7a
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This report is the author record. A Technical-Lead PASS requires an independent exact-head review. This report is not Ready and not a merge.

## Result

`officialTruthRegelReviewEntscheidungsabsicht` in `lib/readiness/official-truth-rule-review-decision-intent.ts` validates one decision intent against one exact Rule Review Packet inside the same call.

The accepted input is exactly:

- `packetInput` — the original `{ supports, metadata }` input of #723;
- `reviewPacketKey` — must equal the key recomputed in this call;
- `decision` — exactly `needs_more_evidence`, `reject_candidate`, or `proceed_to_trusted_fact_entry`.

No other top-level field is accepted. There is no trim, no case folding, and no alias. `accepted`, `approved`, `continue`, booleans, and free text fail as `invalid_decision`.

Every call re-runs #723 `officialTruthRegelReviewPacket` and #726 `officialTruthRegelReviewPacketFingerprint` on that original input. Both must succeed. Their rule-scope key and support version ids must agree. The caller key must be the recomputed #726 key, with no normalization. A missing, malformed, stale, or different key returns `review_packet_key_mismatch` and does not echo the supplied key.

A success result has status `rule_review_decision_intent` and only these fields:

- `reviewPacketKey` — the recomputed #726 key;
- `ruleScopeKey` — the recomputed candidate key;
- `factKind` — `RegelFaktArt` copied from the re-proven candidate;
- `decision` — the exact accepted state.

The result is a decision intent for this invocation only. It is not evidence that a server stored or authorized the decision. It is not a trusted fact, not an accepted Rule Claim, and not a cross-request grant. `proceed_to_trusted_fact_entry` only requests the later fact-entry step.

## Proceed intent

`needs_more_evidence` and `reject_candidate` do not change a candidate lifecycle and do not create a negative official result.

`proceed_to_trusted_fact_entry` is refused unless the re-proven packet quality is `explicit_primary_statement` or `composed_from_multiple_primary_sources`. `research_gap`, `stale_primary_evidence`, and `unresolved_conflict` stay eligible for the other two states and return `quality_not_acceptable` for proceed. A composed packet with fewer than two supports, or with fewer than two source ids, would return `insufficient_support` or `same_source_composition`. This function does not call `regelKandidatAkzeptieren` and does not copy a proposal into a trusted fact. The later acceptance function still has to re-prove the same material.

Live #723 already blocks a composed packet whose supports share one source, before a review packet exists. For that input every decision, including `needs_more_evidence`, returns the packet reason `same_source_composition`. The architecture sentence that such a packet can remain review material is not what the current packet builder does. This slice does not edit #723. The local source-count guard stays so a later successful packet of that shape still cannot open fact entry.

## What this slice did not change

- No call to `regelKandidatAkzeptieren` and no `trustedRuleFact`.
- No `lifecycle: 'accepted'` and no accepted Rule Claim.
- No API route, Server Action, UI, Auth, session, MFA, AAL, role, capability, or RLS change.
- No SQL, migration, Supabase call, store write, or audit row.
- No provider, model, browser, or network call. No `Date.now` and no new clock.
- No edit to #723, #726, #730, `rule-claims.ts`, provider selection, or the accepted store.
- No Production, Vercel, indexing, domain, payment, secret, or cost change.
- No touch of #626 and no route around its blocked privileged operation.
- `docs/ACTIVE_WORK_STATUS.md`, `JETNITY_START_HERE.md`, and `JETNITY_HANDOFF.md` were not edited.
- The binding task file was not edited.
- `requirementsProviderAus()` stays `null`.

The runtime file imports the #723 packet, the #726 fingerprint, and a type-only `RegelFaktArt`. It does not import the suggestion module. A #730 suggestion cannot select or prove the decision.

## Traveller context

One intent binds one recomputed key and therefore one regulatory cell. The cell keeps the citizenship set already inside the re-proven candidate. A second credential option is a second packet and a second key. The Swiss and Serbian passport fixtures keep citizenship `CH` and `RS` and still produce different keys. Reusing the other key fails closed. Combining both supports fails `scope_mismatch`. Issuing country is not treated as citizenship. Pausing or rejecting one option does not decide the other and does not emit `not_required`. No visa, transit, health, carrier, or document rule is invented.

## #626

#626 stays **OPEN / BLOCKED**. This slice does not read or write that producer, does not adopt its retention numbers, and does not retry the blocked role operation.

## Validation

`git fetch origin main` before these gates resolved `origin/main` to `45a4592de638b0cb73f177e255a82dd55bb512ad`. The branch was 0 behind. Re-fetch before treating a later SHA as current.

Gates below were run on `a7667ad8660f1f9fd3da5f3a8c8aeb13e880408c`. This docs commit does not change runtime behaviour.

PostgreSQL 16.15 was installed from Ubuntu packages so the existing throwaway store proofs could run. The binary is `/usr/lib/postgresql/16/bin/postgres`. Package setup initialized a local cluster. `policy-rc.d` denied starting it. The suite created its own temporary clusters. No remote database was contacted. This slice added no SQL and did not apply a migration. Development and Production were not touched.

| Check | Result |
| --- | --- |
| `git diff --check` | pass |
| operating-mode guard | PASS |
| decision-intent tests | 12 pass / 0 fail |
| `npm test` | 4403 pass / 0 fail, 758 suites |
| `npm run typecheck` | pass |
| `npm run lint` | pass, 0 errors, 148 pre-existing warnings, none in the new files |
| `npm run build` | pass. Compiled successfully in 15.4s |
| `check:dead` | 0 orphans |
| `check:exports` | 0 unused exports |
| `check:deps` | pass |
| `check:api-schutz` | pass, 12 admin routes use `requireAdminApi()` |
| `check:schema-bezug` | pass. The same three LOCAL/UNAPPLIED RPCs remain: `admin_account_counts_v1`, `official_truth_source_catalog_v1`, `official_truth_store_accepted_v1`. This slice added none. |

`auth:pruefen` was not run locally because it needs repository secrets. This slice does not change Auth. Exact-head GitHub CI, the Auth job, and Vercel Preview belong to the pushed tip. They are not certified here.
