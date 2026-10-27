# Activities UX and official GetYourGuide expanded offers 1 — STATUS

Date: 27 October 2026. Draft PR #1043. Branch `feat/r108-activities-ux-gyg-expand-1`. Not Ready. Not merged.

## F1

Implemented and mounted. Native `unavailable` uses the day-search sentence, hides the available-offers coverage note, and offers `Suche erneut prüfen`. Success, partial, empty and error still show the coverage note and `Erneut suchen`. Production hard-off is unchanged. The mounted search created no iframe and no off-origin request.

## GetYourGuide

The manual widget requests 12 after the existing load, and 24 only after `Mehr Aktivitäten anzeigen`. A fresh probe on the final component, keyboard-activated:

| Target | Request | Distinct cards | Images | Loader px | Parent px | Clipped |
| --- | --- | --- | --- | --- | --- | --- |
| Bangkok city | 12 | 12 | 12 | 1421 | 1421 | no |
| Bangkok city | 24 | 20 | 20 | 7744 | 7744 | no |
| Bangkok after Weniger | 12 | 12 | 12 | 4685 | 4685 | no |
| Portugal country | 12 | 12 | 12 | 4685 | 4685 | no |
| Kreta island | 12 | 12 | 12 | 4685 | 4685 | no |

Requesting 24 is supported. Bangkok returned 20 distinct offers, not 24. The UI does not claim a hidden remainder. Direct open returned 200 with no widget script and no partner. Before the first load, foreign requests were 0. Canary `private-canary-ux-gyg-expand-1` was absent. Partner `2MQHT6Z` was in the child document only. Sandbox remained `allow-scripts allow-popups allow-popups-to-escape-sandbox`. No HTTP 403. Hosts seen: `widget.getyourguide.com`, `cdn.getyourguide.com`.

Height cap is 12000 on both sides. CSP hash `sha256-poQQU/MYBLZP2WRKZarx+V+rBn+1QuHFgUwrd5VZC+E=`. Weniger shrank 7744px to 4685px, so the parent does not keep a maximum. The script still does not read `scrollHeight`.

## Gates on this machine

Node v22.23.4. `npm run typecheck` 0. `npm run lint` 0 errors, 177 pre-existing warnings. `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug` all 0. Focused activity/widget tests 32 pass. Full `npm test`: 7368 tests, 7352 pass, 11 fail, 5 skipped. Every failure is `spawnSync /usr/lib/postgresql/16/bin/initdb ENOENT`. None are activity tests. `npm run build` 0.

Mounted harnesses `nativ.ts`, `zyklus.ts` and `angebote.ts` exited 0 on the final tree.

## R1 corrections

Root R1 on `a8f5081c` required three additions. Product runtime was not changed.

The same public probe now clicks the first offer in the 12 view and the first offer in the expanded view. Both popups land on `https://www.getyourguide.com/s/` with `partner_id=2MQHT6Z`, `cmp=jetnity_activities`, `et=552815` and `q=Bangkok Thailand`. Both document responses are HTTP 403, title “GetYourGuide – Error”, Ray `a5123f9d9ba7a5f3` and `a51240cc4845a5f3`. That is provider BLOCKED for the landing page. It is not a product-detail pass and not a local regression. §9.3 stays open. No retry and no sandbox change.

After the 24 request, the frame was remeasured only once loader and parent height matched. At 320px: 20 cards, last card bottom 6904, frame 6956, no horizontal overflow, ancestor `visible/visible`, iframe does not extend past the section. At 390px: last bottom 7692, frame 7744, same clipping result. At 390px with 32px root text: still 20 cards and 7744. Weniger returned one 12-card frame at 4685, last bottom 4633. Entfernen left zero iframes.

ADR-0223 is appended. ADR-0222’s text is unchanged.

## Still open for the Technical Lead

Independent exact-head review. Preview and CI on the pushed head are not claimed here. Product-detail links remain the open #1023 / #1040 item. Analyzer `sessionStorage` P2 is unchanged. `DECISIONS.md` still describes the old 1–2400 height bound and was left untouched because it is outside this task’s allowlist.
