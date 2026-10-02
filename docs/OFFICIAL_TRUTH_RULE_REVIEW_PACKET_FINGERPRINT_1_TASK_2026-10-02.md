# Official Truth Rule Review Packet Fingerprint 1 — Binding Task

Date: 2 October 2026
Issue: #724
Baseline: `main@146664ac006fc0e79ecbb4d3f77f29cc25c861cf`
Logical agent: **Jetnity Official Truth rule review packet fingerprint 1**
Generation: **1**
Required model: **Grok 4.7 High Fast** — not Auto.

## Goal

Create one deterministic identity for one re-proven #723 Rule Review Packet.

This slice must not trust a caller-built packet and must not accept a Rule Claim.

## Input / trust

Input is exactly the original input accepted by #723 `officialTruthRegelReviewPacket`.

Required flow:
1. Re-run #723 from that original input.
2. Require `status: rule_review_packet`.
3. Build a canonical serialization from only the returned packet's:
   - candidate scope/key/factKind/evidenceQuality/supportVersionIds/proposal;
   - each support's versionId/sourceId/canonicalUrl/retrievedAt/sourceContentHash.
4. Do not use raw support array input order.
5. Do not include `sourceSnapshot` bytes directly in the canonical serialization; the existing `sourceContentHash` is the canonical material identity.
6. Hash canonical serialization with existing `sha256Hex`.
7. Return `review-packet:v1:<64 hex>` plus ruleScopeKey and sorted supportVersionIds.

The fingerprint binds canonical review material identity, not legal truth.

## Hard rules

- no caller-built packet;
- no caller packet hash;
- no timestamp/random UUID;
- no trustedRuleFact;
- no `regelKandidatAkzeptieren`;
- no Rule acceptance;
- no Candidate/Evidence acceptance;
- no store/catalog RPC;
- no Supabase/DB/Auth/RLS;
- no browser/search/OpenAI/model/provider/network;
- no UI/API;
- no personal/sensitive fields;
- `requirementsProviderAus()` stays null.

## Determinism

Prove:
- same canonical packet => same fingerprint;
- reversed support input => same fingerprint;
- different support content hash => different fingerprint;
- different canonical URL/retrievedAt/sourceId/versionId => different fingerprint;
- different proposal/factKind/evidenceQuality/scope => different fingerprint;
- whitespace/key order in caller input that canonical bridges normalize must not create a different identity.

Do not invent a second source-content hash algorithm.

## Output

Equivalent to:
- `status: 'rule_review_packet_fingerprint'`
- `reviewPacketKey`
- `ruleScopeKey`
- `supportVersionIds`

No sourceSnapshot, URL, content hash, proposal, trusted fact or rule result in output.

## Ownership

Allowed:
- `lib/readiness/official-truth-rule-review-fingerprint.ts`
- `lib/readiness/official-truth-rule-review-fingerprint.test.ts`
- `docs/OFFICIAL_TRUTH_RULE_REVIEW_PACKET_FINGERPRINT_1_*`

Read-only:
- #723 review packet;
- digest helper;
- existing Official Truth runtime.

Forbidden:
- modifying existing runtime;
- continuity files;
- store/catalog;
- Supabase/migrations;
- app/components;
- package/lockfile.

Run focused/full tests, typecheck, lint, build, hygiene, git diff --check.
Before final push integrate current main and remain 0 behind.

Stay Draft. Do not Ready or merge. STOP for independent TL review.
