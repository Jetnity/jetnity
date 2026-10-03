# CTA region-pin source audit 1 — Handoff

Date: 4 October 2026 (Europe/Zurich)
Issue: #804 / Draft PR: #805
Branch: `docs/official-truth-cta-region-pin-source-audit-1`
Baseline: `main@ec798ab3b7738b3adc76d85ac8b5223e07e970d9`
Immutable task-seed / dispatch head: `db1f5bfac8689aae314e016a7e6c2beaedde0eab`
Logical writer: **Jetnity Official Truth CTA region-pin source audit 1**, Generation **1**
Execution: Codex Desktop, **GPT-6 Astra — Sehr hoch** (`gpt-6-astra`, `xhigh`)
Status: **DOCS-ONLY / AUTHOR DELIVERY / INDEPENDENT EXACT-HEAD REVIEW REQUIRED**

## Review target

PR #805 remains Draft on the required branch. Review the exact final pushed head reported in the completion message, re-read it from GitHub and invalidate this delivery if it differs. Dispatch head `db1f5bfac8689aae314e016a7e6c2beaedde0eab` is the unchanged task seed, not the completed review head.

Classification: **CTA_REGION_PIN_SOURCE_PROVEN**.

[Primary audit](OFFICIAL_TRUTH_CTA_REGION_PIN_SOURCE_AUDIT_1_2026-10-04.md), [report](OFFICIAL_TRUTH_CTA_REGION_PIN_SOURCE_AUDIT_1_REPORT_2026-10-04.md), [self-review](OFFICIAL_TRUTH_CTA_REGION_PIN_SOURCE_AUDIT_1_SELF_REVIEW_2026-10-04.md).

## What the source proves

Selected official response: `https://www.gov.uk/api/content/government/publications/common-travel-area-guidance/common-travel-area-guidance`.

It is one content item, id `f841223e-d1ae-4a25-9783-bfa7b727ee11`, with Cabinet Office/Home Office metadata. Its first HTML paragraph inside JSON explicitly enumerates every member needed for the candidate sorted set `['GB', 'GG', 'IE', 'IM', 'JE']`. The paragraph uses both Bailiwick names. Neither Channel Islands nor Crown Dependencies is expanded from memory or a second page.

Exact received body: 21,474 bytes; 200; zero redirects; `application/json; charset=utf-8`; fatal UTF-8 PASS. Full response SHA-256: `b0fcb783c5183d527dfe2615a8a3a13cd8b96f4fa6225b5051508ceffde4f1a8`. Repeated direct fetch matched. Retrieval, publisher, content identity, normalized media type, all rejected candidate sizes and all seven fetched official URLs are in the primary audit.

The selected source is within the live limit and every proposed code was executed through the current canonical parser. Do not overclaim: that parser is lexical. The audit separately verified catalogue membership and existing code labels; CI is a real catalogue code for Côte d’Ivoire and cannot represent Channel Islands.

## First action for the Technical Lead

1. Freshly fetch main and confirm the baseline, mode, #751 and #748 MATERIAL newer than `5971622750`. Inspect open writers and exact #805 head/Draft status.
2. Read all five changed files against main. Verify four outputs only were authored and the task seed blob is still `a70d368c33f96fb1ce7e1091ea2d2db5402931c3` (SHA-256 `b55ae9f10a7a06ca2f01caef29e5a258409d279815924071ab217a73e95d36bc`).
3. Independently fetch the exact selected API URL using identity encoding and capture bytes before parsing. Compare current content identity, publisher, membership, body length, fatal UTF-8 and SHA-256 against the recorded response. A changed response is new evidence to investigate, not permission to silently relabel the saved hash.
4. Recheck the one-source argument and code mapping, including UK→GB and separate Jersey/Guernsey entries. Review the full selected body for qualifiers/conflicts. Treat HTML-in-JSON accurately.
5. Review the proposed fragment/identity/version guards. The current evaluator does not implement an automatic refresh or drift monitor. The author ran digest-mutation sensitivity checks, not a production drift validator.
6. Check source trust prerequisites and final-head CI as applicable. Author self-review and source proof do not constitute independent PASS. Only the Technical Lead can Ready/merge after its own gates.

## Reproduction and evidence custody

Direct research used Node HTTPS with `accept-encoding: identity` and `cache-control: no-cache`, a 10-second per-request deadline, 1 MiB research limit, five-redirect cap and official-host validation. The primary audit distinguishes this from production catalogue/DNS-bound retrieval. A reviewer can independently issue those GETs and compute `sha256sum`/`shasum -a 256` on the received bytes before any text conversion. Compare against the live 65,536-byte production ceiling; do not adopt the research limit.

The local `work/source-bytes` scratch holds each response, raw/parsed headers and metadata. `work/source-validation.log`, `work/canonical-parser-proof.log`, `work/fingerprint-proof.log` and `work/focused-tests.log` hold the author checks. They are outside the repository and are not additional committed deliverables or a production evidence store. Review must not assume this local scratch is a durable remote raw-page archive; the four allowed documents contain the reproduction ledger and exact fingerprints. No raw-page retention policy was introduced.

Normal repository test equivalents:

```sh
node --import ./scripts/server-only-test-register.mjs --import tsx --test lib/country/darstellung.test.ts lib/readiness/regulierungs-anwendbarkeit.test.ts
node scripts/operating-mode-guard.mjs
git diff --check origin/main...HEAD
```

On the author's checkout the tsx import used the existing local loader's absolute path. Results: 21/21 tests, 0 skipped, operating-mode guard PASS. Full suite/typecheck/lint/build/UI not run for this docs-only audit; no final-head CI/Vercel claim.

## What remains unimplemented

The region registry is empty; the composition-policy and trusted-fact extractor registries are empty. Schema-1 remains non-persistable; F8 remains OPEN. No real sourceId or catalogue registration exists as a result of this work. The proposed naming pattern is not an identity. Server-held source authority and a fresh trusted retrieval remain prerequisites for any later pin registration; the research fetch cannot replace them.

If independently accepted, the smallest next candidate is a separately dispatched one-pin registration/verification slice as bounded in the primary audit. No multi-source provenance change is necessary for the selected membership statement. No ETA extractor/policy/outcome, acceptance/store/F8, database apply or Production work may be bundled. This writer starts none of it.

## STOP

All delivery remains on #805, Generation 1. No Ready, merge or follow-up. Await independent Technical-Lead exact-head review.
