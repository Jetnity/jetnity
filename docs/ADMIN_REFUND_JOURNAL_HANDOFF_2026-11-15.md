# Admin refund journal — implementation and evidence

## Product result

The Erstattungsnotizen tab now shows the actual stored notes above the existing form. Each note exposes its ID, exact payment ID, unrounded amount, reason and source time with UTC. The journal states that these are internal records and do not confirm a provider money movement. It derives no balance, cumulative refund amount or completed-refund status from a partial page.

Exact payment-ID filtering supports Enter, explicit reset and refresh. A draft input is separate from its applied filter; loading another page continues that applied filter. A filter change clears the old context immediately. Initial loading, actual empty, failure, retained older data and denied access stay distinct. Long values and enlarged text can wrap. Original malformed, nonpositive or sub-cent amount text remains visible with a warning.

This closes a missing read capability using the existing refunds schema and SELECT policy. The original POST writer and its semantics remain unchanged. Its separate atomicity/idempotency/concurrency gap is still open and is not masked by the journal: a matching row without a known note ID cannot prove the outcome of an earlier failed write.

## Authority and code scope

Sasa authorizes Dev work. Production, merges, new costs and login/2FA remain reserved. Task commit `a0f894e20d22665890340963707f13fca49f2f5e` predates implementation on `feat/admin-refund-journal-20261115`, stacked on reviewed #1199 head `1cd49ada9c46ed9e9dcdfd627a9c11ba018ce257`. Root writes; Product audit reviews independently. Draft stays Draft.

- New GET `/api/admin/payments/refunds` uses the existing requireAdminApi/betrieb-lesen contract, normal session client and existing RLS. Validation precedes client creation; failures do not become empty rows. Responses are private/no-store. API/DB 401/403 or SQL42501 deny access; transient HTTP408/429/502/503/504 and connection/resource SQL classes are retryable503. Raw DB error details are not exposed.
- The literal typed select reads only `id,payment_id,amount_chf::text,reason,created_at`. [PostgREST's documented select cast](https://docs.postgrest.org/en/stable/references/api/tables_views.html#casting-columns) and the installed SDK's parser preserve decimal text without a new RPC or type escape.
- Pagination fetches at most26 rows for a25-row page, ordered by created_at DESC and id DESC. The versioned cursor binds the applied filter, full original timestamp and UUID. Strictly validated timestamps/UUIDs are the only interpolated keyset tokens; payment IDs use the normal equality filter. Source microseconds survive even within the same millisecond, and equal timestamps use UUID ordering. Duplicate/misordered records and mismatched continuation pages are explicit errors.
- `RefundJournal` reuses #1199's current-read hook. Current API-denial headers hide the entire Payments view without waiting for its body. Aborted, superseded and unmounted reads cannot restore records. A synchronous ref prevents duplicate append dispatches before the disabled button renders.
- Existing mounted harness gains only HTTP-method recording. No fake live data, new package or workflow. No DDL, index, grant, role, policy, migration, new RPC, shared Supabase/auth/type/scanner change, provider/payment call or entry-path change.

## Review corrections and local evidence

The complete review group was fixed together: local inherited word wrapping; a journal-local44px retry control; separate field validation; explicit rejection rather than native truncation of overlong pasted IDs; transient HTTP-status classification with exact503 assertions; and same-event double-click suppression. Shared error/Input components and the original writer stay unchanged.

Before the review corrections, the full local Admin suite passed362/362 tests across44 files, zero failures/skips. After the correction, all13 directly affected pure and actual-route/SDK transport tests passed again, along with TypeScript and scoped lint. API protection checks13 Admin routes; schema-reference, dead-code, export and dependency checks passed. Native/browser files are not included in the local count and are not run in this socket-restricted workspace. Both independent source reviewers confirm no remaining concrete finding; actual browser outcomes remain for CI.

The actual-route proof substitutes only the authorization/session boundary and HTTP transport. The real route and installed Supabase builder execute, with no possible network fallback. It proves guard/invalid-input no-query, literal select/order/limit/keyset/equality, no-store responses, correct forbidden/transient mapping, true empty and malformed-response handling. Synthetic permission fixtures do not prove a real logged-in session.

Twelve new mounted cases use real production components and CSS. They cover320/390/1280 widths and200% text, exact large/sub-cent amounts and escaped reasons, initial/filtered empty, Enter/reset, retry without consuming a cursor, unsaved filters, double-click count, filter changes during append, current401/403 with stalled API bodies, late successes/denials, unmount, session reload, malformed/duplicate pages, and an overlong pasted ID with no new GET. Every journal action must remain GET. Their actual execution is supplied by the normal existing CI; final outcomes are pending at this committed handoff.

### Transport boundary

The mounted immediate-denial proof begins at this application's API response. The Supabase SDK reads an upstream PostgREST response body before resolving its query. A stalled upstream body can therefore still delay this route, and an aborted body may become status0. This package does not claim immediate denial through that extra SDK boundary. The existing guard and API-header behavior remain as described above; no weaker fallback is introduced.

### First complete CI and collected layout correction

Published head `0eacaaf6f3c4e8d6cd2c10a1851eca3527c65f71`, tree `cf46b915c6963109ab6c8c83c37add2e0b28f08a`, ran [CI 43676540956](https://github.com/Jetnity/jetnity/actions/runs/43676540956), completed 15 November at04:36:12UTC. All nine full logs were collected and reviewed before correction: core8802 tests,8798pass,2fail,2existing Workspace skips. All14 inherited mounted cases and10/12 new cases passed. Two new cases failed the strict page-width assertion at320px/200% text, once with populated rows and once with the initial error state; the populated case measured362px page width. The later interactions of the error-state case were not reached. Typecheck/lint passed; all six separate native/UI jobs passed. Core's five static checks and build were skipped after its test failure; the aggregate was consequently red. Auth separately reported only the known uri_allow_list mismatch.

The bounded correction gives the existing RefundCard submit button local maximum-width, wrapping and44px minimum-height classes, matching the journal's controls. Its inherited nowrap label was the concrete source candidate for the common page overflow; the measured CI log did not identify an element. No submit handler, payload, POST route or writer semantics changes. The existing hard page/label bounds remain, now also explicitly covering this disabled submit control. Future width failures include up to12 overflowing DOM rectangles from the synthetic fixture, so an unresolved cause is visible rather than hidden by a weaker assertion. Actual re-execution of both failed cases and the full suite remains for the next normal CI run.

## Integration and current execution state

The installed #1197 BG1 guard prevents independent Counts grants (#1202). This journal changes none of those database rights or objects. No guard function, audit, incident latch, scheduler or entry route was invoked or modified.

At this handoff, published-head CI, final source review and any branch-specific Dev Preview configuration are pending. No hosted schema/data change, new environment value, provider action, actual account login or new cost has occurred. Final PR evidence will identify the exact head/tree/run and any completed configuration/deployment. If configured, only this branch's Preview may receive the existing Dev public URL/key; no project-wide variable, another branch, Production promotion or Auth configuration may be changed.

A positive hosted AAL2 browser acceptance remains unrun unless observed in Sasa's legitimate session. The known separate Auth uri_allow_list/config.toml mismatch is not fixed by editing the reserved configuration. Record a formally red CI honestly even when all feature, native/UI, static and build checks pass.
