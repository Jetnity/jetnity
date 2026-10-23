# Jetnity — Direct Edit Lodging Coverage Preview 1 — TASK V2

Date: 23 October 2026 (Europe/Zurich)
Authority: Technical Lead R98, before Cursor dispatch.
Issue #970 / Draft PR #973 / branch `feat/direct-edit-lodging-coverage-preview-1`.
Cursor-Agent: **Jetnity Direct Edit Lodging Coverage Preview 1 — Cursor Generation 1**.

This immutable V2 addendum must be read together with [the original immutable task](./JETNITY_DIRECT_EDIT_LODGING_COVERAGE_PREVIEW_1_TASK_2026-10-23.md), blob `258bed9fc85ae8dbcc978ef1715132e9b0978e58`, originally seeded at `491f528dded48f20937abfa808015e99d56f44f1`.
All objective, allowlist, truth/authority boundaries, acceptance and STOP rules remain. No scope expansion or shared-evaluator change is authorized.

## Verified reason

Independent read-only task review identified a browser-computation risk. TL verified it directly in main `5269b9192a2300c6c03fc8659964583130d2d1d1`: `lib/trips/naechte-abdeckung.ts` enumerates each night in required stage/trip and stay intervals via `naechteHalboffen`, including repeated required-interval passes. A 20-row presentation limit does not bound this work. Very long validly shaped dates must not freeze a new synchronous browser preview.

## Binding clarification to original task §5.9 and §6

Before calling `unterkunftAbdeckung` on either snapshot, use a small nonmutating computational admission check inside the owned projection:
- cover every relevant trip/stage/stay date interval and the aggregate estimated night-enumeration work across both snapshots, including repeated evaluator passes;
- use stable repository bounds or stricter documented finite local computation limits; do not assume the trip's duration limit also bounds every stage/stay span;
- check interval length arithmetically, without enumerating the nights to discover that enumeration is too large;
- if a side exceeds its admitted budget, mark that side unavailable/incomplete without invoking the evaluator for it, altering the draft, blocking the existing confirmation or inferring zero coverage;
- retain per-side unknown truth and no conclusive comparison when either side is unqualified.

Add meaningful tests with validly shaped excessive stay/stage spans and excessive aggregate work. Verify the evaluator is not reached for a rejected side, with the smallest testable design within the existing allowlist. Use the validated graph's existing structure; do not add a generic hostile-object/security framework or duplicate canonical night-coverage calculations.

The canonical evaluator and shared schemas stay READ ONLY. This guards new consumption; it does not authorize a repository-wide performance refactor.

Requested model remains Claude Opus 5.5 High, no silent Auto/fallback. Same exact logical agent, one writer, own Draft PR. Record both immutable task blobs in the handoff.
**DO NOT MARK READY. DO NOT MERGE. DO NOT START FOLLOW-UP. STOP FOR INDEPENDENT TL REVIEW.**
