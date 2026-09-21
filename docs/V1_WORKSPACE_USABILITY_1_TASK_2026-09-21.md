# V1 Workspace Usability 1 — Binding Task

Date: 21 September 2026
Issue: #513
Branch: `fix/v1-workspace-usability-1`
Baseline: `main@19a91a2594127eb2b6104b68da69786194e13865`
Agent: **Jetnity V1 workspace usability 1**
Generation: **1**
Required model: **Cursor Grok 4.6 High Fast**, no Auto/substitution.

## 1. Accepted input and scope

This is implementation, not another general audit. Read canonical START_HERE, AGENTS, TL/Cursor and multi-agent standards, current mode, design system, V1 build order, then the #506 report and independent FINAL review **5269760171**, post-merge **5764730610**. The final TL dispositions override the author's candidate ratings/recommendations. #506 is closed; do not restart its audit session. #509/#510/#512 are also merged, with their separate limits preserved.

Implement only:
- VUX-1: clearer first-screen trip hierarchy at 360/390 and landscape tablet 1024; retain wide-screen usefulness.
- VUX-2: localized stage-date display, no stored-date mutation.
- VUX-4: instrumented reproduction of compact detail opening/return; repair only a reproduced navigation/scroll defect.

No homepage/hero redesign, VUX-3 vocabulary migration, VUX-5 essentials redesign, idea-first reorder, registry/Account redesign or TW-8/TW-9. No new product truth or provider activation.

## 2. User outcomes and constraints

On a phone a traveller should identify the trip and reach a useful planning action without a second hero-sized introduction. On 1024x768 the long title must not consume the screen in a narrow desktop grid column while another column is mostly empty. Preserve the existing green/cream design and typography hierarchy.

Compact duplicate metadata/spacing before reducing type. Keep the full trip title readable or explicitly accessible through an appropriately labelled disclosure; no silent loss of destination/trip meaning. Do not blindly shrink fonts, use inaccessible ellipsis or reduce existing 44px primary touch targets. The guest warning must still explain browser-only storage and account transfer. Destructive discard must stay explicit/confirmed and secondary to planning; do not remove its confirmation or change deletion semantics.

At the existing 390x844 long-title fixture, show the overview heading and at least one complete useful planning/coverage control in the first viewport. Use a short-title fixture too. At 360x800 and 1024x768 show meaningful progress toward the same hierarchy; record exact visible bounds rather than inventing a universal no-scroll guarantee for arbitrary text/zoom. At 768/1440/1920 preserve clear layout and identical trip logic. Text enlargement must reflow; never solve density by hiding required information.

## 3. Navigation reproduction before repair

The #506 pictures show mid-panel/footer landings, but do not prove the scroll driver. Four recaptures have incomplete per-capture metadata. Do not merely assert the source inference is reproduced.

Use a disposable local browser, real rendered components and synthetic guest state. Record viewport, current product SHA, action sequence, scrollY and the bounding rectangles of the back control and detail heading before/after opening Fluege and Unterkunft. Record focus/activeElement. Test from top and from a scrolled overview; repeat opening/closing and keyboard activation. The current compact path focuses with preventScroll and hides the overview; investigate that actual flow without rewriting it speculatively.

If reproduced, opening a detail must put its identity and a usable return control in view. Return should restore useful overview context/focus without jumping to an unrelated footer. No repeated scrolling on ordinary data rerenders. Preserve desktop two-column detail, focus restoration, Escape behavior, reduced-motion behavior, hidden/inert semantics, safe-area offsets and lazy search mounts. Opening a coverage gap is NOT permission to activate paid search automatically.

If it cannot be reproduced, keep VUX-4 explicitly unresolved/capture-only, ship only the independently justified header/date fixes and report the complete failed-to-reproduce evidence. Do not fabricate a fix or broaden the task.

## 4. Date display

Reuse existing date-only/UTC de-CH formatters in TripWorkspacePlan or a narrowly shared display helper. Localize arrival/departure ranges consistently; retain a year where omitting it could be ambiguous, especially cross-year ranges. Handle one endpoint, same-day and absent endpoints without invalid date output. No timezone day shift, no raw ISO as the ordinary label, and no changes to trip dates, stage ordering or commercial dates.

## 5. Exclusive write ownership

Allowed runtime paths:
- `components/trips/GastArbeitsbereich.tsx` (banner/discard presentation only)
- `components/trips/TripWorkspaceKopf.tsx`
- `components/trips/TripWorkspace.tsx`
- `components/trips/TripWorkspaceNavigation.tsx`
- `components/trips/TripWorkspacePlan.tsx`
- optional `lib/trips/datum-anzeige.ts` and `.test.ts` if no existing reusable display seam suffices
- new focused tests `lib/trips/workspace-usability-1.test.ts`
- optional bounded browser script `scripts/v1-workspace-usability-1-audit.mjs`, reusing existing test tooling rather than a new framework

Own TASK/STATUS/HANDOFF/SELF_REVIEW with prefix `V1_WORKSPACE_USABILITY_1_` and `docs/evidence/v1-workspace-usability-1/` for synthetic evidence only.

Issue #514 exclusively owns `gastspeicher.ts`, `uebernahme.ts`, `GastreiseBruecke.tsx` and their tests; do not write them. #515 exclusively owns Admin analyst files. No sibling merges. Do not edit global startup/status, audit source evidence, package/lockfile, app homepage, provider/coverage libraries, Auth, schemas, Supabase, workflows or design tokens. An unexpected shared-contract dependency returns to TL before an out-of-scope write.

## 6. Verification and evidence

Run focused date and existing workspace/detail/timeline/navigation tests, existing mobile-accessibility checks, typecheck/lint/full repository-required tests/build and hygiene. Do not label source-string assertions as browser proof. Capture actual before/after phone, 1024 and wide-desktop screens plus instrumented interaction results. Every new capture needs exact SHA, timestamp, viewport, browser, route/state and simulation class; discard blank/unpainted captures as failed evidence, not PASS. Original #506 images remain unchanged.

No remote login/signup, real user data, secrets, provider/model calls, DB/Management API, deployment settings, payments or paid service. Intercept provider/model endpoints and clearly label simulated responses. Account/Admin interiors and real Safari/hardware remain untested unless separately authorized.

Freeze once after substantive code/docs; exact-head CI/Auth/Vercel and thread IDs in PR comment only. Re-read main and report drift; integrate only at TL's selected boundary, not repeatedly. Persist name/generation/model/session and precise safe next step. Author self-review is not TL PASS.

**STOP FOR INDEPENDENT TECHNICAL-LEAD CODE + VISUAL/INTERACTION REVIEW.** No Ready, merge or follow-up by Cursor. Ordinary technical scope has TL authority; all special Product-Owner gates remain.
