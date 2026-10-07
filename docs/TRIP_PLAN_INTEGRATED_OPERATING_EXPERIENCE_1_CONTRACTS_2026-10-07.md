# Integrated Reiseplan — implemented contracts

2026-10-07, Europe/Zurich. Writer: Reiseplan integrated operating experience 1 — Generation 1.
Session `01a113b2-5444-7550-983d-7a156c60731e`; actual persisted turn context `gpt-6-astra / xhigh`.
Issue #902, Draft #903, branch `feat/trip-plan-integrated-operating-experience-1`.
Baseline `0481173cf56f13e5316246503e4683ad843728f2`; seed `0861dfd3dfd1955be6c03691119e6a706a27fff8`.
Immutable TASK blob `3df8bca929f287cdd7e996b4c051c38205611e67`.

## Canonical integration

`timelineAbleiten`, Core `tagesTimelineAbleiten` and `tripZeitpruefung` remain the selected-day/original-reference, chronology and temporal authorities. The corrected #897 closed estimate range is unchanged. `routeFactsFuerPunkt` supplies canonical flight topology. Readiness is consumed read-only; Official evaluations remain in the existing Workspace/Preparation path. No new parallel Trip, timezone resolver, provider or persisted derived data.

`TripWorkspacePlan` owns the real editor and integrated day projection. Guest callbacks use existing local storage; Account callbacks use authenticated Server Actions. Navigation uses existing item IDs and `PreparationZiel` section/traveller targets. There is no claimed task-row deep link where the canonical target contract does not support it. Preparation child history now supports Escape/back/forward and exact trigger restoration. F02 waits for the confirmed canonical flight route before finding and focusing its new bucket.

## Editing and persistence

`PlanpunktFormular` adds optional `clientRef`, `startsOn`, `endsOn`, `endsAt` to existing fields. New forms visibly prefill the selected date; existing null dates/endpoints stay null. The stable form UUID makes confirmed retries idempotent. A different request with the same ID conflicts.

`PlanAenderung` is a closed discriminated union: `inhalt` with manual activity/note content and `dayId`, or `platzierung` with `dayId` only. Manual content requires null provider, external reference and booking URL. Other kinds use their established flight/stay/mobility editors. Placement changes no commercial, route, stage or booking facts. No generic authority fields, implicit midnight rollover or inferred date from day assignment. End date requires a start date; end time requires a start time. Same-known-date intervals must increase.

Guest edits compare the exact captured original against the current stored canonical item and require a unique identity. They save and read back the result. Account writes use the verified session/RLS client, owner/trip/day predicates and existing `updated_at` as an atomic compare-and-set. `TripItem.rowVersion?` maps that existing column; it is not a schema addition. A zero-row update fails. Actions read back the complete authoritative Trip and confirm the row version before returning success. A written but unconfirmed result reports failure rather than pretending success. Pending guards prevent double submit; mounted-form guards preserve a newer day/editor; response ordering protects confirmed Account snapshots. Refresh remains authoritative. Native History writes keep application state but omit Next’s internal bypass markers on input; Next’s public wrapper then synchronizes its router URL and restores its internal tree itself. Copying those markers bypassed that synchronization and a late Account response replayed the old day URL. The delayed-response browser regression covers this boundary. New generic Plan actions return the confirmed graph without action-time RSC revalidation; both trip routes are already force-dynamic, and the caller refreshes the current route after the response. Existing dedicated action contracts remain unchanged. An editor generation guard additionally prevents completion from closing a newer editor. Background external edits still require the existing refresh/reload path.

## Day summaries, costs and places

Canonical IDs deduplicate identical entries; contradictory duplicates are excluded and reported as incomplete. Prices sum integer cents per original currency. Explicit zero, missing, invalid and ambiguous prices differ. Whole stay/rental prices appear once on the assigned day; unassigned amounts remain separate. There is no FX, payment, live availability or total-trip-cost inference.

The optional location section retains all ordered stops, labels absent venue coordinates as unknown and uses only validated stage coordinates as `Etappenort`. Zero coordinates are valid. Its SVG is explicitly a schematic world position, with no road tiles, routes or invented venue pin.

Stored booking copy separates user-confirmed booked from selected/unconfirmed. Exact item-linked personal tasks retain canonical open/stale/current semantics; personal confirmations never certify official entry requirements.

## Movement, interval, policy and next consumers

Movement coverage requires the same trip, exact namespace/precision/direction and occurrence, a complete chain and complete inventory. Unknown or duplicate plausible candidates block a missing claim. Live needs are limited to explicitly proven canonical surface changes within a flight itinerary; all assigned/unassigned transfer/rental/other-flight candidates are inspected. No current persisted occurrence relation is fabricated. The existing browser/Guest intake strips surface authority; it cannot manufacture a qualified missing-transfer prompt. The qualified prompt/prefill is separately exercised with an explicitly synthetic typed source and actual Guest persistence, not presented as live source activation. Missing-in-plan opens the existing editable manual movement form with exact airport references; it performs no automatic save and proves nothing about real tickets or physical feasibility.

`intervalUnion` merges nested/touching occupied intervals. The live adapter includes unassigned commitments and keeps explicitly shared civil axes separate. Civil differences never become elapsed or usable time; empty days get no artificial midnight boundary. `usableWindows` requires all explicit proof terms. `bufferReview` consumes named versioned policies, phase maxima, sequential composition and explicit inclusion deduplication; ambiguity/cycles/unknown terms fail. Production passes no operational policy and no numeric default. Optional user what-if margins were not added.

`nextReview` receives qualified clock/candidate inputs explicitly, including uncertainty, ties, boundaries, start-only roles, expiry and generation invalidation. It never reads device time. Production has no admitted clock and shows only navigation through the selected day's planned order. A future selected day is not trip-wide next-now truth.

## Change impact

In-memory exact snapshots exclude row-version-only churn and include all consumed item/day/stage fields. Preview is conditional future tense; confirmed saved changes use past tense; initial load claims no history. Only uniquely identified, exact item-linked preparation targets count. Changed source rows and price/location summaries are not additional affected targets. Unknown relations stay unknown. No task status rewrite or cascade mutation.

## External admission boundary

Server-only `plan-context/v1` is closed and bounded (16 source responses). Policies are code-owned; the production list is empty. Exact kind, subject, location precision, occurrence, region, interval, unit, origin/source, observed/retrieved/valid times, freshness and kind-specific values are checked. Hours require exact venue and complete exceptions; reservation context cannot come from notes; routing requires directed endpoints. Empty transport, explicit empty source, unavailable, error, stale and conflict differ. Browser `verified:true` and unknown fields are rejected. The live default performs zero I/O and stays collapsed on demand. Qualified synthetic tests establish consumer software only, never live provider verification.

## Validation boundary

One command: `node scripts/trip-plan-integrated-operating-experience-1-audit.mjs` with existing Node 22 dependencies, Chrome and pre-existing local Docker images on macOS. The runner records source hashes, full tests, typecheck/lint/build, six hygiene/mode checks, production Guest and real authenticated Account browser flows plus existing Core/temporal/navigation/premium audits. Linux tests use an owned disposable PostgreSQL image and real Git checkout. Account proof uses real GoTrue, PostgREST and the scoped existing trip/readiness migrations in an empty local DB, not hosted schema parity. No secret or real traveller data is evidence. Physical devices, WebKit and screen-reader use remain separately not run.
