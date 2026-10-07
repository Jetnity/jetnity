# Integrated Reiseplan implementation plan

Date: 2026-10-07 (Europe/Zurich)
Writer: Reiseplan integrated operating experience 1 — Generation 1
Session: 01a113b2-5444-7550-983d-7a156c60731e
Model/effort: gpt-6-astra / xhigh (current session turn_context, independently read).
Branch: feat/trip-plan-integrated-operating-experience-1; Issue #902; Draft #903.
Baseline: 0481173cf56f13e5316246503e4683ad843728f2.
Seed: 0861dfd3dfd1955be6c03691119e6a706a27fff8.
Immutable TASK blob: 3df8bca929f287cdd7e996b4c051c38205611e67.

## Delivery sequence
1. Reconcile #888/#897, #889/#890 and real graph/mutation/navigation interfaces; freeze acceptance cases.
2. Complete existing-field manual create/edit, validated versioned account writes and guest persistence/readback. Preserve commercial domain editors and recover focus after save/reclassification.
3. Integrate saved costs, locations, booking/Preparation and exact before/after impact into the current Plan; use current IDs and navigation.
4. Add bounded movement/gap/phase/qualified-next evaluators, conservative real-graph adapters and closed external-context consumers with zero default I/O.
5. Execute real Guest browser flows and adversarial fixtures, account boundary tests and owned local authenticated stack if available; full gates, remote verification, final exact-head handoff.

## Boundaries and risks
Only TASK §12 paths. No database/schema/RLS/Auth changes, dependencies, package scripts, Official Truth or global governance edits. One Trip graph; derived projections are transient. No external activation or new costs. Account writes use server-verified identity, RLS, closed schemas, expected row version and confirmed returned row; no success on zero rows. Missing dates, locations, prices, clock qualification and policies remain unknown. Local dates cannot imply elapsed time. UI late responses must not reset newly selected context. Authenticated persistence and real devices are separate proof boundaries.

## Tests
TASK §13 cases C01–C16 are the stable matrix. Existing Core/temporal regressions remain. New tests use the existing lib/**/*.test.ts discovery. Direct runner (no package edit) will record human and machine-readable results. Browser widths 360/390/768/1440 and 200% text, genuine production Guest handlers, failure/reload/navigation. Full npm test, typecheck, lint, build, six hygiene/mode gates and diff check. Remote CI/Auth/Preview only accepted at delivered SHA.
