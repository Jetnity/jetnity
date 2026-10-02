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
