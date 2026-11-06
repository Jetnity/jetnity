# Jetnity Official Truth — Grok Bridge V2 Seven-country Queue Task V1

Tracking: https://github.com/Jetnity/jetnity/issues/1134
Base main: `7c66522a09253634efe0c346e9569c5b2c2c9e10`.
Single writer: ChatGPT Technical Lead direct; GitHub Copilot reportedly working on separate account-token code. Do not overlap.
Branch: `feat/official-truth-grok-review-queue-v2-7countries-20261106`.

# Official Truth Grok Bridge V2 – 7-country RESEARCH_ONLY review queue extension

**Date:** 06.11.2026, Europe/Zurich  
**Parent:** #917; existing Grok intake/queue #1120/#1124, prior merged #1121/#1125.  
**Live baseline:** main `7c66522a09253634efe0c346e9569c5b2c2c9e10`, machine mode NORMAL. GitHub Copilot reportedly working on a **different token compatibility task**, exact session not proven; never edit its files.  
**Author:** ChatGPT TL direct code-only; Cursor blocked until 16 Nov.  
**No separate Tool/agent to bypass #917 or platform-denied #1131.**

## Goal / problem
Existing `grokRecherchePaketQuarantaene` and `grokForschungsReviewQueueVorbereiten` are deliberately closed to IT/FR/ES/JP/US (V1). Owner-supplied and file-integrity-reviewed Grok Bridge V2 contains **seven** countries including CH→DE and CH→TH. The *original* DE/TH `candidate-package.json` + `verification.json` (schema_version `1`) differ from existing V1: neither explicitly sets `hard_limits_respected`, and TH's scope uses `ordinary Swiss passport` rather than `ordinary Swiss passport (product scope)`. Silently treating a missing field as `true`, relabeling a passport, or misinterpreting V2 `candidate-package.v2.json` as a verified source is prohibited.

## Exact bounded implementation
1. Preserve **unchanged V1 public behavior**, only admitting the prior five countries and requiring the existing exact scope and `hard_limits_respected=true`.
2. Add explicitly versioned **Bridge V2** entry functions reusing the same internal validator and batch coordinator for all seven DE/TH/IT/FR/ES/JP/US; accepts **raw paired original schema_version=1 files**, NOT the annotated `candidate-package.v2.json` or caller-provided approval reports. V2 calls revalidate every package; paired mismatch, extra authority metadata, invalid source refs, unknown countries/IDs, cross-country swaps, duplicates, impossible timestamps, PII, accessors/cycles and oversized input are blocked.
3. DE/TH special cases only: allow *absence* of `hard_limits_respected`, **never** `false` or spoofed `true` from imported data; annotate a clear `unattested_research_limits` caveat on V2 output, *never* mark that as a verification PASS or accepted evidence. Only TH permits exact original document value `ordinary Swiss passport`; keep it as a research literal, do not silently rewrite actual passport scope. Other countries retain strict V1 guards even in V2.
4. Separate V2 queue/submission/review digest namespaces (e.g. `grok-review-queue:v2:`, `grok-submission:v2:`). Digests are untrusted model-submission idempotency keys **NOT** official source fingerprints. Redacted output: country IDs, candidate IDs, findings and bounded metadata caveats only; no source URLs, raw quotes, personal data, trustworthy `trustedRuleFact`, or accepted Row/Rule/Provider.
5. New synthetic tests: DE and TH genuine-shape fixtures, five legacy V2 accepted, seven mixed/reordered deterministic, default V1 still rejects DE/TH, missing V2 attestation flagged, falsified false attestation blocks, wrong document and country aliases block, duplicated countries/candidates, poisoned source URLs or personal fields block, unregistered source/legal gaps remain research-only. Include V2 identity annotation not accepted as input, no DB/network/custody/accepted authority.
6. Keep code diff narrow to existing Grok research intake/queue modules + tests and separate versioned task/handoff. No new data tables, ingestion services, migrations, provider, real external calls, secret access, production Truth, changed operating mode, or automatic promotion.

## Independence & gates
- Versioned Draft PR, exact-head CI TypeScript/Lint/full tests/Build/Auth, independent TL review and only then Ready/Merge if normal action remains allowed.
- Preserve `#917 Stage1 UNVERIFIED / Stage2 NOT_ATTEMPTED`, #1131 OPEN/DRAFT after platform-denied Ready, #985/#937 HOLD, every Grok candidate `RESEARCH_ONLY / NOT_APPROVED_FOR_DATABASE_IMPORT`.
- Do not attempt #917 rejected hosted readback via alternate agent/tools/API, or copy #1131 denied integration into a new PR.
- The queue is **not persisted** and cannot be called by visitor/accepted-store. Stop after bounded code-only review. Owner's existing Copilot job must not be superseded.

**Acceptance outcome:** a deterministic, safe **seven-country research-review preparation**, not an independently validated seven-country legal knowledge base.

**STOP:** all results are offline RESEARCH_ONLY. No Ready/Merge until independent exact-head technical review; do not treat same-executor verification or CI as legal approval. No automatic next slice.
