# Integrated Reiseplan — implementation self-review

## R1 correction review — current findings

The previous delivery had two valid P2 defects, independently found by TL review `TL-20261007-900-903-R1`. They were not caught by the original tests; the prior delivery is not retroactively presented as bug-free. The user-supplied review was transmitted unchanged as [a PR conversation comment](https://github.com/Jetnity/jetnity/pull/903#issuecomment-6035567894), not authored as this writer's independent review.

- **P2/F1 repaired:** equal interval endpoints alone did not bind independent event and clock values. A current milestone now requires point ranges on both sides at the same value. All overlapping non-point/point uncertainty cases stay indeterminate; strict separated past/future and closed touching boundaries remain intact. Eleven added active tests include the TL's exact reproducer. RED and GREEN are recorded against the actual reviewed source and repaired source hashes.
- **P2/F2 repaired:** same-editor values could change during an in-flight save and vanish when the older response closed the form. All eight possible controls (seven visible in either create or manual edit), including kind/day assignment, now use `disabled={laeuft}`. Saving status remains accessible. Existing pending submit/Escape, mounted-form, parent-generation and write-order rules are preserved. Real keyboard attempts no longer mutate the draft; real Guest quota and Account stale-version errors restore editing with the correct draft and no false success.
- **Regression boundary checked:** production Guest routes and Account Server Actions, same-editor success/failure, another editor, day change, unmount and a new draft while an old response completes. Guest latency is explicitly fixture-controlled around actual production components and storage; it does not pretend that localStorage has asynchronous network behavior. Account response delay preserves real authenticated persistence and readback.
- **Scope review:** runtime changes are only next.ts and PlanpunktEditor.tsx. Existing TripWorkspacePlan required no change. Remaining code changes are the discovered pure test and owned active browser runner. No public API, database column, new package, policy constant, provider source, authorization or commercial-field behavior changed.

See current delivery-summary for the P0/P1/P2/P3 assessment and actual fresh gates. This remains an implementation self-review. Independent exact-head rereview is still required; stay Draft.

## Initial self-review — historical R0 record

Writer: Reiseplan integrated operating experience 1 — Generation 1. Session `01a113b2-5444-7550-983d-7a156c60731e`, actual `gpt-6-astra / xhigh`. This is an implementation self-review, not independent TL approval. PR #903 must remain Draft.

## Review findings and corrections

- Confirmed Account saves now require the actual affected row, expected existing `updated_at`, owner/trip/day predicates and an authoritative graph readback. Zero rows and stale drafts fail visibly. The local authenticated owner/outsider checks exercise RLS even when caller identity is falsified.
- A real delayed Server Action exposed an old day URL replay. Copying Next's private history markers bypassed its native-history synchronization. Application state is preserved, while Next now supplies its own internal markers. A subsequent full run exposed editor closure despite the corrected URL: generic actions now return confirmed data without an obsolete action-time RSC tree, then the caller refreshes the current force-dynamic route. Editor generation and mounted-form guards prevent old completions closing a newer draft. Repeated real Account browser testing is recorded in the final report.
- Error focus originally fell onto the page when Save became disabled. The retained error receives focus, so Escape restores the exact editor trigger.
- F02 was reproduced through the real Guest flight editor: reclassification from an unassigned flight bucket now follows authoritative route equality to the saved item, with visible focus and an accurate status. A newer write invalidates an older focus request. Date-Line fields survive reload without collapsing the structured itinerary into an invented summary interval.
- At 200% text the initial page-width check missed child overflow within the editor. The form uses a bounded single-column grid and the new actions wrap. The browser now checks the form's own scroll width as well as document overflow. Native date/time controls remain browser controls and need physical-device/Safari usability review.
- Unknown movement candidates now include all unassigned transfers, rentals and other flights. Rental pickup/dropoff never proves a driven chain; unknown occurrence prevents coverage. The canonical untrusted intake continues stripping surface authority. A synthetic typed qualified edge tests the production prompt/prefill with actual Guest writes; this is explicitly separate from live source activation.
- Same-phase maxima, explicit inclusion, unknown policy, bounded interval union and unknown usable-window terms remain conservative. No default margin, device-time countdown, FX or fictitious venue pin was introduced.
- Original Core/temporal callback assertions remain. Only the new explicit date/end/clientRef contract and time-field label changed. The legacy callback harness has no edit handler, so its original direct keyboard path to Delete is retained.

## Scope and residual review areas

No files in lib/readiness, lib/route, lib/mobility, hosted migrations, Auth/RLS configuration, dependency manifests, CI or global governance were modified. Read-only canonical consumers retain their source boundaries. The immutable TASK hash is verified separately. No real customer data, hosted write, provider call, paid service or other agent was used.

Required independent review should inspect the new atomic Account write predicates, response ordering/current-context behavior, exact dependency counts and the deliberate difference between qualified synthetic consumers and the live planned-order/unavailable fallbacks. Retained lint warnings are recorded rather than silently suppressed. No implementation self-review can replace exact-head independent approval or physical assistive-technology testing.
