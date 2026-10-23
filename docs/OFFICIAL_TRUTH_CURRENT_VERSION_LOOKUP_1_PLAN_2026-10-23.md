# Official Truth Current-Version Lookup 1 — PLAN

Date: 23 October 2026 (Europe/Zurich)
Issue: #975
Branch: `feat/official-truth-current-version-lookup-1`
Writer: **Jetnity Official Truth Current-Version Lookup 1 — Cursor Generation 1**
Session: https://cursor.com/agents/bc-16e2789c-fc9b-4bbc-925b-ba43273b6cc3
Actual model: `grok-4.7-high-fast` (`originalModelName` from this run). UI title rename verified.

This plan is the task-owned implementation note required before code. TASK V1 blob `d74d6f3e88eec0fe807cc57a71913235dfc572bd`, V2 blob `2e20181849d5575b440fcec004b521e562775751`, and V3 blob `2f304122b59bba6bdb5f0bbb86fba46b139d3add` stay unchanged.

## Interfaces and files

- `scripts/db/official-truth-current-version-lookup-1/lookup.ts` validates the request with the existing pin, scope, fact-kind and requirement-type readers, recomputes `ruleScopeKey` with `regelScopeAusEvidenceScope`, then calls one new SQL function on the caller’s open `READ COMMITTED` transaction. On exactly one remaining candidate it calls the existing `readCandidate`. It has no module-level cache and no fingerprint argument.
- `scripts/db/official-truth-current-version-lookup-1/fixtures.ts` builds one second receipt version of the same cell/fact identity through the existing canonical codecs. The calendar adjustment of the admitted `regulations.example` corpus stays inside the focused test, the same place the custody proof keeps it, so no new non-test module imports the content-identity codec.
- `lib/readiness/official-truth-current-version-lookup-1.test.ts` is the native PostgreSQL 16 proof.
- `supabase/migrations/20261023153726_official_truth_current_version_lookup_1.sql` is the empty file created by Supabase CLI 2.48.3 `migration new`. The timestamp was not typed by hand. The file stays hosted-UNAPPLIED.

SQL entry point: `official_original_api.lookup_current_version(definition_id, definition_version, definition_digest, scope_bytes, fact_kind, requirement_type, sequence, hash)`.

It returns one row: `outcome` (`unique` | `no_match` | `ambiguous` | `refused`), fixed `reason`, fingerprint only for `unique`, match and accepted counts, the recomputed request identity, guarded `read_at`, `production_accepted_read = NOT_AUTHORIZED`, and `positive_visa_cells = 0`.

## Candidate completeness

After request validation, the existing `check_head` takes the lifecycle head `SHARE` lock and checks the supplied external witness. Enumeration stays in that transaction.

The accepted set is every `accepted` event. Before any cell/fact comparison the function proves:

- accepted-event count and review count are within the ceilings below;
- each accepted target occurs once;
- each accepted target has exactly one rule binding, one review with the same fingerprint and review id, and one retained receipt;
- that review's packet key equals the receipt proof packet key, and its ordered supports equal the stored original version id and raw digest in position order, and the same version id on the receipt support; this is metadata, not decryption;
- each rule binding has exactly one accepted event;
- receipt bytes are measured in full, with no `LIMIT`.

A gap uses a count or a `LEFT JOIN` that keeps missing rows visible. An unpublished review or an unbound provenance receipt is outside the accepted set. The caller cannot pass a candidate list.

Each accepted receipt then passes `verify_retained_v2`, `decode`, and `typed(..., 'receipt')`. Scope key is `scope_key_v2`. A failure of any accepted receipt refuses the whole lookup as `accepted_corpus_unclassifiable`. Identity comparison happens only after that.

Terminal events `withdrawn`, `conflicted`, `superseded`, and `expired` remove that version. Source/profile withdrawal and expiry without that event remain the existing `readCandidate` refusal. Two still-active matches return `ambiguous` with a null fingerprint.

## Lifecycle, concurrency, budgets, ACL

The caller owns the guard transaction and must commit or roll back it. `readCandidate` keeps the same `SHARE` lock and opens the existing historical `REPEATABLE READ` / `READ ONLY` archive connection, which it closes. The lookup sets `statement_timeout` to 20 seconds. The disposable cluster already sets lock and idle-transaction deadlines.

Ceilings, refuse above, allow equal: 1,024 accepted events, 1,024 reviews, 262,144 bytes per receipt, 8,388,608 aggregate accepted receipt bytes. Reasons: `lookup_budget_count`, `lookup_budget_receipt`, `lookup_budget_bytes`. Overflow returns `refused` and no fingerprint.

`SECURITY DEFINER`, empty `search_path`, UTC. `REVOKE` from `PUBLIC`. `GRANT EXECUTE` only to the existing `ot_original_reader`. No new table, role, writer, policy, or private-table grant.

## Result

Outcomes `no_match`, `ambiguous`, and `refused` are distinct. A verified row carries the fingerprint, the existing custody proof, the witness, and `read_at`. `reusablePositiveCache` is false. The row is synthetic/local. It is not an OfficialEvaluation, a production acceptance token, a key, or an original body. A later decision runs the proof again.

## Tests

One disposable PostgreSQL 16 cluster, synthetic `https://regulations.example/rules/{primary_rule|composed_effect|composed_mode}` only. Cases: empty corpus, review-only, unbound receipt, exact match, wrong pin/scope/fact/requirement, persistence on a new connection, V2 ambiguity, explicit supersession to V2, corrupt/missing/duplicate/orphan/malformed competitors, source/profile/expiry/witness/restore/isolation failures, budgets, ACL, and lock ordering for publication and withdrawal.
