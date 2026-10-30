# Jetnity UX V1 U1-C Route Design Alignment 1 — STATUS

30 October 2026, night Europe/Zurich. **R7 delivered. STOP for independent exact-head review.** This is not FINAL PASS, Ready, or merge.

## R7 flow navigation

Technical Lead R7 v1 on Draft PR #1082. The reproduced low-height defect is a P2 usability issue: at 520×290 and 540×300 the optional Nach oben control sat on the next-day center. Same session `bc-4904589f-a8f0-4106-a65a-507bc53e084a`, read-back name `Jetnity UX V1 Route Design Alignment 1 — Cursor Generation 1`, `originalModelName` `grok-4.7-high-fast`.

While the visible mobile navigation is in flow, `.workspace-page` hides `[data-back-to-top]` with `display: none`. The rule sits inside `@media (max-width: 63.999rem)`, the same boundary as the existing 64rem desktop rule, so a hidden desktop copy of the mobile nav does not hide the control. There is no collision observer, no new viewport cutoff, and no change to the day arrows, the timeline, shell flow detection, or storage.

The mounted guest regression uses the synthetic 22-day reference trip in its own browser context and blocks non-loopback requests. A test-only `display: flex !important` restoration makes the next-day center hit Nach oben at both short sizes in light and green. After that restoration is removed, the same center moves day 11 to day 12 and previous restores day 11, without scrolling to the top. 540×720 and 390×844 keep a visible control, working day arrows, clearance above the bottom nav, and a working Nach oben click. The same page goes short, tall, then short again. Root 32px is root font size, not browser zoom; at 390px the control is hidden and cannot take focus. At 1440×290 the hidden mobile nav is in flow and the control stays present.

Reviewed baseline remains `dd66a385b7a0902c5c21e59c7d6948006629c441`. CI run `41109271505` gates that head only. This correction needs its own CI and Preview. Hosted account acceptance stays blocked under #968. This local run is not a physical device, VoiceOver, or true browser zoom.

## R6 test correction

The mounted editor audit now takes the open create or edit form as its locator. It requires the heading, every date and time label, the helper sentence, and Cancel/Save, and it measures each rendered node. A list that keeps the first labels and drops “Enddatum, optional” is rejected. Painting the Enddatum label with the form background drops that label below 4.5:1 while “Ort oder Aktivität” stays readable; clearing the paint restores the form. The pale-panel counterexample, one saved note, reload, edit, and browser Back remain.

The same audit found the helper and edit-preview sentences at 4.06:1 on white below the `sm` breakpoint, because they used `text-ink-700` outside the pale panel. Those sentences now use `text-ink-900`. That is the only production change in this correction. Green still remaps that token to the light ink on the dark editor panel.

## R6 presentation

Reviewed candidate `941ee51c4f97e978715add3f5a2fe2e69248e0e0`. Same session `bc-4904589f-a8f0-4106-a65a-507bc53e084a`, read-back name `Jetnity UX V1 Route Design Alignment 1 — Cursor Generation 1`, `originalModelName` `grok-4.7-high-fast`. Mode NORMAL. Main still `ac2199dba64e458a20a155b5d1bb826ea99949d3`.

The green Planpunkt form used `sm:bg-surface-50`, which the green remap did not cover, while the heading and labels were already light. Removing `data-planpunkt-editor` in the mounted shell at 768px reproduces that pale panel with light text and contrast below 4.5:1. With the hook, the real create and edit forms keep a dark panel and light text. The selected day, visit and connection in green use a citrus fill plus a dark bar, not only `aria-current` or `aria-pressed`.

The mounted guest test saved one synthetic note, reloaded it, edited it, reloaded again, and returned to that day with the browser Back control. Still one plan item. Light theme contrast stayed at least 4.5:1. Root 32px is root font size, not browser zoom. This is a local synthetic shell run, not a new hosted account pass. The Owner's guest draft was not touched.

## Integration

Amendment 3 at `9f2c5c60dcfa2288cab3447d21f5cf840d6fa7d6` was already on the branch. Pinned main `ac2199dba64e458a20a155b5d1bb826ea99949d3` was merged without force. After the fetch on 30 October 2026 the same main was still the tip, so this branch is 0 behind it. The runtime integration commit is `621897aafb5c95b66edf6be26912e4069e1ce028`, tree `408f5aa3cd50a6c5d06743e8e30f92926a1b48e3`. The review head is the later status commit on this branch.

Amendment 3 at `9f2c5c60dcfa2288cab3447d21f5cf840d6fa7d6` was already on the branch. Pinned main `ac2199dba64e458a20a155b5d1bb826ea99949d3` was merged without force. After the fetch on 30 October 2026 the same main was still the tip, so this branch is 0 behind it. The runtime integration commit is `621897aafb5c95b66edf6be26912e4069e1ce028`, tree `408f5aa3cd50a6c5d06743e8e30f92926a1b48e3`. The review head is the later status commit on this branch.

The released `WorkspaceShell` early return now renders the existing `reiseoptionen` disclosure after the visible storage line. The legacy dark header still renders the same slot. Guest discard and account deletion keep their original confirmations and handlers. Inside `.workspace-page`, Back-to-top does not set its own `bottom`; `workspace.css` remains the only spacing owner. Evidence images use `U1C_EVIDENCE_DIR` or the OS temp directory.

## Session

- URL: https://cursor.com/agents/bc-4904589f-a8f0-4106-a65a-507bc53e084a
- `bcId`: `bc-4904589f-a8f0-4106-a65a-507bc53e084a`
- Read-back name: `Jetnity UX V1 Route Design Alignment 1 — Cursor Generation 1`
- `originalModelName`: `grok-4.7-high-fast`

## Checks for this integration

- Route unit tests, including the portable spacing decision and schema-valid fixtures: pass.
- Evidence browser test: pass. Screenshots were written under the OS temp directory in this session, not a hard-coded `/opt/cursor/artifacts` path.
- Mounted real `WorkspaceShell` plus `TripWorkspace`: pass. Light and green, 320/390/768/1440, root 32px labeled as root text, 22 day ids, six item kinds plus an undated note, connection history, and 390px Enter focus on Zur Route. No fetch/XHR.
- Guest “Entwurf verwerfen” and account “Reise löschen” were reached by keyboard and touch in the shell and in the legacy header. Cancellation did not remove the draft or call the delete action. One confirmation removed the synthetic guest key once. One account confirmation called the original action once and showed “Diese Reise ist unbekannt.” because the synthetic id is not a UUID, so no account row was written.
- `tsc --noEmit`: pass. Production build: pass. Hygiene checks `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`, and `check:operating-mode`: pass. Lint on the owned route files: 0 errors. `TripWorkspace.tsx` still has the pre-existing effect warnings that came in with main.

Native CI and Preview belong to the pushed head and are not yet a gate. Old CI `40763600238` and Preview `dpl_2eHpicMQDAyxQbmoKbq7mit8x89m` gated `f2ff4928` only. Hosted account acceptance remains blocked under #968. This local run is a synthetic shell harness, not the hosted product path, not true browser zoom, not a physical device, and not VoiceOver.

## Historical R1–R5 record

28 October 2026. The correction below was reviewed at `f2ff4928c551125b250706793195ee849fce0ce6` and is preserved. It does not gate this integration.

## Review taken over

Comment https://github.com/Jetnity/jetnity/pull/1082#issuecomment-6478861951 on `b21d0c1bb8607d585c9770884380a54ac84b5e0c`. Five corrections:

1. R1 — geometry test still demanded 22 simultaneous day buttons.
2. R2 — unknown connection state was shown as no saved connection.
3. R3 — accessible day names dropped the visible day title.
4. R4 — “Kante / Zieleappe” and visitor-facing “Kennung”.
5. R5 — real TripWorkspace coverage for connections, history, repeats, invalidation and narrow keyboard focus.

Amendment 2 was committed before these runtime edits: `73d372de26dde2f730d324c0a9eeb06adeb7afe7`.

## Session at that correction

- URL: https://cursor.com/agents/bc-4904589f-a8f0-4106-a65a-507bc53e084a
- `bcId`: `bc-4904589f-a8f0-4106-a65a-507bc53e084a`
- Read-back name: `Jetnity UX V1 Route Design Alignment 1 — Cursor Generation 1`
- `originalModelName`: `grok-4.7-high-fast`

## Git at that correction

| Fact | Value |
| --- | --- |
| Reviewed head | `b21d0c1bb8607d585c9770884380a54ac84b5e0c` |
| `origin/main` then | `8fc72a18390af1650d6902fb2a20a64e4f7f8ccc` |
| Correction head | `f2ff4928c551125b250706793195ee849fce0ce6` |

## Checks for that correction

- Route unit tests, including unknown versus open connection copy: pass.
- Full `lib/trips/ux-u1a2-geometry-1.test.ts`: pass on 28 October. It was not re-run as a separate suite for the 30 October integration.
- Mounted real TripWorkspace contract test: pass, now inside `WorkspaceShell`.
- `tsc --noEmit`: pass.

Native CI and Preview for `f2ff4928` do not gate the integrated head.

## Still outside

#1067, #1068, F01, provider gates, and the 44-day duration triage. No Ready, merge, deploy, or follow-up.
