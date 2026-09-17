# Jetnity – Explicit Visit History 1 Task

Stand: 17. September 2026  
Status: **ACTIVE / USER-CONFIRMED VISIT TRUTH / ACCOUNT WORLD / DEVELOP-FIRST DB**

Issue: #445  
Product-Owner directive: #441  
Standing authorization: #440  
Canonical base: `main@69f3b206fc87bf4a3ff9e3c275cf55d244c0a9a6`

Branch: `feat/phase-1-explicit-visit-history-1`

Cursor-Agent: **Jetnity explicit visit history 1**  
Generation: **1**  
Required parent model: **Claude Opus 5 High**

Do not use Auto. If Claude Opus 5 High is unavailable, stop and report instead of silently substituting.

---

## Product goal

Make the Account World Map a true personal travel-history surface.

Users can explicitly record places they have actually visited, including visits before they used Jetnity. The realistic local world cartography is the visual base. Countries are rendered with professional borders and truth-preserving state fills for visited and planned.

## Binding truth rules

1. **Visited is explicit user truth only.**
   - Never infer visited from a past date, archived trip, booking state, trip status or map marker.
   - A visit exists only after explicit create/confirm by the authenticated account holder.

2. **Repeated visits are first-class events.**
   - Same place may be visited multiple times.
   - Event rows stay distinct.
   - Unique-place and unique-country metrics dedupe separately.

3. **Dates may be incomplete.**
   - Exact dates are optional.
   - Do not force fake precision when the user remembers only year/period or no date.
   - Persist the minimum structure that can represent honest unknown/partial timing.

4. **Geography must be trusted, never guessed.**
   - Reuse existing Jetnity place/country reference identity where safely available.
   - No free-text geocoding.
   - No deriving country/coordinates from display labels.
   - Unknown remains unknown.

5. **Planned and visited remain independent truths.**
   - Planned data comes only from existing trip/stage truth.
   - A place/country may be both visited and planned again.
   - Neither state overwrites the other.

## Personal World metrics

Render compact truth-derived summary:

- `Besucht: N Länder · M Orte`
- `Geplant: N Länder · M Orte`

Rules:
- repeated visits in one country count as one visited country;
- repeated visits to one trusted place count as one unique visited place;
- events stay distinct in visit history;
- places without trusted country identity do not increment visited-country count;
- planned metrics remain independent from visit history;
- no `N von 195` denominator in V1;
- when no visited history exists, prefer honest empty-state copy instead of a gamified `0 besucht` tile;
- metrics are derived, never persisted counters.

## World Map country state rendering

Use the realistic local vector cartography already merged by #443/#444.

Required visual state system:
- neutral country: restrained base fill;
- **visited country**: distinct accessible fill;
- **planned country**: second distinct accessible fill;
- **visited + planned**: explicit combined treatment that preserves both truths;
- all countries retain subtle professional border strokes;
- selected state is not colour-only;
- borders remain legible underneath every fill state;
- no proprietary map assets or runtime tile service;
- no external map/geocoder request on render or interaction.

Do not copy the provided reference screenshot literally. Match its useful interaction concept while keeping Jetnity's own design language.

## Persistence / RLS

Design the smallest additive account-owned visit-history schema.

Must have:
- stable row id;
- account owner linkage;
- trusted place reference/identity seam;
- trusted country identity when known;
- optional timing fields that support honest unknown/partial date;
- created/updated timestamps;
- own-account CRUD only;
- RLS enabled and fail-closed;
- anon cannot CRUD;
- browser does not receive service-role secrets;
- no sensitive passport/document/MRZ/health/biometric data;
- no public sharing by default;
- no persisted summary counters.

Use one additive migration. Apply and verify it on Supabase **develop first**. Do not apply Production migration from the agent. Production remains for final Technical-Lead decision after exact-head review.

## UI / flows

At minimum:
- `Besuchten Ort hinzufügen` entry point;
- trusted place/country selector using existing Jetnity references where possible;
- optional visit date/period without forcing false precision;
- visit-history list with clear repeated events;
- edit visit;
- delete/revoke visit;
- map updates from persisted visit truth;
- planned-trip navigation remains intact;
- no mutation of trip rows when adding/editing visits;
- professional 390px mobile and >=1280px desktop layouts;
- >=44px touch targets;
- keyboard/focus/ARIA quality;
- no horizontal overflow.

## Scope ownership

Primary allowed scope:
- `components/account/**`
- `lib/account/**`
- account-owned route/server-action files strictly needed for visit CRUD
- one additive `supabase/migrations/**` migration
- generated DB type update only as required
- focused tests
- slice-specific TASK / STATUS / HANDOFF / SELF_REVIEW / migration-evidence docs
- Account audit harness only for deterministic acceptance evidence

## Hard exclusions

Do not touch unless Technical Lead explicitly re-scopes:
- `components/trips/**`
- `lib/reisebegleiter/**`
- `lib/modell/**`
- Assistant Runtime #435
- provider/commercial/payment modules
- Auth/MFA/AAL semantics
- passport/document persistence
- public/social sharing
- wishlist/wish destinations
- journal rich media
- passive location tracking
- external runtime maps/tiles/geocoder
- global continuity/ROADMAP/ACTIVE_WORK_STATUS during implementation

If a necessary change crosses these boundaries: STOP for Technical Lead.

## Required regression tests

Prove at minimum:
- old/past/archived trip never becomes visited automatically;
- explicit create only;
- update/delete only by owner;
- cross-user read/write/update/delete blocked by RLS;
- anon CRUD blocked;
- repeated visit events remain distinct;
- unique visited-country count dedupes;
- unique visited-place count dedupes;
- unknown country does not inflate country count;
- planned metrics remain separate;
- same country visited + planned renders both states;
- country borders remain visible for neutral/visited/planned/combined states;
- no external map/geocoder/provider call;
- no trip mutation from visit CRUD;
- no persisted counters;
- account export/delete/retention integration seam is documented if not yet live.

## Acceptance evidence

Before handoff:
- targeted visit-history/map-state tests;
- full tests;
- typecheck;
- lint;
- Production build;
- repository hygiene checks;
- exact-head GitHub CI;
- exact-head Vercel Preview;
- 390px + >=1280px visual evidence for empty history, visited, planned, overlap, add/edit/delete flows;
- no horizontal overflow;
- no console/page/runtime errors;
- no external map/geocoder requests;
- Supabase develop migration applied once;
- live develop schema/RLS/policies/grants/advisors verified;
- Production verified unchanged;
- STATUS/HANDOFF/SELF_REVIEW persisted;
- re-fetch origin/main and report exact final head / merge-base / ahead / behind / drift.

## Governance

- Do not mark Ready.
- Do not merge.
- Do not apply Production migration.
- Do not start a follow-up slice.
- Agent self-review is not Technical-Lead PASS.
- Every new head invalidates prior exact-head gates.
- Final state: **STOP FOR TECHNICAL-LEAD REVIEW**.
