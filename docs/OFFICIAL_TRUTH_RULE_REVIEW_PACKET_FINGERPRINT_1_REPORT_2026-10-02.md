# Official Truth Rule Review Packet Fingerprint 1 — Report

Date: 2 October 2026
Issue: #724
Draft PR: #726
Branch: `feat/official-truth-rule-review-packet-fingerprint-1`
Baseline: `main@146664ac006fc0e79ecbb4d3f77f29cc25c861cf`

Logical agent: **Jetnity Official Truth rule review packet fingerprint 1**, Generation 1
Session: https://cursor.com/agents/bc-c890b1bf-bed1-4307-b21f-34c6b6dfe638
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This report is the author record. A Technical-Lead PASS requires an independent exact-head review. This report is not Ready and not a merge.

## Result

`officialTruthRegelReviewPacketFingerprint` in `lib/readiness/official-truth-rule-review-fingerprint.ts` builds one deterministic identity for one re-proven #723 Rule Review Packet. It does not mint truth and it does not accept a Rule Claim.

The input is exactly the original input accepted by `officialTruthRegelReviewPacket`: `{ supports, metadata }`.

Each support is `{ umschlag, uhr, extraktion }`. `metadata` is only `factKind`, `evidenceQuality` and `proposal`.

The function:

1. calls #723 `officialTruthRegelReviewPacket` again;
2. requires `status: 'rule_review_packet'`;
3. builds a canonical JSON object, version `v: 1`, from only:
   - candidate `scope`, `key`, `factKind`, `evidenceQuality`, sorted `supportVersionIds` and `proposal`;
   - each support's `versionId`, `sourceId`, `canonicalUrl`, `retrievedAt` and `sourceContentHash`;
4. sorts support provenance so the caller's support order cannot change the bytes;
5. sorts object keys so caller key order that the bridges already normalize cannot change the bytes;
6. hashes that JSON with the existing `sha256Hex`.

The page snapshot is not read and is not serialized. `sourceContentHash` is copied from the re-proven packet. This module does not compute a second content hash.

Success is:

- `status: 'rule_review_packet_fingerprint'`;
- `reviewPacketKey`, shaped `review-packet:v1:` plus 64 lowercase hex characters;
- `ruleScopeKey`, the candidate key already produced inside #723;
- `supportVersionIds`, sorted.

There is no snapshot, URL, content hash, proposal, trusted fact or rule result in that output. A blocked #723 result is returned unchanged. No fingerprint is minted for it.

The key binds canonical review material. It does not say the proposal is true.

## What landed

- The same original input twice returns the same `reviewPacketKey`, the same rule-scope key as the re-proven candidate, and the same sorted support version ids.
- Two official supports reversed return the same fingerprint and the same sorted support version ids.
- A changed public page changes the packet's existing `sourceContentHash`, which matches `evidenceQuellenFingerprint`, and changes the fingerprint. This module does not call that function.
- A different canonical URL, retrieval time or source id keeps the same content hash and still changes the fingerprint, because those provenance fields and the derived version id are inside the canonical bytes.
- A different proposal, fact kind, evidence quality or travel-date cell changes the fingerprint. Quality and proposal changes keep the rule-scope key when the cell is unchanged. A later travel date changes the rule-scope key and keeps the support version id.
- Extraction-note whitespace, metadata and proposal key order, support-shell key order, citizenship order `CH`/`RS`, and CRLF versus LF in the page text do not change the fingerprint. The content hash of the CRLF page equals the existing evidence fingerprint of the LF page.
- A caller-built packet, a caller `reviewPacketKey`, a caller content hash and a trusted-fact field fail closed. The real key and the content hash are absent from those failures.
- A Swiss passport option and a Serbian passport option, both with citizenship `CH` and `RS`, produce two fingerprints and two rule-scope keys. Together they fail `scope_mismatch` and the failure does not contain the country codes.
- Personal keys fail closed. The value and the key name are absent. An empty input and a null input fail closed and do not return a fingerprint.

## Traveller context

One fingerprint is one regulatory cell. The cell keeps the full citizenship set on the re-proven candidate. In the synthetic fixture that set is `CH` and `RS`. The issuing country stays the credential option's issuing country. A second passport is a different rule-scope key and a different fingerprint. This function does not choose a preferred passport, does not infer citizenship from the issuing country, and does not invent a visa, transit, health, carrier or document rule. `research_gap` keeps a null proposal and still receives only a review identity. No passport number, MRZ, scan, biometric, birth date, health record, name, email, account id, trip id or traveller note is copied into the result. The public page text stays out of both the canonical bytes and the output. The existing content hash stands in for that page.

## Boundaries kept

- No edit to `official-truth-rule-review-packet.ts`, `evidence.ts`, `digest.ts`, `rule-claims.ts`, the source registry, the source router, #709, #713, #716, #717, the store, or the source catalog.
- No database, network, provider, OpenAI, browser, UI or public API.
- No call to rule acceptance. No trusted rule fact. No `official_truth_store_accepted_v1` and no `official_truth_source_catalog_v1`.
- `requirementsProviderAus()` stays `null`. This module does not call it.
- No runtime activation and no Production change.
- `docs/ACTIVE_WORK_STATUS.md` and `DECISIONS.md` were not edited. They are outside the task allowlist. This report and the handoff are the continuity for the slice.

## Validation

Local gates below were run on `fa15a813a72619163d4eb523e9918b0005c8a576` before this docs commit. `git fetch origin main` in this session resolved `origin/main` to `146664ac006fc0e79ecbb4d3f77f29cc25c861cf`, which is the task baseline. Merge-base is that SHA. The branch was 0 behind and 2 ahead. Re-fetch before treating any later SHA as current.

This VM did not have PostgreSQL 16 when the session started. PostgreSQL 16.15 was installed from Ubuntu packages so the existing throwaway store proofs could run. Package setup initialized a local cluster. `policy-rc.d` denied starting it. The suite then created its own temporary clusters through `/usr/lib/postgresql/16/bin/initdb`. No remote database was contacted. This slice did not add or apply SQL. Development and Production were not touched.

| Check | Result |
| --- | --- |
| `git diff --check` | pass |
| operating-mode guard | PASS |
| `lib/readiness/official-truth-rule-review-fingerprint.test.ts` | 10/10 pass |
| `npm test` | 4381 pass / 0 fail, 756 suites |
| `npm run typecheck` | pass |
| eslint on the two new files | pass, no warnings |
| `npm run lint` | pass, 0 errors, 148 pre-existing warnings, none in the new files |
| `npm run build` | pass |
| `check:dead` | 0 orphans |
| `check:exports` | 0 unused exports |
| `check:deps` | pass |
| `check:api-schutz` | pass |
| `check:schema-bezug` | pass. It still lists the already known LOCAL/UNAPPLIED RPCs `admin_account_counts_v1`, `official_truth_store_accepted_v1` and `official_truth_source_catalog_v1`. This slice did not add an RPC. |

## Exact-head gates

GitHub CI, the Auth job and Vercel Preview for the pushed tip are not properties of this prose. They are read after the push. Do not copy a run id from the baseline `146664ac` or from the implementation commit `fa15a813`.

## Stop

No Ready. No merge. No Rule acceptance. No model review. No store, RPC, DB, provider or network path.

**STOP for final Technical-Lead review of the exact branch tip.**
