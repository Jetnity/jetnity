# Official Truth Rule Review Packet Fingerprint 1 — Self-Review

Date: 2 October 2026
Issue: #724
Draft PR: #726
Branch: `feat/official-truth-rule-review-packet-fingerprint-1`

Logical agent: **Jetnity Official Truth rule review packet fingerprint 1**, Generation 1
Session: https://cursor.com/agents/bc-c890b1bf-bed1-4307-b21f-34c6b6dfe638
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This is the author self-review. It is not a Technical-Lead PASS.

## Scope check

The diff against `146664ac006fc0e79ecbb4d3f77f29cc25c861cf` is the task seed plus:

- `lib/readiness/official-truth-rule-review-fingerprint.ts`
- `lib/readiness/official-truth-rule-review-fingerprint.test.ts`
- `docs/OFFICIAL_TRUTH_RULE_REVIEW_PACKET_FINGERPRINT_1_REPORT_2026-10-02.md`
- `docs/OFFICIAL_TRUTH_RULE_REVIEW_PACKET_FINGERPRINT_1_HANDOFF_2026-10-02.md`
- `docs/OFFICIAL_TRUTH_RULE_REVIEW_PACKET_FINGERPRINT_1_SELF_REVIEW_2026-10-02.md`

The binding task file is unchanged. `docs/ACTIVE_WORK_STATUS.md` was not edited, because the allowlist forbids global continuity. Continuity for this slice is the report and the handoff.

No remote Supabase command was run. No migration file was added. The #723 packet, `digest.ts`, `evidence.ts`, `rule-claims.ts`, the retrieval module, the candidate-evidence module, the acceptance module, the rule-candidate module and `source-registry.ts` were not edited. The fingerprint imports only `sha256Hex` and `officialTruthRegelReviewPacket`.

## What I checked in the fingerprint

- One `gov.example` envelope returns a `review-packet:v1:` key. Calling it again returns the same key. The rule-scope key equals the re-proven candidate key. The support version ids equal the candidate's sorted support ids. The output keys are only `status`, `reviewPacketKey`, `ruleScopeKey` and `supportVersionIds`. The snapshot, the canonical URL, the content hash and `electronic_visa` are absent. The input JSON is unchanged. `requirementsProviderAus()` is still `null`.
- Two accepted authorities reversed return the same key and the same two sorted support version ids.
- A changed page changes `sourceContentHash` on the packet. That hash equals `evidenceQuellenFingerprint` of the same text. The fingerprint changes. The fingerprint source does not call `evidenceQuellenFingerprint`, `createHash`, or read `sourceSnapshot`.
- A different path on `gov.example`, an earlier retrieval time, and the interior source with the same page text keep the same content hash and change both the version id and the fingerprint.
- `visa_on_arrival` versus `electronic_visa` changes the key and keeps the rule-scope key and the support version id. `stay_limit` does the same. Explicit versus composed quality on the same two supports changes the key and keeps the rule-scope key and the support version ids. `research_gap` with a null proposal changes the key. A travel date of `2026-11-01` changes the rule-scope key and the fingerprint and keeps the support version id. None of those outputs contain the proposal text or the date.
- A padded extraction note versus the trimmed note, swapped object keys on the support shell, the metadata and the proposal, citizenship listed as `CH` then `RS`, and a CRLF page versus the LF page all return the original key. The CRLF content hash equals the existing evidence fingerprint of the LF page.
- Passing the packet object, a forged packet, the real `reviewPacketKey`, the real content hash, or a trusted-fact field returns a blocked result. The real key, the content hash and the trusted marker are absent. `research_gap` with a non-null proposal stays blocked.
- The Swiss passport and the Serbian passport, both keeping citizenship `CH` and `RS`, return different fingerprints and different rule-scope keys. Passing both supports fails `scope_mismatch` without the country codes.
- `passportNumber` on the metadata and on the support shell fails closed. The secret and the key name are absent. An empty support list and `null` fail closed.
- The runtime file's only imports are `digest` and the #723 packet. It calls `officialTruthRegelReviewPacket` and `sha256Hex`. It does not call the lower bridges, rule acceptance, `Date.now`, `new Date`, `fetch`, or a provider. The existing runtime files named in the test do not import this module.

## Boundary choices a reviewer should see

1. The blocked #723 object is returned as-is. This slice does not invent a second blocked shape and does not attach a key to a failure.
2. After a packet, the support version ids are checked against the candidate again. A mismatch returns the existing `support_mismatch` reason and no key. On the current unmodified packet that guard passes.
3. Object keys in the canonical JSON are sorted here. Arrays inside a proposal keep the order the bridge already built. Only the support list and `supportVersionIds` are sorted as identity-irrelevant order. That matches the task: support order must not change identity, and a second content hash must not be invented.
4. `sourceContentHash` is copied. The snapshot bytes are not. CRLF and LF therefore share a fingerprint only because the existing evidence fingerprint already normalized them inside #723.
5. `ruleScopeKey` is the candidate key. This module does not hash the scope a second time to mint a new scope identity.
6. The prefix `review-packet:v1:` is outside the digest. The canonical object also carries `v: 1`, so a later version can change the hashed bytes on purpose.
7. A caller packet is rejected because its keys are not `supports` and `metadata`. The fingerprint never trusts a pre-built `kandidat`.
8. One fingerprint is one cell. A second credential option is a different key. Route Truth is not rebuilt here.
9. No ADR was added. `DECISIONS.md` is outside the allowlist. The decision lives in this review and the report.
10. `requirementsProviderAus()` is still `null`. This slice does not turn research on.

## Tests and gates

Focused file: 10/10 pass. Full `npm test` on `fa15a813a72619163d4eb523e9918b0005c8a576`: 4381 pass / 0 fail, 756 suites. Typecheck, lint, build, diff check, operating-mode guard and the hygiene checks passed. Lint reports 0 errors and 148 pre-existing warnings, none in the new files. Schema reference still lists the three already known unapplied RPCs. This slice added none.

PostgreSQL 16 was not on the machine at the start. After installing PostgreSQL 16.15 locally, the suite passed, including the existing throwaway cluster proofs. The package cluster was not started. Those proof clusters are local and temporary. No remote database was contacted. This slice did not apply SQL.

## Stop line

The docs commit after `fa15a813` is not a behavior change. GitHub CI, the Auth job and Vercel Preview belong to the pushed tip after that commit. Do not reuse run ids from `fa15a813`. This remains a Draft. No Ready, no merge, and no follow-up acceptance or model-review slice from this writer.

**STOP for final Technical-Lead review of the exact pushed tip.**
