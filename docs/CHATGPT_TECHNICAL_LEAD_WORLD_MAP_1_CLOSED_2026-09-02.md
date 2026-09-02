# Jetnity – Technical-Lead Closure: World Map 1 / Planned Account Truth

Stand: 2. September 2026  
Status: **CLOSED / MERGED / POST-MERGE VERIFIED / NO ACTIVE CURSOR AGENT / NO AUTOMATIC FOLLOW-UP SLICE**

## 1. Scope

World Map 1 added the bounded **Deine Welt** surface to authenticated Account Home using only existing account-trip stage truth.

Binding truth remains:

> A planned trip/place is not proof of a visit.

The slice does not create visited/travel-history persistence and does not infer visited from past dates, archived status, trip status, labels, coordinates or array order.

## 2. Accepted exact head and review history

Original task:

- Issue #419
- original Draft PR #422
- Branch `feat/phase-1-world-map-1-planned-truth`
- Cursor-Agent `Jetnity world map 1`
- Generation 1
- Session `bc-bcfe4a30-460b-439d-8f14-96ec910487ac`

Rejected exact head:

`bf2936c9fb41a6e65ed4d29f573c2820c0a7e3dc`

Technical-Lead CHANGES REQUIRED review:

`5092964996`

Required fixes:

1. remove hidden `herkuenfte[0]` trip-navigation default for a place shared by multiple trips;
2. keep `TripSummaryStage` backward-compatible instead of requiring World-Map-only fields from every caller;
3. restore `docs/ACTIVE_WORK_STATUS.md` additively so provider gates, Traveller truth, truth architecture and global V1 continuity are not lost.

Accepted exact head:

`cbed98062120ce8be125db5870fd0f108b29a3c0`

Technical-Lead FINAL PASS review:

`5093273775`

The final independent review confirmed all three findings closed, no new blocker, no scope creep and no special Product-Owner gate.

## 3. Integration path

The GitHub connector again failed to transition the original Draft PR #422 to Ready because its GraphQL mutation references the unsupported field `Repository.fullDatabaseId`.

No implementation changed after PASS.

A recovery branch was therefore created directly from the accepted exact SHA:

`recovery/world-map-1-accepted-cbed980`

Recovery PR #423 was non-draft and pointed exactly to the accepted SHA. Its own strict required checks were allowed to rerun before integration.

Recovery PR #423:

- exact head `cbed98062120ce8be125db5870fd0f108b29a3c0`;
- Recovery CI #1710: **SUCCESS**;
- Recovery Vercel `dpl_9EdzgBfbb9v6nocdh1UwRnWTavm2`: **READY**;
- merged with method `merge` and expected-head SHA lock.

Main merge commit:

`6b5cf463664a41cd59bdfc7f83cbc43a982ea557`

Commit:

`Integrate World Map 1 (#423)`

GitHub subsequently reports original Draft PR #422 as closed/merged because its exact head is contained by the same integration. The canonical integration vehicle remains recovery PR #423; do not treat #422 as an unfinished Draft.

Issue #419 is **CLOSED / COMPLETED**.

## 4. Post-merge verification

Exact merged `main` SHA:

`6b5cf463664a41cd59bdfc7f83cbc43a982ea557`

Post-merge GitHub Actions:

- CI #1711: **SUCCESS**;
- `Auth-Konfiguration gegen config.toml`: SUCCESS;
- Typecheck: SUCCESS;
- Lint: SUCCESS;
- Tests: SUCCESS;
- repository hygiene checks: SUCCESS;
- Production build: SUCCESS.

Vercel Production:

- deployment `dpl_XcCUqnsiVydSmJCQRbSBfGUvn7Ss`;
- target `production`;
- exact GitHub SHA `6b5cf463664a41cd59bdfc7f83cbc43a982ea557`;
- state **READY**.

No Supabase verification was required for this slice because no schema, migration, RLS, grant, role or function changed.

## 5. Accepted product / truth behavior

World Map 1 is presentation-only account orientation:

- uses existing `reisenLaden()` / `TripSummary` path; no second account-trip query;
- `TripSummaryStage` can carry stored `countryCode`, `placeId`, `latitude`, `longitude`, while legacy `{ name, position }` remains valid;
- only finite valid stored coordinates become map points;
- missing coordinates remain list-only and are not guessed;
- missing country is not inferred from name, coordinates or `placeId`;
- exact non-empty `placeId` may aggregate a display place;
- provenance for every contributing trip/stage remains retained;
- unique contributing trips are keyed by `tripId`, not title or array order;
- the UI exposes each unique trip explicitly rather than silently choosing one;
- no visited value is derived;
- the UI explicitly says confirmed visit history is not yet captured instead of claiming `0 besucht`;
- no commercial search is mounted;
- no Mapbox/Google/Here/OpenStreetMap tiles/geocoder or other runtime map service is introduced;
- the local simplified land silhouette has no runtime fetch or recurring service cost;
- accessible text/list fallback remains available in addition to the map.

## 6. Boundaries that remain closed

World Map 1 does **not** authorize or complete:

- visited/travel-history persistence or write UI;
- provider application/signup/contact/Terms/DPA/contracts;
- real provider selection;
- Production S6 runtime/HMAC/>0 budget;
- live provider secrets or paid/live calls;
- Commercial Provenance runtime writer;
- TW-8/TW-9;
- service worker/offline/push;
- public indexing/domain cutover;
- payments;
- any follow-up World Map expansion.

Product-Owner gates A–E remain **UNAPPROVED / CLOSED**.

## 7. Global invariants remain binding

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete Optionen.**

Never infer default/primary/preferred citizenship or passport, array order as truth, Residence → Citizenship or Issuer Country → Citizenship.

> **OFFICIAL TRUTH ≠ PROVIDER TRUTH ≠ JETNITY RECOMMENDATION ≠ COMMUNITY OPINION ≠ GENERATED SUGGESTION.**

`unknown ≠ not_required`. `unavailable ≠ not_required`. `stale ≠ current`. LLM ≠ Official Truth.

## 8. Next-cycle rule

There is **no active Cursor coding agent and no automatically authorized follow-up slice** from this closure.

The next Technical-Lead cycle must reconstruct live `main`, PRs/issues, CI/Vercel and current gates, then select the smallest responsible remaining provider-independent V1 gap. Do not reopen World Map 1 merely because future visited-history work remains intentionally separate.
