# UX V1 U1-A3 header density — plan

**Date:** 28 October 2026. **Issue #1075. Draft PR #1077.**

Pre-code attestation is [PR comment 6467719755](https://github.com/Jetnity/jetnity/pull/1077#issuecomment-6467719755). This file is that plan, plus the one layout refinement made while implementing it.

## Session

- name: Jetnity UX V1 Header Density Correction 1 — Cursor Generation 1
- originalModelName: `grok-4.7-high-fast`
- bcId: `bc-7fd58f05-dda1-453a-acf4-0ae3afd382c0`
- session: https://cursor.com/agents/bc-7fd58f05-dda1-453a-acf4-0ae3afd382c0
- branch: `fix/ux-v1-u1a3-header-density-1`
- mode: NORMAL
- seed HEAD: `5b1b65e8db247de17466f8f02eb466222de08310`
- merge-base: `71e07c71d06e7c4ef26ed6e8d40080bb9ea24382`

Not the stopped U1-A session and not nav session `bc-c363f33c-f1e2-46a4-b33c-3888008e64a0`.

## Decision

Reduce idle vertical space only in `TripWorkspaceKopf` and `TripWorkspaceUebersicht` / `TripWorkspaceAktionen`.

- Keep the full saved title, route, dates, device-versus-account sentence, traveller/budget disclosure, and the existing help sentences.
- Keep one direct `min-h-11` Reise ändern button with the same `aria-expanded` / `aria-controls`, keyboard open, focus move into the edit surface, and Escape return.
- Do not wrap the parent-owned discard/delete slot in another disclosure.
- Drop the redundant overview eyebrow. Keep `fortschrittText` and `planText` together in one paragraph.
- Share route/dates and the action help on one row from 1024px when the root font is below 32px. Otherwise stack.
- The row is CSS `lg:` on first paint. Root font ≥ 32px forces the stack after measure, so a normal desktop does not jump and a large root cannot overflow.

## Not touched

`TripWorkspace.tsx`, mode navigation, `ux-u1a-shell-1`, plan, global header, guest-notice source, attention, audit, destination essentials, providers, package, CI, SQL, Auth, RLS, env, `docs/ACTIVE_WORK_STATUS.md`.

## Measurement

`scripts/ux-u1a3-header-density-1/audit.mjs` on `/ui-audit/trip-workspace` with the real public navbar. The audit hint is rewritten to the `GastArbeitsbereich` notice. Discard/delete is inserted as the next sibling of the identity card because the audit client does not pass `kopfzeile`.
