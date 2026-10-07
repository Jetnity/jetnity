# Integrated Reiseplan — delivery report

## R1 correction — current delivery

The independent TL found two P2 defects in delivered head `b19bfbf9cd591b361740cbb2fbc5920fa81991e6`. Review ID: `TL-20261007-900-903-R1`. The user supplied the findings from the steering chat; the TL had read-only GitHub access. They were transmitted unchanged in [PR comment 6035567894](https://github.com/Jetnity/jetnity/pull/903#issuecomment-6035567894). This is a transmitted instruction, not a GitHub review authored by the TL or an independent writer approval.

F1: identical non-point event/clock ranges previously produced a certain current milestone without correlation. The same regression fails on the reviewed source blob `26f1bbe45c545cc91442d42a314ff33f5ebed03c` and passes after restricting current equality to identical exact points. Eleven active cases cover identical ranges, partial overlap, exact points, separated ranges, closed boundaries and one-sided uncertainty. No clock authority, correlation or live activation was added.

F2: actual keyboard input could change a pending title A to B; the older successful response closed the editor while persistence contained A. Both Guest and real local Account reproduced this. All relevant input/select/textarea controls now share the pending disable state, with a visible role=status saving message. Success closes only the accepted draft; errors re-enable the same draft, retain values and show no saved success. Existing parent-generation, alive and write-order guards are unchanged; no edit to TripWorkspacePlan was needed.

Active delayed-response tests cover create success (including Art), edit success (including day assignment), and failure for both modes. Guest uses production Plan/Editor plus actual Guest storage, including a real quota exception; only callback response delivery is gated in an explicitly synthetic fixture because Guest storage writes are synchronous. The full production Guest route is tested separately. Account uses the existing real local GoTrue/PostgREST/RLS stack and production Server Actions; only delivery of the real response is held, and failure comes from a real competing row update. Tests attempt keyboard input, check every field, confirm authoritative readback, and rerun other-editor/day, unmount, late-response and newer-draft protection.

R1 source: local `5784f243372c42b206044c60c9a787c25ffb0ea7`, equivalent remote `047bebdd98cb7e50c39ae020834b3c79a8bca321`, identical tree `f895eb80d948e4e98583e3073497cef6bb31f1a5`. Source publication uses the existing authorized connector and expected-head non-force update. Final evidence delivery, including an additional verified Account error-focus assertion with unchanged production code, receives fresh exact-head CI/Auth/Preview checks recorded in the external exact-head packet. The source hash manifest binds actual test inputs; the Linux full-suite runner overlays these inputs over its preserved local checkpoint clone.

Current totals, gate results and P0/P1/P2/P3 assessment are in `delivery-summary.json`; R1 RED observations and source blobs are in `r1-red.json`, F1 TAP evidence in `r1-f1-{red,green}.txt`, and delayed form observations in `r1-{guest,account}-editor.json`. The original three Account repeat logs are historical R0 evidence, not R1 reruns. Seven scoped existing application migrations (plus GoTrue's own local migrations) are used by the current local harness; the prior report's count of eight application migrations was inaccurate. No hosted schema/Auth/RLS change occurred.

The full C01–C16 acceptance matrix remains, with current R1 evidence added. The historical delivery below records the earlier state and does not assert that R0 was free of the two independently discovered defects. Physical devices, Safari/WebKit and screen-reader operation remain NOT_RUN; live consumers remain unactivated. Remain Draft and STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD RE-REVIEW.

## Initial delivery — historical R0 record

Writer: Reiseplan integrated operating experience 1 — Generation 1. Issue #902; Draft PR #903. Session `01a113b2-5444-7550-983d-7a156c60731e`, actual model/effort `gpt-6-astra / xhigh` from the persisted session turn context. No external agent was launched.

## Delivered functionality

The existing Trip Workspace now connects day navigation, real manual activity/note creation and editing, explicit dates/start/end clocks, day assignment/unscheduling, confirmed persistence, booking/personal preparation hints, saved original-currency prices, known/unknown location context, and exact in-memory change preview/review. Flights, stays and mobility retain their dedicated mutation paths and commercial protection. Core chronology and corrected #897 temporal review remain active and unchanged.

Account writes use closed input, verified session/RLS, same-trip membership, existing row-version compare-and-set, confirmed affected row and authoritative graph readback. Errors retain drafts. A real delayed Server Action regression caused both old-URL replay and newer-editor closure during development; native-history synchronization, data-only generic action responses, response ordering and editor generation guards fix those cases. F02 saved flight reclassification restores visible focus to the actual result; F05 relevant accessible state labels are human-readable. Preparation history supports back/forward/Escape and returns to the exact supported origin.

The integrated day consumes bounded movement, interval union, phase/policy, usable-window and qualified-next evaluators conservatively. Current production has no admitted clock or numeric operational-margin policy: it offers planned navigation, never device-based next-now, physical feasibility or invented usable time. All assigned/unassigned plausible movement candidates are considered. Browser/Guest intake continues stripping surface authority. The qualified missing-transfer prompt and editable prefill were exercised using an explicitly synthetic typed input and real Guest persistence; this is not live authoritative route activation.

Prices use unique canonical identities, original currencies and explicit missing/invalid/zero treatment. A multi-day price is counted once on its assigned day; unassigned amounts are separate. The optional stage-position schematic is labelled Etappenort, retains unlocated stops, and has no street tiles/geocoding. Impact counts exact, unique item-linked preparation targets; summaries and changed source items are not additional affected points. First load invents no history; preview performs no write.

## Source identity and delivery mechanism

Baseline and merge-base: `0481173cf56f13e5316246503e4683ad843728f2`.
Seed: `0861dfd3dfd1955be6c03691119e6a706a27fff8`.
Immutable TASK blob: `3df8bca929f287cdd7e996b4c051c38205611e67`.
Local final source commit: `1b38849879f6ad713ea0d5f86b5c0ab1426be5ca`.
Remote equivalent source commit: `f2c65c41da43236895ee116f9de0c603b7c37859`.
Identical source tree: `f7cfa0dfe66ebd3197b67a64c883c60e907fab8a`.

CLI Git had no usable authenticated push configuration. The authorized GitHub connector recreated the cohesive commits and advanced only the authorized branch with an expected-head lease and `force:false`. Each Git tree was checked byte-for-byte by SHA against its local source. Author/timestamp differences produce different commit IDs; no source equivalence is inferred merely from a similar message. `delivery-source-map.json` records the mapping. The final report/evidence commit adds documentation only. Its exact remote SHA, final tree/main/ahead-behind, CI/Auth/Preview are supplied in the final delivery packet, avoiding a self-referential commit hash in this file. No reset, force push or foreign-branch synchronization was used.

## Acceptance and proof boundaries

Final classification and exact gate totals are recorded in `docs/evidence/trip-plan-integrated-operating-experience-1/delivery-summary.json` and the delivered exact-head packet. The stable C01–C16 matrix maps each requirement to evidence and explicitly identifies limits.

| Boundary | Implemented/executed scope |
| --- | --- |
| guestEndToEnd | Real production `/reisen/trip-*` route and Guest handlers: create/edit, explicit null/date/time preservation, save/reload identity, quota failure with retained input, day move, preview/saved impact, costs/places, exact Preparation return, empty/flexible/120-day six-stage trip, F02 and Date-Line route preservation. |
| accountPersistenceEndToEnd | Real local GoTrue signup/getUser, authenticated PostgREST/RLS owner/outsider checks, actual account writer and production Server Actions, stale/zero-row denial, authoritative reload and delayed-response/new-draft preservation. Three fresh-stack repeats passed before the final full run. This is not hosted schema/Auth parity. |
| crossDeviceEvidence | Chrome `154.0.8037.98` automation, 360/390/768/1440 at ordinary and 200% root text, actual form bounds, keyboard/focus/reduced motion, landscape, plus existing premium viewport regressions. Physical devices, Safari/WebKit and assistive screen-reader operation NOT_RUN. |
| externalConsumers | Closed bounded server-owned weather/hours/routing/reservation consumers with qualified synthetic positive/negative fixtures: SOFTWARE_COMPLETE_NOT_ACTIVATED. |
| externalLiveActivation | NOT_ACTIVATED. Empty source policies and zero new network calls by default; current clock and operational policy remain unconfigured. |

Direct runner, using existing Node 22/tsx/Chrome and already available local Docker images:

```sh
node scripts/trip-plan-integrated-operating-experience-1-audit.mjs
```

The runner generates readable and JSON reports, source hashes, full npm discovery in an owned networkless Linux PostgreSQL/Node runtime, typecheck, lint, production build, all six hygiene/mode gates, diff check, real Guest/Account browsers and four existing browser regression suites. It fails on failed assertions. Account resources are uniquely owned, loopback-only and removed after execution. The eight scoped existing migrations were read into an empty local DB; hosted migrations, Auth/RLS configuration and #900 were not changed. Reproduction requires the documented pre-existing images in the runner; it does not download/install services or credentials. Raw full test output is retained compressed as evidence; smaller logs are readable. Only a curated synthetic screenshot set is committed.

Earlier failed runs are not treated as green evidence. The final source-bound audit supersedes them; findings and corrections are documented in SELF_REVIEW. Existing callback-harness UI results are labelled separately from genuine persistence E2E. Remote CI runs its configured suite, not this local browser/Account harness.

## Consolidated remaining activation and environment packet

| Capability/boundary | Current state | Separate decision/proof needed |
| --- | --- | --- |
| Weather | Qualified consumer software, no source | Approved source, region/units/subject semantics, source-owned freshness, terms and credentials; advisory only. |
| Venue hours and reservations | Qualified exact-venue consumers, no source | Exact venue/occurrence mapping, hours exceptions, source validity, reservation proof and approved access; notes remain notes. |
| Directions/traffic and operational facts | Conservative evaluator, no live source | Approved directed endpoints/occurrence chain, travel and phase provenance, reviewed versioned policies; no default airport margin. |
| Qualified clock/timezone | Mathematical consumer, planned-order live fallback | Reviewed clock authority, uncertainty/expiry/resume policy and exact timezone inputs; device locale is not authority. |
| Official Truth / #900 | Existing read-only route to Preparation | Independent owning workstream and TL decisions; personal completion never resolves official requirements. |
| Physical devices/WebKit/screen reader | Automated Chromium evidence only | Independent manual and device/browser accessibility checks, including native date/time controls at narrow 200% text. |
| Hosted schema/Auth/release | Not modified or exercised by local persistence harness | Existing exact-head CI Auth check and independent release controls; no implied hosted migration, sharing, payment or production release approval. |

## Ownership and review stop

Changed source belongs to bounded Trip projections/validation/CRUD/mappers, Plan/Workspace/detail focus and wrappers, backward-compatible `TripItem.rowVersion`, permitted tests and the owned audit harness. Existing Core/temporal browser assertions were retained with narrow selector/new-field adaptations. The full changed-file inventory and per-group ownership rationale are in the evidence packet. Forbidden paths and the immutable TASK are verified separately.

No known internal implementation P0/P1/P2 may be carried as complete; any final failure is recorded in the delivery summary. Device/provider activation gaps above are explicit boundaries, not proof of a worldwide/live finished product. This implementation report is not an independent approval. Stay Draft. Do not merge or mark Ready. STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.
