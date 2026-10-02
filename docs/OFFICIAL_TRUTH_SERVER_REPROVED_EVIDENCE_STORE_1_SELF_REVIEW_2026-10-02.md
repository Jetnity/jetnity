# Official Truth Server-Reproved Evidence Store Entry 1 — Self-Review

Date: 2 October 2026
Issue: #762
Draft PR: #764
Branch: `fix/official-truth-server-reproved-evidence-store-1`
Logical agent: **Jetnity Official Truth server-reproved Evidence store entry 1**
Generation: **1**
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This is the author self-review. It is not an independent Technical-Lead PASS. Cursor does not Ready and does not merge.

## Scope check

Changed paths on the implementation commit `986a00db08f751045eb333405b53b3f6fc172f1c`:

- `lib/readiness/official-truth-store-server.ts`
- `lib/readiness/official-truth-store-server.test.ts`
- `docs/OFFICIAL_TRUTH_RULE_ACCEPTANCE_TRUST_BOUNDARY_1_ARCHITECTURE_2026-10-02.md`

This documentation commit adds:

- `docs/OFFICIAL_TRUTH_SERVER_REPROVED_EVIDENCE_STORE_1_REPORT_2026-10-02.md`
- `docs/OFFICIAL_TRUTH_SERVER_REPROVED_EVIDENCE_STORE_1_HANDOFF_2026-10-02.md`
- `docs/OFFICIAL_TRUTH_SERVER_REPROVED_EVIDENCE_STORE_1_SELF_REVIEW_2026-10-02.md`

The task file was not rewritten. `lib/readiness/official-truth-server-held-source-registry.ts` is unchanged. Suggestion module and tests are unchanged. F9 authority guard, Auth, routes, migrations and `types/supabase.ts` are unchanged. `lib/readiness/provider.ts` has no diff against `origin/main`. `docs/ACTIVE_WORK_STATUS.md` was not edited.

## Contract

- The exported Evidence signature is `umschlag`, `uhr`, `extraktion`, optional dependencies.
- The Evidence function calls `officialTruthServerHeldEvidenceAnnehmen` once and does not call `evidenceKandidatAkzeptieren`.
- `regelKandidatAkzeptieren(` remains one call, inside the pre-existing Rule-Claim writer.
- Caller `registry`, `sourceClass`, `domains` and `blockedDomains` are rejected before store transport. A registry object passed as the catalog dependency is rejected the same way, because `blockedDomains` is one of those keys.
- Caller `sourceContentHash`, `contentHash` and `content` do not reach the payload.
- A caller-built `EvidenceVersion`, including one that is already accepted, is not a store argument.
- Caller `versionId`, lifecycle, validation and `lookupKey` do not override stored values. The payload fields equal the re-proved Evidence.
- `not-a-government.example` does not reach the store. A licensed provider stays `source_not_official_authority`. A caller relabel is `invalid_source_plan`.
- Catalog missing or thrown fails closed with no store call. Retrieval rejection does the same. Store missing after proof is `store_not_configured`. Store throw or a mismatched version id is `store_failed`.
- Inserted and idempotent outcomes still require the re-proved version id. The throwaway PostgreSQL proof still shows one row for the repeated official Evidence write.
- Two credential options keep two rule-scope keys, two lookup keys and two issuing countries.
- No file under `app/` calls `akzeptierteEvidenceSpeichern` or `officialTruthServerHeldEvidenceAnnehmen`.
- `requirementsProviderAus()` is null.

## Gates

Re-run on `986a00db08f751045eb333405b53b3f6fc172f1c` before the documentation commit:

- focused store tests 13/13
- `npm test` 4459 / 4459, 762 suites
- typecheck pass
- lint 0 errors, 148 pre-existing warnings
- production build pass, Next.js 16.3.8, 25 static pages
- `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`, `check:operating-mode` pass
- schema reference still lists `official_truth_store_accepted_v1` as LOCAL/UNAPPLIED, plus the three other pre-existing LOCAL/UNAPPLIED RPCs
- no remote Supabase access

Local PostgreSQL 16.15 was installed so the existing throwaway store proof inside `npm test` could start `initdb`. That install is not a database apply. The package cluster was not started. Development and Production were not used.

## Disclosed limits

The pure retrieval functions remain caller-registry seams. F2 closes the canonical Evidence store entry only. The SQL gateway can still insert a hand-built licensed Evidence payload if a later caller bypasses this function and calls the RPC directly. The canonical function does not do that. No route calls the function yet, and the store RPC is still unapplied, so an unconfigured live call fail-closes after proof with `store_not_configured`, or earlier with `catalog_not_configured`.

`DECISIONS.md` and `ARCHITECTURE.md` still describe the old free-Evidence signature. They were outside this allowlist. Evidence version identity still omits the regulatory cell. Global continuity files were left untouched because this lane must not edit them.

## Not claimed

No Ready. No merge. No Development apply. No Production mutation. No provider activation. No follow-up slice. This self-review is not an independent Technical-Lead PASS.

## R1 self-review — 2 October 2026

Author check of Technical-Lead review `5396929023`. This is not an independent PASS.

R1 paths:

- `lib/readiness/evidence.ts` — `versionIdFuer` takes the lookup key already produced by `evidenceSuchschluessel` inside `evidenceKandidatAusModell`.
- `lib/readiness/source-foundation.test.ts`
- `lib/readiness/official-truth-retrieved-candidate-evidence.test.ts`
- `lib/readiness/official-truth-store-server.test.ts` — same snapshot, two credential cells, both inserted, exact replay idempotent.
- `lib/readiness/official-truth-rule-review-fingerprint.test.ts` — one assertion now expects a different cell to change the support version id. The old equality encoded the collision.
- `ARCHITECTURE.md`, `DECISIONS.md` ADR-0220 nachtrag, `docs/OFFICIAL_TRUTH_SOURCE_EVIDENCE_ARCHITECTURE_2026-10-01.md` section 14.

`main@6e1d29e2db0c0b468460e1306ab7d5101607021b` is integrated. F6 runtime `lib/readiness/official-truth-review-suggestion.ts` and its test have an empty diff against that main. No migration. `provider.ts` is unchanged. The store entry still re-proves through `officialTruthServerHeldEvidenceAnnehmen`. Caller authority still never reaches the transport.

The disclosed F2 limits about the missing cell in `versionId` and the stale store sentences are closed by this R1. The SQL gateway can still insert a hand-built payload that bypasses the TypeScript entry. No route does that.

Gates recorded on `8b29caf16d69ba01e776a389cd44220b597f614f` before this documentation commit: `npm test` 4460/4460 across 762 suites, typecheck, lint 0 errors / 148 warnings, production build, hygiene, operating-mode guard, `git diff --check`. No remote Supabase.

No Ready. No merge. No follow-up. STOP for independent exact-head re-review.

## R2 self-review — 2 October 2026

Author check of Technical-Lead review `5397155774`. This is not an independent PASS.

The F2 sentence that the store RPC is still unapplied, and the R1 sentence that it stays LOCAL/UNAPPLIED, stay in place as historical classifier wording. Hosted state is the R2 record: Development already has migration `20261001180549` and `public.official_truth_store_accepted_v1`, with 0 Evidence rows at the Technical-Lead read on 2 October 2026. Production has neither the store RPC, the Evidence table, nor the source-catalog RPC. This slice applies nothing and does not re-apply Development. Production apply or activation stays a Product-Owner gate.

The handoff no longer says a Development apply is the same future gate as Production. Living store sentences in the trust-boundary architecture, `ARCHITECTURE.md`, and section 14 of the source-evidence architecture distinguish the `check:schema-bezug` label from that hosted state.

`lib/readiness/official-truth-store-server.ts` changes only the header comment. The canonical Evidence path can use the server-held source-catalog RPC and then the store RPC. No function body changed. No migration, route, Auth, RLS, provider, model, #741, #626, or F6 file changed.

Gates on `7937fe5cfd8400861d5433fe80f8d7f4f836568f`: `npm test` 4460/4460 across 762 suites, typecheck, lint 0 errors / 148 warnings, production build, hygiene, operating-mode guard, and `git diff --check`. `check:schema-bezug` still lists four LOCAL/UNAPPLIED RPCs. No remote Supabase.

No Ready. No merge. No follow-up. STOP for independent exact-head re-review.
