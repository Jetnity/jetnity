# Homepage Confirmed Route Entry 1 — TASK v1
Cursor-Agent: Jetnity homepage confirmed route entry 1
Generation: 1
Branch: feat/homepage-confirmed-route-entry-1
Parent target: issue #110; bounded partial delivery, never auto-close #110.
## Binding authority and baseline
Date: 2026-09-22. Baseline main@35148a4ba065be1315dddf21174d7f272518d34c. Operating mode NORMAL (read again before work).
Read JETNITY_START_HERE.md, AGENTS.md, docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md, docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md, docs/JETNITY_MULTI_AGENT_SLICE_PLANNING_STANDARD.md, canonical three-phase strategy/build order and latest #512 comments.
Latest authoritative continuity: #512 comments 5776334794, 5776541884, 5776595910; provider deferral #395 comment5776595577. PO now explicitly requests continued provider-independent work and safe parallel Cursor work plus a complete concise remaining-build overview.
TL live precheck: main unchanged; exact-main CI35724784300 SUCCESS; Production dpl_4KBe74AJFDvJnSok1dvubUbjaHZh READY on this SHA and current jetnity-app.vercel.app alias. All 189 remote branches inspected by name/head; open PRs only historical Drafts #52/#50/#40/#39/#28 before these two task branches. No active writer found for the selected runtime surface. No direct Cursor UI-wide inventory is claimed.
Latest completed Cursor: Jetnity MFA existing factor step-up 1, G1, bc-7a6af588-d7cf-4bd4-8707-fb4b3b8127a6; #542 merged, head5b0764c4fc7809007dc87a071dcc68e82186962a, independent PASS5277721753 and real-device PO acceptance5776239037. Do not restart it.
No new provider contacts/signup/contracts/secrets/live paid calls, no Production DB/migration/RLS/Auth writes, no model activation, no payment/indexing/domain/public-launch action. Existing production legal/SMTP/observability/account-erasure/retention gates remain; do not fix them incidentally. Existing auth, data-export, world-map, PWA, provider foundations and completed UX slices must be reused.
Required model: Cursor Grok 4.6 High Fast (`cursor-grok-4.6-high-fast`), no Auto or substitution. Acknowledge actual model, exact assigned logical name, Generation 1, session ID/link, branch and baseline before material work. STOP if model unavailable. Rename actual session only if supported; never claim a UI rename without evidence.
Do not mark Ready. Do not merge. Do not start a follow-up slice. STOP for independent Technical-Lead review. Self-review is not TL PASS. Immediate review fixes use this same session. Any changed head invalidates all earlier exact-head gates.

## Goal and product boundary
A traveller can start an ordered multi-destination trip from the existing homepage entry, review/correct the chosen places and carry the entire route into the existing manual planner. Preserve the green/lime hero and its tablet fit. Keep one progressive place-search entry with compact selected-place controls, not a large numbered Ziel1/2/3 form.
This is the provider-independent confirmed-place part of #110, explicitly selected in issue comment5776670341. Full interpretation of arbitrary sentences such as "Lima und Cusco" remains unfinished and model-gated. Do not fake language understanding with comma/und splitting or promise it in UI. Do not substitute this limited slice for the issue's eventual natural-language target.

## Verified baseline to reuse
StartzielForm currently stores one OrtAuswahl, requires canonical selection and navigates via zielHref.
PlanenSeite accepts zielId/ziel/idee and confirms one ID. TripPlanner already creates primary plus weitereDestinationPlaceIds for Guest and Account.
lib/places/reiseziele.ts preserves ordering/duplicates; lib/trips/create-stages.ts already builds stages with unknown/unassigned stays for multiple destinations. No new trip model/persistence.
Reiseidee and reisevorschlag actions already implement the separate gated model path. Do not modify/call it.
Guest create gate protects occupied, unreadable, corrupt and unobserved storage (#532). Keep its action-time recheck and account/guest distinction.

## Ownership
Only this agent writes the route-entry runtime:
- components/places/StartzielForm.tsx; small new components/places/RouteZiel*.tsx if needed.
- components/places/OrtSuche.tsx only if a narrow optional compatible controlled reset is necessary; all existing consumers must retain behavior, document why.
- app/(public)/planen/page.tsx.
- components/trips/TripPlanner.tsx: ordered initial confirmed targets + narrowly needed review/reorder controls, preserve existing manual inputs and failures.
- new lib/places/route-einstieg.ts and .test.ts for transport/selection rules.
- lib/places/auswahl.ts and .test.ts only compatible href integration.
- lib/trips/create-entry.ts and .test.ts only new handoff-key classification/prepopulation if needed.
- lib/seo/index-grenze.ts and its existing tests only include new recognized intent key in noindex rules.
- directly relevant additional tests with homepage-route-entry-1 names; optional scripts/homepage-route-entry-1-verify.mjs.
- docs/HOMEPAGE_CONFIRMED_ROUTE_ENTRY_1_{STATUS,HANDOFF,SELF_REVIEW}_2026-09-22.md and docs/evidence/homepage-confirmed-route-entry-1/.
Read-only: trip schema/types/create-stages, place search/backend/actions/reiseziele, Guest storage, Account actions, all model/provider/auth/security/DB code, homepage overall layout, navbar, global docs.
No edits outside these boundaries, no dependencies/lockfile/package/workflow edits. Stop and report if a necessary change crosses ownership.
Parallel agent Jetnity remaining build map 1 owns only docs/JETNITY_REMAINING_BUILD_MAP_1_* and docs/evidence/remaining-build-map-1/. Never edit its outputs.

## TL-fixed handoff contract
Use existing single-target zielId path for single selections. For multiple targets use repeated query key zielIds, in exact user order, with canonical IDs only. This is transient navigation input, never confirmed domain truth or a second persistence store.
- Validate the entire list before any place lookup: supported destination IDs, 1..GRENZEN.etappenJeReise (currently50), bounded item length, total transport <=8192 characters. Reuse existing reisezielIdsLesen/reiseziele contracts rather than inventing validity.
- Presence of zielIds selects route mode. Simultaneous legacy zielId or ziel is conflicting input: explicit recoverable error, never precedence guessing. An optional idee retains existing semantics/limits.
- Never slice/filter/deduplicate malformed/oversized/missing-place lists into apparently valid partial routes; preserve intended order and intentional repeats (Paris→Rom→Paris). Repeated occurrence identity must not be keyed only by place ID.
- Server confirms every place from existing canonical source, reusing existing action/read contracts with bounded work. Missing, role-invalid and failed reads remain distinguishable from successful zero matches. No lookups on invalid/oversized transport.
- If any route place cannot be confirmed, do not prefill or create a partial trip. Show a clear recoverable handoff error and an explicit return/restart action; do not silently drop the original route and show success.
- All recognized route-parameter variants (even empty/malformed) are noindex by key presence, and targeted handoff must not be rewritten as a generic guest Create CTA.
- Pass the server-confirmed ordered list into TripPlanner, preserving current single-target/inspiration links, idea, dates, travellers, origin and existing create shape. Existing submit-time server revalidation remains mandatory. The user still submits before persistence.
- Add/remove/replace/reorder must preserve per-occurrence identity and unresolved editing text. Never select first search match automatically. Same place may occur twice intentionally.
- Do not lose pending unconfirmed input when submitting/navigating: require resolution or an explicit user discard. Whitespace/empty draft field must not create a ghost destination.
- Reordering a first destination must correctly change which destination is primary; other inputs must survive route edits. Do not infer nights, stage dates, transport, prices or availability.
- Existing guest draft bytes must remain untouched when a second create is rejected; Account must not inspect/migrate guest storage.

## Interaction and accessibility acceptance
Initial one-place journey remains simple. After a selected place, an optional "Weiteres Ziel" interaction and compact ordered chips/review controls allow route building without exposing IDs/IATA codes.
Clearly label editing/removal/reordering for each occurrence; keyboard move-up/down buttons suffice (drag-only is forbidden). Predictable focus after add/remove, escape and combobox interactions; no accidental form submission when choosing suggestions.
Do not redesign hero or hide long selected names/errors. Test 390px, 768px, 1024px and desktop, 200% text/zoom where available, keyboard and touch-sized controls. Many targets may expand naturally without changing site hero layout. Avoid arbitrary smaller domain limit.
Do not call browser emulation a physical-device PASS. Record actual device gap for TL/PO acceptance.

## Required meaningful proof
Tests exercise actual selection/handoff/parser and rendered integration, not source-string assertions alone:
- single target and inspiration links unchanged;
- ordered 3 targets and return-to-same-place retain exact IDs/order;
- add/remove/replace/reorder including primary and duplicate occurrence;
- malformed/empty/oversized/conflicting query rejects before canonical lookup; valid shape but absent/foreign-role ID or lookup outage produces recoverable no-partial-route state;
- canonical server names prevail over client/query data; full route reaches existing Guest/Account create graph; no auto-create on mount;
- active/corrupt/unreadable/unobserved guest draft remains protected, Account flow separate;
- unavailable/ambiguous search, pending unconfirmed text and no silent selection/loss;
- recognized parameter noindex and generic CTA classification.
Run owned tests, existing places/reiseziele/create-stages/create-entry/guest-active-draft-preservation/SEO tests and applicable required CI/Auth/typecheck/lint/build/hygiene. Credentials absent/skips are not PASS.
Use actual rendered component/hydrated tests with synthetic boundary fixtures where needed; explicitly distinguish these from authenticated Production E2E. Never use real personal data, paid models/providers or Production writes.

## Multi-Agent Suitability
Decision MULTI_AGENT across independent workstreams; SINGLE_WRITER for this tightly connected UI/handoff contract.
This agent alone owns shared route-entry contracts. Remaining-build-map agent is docs-only and reads the pinned baseline; no runtime dependency or intersecting file.
Own branch/Draft PR from exact baseline. No stacking/cherry-pick/merging other agent branch. TL reviews each exact head; docs stream can merge independently but runtime branch must then recheck main drift and repeat gates if updated.

## Deliverable/stop
Implement bounded runtime and evidence. Freeze head, push, provide exact head/main/merge-base/ahead/behind, changed-file list, tests, direct Preview/CI, risks P0-P3, limitations and remaining #110 NLP work in STATUS/HANDOFF/SELF_REVIEW and PR comment. Re-read origin/main at handoff; no unrequested rebase/force or repeated merges. STOP FOR INDEPENDENT TL REVIEW.
