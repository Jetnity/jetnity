# Admin Content Inventory — bounded Development task

## Authority and baseline

Sasa requested autonomous completion of the remaining Jetnity product functions, Admin first. This is the next bounded package after Draft #1199, initially planned on `b900527261aabb6f525c381b3b123b12571dfb87`. The publication base is now its corrected successor `58e3c036926f39bcbaf8f7362f1ed966687c16e7`. It uses a separate branch/worktree and is stacked on #1199; merging, Production, new costs and login/2FA remain with Sasa. Root is the only writer; independent agents review read-only.

Basis: `JETNITY_VISION.md` §15 (a useful, lean Admin system) and `docs/ADMIN_MARKETING_GROWTH_CONTROL_CENTER_STANDARD.md` §12.1 (Content Inventory). The existing four destination ideas are the actual source. Broad marketing automation, a CMS, publishing and translation management are not present and must not be implied by this package.

## Outcome

Replace the Content placeholder with a usable inventory for reviewing the existing inspiration catalogue: search and topic filters, original descriptions and planning ideas, public preview and original image links, traceable source and explicit missing editorial evidence. Do not copy the catalogue or invent owners, approval dates, image licences, freshness, traffic, conversion or indexation evidence.

## Allowed paths

- `app/(admin)/admin/content/page.tsx`
- New `components/admin/content/ContentInventory.tsx` and `lib/admin/content/` model/tests
- Existing Admin navigation/search and directly affected expectations
- Existing package-local synthetic browser harness/test, extended only for Content interactions
- Dedicated Content task/handoff documents

Do not edit the source catalogue, public pages, images, shared Auth, database/schema, dependencies, CI, global architecture/status documents, or any file changed in #1196/#1197/#1198. Read/import existing public catalogue modules only. No new API, provider call, database write, payment operation, login, scheduler or cost.

## Acceptance

1. Existing `requireAdminPage` with `inhalte-moderieren` runs before inventory rendering. Navigation uses the same capability as a usability filter only.
2. Original catalogue entries are imported from `lib/inspiration/explorer-1/katalog.ts`, including their original planning links and image paths. No duplicated editorial content.
3. Search/topic selection is URL-backed, bounded and aligned with the public catalogue. Native GET submission, reset, reload and keyboard operation work. Unknown topics fall back safely, no result is a real filtered-empty state.
4. Each item shows destination/country, original description, original idea and topic labels. Public preview and original image links are explicit navigation, never publish/save actions.
5. Source and scope are clear: this build's curated inspiration catalogue, not a complete inventory of Jetnity pages. Language can be identified from source text; market eligibility is not inferred from the destination country. Editorial owner, published/updated/reviewed times, image rights, freshness, traffic and conversion are explicitly not captured by the source.
6. Existing `/entdecken` source configuration is `noindex`; do not claim a live search-engine index check. Technical SEO remains in System Health.
7. Mobile 320/390px, desktop, enlarged text, accessible labels, meaningful empty state and usable actions; reuse project tokens.
8. Unit/source tests, mounted component interactions in existing CI, TypeScript/lint/build and independent review on the exact published head. Collect failures and correct them together. Known unrelated Auth `uri_allow_list` drift remains visible; do not change reserved `config.toml` or bypass the check.

## Continuity

The prior task records the complete customer-facing entry-information requirement. Content inventory must not interpret its catalogue evidence as entry eligibility or Official Truth coverage. Current Content scope has no entry-data dependency.

Finance integrity remains separately assessed: the RPC approach requires reserved schema-gate paths. A trigger approach would need its own full SQL/security, rollout, idempotency and concurrency contract; it is not silently included here.
