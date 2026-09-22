# HBX Hotels Offline Adapter Foundation 1 — Binding Cursor Task v1
Date: 22 September 2026
Status: TL AUTHORIZED BOUNDED OFFLINE IMPLEMENTATION / NOT READY / NOT MERGED
Agent: **Jetnity HBX hotels adapter foundation 1**
Generation: **1**
Required model: **Cursor Grok 4.6 High Fast / cursor-grok-4.6-high-fast**. No Auto/substitution.
Branch: `feat/hbx-hotels-adapter-foundation-1`
Session: pending actual Cursor acknowledgement; record exact footer and actual run-info/model. Never invent a session or claim a UI rename.

## 1. Purpose and authorization
The Product Owner accepted the TL proposal to build this isolated HBX offline foundation now. Earlier explicit direction: advance a provider only when it enables a concrete next build step or demonstrably saves rework. Decision receipt: https://github.com/Jetnity/jetnity/pull/512#issuecomment-5779625940.
This task implements the missing normalized hotel-data transformation against the EXISTING hotel domain. It does not select/activate a live vendor, change the three-phase programme, or displace Flights as the first real commercial path. No immediate Viator follow-up is authorized.

Read JETNITY_START_HERE.md, AGENTS.md, operating standard, multi-agent standards, binding slice precheck, current checkpoint and this task. Historical audit proposal was not an implementation authorization; THIS versioned task is.
Reuse:
- docs/PROVIDER_HBX_HOTELS_ADAPTER_CONTRACT_2026-08-29.md and FOUNDATION_TASK_PROPOSAL
- lib/hotels/domain.ts, provider.ts, schema.ts (READ ONLY)
- existing Skyscanner fixture-only boundary (do not copy its weaker shape/date validation)
- shared core exists at lib/server/providers/core; this slice needs NO HTTP or core edit.

## 2. Live precheck / evidence pins
TL re-read baseline main **9dc8926ef859bcde2dc31dc8b96f2e61e1948f74** through GitHub ref API.
Machine mode NORMAL; stale activeMetaScope metadata is historical, not a writer.
Main Actions **35747010279 SUCCESS**, Vercel commit status SUCCESS pointing to **Ahi7cmxVkbvEg3RsdHoVAbzmFZAZ** (previously post-merge verified Production). No fresh authenticated browser or database claim made by this precheck.
HBX audit was independently accepted at **8ccdd8710ec0637d276c49ece06747e8950546d7**, TL PASS #188 comment **5464145962**, then merged via #199 as **897f8e0b1975eddf96f88e6f2746a11e93eb8fe4**. Both receipt and actual merged PR freshly re-read; old docs' DRAFT labels are historical, not unfinished implementation.
No HBX runtime directory in main; hotel factory still returns null.
Open work inspected:
- #545 navigation, **929250d50f4322cac4495956e060c04e42a4c477**, main merge-base, ahead5/behind0; CI35749553732 SUCCESS, Vercel SUCCESS, no review threads. Agent Jetnity admin navigation search 1 G1, session bc-65468a42-a473-4d29-8fdb-5f48564db44d.
- #547 indexing, **cf1bd1458d2a14307567d6b131ae2a508c52c4a0**, main merge-base, ahead4/behind0; CI35749801635 SUCCESS, Vercel SUCCESS, no review threads. Agent Jetnity admin indexing status 1 G1, session bc-80776dce-2c41-423e-9ab6-c46b8747ff43.
Both are independent TL-review-pending, NOT TL PASS merely from CI or self-review. Their actual changed paths inspected: Admin runtime, their own scripts/evidence/docs only.
Historical Drafts #52/#50/#40/#39/#28 are not HBX writers. Open #395 still concerns first live flight access; #440/#294/#236/#20 are separate standing/tracker scopes.
Supabase/migration/RLS/Production data are not touched or dependencies of this offline slice; no new Production inspection/permission inferred.

Re-fetch main and your exact branch before implementation and freeze. Unexpected base or ownership drift: report before widening scope. No rebase/force-push. TL controls later base synchronization and serial integration.

## 3. Multi-Agent Suitability
Decision: SINGLE_AGENT within this slice; MULTI_AGENT across disjoint PRs.
One Cursor writer owns its branch and all closely coupled adapter/tests. A separate internal TL advisory read-only precheck checked type/pricing/truth traps; it is not a Cursor implementation agent and not a TL PASS.
Safe parallel axes: #545 Admin navigation, #547 Admin indexing, this offline adapter. No shared writes, no unmerged dependencies. Additional HBX writer would increase contract divergence.
Shared contracts remain read-only. Integrations serialized by TL; re-evaluate current-main drift and exact-head gates before each merge. Never incorporate another unmerged PR.

## 4. Exclusive write ownership
NEW files only:
- lib/providers/hotelbeds/hotels/contracts.ts
- lib/providers/hotelbeds/hotels/adapter.ts
- lib/providers/hotelbeds/hotels/adapter.test.ts
- optional narrowly needed tests/fixtures inside that SAME directory (test-only, no production registration)
- docs/HBX_HOTELS_ADAPTER_FOUNDATION_1_STATUS_2026-09-22.md
- docs/HBX_HOTELS_ADAPTER_FOUNDATION_1_HANDOFF_2026-09-22.md
- docs/HBX_HOTELS_ADAPTER_FOUNDATION_1_SELF_REVIEW_2026-09-22.md
- docs/evidence/hbx-hotels-adapter-foundation-1/* (text evidence only)
This task file is TL-owned; report contradictions rather than rewriting its authorization.
No scripts/package/dependency edits needed: existing Node/tsx runner discovers lib tests.

READ ONLY: lib/hotels/*, lib/activities/*, flights/Skyscanner, shared provider core, commercial-provenance, provider-ops, all app/components, Auth/SEO, scripts, package/lock/config/CI, global startup/status/roadmap/ADRs, other agents' files.
If an actual type hole requires a shared change, STOP and explain. Do not solve it by widening the domain or a parallel generic accommodations core.

## 5. Bounded implementation contract
Implement a pure normalized **offline fixture** transformation; not a raw HBX API parser or a working HotelProvider.
Provider ID: hotelbeds. Fixture schema: jetnity.hbx.hotels.availability.normalized.v1.
Accept unknown/untrusted runtime shapes safely, returning an empty fixture result for invalid top-level/context/schema rather than throwing. Build output explicitly, never spreading incoming fields.

Use a separate adapter-local fixture context:
- checkIn/checkOut (strict real calendar YYYY-MM-DD; positive integer nights from dates, robust across DST/leap days)
- requestedCurrency
- pricingModel: net | commissionable | unknown, explicitly DECLARED FOR FIXTURE TESTING ONLY.
This context is not commercial-relationship evidence, not trusted live state, and not supplied by UI. No mode switch turns fixture into live.

Output has providerId=hotelbeds, evidenceMode=fixture, options: HotelOption[], partial.
partial=true ONLY when at least one valid and one rejected offer; all invalid => empty options and partial=false.
Options use existing HotelOption without changing domain. No HotelProvider factory/suchen registration, public route, UI or adoption integration.

Pricing matrix:
- unknown => no priced HotelOption, even when sellingRate/net/commission fields exist.
- commissionable => sellingRate only, missing/invalid => reject.
- net => sellingRate only when hotelMandatory === true; otherwise reject. Never display net, derive markup or infer business model.
- packaging=true => reject; malformed control booleans must not silently permit.
- currency mismatch => reject, no FX. Reuse existing currency rules where available read-only; state exact validation.
- finite nonnegative legitimate price; reject NaN/infinity/negative/wrong type; total-to-night calculation must remain finite.
- nightly price only from valid stay context, not guessed nights.

Require positive integral hotelCode, nonblank hotelName, nonblank opaque rateKey, valid coordinate ranges and strict offset-bearing ISO timestamp retrievedAt. No fabricated timestamp/current clock as evidence.
HotelOption lacks rateKey/retrievedAt/providerOfferId/stay: validate these locally; only retain minimal metadata in adapter-local fixture contracts if strictly needed. Do not smuggle them into domain. rateKey must remain opaque, never parse its segments.
Multiple rates for one hotel need distinct deterministic Jetnity IDs (within existing max120), with no raw rateKey in IDs/user-facing fields/logs. Handle duplicates deterministically without duplicate IDs. Never log raw payloads or keys.
ExternalRef is canonical positive hotel code; name and roomName optional fallback semantics must follow existing contract.
Unknown address, stars, rating/count, quartier and breakfast => null. No category/board-code heuristics; no network catalogue.
Cancellation: for this first slice stornierbar and stornierungBis remain null. A single date/amount does not prove a complete cancellation policy. This conservative cut supersedes old proposal's possible earliest-date mapping for THIS slice only.
TaxesAllIncluded only passes a validated boolean; absent/unknown remains null.
Reject missing/malformed required values; optional unknown fields cannot create truth.

Truth boundary:
- result and options expose NO sourceKind, persistenz, akteur, freshUntil, availability, affiliate, live_api or persisted_snapshot truth.
- no trusted/live constructor, no commercial quote/persistence mint.
- no process.env, network client, HTTP, secrets, signature factory, mTLS or API SDK.
- test inputs are fixtures; never claim API compatibility, live prices or actual contract/access based on fixture tests.
- no production entrypoint imports this new fixture module.

## 6. Verification / acceptance
Meaningful tests using existing runner:
- pricing matrix, missing sellingRate, unknown model despite present prices; no net fallback/markup/FX; packaging and malformed booleans.
- schema/top-level/offer shape errors, identifiers, coordinate bounds, finite numbers, currencies, full timestamp and impossible-date rejection.
- stay leap day, invalid dates, equal/reversed checkout, nightly math, DST-independent nights.
- same-hotel multiple rates, repeated input stability, duplicate identity behavior.
- mixed/all-invalid cases and partial semantics.
- injected forbidden truth fields are absent at result and option level; unknown content/cancellation/board/category stays null.
- static import/evidence check: no runtime registration/network/env/Production/shared edits.
Run focused adapter tests plus relevant unchanged hotel/Skyscanner tests, typecheck, lint, production build and required repo hygiene. Existing repo warnings must be distinguished from new regressions. Do not add a mirrored test merely to inflate counts.
No visual/browser proof needed for an unimported pure fixture module. CI/Vercel Preview checks are integration checks, not evidence of real HBX access.
No live API or DB probe, and do not run setup-fix/migration commands to make validation green. Report environmental blockers honestly.

## 7. Risks and gates
P0: no known slice-specific current P0; task grants no privileged action.
P1 prevention: fixture promotion, fake consumer price, business-model inference, scope/identity leakage — explicit construction, matrix tests, no imports into runtime.
P2: external API/contract/mTLS/certification/pricing/redirect feasibility unresolved for later live transport. Offline completion does not close these. Invalid dates/rates/IDs must fail closed.
P3: historical proposal wording/status can mislead; current task and exact frozen evidence distinguish completed audit from new implementation.
No signup/contact/terms/DPA, credential creation/use, paid or real calls, provider activation, DB/migration/RLS, payments, Booking/Voucher/Merchant pivot, public launch, runtime provenance writes or TW-8/TW-9.
All special PO gates remain closed unless separately explicitly approved.

## 8. Delivery and STOP
Persist status, handoff and adversarial self-review with actual agent/model/session evidence; changed files; commands/results; remaining limitations; exact head, main, merge-base/ahead/behind, CI/Auth/Preview URLs and any unresolved review threads.
Freeze exact head. Do not create another docs commit solely to stamp asynchronous check results; report terminal checks in PR comments.
Only TL decides PASS/Ready/Merge. Agent self-review is not TL PASS. Any changed head invalidates earlier gates. Immediate CHANGES REQUIRED returns to this same agent/session.
**Do not mark Ready. Do not merge. Do not start any follow-up slice (including Viator). STOP FOR INDEPENDENT TECHNICAL-LEAD REVIEW.**
