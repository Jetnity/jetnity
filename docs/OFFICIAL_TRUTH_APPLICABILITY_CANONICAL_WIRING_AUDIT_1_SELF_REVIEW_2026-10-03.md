# Official Truth Applicability Canonical Wiring Audit 1 — Self-Review

Date: 3 October 2026
Issue: #796
Draft PR: #797
Branch: `docs/official-truth-applicability-canonical-wiring-audit-1`
Baseline: `main@ac36175d4c64aaab6be7c83f2731a83473feba85`
Logical agent: **Jetnity Official Truth applicability canonical wiring audit 1**, Generation 1
Session: https://cursor.com/agents/bc-107ee745-44ac-4d35-9a53-bdc22f24337d
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This self-review is the author check. It is not an independent Technical-Lead PASS. It does not mark Ready and it does not merge.

## Scope check

The task allows exactly three new docs. `docs/ACTIVE_WORK_STATUS.md` is not an audit output. R1 restored it byte-for-byte to `main@ac36175d4c64aaab6be7c83f2731a83473feba85`. No continuity pointer was added elsewhere.

No edit to `lib/**`, `app/**`, `components/**`, `types/**`, or `supabase/**`. The task seed was not edited. `.jetnity/operating-mode.json` was not edited. No runtime wiring, migration, extractor registration, source parser, route, UI, provider, model, CH import, or F8.

A dirty `next-env.d.ts` existed before the audit and was restored. It is not staged.

## Task sections

1. Purpose. The audit names the loss if parsing widens before the store guard, and it fixes the order in one pull request.
2. Binding reads. The call graph was taken from the live modules and the two Official Truth migrations, not from a stale summary. The applicability module's own test still proves it has no production importer.
3. One parser. `regelFaktLesen` remains the semantic parser. Both public readers keep calling it. The evaluator is not imported into acceptance.
4. Types. `rule-claims.ts` imports the existing unions. They are not copied. The import is one way. The importer lock must grow by exactly that one file.
5. Legacy. `required`, `not_required`, legacy visa options, and the other six kinds stay. Flat `conditional` fails closed and is not upgraded. Claim keys stay scope hashes. `factKind` strings stay. No migration is required for that compatibility.
6. Store guard. The reason is `applicability_not_persistable`. It is returned before `transportAus` and before `faktSpalten`. The RPC is not called. `faktSpalten` is typed so a branched fact cannot reach it.
7. Identity. Schema-1 unconditional flattening loses `schema`, `applicability`, the fingerprint, and idempotent identity against a legacy row. Round-trip from the current columns cannot rebuild schema 1. The decision is that all schema-1 facts are non-persistable. It is not left open.
8. Extractor. Legacy facts still parse. Schema-1 parses only from a code-owned `extract()`. The production registry stays empty. The test seam is the only schema-1 proof. No traveller predicate is evaluated.
9. Same-request. The existing `RegelFakt` field can carry the widened union. Proof, retrieval, scope, and the absence of persistence stay. No context hash.
10. Authority. The only production acceptance caller remains the dormant store writer. Fact-entry does not supply a fact. Proposal, review, and model output are still unread by acceptance.
11. First importer. `rule-claims.ts` for shape parsing only. Evaluation stays in the applicability module.
12. Errors. Parser codes are listed. `applicability_not_persistable` stays on the store result and off `RegelClaimFehler`.
13. Fingerprints. `rule-applicability:v1` stays off the accepted claim until a schema can store it. `reg-eval-ctx:v1` is absent.
14. Tests. The eighteen checks are specified, including the existing conditional store proof that must change from success to a pre-RPC rejection.
15. Order. One pull request. Guard first, then parser, if split into commits. No separate parser pull request.
16. Output. The three docs exist. The classification is `CANONICAL_WIRING_READY_FOR_RUNTIME_SLICE`.
17. Forbidden paths were not edited.
18. Validation is the docs diff check, the operating-mode guard, and a fresh `main` fetch that finishes 0 behind. Runtime tests were not run and are not claimed.

## Deliberate choices

- Architecture section 13 rejected branched persistence only. This audit rejects every schema-1 fact, including unconditional, because flattening loses identity. The later slice follows this audit.
- `provenance_not_authorized` and the four bound codes are added to `RegelClaimFehler` even though the task's minimum list named three codes. The reader already returns them, and mapping them to `invalid_fact` would hide a trust failure.
- `applicability_not_persistable` is intentionally not a `RegelClaimFehler`. In-memory acceptance of schema 1 is valid. Persistence is the layer that refuses it.
- The applicability source file is not a wiring-slice edit. The readers already match section 3.1.
- The extractor registry source and the same-request source are expected to need no edit. The allowlist says they may receive a key-preserving narrowing only if typecheck forces it.
- `docs/ACTIVE_WORK_STATUS.md` is unchanged from `main`. The task names exactly three outputs. The audit, report, and self-review are that file list.

## What I did not verify

I did not run `npm test`, typecheck, lint, or the production build. I did not open a database. I did not read Supabase Production or Development. I did not confirm whether any environment already stores `effect = 'conditional'`. The SQL check still allows that word. The wiring decision does not depend on those rows being absent.

The line numbers in the audit are from the baseline read in this session. A later commit on `main` can move them. The review head of this docs slice does not move those runtime lines.

## Classification check

The wiring order, the import direction, the error owners, the guard, and the persistence decision are specified. The missing applicability schema is a later gated persistence slice, not an unspecified hole in this wiring plan.

`CANONICAL_WIRING_READY_FOR_RUNTIME_SLICE`
