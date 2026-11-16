# Admin refund journal — read-only completion

## Authority, baseline and ownership

Sasa authorizes necessary Dev work without another permission question. Production, merges, new costs and login/2FA stay with Sasa. #1196/#1197/#1198 and all their changed paths remain reserved. NORMAL mode and the previously read Jetnity vision, architecture, decisions, design, product-quality and continuity standards apply.

Stacked on reviewed Admin operations #1199, head `1cd49ada9c46ed9e9dcdfd627a9c11ba018ce257`, tree `6aca38a25cff9c20e26666c148e1206e90df4e5f`. New branch `feat/admin-refund-journal-20261115`. Root is the only writer; Product audit reviews the source and behavior. This task must be versioned before implementation.

## Problem and product result

The existing Erstattungsnotizen tab provides a write form but no history. An operator cannot inspect previously stored notes or resolve uncertainty by looking up a payment. Add a real read-only journal using the existing refunds table and its existing betrieb-lesen capability/RLS. Show note ID, payment ID, exact amount, reason and source timestamp, newest first. Explain that these are internal notes and do not prove an actual provider refund.

Provide exact payment-ID filtering, explicit reset/refresh and incremental next-page loading. Distinguish loading, genuine empty, failure, retained-but-stale data and denied access. A current 401/403 must clear the entire Payments view on headers, even if its body stalls; late or unmounted responses cannot restore data. Keyboard, narrow/mobile and enlarged-text behavior must be usable.

## Scope

- One GET endpoint under `app/api/admin/payments/refunds/route.ts`, guarded with the existing requireAdminApi/betrieb-lesen contract and ordinary session client. Preserve RLS. Validate query/cursor before transport, select only necessary fields and return no-store responses. No server/service key or public endpoint.
- Existing typed refunds columns only. PostgREST `amount_chf::text` preserves decimal precision without a new database object or type escape; installed SDK supports typed casts. Do not round a malformed or sub-cent legacy amount into a plausible amount.
- Page size 25, bounded 26-row fetch, deterministic descending (created_at,id) keyset. Preserve full PostgreSQL timestamp precision in the cursor, bind the cursor to the applied filter and validate all interpolated cursor tokens. No OFFSET, cross-filter append or silently duplicated records.
- One feature-local pure contract/query module and focused tests; one journal component integrated in the existing refunds tab. Reuse #1199's current-read hook and harness. Preserve the existing write route and its semantics.
- No DDL, migration, index, grant, role, policy, new RPC, generated-type/scanner edit, package change, workflow change, provider call or external payment. No customer travel-graph or entry-display change.
- Dedicated task/handoff document; no changes to protected global coordination files.

The existing refund writer is a separate correctness gap: insert, payment read and status update are separate requests; cumulative amounts, retry identity and concurrent writers need one authoritative transaction. Its current UI already states that no money moves. That future writer requires a freshly reviewed Dev database/BG1 contract. This read-only package does not claim to solve or activate that writer.

## Data and cross-lane evidence

Read-only Dev preflight on 15 November found payments/refunds empty, existing typed columns, authenticated SELECT and capability-bound RLS; no refund foreign key/integrity trigger or atomic writer. No rows/identities/credentials were exposed. #1197's installed BG1 globally snapshots protected role dependencies; therefore this package deliberately requires no change to that protected database contract. Counts #1202 is separately prepared/unapplied because its new grants conflict with that contract.

## Tests and acceptance

Use meaningful pure parsing/pagination/precision tests and an actual-SDK HTTP-transport test for literal select/filter/order/limit/cursor construction. Exercise the actual route with guarded dependencies to prove forbidden/no-query, invalid input/no-query, DB denial, transient failure, empty/data/next-page behavior and no-cache responses.

Mounted production-component tests use the existing isolated harness with synthetic responses: initial and filtered empty, data/reasons/exact amounts, reset, refresh, next-page failures retaining data, filter changes during pending reads, stale responses, current 401/403 with stalled bodies, unmounted responses, keyboard controls, 320/390/1280 widths and 200% text. Existing normal core CI supplies Chromium. Do not retry locally blocked browser/PostgreSQL sockets.

Collect full failures before each correction batch. Run type/lint/API/schema/hygiene gates and full normal CI, review the exact published head and document real outcomes. No real login or positive hosted AAL2 proof is implied. Draft remains Draft and unmerged.
