# R107-M query/cursor independent review helper notes

Read-only root review helper `/root/world_review`; not Cursor, Guardian, Technical-Lead acceptance, Ready or merge authority.

## Candidate identity

- PR #1019, open Draft at final API check; branch `feat/r107-my-trips-collection-archive-workflow-1`.
- Head `863b7f3b879eaa1723cee57879eda521ecd223e9`, tree `e62e12fffb4a87c4b69698f647500aecdde136b0`.
- Base and merge-base `a74c443c6be3f064f150fcf021ab6154bda325e5`, 8 ahead, 0 behind, 35 changed paths.
- TASK V1 blob `eeb1f1239e07df5d9d9bc7459c4c83918b947777`, unchanged.
- Accepted PLAN head `424c21b49b339750c3fc5c556599692e86fb3ffa`, blob `be715fed0e1c08b111d57410cfa21231a91c7474`.
- Current PLAN blob `b6f139a20d179ac055842966ad6cf584a0511a30`; relevant query/search/cursor design unchanged. Navigation changes and root binding clarification incorporated; root assesses approval implications.
- Genuine author: Jetnity My Trips Collection and Archive Workflow Completion 1 — Cursor Generation 1; session `bc-27e5e422-852b-49c7-9b67-0fc723f13175`, model `grok-4.7-high-fast`.
- Runtime proof commit `ddd1f7eace34519996ec686223d684102a933baa`, tree `b93520b622c470b208281da73092da4622e3829c`. Live comparison confirms only four delivery documents, JSON evidence and four PNGs added afterward; runtime source unchanged.

## Result in assigned query/mapper scope

No confirmed material defect in literal search encoding, semantic cursor validation, exact microseconds, stable-order pagination, shared summary mapping or Auth/RLS boundary. This is not approval of the whole candidate.

The earlier hypothesis about trailing line terminators passing JavaScript dollar anchors did not reproduce and was explicitly retracted. LF, CR, U+2028, U+2029 and CRLF appended to timestamp or UUID are rejected, including hand-crafted tokens through the reader validation seam.

One confirmed cross-layer discrepancy was sent to root for mounted UI assessment: `kanonischeAdresse` at `lib/trips/reisen-sammlung-abfrage.ts:241–260` uses `.get` only. Repeated parameters are flattened in the live canonical address, but the server rejects them and preserves all values in `reisen-sammlung-daten.ts:35–55`. Example `/reisen?q=a&q=b`: live canonical `/reisen?q=a`; invalid server address `/reisen?q=a&q=b`. Server makes no query. This helper did not prove a mounted user-facing failure or assign severity; root/UI reviewer owns that assessment.

## Verification performed

Read immutable TASK, accepted PLAN relevant query/reader/mapper and scope sections, current PLAN changes, delivery STATUS/REPORT/HANDOFF/SELF_REVIEW, full relevant query/reader/mapper source and tests, route diff, four approved test retarget diffs, installed PostgREST builder source and primary PostgREST/PostgreSQL documentation.

The mapper extraction matches the prior field conversions, status fallback, stage fields/counts and archive provenance. Existing `reisenLaden` retains its authenticated factory, one `lese` query, `updated_at DESC`, cap 200 and graph readers. No Auth/RLS/schema/provider changes are present in this diff. New reader uses the same authenticated factory, one shared summary select and limit 49, presents 48, and creates continuation from the final displayed row's unmodified timestamp and ID.

Executed actual candidate test modules directly with `node --require ./review-register.cjs --import tsx`:

- `lib/trips/reisen-sammlung-abfrage.test.ts`: 8 tests passed.
- `lib/trips/reisen-sammlung-daten.test.ts`: 5 tests passed.
- `lib/trips/reisen-uebersicht.test.ts`: 2 tests passed.

Independent probe `independent-query-probe.cjs` and machine-readable `independent-query-probe.json`:

- Actual installed PostgREST builder retained both search and keyset OR parameters, status predicate, `updated_at.desc,id.desc`, limit 49 and one callback invocation.
- 251 rows with timestamp tie groups spanning page boundaries, adjacent microseconds, and equal instants represented at different fractional precision traversed as 48,48,48,48,48,11; 251 unique IDs, six reads, original boundary text preserved.
- 26 hand-crafted invalid cursor payloads/repeated parameters made zero transport calls.
- 30 literal search cases round-tripped PostgREST quoting and closed regex literal encoding.
- All 31 staged text-file Git blobs rechecked and unchanged from exact candidate.

## Execution boundary

Node `v24.22.1`, existing node_modules at `/tmp/jetnity-r106-t-final-review/node_modules`. No installation. This is not the project's required Node22 native gate. Supabase factory and server-only modules are intercepted by a scratch-only register; any attempt to construct a real server client throws. No environment/credential reads, hosted database queries, HTTP requests, paid calls, browser or external writes. The PostgREST client's fetch is an in-process synthetic callback. The fixture evaluates emitted keyset predicates; PostgreSQL search/collation and production query planning were not executed. Source files and shared review directories were not changed.

Root owns remaining UI, native CI, deployment and final Technical-Lead gates.
