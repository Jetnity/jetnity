# U1-C TASK V1 — Technical Lead amendment 2

28 October 2026, Europe/Zurich. PR #1082, tracking #1081. This adds to immutable TASK V1 and amendment 1. It does not rewrite them. The original Work references stay unchanged.

## Review receipt

Independent review comment https://github.com/Jetnity/jetnity/pull/1082#issuecomment-6478861951 on frozen head `b21d0c1bb8607d585c9770884380a54ac84b5e0c`, tree `dd694bc182896c8a05ffc22dc97ade6c83c777e5`. Main re-read by the reviewer as `8fc72a18390af1650d6902fb2a20a64e4f7f8ccc`. Verdict: **CHANGES REQUIRED**. Not FINAL PASS.

Same session only: `bc-4904589f-a8f0-4106-a65a-507bc53e084a`, logical name **Jetnity UX V1 Route Design Alignment 1 — Cursor Generation 1**. No second agent or pull request.

## Five corrections taken over

1. **R1.** Native App CI fails because `lib/trips/ux-u1a2-geometry-1.test.ts` still expects 22 day buttons at once. Retarget that test to one row per chronological run and proof that all 22 day ids remain reachable. Keep sticky containment, long scroll, one nav, focus/history and no-provider checks. Do not only replace 22 with 1. The long scroll fixture is the note on day 1.
2. **R2.** Unknown connection state must not be shown as “no saved connection”. Keep open, unknown, selected and booked distinct. Unknown means assignment is unclear. Do not promote a candidate to a confirmed match. Do not change canonical mobility matching.
3. **R3.** A dated day button must keep both the visible day title and the date in its accessible name.
4. **R4.** Replace the “Kante / Zieleappe” sentence and visitor-facing “Kennung” wording. Keep uncertainty, and keep user booking separate from provider confirmation.
5. **R5.** Mount the real TripWorkspace for connection selection, history, repeated names, ambiguous stage ids, unknown/outbound/return values, removal, and narrow keyboard focus into a visible detail or return target. Do not claim a screen-reader pass from DOM inspection.

## Allowlist added by this review

- `lib/trips/ux-u1a2-geometry-1.test.ts` for R1 only.
- This amendment document.

Already approved task-owned helpers, components, harnesses and tests remain available for R2–R5. Any further shared path must be named before it is edited. Canonical mobility and N12 readers stay read-only.

The local DejaVu/safe-area timeout is not established as a product regression and is not a license to weaken that assertion. Diagnose and report it.

No Ready, merge, manual deployment, #1068, provider, Auth, DB or config change. No lifting of STOP, HOLD or Product Owner gates.
