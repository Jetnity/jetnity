# TASK V1 — Official Truth CH→DE AA Source Identity Qualification 1

Binding tracking: https://github.com/Jetnity/jetnity/issues/1132
Technical Lead: ChatGPT, sole Ready/Merge authority.
Cursor logical agent name: **Jetnity CH-DE AA Source Identity Qualification 1 — Cursor Generation 1** (session readback not yet verified).
Branch: `feat/official-truth-ch-de-aa-source-identity-qualification-1-20261106`.
Initial main: `c1f5feb10fcdac54aa31dbb00749df6b253addd7`; always re-read actual live main.

# Jetnity Official Truth — CH→DE AA Source Identity Qualification 1
**Version:** 1.0, 2026-11-06 (Europe/Zurich)  
**Parent:** #917; independent of platform-blocked #1131  
**Baseline:** `main@c1f5feb10fcdac54aa31dbb00749df6b253addd7`; machine mode `NORMAL` confirmed. Live SHA dominates this snapshot.  
**Agent (assigned logical name only, not yet a proven session):** `Jetnity CH-DE AA Source Identity Qualification 1 — Cursor Generation 1`  
**Authority:** Technical Lead owns review, Ready and merge. Cursor code-only writer; never Ready/merge; no follow-on slice.

## Problem / expected outcome
`CH→DE CAND-VISA-001` is qualified for *technical preparation* only after independent file integrity checking: seven country RESEARCH_ONLY packages, 25/25 manifested files SHA-256 match; 61 candidates (37 preliminary review-ready / 24 blocked). The AA official table lists Switzerland `Nein`, backed publicly by the German Embassy Bern, but these are not accepted official Evidence/Rule. The current server-owned retrieval has default `BODY_MAX=65,536`, while Grok's AA HTML source observation was 93,365 bytes and Bern 71,532 bytes. Only a dormant *Bern* 128KiB identity-specific exception exists (`officialTruthChDeSourceBudget128k1`); there is **no generic authorization to raise the limit** or a registered AA real-source identity.

**Deliverable:** A small, fail-closed, source-specific *offline code preparation* showing whether AA's official visa-table HTML can be safely bound to a verified representation/identity and a bounded `<=131,072`-byte exception **without asserting real-source custody or accepting the research as truth**. If source-profile requirements cannot be satisfied without real source evidence, leave runtime gated OFF and produce a precise STOP + negative tests rather than inventing an identity or expanding generic trust.

## Scope allowed
1. Read actual main / repo operating standard / existing `official-truth-ch-de-aa-s1-visa-row-research-server.ts`, `official-truth-content-identity.ts`, `official-truth-server-owned-retrieval.ts`, `official-truth-ch-de-source-budget-128k-1.ts`, existing tests and #1128/#1129 notes. Do not copy Grok proposal to accepted evidence.
2. Design/implement narrowly isolated source-specific AA *dormant* profile or gated qualification seam only when supported by existing content-identity contracts. Retain strict authority/representation URL, media type, exact source identity and full-source completeness. No site-wide/content-type-wide 128KiB.
3. Add synthetic adversarial tests: expected `Schweiz | Nein` without marker; missing, duplicated, footnoted `Nein (1)`, contradictory rows; wrong URL, redirect/final URL drift, wrong media type/identity, short/truncated body, declared-vs-observed byte mismatch, oversized response, unregistered profile. All fail closed. No test should imply that a real source GET or a real RLS readback happened.
4. Document precisely any prereqs requiring an approved authority profile/registered identity or real hosted readback, and distinguish synthetic parse validation from official-source custody.
5. Return one Draft PR and versioned handoff/evidence, preserving exact head, changed files and CI outcomes. Root/TL will independently re-gate.

## Explicit non-scope / STOP
- **No** real government-source network request, hidden source admission, live provider, Supabase Dev/Production readback or apply, original-custody receipt creation, accepted Evidence, `trustedRuleFact`, `regelKandidatAkzeptieren` promotion, accepted-store writer call, Trip Workspace live output, secret use, paid API or indexing.
- **Do not edit/replace/cherry-pick blocked #1131** or attempt Ready/merge via any alternate path. Its Content-Length/native-framing hardening may be treated as a dependency to **wait for**, never silently copied to work around the prior platform refusal.
- **No** schema migration, RLS/Auth change, generic body limit increase, source allowlist broadening, cross-country import, new provider, routing through alternate operator to redo denied #917 Stage1.
- Swiss right of free movement: **never** infer 90/180 stay cap from AA footnote 1. Missing transit/passport page counts = unknown, not not_required. Conflicts/ambiguous/footnoted HTML block.
- Source candidate values `ev2_`, `evidence-key:v3:`, `rule-scope:v1:` must be deterministically calculated only from actual trusted inputs; never invent real IDs/hashes/origin.
- If blocked or incompatible, state `BLOCKED` and stop; do not weaken checks. `RESEARCH_ONLY / NOT_APPROVED_FOR_DATABASE_IMPORT` remains unchanged.

## Acceptance criteria / review gates
- Exact-head focused tests, full native CI if available, typecheck, lint and build green, zero security regressions. Tests show both positive **synthetic** cell and all relevant negative paths. Auth/DB/Production tests not claimed when not run.
- Narrow diff confined to source-identity/budget/AA parser and their tests plus versioned task/handoff, no generic provider change; proof of all changes and no unauthorized live calls.
- Independent TL exact-head patch review; review threads + Vercel checks; actual main drift and post-merge gates only upon an allowed regular integration.
- No Agent Self-PASS, no Agent Ready, **do not merge**, **do not start a follow-up slice**.
- **STOP for TL review**, with CI/check links and exact commit. #917 Stage1 still blocked, Stage2 NOT_ATTEMPTED; #1131 still code-reviewed but platform integration-blocked.

**Related:** https://github.com/Jetnity/jetnity/issues/917#issuecomment-6674686643 (25/25 file integrity closure).

## Branch seed and STOP
This document is the sole first seed commit; it grants no source acceptance, provider/DB writes, real source GET, Ready, Merge or post-merge FOLLOW-ON. Agent must implement only this versioned task and STOP at a Draft PR for independent Technical-Lead review; do not claim a working live source on the basis of synthetic tests.
