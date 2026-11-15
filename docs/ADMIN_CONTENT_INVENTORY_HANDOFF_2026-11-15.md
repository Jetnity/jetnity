# Admin Content Inventory — implementation handoff

## Outcome and branch

The Content placeholder is replaced by a working inventory of the existing curated inspiration catalogue. It is a separate Development package on `feat/admin-content-inventory-completion-20261115`, stacked on Draft #1199 at its corrected head `58e3c036926f39bcbaf8f7362f1ed966687c16e7`. Its [versioned task](ADMIN_CONTENT_INVENTORY_TASK_2026-11-15.md) was published before implementation at `cd958662fe97e5b50a97192dd28ca49c30337ab2`; that initial documentation branch is retained. The publication branch starts from the corrected parent directly, without merging or rewriting an existing branch.

This implements inventory/review navigation, not a CMS, approval queue or publishing operation. No automatic recipient, remote writer or production action is involved. The eventual PR remains Draft; Ready and merge are not authorized.

## Changes and behavior

- `/admin/content` runs the existing `inhalte-moderieren` page guard before building the inventory. Navigation and search expose it under the same existing capability.
- The model imports the existing catalogue objects and filtering contract. Destination names, countries, topics, descriptions, planning ideas, image paths and planning links are not copied into a second content source.
- A native GET form combines text and topic filters, persists them in the URL, supports keyboard submission, provides a meaningful empty state and resets to the full catalogue. A real full refresh retains the selected URL.
- When internal Next navigation provides a different selection, the form remounts its uncontrolled fields. Old unsent input cannot contradict the newly rendered results.
- Every entry links to its public filtered preview, unchanged planning destination/idea and original image. A missing planning link stays unavailable; the Admin layer does not invent a replacement.
- The evidence section names the exact source files and limits the view to this build's inspiration catalogue. Owner, editorial dates, rights evidence, freshness, market attribution, traffic and conversion remain explicitly unrecorded when not supplied by that source.
- The `/entdecken` noindex/nofollow statement describes source configuration, not observed search-engine indexation. Source tests require this statement to stay aligned with the public page configuration. Technical SEO remains in the existing System Health view.

## Verification

| Check | Observed result |
| --- | --- |
| Focused Admin suite using the repository's existing server-only test loader | **354 tests passed; 0 failed, cancelled or skipped**, across 43 files. Includes the 349-test preceding Admin suite and five Content tests. |
| TypeScript | Passed. |
| Focused lint | Passed without warnings. |
| API protection, schema reference, dead files, exports, dependencies | All passed. |
| Next build | Completed with exit 0, including TypeScript and full route generation. |
| Independent source review | One actual form-state issue and two test-harness/assertion issues were found and corrected. No remaining material source finding was reported. Exact published-head confirmation and CI are recorded in the PR. |
| Browser proof | Five Content cases added to the existing mounted-component suite: three viewport/text-size cases, GET/filter/refresh/empty/reset flow, and repeated-query plus same-document props-change behavior. The suite now contains 19 cases including #1199. Local Chromium was not retried after the documented OS restriction; execution belongs to existing CI. |
| Database, provider and authenticated hosted operations | None performed. No such acceptance is claimed. |

### Failed checks and corrections

1. The initial 20-test Content/navigation run had one false failure from assuming React's HTML attribute order. The corrected assertion checks both GET method and action independently on the actual form element.
2. The first full local Admin invocation omitted the existing `scripts/server-only-test-register.mjs` used by CI. Five test files therefore failed to load `server-only`. The complete suite was rerun with that standard loader and all 354 tests passed; application code, loaders and package dependencies were not changed to suppress failures.
3. The first build in the separate worktree could not resolve a `node_modules` symlink outside Turbopack's project root. Dependencies were materialized locally from the existing installation; no repository configuration, package or lock file changed. The subsequent build passed.
4. Independent review found that uncontrolled form defaults could survive a server-props query change. The form now keys its subtree by the normalized selection, with a mounted regression case that keeps the document instance unchanged.
5. Independent review found the harness collapsed repeated query parameters to the last value, while the real catalogue keeps the first. The harness now preserves arrays and the props-change browser case explicitly starts with repeated parameters.

## Scope and limits

Only the documented Admin Content, navigation, package-local test harness and dedicated documents are changed. The original catalogue, public pages, image assets, shared Auth, database/schema, CI, package/lock files and all #1196/#1197/#1198 paths remain untouched. There is no new endpoint, remote service, cost, payment, scheduled action, login or 2FA handling.

At the time of this handoff, #1199's Vercel preview build succeeded. Its Auth configuration CI job reported one `uri_allow_list` difference against `auth.additional_redirect_urls` in the reserved `supabase/config.toml`. That discrepancy is not repaired or hidden in this lane. Current complete CI outcomes belong in the PR's head-specific record; no global green claim is made here.

The parent's first complete core run additionally exposed two Analytics narrow-screen failures. Its corrective batch is included in this package's base, and the same explicit grid sizing and inherited word-wrapping rule is applied to Content. Neither viewport assertion is relaxed. See the parent's [CI record](ADMIN_OPERATIONS_HANDOFF_2026-11-15.md) for the complete 8,777-test result and the two existing skipped public-journey scenarios.

## Next Admin work

- Content inventory is now present; editorial editing, approval records and publishing remain a separate future contract.
- Marketing, Settings and Localization still lack their own management data sources. Existing provider/cost and System Health/SEO views should not be duplicated as nominally completed modules. Campaign/attribution data, controlled configuration storage and a translation catalogue require explicit implementation work.
- Registered-account metrics retain their existing local-only activation gate.
- Continue the [15–30 November delivery plan](ADMIN_PRODUCT_DELIVERY_PLAN_2026-11-15.md) after the current packages' complete evidence is collected. The entry-category requirement remains assigned to Hauptplan 83.

### Finance integrity follow-up: corrected feasibility assessment

The previously investigated RPC approach requires reserved type/schema-gate files. That is not an absolute blocker to a separate, properly designed implementation: existing `refunds.id` can hold an idempotency ID, and an additive trigger migration can make an ordinary existing-table INSERT atomic without introducing an application RPC.

This alternative is not implemented or activated by either current Admin package. Its own acceptance must cover stable/recoverable action identity and same-payload replay, exact cent arithmetic, cumulative refund limits, concurrent transactions, immutable refund history, an atomic server-authored audit record and the currently granted direct UPDATE path on `payments`. A trigger alone does not settle all of those requirements.

Rollout must first close the old write path, inspect the actual Dev data without silently repairing it, install and prove the DB contract, and only then admit the new writer. An environment flag alone does not prove trigger installation. A mixed old-code/new-permission rollout must not leave a persisted note followed by a failed status update. Native transaction/security evidence and a confirmed Dev target are required before activation; no Production migration is included in Sasa's delegation.
