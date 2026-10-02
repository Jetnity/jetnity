# Official Truth Server-Reproved Evidence Store Entry 1 — Report

Date: 2 October 2026
Issue: #762
Draft PR: #764
Branch: `fix/official-truth-server-reproved-evidence-store-1`
Baseline: `main@8325a5be988ec9e8d1fbd79dd75129373176be2e`
Implementation commit: `986a00db08f751045eb333405b53b3f6fc172f1c`
Logical agent: **Jetnity Official Truth server-reproved Evidence store entry 1**
Generation: **1**
Session: https://cursor.com/agents/bc-1ddf584a-01df-47f2-b35e-adf405ae3592
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This report records the F2 remediation. It is not an independent Technical-Lead PASS. The review head is the branch tip after the documentation commit that adds this file. Re-fetch before review.

## What changed

`akzeptierteEvidenceSpeichern` no longer accepts a free `EvidenceVersion` and a caller `QuellenRegistry`.

The canonical shape is:

`akzeptierteEvidenceSpeichern(umschlag, uhr, extraktion, abhaengigkeiten?)`

The function:

1. rejects caller authority keys on the dependency object before any catalog or store call;
2. re-proves accepted Evidence through `officialTruthServerHeldEvidenceAnnehmen`;
3. derives the rule scope from that returned Evidence;
4. builds the dormant payload only from that returned Evidence;
5. calls the existing store transport only after that proof succeeds.

Catalog failure, retrieval rejection and Evidence rejection return before the store transport. A missing store transport after successful proof remains `store_not_configured`. A thrown or failed store transport remains `store_failed`. Inserted and idempotent responses still have to echo the re-proved version id.

`akzeptierteRegelClaimSpeichern` is unchanged. This slice does not add a `regelKandidatAkzeptieren` path. `evidenceKandidatAkzeptieren` is no longer called from this module. Payload builders stay unexported.

The F1 module was not edited. The store imports `officialTruthServerHeldEvidenceAnnehmen` and passes only catalog `transport` / `env`, not the store transport.

## What did not change

No migration. No Development or Production apply. No RLS, Auth, role or profile change. No route or Server Action. No accepted Rule write. No provider or model call. No secret or env mutation. No cost. `requirementsProviderAus()` stays `null`. `lib/readiness/provider.ts` has an empty diff against `origin/main`. Suggestion files owned by the parallel F6 writer were not touched. #626 and #741 were not implemented.

`public.official_truth_store_accepted_v1` remains LOCAL/UNAPPLIED. `check:schema-bezug` still lists that RPC from `lib/readiness/official-truth-store-server.ts` to `supabase/migrations/20261001180549_official_truth_trusted_store_writer_1.sql`. This slice added no RPC. The same check also still lists the pre-existing LOCAL/UNAPPLIED names `admin_account_counts_v1`, `darf_official_truth_freigeben` and `official_truth_source_catalog_v1`.

The throwaway PostgreSQL proof still shows that a direct RPC payload for a licensed source can be inserted by the SQL gateway, and that a Rule Claim supported by that source is rejected by `official_rule_claim_support_source_class`. The canonical TypeScript entry does not produce that payload. A later route must not hand-build it.

## Validation on `986a00db08f751045eb333405b53b3f6fc172f1c`

Recorded before this documentation commit. `origin/main` was `8325a5be988ec9e8d1fbd79dd75129373176be2e`. This branch was 0 behind that SHA.

- Focused store tests: 13/13 pass, including the throwaway PostgreSQL 16.15 proof.
- `npm test`: 4459 pass / 0 fail / 762 suites.
- Typecheck: pass.
- Lint: 0 errors, 148 pre-existing warnings. None are in the files this slice edited.
- Production build: pass. Next.js 16.3.8. 25 static pages.
- `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`, `check:operating-mode`: pass.
- `git diff --check`: pass.
- No remote Supabase access. The package PostgreSQL cluster was not started. The proof used a throwaway cluster and deleted it.

## Disclosed limits

`DECISIONS.md` and `ARCHITECTURE.md` still describe the pre-F2 sentence that `akzeptierteEvidenceSpeichern` calls `evidenceKandidatAkzeptieren` with a caller registry. This task does not allow those global files. The binding note in `docs/OFFICIAL_TRUTH_RULE_ACCEPTANCE_TRUST_BOUNDARY_1_ARCHITECTURE_2026-10-02.md` is the current architecture contract for Evidence persistence. A later docs slice should correct the two stale sentences. Until then, the code and that binding note win over those older sentences.

Evidence `versionId` is still `sourceId`, canonical URL, content hash and `retrievedAt`. It does not include the regulatory cell. Two credential options proved here used two snapshots, so they received two version ids and two rule-scope keys. The same page snapshot for two cells would still collide on `version_id` inside the dormant SQL gateway. This slice does not change that identity. A later slice must decide it before a live path persists two cells from one retrieval.

`docs/ACTIVE_WORK_STATUS.md` was not edited. The task forbids global startup files. This report and the handoff are the continuity record.

## Not claimed

No Ready. No merge. No follow-up slice. No Development apply. No Production mutation. No provider activation. This report is not an independent Technical-Lead PASS.

## R1 current — 2 October 2026

Technical-Lead review `5396929023` on `5fbf42a684d67f519608edf2835b1df69f6c54d4` required three changes. The sections above stay the historical F2 record. They are not rewritten.

`versionIdFuer` now binds `sourceId`, canonical URL, `sourceContentHash`, `retrievedAt` and the existing `lookupKey` from `evidenceSuchschluessel`. The format stays `ev1_` plus 32 hex characters. There is no second scope serializer, no raw caller scope JSON, and no migration.

The same source, page, content, retrieval and cell still produce the same version id, including a different extraction note. A different credential option on that same snapshot produces a different lookup key and a different version id. A different requirement cell does the same. The throwaway PostgreSQL proof stores both credential cells from one snapshot through `akzeptierteEvidenceSpeichern` without `conflicting official evidence version`. Replaying the exact first cell stays `idempotent` and does not add a row.

Living store sentences now name `officialTruthServerHeldEvidenceAnnehmen` in `ARCHITECTURE.md`, a dated ADR-0220 nachtrag in `DECISIONS.md`, and section 14 of `docs/OFFICIAL_TRUTH_SOURCE_EVIDENCE_ARCHITECTURE_2026-10-01.md`. Historical task, report and handoff paragraphs above were left as the F2 record.

`main@6e1d29e2db0c0b468460e1306ab7d5101607021b` from merged #765 is integrated. This branch is 0 behind that SHA. F6 suggestion runtime and its delivery docs are unchanged from that main.

Code head for the gates below: `8b29caf16d69ba01e776a389cd44220b597f614f`. The review head is the branch tip after the documentation commit that adds this section.

- Focused Evidence, candidate and store tests: 29/29, including the throwaway PostgreSQL 16.15 same-snapshot proof.
- Review-packet fingerprint tests: 11/11. A different cell now changes the support version id.
- `npm test`: 4460 pass / 0 fail / 762 suites.
- Typecheck: pass. Production build: pass. Next.js 16.3.8. 25 static pages. The build also ran TypeScript on this code head.
- Lint: 0 errors, 148 pre-existing warnings. None are in the R1 files.
- `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`, `check:operating-mode`: pass.
- `git diff --check`: pass. `lib/readiness/provider.ts` has an empty diff against `origin/main`.
- Schema reference still lists the same four LOCAL/UNAPPLIED RPCs. This R1 added none.
- No remote Supabase access.

A row already stored under the previous version formula would not match the new id for the same cell. This lane did not query Development or Production. The store RPC stays LOCAL/UNAPPLIED from this slice, and the canonical writer is still unconnected.

No Ready. No merge. No follow-up slice. This section is not an independent Technical-Lead PASS.

## R2 current — 2 October 2026

Technical-Lead review `5397155774` on `6d94b87dc6f02ac41c96ebeaf4e8c25b14f2d490`. The F2 and R1 sections above stay historical. Sentences there that say `public.official_truth_store_accepted_v1` remains LOCAL/UNAPPLIED record the `check:schema-bezug` classifier. They are not the hosted state.

The classifier still labels the RPC LOCAL/UNAPPLIED because `types/supabase.ts` does not list it. Hosted state at the Technical-Lead read on 2 October 2026: Development branch `develop` already contains migration `20261001180549_official_truth_trusted_store_writer_1` and `public.official_truth_store_accepted_v1(jsonb)`. `private.official_evidence_versions` existed there and had 0 rows. Production has neither that store RPC, the Evidence table, nor the source-catalog RPC.

This slice applies nothing. Do not re-apply the Development migration. A future Production apply or activation remains a separate Product-Owner gate. The only runtime-file edit is a comment in `lib/readiness/official-truth-store-server.ts`: the canonical Evidence path can use the server-held source-catalog RPC and then the store RPC. No migration, route, Auth, RLS, provider, model, #741, #626, or F6 file changed.

No Ready. No merge. No follow-up slice. This section is not an independent Technical-Lead PASS.
