# Viator S3 production preparation — SELF REVIEW

31 October 2026, Europe/Zurich. Author review only. Not an independent Technical Lead PASS.

The session is `bc-803fd88c-9fdc-47f7-acfc-213976e487f6`, model `grok-4.7-high-fast`. The S3 task blob `a6ea5935c2d5a20475955bef52731cad67154e47` was not edited.

## Holds

- `viatorProductionAusUmgebung` returns `source_closed` for a Production-looking env that includes both credential names. The factory and binder do not call `createViatorProductionTestClient`.
- The injected Production client calls only `https://api.viator.com`. Sandbox calls only `https://api.sandbox.viator.com` even when `VIATOR_API_ORIGIN` or an input `origin` says otherwise. A cast host is rejected.
- Missing guard, missing HTTP, and a short credential create no request. A throwing guard, a guard result with an extra field, and a rate-limit result each leave the HTTP count unchanged. Detail, schedule, and check each preflight once.
- With the activity flag cleared, a provider that already loaded destinations does not call again. Flipping `JETNITY_ACTIVITY_AKTIV` or `VIATOR_SANDBOX_CALLS` inside the first injected response leaves a cold search at one destinations call and an availability check at one detail call. That injected-object proof is separate from the process binding. With no `deps.env`, changing the same process flags inside the first response also leaves search at one call and the availability check at one detail call. A constructed Sandbox client then makes zero further calls. An injected Production client without `aktiv` is `inactive`. A denying, throwing, or malformed guard makes zero HTTP calls. A guard that awaits, clears `aktiv`, and then returns allowed makes zero HTTP calls on both the destinations executor and the search executor. A throwing `aktiv` callback does not copy its text into the result. Direct detail, schedule, and check routes under `VERCEL_ENV=production` return unavailable and the test fetch spy stays at zero.
- Destination ids 343 then 344, and the reverse order, both leave `primaryDestinationId` null, `partial` true, and the card `locationName` null. The same id twice stays primary `343` with `partial` false. A malformed ref stays dropped and does not replace a single valid primary.
- A Lisbon primary id is labeled Lisbon on a Bangkok trip. A Portugal country primary id stays unlabeled and `punkt` stays null. The referral URL matches the provider string. Adoption's picked option has no `productUrl`. A second product code, a `javascript:` URL, an off-host URL, and an extra commission field are dropped.
- The browser card shows the sponsored link at 320, 390, 768, and 1440, focuses it, and does not request detail until the visitor opens the offer. Changing the day removes the card.

## Gaps

Runtime activation is blocked. The S6-A reservation objects are absent in the Production and Dev catalogs Root read. No HMAC secret and no reservation port were created. Image and content rights remain unverified. No live product URL was compared with a provider response in this task. R5 CI and Preview do not cover this head. Author self-review is not a Technical Lead PASS.

Stop. No Ready. No merge. No follow-up slice.
