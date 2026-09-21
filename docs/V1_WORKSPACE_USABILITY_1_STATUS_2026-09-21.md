# V1 Workspace Usability 1 — Status

Stand: 21. September 2026  
Status: **FROZEN FOR INDEPENDENT TL REVIEW / DRAFT / NOT READY / NOT MERGED / AUTHOR SELF-REVIEW ONLY**

## Arbeitsblock / Ziel

Bounded workspace presentation/navigation repair after accepted visual audit #506 (FINAL **5269760171**, post-merge **5764730610**). Implemented VUX-1, VUX-2, and VUX-4 after instrumented reproduction.

## Branch / PR / heads

| Item | Value |
| --- | --- |
| Branch | `fix/v1-workspace-usability-1` |
| Issue | #513 |
| Draft PR | #516 |
| Assigned baseline | `main@19a91a2594127eb2b6104b68da69786194e13865` |
| Dispatch / seed | `efacfc9e31d23ce4429e9bf5a7c004a3b70ff591` |
| Agent | **Jetnity V1 workspace usability 1**, Generation 1 |
| Model | Cursor Grok 4.6 High Fast (`cursor-grok-4.6-high-fast`) — no Auto |
| Session | `bc-8a1bf241-3bb4-41f9-8fa1-7f6c5c965bca` |

Exact freeze SHA + CI/Auth/Vercel/thread IDs belong in the freeze PR comment only. After-audit PNG/JSON `sha` fields still record parent `9d3e50b1` because those captures ran on the dirty working tree that already contained the overflow-anchor + detail-snap repair now in this freeze commit.

## Live-main drift (reported, not integrated)

Observed `origin/main` at start: `d3d42047ba247ded8d6c584e447db1573b80f19a` (#512). Assigned PR base remains `19a91a25`. This writer did not rebase or merge main.

## Bereits umgesetzt

- VUX-1 compact first-screen hierarchy at 360/390/1024; 1440/1920 keep the rich header
- VUX-2 localized stage ranges via `etappenZeitraumAnzeigen`; no stored-date mutation
- VUX-4 reproduced (leftover compact `scrollY` + scroll-anchoring after overview hide) and repaired on the open transition only
- Before/after screens + instrumentation under `docs/evidence/v1-workspace-usability-1/`
- Focused tests `lib/trips/datum-anzeige.test.ts` and `lib/trips/workspace-usability-1.test.ts`

## Local gates (author-run, not TL PASS)

| Check | Result |
| --- | --- |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS (0 errors; existing repo warnings) |
| `npm test` | PASS 3535/3535 |
| focused date/workspace/detail/timeline/overview | PASS 96/96 |
| `check:dead` / `exports` / `deps` / `api-schutz` / `schema-bezug` / `operating-mode` | PASS |
| `npm run build` | PASS |
| `scripts/mobile-accessibility-1-audit.mjs` | 21/21 OK, `fehlerzahl: 0` |
| `scripts/v1-workspace-usability-1-audit.mjs` after | Übersicht + first Jetzt-wichtig control in 390×844; VUX-4 heading+back in view |

## Sicherheit / Kosten

- No secrets, accounts, paid provider/model calls, DB writes, Auth, or deployment settings
- Provider/model routes intercepted as `unavailable` and labelled simulated
- Guest discard still uses `window.confirm`; storage files not written

## Next step

**ChatGPT / Technical Lead** performs independent exact-head code + visual/interaction review. Cursor does not Ready, merge, or start a follow-up.
