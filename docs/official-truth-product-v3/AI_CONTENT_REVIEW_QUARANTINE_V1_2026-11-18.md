# Official Truth AI Content Review – quarantined offline seam V1

**Date:** 18 November 2026  
**Binding architecture:** [Owner decision #1232](https://github.com/Jetnity/jetnity/issues/1232), [docs #1233](https://github.com/Jetnity/jetnity/pull/1233), [autonomy #741](https://github.com/Jetnity/jetnity/issues/741).  
**State:** **Offline code + synthetic regression only. Not a live AI model call, not legal review, not a release mechanism.**

## Why this first slice exists

Jetnity has an existing deterministic `officialTruthRegelReviewVorschlag()` validator that reconstructs canonical Official-Truth review packets from source-held input and tests citations against the actual support-version IDs. The new tiny adapter **reuses** this exact boundary instead of introducing a second AI truth engine or a second model-specific source checker.

`lib/readiness/official-truth-ai-review-quarantine-v1.ts`:

- Accepts a **server-held packetInput** separately from a JSON model suggestion; the model may only supply `assessment`, `citedSupportVersionIds`, and `reasonCodes`. Rejects extra keys, models that try to supply `packetInput`, credentials, arbitrary URLs, approval flags, free-form chat text, getters, oversized payloads or invalid arrays.
- The existing validator **reconstructs and re-proves** packet/source/claim identity, citation membership, consistency, fact-kind/credential scope and reasons. A plausible model sentence is not a source.
- OpenAI is the primary suggested analyst; Grok is an **optional, risk-triggered independent challenger**. If elevated-risk source analysis has no Grok result, status stays `INDEPENDENT_REVIEW_REQUIRED`. Disagreement becomes `CONFLICT_OR_GAP_REQUIRES_REVIEW`.
- Even if **both** support the same candidate, output is only `AGREEING_RESEARCH_ONLY`: zero accepted facts, zero publication permission, **no SQL write**. The actual MA1/BG1/Owner or versioned automatic-acceptance procedure remains separate.
- Output excludes source raw HTML, URLs, passport numbers, personal data and any model-authorized `trustedRuleFact`. It carries only a packet identity, non-authoritative classification and citation IDs.
- This component contains **no** external call, credentials, database connector, provider SDK, scheduler, migrations, public endpoint or allowed runtime activation. In particular it does not invoke OpenAI or xAI automatically.

## Deterministic integration path (future separate Owner gates)

1. A trusted Jetnity retrieval assembles the existing Official-Truth Rule Review Packet from registered government primary sources, including exact original content, hash, `retrievedAt`, scope and credential selection.
2. A separately authorized cost-guarded worker may supply the **model response** to this boundary, never the packet. A model timeout, no valid citation or privacy problem fails closed.
3. On material/critical changes, the separate xAI provider may independently review the **same verified packet**; disagreement cannot be resolved by model vote.
4. Only the already approved, independent acceptance method can perform a publication after complete source/date/policy/MA1/BG1 re-proof. The current private 206×50 RESEARCH_ONLY queue ([#1228](https://github.com/Jetnity/jetnity/pull/1228)) is not accepted legal evidence; it cannot be fed straight into a live rule.
5. Provider activation, costs, new roles, secrets, Cron, migrations, Production, and releases all stay explicitly Owner-gated.

## Tests and release limitations

Synthetic official `.example` sources and the existing canonical packet test machinery cover valid primary review, mismatching or fabricated version IDs, identity drift, OpenAI/Grok agreement, contradictory findings, missing high-risk challenger, unknown props, spoofed approval, PII keys, bad JSON, oversized input, getters and sparse arrays.

**This slice does not check the semantic accuracy of model interpretation or convert raw HTML to legal facts.** It only proves the quarantine and comparison seam without cost. Do not describe it as completed autonomous AI verification.
