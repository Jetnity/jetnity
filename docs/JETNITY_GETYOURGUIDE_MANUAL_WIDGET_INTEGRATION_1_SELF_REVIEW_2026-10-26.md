# GetYourGuide Manual Widget Integration 1 — SELF-REVIEW

Date: 26 October 2026.
Writer: Jetnity GetYourGuide Manual Widget Integration 1 — Cursor Generation 1.
This review is the author’s own reading. It is not an independent Technical-Lead PASS.

## What holds

The search configuration never stores a search string as a GetYourGuide location id. The server rebuilds the country label from the country code, so the client cannot substitute a country name. Private tokens of at least 8 characters, URLs, and `geonames:` names are rejected. The inactive document and the active document are split by Fetch Metadata, not by a session. The route does not call `cookies()` or a server client. Analyzer text is absent from the trip component, the activities area, and the root, public, account and admin layouts. The privacy addition is a Jetnity-owned paragraph. It does not edit PrivacyBee text and does not say the integration is certified.

`credentialless` was added after a same-context cookie was observed on the embed request. The following framed proof no longer reported that canary on iframe embed requests. `allow-same-origin` was not added. The widget still rendered offers with that attribute. An earlier parent console recorded `SecurityError` for `localStorage` inside the opaque frame; the widget still drew offers. The final proof’s parent console list was empty.

## What does not hold as V1 section 9.3

TASK V2 replaces only the mandatory product-detail destination for #1040. A search list with `partner_id=2MQHT6Z` is the bounded result. The earlier Arrábida page, when it rendered, was one observed detail body at a search-shaped URL. It is not a guarantee and it does not close V5. The final saved product screenshot of the previous proof was an outage and stays an outage. The visible copy now says an offer click can open a GetYourGuide result list first.

The final product-page artifact is an outage page. The URL is the specific offer URL and keeps `partner_id=2MQHT6Z`, but the body does not show the tour. One earlier observation in this session did show “From Lisbon: Arrábida and Sesimbra Full-Day Tour”. That image is not the file left on disk. A reviewer should treat the product-body requirement as unproved on the delivered screenshot and should rerun the proof when GetYourGuide answers that URL again.

The provider “see all” target is not the searched place in every case. Crete’s see-all link was Santorini. That link was not used as product proof. It is still what the official widget rendered.

Offer-card rectangles in the provider document share one box (top 0, bottom 447). They fit the provider viewport once it has grown to 495px. A measurement taken earlier in the same session saw client height 150 and would have clipped that box. The proof now waits for the grown viewport. There is no parent resize channel. About 16px of provider document (511 scroll versus 495 client) remains below the provider viewport. The visible titles, including the powered-by line, were present in the frame text.

A live region widget was not opened. The region path is unit-tested only.

The full test suite on this code is 7366 tests, 7350 pass, 11 fail, 5 skipped. The 11 failures are missing `/usr/lib/postgresql/16/bin/initdb`. They were not rerun as passes.

## Scope left alone

No change to Places, native activity adoption, Trip types, database, Auth, dependencies, workflows, global styles, or security headers outside the embed response. No new paid infrastructure. The in-repo guard is not a claim of tamper-proof HOLD enforcement. Ready and merge stay with the Technical Lead.
