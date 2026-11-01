# Activities Destination First 1 — QA evidence

2026-11-01, Europe/Zurich. Codex corrections on top of `8ddb7a6d8164b92d35f4e769e06c6db45d1f8974`; tests below concern the final working changes, not a deployed commit. Author checks and independent acceptance are different.

## Automated and product checks

| Check | Actual result |
| --- | --- |
| Bangkok / Ko Chang / Phuket; unassigned arrival day; repeated visits; country-only; conflicting place | PASS, canonical destination tests and browser fixtures |
| Date-free native request has `day: null`, `items: []`; dated request/adoption retains actual stage day | PASS, central helper and browser regression |
| Opening Activities mounts both official embed URLs without an extra search/load button, no native API request | PASS, actual activity rollout code with absent unreleased CMP |
| Explicit refusal, withdrawal, malformed CMP and forged event cannot grant; API disappearance after observation remains closed even after reload | PASS, no external network in tests |
| Hide/re-show, changing destination, leaving/reopening Activities and page reload | PASS; negative preference survives in sessionStorage, memory fallback |
| 1440/390, 320 with root font 32px, 844×390 landscape; light/green | PASS in browser fixtures; enlarged root font is 200% text, not browser zoom or real hardware |
| Native Viator details at 320px / enlarged text and keyboard selection | PASS, retained measured bounds and real keyboard input |
| Viator zero-height bootstrap, source/origin/partner/frame checks, malformed heights and removed frame | PASS with saved official loader and synthetic messages |
| Focused activity + Viator provider suite | 208 tests / 38 suites PASS (`/tmp/activities-rollout-all-focused.log`) |
| TypeScript / lint / production build | PASS; lint 0 errors, 192 existing warnings |
| Dead files / exports / dependencies / API protection / schema references / operating mode / diff whitespace | PASS |

Full local suite before the final activity rollout adjustment: 7696 tests, 7678 pass, 13 fail, 5 skip (`/tmp/activities-full-tests-bundled.log`). Eleven failures require local PostgreSQL unavailable on this Mac; no hosted DB fallback was used. Two unrelated layout failures are reproduced on unchanged base `1914e159b59fcabe55581e25e9762cc333ef17ba`: `lib/trips/ux-u1a2-geometry-1.test.ts:512` and `lib/trips/ux-u1b-route-detail-1/browser.test.ts:406`. Baseline run: 25 tests, 23 pass, same 2 failures (`/tmp/activities-main-baseline-tests.log`). These are documented baseline/environment limitations, not a green full local suite. The final activity adjustment was verified by the 208-test focused run; CI must be read separately for the exact pushed commit.

## Real providers, bounded separately

Viator attempt 7 at `2026-11-01T13:03:38.335Z` (14:03:38 CET), fresh bundled Chromium 140 profile, synthetic Bangkok: actual outer pixels show 8 cards at 1440px and 2 responsive cards at 320px, German labels, CHF prices. Examples observed: airport transfer from CHF11.36, floating/train market from CHF19.90. These are observed changing offers, not guaranteed inventory. Same document resized to 390/320, no repeated navigation, no clicks. Seven renders total across Cursor/TL/Codex, zero clicks, zero HTTP403. Attempt 7 is an author self-check after the writer handover. Artifacts: `outputs/activities-destination-first-2026-11-01/codex-attempt7/viator-proof.json`, `viator-1440.png`, `viator-390.png`, `viator-320.png` in the parent Work directory.

GetYourGuide earlier TL run: 1 render, 12 visible Bangkok cards/images, no visible prices; 1 actual offer click, 1 HTTP403. Final URL retained partner `2MQHT6Z` and campaign `jetnity_activities`, locale de-CH, currency EUR. STOP: no further GYG renders/clicks, no bypass. 390px delayed layout/clipping and 320px tall provider frame were observed; the provider viewport behavior is not accepted as perfect. This existing official result-list widget does not prove direct product detail, CHF pricing or commission attribution. Prior Cursor GYG counts are unknown.

Prior normal product guest-flow proof used real local Next pages, synthetic places REST responses and synthetic provider frames, without a remote database. Those screenshots are not live provider or exact final deployment evidence. Original artifact root: `outputs/activities-destination-first-2026-11-01/tl-live/`.

No purchase, payment, provider API activation, account/production-data write or secret publication occurred. Real hardware, screen-reader testing and commission accounting are not proven by these checks.

## Exact preview and CI follow-up

Exact source `5e9276ffd6849a3fa4f4c73a0f11026ad24ac457`, Vercel deployment `dpl_BtHukNjBNKcwc2Xrh8ud7HwHFR9V`: https://jetnity-kh0hazpon-jetnity-e1b93c82.vercel.app. Checked 2026-11-01, Europe/Zurich, fresh isolated Playwright guest context. Only this branch's two public Supabase connection values were copied from the verified `develop` preview configuration; project ref `yfvbxvijcorffwxbxahl`, not Production. Scope recorded in PR #1100 comment 6558637046. No database/schema/secret/production environment write.

Normal home → Reise planen loads both planning modes. The test database's Bangkok place search returns HTTP200 with an empty list, so normal end-to-end creation is BLOCKED by the empty develop catalogue. A separately labelled browser fixture supplies synthetic public place-search and place-confirmation responses to the real deployed UI. It creates only a browser-local guest trip, then opens Organisieren → Aktivitäten: both embeds use Bangkok immediately; switching Ko Chang/Phuket changes both public query names. Viator hide survives reload. 390px, 320px and root font32px have no host horizontal overflow. Light/green works. Artifacts: `outputs/activities-destination-first-2026-11-01/preview-5e9276f/`. External provider traffic was blocked; protected credentialless frames cannot inherit the preview login. These screenshots do not prove actual provider rendering on the protected preview.

Independent read-only review accepted source5e9276f and22 local fixtures (no provider calls); wider legal/provider/production acceptance was not asserted.

CI run41311060207 on5e9276f: Auth PASS; typecheck/lint PASS; tests7803 with4 native-activity browser timeouts, so build/hygiene did not run. Reproduced with installed Chrome while bundled Chromium140 passed. Diagnostic pointer events showed the search click landing in the fixture iframe during smooth viewport scrolling, with no native request. An independent reduced-motion control passed without runtime changes, isolating scrolling as the cause. The test helper now observes a stationary visible unobscured button before an ordinary mouse click, after fixture frame load. No force click, DOM-event dispatch, disabled animation, longer timeout or skipped assertion. Both13-test browser suites PASS with installed Chrome and bundled Chromium; focused TypeScript/ESLint PASS. Exact new-head CI remains required.
