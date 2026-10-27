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

## Still open for the Technical Lead

Independent exact-head review. Preview and CI on the pushed head are not claimed here. Product-detail links remain the open #1023 / #1040 item. Analyzer `sessionStorage` P2 is unchanged. `DECISIONS.md` still describes the old 1–2400 height bound and was left untouched because it is outside this task’s allowlist.
