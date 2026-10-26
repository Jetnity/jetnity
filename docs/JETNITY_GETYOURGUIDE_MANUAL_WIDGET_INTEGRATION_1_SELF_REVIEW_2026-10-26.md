# GetYourGuide Manual Widget Integration 1 — SELF-REVIEW

Date: 26 October 2026.
Writer: Jetnity GetYourGuide Manual Widget Integration 1 — Cursor Generation 1.
This review is the author’s own reading. It is not an independent Technical-Lead PASS.

## What holds

The search configuration never stores a search string as a GetYourGuide location id. The server rebuilds the country label from the country code, so the client cannot substitute a country name. Private tokens of at least 8 characters, URLs, and `geonames:` names are rejected. The inactive document and the active document are split by Fetch Metadata, not by a session. The route does not call `cookies()` or a server client. Analyzer text is absent from the trip component, the activities area, and the root, public, account and admin layouts. The privacy addition is a Jetnity-owned paragraph. It does not edit PrivacyBee text and does not say the integration is certified.

`credentialless` was added after a same-context cookie was observed on the embed request. The following framed proof no longer reported that canary on iframe embed requests. `allow-same-origin` was not added. The widget still rendered offers with that attribute. An earlier parent console recorded `SecurityError` for `localStorage` inside the opaque frame; the widget still drew offers. The final proof’s parent console list was empty.

## What does not hold as V1 section 9.3

TASK V2 replaces only the mandatory product-detail destination for #1040. A search list with `partner_id=2MQHT6Z` is the bounded result. The earlier Arrábida page, when it rendered, was one observed detail body at a search-shaped URL. It is not a guarantee and it does not close V5. The final saved product screenshot of the previous proof was an outage and stays an outage. The visible copy now says an offer click can open a GetYourGuide result list first.

## Analyzer

On `127.0.0.1` the script is present and `gygPAStatus` remained `loading` for three ticks. Offers still rendered. No `pageerror` or `unhandledrejection` was captured. `sessionStorage` throws in the opaque document. Five collector requests mean telemetry happened. The branch preview host contains `getyourguide` and is behind Vercel SSO, so this session did not verify Analyzer initialization on an eligible host. `allow-same-origin` was not added to hide that.

Root’s San Blas probe is a search list: H1 “San Blas Panama”, `/s/`, 62 results, partner kept. Lisbon, Crete and Portugal card anchors on this branch are the same `/s/?et=&q=` shape with `partner_id=2MQHT6Z`. The latest click of each opened the outage page, title “GetYourGuide – Error”, empty H1, Ray IDs `a50d22a04b76bdc9`, `a50d238deafabdc9` and `a50d24757dc9bdc9`. That is not a search-list H1 and not a product page. One earlier observation in this session did show “From Lisbon: Arrábida and Sesimbra Full-Day Tour”. That image is not the file left on disk.

Root’s location-42 control landed on `/s/` with 500+ Lisbon results and the Sintra/Cascais card highlighted first, with no H1 within 20 seconds. Report SHA256 `17c62cb2327d5fad7ba51331fe7b8af2797b83c4cbe6d3508f960c32ef6c6b77`. Root’s product-492343 control landed on `/s/?q=Panama+City`, H1 “Panama City”, 437 results, offer highlighted first. Report SHA256 `1343f5ca078b8f197770309e96a61b46ca4a146e6a701d8b595ec92b0f8eba2f`. The provider card uses upstream `activity.href`. A highlighted search result is not section 9.3. A reviewer should treat V1 section 9.3 as open. Preview paint on this head is still unchecked. Root’s blank and populated PNGs are separate observations and are not one screenshot.

The provider “see all” target is not the searched place in every case. Crete’s see-all link was Santorini. That link was not used as product proof. It is still what the official widget rendered.

On a wide viewport the three offer anchors share one box (top 0, bottom 447) inside a provider viewport of about 495px. At 375px they stack to 354, 724 and 1094. The outer iframe used to stay at 640px and hid the lower cards. It now follows the bounded height message and was 1187px in the latest proof. The ancestor’s `overflow-y: hidden` did not clip that iframe. The provider frame was 1203px client and scroll, so the third card fit. About 32px of the embed document remained below the outer iframe. The message rejects any payload other than the three height fields, any origin other than `null`, and any source other than the current iframe. `gygPAStatus` on `127.0.0.1` is still not Analyzer success. Collector telemetry remains.

A live region widget was not opened. The region path is unit-tested only.

The full test suite on the code before the height message is 7366 tests, 7350 pass, 11 fail, 5 skipped. The 11 failures are missing `/usr/lib/postgresql/16/bin/initdb`. They were not rerun as passes, and the full suite was not repeated after the height message. Focused GetYourGuide tests after that message: 42 pass, 0 fail. `tsc --noEmit` passed. `npm run build` on this head passed and lists `ƒ /embed/getyourguide`. Hygiene passed, with the existing LOCAL/UNAPPLIED RPC notes only. Scoped ESLint exited 0.

## Scope left alone

No change to Places, native activity adoption, Trip types, database, Auth, dependencies, workflows, global styles, or security headers outside the embed response. No new paid infrastructure. The in-repo guard is not a claim of tamper-proof HOLD enforcement. Ready and merge stay with the Technical Lead.
