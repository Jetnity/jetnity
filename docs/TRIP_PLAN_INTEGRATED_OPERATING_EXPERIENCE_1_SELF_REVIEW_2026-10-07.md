# Integrated Reiseplan — implementation self-review

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
