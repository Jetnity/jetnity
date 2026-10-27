# Jetnity Activities Native Search UX and GetYourGuide Expanded Offers 1 — TASK V1

**Date:** 27 October 2026 (Europe/Zurich). **IMMUTABLE Technical-Lead task.** Never revise this task to paper over a non-conforming delivery; add an explicit, independently reviewed V2 addendum if actual evidence requires a changed contract.

## 0. Authority, exact baseline and topology

- Product Owner explicitly approved on 27 October 2026: correct the visitor-facing native day-search contradiction **and** show approximately 10–15 activities initially, with a "Mehr anzeigen" control if more can be shown.
- Tracking: [#1042](https://github.com/Jetnity/jetnity/issues/1042); parent [#1023 V5](https://github.com/Jetnity/jetnity/issues/1023); previous completed child [#1040](https://github.com/Jetnity/jetnity/issues/1040) / merged [#1041](https://github.com/Jetnity/jetnity/pull/1041). Relevant [independent Work-QA Root decision](https://github.com/Jetnity/jetnity/pull/1041#issuecomment-6441383370), [prior native-UX disposition](https://github.com/Jetnity/jetnity/issues/1023#issuecomment-6441397367), live [#751](https://github.com/Jetnity/jetnity/issues/751).
- Baseline main at Root intake: `b5e0532c810df8d89749fb0a35380a081f765cab`, tree `f56b72f4c49666fd187cd08c04d6c91216d497a4`, mode `NORMAL`. Re-read live main, mode and latest #751 before product edits. If drift, stop for Root.
- Sole branch: `feat/r108-activities-ux-gyg-expand-1`; sole Draft PR: the PR containing this task. Seed commit must have only this task file, no product code.
- **SINGLE_AGENT**: one new logical writer **Jetnity Activities UX and GetYourGuide Expanded Offers 1 — Cursor Generation 1**. Required actual runtime `grok-4.7-high-fast` / Grok 4.7 High Fast; **not Auto**, no silent fallback. On entry post actual original-model field and source, genuine session UUID/link, exact name (visible rename only if genuinely available) to PR before implementation. Same session handles immediate review corrections.
- Parallel suitability: both changes operate in one activities surface and share mounted lifecycle/visual/integration proofs; dividing product writers would risk overlapping revisions and incompatible UI expectations. One coherent agent with independently checkable F1 and GYG subsections is safer. No replacement writer or automatic next slice.

## 1. Required read-before-write

Read complete `AGENTS.md`, `JETNITY_START_HERE.md`, `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`, `docs/JETNITY_MULTI_AGENT_SLICE_PLANNING_STANDARD.md`, current handoff and `docs/ACTIVE_WORK_STATUS.md`, actual #751 and #1023, exact #1042, all existing special holds, vision/architecture/design/roadmap/quality standards, original #1040 TASK V1/V2 and closed #1041 Root review chain.

Inspect source on the fresh baseline (do not infer from prior review):
- `lib/activities/zustand.ts`, `lib/activities/domain.ts`, `components/trips/AktivitaetenBereich.tsx` and tests for status and mounted availability.
- `components/trips/GetYourGuideAktivitaeten.tsx` and `lib/activities/getyourguide/{dokument,renderer,lebenszyklus,widget,suche,kontext}.ts` plus their existing tests and synthetic/mounted browser harnesses.
- `app/embed/getyourguide/route.ts` for strict Fetch Metadata and CSP guards.
- Root's Work screenshots and report, including independent source hash comparison (F1 predated #1041). Do not relabel Work execution as your own.
- **Official primary source**: https://partner.getyourguide.support/hc/en-us/articles/13981142981789-Widgets-101 (updated 28 Nov 2025). The *manual* activity widget allows a configurable **number of activities** (three recommended), unlike the *automatic* widget which always has three. That text proves neither a maximum of 12/24 nor a "load more"/pagination API. Do not invent API calls/functions, scrape offers or bypass provider constraints.

**First deliverable before writing code:** short PLAN in PR with exact intended changed files, model/session proof, staged evidence plan, threat/height limits, source compatibility and unresolved provider assumptions.

## 2. Workstream F1 — confirmed contradictory native day-search messaging (P2)

Work's actual 390px guest screenshot shows simultaneously:
- `Die Aktivitätensuche ist in Production noch nicht freigegeben.`
- An unconditional claim that the search "zeigt verfügbare Angebote", including day/trip suitability.
- Retry action `Erneut suchen`.

These belong to native search, not the correctly functioning GYG inspiration widget; the native source is unchanged between the pre-#1041 baseline and current main.

Implement smallest truthful UI fix:
1. On native `unavailable` replace technical production copy with **`Die Suche nach Aktivitäten für diesen Reisetag ist derzeit nicht verfügbar.`** Do not expose internal environment naming.
2. For `unavailable`, do not show the unconditional positive available-offers coverage statement. Preserve truthful empty/partial/success/error messages as previously accepted.
3. If consistent in the same limited change, replace state-specific `Erneut suchen` with **`Suche erneut prüfen`**; not mandatory if it introduces an unsupported state difference.
4. Keep request dispatch, provider factories, native hard-off state, native cards and pending/adopted/unconfirmed operations exactly semantically intact; a click must never secretly load GYG or fabricate native offers.

Focused status/unit + real mounted regression tests mandatory. No change to feature gate semantics. No new "approved Production search" claim.

## 3. Workstream GYG — genuine 10–15 initial offers and an honest "Mehr anzeigen"

**Intended UX:** After the visitor's existing explicit opt-in/load action, render **around twelve authentic provider-selected pictures/offers** for the confirmed city/island/region/country using the existing **official manual widget**. The Owner's "sofort" means **as soon as opted-in widget content loads**, not unsolicited network activity on page mount, hover or context change. A different destination may have fewer than twelve actual offers; **never invent or clone cards** to meet a quota.

Current manual embed renders `data-gyg-number-of-items="3"`; use **documented manual-widget number-of-activities option** to request `12`. Do not replace with the automatic fixed-three widget, a scraped GYG feed, custom re-rendered vendor cards or fabricated product photos.

**First provider compatibility gate:** On a genuine public/synthetic test destination in a fresh isolated browser, verify that configuring an official manual widget for 12 results **actually delivers** up to roughly twelve distinct visible cards at normal mobile/desktop widths. Count/render evidence is permitted **only within bounded QA, never as a runtime catalogue extraction/reranking mechanism**. Separate whether a destination yields fewer real offers from a hard provider cap.

**"Mehr anzeigen" behavior:**
- Preferred if genuinely supported: one **additional deliberate** action requests a bigger count (e.g. 24) through a new freshly isolated official manual-widget instance using the same verified public destination. Preserve original selected target and partner ID. Do not pretend an undocumented incremental pagination/destroy/refresh API exists. Keep one current frame, dispose old frame safely, and make repeated clicks or context switches stale-safe. An optional `Weniger anzeigen` is acceptable if it correctly restores the original state.
- The parent's opaque isolation **cannot know whether more items exist without extracting vendor content**. Therefore label the action as a **request** for more (`Mehr Aktivitäten anzeigen` / `Weitere Angebote laden`), not as a proven count of unseen items. Never claim "there are 12 more" unless independently supported.
- If increasing the manual widget to 24 is unsupported or causes duplicates/layout/privacy failures, **do not ship false in-app pagination**. Report exactly what works, and a truthful provider-directed `Weitere Aktivitäten bei GetYourGuide ansehen` link can be separately evaluated as a fallback **only using an officially verified public affiliate destination/search link**. A plain provider homepage is not equivalent to more activity cards. Escalate the real blocker to Root instead of violating source/rights boundaries.
- Never promise a universally fixed count, price, bookability, party/date match, specific local departure, neutral ranking or provider-outcome guarantee.

**Embed/height/security contract**:
- Inspect existing **2400px** current-value height bounds in the child `GYG_HOEHE_SKRIPT` and parent `gygHoeheAnnehmen`. At 12–24 stacked cards, this may clip mobile output. If a larger bound is required, update BOTH sides coherently with a safe finite reviewed cap, and prove spoofed/stale/wrong-frame/NaN/out-of-range rejection, **stable current height and shrink**, no unbounded growth, no feedback loop using `scrollHeight`. Recompute/test CSP inline script SHA-256 precisely. An accepted height may exceed 2400 but may not be arbitrarily unlimited.
- Parent iframe stays opaque: `sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"`, **NO `allow-same-origin`**, `credentialless` when browser-supported, `no-referrer` and restrictive CSP. Same-origin private parent access must remain forbidden.
- Only verified public canonical destination/country, no trip/user/day/stage IDs, traveller info, cookies, personal campaign parameters, referrers or private notes in child URL/provider requests.
- Direct route use must not activate external scripts. Reject unknown/malformed/duplicated item-count parameters. Server controls a tiny allowlist, e.g. 12 and 24; the browser cannot supply arbitrary counts or partner identifiers. Reuse fixed `partner_id=2MQHT6Z` and fixed nonpersonal campaign marker. Analyzer remains mandatory, unchanged and confined to the neutral document.
- **Zero provider requests before deliberate Load**, also on navigation, initial mount and hover. Current context change/remove/unmount actually disposes provider frame(s). Old network/renderer completions cannot reattach or reset native adoption.
- Existing analyzer collection `sessionStorage` P2 is **known**, not secretly “fixed” by weakening the sandbox. Preserve attribution limitations; no commission/booking PASS.
- Original GetYourGuide card links currently lead to a **result list**, not always a product detail. #1023 V5 / original #1040 V1 §9.3 remain OPEN. Correct partner ID and honest actual link outcomes are required, no test purchase. Provider HTTP403 in Work's run is unresolved and should not be bypassed/relabeled.

## 4. Strict change ownership

Expected allowed runtime and nearby focused tests, **only if necessary**:
- `lib/activities/zustand.ts` + existing status tests
- `components/trips/AktivitaetenBereich.tsx` + existing mounted native activity tests (F1)
- `components/trips/GetYourGuideAktivitaeten.tsx`
- `lib/activities/getyourguide/{dokument,renderer,lebenszyklus,widget,suche}.ts` + their direct tests
- `app/embed/getyourguide/route.ts` + direct tests **only if** parameter validation belongs at the route
- `scripts/getyourguide-manual-widget-integration-1/**` only bounded repeatable evidence adapter/tests, without altering historical reports; prefer a NEW `scripts/activities-gyg-expand-1/**` for any new harness
- The new task-owned `docs/JETNITY_ACTIVITIES_UX_GYG_EXPAND_1_{PLAN,STATUS,HANDOFF,SELF_REVIEW}_2026-10-27.md`

No other product modules, Places, Trip schemas, guest/account persistence, migration, RLS/Auth, policies/secrets, provider factory, global Analyzer, dependency/workflow/timeout, global CSS, contracts/licenses, indexing/launch or infrastructure. If another path is genuinely needed, request **precise Root scope expansion and stop that part**.

Do not edit the immutable TASK or old #1040 evidence. Historical F1 and original GYG PASS remain traceable.

## 5. Mandatory tests and independent gates

- First compare actual `main`, branch/merge-base/ahead/behind and all changed files; use normal Node22 and repo scripts. Test F1 unavailable/success/partial/error states and unchanged native operation/adoption identity. Tests must assert absence of contradictory copy, not just a positive new sentence.
- Verify manual widget official attributes at 12 and expanded selection, valid public destination parsing, direct-open refusal, no unknown/duplicate/oversized `anzahl` input, HTML escaping, fixed script host/partner, CSP hash, height message origin/window/schema/cap and old frame cleanup.
- Run real mounted activity flows: current day/country target switches, load/remove/reload, 12→expanded if supported, 24→remove, repeated request, one native adoption pending, late resolutions, React StrictMode, two widget instances; stale results never reattach.
- Real offered cards/images with source and visual evidence on public/synthetic contexts (not fixtures), including a city and country plus at least one island/region. **Bangkok and Panama are examples, never hard-coded allowlist.** Zero pre-load requests and private synthetic canary matches; no personal Browser/CUA.
- Normal responsive real host at 320/390/768/1440 px and 200% host text, keyboard and focus entry/exit, scroll layout and all visible cards; test long 12+ card height and shrink/grow without clipping/ghost frames. **Do not pass solely on desktop screenshots or iframe.onload.**
- Actual affiliate card navigation and partner preservation where provider allows; if provider denies (403), state **BLOCKED with actual request evidence**. No workaround around a denial. No false product-detail/commission acceptance.
- Run focused tests, typecheck, lint, five hygiene checks, full test suite and production build as applicable; preserve 2 historical conditional skips and CI time-limit risk honestly. Root will independently review **exact final head/tree**, original native App/Auth Actions, exact Preview/runtime, thread/ruleset status; after any Root-authorized normal merge, repeat actual-main CI/Production/domain checks.

## 6. Deliver and STOP

Implement in the existing Draft PR (never create a second simultaneous writer or auto-follow-up). Commit an honest PLAN / STATUS / HANDOFF / SELF_REVIEW with exact current origin/main, head/tree/parent, merge-base/ahead/behind, changed paths, precise Node/commands/results, independent vs author browser evidence, actual offer-count and mobile-height outcomes, provider denials, residuals and all untouched security/privacy constraints.

If the provider does not accept more than three/twelve cards in the official manual widget, **explicitly report BLOCKED** and request Root's decision; do not fake, clone, scrape or build an unauthorized feed. The confirmed F1 correction should stay separately identifiable in the Diff.

**do not mark Ready**  
**do not merge**  
**do not start a follow-up slice**

Keep Draft and STOP for independent Technical-Lead review. Immediate CHANGES REQUIRED stay with this same Generation1 session. Special holds (#917 hosted readback STOP, #985/#982 HOLD, personal-browser CUA SUSPENDED, etc.), Official Truth OFF, noindex/prelaunch and USD100/month budget all remain.
