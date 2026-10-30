# Jetnity Widgets Origin Isolation Foundation 1 — HANDOFF

**Stand:** 29 October 2026. **Stop.**
**Writer:** Jetnity Widgets Origin Isolation Foundation 1 — Cursor Generation 1.
**Session:** https://cursor.com/agents/bc-fd77a5a3-17dd-4479-9594-f6238f61583f
**Model:** `cursor-cloud run-info.originalModelName=grok-4.7-high-fast`
**Issue:** https://github.com/Jetnity/jetnity/issues/1090
**Draft PR:** https://github.com/Jetnity/jetnity/pull/1091
**Branch:** `feat/widgets-origin-isolation-foundation-1`
**Protected main at start:** `e462cf7c5910ce75fa6350928326c04e33d94eee`
**Seed:** `ee43857e390ead6863726ad7e06262c142f5a45b`

Read the report and the self-review before the code. The immutable task stays `docs/JETNITY_WIDGETS_ORIGIN_FOUNDATION_1_TASK_V1_2026-10-29.md`. `docs/ACTIVE_WORK_STATUS.md` was not updated; this handoff is the continuity record allowed by the write scope.

## Current state

The inert host exists only as source on this branch. Local `npm ci`, unit tests, `next build`, and 21 synthetic HTTP cases passed. The app 404s every tested URL, including both embed routes, with no provider code and no `Set-Cookie`.

`widgets.jetnity.com` is not claimed live. Vercel project `jetnity-widgets` / `prj_Qq4i6dNt3hlSbQDpr2LrRaSKOQsk` was not modified, not connected to Git, and not deployed by this session. DNS was not changed.

## Do not do next

- Do not mark Ready or merge. That is Technical Lead only, after an independent exact-head review.
- Do not start a follow-up Cursor generation from this handoff.
- Do not connect the widget project to Git, set a public deployment, or write Infomaniak DNS.
- Do not change `frame-ancestors` to allow `https://jetnity.com` inside a drive-by fix. That is a separate embed authorization.
- Do not import DiscoverCars, 12Go, consent UI, or PrivacyBee into this app.
- Do not install `allow-scripts` with `allow-same-origin` on a same-origin frame.
- Do not treat a root `jetnity-app` Preview or green root CI as proof of this host or of credential isolation.
- Do not use a personal browser (#748) or claim device widths.

## Exact next step for the Technical Lead

Review this exact pushed HEAD. Re-run, or require, nested `npm ci`, `npm test`, `npm run build`, and `node scripts/widgets-origin-foundation-1/synthetic-http.mjs`. Judge root CI separately. Keep the PR Draft until that independent review.

Before any later activation slice: re-read the widget project's root directory, env count (expect zero), and Vercel Authentication from the API; inventory production `Set-Cookie` names and Domain attributes only; keep consent #1087/#1089 as a separate gate. If parent-domain cookies would reach the widget host, do not activate `widgets.jetnity.com`.

## Reservation

Cursor stops here.
