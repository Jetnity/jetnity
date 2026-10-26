# GetYourGuide Manual Widget Integration 1 — HANDOFF

Date: 26 October 2026.
Exact writer: Jetnity GetYourGuide Manual Widget Integration 1 — Cursor Generation 1.

## Runtime receipt

Re-read at this reporting point from cursor-cloud `run-info`. Field `originalModelName`: `grok-4.7-high-fast`. Run `source`: `scm`. Session `bc-a2ac7c66-900d-4ad0-9fd1-dfe692d10f50`, https://cursor.com/agents/bc-a2ac7c66-900d-4ad0-9fd1-dfe692d10f50. The same logical name is the run `name`. This is the original Generation 1 session. It was not restarted.

Stage when the receipt was written: the widget implementation and the first handoff were already on the remote branch at `8da4d3292a4d00afe2f57598043b2ff6f8164a21`, tree `480a7882210ea266ac9b584b10ba92b2dc11131d`. Root then added task revision `3eddc72ade423afa1dd5109f3bbd625014495f7e` on the same branch. This receipt commit is rebased onto that revision and does not replace it. `origin/main` `7d52da97efc1f40fbea5c07d978c2e81e6b76659`, merge-base that commit, behind 0. No check was abandoned. The receipt commit’s own SHA is recorded in the PR body after push.

Capability blocker: the delivered product screenshot is the provider outage page, not a missing certificate exception. This session’s Playwright Chromium loaded the official widget, images and offer titles. `allow-same-origin` was not added. Root’s `net::ERR_CERT_AUTHORITY_INVALID` note stays outside this implementation.

## Analyzer on this host

The local proof runs on `127.0.0.1`. That is an IPv4 hostname. Root’s source finding says the official Analyzer skips initialization on localhost, every IPv4 hostname, and hostnames containing `getyourguide`. This session did not invent another hostname and did not use the branch alias, which contains `getyourguide` and currently answers with Vercel SSO.

Observed on the opaque embed document, three ticks about two seconds apart, after the Lisbon offers were visible:

- The document contains the Analyzer script. The browser requested `/dist/pa.umd.production.min.js` once per shown destination.
- `gygPAStatus` stayed `loading` on every tick. That is not initialization success. `ok` was not observed.
- `sessionStorage` throws `SecurityError` because the document is sandboxed without `allow-same-origin`. The same throw occurs in the provider frame.
- `pageerror` and `unhandledrejection` lists were empty on these ticks. No uncaught `getVisitorId` exception was observed here. That does not clear the eligible-host risk, because this hostname is one the Analyzer skips.
- Five requests went to `collector.getyourguide.com`. This is not a zero-telemetry result. The private canary was not in those request URLs.

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

`npx tsc -p tsconfig.json --noEmit` passed after the height message. `npm run build` and the hygiene scripts were last run before that message and passed then, including `ƒ /embed/getyourguide`. They were not repeated after it. ESLint on the changed widget paths had no remaining findings after an earlier unused-import removal and was not repeated for this message.

Public proof: `node --import tsx scripts/getyourguide-manual-widget-integration-1/run.ts`

Latest run exit 1 because the landed bodies were the provider outage, not because the widget failed to draw. Offer grids for Lisbon, Crete and Portugal showed images and titles. `anbieterVorKlick` was 0. Hosts after load: `widget.getyourguide.com`, `cdn.getyourguide.com`, `collector.getyourguide.com`. The latest proof recorded 9 collector requests. That is telemetry. It is not a claim of zero tracking, and the private canary was not in those URLs.

Root’s San Blas card click opened `/s/?q=San Blas Panama`, H1 “San Blas Panama”, 62 results, `partner_id=2MQHT6Z`. All three of those anchors were the search route. Lisbon, Crete and Portugal cards on this branch use the same route shape: `/s/?et=…&q=Lissabon+Portugal`, `q=Kreta+Griechenland`, and `q=Portugal`, each with `partner_id=2MQHT6Z`. They do not behave as a different product-detail destination. The latest click of each first card kept the partner id and rendered title “GetYourGuide – Error” with no H1. Ray IDs: `a50d22a04b76bdc9`, `a50d238deafabdc9`, `a50d24757dc9bdc9`. That outage is not relabeled as a search list or as V1 section 9.3. An earlier Lisbon body in this session showed the Arrábida/Sesimbra tour; that image was overwritten. See-all links (`lissabon-l42`, `santorin-l753`, `sintra-l99`) were not used as the card proof.

At 375×812 the stacked Lisbon anchors ended at 354, 724 and 1094. A fixed 640px outer iframe clipped the second and third cards while the provider frame was about 1171px. The embed document now reports its height with the bounded message above. The parent set the outer iframe to 1187px. The `overflow-y: hidden` ancestor was 1791px and did not cut the iframe (`ragtUnten` false, `ragtSeitlich` false). The provider frame’s own client and scroll height were both 1203px, so the third card fit inside it. Embed scroll 1219 versus client 1187 left about 32px of the embed document below the outer iframe after the cards already fit. `allow-same-origin` was not added. The script hash is in the active CSP; inactive responses still have no script.

Crete’s visible titles included a Santorini day tour plus Gortyna/Phaistos/Matala and Rethymno/Chania. The provider “see all” link for that query pointed at `santorin-l753`. Lisbon’s three cards were Portugal day tours, not a hand-picked Lisbon catalog. That is the provider’s answer to `Lissabon Portugal`. A separate live region widget was not loaded. Region versus city is covered by the unit tests (Bangkok, Alentejo).

## Not done

`ACTIVE_WORK_STATUS.md` is outside the allowlist and was not updated. `scripts/getyourguide-visual-discovery-1/` was not rewritten and will not pass if run against this open path. No candidate CI/Preview was waited on for this head. No actual-main acceptance. No purchase, commission claim, secret, or provider inquiry.
