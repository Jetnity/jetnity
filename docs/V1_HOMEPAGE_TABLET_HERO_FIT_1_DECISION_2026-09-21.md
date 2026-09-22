# V1 Homepage Tablet Hero Fit 1 — Decision

Stand: 21. September 2026  
Status: **SLICE DECISION / NOT A GLOBAL ADR / NOT TL FINAL**

## Date

21 September 2026

## Decision

Move the homepage first-hero two-column grid and decorative itinerary card from Tailwind `lg` (1024px) to the existing `xl` (1280px) breakpoint. Keep the same `minmax(0,650px)_minmax(0,1fr)` track formula and the same `max-w-[390px]` card once the card is shown.

## Context

At 1024 CSS px the first column can consume 650px plus `gap-10`, leaving ~195px for a 390px card. Compiled-CSS before-proof confirmed truncated tags. 1280 already gives a ~401px card with complete tags.

## Alternatives

1. **Keep `lg` and shrink the first column** so the card always has ≥390px. Rejected: primary copy/form would lose the intended 650px desktop column at every `lg` width, including cases where the card should simply be absent.
2. **Hide the card at `lg` but keep the two-column grid.** Rejected by the binding task: wasted empty second column.
3. **Invent a custom 1200px breakpoint.** Rejected: existing Tailwind tokens are enough; `xl` is the first default width where the current 650+390+gap composition is comfortable.
4. **Show the card earlier with smaller fake labels or `overflow-hidden`.** Rejected: would hide the defect instead of fitting or omitting the decoration.

## Consequences

- 1024×768 and other sub-`xl` widths use a single readable hero column.
- 1440/1920 keep the branded two-column composition.
- 360/390/768 behavior is unchanged (card was already hidden below `lg`).
- No new token, dependency, or shared contract.

## Non-decisions

No VUX-6 next-section peek. No issue-110 destination-intent change. No navbar/200% overflow repair (pre-existing; NavbarTextReflow1 owns `PublicNavbar.tsx` later). No rebase. The 22 September 2026 integration is one authorized merge of exact main `d89ed0b0` only.
