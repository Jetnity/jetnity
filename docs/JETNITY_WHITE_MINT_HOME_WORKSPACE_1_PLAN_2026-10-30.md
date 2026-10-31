# Jetnity White Mint Home and Workspace 1 — PLAN

30 October 2026. Author: Jetnity White Mint Home and Workspace 1 — Cursor Generation 1.

Session `bc-bf54c338-9e34-4c44-9f78-bfb24fe8b613`. run-info `originalModelName`: `grok-4.7-high-fast`. Stored title matches the assigned name. Mode NORMAL. This is the plan executed after the PRE-CODE PLAN on PR #1095. It is not a new product decision.

## Goal

Replace the warm beige impression on the complete homepage and the LIGHT workspace with the Owner-approved palette, without changing trip behaviour, the optional green workspace, or #1082 files.

## Files

- New `styles/white-mint.css`, imported once from `app/layout.tsx`.
- `app/layout.tsx`: import, presentation comment, `themeColor` `#F7FCF9`.
- `app/(public)/page.tsx`: `data-white-mint="home"` on the existing main.
- `components/workspace/PublicChrome.tsx`: the same marker on the public wrapper only when the path is `/`.
- `components/home/**`: unchanged. The main marker reaches those sections.
- `lib/ui/white-mint-home-workspace-1/**`: palette contract and a browser fixture that mounts the real homepage, `WorkspaceShell`, `WorkspaceTripChrome` and `TripWorkspacePlan`.
- Owned PLAN, STATUS, REPORT, SELF_REVIEW and HANDOFF. `ACTIVE_WORK_STATUS.md` and TASK V1 stay untouched.

## Not changed

`workspace.css`, `workspace-surfaces.css`, WorkspaceShell, BackToTop, PlanpunktEditor, storage, Auth, RLS, providers, CMP, payments, ENV and indexing. No main sync and no cherry-pick of #1082.

## Database, API, security, cost

No schema, API, secret, provider call or new cost. The fixture blocks non-loopback requests and stubs Supabase and sign-out.

## Tests

Computed colors must fail when the homepage or light shell is still `#F5F4EE`. Widths 320, 390, 768 and 1440. Root font 32px compared with the unscoped page. Guest note save, reload and edit. Light to green to light on the existing theme key. Admin `.dark` and a local provider frame stay outside the palette.
