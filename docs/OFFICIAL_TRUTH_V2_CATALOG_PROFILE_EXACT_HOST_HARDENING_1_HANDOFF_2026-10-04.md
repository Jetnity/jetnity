# Official Truth v2 Catalog Profile + Exact-Host Hardening 1 — Handoff

Issue #834 / Draft PR #835. Generation 1. **STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**

Read the immutable [TASK](OFFICIAL_TRUTH_V2_CATALOG_PROFILE_EXACT_HOST_HARDENING_1_TASK_2026-10-04.md), [REPORT](OFFICIAL_TRUTH_V2_CATALOG_PROFILE_EXACT_HOST_HARDENING_1_REPORT_2026-10-04.md) and [SELF_REVIEW](OFFICIAL_TRUTH_V2_CATALOG_PROFILE_EXACT_HOST_HARDENING_1_SELF_REVIEW_2026-10-04.md). PR #835's delivery description identifies the final exact commit/tree, merge-base, ahead/behind and live readback.

## Review target

1. Pure `quellenUrlExaktAufloesen` in `source-registry.ts` and its two Content Identity call sites. General source descendant behavior is preserved; exact content hosts and blocked-domain behavior must agree with SQL.
2. New migration `20261004223959_official_truth_v2_catalog_hardening_1.sql`, SHA-256 `79aca6b41da85d826960435ec0eb7833445015072bebee12585c279d952032f5`. Review inert metadata, FK, current-pin check before replay, existing trigger extension, exact SQL host rule, immutable pins and ACLs. Executable verifier authority stays in code.
3. `official-truth-catalog-hardening-schema.test.ts`: local S1-like upgrade with unchanged rows/read response, atomic negative cases, RLS/privileges, rollback of incompatible upgrade and Evidence/Rule eligibility. It requires PostgreSQL 16 binaries at `/usr/lib/postgresql/16/bin`, as the repository's existing local SQL test environment does; missing binaries are a failure, not a silent skip.
4. Catalog/Content Identity tests prove default GOV.UK success, no write after bad host or missing code profile, no verifier invocation and import/network dormancy. Shared R2 fixture host enumeration and six catalog-mock corrections adapt synthetic data without broadening production authority.

## Evidence

- Main/merge-base: `85a53346a87b6175f9e0ffad9901ff6bd45a2654`; seed: `1843c30b7cc1bcf14871f526622629fd0bca5e79`.
- TASK SHA-256: `013bf9a1f370f6252739596033a08b5ea4b8a91c3bd203a37f2980f27ed82041`, unchanged.
- 5,246 tests pass, zero skips/failures; typecheck, lint (149 existing warnings), five hygiene checks, operating-mode check and container production build pass. Environment limits and initial failures are disclosed in REPORT.
- Model: Codex Desktop `gpt-6-astra` / `xhigh`; session and turn evidence in REPORT.
- #833's accepted head `977058e8526b8eaf464f192d2954bbd11e2048b7` is file-disjoint and on coordination hold. Do not absorb or edit its slice.

## Strict continuation boundary

This writer has no Technical-Lead PASS authority. Keep #835 Draft pending independent exact-head review. No hosted Development/Production access or apply occurred. No Vercel/Production action was initiated by the writer. GitHub integration CI/preview, if triggered by branch delivery, is separate from writer-driven deployment and is not claimed as accepted here.

Do not run plain `db push`. Keep `20261002154952_official_truth_owner_reviewer_capability_1.sql` unchanged and unapplied. This new migration also remains unapplied to hosted projects. Only a later explicit Product-Owner approval can authorize its Development apply after independent merge/post-merge verification, followed by a separately named read-only verifier.

#791 remains **NO_SOURCE_FAMILY_PROVEN_YET**. No extractor, Appendix ETA registration, composition, Evidence/Rule feature, region pin, F8 or follow-up slice is authorized by this handoff.
