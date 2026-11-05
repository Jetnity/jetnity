# Official Truth Grok Research Intake Quarantine V1 — Bounded Technical-Lead Task

Date: 2026-11-05 (Europe/Zurich)  
Tracking: #1120; product autonomy #741; first real source #917  
Baseline: main `3ea3fafb5638972ffbcb28ddcc93be63800ebcaa`  
Writer: Technical Lead direct, because Cursor, Work, Codex and GitHub Copilot are unavailable.  
Branch: `feat/official-truth-grok-intake-quarantine-v1-20261105`

## Purpose

Build an offline, deterministic first intake for the **actual** paired V1 Grok `candidate-package.json` + `verification.json` handoffs from the Chief of Staff. The source was inspected in the owner's ZIP `jetnity-ch-5-laender-research-only.zip` (SHA-256 `034762b0db32e2116bb810eb405f81272482af5b12e34b6fbbf0e99addcc8a7b`), which contains 15 files under `ch-it/fr/es/jp/us`, 41 candidates, 24 bot-proposed for TL qualification and 17 bot-blocked. Those labels are **self-reported**, not independent acceptance or source truth.

Re-use existing `OFFICIAL_REQUIREMENT_TYPES`, `REGEL_FAKT_ARTEN` and `OFFICIAL_VISA_MODES`. A new engine, official rule, source fetch, source admission or DB writer is not permitted. The older normalized `kandidatenChargeValidieren` input format is **not** the rich raw Grok schema; do not cast the two shapes or silently lose legal scope, candidate IDs or source references.

## V1 acceptance

- Accept only exact schema 1 package and verification pairing with matching package/country IDs and a non-future externally supplied reference time.
- Require RESEARCH_ONLY boundary, no stated DB writes, expected CH ordinary Swiss passport and explicit IT/FR/ES/JP/US country scope; verify the source-reference graph and candidate identity/count pairing.
- Separate the bot's `candidate_ready_for_TL_qualification` label from independently admitted Evidence, accepted Rule and SQL import permission. Every return remains **quarantined**, with 0 accepted Rules and 0 DB writes.
- Detect the known US ESTA classification mismatch and the non-existent stay-limit `max_days` target, plus unsupported enum values, missing sources and invalid candidate scope. Report only bounded sanitized candidate IDs/reason codes; never emit raw source texts or user-sensitive fields.
- Synthetic tests for positive quarantine and negative cases; native CI and independent review before any Merge. No unearned Hosted Source/SQL claims from offline tests.
- This unit only prepares a structured review queue entry. No invocation from an API, scheduler, browser or production app until a separate server-owned authorization/custody/DB write slice is proven and its particular Production gates resolved.

## Hard exclusions

No Supabase SQL/Apply/Readback (original denied Stage1 #917 remains STOP), no DB migration, no key, provider/model call, source fetch, personal data, accepted Evidence or Rule, no `requirementsProviderAus()` enablement, no #985/#937 changes, no truth promotion and no direct REST transport. No original ZIP contents are committed to the public repository.

## STOP / Review

Keep Draft until all native CI gates pass and a separate independent reviewer has inspected exact head, full changed files, output no-truth contract and known data-model issues. No autonomous Ready/Merge by a code-writing agent. Later live queue writer, deterministic-source recheck and owner-supervised autonomous promotion are separate gated slices.
