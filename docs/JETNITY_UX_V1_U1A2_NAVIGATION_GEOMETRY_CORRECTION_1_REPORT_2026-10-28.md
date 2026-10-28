# UX V1 U1-A2 — REPORT

28 October 2026. Draft PR #1076. Stop for Technical Lead R1.

**Status** — implementation complete on the branch; CI and Preview for the final head are not yet recorded.

**Umgesetzt** — The workspace mode nav sticks with the long column instead of the short action wrapper. From 376px the phone bar is four equal labeled tabs in one row. Below that, and for large root text or the keyboard stand-in, the tabs stay in normal flow.

**Tests** — `lib/trips/ux-u1a-shell-1.test.ts` 4/4 pass. `lib/trips/ux-u1a2-geometry-1.test.ts` 7/7 pass. Unmodified `lib/trips/guest-nav-text-1.test.ts` pass, Chrome 148. `lib/trips/trip-workspace-premium-experience-3.test.ts` pass. Evidence: `docs/evidence/ux-v1-u1a2-geometry-1/messung.json`.

**Build** — not run here. `tsc` and eslint were not installed in this environment.

**Security** — no auth, RLS, secret, or provider change. Viewport and mode changes issued no provider request.

**Datenbank** — none.

**Dokumentation** — PLAN, STATUS, HANDOFF, SELF_REVIEW, REPORT. `docs/ACTIVE_WORK_STATUS.md` was not touched.

**Kosten** — none.

**Offene Risiken** — final-head App/Auth CI and Vercel Preview are still outstanding. A production header taller than 72px can overlap the sticky offset. 360px cannot hold four 14px labels without clipping, so it stacks. Real browser zoom 200%, device safe-area, and VoiceOver were not tested.

**Nächster Schritt** — Technical Lead independent R1 on the exact pushed head. Cursor does not Ready or merge.
