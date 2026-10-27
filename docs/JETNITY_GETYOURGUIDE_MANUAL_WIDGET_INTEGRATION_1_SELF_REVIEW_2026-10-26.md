# GetYourGuide Manual Widget Integration 1 — SELF-REVIEW

Date: 26 October 2026.
Writer: Jetnity GetYourGuide Manual Widget Integration 1 — Cursor Generation 1.
This review is the author’s own reading. It is not an independent Technical-Lead PASS.

## What holds

The search configuration never stores a search string as a GetYourGuide location id. The server rebuilds the country label from the country code, so the client cannot substitute a country name. Private tokens of at least 8 characters, URLs, and `geonames:` names are rejected. The inactive document and the active document are split by Fetch Metadata, not by a session. The route does not call `cookies()` or a server client. Analyzer text is absent from the trip component, the activities area, and the root, public, account and admin layouts. The privacy addition is a Jetnity-owned paragraph. It does not edit PrivacyBee text and does not say the integration is certified.

`credentialless` was added after a same-context cookie was observed on the embed request. The following framed proof no longer reported that canary on iframe embed requests. That observation is Chromium, which implements `credentialless`. A browser without it can still send a first-party cookie on the first-party route. That is not, by itself, a provider leak. `allow-same-origin` was not added. The widget still rendered offers with that attribute. An earlier parent console recorded `SecurityError` for `localStorage` inside the opaque frame; the widget still drew offers. The final proof’s parent console list was empty. The embed frame’s own attempts to read parent document, URL, cookie and localStorage now throw `SecurityError` from origin `null`.

## What does not hold as V1 section 9.3

TASK V2 replaces only the mandatory product-detail destination for #1040. A search list with `partner_id=2MQHT6Z` is the bounded result. The earlier Arrábida page, when it rendered, was one observed detail body at a search-shaped URL. It is not a guarantee and it does not close V5. The final saved product screenshot of the previous proof was an outage and stays an outage. The visible copy now says an offer click can open a GetYourGuide result list first.

## Analyzer

On `127.0.0.1` the script is present and `gygPAStatus` remained `loading` for three ticks. Offers still rendered. No `pageerror` or `unhandledrejection` was captured. `sessionStorage` throws in the opaque document. Five collector requests mean telemetry happened. The branch preview host contains `getyourguide` and is behind Vercel SSO, so this session did not verify Analyzer initialization on an eligible host. `allow-same-origin` was not added to hide that.

Root’s San Blas probe is a search list: H1 “San Blas Panama”, `/s/`, 62 results, partner kept. Lisbon, Crete and Portugal card anchors on this branch are the same `/s/?et=&q=` shape with `partner_id=2MQHT6Z`. The latest click of each opened the outage page, title “GetYourGuide – Error”, empty H1, Ray IDs `a50d22a04b76bdc9`, `a50d238deafabdc9` and `a50d24757dc9bdc9`. That is not a search-list H1 and not a product page. One earlier observation in this session did show “From Lisbon: Arrábida and Sesimbra Full-Day Tour”. That image is not the file left on disk.

Root’s location-42 control landed on `/s/` with 500+ Lisbon results and the Sintra/Cascais card highlighted first, with no H1 within 20 seconds. Report SHA256 `17c62cb2327d5fad7ba51331fe7b8af2797b83c4cbe6d3508f960c32ef6c6b77`. Root’s product-492343 control landed on `/s/?q=Panama+City`, H1 “Panama City”, 437 results, offer highlighted first. Report SHA256 `1343f5ca078b8f197770309e96a61b46ca4a146e6a701d8b595ec92b0f8eba2f`. The provider card uses upstream `activity.href`. A highlighted search result is not section 9.3. A reviewer should treat V1 section 9.3 as open. Preview paint on this head is still unchecked. Root’s blank and populated PNGs are separate observations and are not one screenshot.

The provider “see all” target is not the searched place in every case. Crete’s see-all link was Santorini. That link was not used as product proof. It is still what the official widget rendered.

The previous height script measured document scroll height, wrote it back, and kept the maximum. Root showed 1116→1292px and a failure to shrink. That script’s SHA256 is `70eb95959f7e6172f3640a033c0f5a98a7e28a3431dc09d613a792e1ba0845ee`. The 1187px frame and the 32px remainder belong to it. The replacement posts the loader’s current explicit pixel height in both directions. A synthetic run stayed at 1100px for 6 seconds while scroll height was 1116, then followed 400 and 1100 again. On the live Lisbon widget the settled outer height was 495px at 1440, 1173px at 375, and 495px after returning to 1440, each matching the loader style for 1.5 seconds. At 375 the card bottoms were 363, 742 and 1121 inside the 1173px frame. The ancestor did not clip it. Embed scroll and client were both 1173. The message still rejects any other payload, any origin other than `null`, and any other window. `gygPAStatus` on `127.0.0.1` is still not Analyzer success. Nine collector requests mean telemetry remains.

The same proof run completed synthetic exact-id resolution, a late A→B→A drop, a mismatched id, load failure, retry, unmount, and two instances. Native adoption in the same section was observed pending and then as “Die Übernahme wurde gemeldet.”, and it survived GetYourGuide removal. Those steps made no provider request. They are not a substitute for Preview. The latest card click is still the outage page, Ray ID `a510b081d99d3e6e`, with the partner id kept. Crete and Portugal in the same run were Ray IDs `a510b16f6e543e6e` and `a510b2573fa93e6e`. The proof exits 1. That is not a search-list pass and not section 9.3.

A live region widget was not opened. The region path is unit-tested only.

The full test suite on the code before the height message is 7366 tests, 7350 pass, 11 fail, 5 skipped. The 11 failures are missing `/usr/lib/postgresql/16/bin/initdb`. They were not rerun as passes, and the full suite was not repeated after the height message or after R1. Focused GetYourGuide tests plus the legal inventory after R1: 52 pass, 0 fail. `tsc --noEmit` passed on this working tree. Scoped ESLint on the R1 files exited 0. The synthetic height script exited 0. The live proof exits 1 only on the provider outage. A local `npm run build` of this correction passed and lists `ƒ /embed/getyourguide`. Hygiene was not re-run. `npm run build` and hygiene on `dd6f972d` are not gates of this correction. GitHub Actions run 40418657518 is not a gate of this correction.

## Scope left alone

No change to Places, native activity adoption, Trip types, database, Auth, dependencies, workflows, global styles, or security headers outside the embed response. No new paid infrastructure. The in-repo guard is not a claim of tamper-proof HOLD enforcement. Ready and merge stay with the Technical Lead.
