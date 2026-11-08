## Technical Lead — CHANGES REQUIRED R2 / TASK V1: empty ACL array correction

8 November 2026. Exact affected main/merge #1158: `299409102aadca55945fb376d364dbaa63f65b48`; source `7de58271a2cac2e8376b19c98e602b131c752b44`; tree `c89ce55bbd1b63652d7a80ac94fb7f8dd1125dda`. Mode NORMAL.

### New evidence and correction of previous status
The Owner's [human run 1 report](https://github.com/Jetnity/jetnity/issues/917#issuecomment-6725329847), posted 18:25:54 UTC, records execution at 19:21 Europe/Zurich against the selected Dev/develop project, unchanged main SQL, failure `ERROR: 22023: ACL arrays must be one-dimensional`, and zero result rows. The Owner reports read-only execution and no changes. The report is execution evidence of failure, not a successful catalog baseline or independently attested transaction completion.

The report already existed before TL's 18:29 completion comment and 18:30 continuity checkpoint. Their statements that no human result existed were incorrect. Root missed this new comment during closure and explicitly supersedes those statements. The prior static review and repository CI did not detect the runtime defect. No previous source PASS is accepted as proof of current executability.

### Finite corrective task
Single author remains **Jetnity Official Truth Human Read-only Audit Preparation 1 — Codex Generation 1**, same session `/root/human_audit_writer`. This is the immediate correction of the delivered artifact, not a new product slice or a new agent generation.

Baseline main is pinned above. New correction branch: `fix/official-truth-human-readonly-audit-1-empty-acl-20261108`.
Author may edit only:
- `docs/audits/official-truth-human-readonly-2026-11-08/public-private-catalog.sql`
- `docs/audits/official-truth-human-readonly-2026-11-08/README.md`

Root alone publishes versioned task/review evidence in this same source directory and updates live continuity. No product/runtime/migration/permission/dependency/CI or held-PR changes.

### Required outcome and acceptance
1. Independently establish the exact empty-array/NULL/`aclexplode` behavior from official PostgreSQL sources for the documented version range. Do not rely on the earlier syntax-only check.
2. Prevent an empty zero-dimensional ACL array from reaching `aclexplode` at its actual function argument for every ACL source, not just the newly constructed column array. Do not rely solely on a separate WHERE condition or assumed planner evaluation order.
3. Preserve meaning: NULL schema/relation/routine ACLs use their existing correct hardwired defaults; NULL column ACL means no separate column grant; explicit empty ACL remains empty and must never become default rights; nonempty ACLs retain all entries, grantor/grantee/options; malformed nonempty ACLs must not be silently discarded. Existing column/effective-privilege/default-object metadata and all sixteen output sections remain intact.
4. Keep the read-only transaction envelope, qualified builtins/operators/types, redaction/fingerprint rules, known role/schema coverage and output contract. No new read scope or application function evaluation.
5. Document actual history: human run 1 FAILED/zero rows; corrected source NOT_EXECUTED. Root/AI have not run this audit against Development, Production or any database, and will not do so in this task. No new DB connection/credentials/hosted inventory, blocked-action retry, alternate tool/operator route or target-change.
6. Give the narrow full diff, immutable file hashes, explanation of all ACL edge cases and honest verification boundaries. Root will run bounded nonexecuting parser/dataflow checks and both independent reviewers re-read final bytes. Local models/static checks do not count as PostgreSQL or hosted execution.
7. Full new-head repository CI, Preview, base/diff/threads/ruleset gates before any Root PASS/Ready/normal merge, then actual-main CI and Production/domain verification. Old gates do not transfer.

### Preserved gates and stop
Issue #917 remains OPEN: historical Stage1 APPLY_RESPONSE_SUCCESS / INDEPENDENT_READBACK_PENDING, actual ledger UNKNOWN, Stage2 NOT_ATTEMPTED. Issue #1139 remains OPEN. PR #1131 retains its separate hold. The human failure does not establish catalog absence, clearance, migration state or feature activation. Other Owner/source/key/retention/Production/launch gates remain unchanged.

Author delivers frozen source and stops for independent review. **Do not mark Ready. Do not merge. Do not start a follow-up slice.** Root alone decides integration. Any further finding returns to this same author/session.
