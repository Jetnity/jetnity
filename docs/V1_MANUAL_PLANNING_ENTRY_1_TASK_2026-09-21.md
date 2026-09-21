# V1 Manual Planning Entry 1 — Binding Task
Date: 21 September 2026
Agent: **Jetnity V1 manual planning entry 1**
Branch: `fix/v1-manual-planning-entry-1`

## Goal and accepted product decision
Implement #506 **VUX-7**, TL-confirmed P2 narrow discoverability improvement. On /planen the manual form currently begins below the initial phone screen. Add a compact, plainly worded in-page pointer (for example “Schritt für Schritt planen”) visible before the long idea form at the representative 360x800 and 390x844 initial page states. It takes the user to the existing manual planner heading/region with useful keyboard focus and visible context.

**Keep idea-first order**: Reiseidee remains the first actual planner; the manual form remains later and complete. No tabs, hiding/replacing the idea form, duplicate form, extra page or homepage/hero redesign. A link/choice is enough. Put pointer AND manual target inside the existing PlanenCreateGate; a guest with an active trip must continue to see its existing gate, not a dangling planner link or a bypass.

Prefer native in-page semantics and minimal composition. No smooth-scroll requirement; respect reduced motion. The target is not obscured by sticky chrome. If a helper is needed for focus, it owns only navigation; no submission or data state. Preserve the current query prefill, server-side signed-in determination, SEO metadata, rendering/request behavior, validation and guest-create contract byte-for-byte apart from presentation wrapping.

## Exclusive ownership
Allowed runtime:
- `app/(public)/planen/page.tsx` — rendered composition only; auth/select/metadata/prefill logic unchanged.
- optional NEW `components/trips/PlanenEinstiegNavigation.tsx` for the smallest accessible pointer/target helper if native anchor is insufficient.
- optional NEW focused `lib/trips/manual-planning-entry-1.test.ts` for behavior/semantics that need executable regression coverage.
- optional `scripts/v1-manual-planning-entry-1-audit.mjs`
- own docs `V1_MANUAL_PLANNING_ENTRY_1_{TASK,STATUS,HANDOFF,SELF_REVIEW}_2026-09-21.md`
- `docs/evidence/v1-manual-planning-entry-1/`

Read/reuse only: Reiseidee.tsx, TripPlanner.tsx, PlanenCreateGate.tsx, create-entry.ts, form actions, place/model clients, guest storage, shared layouts/headers/styles. The existing target can be an accessible wrapper in page.tsx. Do not broaden to edit either planner's internals. Return a concrete blocker to TL if composition cannot satisfy acceptance.

## Acceptance/evidence
1. Pointer visible at initial scrollY0 in default synthetic no-active-trip guest phone states 360x800 and390x844 without displacing all meaningful idea-first context; visible text clearly distinguishes manual entry.
2. Pointer activation by touch/click and keyboard reaches the existing manual planner heading/region. Record scrollY, target bounds and activeElement; Tab proceeds sensibly into manual controls. No focus lost to body or unrelated footer; no repeated scroll on form rerender.
3. Existing-active-trip guest gate suppresses both forms AND pointer. No dangling target; continue-trip/account links remain intact. Verify through actual disposable synthetic local state, never a real account.
4. Normal route/query-prefilled state and simulated signed-in rendering retain the same values and order. Do not assert authenticated server E2E from a simulated fixture.
5. No model/provider endpoint or submit is invoked by navigation. Test provider/model traffic blocked; entering/focusing manual form must not submit either planner or change persisted draft bytes. No paid or real external calls.
6. Narrow actual-style before/after phone and1024x768 captures, keyboard/reduced-motion/200%-text reflow and no horizontal overflow. Use existing components with accurate source binding; no mock CSS approximation. A bounded composition harness is allowed if route access is blocked, but label its exact limits.
7. Relevant existing create-entry, guest gate, mobile-accessibility and full required repository gates remain green. Do not manufacture source-string tests merely mirroring the new anchor.

## Binding boundaries and review
Read JETNITY_START_HERE.md, AGENTS.md, current operating mode, TL operating standard, multi-agent operating system AND slice planning standard, design/product/continuity standards and relevant V1 build order before editing. Live evidence wins over snapshots. Source acceptance is #506 TL FINAL review 5269760171 and closure 5764730610, not unqualified author suggestions. Latest continuity is #512 comment 5765553879 plus this task's later TL dispatch.

Baseline main: **1103407ba2a9e5fa76f4a8e588ab210934b955e3**. Live preflight: NORMAL, exact-main push CI35638485863 SUCCESS, direct Production dpl_J4adX7ZS9m1GMCRkM6NH9y57aaTu READY at baseline, ruleset21875372 active/strict/no bypass. #516/#517/#518 are merged and their sessions stopped. Do not restart them. #520 is the sole existing new writer, session bc-47c25f91-3af3-43ff-ab82-5c5c2fee04ae; observed implementation checkpoint948ad2fcffd7cc170feebd19fe0a94baed54fc72, no final TL acceptance.

Required model **Cursor Grok 4.6 High Fast**, no Auto/substitution. Generation **1** for this new logical task. Record actual session and model; unknown stays unknown. Rename UI session if that capability exists; do not claim a rename or model verification without evidence. Immediate review fixes reuse this exact session.

No database/schema/migration/Auth/RLS, traveller credential or readiness contract, storage/adoption, provider/model/paid calls, Production setting, secret, live signup/account, payment or public launch. No new dependency/package/lockfile/workflow/design-token changes. No broad copy migration, new general audit, new search, TW-8/TW-9, homepage redesign, Admin changes, audit source artifact edits or global continuity rewrite. Use disposable synthetic browser data only. Existing external calls in tested flows must be blocked/intercepted with simulation clearly labelled. No bypass of access restrictions.

Run relevant existing tests and repository-required typecheck/lint/tests/hygiene/build. Capture narrowly targeted actual browser before/after and behavior evidence with real compiled product styles/preflight (no approximate CSS). Each image: exact clean product SHA/tree, timestamp, browser, viewport, route/state, simulation class and action sequence; blank/unpainted images are failed evidence. Differentiate DOM/source assertions, static render, synthetic browser and live authenticated evidence. No hardware/Safari/whole-site/E2E claims without those actual checks.

Deliver own TASK/STATUS/HANDOFF/SELF_REVIEW and own evidence, actual changed paths, limitations, risk assessment and precise next owner. Freeze substantive source/docs once; final current-main/head/ahead-behind, actual model/session, CI/Auth/direct Preview/threads and STOP receipt belong in PR comment so gate bookkeeping does not churn head. Read main before freeze and report drift. Only TL selects integration/update boundaries; no autonomous sibling merge or repeated rebase. New head invalidates previous gates.

**STOP FOR INDEPENDENT TECHNICAL-LEAD CODE AND VISUAL/INTERACTION REVIEW. Do not mark Ready. Do not merge. Do not start a follow-up slice.** TL alone can Ready/merge after independent exact-head acceptance; special Product-Owner gates remain.

## Multi-Agent Suitability
Operating Mode NORMAL. No special PO gate crossed by this bounded presentation work.
**Decision: MULTI_AGENT across three independent PRs; exactly SINGLE_AGENT within each PR.**
- Protected Item Date Attention1 (#520) owns lib/trips/attention.ts and its tests/own evidence. All its paths are read-only here.
- Destination Essentials Density1 owns only its component/render tests/own evidence.
- Manual Planning Entry1 owns only the /planen composition, optional local pointer component/focused test/own evidence.
The two new scopes consume existing contracts unchanged; neither needs the other's code. Separate branches from the same verified main. Shared types, derivation engines and provider/session/create contracts remain read-only with no new contract owner.
**TL integration order: #520 first, then Manual Planning Entry1, then Destination Essentials Density1.** This is an integration sequence, not an implementation dependency. If a lane is blocked, TL may explicitly revise the sequence; agents may not. After each merge TL assesses base drift and authorizes one integration boundary in the same remaining session before fresh gates.
Separate narrow UX results can be independently reviewed while #520 completes functional work. No duplicate agents or two writers on a branch. Broader VUX-3 is deferred because it edits attention.ts; TA-R3 is deferred for a separate traveller/readiness contract decision. Storage residual and additional Admin runtime are not dispatched. If any unanticipated shared-contract/path dependency appears, stop at that boundary and report the smallest required expansion to TL.
Guardian risk assessment: bounded presentation changes with unchanged evaluators/guard/create logic; independent TL visual/interaction review is required, no new external Guardian run requested at dispatch. Reassess if implementation uncovers material Truth/Auth risk. Guardian is the separate PO app, never this Cursor writer.

Tracking issue: #523. Parallel density issue #521 / Draft PR #522.
