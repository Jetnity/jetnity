# UX V1 U1-A — HANDOFF

Stop. Same session only if Root asks for a fix. A new head invalidates this evidence.

## Where to read

- Task: `docs/JETNITY_UX_V1_U1A_COMPACT_SHELL_1_TASK_V1_2026-10-28.md` (immutable seed, do not rewrite)
- Plan: `docs/JETNITY_UX_V1_U1A_COMPACT_SHELL_1_PLAN_2026-10-28.md`
- Status: `docs/JETNITY_UX_V1_U1A_COMPACT_SHELL_1_STATUS_2026-10-28.md`
- Self-review: `docs/JETNITY_UX_V1_U1A_COMPACT_SHELL_1_SELF_REVIEW_2026-10-28.md`
- Report: `docs/JETNITY_UX_V1_U1A_COMPACT_SHELL_1_REPORT_2026-10-28.md`
- Browser JSON: `docs/evidence/ux-v1-u1a-shell-1/report.json`

## Behavior

`shellNavLage` in `lib/trips/ux-u1a-shell-1.ts` chooses `flow`, `bottom`, or `sticky`. The navigation component measures width, root font, `visualViewport.scale` / outer-inner ratio, and visual-viewport height loss. At page scale >= 1.9 it also caps `[data-workspace-shell]` to the visual viewport width so the stored title wraps inside the zoomed window. The site header is outside that shell and is not restyled.

Guest/account text and the header slot for delete/discard are unchanged in meaning. `Reise ändern` is still the separate action. Overview still renders the existing attention list, audit, and per-stage essentials.

## Next step for the Technical Lead

Review this exact head. Wait for fresh native App CI, Auth CI, and Vercel Preview on that head. Do not start U1-B. Cursor does not Ready or merge.
