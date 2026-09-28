# Admin transaction read filter state 1 — evidence notes

Captured: 28 September 2026

This folder is the actual-component harness for `TransactionsCard` inside `components/admin/payments/PaymentsCenter.tsx`. It is not a signed-in Next.js Admin session, not a physical device, and not Production acceptance.

## What is real

- The bundled component is the repository `PaymentsCenter`.
- List payloads are synthetic (`example.test` only). No payment row was read from Production. No refund was submitted.
- `fetch` is replaced inside the page. Requests to anything other than `/api/admin/payments/list` are recorded and never resolved. The refund route is not called.
- The harness does not wrap the tree in `React.StrictMode`, so the initial effect runs once.

## Before the fix

`before.json` is the unfixed component.

- Choosing `paid` left the select on `paid` and sent `/api/admin/payments/list` with no `status`.
- After that response settled, choosing `failed` sent `status=paid` while the select showed `failed`.
- While the `paid` gesture's request was still held, choosing `failed` sent no `failed` request. Resolving the held request painted `synthetic-pay-stale-a` under the `failed` select.

`node scripts/admin-transaction-read-filter-state-1-verify.mjs --baseline` reproduced that. On the fixed source it exits non-zero, because the `paid` gesture now sends `status=paid`. That failure is the expected probe, not a regression. The gate is the script without `--baseline`.

## After the fix

`after.json` is the fixed component. Ten cases passed, with no page errors.

- Initial `all` omits `status`. Pending text is `Wird geladen…`, not `Keine Transaktionen.`
- `all → paid` requests `status=paid`. `paid → failed` requests `status=failed` and clears the previous rows before that response arrives.
- Filtern and Enter send the visible trimmed `q` with the visible status. Clearing the search removes `q` and keeps the status.
- A held `paid` response cannot paint over a later `failed` choice. A failed `failed` read stays an error after the older `paid` success arrives. It does not become `Keine Transaktionen.` and it does not restore the older rows.
- Mehr laden uses the committed snapshot plus the current cursor. Typed search text is not included until Filtern, Enter, or a status change. A status change starts a first page without the previous cursor. A late previous page cannot append.
- Empty, error, and retry stay distinct. Retry requests the visible status again.
- Rapid `paid` / `failed` / `refunded` produces four list reads (initial plus three), then stops.
- The local banner and `CHF 18.50` remain. The refund card still says `Lokale Refund-Notiz`, `Keine echte Geldbewegung`, and `Lokal vermerken`. No refund POST was recorded.
- At 390×844 the status select remains on screen and `paid` is requested.

## Limitation

A superseded read is ignored when it returns. It is not aborted. Each operator gesture starts one list read. This harness does not prove the signed-in Admin route, RLS, or a real payment table.
