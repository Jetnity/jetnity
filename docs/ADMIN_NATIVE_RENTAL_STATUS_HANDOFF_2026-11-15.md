# Admin native rental configuration and Operations denial — handoff

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

## Verification limits

The browser harness has only synthetic reports and controlled responses. It intentionally ignores abort so stale-response assertions depend on the actual lifecycle logic. This is not authenticated hosted Admin acceptance, actual provider availability, a live credential test or real-device acceptance. No global green/release claim exists before the published head's full CI is read.

The other Admin branches' Auth comparison reported one `uri_allow_list` difference against the reserved `supabase/config.toml`. That source and live Auth configuration remain untouched. Any inherited Auth failure must be reported separately, not hidden by a workflow/config change.

## Separate read-only Dev finance preflight

During the waiting interval, the Technical Lead verified the existing Supabase `develop` branch against the repository's declared Development target, `yfvbxvijcorffwxbxahl`. Only project/branch metadata, relevant schema/permission metadata and aggregate checks were read, using read-only transactions. No customer rows, IDs, emails or reason texts were retrieved; no data or schema was changed.

At approximately 02:50 UTC on 15 November, this Dev target contained **zero payment rows and zero refund notes**. The known local contract gap is still present: no refund-to-payment foreign key or finance integrity trigger, authenticated refund INSERT and payment UPDATE privileges with capability policies, and no atomic/idempotent ledger contract. Empty Dev data is not correctness evidence or permission to activate finance. Production was not queried or modified for this preflight.

The next finance package still needs the independently reviewed transactional, idempotency, cumulative-amount, immutable-ledger and audit contract, including closure of old/direct write paths and concurrent native tests. No finance mutation was added to #1199, #1200 or #1201.

## Remaining Admin and integration

Marketing has affiliate/campaign identifiers but no campaign, visit, spend, conversion or attribution store. Settings has ENV/source switches but no controlled persistent settings contract; existing runtime/SEO status already belongs to System Health. Localization has multilingual country labels but no translated UI catalogue, locale resolution or persisted language preference. These remain genuine follow-up features; they are not completed by duplicating status screens.

No file in #1196/#1197/#1198 is modified. No change to entry-display contracts, shared Auth/MFA, public catalogue/provider code, database, ENV, CI, packages or deployment settings. No external message, provider call, new service, paid operation, login or 2FA handling. The full customer entry-information requirement stays with Hauptplan 83 and in #1199's task.

After owner-side integration, verify the combined main result. **Draft remains Draft. Do not mark Ready; do not merge.**
