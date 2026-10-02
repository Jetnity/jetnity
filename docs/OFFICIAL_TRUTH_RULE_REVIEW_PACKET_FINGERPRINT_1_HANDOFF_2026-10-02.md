# Official Truth Rule Review Packet Fingerprint 1 — Handoff

Date: 2 October 2026
Issue: #724
Draft PR: #726
Branch: `feat/official-truth-rule-review-packet-fingerprint-1`
Baseline: `main@146664ac006fc0e79ecbb4d3f77f29cc25c861cf`

Logical agent: **Jetnity Official Truth rule review packet fingerprint 1**, Generation 1
Session: https://cursor.com/agents/bc-c890b1bf-bed1-4307-b21f-34c6b6dfe638
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

## Current state

The branch adds a pure deterministic identity for one re-proven #723 Rule Review Packet. It is a Draft. It is not Ready and not merged.

Read first:

1. `docs/OFFICIAL_TRUTH_RULE_REVIEW_PACKET_FINGERPRINT_1_TASK_2026-10-02.md`
2. `docs/OFFICIAL_TRUTH_RULE_REVIEW_PACKET_FINGERPRINT_1_REPORT_2026-10-02.md`
3. `docs/OFFICIAL_TRUTH_RULE_REVIEW_PACKET_FINGERPRINT_1_SELF_REVIEW_2026-10-02.md`
4. `lib/readiness/official-truth-rule-review-fingerprint.ts`

`docs/ACTIVE_WORK_STATUS.md` was not edited. The task allowlist forbids global continuity. This handoff is the continuity pointer for the slice. The status file still describes an older writer. Do not treat that older section as this slice.

## Session facts

- Machine mode: `NORMAL`. This slice does not edit `.jetnity/operating-mode.json`.
- The task baseline remains `main@146664ac006fc0e79ecbb4d3f77f29cc25c861cf`.
- `git fetch origin main` resolved `origin/main` to that same SHA. Before this docs commit the branch was 0 behind and 2 ahead. Re-fetch before treating any later SHA as current.
- Local gates were run on `fa15a813a72619163d4eb523e9918b0005c8a576`. This docs commit does not change runtime behaviour.
- PostgreSQL 16.15 was installed in this VM for the existing throwaway proofs. The package cluster was not started. No remote database was contacted.

## Trust rule for the next reader

Call `officialTruthRegelReviewPacketFingerprint` with `{ supports, metadata }`.

That is the same original input #723 accepts. Do not pass a packet, a candidate, accepted Evidence, a receipt, support version ids, a content hash, a `reviewPacketKey`, or a trusted rule fact.

The function re-runs `officialTruthRegelReviewPacket`. A blocked packet stays blocked and gets no key. A packet returns:

- `reviewPacketKey` = `review-packet:v1:` + SHA-256 hex of the canonical review material;
- `ruleScopeKey` = the candidate key;
- `supportVersionIds` = the sorted support version ids.

The canonical bytes contain the candidate scope, key, fact kind, evidence quality, sorted support version ids and proposal, plus each support's version id, source id, canonical URL, retrieval time and existing content hash. They do not contain the page snapshot. Object keys are sorted. Support order is not part of the identity.

That key is review-material identity. It is not an accepted Rule Claim. `requirementsProviderAus()` stays `null`.

One call is one canonical cell and one registry image. Another credential option is another call and another fingerprint. Citizenship is not reduced to the issuing country.

## What this slice did not do

- No migration, no Development apply, no Production apply.
- No source-catalog seed and no provider call.
- No model call and no Rule Claim acceptance.
- No UI and no public route.
- No edit to the #723 packet, `digest.ts`, `evidence.ts`, `rule-claims.ts`, #709, #713, #716, #717, or the source registry.
- No follow-up slice. Nothing in the engine calls this function.

## Exact-head gate

The pushed tip is the review head. Its GitHub CI, Auth job and Vercel Preview are not copied into this file in advance.

## Stop

No Ready. No merge. No Supabase apply. No import. No browser, fetch or model research adapter. No Rule acceptance slice and no model-review slice.

**STOP for final Technical-Lead review of the exact branch tip.**
