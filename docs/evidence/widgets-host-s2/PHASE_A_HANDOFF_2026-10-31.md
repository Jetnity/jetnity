# Widgets Host S2 — Phase A handoff

**Stand:** 31 October 2026. **Stop.**
**Writer:** Jetnity Widgets Origin Isolation Foundation 1 — Cursor Generation 1.
**Session:** https://cursor.com/agents/bc-fd77a5a3-17dd-4479-9594-f6238f61583f
**Branch:** `feat/widgets-host-s2`
**Draft PR:** https://github.com/Jetnity/jetnity/pull/1097
**Amendment blob:** `f1dfddd424f88d071a3a76125a39d71e7e2b3b93`
**Task blob:** `e4ae6b5d6291792d1fe798029849d66119fcf3f5`

Read `docs/evidence/widgets-host-s2/PHASE_A_REPORT_2026-10-31.md` and the summary JSON beside it. R5 is an offline lifecycle correction. The deployed host subtree was not changed.

DiscoverCars stays unselected. 12Go stays selected. The reviewed parent is `3b96cc0803236e5d5346dcf5ed6cec8d5f7e3d18`. A final-reader timeout still runs cleanup once, and that call is not cancelled by the published snapshot. Each body and reader cancel is tracked on its own. Cookie counts follow the verified frame URL. Partial event gaps and a shorter dataLayer stay visible. `createPassiveReaders` stays uninvoked by the default preflight. WebRTC remains `BLOCKED_TRANSPORT`. Phase B was not run. The browser preflight was not run. `capturePass` is false. `origin/main` is `628b95ddcffc90261cb3bb3d121eafd9e3ce91ea`; this branch was not synced to it.

## Do not do next

- Do not mark Ready or merge.
- Do not start Phase B, call DiscoverCars, 12Go, Google, or a CMP, or turn either registry entry on.
- Do not treat `BLOCKED_TRANSPORT` for WebRTC as permission to let that transport leave the browser.
- Do not edit the Viator resize test or the immutable S2 task and amendment files.

## First unfinished step

Independent Technical-Lead review of the exact pushed head. Phase B remains a separate exact-source decision.
