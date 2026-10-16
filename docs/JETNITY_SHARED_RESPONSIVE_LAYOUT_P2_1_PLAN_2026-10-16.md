# Shared Responsive Layout P2 1 — Plan

Author: **Jetnity Shared Responsive Layout P2 1 — Codex Generation 1**.
Session: `01a144d8-26ca-7513-b070-12bd534bf2db`. Date: 16 October 2026, Europe/Zurich.
Issue #958 / existing Draft #959 / `fix/shared-responsive-layout-p2-1`.

## Authority and baseline

The initial permission STOP is superseded by the user's direct same-session instruction, “ich erlaube den Vollzugriff. mach weiter”, recorded in PR comment 6216381106. Scope and all special gates remain unchanged. Single author; no delegated writer or independent-review claim. Owner restores regular permissions after STOP.

Fresh main and merge-base: `bd613dd479b67353966f7a2c0e609e22793ab2d6`; main tree `fd75f3d3dc8fa051d2316b3a7966c626e1de760f`. Seed `e9d92afd3200387ebd5a985f767fbb0a1b8d1140`, tree `90149309e39503a449fde2ccd8324c33fcff1915`, ahead 1 / behind 0. Immutable TASK blob `e9ff2986a7e1b7a300f456ef63f791e3ce081bd9`. NORMAL; ruleset 21875372 active. #955 remains separate, draft, unchanged at `312bcadc31a2fa0d07ce3b81b0fe30df1f9035cf`. #957 merged into current main.

R17/R18/R19 establish the historical 30px shared overflow; their historical A/B is cited, not claimed as rerun. This author will measure the current seed and final implementation with the same new synthetic fixture.

## Implementation and checks

1. Use the unchanged gated `/ui-audit/trip-workspace` route, synthetic Guest fixture, loopback server, fresh Chrome contexts and installed project Playwright. No account/provider credentials or external requests. Story: fixture → real Workspace plus shared Navbar/Footer → CSS zoom → visible geometry and keyboard/menu interaction. No API/data mutation belongs to this story.
2. Capture original geometry/screenshots before any source edits, including the separate Attention list clipping. D3 is conditional on that direct evidence.
3. D1: locally constrain the brand link/image within the flex content width, preserve complete proportional artwork, normal desktop dimensions, wrapping, safe-area padding, 44px targets and existing menu/Auth semantics.
4. D2: zero-minimum grid tracks/items, bounded logo/contact links and word wrapping; preserve all links/copy/assets. No overflow masking.
5. D3 only if proved: local list/row sizing and wrapping, preserving data/order/labels/actions and focus. No other Trip file changes.
6. New regression tests only under `lib/ui-audit/shared-responsive-layout-p2-1/`: real geometry/text containment, logo visibility, link inventory, keyboard/menu/Escape/aria-expanded/focus, 44px targets, long text, widths 320/360/375/390/768/1024/1280 with CSS zoom 1/2. Browser opt-in skip is explicitly NOT VERIFIED.
7. Run unchanged setup, operating-mode, typecheck, lint, focused and full tests, API/schema/dead/exports/deps checks and production build. Preserve failures honestly; no browser/system installs or guard changes. Missing native PostgreSQL prerequisites are not PASS and do not authorize a workaround.
8. Review full diff and immutable TASK; create REPORT/SELF_REVIEW/HANDOFF. Normal branch-only commit/push only under task publication prerequisites. Verify exact new HEAD CI/Auth/Preview if published. Otherwise preserve the candidate and report the precise blocker for TL.

## Boundaries and risks

Existing source ownership is exactly PublicNavbar.tsx, Footer.tsx and conditional TripWorkspaceJetztWichtig.tsx. New own docs/tests/sanitized evidence only. No global docs/style/asset/package/workflow/auth/DB/API changes. No new architecture, schema, commercial truth, provider, cost or Production action. Main risk is trading horizontal fit for clipped text, tiny artwork, inaccessible targets or a too-tall sticky header; test actual boxes, text ranges and menu scrolling, including normal desktop controls. No physical-device/native-browser-zoom/real-auth claims. Finish with STOP for independent TL; never Ready, merge or follow-on.
