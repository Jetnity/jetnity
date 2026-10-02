# Official Truth Server-Reproved Evidence Store Entry 1 — Handoff

Date: 2 October 2026
Issue: #762
Draft PR: #764
Branch: `fix/official-truth-server-reproved-evidence-store-1`
Baseline: `main@8325a5be988ec9e8d1fbd79dd75129373176be2e`
Logical agent: **Jetnity Official Truth server-reproved Evidence store entry 1**
Generation: **1**
Session: https://cursor.com/agents/bc-1ddf584a-01df-47f2-b35e-adf405ae3592
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

Read `docs/OFFICIAL_TRUTH_SERVER_REPROVED_EVIDENCE_STORE_1_REPORT_2026-10-02.md` and then this handoff. The task file was not rewritten.

## Current state

The review head is the branch tip after the documentation commit that adds this handoff. Re-fetch before review. The implementation commit on that tip is `986a00db08f751045eb333405b53b3f6fc172f1c`.

At the pre-documentation fetch, `origin/main` was `8325a5be988ec9e8d1fbd79dd75129373176be2e` and this branch was 0 behind it. Do not treat a later SHA as current without fetching.

Machine mode is `NORMAL`. This slice does not edit `.jetnity/operating-mode.json`. Global startup files were left untouched because the task forbids them. This handoff is the continuity record for the next reader.

Draft PR #764 stays Draft. Cursor does not Ready or merge.

## Contract the next reader must keep

The only canonical accepted-Evidence store entry is:

`akzeptierteEvidenceSpeichern(umschlag, uhr, extraktion, abhaengigkeiten?)`

`umschlag` is registry-free retrieval input: `request`, `descriptors`, `sourceId`, `material`. `uhr` is the injected clock. `extraktion` may carry only `validFrom`, `validUntil` and `extractionNote`.

`abhaengigkeiten.katalog` is the server-held catalog dependency. `abhaengigkeiten.transport` is the dormant store transport. Neither is request-body authority. `registry`, `sourceClass`, `domains` and `blockedDomains` on the envelope, the extraction, or those dependency objects are rejected before the store transport runs.

The payload is built only from `accepted_evidence.evidence` returned by `officialTruthServerHeldEvidenceAnnehmen`, plus the rule scope derived from that Evidence. A free `EvidenceVersion` is not a parameter. Do not reintroduce `evidenceKandidatAkzeptieren` as a store argument.

`akzeptierteRegelClaimSpeichern` remains the existing dormant Rule-Claim writer. Do not add another `regelKandidatAkzeptieren` path from this handoff.

Future Evidence persistence is bound in `docs/OFFICIAL_TRUTH_RULE_ACCEPTANCE_TRUST_BOUNDARY_1_ARCHITECTURE_2026-10-02.md` under "Evidence-store binding — 2 October 2026".

## What is not authorized

No Ready. No merge. No follow-up slice. Do not call this store from #741. Do not apply `official_truth_store_accepted_v1`. Do not add an endpoint. Do not write a trusted Rule. Do not touch #626. Do not select a provider. `requirementsProviderAus()` stays `null`.

A Development or Production apply of the store RPC is a separate Product-Owner gate.

## Stale sentences left in place

`DECISIONS.md` and `ARCHITECTURE.md` still say the Evidence writer calls `evidenceKandidatAkzeptieren` with a caller registry. That was true before this slice. Those files were outside the allowlist. The code and the architecture binding above are the current contract. A later docs slice should correct the two stale sentences. Do not treat them as permission to restore the free-Evidence signature.

Evidence version identity still omits the regulatory cell. Two cells from one snapshot, URL, source and retrieval time would share a `versionId`. This slice did not change that. Decide it before a live path persists two credential options from one page.

## Validation already recorded

On `986a00db08f751045eb333405b53b3f6fc172f1c`, before the documentation commit: focused store tests 13/13; `npm test` 4459 pass / 0 fail / 762 suites; typecheck pass; lint 0 errors and 148 pre-existing warnings; production build pass on Next.js 16.3.8 with 25 static pages; hygiene checks pass; operating-mode guard PASS. No remote database was contacted. Exact-head CI and Vercel belong to the pushed tip, not to this text.

## Exact next step

Independent main-chat Technical-Lead review of the exact branch tip. Cursor does not Ready or merge and does not start a follow-up slice.

## R1 current — 2 October 2026

The sections above record the F2 delivery at implementation `986a00db08f751045eb333405b53b3f6fc172f1c` and documentation `5fbf42a6`. Technical-Lead review `5396929023` is applied on this same logical agent, Generation 1, session `bc-1ddf584a-01df-47f2-b35e-adf405ae3592`.

Current contract addition: `versionIdFuer` includes the canonical `lookupKey` from `evidenceSuchschluessel` together with `sourceId`, canonical URL, `sourceContentHash` and `retrievedAt`. Format remains `^ev1_[a-f0-9]{32}$`. No schema change.

`main@6e1d29e2db0c0b468460e1306ab7d5101607021b` is the merge base. This branch is 0 behind it. Do not edit the merged F6 suggestion files.

The stale-sentence section above is historical. `ARCHITECTURE.md`, the ADR-0220 nachtrag in `DECISIONS.md`, and section 14 of `docs/OFFICIAL_TRUTH_SOURCE_EVIDENCE_ARCHITECTURE_2026-10-01.md` now describe the server-reproved store entry. Do not restore a free Evidence argument.

Gates on code head `8b29caf16d69ba01e776a389cd44220b597f614f`, before this R1 documentation commit: focused tests 29/29, fingerprint tests 11/11, `npm test` 4460 pass / 0 fail / 762 suites, typecheck pass, lint 0 errors and 148 pre-existing warnings, production build pass on Next.js 16.3.8 with 25 static pages, hygiene and operating-mode guard pass. No remote database was contacted.

The review head is the branch tip after the commit that adds this section. Re-fetch before review. Stay Draft. STOP for independent exact-head re-review. Cursor does not Ready, merge, or start a follow-up.
