# V1 Public Navbar Text Reflow 1 — Implementation decision

Date: 2026-09-22  
Agent: **Jetnity V1 public navbar text reflow 1**, Generation 1  
Session: `bc-27f8ce53-e09e-43d6-9778-7a131c6cdec4`  
Model: Cursor Grok 4.6 High Fast (`originalModelName=cursor-grok-4.6-high-fast`) — no Auto/substitute

## Decision

Repair the demonstrated 200% text overflow inside `PublicNavbar` only, by:

1. replacing the fixed `h-[72px]` row with a natural `min-h-[72px]` row that may wrap;
2. letting the existing desktop clusters wrap with `min-w-0` so labels stay readable instead of overflowing;
3. sizing the mobile menu to the remaining viewport (`max-h-dvh` header + `min-h-0 flex-1 overflow-y-auto`) instead of `100dvh - 72px`.

Keep the `md` disclosure breakpoint, all routes, labels, session classification, `GastCreateLink` usage, sign-out form contract, focus/Escape/inert behavior, sticky + safe-area treatment, and existing focus rings / `min-h-11` targets.

## Context

#534 1024/1440 html-32px evidence showed the planning CTA beyond 1024 and controls taller than the fixed 72px row. Media queries do not follow user text size, so raising `md` → `lg`/`xl` would still overflow at 1024/1440 @ 32px and would redesign normal 768/1024 composition. A wrap + natural height stays inside exclusive ownership and does not shrink, truncate or clip user text.

## Alternatives rejected

1. **Raise the collapse breakpoint only** — viewport media queries ignore `html` font-size; 1024/200% would still paint the desktop cluster.
2. **JS ResizeObserver / duplicated nav trees** — forbidden preference; unnecessary if CSS wrap works.
3. **`overflow-x-hidden` / smaller text / truncated labels** — masks the defect.
4. **Shared token / global CSS / homepage hero edits** — outside ownership; #534 owns the first hero.
5. **Auth/session/sign-out/GastCreateLink changes** — not a presentation cause.

## Consequences

- At default text size the bar can remain one 72px row.
- At 200% text the header may grow and wrap; that is the accepted composition, not a hidden overflow.
- The mobile menu stays reachable and scrollable when the header is taller, including 390×600.
- Navbar-only painted overflow is the acceptance surface. Unrelated later homepage overflow is not a navbar PASS failure.
- TL integrates **#534 first, this PR second**, then requires one exact-main integration and refreshed header/hero/menu proof. This writer does not merge or rebase.
