# UX V1 U1-A2 — PLAN

28 October 2026. Pre-code plan posted on PR #1076 as comment 6467658249, then implemented in the same session.

## Session

- Display name: Jetnity UX V1 Navigation Geometry Correction 1 — Cursor Generation 1
- `originalModelName`: `grok-4.7-high-fast`
- Session: https://cursor.com/agents/bc-c363f33c-f1e2-46a4-b33c-3888008e64a0
- bcId: `bc-c363f33c-f1e2-46a4-b33c-3888008e64a0`
- Not the U1-A session `bc-868ef9e8-284a-490a-8473-73b3dd0bcd6e`
- Branch: `fix/ux-v1-u1a2-nav-geometry-1`
- Mode: `NORMAL`
- Seed HEAD `af0c55e5ca00d4a5b4a4e69631699ae76a4f411e`, tree `1593a339bce05b8c44dd6a9c7fc0cf4d5d828c47`, merge-base `71e07c71d06e7c4ef26ed6e8d40080bb9ea24382`

## Cause

The mode nav was the first child of the short `div[data-workspace-ansicht]` (~138px with the action row). The long plan is a later sibling, so `position: sticky` ended with that short parent. At scroll 650 the bar had left the viewport on 1440 and 768.

The phone bar used `flex-wrap` and content-sized buttons. At 390×844 root 16 the labels wrapped 3+1 and the bar was about 101px tall. The longest 14px label, Organisieren, is about 86px wide.

## Layout

Move only `TripWorkspaceModeNavigation` out of `div[data-workspace-ansicht]` so its sticky containing block is the `max-w-7xl` column that also holds the plan. One nav. Existing `top: calc(72px + safe-area)`. No second toolbar, no scroll handler, no route state.

The bottom posture uses `grid-cols-4`, `px-0`, and a 1px gap so 14px text stays inside equal 44px targets at 360, 390 and 430. Below 360, and for root 32, zoom ≥ 1.9, keyboard, and width ≤ 320, the existing relative flow stack is used. `guest-nav-text-1.test.ts` stays unmodified.

## Tests

Negative static DOM of the short parent. Mounted real `TripWorkspace` with the synthetic 22-day graph, a 72px header and the guest notice. Rects at scroll 0/450/650/900 on 1440×1000 and 768×1000. One bottom row at 390/360/430. Relative flow at 280/320/root 32/keyboard stand-in. History, focus, zero provider requests. CDP page scale is not a desktop zoom 200% pass.

## Non-goals

U1-B, header density #1077, providers, SQL, Auth, RLS, `docs/ACTIVE_WORK_STATUS.md`, Ready, merge, follow-up slice.
