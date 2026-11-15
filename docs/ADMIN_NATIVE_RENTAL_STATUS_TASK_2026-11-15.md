# Admin native rental configuration — task

## Authority and baseline

Sasa's 15 November instruction authorizes autonomous necessary Development work, Admin first. Production, merges, new costs and login/2FA remain with Sasa. This is an independent follow-up beside Admin drafts #1199/#1200, based on `main@63544e820e912bd275556588c956a09b99b1cf90`; operating mode NORMAL. Branch: `feat/admin-native-rental-status-20261115`.

Root Technical Lead is the sole writer. `/root/product_audit` reviews read-only. The current #1196/#1197/#1198 filenames remain reserved, including the newly extended 305-file #1197 scope. No external agent or provider message is authorized or sent.

## Problem and useful result

Provider-Ops still diagnoses the old S1 rental domain switch. The actual native DiscoverCars route admits requests through `rentalAccess()` in `lib/providers/discovercars/search/server.ts`. The two gates can disagree. An operator needs the current environment's actual configuration result and its reason, without calling the provider or exposing a key.

The shared Operations reader also waits for a 401/403 response body before clearing its previous report. This retains protected information if that body stalls. The same bounded package fixes header-time denial in Provider-Ops and System Health, preserving the existing latch and retry contracts.

## Scope and acceptance

1. Reuse the exact native `rentalAccess` evaluator server-side. Return only a bounded configuration state. Do not serialize, log or include a credential value in evidence.
2. Replace the obsolete rental-domain check with an explicitly named native rental-search configuration check. Keep the other historical S1 checks unchanged; do not infer their native provider state.
3. Distinguish disabled flag, missing/insufficient access configuration, configured-but-not-live-tested and failed observation. A configured result is neutral, not green and not proof of provider health, quota, prices, offers or booking availability.
4. Show the reason from the start, including when disabled. Preserve existing capability guards, GET-only API, read-error handling, refresh, observation timestamp, cache age and stale-state semantics.
5. Limit edits to `lib/admin/provider-ops-board/`, its direct report-validation regression tests, `components/admin/provider-ops/ProviderOpsBoard.tsx`, the narrow denial path in `components/admin/operations/useOperationsReport.ts` and dedicated task/handoff files. An additive `configured` report status is in scope only for the native rental check; reject it on parent cards and unrelated checks. No new endpoint or top-level board card.
6. Meaningful regression evidence: actual gate boundary inputs, no secret serialization, old/native gate disagreement, configured remains neutral, unknown on observation failure, JSON decoder roundtrip, first-render reason, and cache/freshness behavior. Run focused Admin tests, TypeScript, lint, hygiene/build and existing full CI; collect complete failures before correcting.
7. Independent exact-head review and honest head-specific CI record. Synthetic evidence does not establish authenticated hosted or real-device acceptance.
8. A current HTTP 401/403 clears the report and unlocks a new explicit check as soon as headers arrive. A later readable body may refine only that same denial's message. Old, replaced, unmounted or source-changed responses cannot clear a latch, restore a report or overwrite a newer result. Mounted synthetic tests reuse the existing Operations harness for both affected boards, including a stalled body and delayed-body replay after recovery. No weakening of existing lifecycle tests.

## Boundaries and risks

No changes to the native provider implementation, public search UX, trip graph, ENV values, provider activation, accounts, Auth/MFA, database/schema, CI, packages, shared deployment configuration or protected PR paths. No network probe, provider call, secret retrieval, cost, payment, email or other external contact. Reading the evaluator must not instantiate a transport or request a provider.

The existing report cache may retain a configuration observation for up to 30 seconds; its original timestamp must survive cached reads. Changing configuration is not part of the board. An old client may reject the additive status during a mixed deployment, which must remain an honest read error rather than fabricated health.

## Deliverables and stop

Runtime patch, regression evidence, dedicated handoff and Draft PR. Reviewers stop at their assigned review. Root may choose subsequent bounded Dev work under Sasa's instruction. **Do not mark Ready; do not merge.**
