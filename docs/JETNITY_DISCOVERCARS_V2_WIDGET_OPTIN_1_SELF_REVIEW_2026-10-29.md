# DiscoverCars V2 widget opt-in 1 — self-review

Author review only. This is not a Technical Lead PASS.

## Owner correction

Reviewed after the 29 October 2026 clarification in this same session. The widget component, gate, and markup tests now state that no pickup is set and that `data-location=thailand/bangkok/suvarnabhumi-airport-bkk` is refused. The V1 affiliate file was not edited. The task file was not rewritten. A blank-location attribute is still not claimed.

## Checked

- Run-info after rename: stored name matches the dispatch, `originalModelName` is `grok-4.7-high-fast`, bcId `bc-1885a130-36a8-4dcf-86bc-48aa6121c24e`.
- Task blob `f4b0996471eb67b811382c1102f88285944335e5` matches HEAD before and after the implementation commit.
- Repo search and the public widget page do not contain Jetnity’s export. Status is `VENDOR_EXPORT_MISSING`, not a guessed script.
- `MietwagenBereich` does not pass `pruefnaht`. The affiliate JSX call is unchanged. Markup tests still expect the generic `a_aid=jetnity` link and reject the trip id in that section.
- The widget component source has no `fetch(`, iframe, script, image, `dangerouslySetInnerHTML`, cookie, localStorage, or `https://`.
- Gate tests reject report fragments (`data-utm-source`, `data-aff-code`), duplicate keys, `www.discovercars.com`, private fields, and `einwilligung: true`.
- Playwright on the real components: no load button in the normal housing; Tab/Enter/Escape/Space on the seam; late fixture after a trip change does not appear; error retry stays on the error; zero DiscoverCars/PrivacyBee requests.
- Widget section overflow is 0 at 320, 390, 768, 1440 and at root 32px / 320px. Page overflow at that last size is the V1 BKK label, 18px, file not edited.
- `npm run build` completed, including its TypeScript pass, after the fixture return type was narrowed. Focused tests after the owner correction: 19 pass, 0 fail.

## Not checked, and not claimed

- Physical devices, VoiceOver, or the browser’s own 200% zoom control. Chromium CSS `zoom: 2` was applied and overflowed, as a scaled document will. That is labelled in `browser.json` and is not a zoom-control pass.
- A hosted Preview click, partner-dashboard attribution, or any live DiscoverCars response.
- The full repository test suite. Regression coverage here is the V1 affiliate markup file plus the new widget tests.
- Independent CI. Author-local build is not GitHub App/Auth CI.

## Risk I am leaving visible

The seam is a real prop. A future caller could pass `synthetisch-nicht-anbieter` and show the local fixture. It still cannot load a vendor URL, and production Mietwagen does not pass it. The honest risk is a misleading test control if someone wires the prop into the product. Do not do that.

A future `widgetDarfAusfuehren()` that returned true would hide the seam button and still would not inject a script. There is no script to inject.
