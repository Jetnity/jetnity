# Official Truth GOV.UK Profile Activation 1 — Handoff

Date: 4 October 2026. Issue #824, [Draft PR #825](https://github.com/Jetnity/jetnity/pull/825).

Writer: **Jetnity Official Truth GOV.UK profile activation 1**, Generation 1, Codex session `01a1084b-0881-76a2-a0e3-ea4554f57eb2`; observed `gpt-6-astra` / `xhigh`. No delegated writer.

Status: **IMPLEMENTED / LOCAL SQL PROOFS ENVIRONMENT-BLOCKED / STOP FOR INDEPENDENT REVIEW**. No Technical-Lead PASS is claimed.

## Exact delivery identity

- Branch: `feat/official-truth-govuk-profile-activation-1`.
- Baseline/merge-base: `49cef6463da0bce02a8127214cc93b6eaded2a57`.
- Immutable seed: `4aab83aa7753c7c30f8c762e6cc1d277a5cd98a2`.
- Task SHA-256: `df6c5bc4ae3739c6e05d79728d60fd1bc4cb673cc0974b785134ef59dcdd08ba`; Git blob `2f270be9ed0c21713015487a88cc16ca1b459017`.
- Bind review to the final pushed SHA in the delivery receipt and its post-commit gate ledger. The receipt also records freshly fetched main, ahead/behind, Draft state and CI/Preview observations.
- Full changed-file list: REPORT, section Files; ten files against baseline, including the unchanged seed task. Exactly one production file changes.

## Delivered behavior and evidence

The frozen production content-identity registry contains precisely the existing `GOVUK_ETA_NATIONAL_LIST_CONTENT_API_IDENTITY_PROFILE` object: `govuk-eta-national-list-content-api-en`, v1, current. Its implementation and verifier are unchanged. TypeScript erases its reverse type-only dependency; fresh imports in both orders prove singleton availability without I/O or verifier/acceptance execution. The importer guard permits exactly the registry module.

Default-registry registration succeeds with an injected catalog transport and no injected profiles, but never runs the verifier. Wrong profiles, sources, URL ownership and changed replay remain blocked before write; malformed RPC responses remain failures. Default retrieval verifies synthetic server-received material, binds the exact tuple, rejects caller executable/material authority and rejects forged verifier return tuples. Missing v2 produces sanitized failure through the real transport with fake fetch: one v2 read, no fallback or registration/apply. Extractor/composition/region-pin registries remain empty.

Implementation-tree verification: focused 538/539 pass, full 5,138/5,141 pass; all remaining failures are missing local Linux-path `initdb`. Zero skips. Typecheck, lint (149 existing warnings, zero errors), operating-mode/API/schema/dead/export/dependency checks and build pass. The final receipt records repetitions on the committed head. REPORT contains commands, limits and tooling retry details.

No hosted Supabase/GOV.UK call, registration, DB write/apply, migration/Auth/RLS change or F8 occurred. Live database-state statements come from #751, not new writer reads. No recurring cost or new infrastructure.

## First unfinished action: independent exact-head TL review

1. Re-read live main/mode/#751 and relevant #748 after processed marker `5982622080`. Latest subsequent receipt observed by the writer was `5982683597`, continuity-only/no blocker. Check writer collision, new Product-Owner decisions, current Draft head and review threads.
2. Compare the entire ten-file diff, task bytes against the seed, and unchanged verifier module. Confirm that the production diff is only one import plus one frozen singleton entry.
3. Independently attack singleton object identity, exact importer paths, erased reverse dependency, import dormancy, default gateway verifier non-execution, source/URL/replay boundaries, server-owned verifier input, all seven tuple rebind fields and missing-v2 error paths. Writer self-review is not this review.
4. Verify exact-head Linux CI including the three disposable PostgreSQL proofs, and exact-head Vercel Preview. Local Mac failures cannot establish SQL PASS. Refresh head before any verdict.
5. If needed, issue CHANGES REQUIRED to this same session/branch. Only Technical Lead decides Ready/Merge after independent review; a changed head requires fresh evidence.

This handoff does not start a later slice. Any future Development source/content registration needs its separate Product-Owner gate after independent integration/post-merge verification. Production Official Truth, extractor/composition/region-pin/Rule facts and F8 remain outside this delivery.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.** Remain Draft. No Ready, merge or follow-up.
