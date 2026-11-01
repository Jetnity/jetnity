# Jetnity Activities Destination First 1 — TASK V1

Date: 2026-11-01, Europe/Zurich. Immutable Technical Lead task.

## Authority and actual baseline

Product Owner in Work: “machen wir zuerst die aktivitäten fertig … ich möchte dass die angebote sofort erscheinen von getyourguide und viator bei den aktivitäten sobald jetnity weiss wohin der besucher hinmöchte.”

This expressly changes the earlier **product UX decision** requiring several search/load actions and a day before discovery. Do not preserve that old decision merely because tests encode it. It does not authorize fictitious offers, bookings, bypassing actual visitor privacy choices, Production DB changes, secrets, paid calls, or removing provider security controls.

Baseline main and Production: `1914e159b59fcabe55581e25e9762cc333ef17ba`, tree `55030e62acfbc5784ec03048d059b95f649781df`. Mode NORMAL. Verify live #751 and branch before writing; if main changes, report drift, do not silently integrate it.

Branch: `codex/activities-destination-first-20261101`.
Sole implementation writer: **Jetnity Activities Destination First 1 — Cursor Generation 1**. New, separate slice; one genuine Cursor session. Publish actual session/model/name and plan before code. No invented model receipt. Immediate review corrections stay in this session.

Suitability: **SINGLE_AGENT** for implementation; destination selection, automatic loading and adoption lifecycle are tightly coupled. TL reviews independently. No competing writes to this branch. Existing Viator transport/guard and shared CMP/12Go authors retain their ownership.

Read AGENTS, START_HERE, operating mode, TL/Cursor and multi-agent standards, Vision, Architecture, Roadmap, Decisions, Design, Quality, Logic, Continuity and relevant code/tests. Historical instructions remain evidence; this task supersedes their click-only discovery and mandatory-day rules only as stated below.

## Observed problem

Production Activities currently requires Organisieren → Aktivitäten → Aktivitäten suchen → provider load. The workspace supplies the first day even when it is an outbound travel day without a stage. Thus a known Bangkok → Ko Chang → Phuket trip shows “Zielort fehlt” and blocks discovery. Activities also occupies a narrow half-width details column beneath repetitive metadata.

No screenshot or personal trip identifier is to be committed. Reproduce with synthetic data.

## Required product outcome

Opening **Organisieren → Aktivitäten** immediately shows a destination-based offers surface, loading the permitted official provider content without another generic search button. A confirmed trip destination is enough to discover ideas. This applies equally to manual and natural-language-created trips, saved account trips and guest trips. Do not invoke a model to infer destinations already present in the trip.

Discovery is independent of scheduling: a travel day without a destination is valid, and remains unchanged. It must not prevent browsing the trip's confirmed destinations. A date may refine a search but is not a fabricated prerequisite. Adoption into a day and a live availability/price check still require their actual context.

### Destination selection

1. Use existing canonical place identity/verification, not editable trip titles, guessed geographies, provider IDs or sample allowlists.
2. Show a clearly labelled destination selector containing the existing trip stages in route order. Initial general Activities entry selects the first suitable confirmed destination; a valid deliberate day/stage entry uses that stage. Show which destination is selected. Never silently claim that an unassigned outbound day belongs to it.
3. If the currently selected day has no stage, discovery may use the visibly selected trip destination with no day filter. Explain only when helpful (“Ideen für Bangkok · Datum später wählen”), not a blocking error.
4. Repeated destination visits retain distinct stage identities and their dates. Never collapse Bangkok → Chiang Mai → Bangkok into one planning visit. Cache reuse must not reuse adoption/availability identity from the earlier visit.
5. Country-only destinations remain clearly country-wide ideas; do not present them as a city/day-feasible list. Unknown/ambiguous/conflicting places load nothing for that context and offer a precise way to choose an existing confirmed destination. Do not erase the unknown stage or silently “repair” its stored country.
6. Days may be absent entirely while destinations are known. Discovery must work in that state. Do not create days, assign travel days, mutate stages or alter trip duration just to obtain results.

### Surface and navigation

7. Remove the Activities summary/search-button layer in Organisieren. Preserve other domains' existing behaviour. Activities get sufficient main-content width; keep compact access back to Organisieren and other domains, rather than leaving half the desktop empty behind a tall list.
8. Compact header: Activities title, selected destination, optional date/visit information, visible provider identification. Results appear before lengthy instructions; no repeated metadata wall. Keep white default, green theme, sidebar/header actions and existing trip state.
9. Both providers may render independently. A failure/disabled Viator must not hide working GetYourGuide results, or vice versa. Distinguish loading, actual empty, unavailable, error and permission-required. Do not label unavailable as “no tours”. No fake skeleton-to-empty success timer.
10. Preserve visible original GYG widget branding and its own rendered cards. Native Viator cards retain supplied imagery, price basis/currency, source and appropriate freshness. Do not fabricate a common native feed from scraped GYG HTML. Product link/list limitation remains honestly documented.

### Automatic loading and lifecycle

11. Automatic discovery occurs only when this activities surface is actually visible and has valid context, not when another hidden workspace panel mounts, on homepage/hover, or for every stop in the background. Known destinations are prepared locally; fetch the currently visible selection only.
12. The user need not press “Aktivitäten suchen” and then another load button. Selected destination changes update permitted offers automatically. Match existing result-count policy (GYG requests 12; explicit More can request 24); these are request sizes, never guaranteed actual offer counts.
13. StrictMode, unstable parent object identities, revisiting tabs and slow A→B→A switches must not create duplicate frames, unbounded requests, stale cards or stale adoption actions. Use cancellation and ownership/generation checks. Remove old provider frames promptly on context change/close; a late callback must not restore one. “Ausblenden” must stay effective until an explicit re-show, not fight an auto-effect.
14. Use the existing native search API and rate limits; no new provider endpoint or API credentials. The native search input already accepts `day: null`. Keep `/products/{code}` and schedules for selected products, and availability check for actual date/option/party choice, not speculative per-card fan-out.
15. Do not add polling, refresh-on-focus, automatic retries, persistent provider caches, global state or broad prefetch. If reusing bounded in-memory results, enforce the existing provider TTL and invalidate date/party-dependent quotes. A route/day/currency/party change cannot preserve a false “checked” result.

### Provider, privacy and activation boundaries

16. Continue the existing **manual-markup** GYG widget with a public canonical destination query. Automatic display of that widget is distinct from GYG's “Automatic Widget”, which reads surrounding page content. Never install that page-scanning widget or Analyzer in the private parent/root/account DOM.
17. Preserve `/embed/getyourguide` opaque sandbox, CSP, no-referrer, credentialless configuration, direct-navigation closure, validation and exact frame/message ownership. External data remains only the approved public query and static partner/campaign configuration. No trip/day/stage/user IDs, private title, notes, traveller data or dates to GYG. No invented currency/date/participant parameters.
18. Provide concise truthful information that GetYourGuide content/Analyzer connect to the provider, provider privacy link, and a usable hide action. Respect an actual applicable visitor refusal/withdrawal. Do not call a navigation click GDPR consent, invent a global consent ledger, assume site-owner permission is visitor tracking consent, or bypass an existing consent decision. If the available privacy interface cannot support required automatic loading, document the exact missing contract/evidence and propose the smallest bounded remedy to TL; do not modify the held shared CMP/12Go system. An unresolved mandatory privacy prerequisite blocks live automatic loading, not independent destination/UI implementation. No generic new provider email/contract inquiry.
19. Viator Full Access Affiliate P00328015 requires no new provider certification/sign-off per verified reply #1023/6468170303. Its **Jetnity Production execution remains closed**. This task prepares the destination-first UI against existing ports and test fixtures, but does not activate it, write secrets, run real Viator requests, or implement the separately deferred S6 DB/runtime guard port. Track the remaining gate accurately: #1078/6547674031. No claiming both live providers work while Viator is OFF.
20. Keep Viator API-returned affiliate URL unchanged after existing validation; GYG partner `2MQHT6Z`, Viator `P00328015`. Neither visible affiliate parameters nor a successful redirect proves commission attribution. No bookings, holds, payments or cancellation calls. Cache no longer than 1 hour; no provider content indexing. No new subscription/infrastructure; USD100/month framework unchanged.

### Existing planning behaviour must survive

21. Preserve native adoption, duplicate protection, pending states and removal. In destination-only discovery, “Zum Reiseplan” asks for a valid existing day belonging to that visit or uses an explicitly selected valid day; never silently writes to the outbound day or creates a stage/date. If the existing contract cannot adopt without choosing a day, show that choice clearly, not a dead button.
22. Preserve original trip data, multi-stop order, arrival/departure days, existing items, Jetzt wichtig/readiness, manual and freeform planning, trip-edit and assistant, guest/account paths and other providers. Merely browsing activities never changes stored trip content or booking state.

## Allowed paths and ownership

- `components/trips/AktivitaetenBereich.tsx`, `GetYourGuideAktivitaeten.tsx`; small extracted destination/offers components in the same domain.
- `components/trips/TripWorkspace.tsx` and existing domain-navigation/organizing presentation components only for direct Activities entry, visibility propagation and main-content layout; no shared shell redesign.
- `lib/activities/` destination/context/lifecycle helpers and relevant tests; existing public native contracts may only be extended compatibly if essential and explicitly documented. Do not edit provider activation/factory, server transport/limits, or generic contracts outside this boundary.
- `lib/activities/getyourguide/` for canonical destination scope and scoped automatic lifecycle; keep renderer/document isolation intact.
- `lib/trips/workspace-mode*` only if necessary for Activities navigation compatibility; no changes to unrelated route/edge/preparation truth.
- Scoped Activities CSS if necessary using existing tokens. No global theme/spacing rewrite.
- Reproducible isolated synthetic browser harness under `scripts/activities-destination-first-1/`, appropriate adjacent unit/integration tests.
- Narrow additive Architecture/Roadmap/Decisions/Design/continuity updates. Historical tasks remain immutable. Add task-specific STATUS, HANDOFF, SELF_REVIEW and QA files.

Read before requesting any new path. `lib/privacy/**`, `components/privacy/**`, 12Go/DiscoverCars/Trip.com code and host, `lib/server/providers/core/**`, provider guard/SQL, migrations, Auth/RLS, dependencies/workflows, environment configuration and deployed resources are read-only. Do not merge/rebase the active #1086 or any other PR.

## Verification and deliverables

Use only a fresh isolated browser and artificial guest data. No personal Chrome/session or real stored Production trip. Never reuse credentials from another browser. No secrets, complete request headers or private logs in artifacts.

Mandatory behavioural matrix:
- Bangkok → Ko Chang → Phuket with first/last unassigned travel days; open Activities once, see selected Bangkok query/eligible results without more search clicks; switch all stops.
- Several places in one country, multi-country route, repeated destinations, no days yet, country-only trip, unknown/conflicting place, deleted/reordered selected stage, trip replacement and explicit day entry.
- Both providers success with fixtures; one slow/error/OFF/empty; native disabled must not block GYG. Mark fixture offers as synthetic in QA, never Production or actual provider evidence.
- Rapid destination and day changes, StrictMode, hidden panels, back/forward, closing/reopening/removing, slow stale requests and adoption callbacks. Prove bounded actual request counts and no old offer/adoption under a new target.
- No trip writes from discovery. Existing selection/adoption/update/remove flows still work; no double adoption, fake live quote or data loss.
- Desktop 1440/1280, tablet768, mobile320/390 and landscape; white/green; keyboard and true documented200% browser/text method. Verify computed layout and actual screenshots, no horizontal overflow/ancestor clipping/focus obscuring.
- Public query-only GYG boundary/canary test, current iframe/source/origin checks and no requests while activities hidden or invalid. Validate any actual refusal handling; do not label untested legal compliance as PASS.

Offline fixtures and local boundary tests first. No new Viator, CMP, hosted DB or held widget-host requests. Up to six controlled official GYG widget renders using synthetic public destination context plus two actual visible-offer link clicks are allowed for compatibility evidence if transport permits; stop immediately on anti-bot/403, do not bypass/retry elsewhere. Report exact counts and observed result. No portal writes/scraping/booking. Read official documentation as needed.

Run Node22 and `npm ci`, focused tests, typecheck, lint, full suite, hygiene and Production build according to repository standard. Report real command/output totals and skips; missing credentials are not PASS. Provide screenshots and sanitized request/context observations, not full network dumps. Fixtures and real provider evidence must be separate.

Before final delivery report exact head/tree/merge-base/ahead-behind, all changed paths, test/build evidence, logic/privacy/UX risks and remaining Viator/consent gates. Keep actual live status separate from implemented capability. Do not declare the user's complete two-provider outcome achieved by UI-only fixture PASS.

**STOP for independent TL review. Do not mark Ready. Do not merge. Do not deploy or change environment/DB/account settings. Do not start a follow-up slice.** Same session handles immediate fixes. Only TL can accept/release reviewed work within valid authority.
