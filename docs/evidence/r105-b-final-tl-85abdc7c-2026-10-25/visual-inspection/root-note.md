# R105 B — independent final-head local review

Recorded by ChatGPT / Technical Lead on 2026-10-25 at 00:14 UTC.

## Identity and disposition

- Pull request: https://github.com/Jetnity/jetnity/pull/1000
- Exact final head: `85abdc7c33a34b7a93a3fdb6f78f658940ee1063`.
- Exact tree: `9ea461a1ca193fd86314e2269f10cf8d2521ac8a`.
- Actual accepted main and merge-base: `9092b29c2e187bd73d644a3d85670f3ac6436be1`; **13 ahead / 0 behind**.
- Original author: **Jetnity Account Booking Folder Completion 1 — Cursor Generation 1**.
- Original session: `bc-a34030c7-4c19-4c9f-863f-193cfdfa34da`; runtime-attested model `grok-4.7-high-fast`.
- Final author STOP / write freeze: https://github.com/Jetnity/jetnity/pull/1000#issuecomment-6391167810
- **Independent local source, focused tests, synthetic action and scoped layout acceptance: PASS. B-P2-LAYOUT-06 is resolved within this checked scope.**
- **This file is not the overall TL FINAL PASS, Ready, merge or Production acceptance.** At its recording, native CI40145053852 is still running. The later exact-head TL verdict and actual-main acceptance must be read in the PR and canonical issue751.

## Complete source review and preservation

The full candidate changes40 paths versus actual main. The six product/runtime files and four focused test files were reviewed. Relative to the rejected84c496c0 head, the final correction changes14 paths: AccountBuchungen wrapping/sizing, montage style/provenance checks, four owned review documents and eight new evidence files.

The UI preserves font scaling and visible labels, wraps heading/card/action text, and constrains widths. It does not hide root/page overflow, truncate the heading/action label or alter query/data/auth behavior. The montage now verifies actual H1 and link styles, including valid computed flex blockification.

Other runtime/test blobs are unchanged from the earlier independent review. TASK754fc2e0d87ba0755713c174acf60723ab3d1f13 and PLANb29a5195c57c797f6252dc5863fc6c7b9f0ebac2 remain unchanged. Original NOTES5fdde5ee5eb264b051ad7dd24f4c8999e2afeec9, ablaufcd93aeefab08db4a4599df9e1582b3e1ac334691, montage7a41748c2595fdb4f04e6d18b35cb3c4139dafab and complete v2-tree95b3f797af6475d9f5f1242e2b021d0b582a3a81 remain unchanged.

The author's v3 evidence honestly records execution on824f1bab/tree704c9eea. It is not relabelled as final-head execution. Older SELF_REVIEW/HANDOFF paragraphs referring to1574adcb or unchanged source after5a284965 are historical prose superseded by the explicit V4 record. This file distinguishes historical preservation, author proof on824f and root execution on85ab.

No migration, RLS policy, hosted SQL, credential, provider, dependency, global CSS, workflow or production-data change is in this correction. The existing authenticated server-client/ownership boundaries remain; this review is not fresh hosted-RLS acceptance.

## Fresh focused execution

The unchanged normal-process-isolation runner was invoked on clean final85ab.

1. The first sandbox invocation returned exit0 but only four file containers, zero suites and no32-test detail. The wrapper correctly rejected it as FAIL. This is retained in focused-final-proof-avana4zy and is not accepted as a test pass.
2. A supported, approved invocation of the same runner with regular local execution permissions produced **32 tests /4 suites /32 pass /0 fail /0 cancelled /0 skipped /0 todo**, with unchanged source bindings. Result48b8cbe073561c91d856bdf05b9bde09120ba3439925dc1d1723fc69284fd6ed in focused-final-proof-lltnzrej.

The commands, Node24.22.1, test files and wrapper bytes were unchanged. No test-isolation override, weakened count gate or product edit was used. The exact mechanism of the first incomplete report was not established; its result is not a product failure claim.

## Fresh action and layout execution

Root executed the source-author harnesses on final85ab in an isolated synthetic Chromium140.0.7339.16 context. Result SHA256: `501fd918acc97614c7e719d2cfcf324e1a009977064926e87266b3efcf6b9424`.

The reviewed adapters change only the existing Chromium executable, explicit actual-main metadata, external CSS source/provenance and a passive montage observer. Reverse adaptation reproduces original Git bytes. The computed-style function, fixtures, widths, states, keyboard, screenshot and overflow assertions remain byte-identical.

- Action: actual-loader211-row walk and synthetic-surface search by button and Enter, reset, continuation, Back, filter-bound retry, empty/end states and plan-item target all passed.
- Layout: **56 measurements /7 states /8 views /7 keyboard paths /maximum overflow0**. Widths280,320,360,390,430,768,1280 and844×390 were checked; root32px applies only at320, otherwise16px.
- Reduced-motion setting is `reduce`.
- Passive observer: zero page errors, console errors, unexpected requests and failed requests.
- Source, HEAD, tree and clean working status were verified before and after.

Critical320×700/root32 measurement: H1 font60px, line72px, tracking−2.4px, weight600, overflow-wrap:anywhere; plan-item link font28px, width238px, right edge279px. Overflow is0. The rejected84c4 run had37px overflow.

CSS class is **LOCAL_PROJECT_POSTCSS_COMPILATION**, produced through the unchanged project PostCSS/Tailwind pipeline on final85ab. CSS SHA256: `7e913d744353e72444dcbbf08cb9241f34836143b0961d8703e0c26faaa85e79`; provenance44a3114c1493dfe06832324d99af144594e39241df2b2937ea54ec0e8cba3d35. It is not asserted byte-identical to the author's Next build CSS9fdcfb3304373fe80e813c75b8a05078064bb38eeba3b6f309db2e28d45ccf7b.

## Root visual inspection and the long-image limitation

Root inspected the six source screenshots, using unscaled crops for the long list images:320/root32 heading/filter/first card,390/root16 heading/first cards/list tail, and full390 empty/no-match/error/end screenshots. The crop manifest identifies exact source bytes and pixel rectangles; crops are inspection derivatives, not new browser captures.

The320 full-page PNG is28350px tall. Its lower area is blank after part of the list. That image alone therefore cannot prove rendering of the complete list tail.

Root prepared, reviewed and executed one separate focused diagnostic using the same exact component, byte-extracted author list fixture and verified CSS. It rendered the50-card list once in a fresh offline about:blank page and captured two ordinary320×700 viewports. No56-case rerun or author-assertion change occurred.

The diagnostic result is `CAPTURED_REQUIRES_VISUAL_REVIEW`; Root subsequently visually inspected both resulting PNGs. Both show **Flug50**, its complete wrapped plan-item action, and **Weitere Buchungen** rendered at the bottom. The two scroll requests clamp to the same bottom position27650px; they are two captures of that same final viewport, not independent layouts. The document retains50 cards, scrollHeight28350px, clientWidth320px, scrollWidth320px, root32px and H1 60/72/−2.4px. The title and pagination have positive in-viewport hit tests; the pagination href matches the original fixture. All passive observer arrays are empty and source bindings remain unchanged.

This resolves the observed tail-rendering concern for the scoped static view. The full-page image's blank tail remains preserved as a capture limitation; no precise browser/GPU cause is claimed. Root's visual conclusion is recorded here, separately from the diagnostic's deliberately non-visual automated status.

## Evidence boundaries and remaining gates

These are local synthetic proofs. Title matching in the action seam uses String.includes, not PostgreSQL~*. History is a single about:blank document, not full Next App Router restoration. Static markup does not prove hydration, a hosted account, hosted SQL/RLS, native browser zoom, a physical device or a screen reader. The native select's display at enlarged root text is not a general accessibility certification.

The complete final native CI logs, exact Preview and thread gates remain mandatory before Ready/merge. Accepted actual-main CI, exact Production and jetnity.com mapping remain mandatory after merge and before issue997 closure.

Standing special holds remain unchanged:985/982,917,913/911,968,748 personal-browser/CUA suspension,626, Bern934/937 and all reserved Production/Auth/RLS/provider/secret/payment/indexing/launch/cost gates. No additional product slice is authorized by this review.

