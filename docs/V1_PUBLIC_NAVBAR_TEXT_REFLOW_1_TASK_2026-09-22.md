# V1 Public Navbar Text Reflow 1 — Binding Task
Date: 2026-09-22. Agent: **Jetnity V1 public navbar text reflow 1**, Generation 1.
Branch: `fix/v1-public-navbar-text-reflow-1`.
Baseline: **d89ed0b01070e47f93918fa64126ff0aeb18a17b**, after independently reviewed #532. Verified TL postmerge receipt: PR532 comment5769306591; CI35669982638 TLB106564057905/Auth106564057951 every stepSUCCESS, directProductiondpl_B16Wywy1iqzTtEik1n1FqfwWJnJz READYexactmain/aliasErrornull, main toolbarunresolved0. Tracking issue535. Live NORMAL, strict ruleset21875372/no bypass. #534 integration authorized in5769306755; this task must not import its unmerged branch.

## Goal and bounded evidence
Fix the already demonstrated public-navigation overflow at 200% text size. This is implementation of a concrete residual, not a new general audit.
TL inspected #534 correction images at1024×768 and1440×900 with html font-size32px: the public navbar's rightmost planning CTA extends beyond1024, and controls exceed the fixed72px row vertically at1440. #534 owns only its first homepage hero; this pre-existing navbar defect was correctly left out of that task. Current source PublicNavbar.tsx uses a fixed h-[72px], md desktop display, and a menu-height expression tied to72px.
Use its versioned before evidence as context, then reproduce on this exact baseline with compiled CSS and raw navbar/control bounds. Do not treat whole-page148px overflow as solely navbar: later homepage glow/inspiration offenders are separate and unowned.

## Exclusive ownership
Runtime: **components/layout/PublicNavbar.tsx**, presentation/layout/responsive/menu-height treatment only. Existing menu mechanics may be minimally adapted only if required by the responsive layout; preserve their behavior and accessibility.
Own docs/V1_PUBLIC_NAVBAR_TEXT_REFLOW_1_{TASK,STATUS,HANDOFF,SELF_REVIEW,DECISION}_2026-09-22.md and docs/evidence/v1-public-navbar-text-reflow-1/**.
Read-only: app/(public)/page.tsx (#534 owner), StartzielForm, GastCreateLink, shared/global styles/tokens, all Auth/session/sign-out actions and navigation policy helpers, GlobalesAbmeldenForm, guest/account/admin/provider runtime, DB/schema/secrets/workflows/packages. No auth logic, state classification, routes/labels, session refresh or permission changes. If a necessary change exceeds ownership, report exact smallest expansion before editing.

## Implementation constraints
Keep branding, menu labels/destinations, sticky behavior, safe areas and existing pointer/touch focus treatment. Prefer CSS and existing layout/token patterns over viewport JS observers or duplicated nav trees. Allow a useful responsive collapse/wrap strategy and natural header height; do not hide inaccessible controls, truncate labels, reduce user text size or mask overflow. Existing mobile menu must remain reachable and vertically scrollable in short viewports, including changed header height. No new design system or navbar redesign.
Unknown/guest/account navigation semantics, active-path indicators, generic guest create CTA and sign-out error/pending behavior remain unchanged. No real sign-in/sign-out/account writes while proving layout.

## Acceptance
1. Exact-baseline before1024/200 and1440/200 with viewport plus scrolled/menu images where relevant; identify navbar descendants extending beyond viewport/header.
2. After1024/1440 at html32px: every visible navbar control fits horizontally, text remains readable and targets fit vertically within the header. If collapsed, all existing destinations/actions remain accessible through the menu.
3. Normal360/390/768/1024/1440/1920 retains useful composition and intended routes, no new navbar overflow; check just below/at/above any changed breakpoint. At360/390 with200% text, menu and actions stay usable, no clipping. Label simulation honestly, not OS zoom/real-device/WCAG certification.
4. Menu open/close, Escape returning focus, route/hash navigation closing, hidden/inert/tab order, focus visibility and touch targets remain correct. Verify menu scrolling at390×600 and relevant200% scene. Do not simulate an actual logout.
5. Preserve unknown/guest/account layout: use existing authorized synthetic local fixture patterns or controlled local session mocks, clearly labelled, with no real credentials/account/network changes. Do not replace the real component with a static imitation.
6. Assert actual rendered bounds and interactions, not Tailwind class strings. Record navbar-only painted overflow separately from unchanged lower-page overflow. Existing unrelated homepage overflow is not a navbar PASS failure by itself.
7. Existing relevant navigation/session/guest CTA tests plus required typecheck/lint/fulltests/hygiene/build. No gratuitous test framework or dependency.

## Evidence and safety
Real local browser with compiled product CSS; exact source SHA/tree and dirty paths, UTC/browser/version/routes/state/actions, raw geometry and actual inspected viewport/menu images. Before interacting intercept provider/API calls and abort unexpected mutations including same-route server actions. Record attempted/aborted/completed honestly; zero attempts does not prove a POST was intercepted. No provider/model/account writes, costs or real sessions. Preserve prior #534 images; store new proof in own directory.
Write short plan, ownership manifest, decision, STATUS/HANDOFF/SELF_REVIEW and limits. Freeze substantive source/docs once; exact finalhead/main/ahead-behind/CI/Auth/directPreview/threads/model/session in final PR STOP receipt. Green self-review is not TL acceptance.

## Multi-Agent Suitability
NORMAL. **MULTI_AGENT across disjoint bounded PRs; SINGLE_AGENT inside this task.**
#532 finished guest creation/storage; do not restart it. Existing #534 session bc-c2e8ff5a-c507-40a7-b0ac-0ed324dd45da integrates exact reviewedmain and owns only app/(public)/page.tsx first hero + own evidence. This new session owns PublicNavbar only. No shared runtime write file, no shared contract change or dependency on unmerged code. Both appear on the homepage, so interaction risk is explicit: TL integrates **#534 first, this PR second**, then requires one exact-main integration and refresh of this task's representative header/hero/menu evidence. No autonomous main/sibling merge/rebase. Additional writers within this task add collision risk.
Presentation remains separate from trip/account domain and admin runtime. #518 first read-only admin is complete; #509 TA-R1–3 and accepted #506 implementations must not be repeated. No artificial third workstream.

## Binding workflow
Read live main START_HERE, AGENTS, operating mode, TL/Cursor and multi-agent standards, vision/design/product/continuity, V1 build order, latest PR512 handoff, and this task. Live evidence wins.
Cursor **Grok4.6HighFast / originalModelName cursor-grok-4.6-high-fast**, noAuto/substitute. Record exact logical name, Generation1 and actual session/model. New task gets new session; immediate fixes reuse it. No Guardian through Cursor; separate PO app only if TL later identifies a material reason.
No Production SQL/schema/Auth/RLS/identity/secret change, new data collection, real provider/model/payment call, new cost, public launch or reserved PO-gate crossing.
**STOP FOR INDEPENDENT TL CODE / VISUAL / INTERACTION REVIEW. Do not mark Ready. Do not merge. Do not start a follow-up slice.** TL alone Ready/merges with exact-head gates and verifies mainCI/Auth/directProduction after each merge.
