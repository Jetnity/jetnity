# DiscoverCars rental affiliate linkout 1 — SELF REVIEW

**27 October 2026.** Author review only. Not an independent Technical Lead PASS.

## What holds

- The decision function returns one of two string constants. Hostile objects are not interpolated.
- BKK requires `ausdruecklich === true` and a plain object whose own keys and values equal the frozen station. `BKK`, `Bangkok`, a partial object, an extra key, a different prototype or a symbol property fail closed.
- The generic URL has no `currency`. The BKK URL's `currency=chf` is the constant, and the UI says it is not the trip currency.
- Mietwagen call site is exactly `<DiscoverCarsAffiliateLinks reiseId={reise.id} stationen={reise.stages.length} />`. The rendered affiliate section for a Bangkok/Phuket trip does not contain the trip id, client ref, title, place id, dates or `THB`.
- Markup uses one anchor, `target="_blank"`, `rel="noopener noreferrer sponsored"`, `referrerPolicy="no-referrer"`. No iframe, script, image or fetch in the component.
- `rentalCarProviderAus()` still returns `null`.
- Existing rental booking and manual-entry tests still pass.
- Local Chromium on the UI-audit Mietwagen tab: no `discovercars.com` request before or after the radio change. The link was not activated. Viewports 320, 390, 768, 1440 and a 32px root font (200% of 16px) showed no section or page overflow. Link height was 44px, or 154px at the larger root font. Radio labels were at least 44px, or the script would have exited 1.

## What does not hold

- This review cannot prove affiliate attribution, commission, account acceptance or an approved destination. Work's `UNKNOWN_PORTAL` preview was not reproduced and was not cleared.
- The outbound click, redirect and landing page were not opened. That is reserved for independent Work QA, with no purchase.
- 200% was a root font-size change in Chromium, not the browser's text-only zoom control. Tailwind sizes in this block are `rem`, so the check is meaningful, and it is not a full browser zoom certificate.
- `npm test` failed 11 times in this environment because PostgreSQL 16 `initdb` is absent or the local proof override is forbidden. None of those failures are in the DiscoverCars files. They are not a product regression from this diff, and they are not a CI PASS.
- GitHub Actions and Vercel Preview for the pushed head did not exist when this review was written.
- `gewaehlteStation` lets a test render the selected state. The production parent does not pass it. A later caller could pass the vetted constant without a click; anything else still becomes the generic URL.
- The BKK path contains the segment `bangkok` because that is the audited constant. The builder never slugifies a city name. A reviewer should keep those facts separate.
- Issue #751's stored main pointer was older than fetched `origin/main`. It was not corrected here.

## Recommendation

Keep the PR draft. Technical Lead review next. No Ready and no merge from this session.
