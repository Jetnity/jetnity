# V1 Destination Essentials Density 1 — Binding Task
Date: 21 September 2026
Agent: **Jetnity V1 destination essentials density 1**
Branch: `fix/v1-destination-essentials-density-1`

## Goal and accepted product decision
Implement #506 **VUX-5**, TL-confirmed P3 density improvement. The current destination card repeats the identical absent-evidence sentence under Einreise/Sicherheit/Reisezeit for every stage. Reduce that repetition without hiding or weakening advice.

The smallest approved implementation is an **all-destinations-empty presentation fast path only**. When there is at least one destination AND every destination's three domain lages are exactly `keine_evidence`, with no domain details/links and no incompleteness contradiction, render one honest absence disclosure for the three domains, followed by a compact ordered list of the same destinations and existing date labels. Keep distinct stage identities even when country/name repeats. Keep the title, empty-with-no-destinations behavior, available destination context and accessible heading/list semantics. Do not claim “keine Hinweise erforderlich”, “sicher”, “vollständig”, “alles erledigt” or promise future/provider availability. Label absence as unavailable information to the traveller, not as a successful check. Reuse established absence wording where suitable.

For **any mixed/material/uncertain result**, retain existing per-stage/per-domain display and source/detail disclosure behavior unchanged. Explicitly do not collapse `unknown`, `unavailable`, `stale`, `insufficient_context`, `required`, `conditional`, `not_required`, option-/traveller-dependent results, safety/seasonal notices or partially complete evidence into empty. Do not decide emptiness solely from `hatHinweise` or text matching; canonical domain states plus actual details/links govern conservative presentation. Contradictory input must fall back to full display.

## Exclusive ownership
Allowed runtime:
- `components/trips/TripWorkspaceDestinationEssentials.tsx`
- new focused `lib/trips/destination-essentials-density-1.test.ts`
- `lib/trips/destination-essentials.test.ts` only if an existing rendering assertion requires justified adaptation; do not weaken derivation coverage.
- optional `scripts/v1-destination-essentials-density-1-audit.mjs`
- own docs `V1_DESTINATION_ESSENTIALS_DENSITY_1_{TASK,STATUS,HANDOFF,SELF_REVIEW}_2026-09-21.md`
- `docs/evidence/v1-destination-essentials-density-1/`

Read/reuse only: `lib/trips/destination-essentials.ts`, official/safety/seasonal engines, shared types, TripWorkspace composition and attention. No source/evaluator/date helper refactor or disclosure redesign for material evidence.

## Acceptance/evidence
1. Zero destinations preserves current no-target message; one/multiple fully empty targets show a single domain-absence disclosure and complete ordered stage/date context.
2. Mixed stage evidence, one material domain, all unknown/unavailable/stale and heterogeneous credential results stay visible with their exact meaning and existing safe source/action links. Test contradictory flags/details conservatively.
3. Inputs remain unchanged. No network/provider/model/search/storage write is added.
4. Narrow static component render regressions for empty vs mixed states; existing destination-essentials domain suite remains green.
5. Actual-style before/after captures at 390x844 and 1024x768 for three fully empty stages; one mixed safety/entry/seasonal fixture proves materially relevant text is still visible and details keyboard-operable. Record component height improvement and horizontal overflow. Check reflow at enlarged text, long names and safe focus/touch targets. These are synthetic UI checks, not official-travel-advice validation.
6. Existing #516 compact workspace behavior remains unchanged. No general #506 recapture.

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

Tracking issue: #521.
