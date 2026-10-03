# Admin Operations Polish 2 — report, self-review and handoff

## Delivery

Implemented as a UI-only follow-up on `ui/admin-operations-pages-polish`. Base: PR #778 at `cdee80e1c5183ec77a1237cadc3fb76b74496483`. The new draft targets `ui/admin-mission-control-polish`, so its diff contains only this follow-up. PR #778 remains independently reviewable. Neither branch is marked Ready or merged. Final delivery head is in the PR body; the published tree must match the local tested tree.

## Result

- Users: identity grouped in one cell, search/count/pagination in one toolbar, mobile account cards, missing dates explicitly unavailable. Existing role/status actions, server authorization and search navigation are unchanged.
- Payments: visible disconnected-provider status, verified commercial revenue unavailable, all numeric aggregates explicitly local recorded values. Empty paid-local records produce a useful empty state. Populated daily values use discrete non-animated bars with exact accessible daily values. No invented financial data; a successful empty local read may show local CHF 0, explicitly not actual revenue. Erstattungsnotizen remain local writes with no money movement.
- Security: recorded-only and incomplete coverage remain visible. The event search is grouped with its table. The blocklist warning stays next to controls, entries are accurately named, and action labels no longer claim to enforce a block. The 200-row limit, independent KPI/filter behavior, refresh identity and API payloads are preserved.
- System Health: compact grouped cards distinguish process/app data access from platform health. Status and freshness are separate, original proofs and source strings remain in native disclosures. No change to health evaluation, source, TTL, permissions or refresh behavior. Refresh failures explicitly retain the prior report.
- Provider & Costs: model usage first, domain status in compact rows, technical foundations secondary. Only the existing eligible fresh test-capability can be green; usage, budget and parent cards remain neutral. Available model usage is labelled as a readable log, never as a test/live provider. Empty usage is not zero spending.
- Indexing: visible configuration decision; full original origin/robots/sitemap evidence in a disclosure. Still configuration-at-page-load, not actual indexation or launch permission.

Jetnity's existing off-white/green tokens, radii and type styles are reused. No dependency, new function, API, DB/schema/RLS, authentication, provider, ingestion, money movement, recurring cost or travel-graph change.

## Verification

| Check | Result |
| --- | --- |
| Typecheck | PASS |
| Lint | PASS, 0 errors / 148 existing repository warnings |
| Admin tests | 261/261 PASS, including 7 additional presentation truth tests |
| Full suite | 4485/4487 PASS; two unchanged PostgreSQL integration tests cannot start `/usr/lib/postgresql/16/bin/initdb` on this macOS host |
| Production build | PASS, `NEXT_TELEMETRY_DISABLED=1 npx next build --webpack` |
| Hygiene | `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`: PASS |
| Diff whitespace | PASS |
| Actual-page browser audit | 59 scenarios PASS: five pages, six widths (280, 320, 390, 768, 1024, 1440), loading/empty/error/denied/stale/unknown/populated states; additional populated mobile/tablet checks |
| Interactions | Keyboard disclosures; account menu and Escape; payment tabs/search/local-note request; security filter/blocklist request; refresh failure retains previous report; 200-row bounds remain after filtering |
| Visual | Reviewed desktop, tablet, mobile, payment bars and dark theme screenshots. Agent-browser independently opened the local health page and verified keyboard disclosure/source visibility. |

Dependencies reuse the earlier clean install for #778 with unchanged package manifests/lockfile. The default Turbopack build was not rerun: #778 recorded a host process/port restriction; Webpack is the verified production build here. No database test was skipped or rewritten to disguise the local PostgreSQL limitation. Tests that asserted old UI copy/native-details absence were updated to the authorized presentation; their date, row-limit and indexing truth assertions remain.

## Evidence and reproduction

Run `ADMIN_OPS_EVIDENCE=/tmp/admin-operations-evidence node scripts/admin-operations-polish-audit.mjs` with Chrome and the existing repository dependencies. `--serve` exposes the synthetic preview locally for manual review.

The audit bundles the actual five pages and their components with production CSS. Guards, server sources, routing and HTTP boundaries are explicitly replaced only in the temporary audit bundle. It makes no network provider request and no database write. POST checks operate on synthetic in-memory responses only; user action authorization is not verified by this harness. Fixtures contain invented users, example.test emails and reserved documentation IPs. No user screenshot data or credentials are published.

Committed evidence: `docs/evidence/admin-operations-polish-2/audit.json`, desktop Provider & Costs and mobile Security screenshots. Remaining page/state screenshots are generated by the audit and delivered locally.

## Self-review and scope reconciliation

Reviewed diffs against parent, all page guards, data reads, write payloads and filter logic. Full #774/#775 changed-file sets have zero overlap. No file under `lib/readiness`, API routes, server loaders, provider runtime, authentication or migrations is edited. The one shared copy change in `lib/admin/ehrliche-zustaende.ts` only renames the blocklist KPI in its row-limit explanation.

The original source/proofs/limitations remain retrievable; raw names do not appear in collapsed normal presentation. Unknown/stale/failure states do not gain a positive overall health or cost claim. The new structured rendering tests cover parent/child green semantics and all model-usage display states.

## Open acceptance and next step

Author implementation and local UI verification are complete. Independent exact-head review, remote CI/Preview, authenticated admin flow and physical-device acceptance remain external evidence. The stacked PR depends on #778; after that PR is integrated, the Technical Lead should reconcile the stack with current main and rerun relevant checks. No automatic integration, Ready, merge, production change or additional slice is authorized by this handoff.

Shared vision, architecture, canonical roadmap and global design docs need no product-contract change. This dedicated task/report records the follow-up status and remaining acceptance without editing concurrently owned continuity files.
