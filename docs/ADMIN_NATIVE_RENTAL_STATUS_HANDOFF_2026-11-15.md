# Admin native rental configuration and immediate report denial — handoff

## Scope and authority

[Draft PR #1201](https://github.com/Jetnity/jetnity/pull/1201) is an independent follow-up on `main@63544e820e912bd275556588c956a09b99b1cf90`, beside #1199 and stacked #1200. The [versioned task](ADMIN_NATIVE_RENTAL_STATUS_TASK_2026-11-15.md) was published as `b3f0e7685da8308ab00748c7544781834167c949` before implementation. Sasa authorizes necessary Dev work; Production, merges, new costs and login/2FA remain with Sasa. Root is the sole writer; product audit is read-only.

## Changes

- Provider-Ops replaces the obsolete S1 rental-domain row with the actual native DiscoverCars configuration observation. The server-only adapter calls the existing `rentalAccess` evaluator and returns only a bounded state; it never returns or logs a key and never creates a provider transport.
- Disabled flag, missing/insufficient access configuration, configured and failed observation remain distinct. Flag matching and key trimming/length follow the real route contract. `configured` does not claim a valid key, reachable provider, quota, offers, price or bookability.
- The new status belongs only to the native subcheck. Existing card statuses and model-usage analysis remain unchanged. The decoder rejects that status on other checks or cards, and rejects unrelated health statuses on the native check. Native configuration stays visually neutral even if a malformed direct presentation attempts an `available` status.
- The reason is visible before expanding evidence, including the disabled case. Existing source/time/freshness evidence remains available. The original 30-second cache remains; cached reads retain the original timestamp and accumulate age. The next actual read observes new configuration.
- Provider-Ops and System Health now clear previous reports immediately on current HTTP 401/403 headers. A body that arrives later may refine only the same current denial's message. It cannot reopen access or replace a newer result. An explicit new read aborts the prior request; request identity remains the protection when a transport ignores abort.
- Other historical S1 domain rows, global guard/cost claims, capability guards, API methods and provider/public search behavior are unchanged.

## Local verification and collected corrections

Node 22.23.5 and unchanged locked dependencies were used. No local Chromium or native PostgreSQL launch was retried after the documented environment restriction in the preceding packages.

| Check | Observed result |
| --- | --- |
| Full focused Admin suite | **352 passed; zero failures, cancellations or skips**, across 42 files. Repeated successfully after separating check and card statuses. |
| Latest decoder/neutrality regression subset | **29 passed; zero failures or skips**, including native status confinement and cache behavior. |
| TypeScript | Passed after the collected correction below. |
| Focused lint | Passed without warnings after the collected correction. |
| API protection, schema reference, dead files, dependencies | Passed. |
| Exports gate | Passed after removing the unnecessary exported helper. |
| Setup and direct Next build | Completed successfully; no credentials or `.env` were supplied. The later narrow decoder/neutrality hardening has focused regression proof and is included in the required full CI on the implementation head. |
| Independent source review | Found a Props-replay test that used an identical signature. It now supplies a changed, valid report and asserts the marker remains absent. Final source binding and CI belong in the PR's exact-head record. |
| Mounted browser proof | Nine new core-CI cases reuse the existing Operations harness with actual components and CSS: four current 401/403 stalled-body cases across both boards, two delayed-body cases after recovery, and three native-state viewport cases at 100/200% text. Execution is pending normal CI at this handoff's publication. |

All initial local failures were collected: the additive status incorrectly widened the model-usage card enum, one private helper was unnecessarily exported, and a browser stub had an unused parameter warning. They were corrected together by separating subcheck status from card status, making the helper private and typing the stub. Tests and gates were not suppressed or weakened. The reviewer-found Props case now changes the real signature, rather than merely cloning an unchanged object.

## First complete CI, before the Security extension

[Run 43670753741](https://github.com/Jetnity/jetnity/actions/runs/43670753741) completed at **03:18:43 UTC, 15 November**, on implementation head `e49f933ece58076628a186103d526503fa8bcb41`, tree `f8cfc7353ef44987d1795645b2f90b7f14e9f1f1`. The synthetic CI merge `d938c6b8e5bb131ca07363f0a786b61e9f0b1126` has the identical tree. Independent source review and all nine full job logs were read before advancing the branch.

- Core: **8,775 tests; 8,773 pass, zero failures, two pre-existing shared Workspace browser skips**. All six new Operations header/body cases and all three native rental viewport/text cases passed.
- TypeScript, lint, API/schema checks, all hygiene checks and the production-mode build passed. The separate isolated UI job passed 51/51; hosted PostgreSQL 17 passed 9/9; store and lifecycle jobs each passed 4/4; persisted-read and atomic-refresh each passed 1/1.
- Eight jobs succeeded. The sole failed job was the existing Auth `uri_allow_list` mismatch. Its truncated log values do not establish a complete live-config comparison. No Auth or reserved file was changed.

This result completes the original scope only. The extension below requires a fresh full run on its own published head, recorded in the Draft PR without creating another evidence-only code revision.

## Verification limits

The browser harness has only synthetic reports and controlled responses. It intentionally ignores abort so stale-response assertions depend on the actual lifecycle logic. This is not authenticated hosted Admin acceptance, actual provider availability, a live credential test or real-device acceptance. No global green/release claim exists before the published head's full CI is read.

The other Admin branches' Auth comparison reported one `uri_allow_list` difference against the reserved `supabase/config.toml`. That source and live Auth configuration remain untouched. Any inherited Auth failure must be reported separately, not hidden by a workflow/config change.

## Security console extension in the same correction batch

The remaining Admin read-path review found the same header/body defect in `SecurityWidget`, including block/unblock responses. The [extension task](ADMIN_SECURITY_HEADER_DENIAL_TASK_2026-11-15.md) was versioned as Git object `bcbbc84a82905ad33ed6670864cac2086ab77bb8` (tree `3f6937f6642b9b21933f2f375fe51ec131401b29`, parent `e49f933ece58076628a186103d526503fa8bcb41`) before implementation. The branch was deliberately not moved until the original head's entire CI run finished, so GitHub's cancel-in-progress policy could not discard its failure set.

- Current GET 401/403 now reaches the existing denied-state decoder through an immediately resolved empty body. The original body is never read; best-effort cancellation is neither awaited nor allowed to block protection. Mounted and authoritative-read checks remain before applying the transition, and both read slots are released even when denied bodies never settle.
- Block/unblock 401/403 follows the same immediate denial path. The mounted/denial-epoch check runs after headers and again after parsing other response bodies. Existing epoch/read-identity invalidation, clearing of records/KPIs/operation details, disabled writes, fixed safe messages and explicit write retry remain intact.
- An older read, write response or denial cannot replace a later authoritative state or settle a new operation for the same IP. No write is automatically repeated. No API, capability, RLS, input-validation or blocklist-enforcement contract changes.
- Eleven new mounted cases use the existing Security harness with real component/CSS. They cover GET/block/unblock 401 and 403, stalled/rejected cancellation, two unresolved denied bodies, later accepted recovery, stale read/denial bodies, a late accepted write body after a new operation for the same IP, and unmount. Original denied JSON is asserted unread, and the absence of extra writes/reads is checked directly.
- Independent source review identified two test-proof issues before publication: an old GET body must be demonstrably in progress, and the real 15-second poll could race the explicit-request selection. These were corrected together. The new proof opts into control of only that existing interval callback; other timers/rAF and the old verification script remain unchanged. Explicit reads select a newly issued ID. The real poll callback is exercised after recovery and after unmount; hard assertions remain intact.

Local verification on the extension: **352/352 Admin tests**, TypeScript, API protection, schema reference, dead-file, export and dependency gates passed. Focused lint has **zero errors and one unchanged baseline warning** for `Date.now()` during render in the existing 24-hour KPI calculation. No warning or rule was suppressed. No local Chromium was started. The eleven new browser cases require normal CI on the final published implementation head; the earlier e49 result does not certify the extension.

## Separate read-only Dev finance preflight

During the waiting interval, the Technical Lead verified the existing Supabase `develop` branch against the repository's declared Development target, `yfvbxvijcorffwxbxahl`. Only project/branch metadata, relevant schema/permission metadata and aggregate checks were read, using read-only transactions. No customer rows, IDs, emails or reason texts were retrieved; no data or schema was changed.

At approximately 02:50 UTC on 15 November, this Dev target contained **zero payment rows and zero refund notes**. The known local contract gap is still present: no refund-to-payment foreign key or finance integrity trigger, authenticated refund INSERT and payment UPDATE privileges with capability policies, and no atomic/idempotent ledger contract. Empty Dev data is not correctness evidence or permission to activate finance. Production was not queried or modified for this preflight.

The next finance package still needs the independently reviewed transactional, idempotency, cumulative-amount, immutable-ledger and audit contract, including closure of old/direct write paths and concurrent native tests. No finance mutation was added to #1199, #1200 or #1201.

## Remaining Admin and integration

Marketing has affiliate/campaign identifiers but no campaign, visit, spend, conversion or attribution store. Settings has ENV/source switches but no controlled persistent settings contract; existing runtime/SEO status already belongs to System Health. Localization has multilingual country labels but no translated UI catalogue, locale resolution or persisted language preference. These remain genuine follow-up features; they are not completed by duplicating status screens.

No file in #1196/#1197/#1198 is modified. No change to entry-display contracts, shared Auth/MFA, public catalogue/provider code, database, ENV, CI, packages or deployment settings. No external message, provider call, new service, paid operation, login or 2FA handling. The full customer entry-information requirement stays with Hauptplan 83 and in #1199's task.

After owner-side integration, verify the combined main result. **Draft remains Draft. Do not mark Ready; do not merge.**
