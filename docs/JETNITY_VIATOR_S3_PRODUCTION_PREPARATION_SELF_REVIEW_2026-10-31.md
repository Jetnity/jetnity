# Viator S3 production preparation — SELF REVIEW

31 October 2026, Europe/Zurich. Author review only. Not an independent Technical Lead PASS.

The session is `bc-803fd88c-9fdc-47f7-acfc-213976e487f6`, model `grok-4.7-high-fast`. The S3 task blob `a6ea5935c2d5a20475955bef52731cad67154e47` was not edited.

## Holds

- `viatorProductionAusUmgebung` returns `source_closed` for a Production-looking env that includes both credential names. The factory and binder do not call `createViatorProductionTestClient`.
- The injected Production client calls only `https://api.viator.com`. Sandbox calls only `https://api.sandbox.viator.com` even when `VIATOR_API_ORIGIN` or an input `origin` says otherwise. A cast host is rejected.
- Missing guard, missing HTTP, and a short credential create no request. A throwing guard, a guard result with an extra field, and a rate-limit result each leave the HTTP count unchanged. Detail, schedule, and check each preflight once.
- With the activity flag cleared, a provider that already loaded destinations does not call again. Direct detail, schedule, and check routes under `VERCEL_ENV=production` return unavailable and the test fetch spy stays at zero.
- A Lisbon primary id is labeled Lisbon on a Bangkok trip. A Portugal country primary id stays unlabeled and `punkt` stays null. The referral URL matches the provider string. Adoption's picked option has no `productUrl`. A second product code, a `javascript:` URL, an off-host URL, and an extra commission field are dropped.
- The browser card shows the sponsored link at 320, 390, 768, and 1440, focuses it, and does not request detail until the visitor opens the offer. Changing the day removes the card.

## Gaps

Runtime activation is blocked. The S6-A reservation objects are absent in the Production and Dev catalogs Root read. No HMAC secret and no reservation port were created. Image and content rights remain unverified. No live product URL was compared with a provider response in this task. R5 CI and Preview do not cover this head. Author self-review is not a Technical Lead PASS.

Stop. No Ready. No merge. No follow-up slice.
