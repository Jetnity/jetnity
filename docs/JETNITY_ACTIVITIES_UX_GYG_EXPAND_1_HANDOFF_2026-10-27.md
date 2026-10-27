# Activities UX and official GetYourGuide expanded offers 1 — HANDOFF

Date: 27 October 2026. Writer: Jetnity Activities UX and GetYourGuide Expanded Offers 1 — Cursor Generation 1. Same session as the implementation. Draft PR #1043. Issue #1042. Parent #1023.

## Runtime receipt

cursor-cloud `run-info`: `originalModelName` `grok-4.7-high-fast`, source `scm`, name Jetnity Activities UX and GetYourGuide Expanded Offers 1 — Cursor Generation 1. Session `bc-e917b7cb-fdc2-43ca-9dcd-53a537538210`, https://cursor.com/agents/bc-e917b7cb-fdc2-43ca-9dcd-53a537538210. This file cannot name its own tip SHA. The PR body after the push has `git rev-parse HEAD` and `git rev-parse HEAD^{tree}`.

## Baseline

Fetched `origin/main` during this session: `b5e0532c810df8d89749fb0a35380a081f765cab`, tree `f56b72f4c49666fd187cd08c04d6c91216d497a4`. Merge-base is that commit. The branch was 0 behind. Seed-only parent of the implementation is `3c0fc3593d0f6fc22b50832b8d3827d29cb37291`. Mode in `.jetnity/operating-mode.json` is `NORMAL`. No main drift.

## What changed

F1, separately identifiable: `lib/activities/zustand.ts` now returns `ACTIVITY_TAG_UNVERFUEGBAR` for the production hard-off visitor sentence. `nativeAktivitaetsAnzeige` hides coverage and uses `Suche erneut prüfen` only when the finished status is `unavailable`. The search payload can still carry `ACTIVITY_ABDECKUNGSHINWEIS` because `client-sicht.ts` is outside the allowlist. The unavailable view does not render it. Mounted proof: `scripts/activities-ux-gyg-expand-1/nativ.ts` exited 0. Two unavailable searches, then ok, partial, empty and error. No iframe. No off-origin request. The private wish was not in the POST. At 32px root text the retry button measured 324×88.

GetYourGuide: server allowlist 12 and 24 in `suchparameterLesen`. Missing `anzahl` defaults to 12. Unknown, duplicate, empty and non-integers are rejected and do not load the Analyzer. `GetYourGuideAktivitaeten` passes the count only into `renderer.laden`. The primary button calls `anzeigen()` with no click event. `Mehr Aktivitäten anzeigen` and `Weniger anzeigen` request 24 and 12. Context change resets the count to 12 without reading a ref during render. Lifecycle identity is unchanged.

Height: `GYG_HOEHE_MAX` is 12000 in the child script and in `gygHoeheAnnehmen`. Hash `sha256-poQQU/MYBLZP2WRKZarx+V+rBn+1QuHFgUwrd5VZC+E=`. The first probe, still at 2400, clipped Portugal/Kreta 12 (raw 4685) and Bangkok requested-24 (raw 7744, 20 cards) because the parent kept `40rem`. After the cap move, the same probe on the final component matched parent client height to the loader style and `geclippt` was false. Weniger went 7744 → 4685. No `scrollHeight`.

`scripts/getyourguide-manual-widget-integration-1/hoehe.ts` still posts 2401 and was not edited. It is not part of `npm test`. It no longer describes this cap. `DECISIONS.md` still says the height channel accepts 1 to 2400. That file is outside the allowlist.

## Real offers, author browser only

Command: `node --import tsx scripts/activities-ux-gyg-expand-1/angebote.ts`. Exit 0 on the final component. Playwright Chromium, not a personal browser.

- Direct `GET` without iframe fetch metadata: 200, body has no `widget.getyourguide.com` script and no `2MQHT6Z`.
- Foreign requests before keyboard Enter on `Bei GetYourGuide anzeigen`: 0.
- Canary leaks: none.
- Bangkok 12: 12 distinct `et` anchors, 12 images, `number-of-items=12`, 1421px equals parent.
- Mehr: `number-of-items=24`, 20 distinct anchors, 20 images, 7744px equals parent. Not 24 cards.
- Weniger: 12 anchors, 4685px equals parent.
- Portugal with no days, land mode: 12 anchors, 4685px.
- Kreta island: 12 anchors, 4685px.
- Sandbox `allow-scripts allow-popups allow-popups-to-escape-sandbox`. No `allow-same-origin`.
- Partner only on `[data-gyg-partner-id]` in the embed document.
- Responses from `widget.getyourguide.com` and `cdn.getyourguide.com`. No 403.
- Viewports captured: 320, 390, 768, 1440, and 390 at 32px root text. Screenshot pixel sizes included 390×7745 for the expanded Bangkok frame and 390×4685 for Portugal and Kreta.

Card counting is QA-only. It is not a runtime catalogue. Bangkok and Panama are not a product allowlist. This probe used Bangkok, Portugal and Kreta as public examples.

`zyklus.ts` exited 0: 12 then 24 then 12, abort of the previous frame, late resolve does not reattach, remove clears the frame, two instances do not clobber each other, zero foreign requests.

## Commands

Node v22.23.4.

- `npm run typecheck` exit 0
- `npm run lint` exit 0, 0 errors, 177 warnings. The new widget count path is not one of them. `AktivitaetenBereich.tsx:161` remains the pre-existing effect warning.
- `npm run check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug` exit 0
- Focused `node --import ./scripts/server-only-test-register.mjs --import tsx --test` on zustand, suche, dokument, flaeche, lebenszyklus, widget, grenze: 32 pass, 0 fail
- `npm test`: 7368 tests, 7352 pass, 11 fail, 5 skipped, duration 123940.927744ms. All 11 failures are `spawnSync /usr/lib/postgresql/16/bin/initdb ENOENT` in Official Truth / throwaway PostgreSQL proofs. No activity test failed. PostgreSQL 16 is not installed on this machine. CI is not claimed.
- `npm run build` exit 0

## Untouched

No database, Auth, RLS, migration, provider factory, Viator, payment, secret, contract, new infrastructure cost, or indexing change. Native hard-off still returns `aktiv: false` for production. Analyzer script and the known `sessionStorage` P2 are unchanged. #1023 V5 / #1040 V1 §9.3 product-detail links were not closed and no purchase was made. #917 and #985 holds were not touched. USD 100/month budget unchanged.

## R1 on the reviewed head

Reviewed head `a8f5081c294eb6107be98c537e32fb0b1b1741bb`, tree `db2dedc5c9d9357bbc2e577d7c13aa026a49b0d8`. Root R1 is CHANGES REQUIRED, review `5668256113`. This continuation is the same session `bc-e917b7cb-fdc2-43ca-9dcd-53a537538210`. No Generation 2. No runtime change.

CI run `40509190598` attempt 1 was CANCELLED at the job limit. Root had queued one unchanged App retry. Neither result gates the corrected head. Workflows and timeouts were not edited. This handoff does not claim CI PASS or a new Preview.

### R1-F1 click

`angebote.ts` clicks one `a[href*="et="]` in the stable 12 view and one in the stable expanded view, then closes the popup. No reload, no checkout.

Both targets were the first card, `et=552815`. The popup URL path is `/s/` on `www.getyourguide.com`, with `partner_id=2MQHT6Z`, `cmp=jetnity_activities`, `locale=de-CH` and `q=Bangkok+Thailand`. That shape is a search URL, not a product-detail path. The document status was 403. Title `GetYourGuide – Error`. Body begins “An error occurred.” Ray IDs `a5123f9d9ba7a5f3` (12) and `a51240cc4845a5f3` (expanded). Host `www.getyourguide.com` path `/s/` appears in the response log twice with status 403. Provider BLOCKED for this landing. Widget card loading itself was not 403. #1023 V5 / TASK V1 §9.3 stay open.

### R1-F2 expanded frame

Stability now requires the loader pixel height and the parent client height to match for four samples after each viewport change.

| Viewport | Cards | Last card bottom | Frame px | Horizontal overflow | Ancestor clips |
| --- | --- | --- | --- | --- | --- |
| 320×700 | 20 | 6904 | 6956 | no | no, overflow visible |
| 390×844 | 20 | 7692 | 7744 | no | no |
| 390, root 32px | 20 | 7692 | 7744 | no | no |
| After Weniger, 390 | 12 | 4633 | 4685 | no | no, one iframe |
| After Entfernen | 0 | — | no iframe | — | — |

320 did not keep the 390 height. 6956 and 7744 are both under 12000. Screenshots: `bangkok-24-320.png` is 320×6957, `bangkok-24-390.png` is 390×7745, `bangkok-24-390-200.png` is 390×7744.

### R1-F3

`DECISIONS.md` gains ADR-0223 only. ADR-0222 was not edited.

## Stop

Do not mark Ready. Do not merge. Do not start a follow-up slice. Root owns exact-head PASS, Ready, merge, and actual-main acceptance. Preview for this head did not exist at authoring.
