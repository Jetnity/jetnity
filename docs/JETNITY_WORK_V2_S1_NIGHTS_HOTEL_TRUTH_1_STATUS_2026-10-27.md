# V2-S1 Nights and Hotel Truth 1 — STATUS

Date 27 October 2026. Draft PR #1052. Branch `fix/v2-s1-overnight-hotel-truth-1`.
Writer: Jetnity V2 Nights and Hotel Truth 1 — Cursor Generation 1.
Session `bc-eafe2d65-2a92-47d4-b18e-d73539d11eca`. Model `grok-4.7-high-fast` from `run-info.originalModelName`.

## State

Implementation of the accepted F02/F03 scope is on the branch. This file is docs-only on top of product head `d37d8b0ede50568ccdbf8e3a7e49b149fc80a7f2`, tree `59ab176a4b91a2968c88b834be267f0e93495ec5`. At that head the branch was 3 ahead / 0 behind `origin/main` `d31a16afdac5e97d4b02f4cb5824f5adc290577c`. The following docs commit does not change product behavior. Not Ready. Not merged. No follow-up slice started.

## What changed

- A known trip calendar stays in the overnight denominator. Nights inside that calendar and outside every complete stage are visible with `stageId: null`. They are not assigned to the neighbouring stage and are not titled as a required hotel night.
- A 12-day trip (`2026-10-01`–`2026-10-12`) with stages 3+5+4 days reports 11 overnight intervals and 2 transition nights. A 7-day span stays 6 intervals. Overlapping stages count once. A booked stay still covers only its own dates.
- Multi-stage trips with a missing stage date stay `bekannt: false` and do not emit a definitive gap list. Lodging audit coverage is `partial` for transition nights and for that incomplete stage case.
- More than one stage gets a hotel period only from that stage’s own bounds. Otherwise the UI says „Hotelzeitraum für diesen Ort noch offen“ and does not show trip dates or a search result. One stage still uses the trip dates when it has none.
- Century-scale holes outside the trip calendar are still not turned into one gap.

## Evidence on this machine

- Focused lodging, audit, hotel, preview, and mounted markup tests passed, including `lib/trips/nights-hotel-truth-1.test.ts`.
- `npm test`: 7378 tests, 7362 pass, 11 fail, 5 skip. All 11 failures are disposable PostgreSQL 16 proofs (`initdb` ENOENT, `NOT_VERIFIED`, or `local_proof_connection_override_forbidden`). No lodging, hotel, or audit failure. This environment has no local PostgreSQL server binaries. Those proofs were not replaced with a hosted database.
- `npx tsc -p tsconfig.json --noEmit` exit 0.
- `npm run build` exit 0.
- ESLint on the owned files: the remaining `set-state-in-effect` warning in `HotelBereich.tsx` is the same `setLaeuft(true)` warning already present on main. No new warning was left in the open-period path.
- No browser, private account, CUA, provider call, or viewport pass at 320/390/768 or 200% host font. The open-period and transition copy uses `break-words` and does not add `whitespace-nowrap`. That is not a layout acceptance.
- CI and the new-head Vercel Preview were not claimed. The earlier seed Preview does not cover `d37d8b0e`.

## Not touched

Flight and mobility audit sections, #1043 activity files, S0/S2/S3 sources, CI, SQL, Auth, RLS, indexing, and `docs/ACTIVE_WORK_STATUS.md`. #751 was read and not edited.
