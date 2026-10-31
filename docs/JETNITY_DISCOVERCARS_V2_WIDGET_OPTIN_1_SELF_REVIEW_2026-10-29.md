# DiscoverCars V2 widget opt-in 1 — self-review

**31 October 2026, R4.1.** The inert housing stays inert. The local harness now includes the light workspace shell and content ancestors, and the run fails unless the “Suchwidget” heading computes to `rgb(20, 62, 51)`. Focus after Tab, Enter, Escape, and the close click is the exact button element. Author review only. This is not a Technical Lead PASS. Earlier paragraphs describe the pre-merge head.

## Owner correction

The general export is now the bound 835-byte file with `data-location=""`. A BKK location value is refused. Runtime stays `CONSENT_BLOCKED`: PrivacyBee is not a consent manager, and issue #1073 is open and not clearance. No embed route and no vendor request were added. The task file was not rewritten.

## Checked

- Run-info after rename: stored name matches the dispatch, `originalModelName` is `grok-4.7-high-fast`, bcId `bc-1885a130-36a8-4dcf-86bc-48aa6121c24e`.
- Task blob `f4b0996471eb67b811382c1102f88285944335e5` matches HEAD before and after the implementation commit.
- The stored HTML file hashes to `5a9ea3edf4bfa5762850e0d1e6c9f5d777d860f9442fbe17bf9a76b1618cc8aa` and is not rendered as a script. Status is `LIVE_SOURCE_VERIFIED` with runtime `CONSENT_BLOCKED`.
- `MietwagenBereich` does not pass `pruefnaht`. The affiliate JSX call is unchanged. Markup tests still expect the generic `a_aid=jetnity` link and reject the trip id in that section.
- The widget component source has no `fetch(`, iframe, script, image, `dangerouslySetInnerHTML`, cookie, localStorage, or `https://`.
- Gate tests reject report fragments (`data-utm-source`, `data-aff-code`), duplicate keys, `www.discovercars.com`, private fields, and `einwilligung: true`.
- Playwright on the real components: no load button in the normal housing; Tab/Enter/Escape/Space on the seam; late fixture after a trip change does not appear; error retry stays on the error; zero DiscoverCars/PrivacyBee requests.
- Widget section overflow is 0 at 320, 390, 768, 1440 and at root 32px / 320px. Page overflow at that last size is the V1 BKK label, 18px, file not edited.
- R4.1 local shell: `.workspace-shell[data-workspace-theme="light"]` and `.workspace-content`, no `WorkspaceShell` import. Measured heading color `rgb(20, 62, 51)`. External request list empty. Exact-button focus passed for Tab, Enter, Escape, and the close click. Global CSS and production components were not edited for this correction.
- Focused tests cover the export hash, the 26 attributes, the consent block, and the V1 links. `npm run build` is re-run on this head.

## Not checked, and not claimed

- Physical devices, VoiceOver, or the browser’s own 200% zoom control. Chromium CSS `zoom: 2` was applied and overflowed, as a scaled document will. That is labelled in `browser.json` and is not a zoom-control pass.
- A hosted Preview click, partner-dashboard attribution, or any live DiscoverCars response.
- The full repository test suite. Regression coverage here is the V1 affiliate markup file plus the new widget tests.
- Independent CI. Author-local build is not GitHub App/Auth CI.

## Risk I am leaving visible

The seam is a real prop. A future caller could pass `synthetisch-nicht-anbieter` and show the local fixture. It still cannot load a vendor URL, and production Mietwagen does not pass it. The honest risk is a misleading test control if someone wires the prop into the product. Do not do that.

A future `widgetDarfAusfuehren()` that returned true would hide the seam button and still would not inject a script. There is no script to inject.
