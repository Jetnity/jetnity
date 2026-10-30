# U1-C amendment 3 — pre-code integration plan

30 October 2026. Session https://cursor.com/agents/bc-4904589f-a8f0-4106-a65a-507bc53e084a. Read-back name `Jetnity UX V1 Route Design Alignment 1 — Cursor Generation 1`. `run-info.originalModelName` `grok-4.7-high-fast`. Seed `9f2c5c60dcfa2288cab3447d21f5cf840d6fa7d6`. Mode NORMAL. Pinned main `ac2199dba64e458a20a155b5d1bb826ea99949d3`. Before merge this branch is 9 ahead and 32 behind; merge-base `8fc72a18390af1650d6902fb2a20a64e4f7f8ccc`.

## Conflicts to resolve by hand

- `components/trips/TripWorkspaceKopf.tsx`: keep main’s `workspace` early return and add `reiseoptionen` there and in the legacy header.
- `components/trips/TripWorkspace.tsx`: keep the released shell props and the U1-C route/kante/focus glue.
- `components/layout/BackToTop.tsx`: keep measured clearance against the live fixed bottom nav; do not restore the old fixed offset on top of the new shell.
- `components/trips/GastArbeitsbereich.tsx` and `KontoArbeitsbereich.tsx`: keep the existing handlers in the `reiseoptionen` slot. Save errors stay in `kopfzeile`.
- `components/workspace/workspace-surfaces.css`: only if the new disclosure needs theme-aware color. Selectors, if added: `.workspace-reiseoptionen`, `.workspace-reiseoptionen > summary`, and the light-theme remap already used for `.workspace-storage-options` extended to that disclosure. No token or theme-preference change.

## Sequence

Ordinary merge of pinned main. Preserve WorkspaceShell, light default, Green-Light toggle, four modes and header actions. Route behavior from R1–R5 stays. Evidence screenshots use `U1C_EVIDENCE_DIR` or the OS temp directory, not a hard-coded `/opt/cursor/artifacts` path. Tests use the real WorkspaceShell plus TripWorkspace in light and green with synthetic props. No hosted account pass is claimed.
