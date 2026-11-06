# Jetnity CH→DE AA Source Qualification — TL Root Code-Only Handoff

**Date:** 2026-11-06, Europe/Zurich  
**Parent:** #917  
**Task:** #1132 / `docs/OFFICIAL_TRUTH_CH_DE_AA_SOURCE_IDENTITY_QUALIFICATION_1_TASK_2026-11-06.md`  
**Draft:** #1133 on `feat/official-truth-ch-de-aa-source-identity-qualification-1-20261106`  
**Initial main:** `c1f5feb10fcdac54aa31dbb00749df6b253addd7`  
**Author:** ChatGPT Technical Lead (direct edits through GitHub). No Cursor changes: cursor[bot] reply in PR #1133 confirms background-agent budget blocked; owner says availability resumes 2026-11-16. No billing or provider was activated.

## Actual code-only implementation
- `lib/readiness/official-truth-ch-de-aa-source-qualification-offline-1.ts`: a standalone server-only, in-memory **research diagnostic**, with exact pinned German AA visa-list URL and `text/html`. It does not fetch source bytes or register a source, content item, representation or identity profile. A status-200/zero-redirect/identical final-URL/valid HTML-only observation still carries `sourceCustody=not_verified`, `responseCompleteness=not_verified`, `identityProfile=not_registered` and zero accepted evidence/rules/DB writes.
- Candidate-only diagnostic cap `131_072` bytes; existing transport-wide `65_536` cap, live source registry and `officialTruthChDeSourceBudget128k1` untouched. `requiresSourceSpecificBudgetQualification` is just an in-memory signal when supplied synthetic HTML exceeds the normal cap, **never** a permit to fetch or change source budgets.
- Uses the already-merged offline parser `chDeAaS1VisaRowResearchFromHtml` to inspect `Schweiz | Nein` in the single correctly headed table, with no footnote/duplicate/contradictory Swiss rows.
- Closed six-field envelope, no caller-provided origin receipt, hash, checkedAt, accepted proof, credentials, bytes declaration or model authority. Hostile prototypes, getters, proxy failures and proxy getters must not become a source of trust; the adapter snapshots own data descriptors and fails closed on exceptions.
- `lib/readiness/official-truth-ch-de-aa-source-qualification-offline-1.test.ts`: synthetic positive observation plus oversized (~94k) HTML, wrong/mutated/final URL, redirects, media type/charset/status, missing/doubled/footnoted Swiss row, truncated-before-table, parseable-after-table truncation remaining **explicitly unverified**, extra forged content-length/receipt/credential fields and proxy tests. Tests never touch hosted Government/Development endpoints.

## What this does NOT prove
1. **No registered AA content-identity profile**. Current registry has only the pre-existing code-approved profile(s). An invented AA source ID/proposal cannot be treated as `ContentEvidenceIdentity`. The research source candidate ID is not a catalog admission.
2. No real AA response bytes, TLS/DNS/final redirects, effective source fingerprint, publication/legal validity or `trustedRuleFact`. Research snapshots, even with SHA-256 and HTTP-200 notes, cannot become accepted Evidence automatically.
3. No real HTTP full-source completeness claim. The **separate and unmerged platform-blocked PR #1131** owns declared `Content-Length`/native framing verification. This diagnostic deliberately does not implement/copy/merge that fix. A parseable truncated HTML tail is possible and remains **not_verified**.
4. No hosted Development Stage1 readback under #917, no Stage2. No Supabase/Production, RLS/Auth, provider, payment, secrets, Google, visitor-facing Trip Workspace data or public indexing. The special PO gates remain in force.
5. Not a default transport permission increase, not a new extractor profile registration or acceptance / import of any of 61 Grok RESEARCH_ONLY records.

## Technical Lead integration decision
- **Code-only qualification preparation, status DRAFT.** A later genuinely approved AA source profile/representation, explicit source-specific byte budget, complete native transport, source custody, official claim qualification, the legitimate #917 hosted checks and separate Product Owner release gates are required before real data can be accepted.
- Synthetic tests/typecheck/lint/build/CI must be verified at the *actual final PR head*. Do not infer a CI PASS from a previous cancelled run. No Ready/Merge on a synthetic test result alone.
- The known independent #1131 refusal is not permission to route its blocked work into #1133; no bypass. Keep #1133 DRAFT until review and integration gates permit a scoped decision.
- **STOP after code-only evidence.** The next agent, if any, must not self-Ready/Merge or start a follow-on slice.
