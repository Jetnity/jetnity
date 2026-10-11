# Official Truth source-bound 128KiB Evidence/custody V2.1 — PLAN

**Bound TASK:** `OFFICIAL_TRUTH_SOURCE_BOUND_128K_EVIDENCE_CUSTODY_V2_1_TASK_2026-10-10.md` (immutable blob `fa3c4ef3addaa0168ca5418e99de90522e758c24`).  
**Scope:** R1 corrections plus exact-head R2 native concurrency/integrity evidence on existing Draft PR #926 only. No hosted writes, source activation, legal acceptance, UI/Auth/RLS, providers, or costs.

## Goal

Keep the 65,536-byte legacy transport and V1 identities intact while selecting a versioned whole-source fingerprint for complete UTF-8 bodies exceeding that byte boundary. Carry protocol 2 through accepted Evidence and historical identity reconstruction without accepting caller-selected hashes, protocol values, or unapproved source profiles.

## Changed areas

- `lib/readiness/official-truth-source-fingerprint-v2.ts`: shared byte/code-unit selection and exact transport-byte consistency.
- Private retrieval, retrieved material, and Evidence construction: use the selector and refuse unrepresentable/unauthorized oversize bodies rather than silently classify them as V1.
- Accepted Evidence and integrated-pilot bundle: exact V1/V2 field sets and protocol-preserving historical identity reconstruction.
- Targeted tests: Unicode byte/unit boundaries and legacy parity.

## Validation and current disposition

On implementation HEAD `8731807082298554a33da845dd765e78c644f2ed` (tree `29b2ee86a7eb89c572ac8b522aaad5020061535d`), the complete `npm test` suite passed **6,275/6,275 tests, 819 suites, 0 failed, skipped, cancelled, or TODO**, in 864,976 ms. Native PostgreSQL 16.15 structural, R2, R3, and integrated custody suites ran in disposable clusters. The V2 integrated proof passed with exact retry integrity, receipt trigger refusal/rollback, no-healing row counts, and two additional barrier-controlled concurrent identical-retry trials (14,559 ms and 14,613 ms); the initial simultaneous insert/idempotent pair completed in 12,431 ms / 16,883 ms. No `55P03` or `57014` occurred in these bounded trials.

Typecheck, production build, `check:setup:ci`, API protection, schema reference, dead-route, export, dependency and diff checks passed. ESLint exited 0 with 144 warnings / 0 errors. The operating-mode guard was attempted but is blocked because it invokes `git diff main...HEAD` and the shallow clone has no local `main` ref; the matching remote base is known from the PR and was not turned into a working branch. `npm ci` reported 19 dependency audit advisories (2 moderate, 17 high), not changed or remediated. On the report snapshot `5f83574ca7e78ce634c4de58238f581b967763ba`, exact-head Actions run `38097157157` was `action_required` with zero jobs, Vercel was pending/deploying, and no Auth pass is established. The later documentation-only update requires fresh remote gates.

## Risk and stop conditions

No Bern/AA profile is compiled or approved. Therefore >65,536-byte material remains blocked unless a future separately approved exact code-owned profile authorizes it. Synthetic local SQL success is not source qualification or legal acceptance. Stop for independent Technical Lead R3; keep #926 Draft.
