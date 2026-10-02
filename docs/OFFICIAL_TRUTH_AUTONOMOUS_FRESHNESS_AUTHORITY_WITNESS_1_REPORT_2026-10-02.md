# Official Truth Autonomous Freshness / Authority Witness 1 — Report

Date: 2 October 2026
Issue: #766
Draft PR: #767
Branch: `fix/official-truth-autonomous-freshness-witness-1`
Baseline: `main@c04964e715c0ea6810dae18d7c3d573707672392`
Implementation commit: `c0a9e707ed12fba0a946f54b1cb587bdcf2912ea`
Logical agent: **Jetnity Official Truth autonomous freshness authority witness 1**
Generation: **1**
Session: https://cursor.com/agents/bc-46d4f594-e303-4969-b3ce-10d4392fbd48
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This report is the author record. A Technical-Lead PASS requires an independent exact-head review of the branch tip. This report is not Ready and not a merge.

## Result

The #749 F7 same-request precondition now has one server-only witness. It does not close F8 and it does not accept a Rule.

`loadOfficialTruthAutonomousPreacceptanceWitness(eingabe)` in `lib/readiness/official-truth-autonomous-preacceptance-witness-server.ts` is the live entry. It accepts the registry-free review material already required by `officialTruthServerHeldReviewPacket`. Authority comes only from `loadOfficialTruthFactEntryAuthority()`. The witness continues only for exactly `{ status: 'authorized', grant: 'role', capability: 'official-truth-freigeben' }`.

`officialTruthServerHeldReviewReproof` loads the source catalog once, injects that registry, and recomputes #723 and #726 v2 from the same reconstructed input. Packet scope and support identities must match the `review-packet:v2:` fingerprint. The reproof result contains no registry, snapshot, or proposal.

Every re-proved support must be exactly `current` from the existing `officialFrische` helper. `checkedAt` is the support `retrievedAt`. `validFrom` and `validUntil` are the re-proved window. Content identity is the re-proved `sourceContentHash`. `now` is the server reference time. No caller `maxAgeMs` is accepted. The existing one-hour ceiling stays in force, including the `>=` boundary. A re-proved official source is passed as source-available only so that helper can apply the time gate. `requirementsProviderAus()` stays `null`.

Eligible re-proved quality is only `explicit_primary_statement` or `composed_from_multiple_primary_sources`. A successful result is frozen ephemeral metadata: `authorized_preacceptance_witness`, the recomputed key, rule scope, fact kind, sorted support version ids, server reference time, freshness `current`, and the authority echo `grant: 'role'` plus `official-truth-freigeben`. It is not a bearer capability, not acceptance, and not Official Truth.

`decideOfficialTruthAutonomousPreacceptanceWitness` is the test seam. It is not the live entry.

## What the boundary does

1. Denied, lookup-failed, and database-capability failures return before any catalog read.
2. Break-glass and any authority result other than the exact role grant return before any catalog read.
3. A missing or failed catalog returns no witness and no secret or thrown error text.
4. Caller `registry`, `sourceClass`, `domains`, and `blockedDomains` stay `caller_authority_forbidden` before the catalog read.
5. Caller role, grant, capability, reviewer, user, email, AAL, clock, `maxAgeMs`, freshness, `reviewPacketKey`, `supportVersionIds`, trusted fact, accepted claim, lifecycle, suggestion, model authority, and decision fields are rejected before authority and before the catalog read.
6. One successful combined re-proof performs one `read_registry` call. The key equals the canonical `review-packet:v2:` fingerprint of the same server-held material. Packet and fingerprint agree on rule scope and support ids.
7. Exactly the existing max-age boundary, an older retrieval, a future `validFrom`, and an elapsed `validUntil` are `freshness_not_current`.
8. A malformed or non-finite server reference time is `invalid_reference_time` and does not read the catalog.
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

Re-run on `c0a9e707ed12fba0a946f54b1cb587bdcf2912ea`, before the documentation commit. At that fetch, `origin/main` was `c04964e715c0ea6810dae18d7c3d573707672392`. Merge-base was that same SHA. The branch was 2 ahead and 0 behind, including the task seed. Re-fetch before treating a later SHA as current.

- Witness file: 12 tests, 12 pass, 0 fail.
- Server-held registry file: 10 tests, 10 pass, 0 fail.
- `npm test`: 4473 pass, 0 fail, 763 suites. The two throwaway PostgreSQL proofs ran on local PostgreSQL 16.15. No remote database was contacted.
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
