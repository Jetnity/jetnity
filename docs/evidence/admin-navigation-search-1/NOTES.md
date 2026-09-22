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

## Not proven here

- Physical device / real touch hardware.
- Vercel Preview with a real Admin session (Auth/MFA).
- Server authorization changes (none were made).
