# UX V1 U1-A2 — STATUS

28 October 2026. Cursor Generation 1, same session, R1 correction. Stop for independent Technical Lead R2. Not Ready. Not merged. No follow-up slice.

R1 rejected head `a59fa725d309e93279558e4a9a0fa56a13230567`. Native CI 40681199028 failed because „Organisieren“ / „Vorbereitung“ at 14px spilled out of the 96.75px cell on GitHub Chrome. The sticky column fix is unchanged. The bottom row now uses `tracking-[-0.07em]`. With DejaVu Sans, Vorbereitung sits 2.3px inside each side and Organisieren 3.2px, still 14px, one row, height 53px. A 24px safe-area inset on each side leaves the bottom row for the relative stack. `guest-nav-text-1.test.ts` was not edited.

## Session

- Name: Jetnity UX V1 Navigation Geometry Correction 1 — Cursor Generation 1
- `originalModelName`: `grok-4.7-high-fast`
- https://cursor.com/agents/bc-c363f33c-f1e2-46a4-b33c-3888008e64a0
- bcId: `bc-c363f33c-f1e2-46a4-b33c-3888008e64a0`
- Not U1-A session `bc-868ef9e8-284a-490a-8473-73b3dd0bcd6e`
- Branch: `fix/ux-v1-u1a2-nav-geometry-1`
- Mode: `NORMAL`
- Pre-code plan: https://github.com/Jetnity/jetnity/pull/1076#issuecomment-6467658249
- Seed HEAD `af0c55e5ca00d4a5b4a4e69631699ae76a4f411e`, merge-base `71e07c71d06e7c4ef26ed6e8d40080bb9ea24382`
- Exact tip SHA is `git rev-parse HEAD` on this branch after the commit that adds this file. A SHA written here would be stale as soon as this commit exists.

## Done

The mode nav is a direct child of the long `max-w-7xl` column. `div[data-workspace-ansicht]` still wraps only the edit/assistant actions. One sticky nav stays under a 72px header at scroll 450/650/900 on 1440×1000 and 768×1000. Phone widths from 376px use four equal 14px bottom tabs in one 53px row. 360px and below, root 32px, and the keyboard stand-in use relative in-flow stacks. No provider request on viewport or mode change.

## Not claimed

Native App/Auth CI on this head, Vercel Preview on this head, real desktop browser zoom 200%, a physical phone, an OS keyboard, a non-zero safe-area inset, VoiceOver, Work Production acceptance, Ready, merge.
