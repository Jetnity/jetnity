# Jetnity Official Truth Grok Bridge V2 — Seven-Country Review-Queue Handoff

**Date:** 2026-11-06 Europe/Zurich  
**Parent:** #917, V1 #1120/#1124, this task #1134, Draft PR #1135.  
**Author:** ChatGPT Technical Lead direct code-only (Cursor unavailable; Owner's separate Copilot token task not touched).  
**Initial main:** `7c66522a09253634efe0c346e9569c5b2c2c9e10`. Verify live main and PR head again before any decision.

## Existing V1 (preserved)
`grokRecherchePaketQuarantaene` and `grokForschungsReviewQueueVorbereiten` still admit only IT, FR, ES, JP, US, use **original schema_version=1 candidate-package.json + verification.json**, require `hard_limits_respected === true` and `ordinary Swiss passport (product scope)`, and retain `grok-*:v1:` key namespaces. They do not call Supabase, activate sources, use model output as truth, or accept Rule facts.

## New bounded V2
- Versioned `grokRecherchePaketQuarantaeneBridgeV2` and `grokForschungsReviewQueueVorbereitenV2` reuse the V1 validation/queue logic rather than inventing another engine. Closed DE/TH/IT/FR/ES/JP/US, 1–7 original paired raw inputs, no `candidate-package.v2.json` as authority. All verified/candidate data stays untrusted.
- DE and TH originals are structurally distinct: **both omit `hard_limits_respected`** (not false), TH `traveller_scope.document` is `ordinary Swiss passport` (not product-scope alias). In V2 only these exact cases can enter the research review queue. An omitted limits attestation is explicitly `researchLimitsAttestation=missing_in_original` instead of silently `true`; if declared, it is `bot_reported_only` and still NOT independently certified. A supplied `false` or wrong-type value is blocked. Other five countries retain strict true requirement; passport scope cannot be cross-labelled.
- V2 uses disjoint `grok-submission:v2:`, `grok-review-item:v2:`, `grok-review-queue:v2:` SHA namespaces; hashes of caller-supplied data are *replay/idempotency labels only*, never the actual verified official source hash.
- Source URLs, original text/quotes, suggested facts, names and private information are **not echoed** in queue results. All output remains `RESEARCH_ONLY`, `NOT_APPROVED_FOR_DATABASE_IMPORT`, `sourceCustody=not_verified`, `verifierIndependence=same_executor_not_independent`, `acceptedRules=0`, `databaseWrites=0`.
- Input object traversal is strengthened to reject accessors, cyclic aliasing, symbols, non-finite numbers, sparse arrays and fields with sensitive personal data; no getter is interpreted as an approval. The V1 observable result for normal valid JSON remains compatible.

## Test coverage / boundaries
- New `lib/readiness/official-truth-grok-review-queue-v2-server.test.ts`: synthetically mimics the actual DE/TH differences, exercises seven-country mixed/deterministic replay, verifies V1 unchanged and disjoint V2 keys, bot-blocked/unsupported fact, invalid passport alias, false/missing attestations, extra approval data, forged country/verification, duplicate ID/country, malformed JSON, malicious getter/proxy, PII, and strict no network/DB/Provider.
- No actual Grok raw JSON, secret or government source body was committed. Owner's seven country originals were previously independently SHA-confirmed 25/25 versus Grok-supplied manifest under #917 (a file integrity check, not official-source verification); they are not native CI test vectors.
- Source category and legal applicability are not admitted: Grok reports 61 candidates, 37 ready for *TL qualification only* / 24 research-blocked. V2 structural queue may flag additional noncanonical facts; **do not conflate any counts with approved legal regulations**.
- No real official HTTP GET, no trusted Source Registry/Custody, no Evidence/Rule acceptance, no Supabase Dev/Production readback/migration, no RLS/Auth, no payment/provider, no production visa answer. #917 Stage1 hosted readback still UNVERIFIED, Stage2 NOT_ATTEMPTED. #1131 platform-denied Ready remains OPEN/DRAFT; #985/#937 preserved. No reimplementation, alternate API or bypass of blocked action.

## Decision gate
Current PR is **DRAFT** until exact-head CI Typecheck/Lint/full tests/Build/Auth, code security review, current main diff, Vercel status and latest Copilot writer collision checks are complete. This report is not a PASS. Root TL must inspect final head independently and document the accurate result. If a necessary identity/profile/hosted DB action remains blocked, record STOP, never bypass.

No automatic follow-up slice; no self-Ready/Merge by external agents.
