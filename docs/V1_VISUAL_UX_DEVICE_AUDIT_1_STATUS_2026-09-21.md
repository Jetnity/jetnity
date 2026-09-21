# V1 Visual UX & Device Audit 1 — Status

Stand: 21. September 2026  
Status: **EVIDENCE WRITTEN / DRAFT / NOT READY / NOT MERGED / STOP FOR TECHNICAL-LEAD VISUAL/PRODUCT REVIEW**

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

Audit-doc HEAD after this persist will be recorded in the exact-head PR comment. Do not treat an older comment as the freeze.

## Live-main drift (reported, not recaptured)

At persist time `origin/main` = `c7fb9f0f693ba9f020add7b26a041263aa7e3b07` (`Close V1 Security Event Mutation-Derived Producer Contract 1 (#494)`).

- Ahead of merge-base: this slice’s audit commit(s)  
- Behind: 17 commits, **all #494** (docs + `scripts/db/*` + one `package.json` script)  
- **No `app/`, `components/`, or `styles/` in that diff.** Visual screens of the product UI remain valid. They are not silently “current main” for the harness files.

#494 head `3de1d8e857a383dbf9bfb2e04f37374da552ac4a` is **merged**. This writer did not touch, rebase, comment-dispatch or restart it.

## Bereits umgesetzt

- Real browser verified (Chrome 148 + Playwright viewports)  
- Site inventory + deep guest journey  
- 66 non-sensitive PNGs + manifest + layout measures  
- Reused `scripts/mobile-accessibility-1-audit.mjs`: 21/21 OK  
- In-progress PR comment after first real screens  
- REPORT / this STATUS / HANDOFF / SELF_REVIEW  

## Offen

- Technical-Lead visual/product review of the screens  
- Exact-head CI / Vercel readback in the **final PR comment** (no extra evidence-only commit after freeze)  
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
