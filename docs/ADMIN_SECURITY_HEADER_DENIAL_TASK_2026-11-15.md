# Security console header denial — bounded extension of #1201

## Authority and baseline

Sasa's autonomous Dev/Admin instruction remains the authority. This extension is based on #1201 implementation `e49f933ece58076628a186103d526503fa8bcb41`. Its first complete CI run is allowed to finish before the extension advances the same Draft branch. Task publication does not move that branch while CI is running. Root is the sole writer; `/root/product_audit` and `/root/admin_audit` review read-only.

## Verified defect and result

`SecurityWidget` waits for JSON before acting on read and blocklist-write 401/403 responses. Although its existing state machine correctly clears rejected data after parsing, a stalled body delays that protection indefinitely. This is the same bounded denial class already corrected for Payments and Operations reports.

Current denial headers must reach the existing denied state without consuming or awaiting their body. Rows, KPI values and operation details disappear; a later explicitly accepted read may restore records. No blocklist write is automatically repeated. The existing fixed safe error texts remain; no server error body needs to be displayed.

## Scope and acceptance

- Edit only `components/admin/security/SecurityWidget.tsx`, additive controls in the existing `scripts/admin-security-console-completion-1/harness.tsx`, a new focused `lib/admin/security/header-denial.browser.test.ts`, and the dedicated #1201 task/handoff/PR record.
- GET denial may supply an immediately resolved empty body to the existing decoder because status alone determines denial. Keep mounted and authoritative-read identity checks before applying the state transition. A stale denied read cannot replace a newer accepted report.
- POST must check mounted/epoch before parsing, process 401/403 immediately, and retain the second mounted/epoch check after parsing all other responses. Denial still advances both the denial epoch and latest-read identity, invalidating older reads and writes.
- Cancel an unused denied body only on a best-effort basis; never await cancellation before protecting the view. Preserve existing retry, poll, per-IP operation identity, safe copy and local-only blocklist semantics.
- Mounted synthetic regression cases cover 401 and 403 for GET, block and unblock; current read recovery without replaying a write; delayed accepted read after write denial; stale read denial after newer accepted read; delayed accepted write body after newer denial; and unmount. Use existing dependencies and actual component/CSS. The controlled transport may ignore cancellation so identity checks must carry the protection.
- Run focused Admin tests, TypeScript, lint and existing CI. Collect the complete prior and next CI result, then bundle any actual failures. The existing #1201 tests remain intact.

## Boundaries and stop

No API, Auth/MFA, capability, RLS, database, blocklist enforcement, input-validation, provider, ENV, package or workflow change. All #1196/#1197/#1198 paths remain untouched. No hosted account action, browser login, real blocklist write or external call. Production, merges, new costs and login/2FA remain with Sasa.

Independent review and exact-head CI are required for this extension. Prior e49 evidence is historical and does not certify new files. **Do not mark Ready; do not merge.**
