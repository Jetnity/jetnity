# V1 Visual UX & Device Audit 1 — Status

Stand: 21. September 2026  
Status: **EVIDENCE + REVIEW-TRANSPORT WRITTEN / DRAFT / NOT READY / NOT MERGED / STOP FOR TECHNICAL-LEAD VISUAL/PRODUCT REVIEW**

## Arbeitsblock / Ziel

Screenshot-backed visual/product/device audit of the visitor → search/planning → guest Trip Workspace journey. Evidence only.

## Branch / PR / heads

| Item | Value |
| --- | --- |
| Branch | `audit/v1-visual-ux-device-audit-1` |
| Issue | #505 |
| Draft PR | #506 |
| Product baseline (UI) | `9f386d10816d7adcdaf2fcd6d3732e64f952fb50` |
| Dispatch / seed | `e83f13dcea3f22a5f779159cd6ceff30422db750` |
| Agent | Jetnity V1 visual UX device audit 1, Generation 1 |
| Model | Cursor Grok 4.6 High Fast (`cursor-grok-4.6-high-fast`) — no Auto |
| Session | `bc-89494e60-e648-4519-bb84-0213d85bb04f` |

Previous freeze (first evidence persist): `c8d30e9f165cddcaf17fe330dfe916be002572e6`.  
This transport amendment produces a new audit-doc HEAD. Exact SHA + CI/Preview IDs belong in the **new** PR comment only. Do not treat `c8d30e9f` or `/opt/cursor/artifacts` as the current freeze.

Original rendered product SHA remains `9f386d10816d7adcdaf2fcd6d3732e64f952fb50`. Screens were **not** recaptured.

## Live-main drift (reported, not recaptured)

At first persist, `origin/main` = `c7fb9f0f693ba9f020add7b26a041263aa7e3b07` (#494). TL later recorded continuity #512 merged at `d3d42047ba247ded8d6c584e447db1573b80f19a` (docs/descriptive metadata only). Live-main SHA at this transport persist is re-read before the freeze comment.

- **No `app/`, `components/`, or `styles/`** in the known post-baseline main commits. Visual screens remain bound to product SHA `9f386d10`, not relabelled as later main.
- #494 remains **merged**. This writer did not touch, rebase, comment-dispatch or restart it. Sibling #509 / #510 were not edited.

## Bereits umgesetzt

- Real browser verified (Chrome 148 + Playwright viewports)  
- Site inventory + deep guest journey  
- 66 non-sensitive PNGs + manifest + layout measures (unchanged)  
- Reused `scripts/mobile-accessibility-1-audit.mjs`: 21/21 OK  
- REPORT / first STATUS / HANDOFF / SELF_REVIEW  
- **Transport amendment:** 8 JPEG review copies + `.base64.txt` (76-char lines) + `review-transport.json` under `docs/evidence/v1-visual-ux-device-audit-1/`. Original PNG SHA-256 values verified identical to `c8d30e9f`. One recorded size exception: `home_initial_1024.jpg` 720×540 Q=32 / 27892 B so VUX-8 truncation stays readable. GitHub user-image attachment **not** produced (no existing portable upload tool / no new credentials).

## Offen

- Technical-Lead visual/product review of the **original PNGs** (or these review copies if PNG transport remains blocked)  
- Exact-head CI / Vercel readback in the **transport freeze PR comment**  
- Account/Admin interiors still BLOCKED_ACCESS  
- Real-device / Safari untested  

## Tests / CI / Preview

| Check | Result |
| --- | --- |
| Playwright evidence capture | 61 systematic + 5 recapture screens; 0 HTML/body overflow |
| `scripts/mobile-accessibility-1-audit.mjs` | 21/21 OK, `fehlerzahl: 0`, reused existing `:3000` |
| `scripts/trip-workspace-ui-audit.mjs` | **SKIPPED** — needs `JETNITY_UI_AUDIT` and a separate harness server; not enabled on the audited product process |
| Production build / lint / unit suite | **NOT RUN** — no product change |
| CI / Vercel on freeze head | **pending readback in PR comment** |

## Sicherheit / Kosten

- No secrets, no accounts, no paid provider/model calls, no DB writes  
- Intercepted `/api/{flights,hotels,activities,mobility,rental-cars}/search` and evaluate/readiness routes  
- Public repo: fixtures are synthetic (Bali/Zürich/Singapur, no real names/emails/MRZ)

## Next step

**ChatGPT Technical Lead** inspects the screens and decides 0–3 bounded repair tasks. Cursor does not Ready, merge, or start a follow-up.
