# V1 Account Graph Read Completeness 1 – Decision

Stand: 21. September 2026  
Status: **SLICE-LOCAL READ-BOUNDARY DECISION / NOT A SHARED TYPE CHANGE / NOT A SCHEMA CHANGE**  
Issue: #529  
Draft PR: #531

This is a slice-local decision. It does not replace Dual-Authority, Traveller or Readiness contracts.

## Date

21 September 2026

## Decision

An account trip graph that is structurally incomplete at the traveller-child load boundary is reported with the existing `Lesung.problem` (`status: 500`, `zeilen: null`). It is not mapped to a successful `Reisegraph`.

Complete canonical rows, including `trip_travellers: []` and loaded empty child arrays, remain successful graphs. The narrowly detected Foundation-E fallback query remains; nonempty fallback rows do not become a Trip.

## Context

Live `reiseLaden` retried a missing citizenship/document relation with `TRIP_GRAPH_SELECT_LEGACY` and mapped leftover singular columns through `partyAusZeilen`. Independent TL probe on `e818c13`: one synthetic row without child arrays became one citizenship and one document. A warning on an otherwise successful Trip would still let workspace and actions use reconstructed credentials.

TA-R3 originally mentioned a degraded flag on readiness. The binding task forbids a persisted Trip/Traveller/Readiness contract change.

## Alternatives

1. Add a degraded/incomplete flag to Trip or readiness and let consumers interpret it.
2. Filter incomplete travellers out of an otherwise successful party.
3. Treat missing child relations as empty arrays.
4. Keep `Lesung.problem` and fail the exceptional read before mapping.

## Rationale

Alternative 4 was chosen.

- Existing page and server-action consumers already stop on `problem` before render or mutation.
- No shared identity, credential or readiness type changes.
- Missing is not empty. Empty canonical children stay authoritative empty.
- Filtering an incomplete traveller would invent a smaller, still-trusted party.
- Internal 500 is not a claim that the database is unreachable and not a claim that the trip was deleted.

## Consequences

- While this exceptional read is incomplete, the affected account workspace/actions are unavailable.
- Guest `partyAusZeilen` legacy expansion is unchanged. The account read boundary owns whether that result can enter current account Trip consumers.
- Expand/contract detector and legacy select stay. No schema change.
- Product copy already maps 500 to a generic load failure. SQL/schema/raw rows are not exposed.
- Parallel #532 remains independent. Integration order is this PR, then guest preservation.
