# Admin navigation search 1 — evidence notes

Hydrated runner: `scripts/admin-navigation-search-1-hydrated.mjs`  
Verify wrapper: `scripts/admin-navigation-search-1-verify.mjs`  
Browser: Playwright Chromium emulation only.

## Proven here

- Desktop trigger + Ctrl+K opens one palette; input receives focus.
- Tab leaves the input to an allowlisted option; Shift+Tab returns to the input.
- Arrow/Enter selects `/admin/users` from the static allowlist.
- Escape restores `document.activeElement` to the visible desktop or mobile trigger (`data-admin-nav-search-trigger`).
- Mobile strip trigger works; Ctrl+K while the drawer is open closes the drawer then opens the palette.
- Creator: only Steuerzentrale. Break-glass: Zahlungen present, Nutzer absent.
- Foreign `aria-modal` keeps focus; shortcut does not steal.
- `kosten` alias hits Provider & Kosten with zero `window.fetch` search calls.
- 768 desktop trigger, 390 + 200% text, results list `overflow-y: auto`.
- **R1 (viewport-bound):** 390×500 ArrowDown to last ready row. Visibility is list window ∩ visualViewport, not list-only. 100%: option `408–452` in list `180–460` and viewport `500`; panel `39–461`; input/close in viewport; 6 results. 200% text: option `399–487` in list `290–487` and viewport `500`; panel `12–488`; input `192–272`; close `29–101`; `scrollTop 347`; 6 results remain. Previous list-only `fullyVisible` at option `y616–704` is rejected.
- **R2:** Focus close button, hover Nutzer; `activeElement` remains the close BUTTON, not the input.
- **R3:** Palette Link boundary records `prefetch: false` six times; DOM anchors have no `prefetch` attribute.

## Not proven here

- Physical device / real touch hardware.
- Vercel Preview with a real Admin session (Auth/MFA).
- Production Next app-dir prefetch execution (R3 is a boundary-prop contract only).
- Server authorization changes (none were made).
