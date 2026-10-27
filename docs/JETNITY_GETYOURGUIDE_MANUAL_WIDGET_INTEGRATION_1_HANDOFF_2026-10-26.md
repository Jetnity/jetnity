# GetYourGuide Manual Widget Integration 1 — HANDOFF

Date: 26 October 2026.
Exact writer: Jetnity GetYourGuide Manual Widget Integration 1 — Cursor Generation 1.

## Runtime receipt

Re-read at this reporting point from cursor-cloud `run-info`. Field `originalModelName`: `grok-4.7-high-fast`. Run `source`: `scm`. Session `bc-a2ac7c66-900d-4ad0-9fd1-dfe692d10f50`, https://cursor.com/agents/bc-a2ac7c66-900d-4ad0-9fd1-dfe692d10f50. The same logical name is the run `name`. This is the original Generation 1 session. It was not restarted.

Stage at this R1 delivery: same Generation 1 session, no new writer. Root task revision `3eddc72ade423afa1dd5109f3bbd625014495f7e` remains an ancestor. Fresh `origin/main` on 27 October 2026 is `7d52da97efc1f40fbea5c07d978c2e81e6b76659`, tree `608321f4a8813adf1de23c3132039d39f9c27e98`, merge-base that commit, behind 0. The reviewed head before this correction was `dd6f972d20eae71cac3d66dfbb407380868a7c77`, tree `e3947a4c47b29c914b5707806f9de491778149cf`, 9 ahead. Actions run 40418657518 passed for that SHA only. This file cannot name the corrected tip’s own SHA. It is the PR body after the push.

Capability blocker: the delivered product screenshot is the provider outage page, not a missing certificate exception. This session’s Playwright Chromium loaded the official widget, images and offer titles. `allow-same-origin` was not added. Root’s `net::ERR_CERT_AUTHORITY_INVALID` note stays outside this implementation.

## R1

The height script no longer reads scroll height, writes the provider parent style, or remembers a maximum. It posts the provider loader’s current explicit pixel height, up or down, within 1 to 2400. CSP hash `sha256-7l6jKj7GuYrEhMz6eSTGsEYmIyXjLcO292wkNpWkfn8=`. Root’s old-script SHA256 `70eb95959f7e6172f3640a033c0f5a98a7e28a3431dc09d613a792e1ba0845ee` and the 1116→1292 climb stay the finding against that script. The synthetic regression held 1100px for 6 seconds with scroll height 1116, then 400, then 1100, including 375px, with no provider request. The live Lisbon frame then settled at 495px, 1173px and back to 495px, each time matching the loader style for 1.5 seconds. At 375 the third card ended at 1121 inside the 1173px frame. The ancestor did not clip it. Embed scroll and client were both 1173. The earlier 1187px and 32px remainder are not this script.

Parent document, URL, cookie and localStorage reads from the embed frame threw `SecurityError` at origin `null`. Request URL, headers and body, including popup navigations, had no canary. Collector telemetry was 9. `gygPAStatus` stayed `loading`. The same-surface native card stayed through a pending adoption, the accepted message “Die Übernahme wurde gemeldet.”, and GetYourGuide removal. Synthetic A→B→A, mismatched id, failure, retry, unmount and a second instance completed with no provider request. The offer click is still the provider outage, Ray IDs `a510b081d99d3e6e`, `a510b16f6e543e6e` and `a510b2573fa93e6e`, with `partner_id=2MQHT6Z`. That is not section 9.3. Preview and eligible-host Analyzer stay unchecked.

## Analyzer on this host

The local proof runs on `127.0.0.1`. That is an IPv4 hostname. Root’s source finding says the official Analyzer skips initialization on localhost, every IPv4 hostname, and hostnames containing `getyourguide`. This session did not invent another hostname and did not use the branch alias, which contains `getyourguide` and currently answers with Vercel SSO.

Observed on the opaque embed document, three ticks about two seconds apart, after the Lisbon offers were visible:

- The document contains the Analyzer script. The browser requested `/dist/pa.umd.production.min.js` once per shown destination.
- `gygPAStatus` stayed `loading` on every tick. That is not initialization success. `ok` was not observed.
- `sessionStorage` throws `SecurityError` because the document is sandboxed without `allow-same-origin`. The same throw occurs in the provider frame.
- `pageerror` and `unhandledrejection` lists were empty on these ticks. No uncaught `getVisitorId` exception was observed here. That does not clear the eligible-host risk, because this hostname is one the Analyzer skips.
- An earlier tick on the previous head counted five requests to `collector.getyourguide.com`. The R1 run on this correction counted nine. This is not a zero-telemetry result. The private canary was not in those request URLs, headers or bodies.

The published preview for this head was not opened. Commit status for `9d995008` points at Vercel deployment `4WndLaqmNBYhwk8eLiB59shhwZ8i`. The only preview host written on the PR contains `getyourguide` and redirects to SSO. No eligible deployment hostname was available without authentication.

Smallest options, not implemented: review Analyzer collection on an immutable deployment host that is neither localhost, nor an IPv4 literal, nor a name containing `getyourguide`, once that host is reachable. If that host shows the uncaught `sessionStorage` exception, keep the opaque sandbox. A later separate cookiefree origin is already outside this slice. Do not add `allow-same-origin`, do not patch provider storage, and do not rename the local host to pass the provider filter.

Branch: `feat/getyourguide-manual-widget-integration-1`
Draft PR: #1041
Tracking: #1040
Parent: #1023 V5
Immutable TASK blob: `7c7b442fafaa0f20ceb641d0a335d564224d7120`
Task seed: `36837100ea710a6514321be518c32b0f7680a531`, tree `3f87860285a68e56e66cc4b9bad32fd05334cafb`, sole parent `7d52da97efc1f40fbea5c07d978c2e81e6b76659`.

Implementation commit: `b2ae807ffd9e5331154a24bb469e1d480595857b`. First handoff commit: `8da4d3292a4d00afe2f57598043b2ff6f8164a21`. Root task revision: `3eddc72ade423afa1dd5109f3bbd625014495f7e`. The review head is the tip that contains this Analyzer observation. This file cannot name that tip’s own SHA. Fresh `origin/main`: `7d52da97efc1f40fbea5c07d978c2e81e6b76659`, tree `608321f4a8813adf1de23c3132039d39f9c27e98`. Merge-base: that same commit. Behind: 0.

This is not a Root PASS. Do not mark Ready. Do not merge. Do not start a follow-up slice.

TASK V2 addendum `3eddc72ade423afa1dd5109f3bbd625014495f7e` is adopted. For this slice, an offer-card click that opens GetYourGuide’s own page and keeps `partner_id=2MQHT6Z` is the bounded navigation result. A search list is reported as a search list. It does not satisfy TASK V1 section 9.3 and it does not close #1023 V5. The UI says an offer click can open a result list first.

## What the next reviewer has

An explicit load path for the documented manual activities widget. `data-gyg-q` is built from the confirmed public name and `landName(code, 'de')`. A country with no days uses only the country label. Place type stays in the Jetnity context key and is not sent as a provider parameter. The empty identifier map is not consulted. Partner `2MQHT6Z`, campaign `jetnity_activities`, locale `de-CH` and three items are fixed. The brand link is `https://www.getyourguide.com/`.

The child document is `GET /embed/getyourguide`. It has no session and no database read. Fetch Metadata must be iframe / navigate / same-origin or the response is the inactive sentence and contains no Analyzer. Sandbox is `allow-scripts allow-popups allow-popups-to-escape-sandbox` with no `allow-same-origin`, also in the response CSP. The iframe is `credentialless` and `referrerPolicy=no-referrer`. Invalid, duplicate, oversized and unexpected query keys return 400 and do not load the Analyzer.

Native activity search, cards and adoption are untouched. An invalid day still does not fall back to the first day for GetYourGuide. Unknown or conflicting countries stay unresolved. Removal and context change drop the document and reject a late completion.

## Evidence

Focused command, Node v22.23.4:

`node --import ./scripts/server-only-test-register.mjs --import tsx --test lib/activities/getyourguide/*.test.ts`

Result after the height message: 42 tests, 8 suites, 42 pass, 0 fail. The added test rejects a foreign origin, a foreign window, an extra field, and a height above 2400.

Full `npm test` on this code, Node v22.23.4, duration about 101s: 7366 tests, 886 suites, 7350 pass, 11 fail, 5 skipped, exit 1. Every recorded failure is `spawnSync /usr/lib/postgresql/16/bin/initdb ENOENT`. PostgreSQL 16 is not installed in this environment. Those 11 failures are not GetYourGuide assertions and were not converted into passes.

`npx tsc -p tsconfig.json --noEmit` passed after the height message. `npm run build` on this same head passed and lists `ƒ /embed/getyourguide`. Hygiene on this head passed: `check:dead` (0 orphans), `check:exports` (0 unused), `check:deps`, `check:api-schutz`, `check:schema-bezug` with the existing LOCAL/UNAPPLIED RPC notes only. ESLint on the GetYourGuide paths, the embed route, and the proof script exited 0. The full `npm test` suite was not repeated after the height message.

Public proof: `node --import tsx scripts/getyourguide-manual-widget-integration-1/run.ts`

Latest run exit 1 because the landed bodies were the provider outage, not because the widget failed to draw. Offer grids for Lisbon, Crete and Portugal showed images and titles. `anbieterVorKlick` was 0. Hosts after load: `widget.getyourguide.com`, `cdn.getyourguide.com`, `collector.getyourguide.com`. The latest proof recorded 9 collector requests. That is telemetry. It is not a claim of zero tracking, and the private canary was not in those URLs.

Root’s San Blas card click opened `/s/?q=San Blas Panama`, H1 “San Blas Panama”, 62 results, `partner_id=2MQHT6Z`. All three of those anchors were the search route. Lisbon, Crete and Portugal cards on this branch use the same route shape: `/s/?et=…&q=Lissabon+Portugal`, `q=Kreta+Griechenland`, and `q=Portugal`, each with `partner_id=2MQHT6Z`. They do not behave as a different product-detail destination. The latest click of each first card kept the partner id and rendered title “GetYourGuide – Error” with no H1. Ray IDs: `a50d22a04b76bdc9`, `a50d238deafabdc9`, `a50d24757dc9bdc9`. That outage is not relabeled as a search list or as V1 section 9.3. An earlier Lisbon body in this session showed the Arrábida/Sesimbra tour; that image was overwritten. See-all links (`lissabon-l42`, `santorin-l753`, `sintra-l99`) were not used as the card proof.

Root’s later controls use the same search destination. Lissabon location 42 opened `/s/` with 500+ Lisbon results and “Sintra, Pena, Regaleira, Cabo da Roca & Cascais” highlighted first. No H1 appeared within 20 seconds. Report SHA256 `17c62cb2327d5fad7ba51331fe7b8af2797b83c4cbe6d3508f960c32ef6c6b77`. Product 492343, “Tour zu den San-Blas-Inseln mit Inselhopping”, opened `/s/?q=Panama+City`, H1 “Panama City”, 437 results, offer highlighted first. Report SHA256 `1343f5ca078b8f197770309e96a61b46ca4a146e6a701d8b595ec92b0f8eba2f`. Partner `2MQHT6Z` remained in both. Root read the provider card code: the click uses upstream `activity.href`. A highlighted search row is not section 9.3. Those two identifiers are not added to the application. Both controls had zero canary matches, zero external requests before load, one child across resize, and only the parent after remove. Analyzer `sessionStorage` errors were 29 and 10. Root’s fixed-height fixture clipped lower mobile cards and is not this candidate’s layout acceptance. Blank and populated screenshots from those runs are separate observations. Preview paint stability for this head is still open.

At 375×812 the stacked Lisbon anchors ended at 354, 724 and 1094. A fixed 640px outer iframe clipped the second and third cards while the provider frame was about 1171px. The embed document now reports its height with the bounded message above. The parent set the outer iframe to 1187px. The `overflow-y: hidden` ancestor was 1791px and did not cut the iframe (`ragtUnten` false, `ragtSeitlich` false). The provider frame’s own client and scroll height were both 1203px, so the third card fit inside it. Embed scroll 1219 versus client 1187 left about 32px of the embed document below the outer iframe after the cards already fit. `allow-same-origin` was not added. The script hash is in the active CSP; inactive responses still have no script.

Crete’s visible titles included a Santorini day tour plus Gortyna/Phaistos/Matala and Rethymno/Chania. The provider “see all” link for that query pointed at `santorin-l753`. Lisbon’s three cards were Portugal day tours, not a hand-picked Lisbon catalog. That is the provider’s answer to `Lissabon Portugal`. A separate live region widget was not loaded. Region versus city is covered by the unit tests (Bangkok, Alentejo).

## Not done

`ACTIVE_WORK_STATUS.md` is outside the allowlist and was not updated. `scripts/getyourguide-visual-discovery-1/` was not rewritten and will not pass if run against this open path. No candidate CI/Preview was waited on for this head. Preview paint stability is unchecked. TASK V1 section 9.3 stays open because every observed card click that rendered was a search list or an outage. No actual-main acceptance. No purchase, commission claim, secret, or provider inquiry.
