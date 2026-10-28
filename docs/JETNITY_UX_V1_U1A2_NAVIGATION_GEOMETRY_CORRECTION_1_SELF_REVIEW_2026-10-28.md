# UX V1 U1-A2 — SELF-REVIEW

28 October 2026. Author review only. This is not a Technical Lead PASS.

## Checked

- Operating mode is `NORMAL`. This slice is the dispatched UX correction, not a new product lane.
- The sticky failure is the short parent. The nav's parent is now the column that also contains the plan. Measured parent height is about 4036px at 1440 and 5292px at 768. The action wrapper is 72px. At scroll 450/650/900 the nav border top is 72, directly under the 72px header. Computed position stays `sticky`, not `fixed`.
- A static copy of the old short parent (height 138) has a negative nav top at scroll 650.
- 390 and 430: one row, four buttons, equal width 96.8px / 106.8px, height 44, font 14px, bar height 53px, scroll padding offset 53px.
- 360 does not fit „Vorbereitung“ (~93px) inside an equal cell (~89px). It uses relative flow, full labels, no 3+1 wrap.
- 280, 320, root 32 (28px text), and a visual-viewport keyboard stand-in stay `relative` and leave the viewport on scroll.
- History back returns to `ansicht=plan`. Keyboard Enter focuses the Organisieren heading. One nav. Search fields stay 0. Provider URL list is empty.
- `lib/trips/guest-nav-text-1.test.ts` was not edited. Its mounted run passed, including 14px / 28px labels.
- Parallel #1077 was still task-seed only at the start. This slice did not write its files.

## Limits I will not call a pass

- No `tsc` or eslint binary was installed in this environment, so those gates are not locally proven.
- No GitHub App/Auth CI result and no Vercel Preview exist for the final head yet.
- Desktop browser zoom 200% was not set. CDP scale was not used as a substitute.
- The header in the harness is a 72px stand-in. The production `PublicNavbar` can grow past 72px; this slice does not change it, and the existing 72px sticky offset remains.
- Safe-area inset was 0 in headless Chromium. The class is still present.
- No physical device, OS keyboard, or VoiceOver.
