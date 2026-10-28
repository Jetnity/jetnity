# UX V1 U1-A2 — REPORT

28 October 2026. Draft PR #1076. Stop for Technical Lead R1.

**Status** — R1-F1 corrected on the branch. Native CI and Preview for the new head are not yet recorded. Not Ready.

**Umgesetzt** — The workspace mode nav still sticks with the long column. The 390/430 bottom row keeps four equal 14px tabs, with `-0.07em` letter-spacing so the wide Chrome face stays inside the cells. 360px, root 32px, the keyboard stand-in, and a 24px safe-area inset stay in relative flow.

**Tests** — `lib/trips/ux-u1a-shell-1.test.ts` 4/4 pass. `lib/trips/ux-u1a2-geometry-1.test.ts` 8/8 pass, including DejaVu text rectangles at 390 and the safe-area fallback. Unmodified `lib/trips/guest-nav-text-1.test.ts` pass on Chrome 148. `lib/trips/trip-workspace-premium-experience-3.test.ts` pass. Evidence: `docs/evidence/ux-v1-u1a2-geometry-1/messung.json`. Rejected CI 40681199028 is not this head.

**Build** — not run here. `tsc` and eslint were not installed in this environment.

**Security** — no auth, RLS, secret, or provider change. Viewport and mode changes issued no provider request.

**Datenbank** — none.

**Dokumentation** — PLAN, STATUS, HANDOFF, SELF_REVIEW, REPORT. `docs/ACTIVE_WORK_STATUS.md` was not touched.

**Kosten** — none.

**Offene Risiken** — final-head App/Auth CI and Vercel Preview are still outstanding. A production header taller than 72px can overlap the sticky offset. 360px cannot hold four 14px labels without clipping, so it stacks. Real browser zoom 200%, device safe-area, and VoiceOver were not tested.

**Nächster Schritt** — Technical Lead independent R1 on the exact pushed head. Cursor does not Ready or merge.
