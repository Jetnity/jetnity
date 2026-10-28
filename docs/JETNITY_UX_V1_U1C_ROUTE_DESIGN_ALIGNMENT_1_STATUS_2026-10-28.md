# Jetnity UX V1 U1-C Route Design Alignment 1 — STATUS

28 October 2026. **R1–R5 correction delivered. STOP for a new independent exact-head review.** This is not FINAL PASS, Ready, or merge.

## Review taken over

Comment https://github.com/Jetnity/jetnity/pull/1082#issuecomment-6478861951 on `b21d0c1bb8607d585c9770884380a54ac84b5e0c`. Five corrections:

1. R1 — geometry test still demanded 22 simultaneous day buttons.
2. R2 — unknown connection state was shown as no saved connection.
3. R3 — accessible day names dropped the visible day title.
4. R4 — “Kante / Zieleappe” and visitor-facing “Kennung”.
5. R5 — real TripWorkspace coverage for connections, history, repeats, invalidation and narrow keyboard focus.

Amendment 2 was committed before these runtime edits: `73d372de26dde2f730d324c0a9eeb06adeb7afe7`.

## Session

- URL: https://cursor.com/agents/bc-4904589f-a8f0-4106-a65a-507bc53e084a
- `bcId`: `bc-4904589f-a8f0-4106-a65a-507bc53e084a`
- Read-back name: `Jetnity UX V1 Route Design Alignment 1 — Cursor Generation 1`
- `originalModelName`: `grok-4.7-high-fast`

## Git

| Fact | Value |
| --- | --- |
| Reviewed head | `b21d0c1bb8607d585c9770884380a54ac84b5e0c` |
| `origin/main` | `8fc72a18390af1650d6902fb2a20a64e4f7f8ccc` |
| Correction head | the commit that adds this status. The PR comment records its SHA and tree. |

## Checks for this correction

- Route unit tests, including unknown versus open connection copy: pass.
- Full `lib/trips/ux-u1a2-geometry-1.test.ts`: pass. Sticky scroll, one nav, history/focus and no-provider checks remain. All 22 day ids are reached through the run rows. The long scroll content stays the day-1 note. The DejaVu/safe-area case passed in this Chrome session and was not weakened.
- Mounted real TripWorkspace contract test: pass. Connection click, Zur Route, reload, back/forward, repeated names, ambiguous A→B→A→B, unknown ferry-plus-flight, outbound and return URLs, stage removal, day removal, pending editor text, and 390px Enter focus on the visible Zur Route. No fetch/XHR. This is not a VoiceOver pass.
- U1-B mounted browser suite: pass after the narrow focus move.
- `tsc --noEmit`: pass. Lint on touched files: 0 errors. Pre-existing effect warnings remain.

Native CI and Preview belong to the pushed correction head and are recorded in the PR comment after the push. Preview READY is not browser acceptance.

## Still outside

#1067, #1068, F01, provider gates, and the 44-day duration triage. No Ready, merge, deploy, or follow-up.
