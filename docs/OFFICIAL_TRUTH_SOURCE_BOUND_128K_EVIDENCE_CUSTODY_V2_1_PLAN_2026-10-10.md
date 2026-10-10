# Official Truth source-bound 128KiB Evidence/custody V2.1 — PLAN

**Bound TASK:** `OFFICIAL_TRUTH_SOURCE_BOUND_128K_EVIDENCE_CUSTODY_V2_1_TASK_2026-10-10.md` (immutable blob `fa3c4ef3addaa0168ca5418e99de90522e758c24`).  
**Scope:** R1 corrections on existing Draft PR #926 only. No hosted writes, source activation, legal acceptance, UI/Auth/RLS, providers, or costs.

## Goal

Keep the 65,536-byte legacy transport and V1 identities intact while selecting a versioned whole-source fingerprint for complete UTF-8 bodies exceeding that byte boundary. Carry protocol 2 through accepted Evidence and historical identity reconstruction without accepting caller-selected hashes, protocol values, or unapproved source profiles.

## Changed areas

- `lib/readiness/official-truth-source-fingerprint-v2.ts`: shared byte/code-unit selection and exact transport-byte consistency.
- Private retrieval, retrieved material, and Evidence construction: use the selector and refuse unrepresentable/unauthorized oversize bodies rather than silently classify them as V1.
- Accepted Evidence and integrated-pilot bundle: exact V1/V2 field sets and protocol-preserving historical identity reconstruction.
- Targeted tests: Unicode byte/unit boundaries and legacy parity.

## Validation and current disposition

Focused retrieval/Evidence/accepted/replay tests passed (85/85), store tests including disposable PostgreSQL passed (22/22), schema-reference regression passed (4/4), typecheck and production build passed. The serial full suite ended 6,273/6,275: the first failure was the stale local-RPC test inventory and now passes standalone; the remaining failure is a concurrent local bundle writer receiving PostgreSQL `55P03`, not yet reproduced or resolved. `check:operating-mode` could not run because this shallow clone has no local `main` ref. Exact-head CI/Auth/Preview and complete task acceptance remain unverified.

## Risk and stop conditions

No Bern/AA profile is compiled or approved. Therefore >65,536-byte material remains blocked unless a future separately approved exact code-owned profile authorizes it. Synthetic structural SQL success is not source qualification or legal acceptance. Stop for independent Technical Lead R2; keep #926 Draft.
