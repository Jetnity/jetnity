# V1 Workspace Usability 1 — Status

Stand: 21. September 2026  
Status: **REVIEW-FIX FROZEN FOR INDEPENDENT TL REVIEW / DRAFT / NOT READY / NOT MERGED / AUTHOR SELF-REVIEW ONLY**

## Arbeitsblock / Ziel

Same-session bounded review fixes for TL CHANGES REQUIRED on `4b5f34f9fc0ca3501f3bf3ca850f71f157764229`: VUX-R1 and VUX-R2 only. Accepted VUX-1 hierarchy and first-open VUX-4 repair preserved.

## Branch / PR / heads

| Item | Value |
| --- | --- |
| Branch | `fix/v1-workspace-usability-1` |
| Issue | #513 |
| Draft PR | #516 |
| Assigned baseline | `main@19a91a2594127eb2b6104b68da69786194e13865` |
| Prior freeze (invalidated by this head) | `4b5f34f9fc0ca3501f3bf3ca850f71f157764229` |
| Agent | **Jetnity V1 workspace usability 1**, Generation 1 |
| Model | Cursor Grok 4.6 High Fast (`cursor-grok-4.6-high-fast`) — no Auto |
| Session | `bc-8a1bf241-3bb4-41f9-8fa1-7f6c5c965bca` |

Exact new freeze SHA + CI/Auth/Vercel/thread IDs belong in the freeze PR comment only. R2 capture `sha` fields still record parent `4b5f34f9` because the harness ran on the dirty working tree that already contained these review fixes.

## Live-main drift (reported, not integrated)

Re-read `origin/main` on 21 September 2026: `66af15397c1bb4e73d8e4012080bb04b7389147d` (Merge #517 guest-draft adoption). Earlier observed `d3d42047` (#512). Assigned PR base remains `19a91a25`. This writer did not rebase or merge main.

## Review findings

| ID | Disposition |
| --- | --- |
| VUX-R1 | **Fixed.** `tagLesen` now requires a UTC calendar round-trip. `2026-02-29` / `2026-02-30` / `2026-04-31` stay empty. `2024-02-29` stays visible. One valid + one invalid endpoint keeps only the valid side. Stored strings unchanged. `datumKurz` / `zeitraumKurz` untouched. |
| VUX-R2 | **Fixed.** Removed the per-render callback-ref scroll. Stable `detailAnkerRef`. Scroll + cancelled rAF/timeout only on open or compact/desktop transition. Booking-toggle parent update and explicit search after manual scroll: `scrollY` 1038 → 1038 (jump 0; no reset to open 433). Rapid Escape before deferred work returns overview context. |

## Local gates (author-run, not TL PASS)

| Check | Result |
| --- | --- |
| focused date + workspace/detail/timeline/overview tests | PASS 80/80 (includes new impossible-day/leap tests) |
| `tsc --noEmit` | PASS |
| R2 harness | no unsolicited reset; explicit search mounted; rapid-close overview visible |

Full `npm test` / lint / hygiene / build / mobile-a11y remain the prior author-run greens on `4b5f34f9` plus these focused re-runs. Exact-head CI is the gate that counts for the new SHA.

## Sicherheit / Kosten

- No secrets, accounts, paid provider/model calls, DB writes, Auth, or deployment settings
- R2 booking toggle used only synthetic guest localStorage via existing UI
- #514 / #515 files not written

## Next step

**ChatGPT / Technical Lead** performs independent exact-head code + visual/interaction review of the new freeze SHA. Cursor does not Ready, merge, or start a follow-up.
