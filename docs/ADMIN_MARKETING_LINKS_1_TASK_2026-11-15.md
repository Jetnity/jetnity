# Admin Marketing Links 1 — versioned implementation task

Prepared 15 November 2026 for Sasa's authorized Development work. Implementation begins only after the Settings base has completed green CI and the preceding CMS candidate is source-complete. This task is persisted before code changes. Production, merges, new costs, logins/2FA and real-money refund processing remain with Sasa. #1196–#1198 and their changed paths are excluded; #1202 remains HOLD until #1197 is merged.

Branch: `feat/admin-marketing-links-20261115`. Implementation base: #1205 `304900d4e4d9587bcbed075409e730227fe7cecf`, tree `5652431571c8d9f24e36cd8a1d090c44f155a591`, complete green CI [43714257605](https://github.com/Jetnity/jetnity/actions/runs/43714257605). Main remains `63544e820e912bd275556588c956a09b99b1cf90`; the operating mode is NORMAL. The earlier read-only proposal used #1205 `af21f99`; the implementation uses the final corrected green source. Technical Lead `/root` publishes; assigned writers do not merge or mark Ready.

Fresh numbered implementation sessions are `/root/marketing_links_1` (production and unit tests on this branch) and `/root/marketing_browser_1` (only the new browser harness and browser test, on the separate local branch `test/admin-marketing-links-20261115`). Both start from this immutable task commit and have disjoint file ownership. Root brings only the two reviewed proof files into the implementation tree by explicit file copy; no Git merge or history rewrite is authorized. These are actual ChatGPT collaboration sessions, not claimed Cursor or Guardian sessions. Root owns the handoff and publication. STOP after the assigned package; do not mark Ready, do not merge, do not start a follow-up slice.

Sasa's latest instruction limits user-facing updates to five lines, with hashes, timing and detailed test lists retained on GitHub. One green complete CI and the actual bounded test run suffice; do not repeat reviews without a concrete new defect. Preserve the strict source, database, permission and login boundaries.

## Product outcome and boundary

Replace the empty Marketing page with a useful, explicitly local generator for marked incoming links. An admitted Admin can select an existing public destination and channel, create an opaque campaign identifier, inspect the complete generated URL and its parameters, and copy it after a deliberate click.

This does not create a saved campaign, approve copy, publish an advertisement, send a newsletter, activate a provider, measure attribution, track a customer, spend money or change Production. The page must say that generated links point to jetnity.com even in Development and that links/campaigns are not stored or measured here. Full campaign persistence/approval/analytics is a later, separately integrated store; never substitute Auth metadata, browser storage or an in-memory server registry.

The preceding CMS candidate defines version/history semantics with mandatory native PostgreSQL verification and remains UNAPPLIED until coordinated BG1/types/scanner integration. Its actual verification status is recorded in its own handoff. This local link tool needs no such new database privilege and must not pretend to remove that CMS/Marketing dependency.

## Closed URL contract

Use the existing `KANONISCHE_PUBLIC_ORIGIN` from `lib/seo/oeffentlicher-origin.ts` unchanged. Its value is `https://jetnity.com`. Never derive the link's origin from a Preview hostname, environment input or a free-form URL.

Exactly three destination choices:

| Choice | Exact path |
| --- | --- |
| Start page | `/` |
| Travel planning | `/planen` |
| Inspiration | `/entdecken` |

These are real existing public routes. `/entdecken` remains noindex; public accessibility is not an indexing claim. No public route, SEO contract, sitemap, provider link, planning parameter or trip/account/auth path is changed.

Exactly four channel choices establish this package's new incoming-link convention:

| Choice | `utm_source` | `utm_medium` |
| --- | --- | --- |
| Newsletter | `newsletter` | `email` |
| Instagram | `instagram` | `social` |
| Partner link | `partner` | `referral` |
| QR / print | `qr` | `offline` |

The campaign parameter is exactly `utm_campaign=cmp-<lowercase RFC4122 UUIDv4>`. An optional content/variant parameter is exactly `utm_content=cnt-<lowercase RFC4122 UUIDv4>`. Both identifiers are 40 characters with their fixed prefix. No nil UUID, other version/variant, free text, names, emails or arbitrary campaign slug is accepted. IDs are opaque link markers, not registered database identities. No new `utm_term`, account/trip identifier, user-entered query, fragment, credential or redirect is accepted.

The pure parser accepts only a closed plain-data object for destination, channel, campaign ID and optional content ID. Unknown/missing fields, extra authority/person fields, arrays, invalid enum values, accessors, malformed IDs and hostile objects fail without calling getters or throwing outward. The returned value is a detached copy. The builder returns deterministic parameter ordering, one occurrence of each permitted key and exactly the bound HTTPS origin/path. It never fetches the URL.

Existing outgoing DiscoverCars `utm_source=jetnity` / `utm_medium=widget` and Stay22 `campaign=jetnity-unterkunft` are separate provider contracts. They are not reused as evidence of incoming campaign tracking or altered by this task.

## Interaction and copy lifecycle

- Create identifiers only after an explicit user action, using `crypto.randomUUID` with validation; unavailable/invalid randomness produces an honest error, not a weak substitute or a usable fake URL.
- Keep the same campaign/content ID while changing destination/channel within the current form. A changed input invalidates the previous generated URL and copy confirmation; the explicit Create link action produces the new preview, reusing existing valid identifiers. Explicit new-campaign/new-variant actions generate new IDs and clear prior URL/copy status. A new campaign removes the previous variant. Reload discards all transient input and IDs; nothing is written to Local Storage, Session Storage, cookies or Auth metadata.
- A complete URL is presented as readable/selectable text with a parameter breakdown. This is a URL preview, not an iframe, navigation, prefetch, tracking request or automatic send. Long URLs and labels must wrap at 320px and 200% text.
- Copy uses `navigator.clipboard.writeText` only from the user's click. Confirm success only after fulfillment for the exact still-current URL. Rejection, missing API or unavailable permission preserves manual text selection and shows a localized failure.
- Prevent duplicate or overlapping Clipboard calls with a small document-local transport controller. Editing or unmount/remount within the same document must not permit an older unresolved OS write to race a newly started Clipboard write. The controller is a pending-operation lock, not a campaign/URL registry. Ignore late status changes after an edit, a newer generation or unmount. Do not claim serialization across different documents or tabs.
- A 10,000ms UI deadline marks copy as unconfirmed and offers manual selection; it does not abort or automatically retry the OS operation. Preserve serialization while that promise is unresolved, including after the deadline and remount. A subsequent copy requires another deliberate click after settlement. Other form editing remains usable; an outstanding earlier write is disclosed because it may still change the clipboard later.
- No shortcut, input change, mount, saved-language read, render or page reload automatically copies, opens or sends anything.

## Language and existing access

Provide complete German and English UI text, including busy/error/uncertain/empty/accessibility labels. Read the same verified saved account language introduced in #1205 through its existing server reader; unsupported/unavailable preference falls back to German without a preference write. Add actual Marketing text entries to the Admin language catalog, preserving all Settings entries and accurate partial-coverage wording. The rest of the application and navigation are not advertised as globally translated.

The product component's only optional test seams are `uuidErzeugen?: () => unknown` and `clipboardSchreiben?: ((text: string) => Promise<void>) | null`, alongside its actual `sprache` prop. Undefined uses the browser adapter; null means no Clipboard API. Parser, URL generation, state and CSS remain the real production implementation. The visible actions cover Create link, New campaign ID, Add/New/Remove variant ID, Reset, Copy link and Select link text in both languages.

Reuse the existing Admin layout's admission/AAL2 gate and its current legitimate UI break-glass behavior. The link generator has no backend write or new business authority; do not invent a campaign capability or broaden existing roles. The navigation entry becomes ready with the honest label “Marketing-Links”; existing role filters and search allowlists remain effective. Global company settings, provider credentials and CMS publication rights are untouched.

## Allowed files and ownership

New code under `lib/admin/marketing/`, `components/admin/marketing/`, `lib/localization/marketing-texte.ts` and an explicit combined catalog helper if useful. Mounted proof under `lib/admin/marketing/browser.test.ts` and `scripts/admin-marketing-links-1/`.

Existing edits are limited to:

- `app/(admin)/admin/marketing/page.tsx`;
- `lib/admin/navigation.ts`, `lib/admin/navigation-search.ts` and their directly affected tests;
- `components/admin/localization/Sprachkatalog.tsx`, coverage wording in `lib/localization/einstellungen-texte.ts`, and directly affected catalog tests.

The existing Settings browser suite already derives the catalog row count from
the rendered catalog and remains unchanged. Keep all existing Settings keys
and their search semantics; Marketing keys receive their own explicit namespace.
The new Marketing browser writer owns only its own new harness and browser test
file on its separate proof branch.

Do not change the shared shell, public routes, protected SEO source, Auth configuration, metadata storage contract, database, CI/workflow, package scripts, dependencies, selectors or entry files. Preserve #1199/#1200/#1205 improvements. Document all changes in this package's own task/handoff; shared architecture/roadmap indices are reserved to the parallel entry lane.

## Verification and completion

1. Pure tests cover every destination/channel, exact URL/parameter encoding and ID rules, closed input shapes, missing/invalid/hostile values and absence of URL/query/person-field passthrough.
2. Mounted tests use the actual production component and CSS with explicit fixture language/Clipboard/randomness ports. Exercise explicit creation, stable IDs across variants, new IDs/reset/reload, copy fulfillment/rejection/unavailability/double-click/timeout/late results/unmount and the serialization contract. Track all network and storage attempts; the feature must make none.
3. Check both languages, light/dark contrast, keyboard/focus, readable full URL, 44px targets, 320/390/1280 widths and 200% text. Synthetic browser proof is not a claim of a real Admin login or real system clipboard write.
4. Collect the complete failed test batch before one correction block. Run affected unit/contract tests, complete TypeScript/Lint, all static gates, independent source/test review and full normal CI on the exact published head. The existing Core glob must select the browser suite; no new skip or hidden bypass.
5. Use only branch-specific Preview public variables for the existing verified Dev Supabase project. Verify exact source SHA, READY Preview and protected login transport. Positive Admin/AAL2 review remains the legitimate Sasa session when no connected session is available. Do not attempt login/2FA.
6. Report the exact PR, CI, Preview and bounded feature honestly. Whole Marketing persistence, editorial approvals, publication and attribution remain unfinished; do not mark the overall Marketing system or the whole 30 November launch as complete.

No local Chromium/socket/PostgreSQL start is attempted in this workspace, where the restriction is already observed. Actual mounted/native execution belongs to normal CI. No Production, merge, new charge, message, campaign send or refund action is authorized by this task.

The parallel entry lane retains the complete first-display requirement: visa,
ETA, passport validity and blank pages, mandatory/recommended vaccinations,
health measures, named forms with costs and scam warnings, fees, return/onward
ticket and funds, transit, minors and consent, customs, dual citizenship and
ID-card exceptions, source/date, recent changes, the notice "bitte vor der Reise
prüfen" and official completion links. Unconfirmed items say "derzeit nicht
verfügbar". This Marketing package neither edits nor publishes those facts and
must not add a second entry-information source or a guessed completeness claim.
