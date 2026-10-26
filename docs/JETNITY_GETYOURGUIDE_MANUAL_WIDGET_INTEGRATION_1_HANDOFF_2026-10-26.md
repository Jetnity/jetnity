# GetYourGuide Manual Widget Integration 1 — HANDOFF

Date: 26 October 2026.
Exact writer: Jetnity GetYourGuide Manual Widget Integration 1 — Cursor Generation 1.

## Runtime receipt

Re-read at this reporting point from cursor-cloud `run-info`. Field `originalModelName`: `grok-4.7-high-fast`. Run `source`: `scm`. Session `bc-a2ac7c66-900d-4ad0-9fd1-dfe692d10f50`, https://cursor.com/agents/bc-a2ac7c66-900d-4ad0-9fd1-dfe692d10f50. The same logical name is the run `name`. This is the original Generation 1 session. It was not restarted.

Stage when the receipt was written: the widget implementation and the first handoff were already on the remote branch at `8da4d3292a4d00afe2f57598043b2ff6f8164a21`, tree `480a7882210ea266ac9b584b10ba92b2dc11131d`. Root then added task revision `3eddc72ade423afa1dd5109f3bbd625014495f7e` on the same branch. This receipt commit is rebased onto that revision and does not replace it. `origin/main` `7d52da97efc1f40fbea5c07d978c2e81e6b76659`, merge-base that commit, behind 0. No check was abandoned. The receipt commit’s own SHA is recorded in the PR body after push.

Capability blocker: the delivered product screenshot is the provider outage page, not a missing certificate exception. This session’s Playwright Chromium loaded the official widget, images and offer titles. `allow-same-origin` was not added. Root’s `net::ERR_CERT_AUTHORITY_INVALID` note stays outside this implementation.

Branch: `feat/getyourguide-manual-widget-integration-1`
Draft PR: #1041
Tracking: #1040
Parent: #1023 V5
Immutable TASK blob: `7c7b442fafaa0f20ceb641d0a335d564224d7120`
Task seed: `36837100ea710a6514321be518c32b0f7680a531`, tree `3f87860285a68e56e66cc4b9bad32fd05334cafb`, sole parent `7d52da97efc1f40fbea5c07d978c2e81e6b76659`.

Implementation commit: `b2ae807ffd9e5331154a24bb469e1d480595857b`. First handoff commit: `8da4d3292a4d00afe2f57598043b2ff6f8164a21`. Root task revision: `3eddc72ade423afa1dd5109f3bbd625014495f7e`. The review head is the tip after this receipt commit. This file cannot name that tip’s own SHA. Fresh `origin/main`: `7d52da97efc1f40fbea5c07d978c2e81e6b76659`, tree `608321f4a8813adf1de23c3132039d39f9c27e98`. Merge-base: that same commit. Behind: 0.

This is not a Root PASS. Do not mark Ready. Do not merge. Do not start a follow-up slice.

## What the next reviewer has

An explicit load path for the documented manual activities widget. `data-gyg-q` is built from the confirmed public name and `landName(code, 'de')`. A country with no days uses only the country label. Place type stays in the Jetnity context key and is not sent as a provider parameter. The empty identifier map is not consulted. Partner `2MQHT6Z`, campaign `jetnity_activities`, locale `de-CH` and three items are fixed. The brand link is `https://www.getyourguide.com/`.

The child document is `GET /embed/getyourguide`. It has no session and no database read. Fetch Metadata must be iframe / navigate / same-origin or the response is the inactive sentence and contains no Analyzer. Sandbox is `allow-scripts allow-popups allow-popups-to-escape-sandbox` with no `allow-same-origin`, also in the response CSP. The iframe is `credentialless` and `referrerPolicy=no-referrer`. Invalid, duplicate, oversized and unexpected query keys return 400 and do not load the Analyzer.

Native activity search, cards and adoption are untouched. An invalid day still does not fall back to the first day for GetYourGuide. Unknown or conflicting countries stay unresolved. Removal and context change drop the document and reject a late completion.

## Evidence

Focused command, Node v22.23.4:

`node --import ./scripts/server-only-test-register.mjs --import tsx --test lib/activities/getyourguide/*.test.ts`

Result after the `credentialless` change: 41 tests, 8 suites, 41 pass, 0 fail.

Full `npm test` on this code, Node v22.23.4, duration about 101s: 7366 tests, 886 suites, 7350 pass, 11 fail, 5 skipped, exit 1. Every recorded failure is `spawnSync /usr/lib/postgresql/16/bin/initdb ENOENT`. PostgreSQL 16 is not installed in this environment. Those 11 failures are not GetYourGuide assertions and were not converted into passes.

`npm run typecheck` passed. `npm run build` passed and listed `ƒ /embed/getyourguide`. Hygiene passed: `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug` (existing LOCAL/UNAPPLIED RPC notes only). ESLint on the changed widget paths reported no remaining findings after removing an unused import.

Public proof: `node --import tsx scripts/getyourguide-manual-widget-integration-1/run.ts`

Final run exit 1. Offer grids for Lisbon, Crete and Portugal showed images and titles. `anbieterVorKlick` was 0. Hosts after load: `widget.getyourguide.com`, `cdn.getyourguide.com`, `collector.getyourguide.com`. Offer anchors settled inside the provider viewport (bottom 447, client 495). The outer iframe is 640px and did not extend past its ancestor horizontally. No height postMessage was added. The click opened the `et=935537` URL with `partner_id=2MQHT6Z`. The landed body on that final run was the provider outage, Ray ID `a50cf48ddecf22ce`. An earlier run in this same session showed the Arrábida/Sesimbra tour on that URL; that screenshot was overwritten by the outage capture. City and branding links were not used as the product proof.

Crete’s visible titles included a Santorini day tour plus Gortyna/Phaistos/Matala and Rethymno/Chania. The provider “see all” link for that query pointed at `santorin-l753`. Lisbon’s three cards were Portugal day tours, not a hand-picked Lisbon catalog. That is the provider’s answer to `Lissabon Portugal`. A separate live region widget was not loaded. Region versus city is covered by the unit tests (Bangkok, Alentejo).

## Not done

`ACTIVE_WORK_STATUS.md` is outside the allowlist and was not updated. `scripts/getyourguide-visual-discovery-1/` was not rewritten and will not pass if run against this open path. No candidate CI/Preview was waited on for this head. No actual-main acceptance. No purchase, commission claim, secret, or provider inquiry.
