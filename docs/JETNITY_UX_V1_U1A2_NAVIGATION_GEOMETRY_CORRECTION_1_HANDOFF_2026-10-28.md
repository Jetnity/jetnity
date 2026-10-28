# UX V1 U1-A2 — HANDOFF

28 October 2026. Generation 1 stops here. The next actor is the Technical Lead, same Draft PR #1076, same branch `fix/ux-v1-u1a2-nav-geometry-1`.

## Read first

- This status, self-review, and report
- `docs/evidence/ux-v1-u1a2-geometry-1/messung.json`
- Pre-code plan comment 6467658249
- Issue #1074 and TASK V1

## What changed

`TripWorkspaceModeNavigation` moved out of the short `data-workspace-ansicht` wrapper. The bottom bar is a four-column grid from `UX_U1A_VIER_TABS_AB_PX` (376). Narrower widths use the existing flow stack.

## Do not

- Mark Ready or merge
- Start U1-B #1067 or edit `TripWorkspacePlan.tsx` / `lib/trips/detail.ts`
- Edit `TripWorkspaceKopf.tsx`, `TripWorkspaceUebersicht.tsx`, or `TripWorkspaceAktionen` (parallel #1077)
- Edit `lib/trips/guest-nav-text-1.test.ts`
- Treat CDP page scale as desktop zoom 200%
- Copy Production credentials or call a provider

A later CHANGES REQUIRED stays in this same session: `bc-c363f33c-f1e2-46a4-b33c-3888008e64a0`.
