# UX V1 U1-A — PLAN

28 October 2026. Pre-code plan posted on PR #1070 as comment 6457950460, then implemented in the same session.

## Session

- Display name: Jetnity UX V1 Compact Shell and Tabs 1 — Cursor Generation 1
- `originalModelName`: `grok-4.7-high-fast`
- Session: https://cursor.com/agents/bc-868ef9e8-284a-490a-8473-73b3dd0bcd6e
- bcId: `bc-868ef9e8-284a-490a-8473-73b3dd0bcd6e`
- Branch: `feat/ux-v1-u1a-shell-density-1`
- Mode: `NORMAL`
- Branch baseline at dispatch: HEAD `bcd4cb9d3bd442eaf9eade38b2ba729570183170`, tree `8aacc82922bcc95950547d9be123e1bc1d24fc25`, merge-base `7ee00c69d38553c5a5778945ba3db3aea6361dd8`

## Decision

Compact the existing workspace shell. Do not add a second mode state, a second search mount, a route/detail split, or a country-grouping pass.

Navigation posture comes from `shellNavLage`:

- width <= 320, root font >= 32px, browser/visual zoom >= 1.9, or keyboard occlusion: in-flow wrap
- otherwise width < 768 and detail closed: fixed bottom bar with safe-area padding
- otherwise: sticky tabs under the site header
- detail open below 1024 also uses in-flow wrap so the bar does not cover the open surface

Header keeps the stored title, route, date, and guest/account sentence visible. Travellers and budget stay in a native disclosure. The existing header slot still holds the separate delete/discard action.

Overview keeps the current three-item attention list, further-groups control, audit panel, per-stage essentials, and direct area actions. Spacing is tighter. No percent and no invented visa, safety, or flight status.

## Non-goals

U1-B, U3-B file edits, N12, F05, providers, SQL, Auth, RLS, package/CI, shared `docs/ACTIVE_WORK_STATUS.md`, Ready, merge, follow-up slice.
