# Official Truth Autonomous Freshness / Authority Witness 1 — Report

Date: 2 October 2026
Issue: #766
Draft PR: #767
Branch: `fix/official-truth-autonomous-freshness-witness-1`
Baseline: `main@c04964e715c0ea6810dae18d7c3d573707672392`
Implementation commit: `13ebcb20b04b6f677ca4e5e459f8343a565f46c9`
R2 corrects the same intermediate head `c0a9e707ed12fba0a946f54b1cb587bdcf2912ea`. `c0a9e707`, `d43711af`, and `02526f26` are not the review head.
Logical agent: **Jetnity Official Truth autonomous freshness authority witness 1**
Generation: **1**
Session: https://cursor.com/agents/bc-46d4f594-e303-4969-b3ce-10d4392fbd48
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This report is the author record. A Technical-Lead PASS requires an independent exact-head review of the branch tip. This report is not Ready and not a merge.

## F7-R1

Technical-Lead early finding on `c0a9e707ed12fba0a946f54b1cb587bdcf2912ea`: the combined re-proof compared packet support ids in array order. #726 identity is order-invariant. `officialTruthServerHeldReviewReproof` now compares the fingerprint ids with the candidate ids and the packet support ids as the same canonical multiset. Duplicate and mismatch protection stays. Reversed caller order of the same composed supports keeps one catalog read, the same `review-packet:v2:` key, and the same sorted `supportVersionIds`. The authorized witness still succeeds for that reversed input when freshness is `current`.

## F7-R2

Technical-Lead early finding on the same intermediate head: the combined re-proof still forwarded each caller `bund.uhr` into #723. A future `retrievedAt` plus a further-future caller clock could pass retrieval, and `officialFrische` can then return `current` because a negative age is inside the ceiling. `officialTruthServerHeldReviewReproof` now requires a server-owned clock, snapshots that instant once, and uses only that snapshot as the validation clock for the reconstructed packet and fingerprint. A missing or invalid server clock is `invalid_reference_time` before the catalog read and without executing the caller clock. A future `retrievedAt` against that server instant stays `retrieved_at_in_future` and is not a witness, even when the historical bundle supplies a 2099 clock. A caller clock that throws is not executed and does not change a current retrieval. The deterministic seam still injects `now`; the request object does not. `officialTruthServerHeldReviewPacket` and the pure #723 function still accept their own validation clock for existing callers.

## Result

The #749 F7 same-request precondition now has one server-only witness. It does not close F8 and it does not accept a Rule.

`loadOfficialTruthAutonomousPreacceptanceWitness(eingabe)` in `lib/readiness/official-truth-autonomous-preacceptance-witness-server.ts` is the live entry. It accepts the registry-free review material already required by `officialTruthServerHeldReviewPacket`. Authority comes only from `loadOfficialTruthFactEntryAuthority()`. The witness continues only for exactly `{ status: 'authorized', grant: 'role', capability: 'official-truth-freigeben' }`.

`officialTruthServerHeldReviewReproof` loads the source catalog once, injects that registry, and recomputes #723 and #726 v2 from the same reconstructed input. The validation clock on that path is the snapshotted server instant, not `bund.uhr`. Packet scope and support identities must match the `review-packet:v2:` fingerprint. The reproof result contains no registry, snapshot, or proposal.

Every re-proved support must be exactly `current` from the existing `officialFrische` helper. `checkedAt` is the support `retrievedAt`. `validFrom` and `validUntil` are the re-proved window. Content identity is the re-proved `sourceContentHash`. `now` is the server reference time. No caller `maxAgeMs` is accepted. The existing one-hour ceiling stays in force, including the `>=` boundary. A re-proved official source is passed as source-available only so that helper can apply the time gate. `requirementsProviderAus()` stays `null`.

Eligible re-proved quality is only `explicit_primary_statement` or `composed_from_multiple_primary_sources`. A successful result is frozen ephemeral metadata: `authorized_preacceptance_witness`, the recomputed key, rule scope, fact kind, sorted support version ids, server reference time, freshness `current`, and the authority echo `grant: 'role'` plus `official-truth-freigeben`. It is not a bearer capability, not acceptance, and not Official Truth.

`decideOfficialTruthAutonomousPreacceptanceWitness` is the test seam. It is not the live entry.

## What the boundary does

1. Denied, lookup-failed, and database-capability failures return before any catalog read.
2. Break-glass and any authority result other than the exact role grant return before any catalog read.
3. A missing or failed catalog returns no witness and no secret or thrown error text.
4. Caller `registry`, `sourceClass`, `domains`, and `blockedDomains` stay `caller_authority_forbidden` before the catalog read.
5. Caller role, grant, capability, reviewer, user, email, AAL, clock, `maxAgeMs`, freshness, `reviewPacketKey`, `supportVersionIds`, trusted fact, accepted claim, lifecycle, suggestion, model authority, and decision fields are rejected before authority and before the catalog read.
6. One successful combined re-proof performs one `read_registry` call. The key equals the canonical `review-packet:v2:` fingerprint of the same server-held material. Packet and fingerprint agree on rule scope and support ids. Reversing the caller support order does not change the key or the sorted ids. The caller `uhr` function is not executed.
7. Exactly the existing max-age boundary, an older retrieval, a future `validFrom`, and an elapsed `validUntil` are `freshness_not_current`. A future `retrievedAt` against the server instant is `retrieved_at_in_future`, including when the bundle carries a further-future caller clock.
8. A malformed or non-finite server reference time is `invalid_reference_time` and does not read the catalog. The re-proof does the same when its server clock is missing or does not return a finite `Date`.
9. `research_gap`, `stale_primary_evidence`, and `unresolved_conflict` are `quality_not_acceptable`. Same-source composition remains `same_source_composition`. Two credential options in one packet remain `scope_mismatch`.
10. The success object has exactly the nine proof fields. It does not contain the proposal, snapshot, registry, domain, trusted fact, or reviewer identity.
11. The witness module does not import or call suggestion output, decision intent, `regelKandidatAkzeptieren`, or either store writer. No `app/` file calls the live entry or the seam.

## Out of scope, unchanged

Not changed, and not claimed as fixed:

- F8 and any call to `regelKandidatAkzeptieren`
- store writers and store transport
- routes, Auth, AAL, roles, RLS, or capabilities
- migrations, Development apply, or Production apply
- #626
- suggestion consistency
- provider selection, model calls, secrets, or cost

`check:schema-bezug` lists four pre-existing LOCAL/UNAPPLIED RPCs: `admin_account_counts_v1`, `darf_official_truth_freigeben`, `official_truth_source_catalog_v1`, and `official_truth_store_accepted_v1`. This slice adds none.

## Validation

Re-run on `13ebcb20b04b6f677ca4e5e459f8343a565f46c9`, before the R2 documentation commit. At that fetch, `origin/main` was `c04964e715c0ea6810dae18d7c3d573707672392`. Merge-base was that same SHA. The branch was 6 ahead and 0 behind. Re-fetch before treating a later SHA as current. The gates on `c0a9e707` and `d43711af` are historical.

- Witness file: 15 tests, 15 pass, 0 fail. Added tests: a future retrieval with a future caller clock is not a witness; a throwing caller clock is not executed and does not block a current retrieval.
- Server-held registry file: 11 tests, 11 pass, 0 fail. The added test proves the caller clock stays at zero calls for a missing server clock, a future retrieval, and a successful re-proof.
- `npm test`: 4477 pass, 0 fail, 763 suites. The two throwaway PostgreSQL proofs ran on local PostgreSQL 16.15. No remote database was contacted.
- `npm run typecheck`: pass.
- `npm run lint`: 0 errors, 148 pre-existing warnings.
- `npm run build`: pass. Next.js 16.3.8. Compiled successfully. 25 static pages.
- `git diff --check`: pass.
- `check:operating-mode`: PASS.
- `check:dead`: 0 unreached files.
- `check:exports`: 0 uncalled exports.
- `check:deps`: pass.
- `check:api-schutz`: 12 admin routes, all use `requireAdminApi()`.
- `check:schema-bezug`: pass. Four LOCAL/UNAPPLIED RPCs. No new RPC.

Exact-head GitHub CI and Vercel Preview belong to the pushed branch tip. They are not claimed in this pre-push validation record.

## Traveller context

One witness remains one regulatory cell. A Swiss passport option and a Serbian passport option keep distinct rule-scope keys. Mixing them in one review input is `scope_mismatch` and produces no witness. This slice does not collect a credential and does not invent a visa, transit, health, carrier, eligibility, or document rule.
