# Jetnity UX V1 U1-C Route Design Alignment 1 — STATUS

28 October 2026. **Implementation delivered. STOP for independent exact-head review.** This is not FINAL PASS, Ready, or merge.

## Session

Re-read from `cursor-cloud` `run-info` after the exact rename in this same session.

- URL: https://cursor.com/agents/bc-4904589f-a8f0-4106-a65a-507bc53e084a
- `bcId`: `bc-4904589f-a8f0-4106-a65a-507bc53e084a`
- Read-back name: `Jetnity UX V1 Route Design Alignment 1 — Cursor Generation 1`
- `originalModelName`: `grok-4.7-high-fast`
- Earlier read-back `UX V1 U1-C Route Design Alignment 1 — Cursor Generation 1` was corrected. Technical Lead treats the model string as author-reported run-info, not an independent TL query.

## Git

| Fact | Value |
| --- | --- |
| Amendment read before edits | `97c4ad9afdaa5a215722f89556d6163f02b2f981` |
| Accepted plan | `57f3207f28375ed0d96259592c37f265e5d2f1df` |
| `origin/main` and merge-base | `8fc72a18390af1650d6902fb2a20a64e4f7f8ccc` |
| Main tree | `24770e02bd176f06040ccaf515783534ca5c83e6` |
| Mode | `NORMAL` |
| Review head | the commit that adds this status. The PR comment records its SHA. |

## What landed

The Reiseplan route is one chronological row per N12 run. The selected run opens a wrapping day chooser. Repeated visits stay on day and stage ids. Unassigned boundary dates stay unassigned. Planned-day text lists real contiguous ranges and says when dates are missing, duplicated, or not continuous. Country text uses the stored code’s name, with no flag. Internal `connection:` rows appear only between adjacent destination runs. The same edge id at more than one boundary is not selectable. An unknown or removed `kante` stays in the URL and shows an unavailable message without choosing another visit. Discard and delete sit in `Reiseoptionen`; confirmations and storage calls are unchanged. Back-to-top uses the live `--ux-u1a-nav-offset` when the bottom nav is fixed, and hides when that height is missing.

## Checks in this session

- Route, workspace-mode, chronology source, premium-plan source, and mobile-accessibility unit tests: pass.
- Mounted N12 chronology browser tests, including root font 32px: pass. Chrome `148.0.7778.96`.
- Mounted U1-B route/detail browser tests: pass after the route-row focus updates. One scroll assertion now allows 48px because revealing the focused run moved the restored position by about 35px; a jump to the top still fails.
- Evidence browser test: pass. At 390×844, root 16px, scrolled route, the Back-to-top box did not intersect `[data-shell-nav="bottom"]`, and `elementFromPoint` hit the button and the nav separately.
- `tsc --noEmit`: pass. `npm run build`: pass (Next.js 16.4.1). Lint on touched files: 0 errors. Pre-existing effect warnings remain. `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`, `check:operating-mode`: pass. Schema check still lists the same pre-existing LOCAL/UNAPPLIED RPCs.
- Browser zoom, physical Safari, and VoiceOver: not run. Root 32px is root font size, not zoom.

## Still outside this slice

#1067 broader acceptance, #1068 organizer context, F01 travel roles, provider gates, and the 44-day stage-duration triage. No Ready, merge, deploy, or follow-up.
