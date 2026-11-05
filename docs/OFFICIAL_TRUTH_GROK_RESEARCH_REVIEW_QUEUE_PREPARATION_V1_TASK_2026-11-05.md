# Grok Official Truth – Research Review Queue Preparation V1

Date: 2026-11-05 (Europe/Zurich)  
Issue: [#1124](https://github.com/Jetnity/jetnity/issues/1124)  
Baseline main: `c6ce9ec69b9db67162811cb7c89cde7cfa1da68c`  
Operating mode: `NORMAL`  
Writer: Technical Lead direct (Copilot / Cursor / Work / Codex not available to Product Owner).

## Problem and concrete advance

The merged [#1121](https://github.com/Jetnity/jetnity/pull/1121) can re-validate **one** raw `candidate-package.json` + `verification.json` Grok research pair, but no first-party batch queue is produced yet. V1 implements the smallest **server-only, strictly inert** multiple-packet review-queue *preparation*. This is a typed, deterministic data boundary and **not a persisted queue, review decision, source identity proof or Supabase integration**.

## Binding implementation

- New `lib/readiness/official-truth-grok-review-queue-v1-server.ts` accepts an array of 1–5 pairs with exact keys `countryCode`, `candidatePackage`, `verification`. Only IT/FR/ES/JP/US are admitted in the current Grok V1 delivery format. Further destinations will need a versioned schema extension, not a silent catch-all.
- The entire inbound batch must contain JSON-like data only. Unexpected keys/accessors/cycles/duplicate countries are rejected before any output; one bad pair blocks the whole batch.
- Every raw pair is independently re-validated by the **already merged** `grokRecherchePaketQuarantaene` using the server-side current UTC instant. A caller cannot supply prevalidated result rows or masquerade as Source Registry, a second independent authority or an approved DB writer.
- Result candidates are sorted by existing V1 intake; country entries are sorted by country. Submission and review keys have explicit `grok-submission:v1:` / `grok-review-item:v1:` / `grok-review-queue:v1:` namespaces. Hash inputs contain the **untrusted model-submitted research JSON**, not verified original government bytes. These keys provide replay/idempotency comparisons only. Equivalent JSON fields in a different order may produce a different submission key: not a canonical government-source identity.
- Result contains only package/candidate IDs, bounded reason codes, per-country bot counts and research-only queue state. No proposed fact text, official URLs, page bodies, travel credential or private details are returned. `needs_independent_source_review` is **not** acceptance.
- Every success has `researchStatus=RESEARCH_ONLY`, `databaseImportStatus=NOT_APPROVED_FOR_DATABASE_IMPORT`, `sourceCustody=not_verified`, `verifierIndependence=same_executor_not_independent`, `acceptedRules=0`, `databaseWrites=0`.
- Synthetic tests cover reordered country inputs, replay IDs, changed raw proposal hash, bot-blocked candidate, duplicate/tampered packet pairs, extra authority fields, no PII echo, nested accessor protection, unsupported US visa mode and no SQL/Network/Provider API.

## Hard non-scope / security

No real official source GET, independent legal interpretation, raw-HTTP custody proof, approval of the 20 remaining structurally unflagged Grok candidates, DB/queue table, Supabase SQL/readback/migration, RLS/ACL/auth modification, scheduled background work, browser endpoint, live source catalog, model/network invocation, secrets, Rule/Evidence acceptance, real provider enablement or production release.

`#917` Stage1 hosted readback remains **platform STOP** and Stage2 **NOT_ATTEMPTED**; it must not be retried, rewritten, delegated, or bypassed. Held #985/#937 unaffected. The V1 worker is not wired to an API or visitor app. `requirementsProviderAus() => null` stays unchanged. This *preparation* has no database side effects.

## Required evidence and stop

- Keep **Draft PR** while native exact-head TypeScript, lint, complete tests, build and Auth checks execute. At task creation the #1121 post-merge main CI [42098022147](https://github.com/Jetnity/jetnity/actions/runs/42098022147) remains in progress. Do not claim POST PASS until terminal.
- Independent technical review must check that the code contains no accidental data-plane/authority bridge. No Ready/Merge solely because CI is green.
- Next separately authorized slice will have to handle **server-owned official-source custody and authenticated review-queue persistence**, with a real, independently auditable authorization boundary and legitimate #917 clearance before hosted DB writes. The present code neither authorizes nor implements that operation.

This is a minimal executable data-admission bridge, not a promise that immigration/health requirements are currently displayed on jetnity.com.
